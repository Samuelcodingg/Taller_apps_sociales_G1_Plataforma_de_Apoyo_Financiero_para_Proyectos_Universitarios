"""Caso de uso: procesar una verificación KYC.

Lógica de orquestación pura. Depende únicamente de los puertos del dominio
(inyectados por constructor). No conoce AWS, requests, Prisma ni Gemini.
"""
from __future__ import annotations

import logging

from src.feature.VerificationAnalytics.application.dtos import (
    ProcessKycCommand,
    ProcessKycResult,
)
from src.feature.VerificationAnalytics.domain.ports import (
    IDocumentDownloader,
    ILLMService,
    IVerificationRepository,
)

logger = logging.getLogger(__name__)

REVIEWER = "GEMINI_AI"


class ProcessKycUseCase:
    """Orquesta la descarga del documento, la extracción IA y la persistencia."""

    def __init__(
        self,
        repository: IVerificationRepository,
        downloader: IDocumentDownloader,
        llm_service: ILLMService,
    ) -> None:
        self._repository = repository
        self._downloader = downloader
        self._llm_service = llm_service

    def execute(self, command: ProcessKycCommand) -> ProcessKycResult:
        """Ejecuta el flujo completo de verificación.

        Si todo va bien, aprueba la verificación. Si cualquier paso falla,
        captura el error y rechaza la verificación guardando el motivo.
        Solo re-lanza si no se pudo siquiera persistir el rechazo (para
        que SQS reintente).
        """
        verification_id = command.verification_id
        logger.info("Procesando verificación KYC id=%s", verification_id)

        try:
            file_bytes = self._downloader.download(command.document_url)
            logger.info(
                "Documento descargado (%d bytes) para verificación id=%s",
                len(file_bytes),
                verification_id,
            )

            extracted = self._llm_service.extract_kyc_data(file_bytes)

            if not extracted.is_complete():
                raise ValueError(
                    "Gemini no logró extraer todos los campos requeridos: "
                    f"{extracted.to_dict()}"
                )

            self._repository.approve(verification_id, extracted, REVIEWER)
            logger.info("Verificación id=%s APROBADA", verification_id)
            return ProcessKycResult(verification_id=verification_id, approved=True)

        except Exception as exc:  # noqa: BLE001 - frontera del caso de uso
            reason = f"{type(exc).__name__}: {exc}"
            logger.warning(
                "Verificación id=%s RECHAZADA por error: %s",
                verification_id,
                reason,
            )
            try:
                self._repository.reject(verification_id, reason, REVIEWER)
            except Exception:  # noqa: BLE001
                # No pudimos ni registrar el rechazo: propagar para que SQS reintente.
                logger.exception(
                    "Fallo al persistir el rechazo de la verificación id=%s",
                    verification_id,
                )
                raise
            return ProcessKycResult(
                verification_id=verification_id, approved=False, reason=reason
            )
