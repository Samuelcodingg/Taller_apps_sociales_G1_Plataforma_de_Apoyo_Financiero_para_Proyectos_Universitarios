"""Adaptador de descarga de documentos vía HTTP (implementa IDocumentDownloader)."""
from __future__ import annotations

import logging

import requests

from src.feature.VerificationAnalytics.domain.ports import IDocumentDownloader

logger = logging.getLogger(__name__)

# Límite defensivo para no agotar la memoria de la Lambda con un archivo enorme.
_MAX_BYTES = 15 * 1024 * 1024  # 15 MB


class HttpDocumentDownloader(IDocumentDownloader):
    """Descarga el documento KYC a memoria usando requests."""

    def __init__(self, *, timeout_seconds: int = 30) -> None:
        self._timeout = timeout_seconds

    def download(self, document_url: str) -> bytes:
        if not document_url:
            raise ValueError("documentUrl está vacío")

        logger.info("Descargando documento desde %s", document_url)
        response = requests.get(document_url, timeout=self._timeout, stream=True)
        response.raise_for_status()

        content = response.content
        if len(content) > _MAX_BYTES:
            raise ValueError(
                f"El documento excede el tamaño máximo permitido ({_MAX_BYTES} bytes)"
            )
        if not content:
            raise ValueError("El documento descargado está vacío")
        return content
