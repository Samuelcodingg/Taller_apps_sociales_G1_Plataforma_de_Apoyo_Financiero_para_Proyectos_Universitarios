"""Entrypoint de AWS Lambda: consumidor SQS de documentos KYC.

Raíz de composición: instancia los adaptadores, los inyecta en el caso de uso
y procesa cada Record del evento SQS. Usa reporte parcial de fallos
(`batchItemFailures`) para que solo los mensajes problemáticos se reintenten.
"""
from __future__ import annotations

import json
import logging
import os
from functools import lru_cache
from typing import Any

from dotenv import load_dotenv

from src.feature.VerificationAnalytics.application.dtos import ProcessKycCommand
from src.feature.VerificationAnalytics.application.process_kyc_usecase import (
    ProcessKycUseCase,
)
from src.feature.VerificationAnalytics.infrastructure.adapters.gemini_ai_service import (
    GeminiAIService,
)
from src.feature.VerificationAnalytics.infrastructure.adapters.http_document_downloader import (
    HttpDocumentDownloader,
)
from src.feature.VerificationAnalytics.infrastructure.adapters.mariadb_repository import (
    MariaDBVerificationRepository,
)

load_dotenv()

logging.basicConfig(level=os.getenv("LOG_LEVEL", "INFO"))
logger = logging.getLogger(__name__)


@lru_cache(maxsize=1)
def _build_usecase() -> ProcessKycUseCase:
    """Construye el caso de uso una sola vez por contenedor Lambda (cacheado)."""
    database_url = os.environ["DATABASE_URL"]
    gemini_api_key = os.environ["GEMINI_API_KEY"]

    repository = MariaDBVerificationRepository(database_url)
    downloader = HttpDocumentDownloader()
    llm_service = GeminiAIService(gemini_api_key)

    return ProcessKycUseCase(
        repository=repository,
        downloader=downloader,
        llm_service=llm_service,
    )


def handler(event: dict[str, Any], context: Any = None) -> dict[str, Any]:
    """Punto de entrada invocado por AWS Lambda con un evento SQS."""
    records = event.get("Records", [])
    logger.info("Recibidos %d mensajes SQS", len(records))

    usecase = _build_usecase()
    batch_item_failures: list[dict[str, str]] = []

    for record in records:
        message_id = record.get("messageId", "unknown")
        try:
            body = json.loads(record["body"])
            command = ProcessKycCommand.from_message(body)
            usecase.execute(command)
        except Exception:  # noqa: BLE001 - aislar fallo por mensaje
            # Un fallo aquí significa que ni siquiera pudimos registrar el rechazo
            # (p. ej. BD caída) o que el mensaje está malformado. Lo marcamos para
            # reintento de SQS.
            logger.exception("Fallo procesando mensaje SQS messageId=%s", message_id)
            batch_item_failures.append({"itemIdentifier": message_id})

    return {"batchItemFailures": batch_item_failures}
