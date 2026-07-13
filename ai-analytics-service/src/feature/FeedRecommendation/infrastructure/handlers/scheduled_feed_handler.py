"""Entrypoint de AWS Lambda: regeneración del feed personalizado.

Raíz de composición: instancia los adaptadores, los inyecta en los casos de uso
y los ejecuta.

Atiende dos formas de invocación:
- programada (EventBridge): regenera el feed de todos los donantes;
- dirigida (invoke manual con `{"accountId": "..."}`): regenera solo ese donante,
  útil para probar y para forzar un refresco puntual.
"""
from __future__ import annotations

import logging
import os
from functools import lru_cache
from typing import Any

from dotenv import load_dotenv

from src.feature.FeedRecommendation.application.dtos import (
    DEFAULT_CANDIDATE_LIMIT,
    DEFAULT_TOP_N,
    GenerateFeedCommand,
)
from src.feature.FeedRecommendation.application.generate_feed_usecase import (
    GenerateFeedUseCase,
)
from src.feature.FeedRecommendation.application.refresh_all_feeds_usecase import (
    RefreshAllFeedsUseCase,
)
from src.feature.FeedRecommendation.infrastructure.adapters.gemini_recommender_service import (
    GeminiRecommenderService,
)
from src.feature.FeedRecommendation.infrastructure.adapters.mariadb_feed_repository import (
    MariaDBFeedRepository,
)

load_dotenv()

logging.basicConfig(level=os.getenv("LOG_LEVEL", "INFO"))
logger = logging.getLogger(__name__)


@lru_cache(maxsize=1)
def _build_usecases() -> tuple[GenerateFeedUseCase, RefreshAllFeedsUseCase]:
    """Construye los casos de uso una sola vez por contenedor Lambda (cacheado)."""
    database_url = os.environ["DATABASE_URL"]
    gemini_api_key = os.environ["GEMINI_API_KEY"]

    gemini_model = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")

    repository = MariaDBFeedRepository(database_url)
    recommender = GeminiRecommenderService(gemini_api_key, model_name=gemini_model)

    generate_feed = GenerateFeedUseCase(repository=repository, recommender=recommender)
    refresh_all = RefreshAllFeedsUseCase(
        repository=repository,
        generate_feed=generate_feed,
    )
    return generate_feed, refresh_all


def _int_env(name: str, default: int) -> int:
    raw = os.getenv(name)
    return int(raw) if raw else default


def handler(event: dict[str, Any], context: Any = None) -> dict[str, Any]:
    """Punto de entrada invocado por AWS Lambda."""
    event = event or {}
    generate_feed, refresh_all = _build_usecases()

    top_n = _int_env("FEED_TOP_N", DEFAULT_TOP_N)
    candidate_limit = _int_env("FEED_CANDIDATE_LIMIT", DEFAULT_CANDIDATE_LIMIT)

    # Invocación dirigida a un solo donante.
    if event.get("accountId") or event.get("account_id"):
        command = GenerateFeedCommand.from_event(
            {"topN": top_n, "candidateLimit": candidate_limit, **event}
        )
        result = generate_feed.execute(command)
        return {
            "accountId": result.account_id,
            "recommended": result.recommended,
            "skippedReason": result.skipped_reason,
        }

    # Invocación programada: lote completo.
    logger.info("Regeneración programada del feed personalizado")
    summary = refresh_all.execute(top_n=top_n, candidate_limit=candidate_limit)
    return summary.to_dict()
