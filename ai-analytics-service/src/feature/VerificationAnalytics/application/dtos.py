"""DTOs de la capa de aplicación.

Transportan datos entre el entrypoint (SQS) y el caso de uso, sin acoplar
el caso de uso al formato del evento de AWS.
"""
from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class ProcessKycCommand:
    """Comando de entrada para el caso de uso de procesamiento KYC."""

    verification_id: int
    account_id: int
    document_url: str

    @classmethod
    def from_message(cls, payload: dict[str, object]) -> "ProcessKycCommand":
        """Construye el comando a partir del cuerpo (JSON) de un mensaje SQS.

        Acepta tanto camelCase como snake_case por robustez frente a productores.
        """
        verification_id = payload.get("verificationId", payload.get("verification_id"))
        account_id = payload.get("accountId", payload.get("account_id"))
        document_url = payload.get("documentUrl", payload.get("document_url"))

        if verification_id is None:
            raise ValueError("Falta 'verificationId' en el mensaje SQS")
        if document_url is None:
            raise ValueError("Falta 'documentUrl' en el mensaje SQS")

        return cls(
            verification_id=int(verification_id),
            account_id=int(account_id) if account_id is not None else 0,
            document_url=str(document_url),
        )


@dataclass(frozen=True)
class ProcessKycResult:
    """Resultado del caso de uso, útil para logging y tests."""

    verification_id: int
    approved: bool
    reason: str | None = None
