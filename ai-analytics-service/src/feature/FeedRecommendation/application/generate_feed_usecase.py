"""Caso de uso: regenerar el feed personalizado de un donante con el LLM.

Lógica de orquestación pura. Depende únicamente de los puertos del dominio
(inyectados por constructor). No conoce AWS, MySQL ni Gemini.
"""
from __future__ import annotations

import logging

from src.feature.FeedRecommendation.application.dtos import (
    GenerateFeedCommand,
    GenerateFeedResult,
)
from src.feature.FeedRecommendation.domain.ports import (
    IFeedRepository,
    IRecommenderService,
)

logger = logging.getLogger(__name__)


class GenerateFeedUseCase:
    """Perfila al donante, deja que el LLM rankee las campañas y persiste el top."""

    def __init__(
        self,
        repository: IFeedRepository,
        recommender: IRecommenderService,
    ) -> None:
        self._repository = repository
        self._recommender = recommender

    def execute(self, command: GenerateFeedCommand) -> GenerateFeedResult:
        """Ejecuta el flujo completo para un donante.

        Se salta (sin error) a los donantes sin señales o sin campañas
        candidatas: en ambos casos el servicio de campañas ya cae a su feed por
        popularidad, y llamar al LLM sería gastar una llamada para adivinar.

        Cualquier otro fallo se propaga: el feed anterior del donante queda
        intacto y el lote lo contabiliza como fallido.
        """
        account_id = command.account_id

        profile = self._repository.get_donor_profile(account_id)
        if not profile.has_signals():
            logger.info("Donante id=%s sin señales; se omite (cold start)", account_id)
            return GenerateFeedResult(account_id, skipped_reason="sin señales")

        candidates = self._repository.list_candidates(account_id, command.candidate_limit)
        if not candidates:
            logger.info("Donante id=%s sin campañas candidatas; se omite", account_id)
            return GenerateFeedResult(account_id, skipped_reason="sin candidatas")

        recommendations = self._recommender.rank(profile, candidates, command.top_n)
        if not recommendations:
            logger.warning(
                "El LLM no devolvió recomendaciones para el donante id=%s; "
                "se conserva el feed anterior",
                account_id,
            )
            return GenerateFeedResult(account_id, skipped_reason="ranking vacío")

        self._repository.replace_recommendations(account_id, recommendations)
        logger.info(
            "Feed del donante id=%s regenerado con %d recomendaciones",
            account_id,
            len(recommendations),
        )
        return GenerateFeedResult(account_id, recommended=len(recommendations))
