"""DTOs de la capa de aplicación.

Transportan datos entre el entrypoint (EventBridge / invocación manual) y los
casos de uso, sin acoplarlos al formato del evento de AWS.
"""
from __future__ import annotations

from dataclasses import dataclass

DEFAULT_TOP_N = 9
DEFAULT_CANDIDATE_LIMIT = 60


@dataclass(frozen=True)
class GenerateFeedCommand:
    """Comando para regenerar el feed personalizado de un donante."""

    account_id: str
    top_n: int = DEFAULT_TOP_N
    candidate_limit: int = DEFAULT_CANDIDATE_LIMIT

    @classmethod
    def from_event(cls, payload: dict[str, object]) -> "GenerateFeedCommand":
        """Construye el comando desde el cuerpo de un evento.

        Acepta camelCase y snake_case por robustez frente a productores, igual
        que ProcessKycCommand.
        """
        account_id = payload.get("accountId", payload.get("account_id"))
        if account_id is None:
            raise ValueError("Falta 'accountId' en el evento")

        return cls(
            account_id=str(account_id),
            top_n=int(payload.get("topN", payload.get("top_n", DEFAULT_TOP_N))),
            candidate_limit=int(
                payload.get(
                    "candidateLimit",
                    payload.get("candidate_limit", DEFAULT_CANDIDATE_LIMIT),
                )
            ),
        )


@dataclass(frozen=True)
class GenerateFeedResult:
    """Resultado por donante, útil para logging y tests."""

    account_id: str
    recommended: int = 0
    skipped_reason: str | None = None

    @property
    def was_skipped(self) -> bool:
        return self.skipped_reason is not None


@dataclass(frozen=True)
class RefreshAllFeedsResult:
    """Resumen del lote completo."""

    processed: int = 0
    skipped: int = 0
    failed: int = 0

    def to_dict(self) -> dict[str, int]:
        return {
            "processed": self.processed,
            "skipped": self.skipped,
            "failed": self.failed,
        }
