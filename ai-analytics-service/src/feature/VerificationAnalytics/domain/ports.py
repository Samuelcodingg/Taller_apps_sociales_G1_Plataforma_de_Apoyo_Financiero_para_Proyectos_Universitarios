"""Puertos (interfaces abstractas) del dominio VerificationAnalytics.

Definen los contratos que la capa de aplicación necesita. Los adaptadores
concretos en `infrastructure/` los implementan (Inversión de Dependencias).
"""
from __future__ import annotations

from abc import ABC, abstractmethod

from src.feature.VerificationAnalytics.domain.entities import ExtractedData


class IVerificationRepository(ABC):
    """Puerto de persistencia para verificaciones KYC."""

    @abstractmethod
    def approve(
        self,
        id_verification: int,
        extracted_data: ExtractedData,
        reviewed_by: str,
    ) -> None:
        """Marca la verificación como APPROVED y guarda los datos extraídos."""
        raise NotImplementedError

    @abstractmethod
    def reject(
        self,
        id_verification: int,
        rejection_reason: str,
        reviewed_by: str,
    ) -> None:
        """Marca la verificación como REJECTED con el motivo del fallo."""
        raise NotImplementedError


class IDocumentDownloader(ABC):
    """Puerto para descargar el documento KYC a memoria."""

    @abstractmethod
    def download(self, document_url: str) -> bytes:
        """Descarga el archivo y devuelve sus bytes en memoria."""
        raise NotImplementedError


class ILLMService(ABC):
    """Puerto del servicio de IA que extrae datos estructurados del documento."""

    @abstractmethod
    def extract_kyc_data(self, file_bytes: bytes, mime_type: str = "application/pdf") -> ExtractedData:
        """Procesa el PDF en memoria y devuelve los datos estructurados.

        Debe lanzar una excepción si no logra producir un JSON válido.
        """
        raise NotImplementedError
