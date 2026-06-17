"""Entidades y objetos de valor del dominio VerificationAnalytics.

Esta capa no depende de frameworks, base de datos ni servicios externos.
Solo modela los conceptos del negocio.
"""
from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timezone
from enum import Enum
from typing import Optional


class VerificationStatus(str, Enum):
    """Estados posibles de una verificación KYC."""

    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"


@dataclass(frozen=True)
class ExtractedData:
    """Datos estructurados extraídos del documento KYC por el LLM.

    Es un objeto de valor inmutable: representa el resultado de la extracción.
    """

    nombres: str
    apellidos: str
    universidad: str
    codigo_estudiante: str

    def is_complete(self) -> bool:
        """Indica si todos los campos requeridos fueron extraídos con contenido."""
        return all(
            bool(value and value.strip())
            for value in (
                self.nombres,
                self.apellidos,
                self.universidad,
                self.codigo_estudiante,
            )
        )

    def to_dict(self) -> dict[str, str]:
        return {
            "nombres": self.nombres,
            "apellidos": self.apellidos,
            "universidad": self.universidad,
            "codigo_estudiante": self.codigo_estudiante,
        }

    @classmethod
    def from_dict(cls, data: dict[str, object]) -> "ExtractedData":
        """Construye la entidad a partir del JSON crudo devuelto por el LLM."""
        return cls(
            nombres=str(data.get("nombres", "") or "").strip(),
            apellidos=str(data.get("apellidos", "") or "").strip(),
            universidad=str(data.get("universidad", "") or "").strip(),
            codigo_estudiante=str(data.get("codigo_estudiante", "") or "").strip(),
        )


@dataclass
class Verification:
    """Agregado raíz: una solicitud de verificación KYC."""

    id_verification: str
    account_id: Optional[str] = None
    document_url: Optional[str] = None
    status: VerificationStatus = VerificationStatus.PENDING
    extracted_data: Optional[ExtractedData] = None
    rejection_reason: Optional[str] = None
    reviewed_by: Optional[str] = None
    reviewed_at: Optional[datetime] = None

    def approve(self, data: ExtractedData, reviewer: str) -> None:
        """Transición a APPROVED con los datos extraídos."""
        self.status = VerificationStatus.APPROVED
        self.extracted_data = data
        self.rejection_reason = None
        self.reviewed_by = reviewer
        self.reviewed_at = datetime.now(timezone.utc)

    def reject(self, reason: str, reviewer: str) -> None:
        """Transición a REJECTED guardando el motivo del fallo."""
        self.status = VerificationStatus.REJECTED
        self.extracted_data = None
        self.rejection_reason = reason
        self.reviewed_by = reviewer
        self.reviewed_at = datetime.now(timezone.utc)
