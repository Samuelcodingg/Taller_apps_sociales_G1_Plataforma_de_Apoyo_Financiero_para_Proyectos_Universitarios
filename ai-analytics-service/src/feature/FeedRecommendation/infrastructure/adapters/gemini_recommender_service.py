"""Adaptador de IA con Google Gemini (implementa IRecommenderService).

Le entrega al LLM el perfil del donante y la lista de campañas candidatas, y le
pide un ranking por afinidad. A diferencia de un scoring con pesos escritos a
mano, el LLM juzga la relación semántica entre lo que el donante ha apoyado y
lo que cada campaña propone.
"""
from __future__ import annotations

import json
import logging
import re

import google.generativeai as genai

from src.feature.FeedRecommendation.domain.entities import (
    CandidateCampaign,
    DonorProfile,
    Recommendation,
)
from src.feature.FeedRecommendation.domain.ports import IRecommenderService

logger = logging.getLogger(__name__)

_RANKING_PROMPT = (
    "Eres el motor de recomendación de una plataforma de crowdfunding para "
    "proyectos universitarios. Tu tarea es rankear campañas segun su afinidad "
    "con un donante concreto.\n\n"
    "Recibirás el PERFIL del donante (su universidad, su carrera, las categorías "
    "que le interesan y las campañas que ya apoyó o visitó) y una lista de "
    "CANDIDATAS, cada una con un 'indice' numérico.\n\n"
    "Criterios, de mayor a menor peso:\n"
    "1. Afinidad temática real entre la campaña y lo que el donante ya apoyó. "
    "Vale más una conexión de fondo (mismo problema, misma disciplina) que "
    "compartir una etiqueta de categoría.\n"
    "2. Cercanía institucional: campañas de su misma universidad.\n"
    "3. Coherencia con su carrera.\n"
    "4. Como desempate, campañas con avance intermedio y días restantes: son las "
    "que más se benefician de un aporte.\n\n"
    "Reglas:\n"
    "- Devuelve como máximo {top_n} campañas, solo las que tengan afinidad real. "
    "Si menos candidatas la tienen, devuelve menos: no rellenes.\n"
    "- 'score' es un número entre 0.0 y 1.0 que refleja la fuerza de la afinidad.\n"
    "- 'motivo' es UNA frase corta, en español, dirigida al donante.\n"
    "- Usa solo índices que existan en CANDIDATAS. No inventes campañas.\n\n"
    "Responde ÚNICAMENTE con un array JSON válido, sin texto adicional, sin "
    "explicaciones y sin bloques de código markdown. Cada elemento debe tener "
    "EXACTAMENTE estas tres llaves:\n"
    "[\n"
    '  {{"indice": 0, "score": 0.93, "motivo": "..."}}\n'
    "]\n\n"
    "PERFIL DEL DONANTE:\n{profile}\n\n"
    "CANDIDATAS:\n{candidates}"
)


class GeminiRecommenderService(IRecommenderService):
    """Rankea campañas para un donante usando Gemini."""

    def __init__(self, api_key: str, *, model_name: str = "gemini-2.5-flash") -> None:
        if not api_key:
            raise ValueError("GEMINI_API_KEY es requerida para GeminiRecommenderService")
        genai.configure(api_key=api_key)
        self._model = genai.GenerativeModel(model_name)

    def rank(
        self,
        profile: DonorProfile,
        candidates: list[CandidateCampaign],
        top_n: int,
    ) -> list[Recommendation]:
        if not candidates:
            return []

        prompt = _RANKING_PROMPT.format(
            top_n=top_n,
            profile=json.dumps(profile.to_prompt_dict(), ensure_ascii=False, indent=2),
            candidates=json.dumps(
                [c.to_prompt_dict(i) for i, c in enumerate(candidates)],
                ensure_ascii=False,
                indent=2,
            ),
        )

        response = self._model.generate_content(
            prompt,
            generation_config={
                "response_mime_type": "application/json",
                "temperature": 0.0,
            },
        )

        raw_text = (response.text or "").strip()
        if not raw_text:
            raise ValueError("Gemini devolvió una respuesta vacía")

        payload = self._parse_json_array(raw_text)
        return self._to_recommendations(payload, candidates, top_n)

    @staticmethod
    def _parse_json_array(raw_text: str) -> list[dict[str, object]]:
        """Parsea el array JSON tolerando vallas de código markdown si aparecieran."""
        try:
            parsed = json.loads(raw_text)
        except json.JSONDecodeError:
            match = re.search(r"\[.*\]", raw_text, re.DOTALL)
            if not match:
                raise ValueError(
                    f"Gemini no devolvió un JSON parseable: {raw_text[:200]!r}"
                )
            parsed = json.loads(match.group(0))

        if not isinstance(parsed, list):
            raise ValueError(f"Se esperaba un array JSON, llegó {type(parsed).__name__}")
        return parsed

    @staticmethod
    def _to_recommendations(
        payload: list[dict[str, object]],
        candidates: list[CandidateCampaign],
        top_n: int,
    ) -> list[Recommendation]:
        """Traduce los índices del LLM a campañas reales.

        Descarta en silencio los elementos malformados o con índices fuera de
        rango: un ranking parcial es preferible a no recomendar nada, y el LLM
        puede alucinar un índice aunque el prompt se lo prohíba.
        """
        recommendations: list[Recommendation] = []
        seen: set[str] = set()

        for item in payload:
            if not isinstance(item, dict):
                continue
            try:
                index = int(item["indice"])
                score = float(item["score"])
            except (KeyError, TypeError, ValueError):
                logger.warning("Elemento del ranking malformado, se descarta: %r", item)
                continue

            if not 0 <= index < len(candidates):
                logger.warning("El LLM devolvió un índice fuera de rango: %r", index)
                continue

            campaign = candidates[index]
            if campaign.campaign_id in seen:
                continue
            seen.add(campaign.campaign_id)

            recommendations.append(
                Recommendation(
                    campaign_id=campaign.campaign_id,
                    score=score,
                    reason=str(item.get("motivo", "") or "").strip(),
                )
            )

        # El LLM suele devolverlas ya ordenadas, pero no es un contrato.
        recommendations.sort(key=lambda r: r.score, reverse=True)
        return recommendations[:top_n]
