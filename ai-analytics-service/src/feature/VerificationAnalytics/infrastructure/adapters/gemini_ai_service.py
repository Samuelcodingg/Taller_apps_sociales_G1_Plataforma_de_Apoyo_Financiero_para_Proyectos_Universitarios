"""Adaptador de IA con Google Gemini (implementa ILLMService)."""
from __future__ import annotations

import json
import logging
import re

import google.generativeai as genai

from src.feature.VerificationAnalytics.domain.entities import ExtractedData
from src.feature.VerificationAnalytics.domain.ports import ILLMService

logger = logging.getLogger(__name__)

_EXTRACTION_PROMPT = (
    "Eres un sistema de verificación KYC para una plataforma universitaria. "
    "Analiza el documento adjunto (constancia/credencial estudiantil) y extrae "
    "los datos del estudiante.\n\n"
    "Responde ÚNICAMENTE con un objeto JSON válido, sin texto adicional, sin "
    "explicaciones y sin bloques de código markdown. El JSON debe tener "
    "EXACTAMENTE estas cuatro llaves:\n"
    "{\n"
    '  "nombres": "...",\n'
    '  "apellidos": "...",\n'
    '  "universidad": "...",\n'
    '  "codigo_estudiante": "..."\n'
    "}\n\n"
    "Si algún dato no aparece en el documento, usa una cadena vacía para esa llave. "
    "No inventes información."
)


class GeminiAIService(ILLMService):
    """Extrae datos KYC estructurados usando Gemini."""

    def __init__(self, api_key: str, *, model_name: str = "gemini-2.5-flash") -> None:
        if not api_key:
            raise ValueError("GEMINI_API_KEY es requerida para GeminiAIService")
        genai.configure(api_key=api_key)
        self._model = genai.GenerativeModel(model_name)

    def extract_kyc_data(
        self, file_bytes: bytes, mime_type: str = "application/pdf"
    ) -> ExtractedData:
        if not file_bytes:
            raise ValueError("El documento está vacío; no hay nada que analizar")

        response = self._model.generate_content(
            [
                {"mime_type": mime_type, "data": file_bytes},
                _EXTRACTION_PROMPT,
            ],
            generation_config={
                "response_mime_type": "application/json",
                "temperature": 0.0,
            },
        )

        raw_text = (response.text or "").strip()
        if not raw_text:
            raise ValueError("Gemini devolvió una respuesta vacía")

        payload = self._parse_json(raw_text)
        return ExtractedData.from_dict(payload)

    @staticmethod
    def _parse_json(raw_text: str) -> dict[str, object]:
        """Parsea el JSON tolerando vallas de código markdown si aparecieran."""
        try:
            return json.loads(raw_text)
        except json.JSONDecodeError:
            match = re.search(r"\{.*\}", raw_text, re.DOTALL)
            if not match:
                raise ValueError(
                    f"Gemini no devolvió un JSON parseable: {raw_text[:200]!r}"
                )
            return json.loads(match.group(0))
