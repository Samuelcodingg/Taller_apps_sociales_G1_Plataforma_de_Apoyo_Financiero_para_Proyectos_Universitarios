"""Caso de uso: regenerar el feed de todos los donantes (lote programado).

Orquesta GenerateFeedUseCase sobre cada donante. Aísla los fallos por donante:
que el LLM falle con uno no debe dejar sin feed a los demás.
"""
from __future__ import annotations

import logging

from src.feature.FeedRecommendation.application.dtos import (
    DEFAULT_CANDIDATE_LIMIT,
    DEFAULT_TOP_N,
    GenerateFeedCommand,
    RefreshAllFeedsResult,
)
from src.feature.FeedRecommendation.application.generate_feed_usecase import (
    GenerateFeedUseCase,
)
from src.feature.FeedRecommendation.domain.ports import IFeedRepository

logger = logging.getLogger(__name__)


class RefreshAllFeedsUseCase:
    """Recorre a los donantes y regenera el feed de cada uno."""

    def __init__(
        self,
        repository: IFeedRepository,
        generate_feed: GenerateFeedUseCase,
    ) -> None:
        self._repository = repository
        self._generate_feed = generate_feed

    def execute(
        self,
        *,
        top_n: int = DEFAULT_TOP_N,
        candidate_limit: int = DEFAULT_CANDIDATE_LIMIT,
    ) -> RefreshAllFeedsResult:
        donor_ids = self._repository.list_donor_ids()
        logger.info("Regenerando el feed de %d donantes", len(donor_ids))

        processed = skipped = failed = 0

        for account_id in donor_ids:
            command = GenerateFeedCommand(
                account_id=account_id,
                top_n=top_n,
                candidate_limit=candidate_limit,
            )
            try:
                result = self._generate_feed.execute(command)
            except Exception:  # noqa: BLE001 - aislar el fallo por donante
                # El feed anterior de este donante sigue en pie; seguimos con el resto.
                logger.exception("Fallo regenerando el feed del donante id=%s", account_id)
                failed += 1
                continue

            if result.was_skipped:
                skipped += 1
            else:
                processed += 1

        summary = RefreshAllFeedsResult(processed=processed, skipped=skipped, failed=failed)
        logger.info("Lote terminado: %s", summary.to_dict())
        return summary
