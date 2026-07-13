"""Entidades y objetos de valor del dominio FeedRecommendation.

Esta capa no depende de frameworks, base de datos ni servicios externos.
Solo modela los conceptos del negocio.
"""
from __future__ import annotations

from dataclasses import dataclass, field
from typing import Optional

# El score se persiste en user_recommendation.score, que es DECIMAL(5,4).
# Por eso el dominio obliga a que viva en el rango [0, 1].
MIN_SCORE = 0.0
MAX_SCORE = 1.0


@dataclass(frozen=True)
class DonorProfile:
    """Señales conocidas de un donante, usadas para personalizar su feed.

    Es la "consulta" que se le hace al recomendador: quién es el usuario y qué
    ha hecho hasta ahora.
    """

    account_id: str
    university: str = ""
    career: str = ""
    # Categorías con las que ya interactuó, de más a menos frecuente.
    top_categories: list[str] = field(default_factory=list)
    # Títulos de campañas a las que donó (la señal más fuerte de interés).
    donated_titles: list[str] = field(default_factory=list)
    # Títulos de campañas que vio o compartió (señal más débil).
    engaged_titles: list[str] = field(default_factory=list)

    def has_signals(self) -> bool:
        """Indica si hay suficiente información para personalizar.

        Sin ninguna señal, recomendar con un LLM es adivinar: es preferible
        dejar que el servicio de campañas caiga a su feed por popularidad.
        """
        return bool(
            self.university
            or self.career
            or self.top_categories
            or self.donated_titles
            or self.engaged_titles
        )

    def to_prompt_dict(self) -> dict[str, object]:
        """Proyecta el perfil a la forma que se le entrega al LLM."""
        return {
            "universidad": self.university,
            "carrera": self.career,
            "categorias_de_interes": self.top_categories,
            "campanas_que_apoyo": self.donated_titles,
            "campanas_que_vio_o_compartio": self.engaged_titles,
        }


@dataclass(frozen=True)
class CandidateCampaign:
    """Una campaña activa que podría recomendarse a un donante."""

    campaign_id: str
    title: str
    description: str
    categories: list[str] = field(default_factory=list)
    creator_university: str = ""
    goal_amount: float = 0.0
    current_amount: float = 0.0
    days_left: Optional[int] = None

    def progress_pct(self) -> int:
        """Porcentaje de la meta ya recaudado (0-100), acotado."""
        if self.goal_amount <= 0:
            return 0
        return min(100, int(self.current_amount / self.goal_amount * 100))

    def to_prompt_dict(self, index: int, *, description_chars: int = 300) -> dict[str, object]:
        """Proyecta la campaña para el prompt.

        Se referencia por `index` y no por UUID: pedirle al LLM que copie un
        UUID de 36 caracteres es una fuente de errores innecesaria. El índice
        se traduce de vuelta al id real en el adaptador.

        La descripción se recorta porque el prompt crece con cada candidata y
        los primeros párrafos ya bastan para juzgar la afinidad temática.
        """
        description = self.description.strip()
        if len(description) > description_chars:
            description = description[:description_chars].rstrip() + "..."

        return {
            "indice": index,
            "titulo": self.title,
            "descripcion": description,
            "categorias": self.categories,
            "universidad_del_creador": self.creator_university,
            "avance_pct": self.progress_pct(),
            "dias_restantes": self.days_left,
        }


@dataclass(frozen=True)
class Recommendation:
    """Una campaña recomendada a un donante, con su score y su justificación."""

    campaign_id: str
    score: float
    reason: str = ""

    def __post_init__(self) -> None:
        # `frozen=True` obliga a usar object.__setattr__ para normalizar.
        clamped = max(MIN_SCORE, min(MAX_SCORE, float(self.score)))
        object.__setattr__(self, "score", round(clamped, 4))
