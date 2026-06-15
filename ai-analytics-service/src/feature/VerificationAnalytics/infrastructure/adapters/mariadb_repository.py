"""Adaptador de persistencia MariaDB (implementa IVerificationRepository)."""
from __future__ import annotations

import json
import logging
from datetime import datetime, timezone
from typing import Optional
from urllib.parse import unquote, urlparse

import pymysql

from src.feature.VerificationAnalytics.domain.entities import ExtractedData
from src.feature.VerificationAnalytics.domain.ports import IVerificationRepository

logger = logging.getLogger(__name__)


def _parse_database_url(database_url: str) -> dict[str, object]:
    """Convierte una DATABASE_URL (mysql://user:pass@host:port/db) a kwargs de pymysql."""
    parsed = urlparse(database_url)
    if parsed.scheme not in ("mysql", "mariadb"):
        raise ValueError(f"Esquema de DATABASE_URL no soportado: {parsed.scheme!r}")

    return {
        "host": parsed.hostname or "localhost",
        "port": parsed.port or 3306,
        "user": unquote(parsed.username) if parsed.username else "",
        "password": unquote(parsed.password) if parsed.password else "",
        "database": parsed.path.lstrip("/") if parsed.path else "",
    }


class MariaDBVerificationRepository(IVerificationRepository):
    """Implementación con pymysql. Abre/cierra conexión por operación.

    En el contexto de Lambda esto evita conexiones colgadas entre invocaciones.
    """

    def __init__(self, database_url: str, *, table: str = "verification") -> None:
        if not database_url:
            raise ValueError("DATABASE_URL es requerida para MariaDBVerificationRepository")
        self._conn_kwargs = _parse_database_url(database_url)
        self._table = table

    def _connect(self) -> pymysql.connections.Connection:
        return pymysql.connect(
            **self._conn_kwargs,
            charset="utf8mb4",
            autocommit=False,
            cursorclass=pymysql.cursors.DictCursor,
            connect_timeout=10,
        )

    def approve(
        self,
        id_verification: int,
        extracted_data: ExtractedData,
        reviewed_by: str,
    ) -> None:
        self._update(
            id_verification=id_verification,
            status="APPROVED",
            extracted_data=json.dumps(extracted_data.to_dict(), ensure_ascii=False),
            rejection_reason=None,
            reviewed_by=reviewed_by,
        )

    def reject(
        self,
        id_verification: int,
        rejection_reason: str,
        reviewed_by: str,
    ) -> None:
        self._update(
            id_verification=id_verification,
            status="REJECTED",
            extracted_data=None,
            rejection_reason=rejection_reason,
            reviewed_by=reviewed_by,
        )

    def _update(
        self,
        *,
        id_verification: int,
        status: str,
        extracted_data: Optional[str],
        rejection_reason: Optional[str],
        reviewed_by: str,
    ) -> None:
        reviewed_at = datetime.now(timezone.utc)
        sql = (
            f"UPDATE `{self._table}` SET "
            "status = %s, "
            "extracted_data = %s, "
            "rejection_reason = %s, "
            "reviewed_by = %s, "
            "reviewed_at = %s "
            "WHERE id_verification = %s"
        )
        params = (
            status,
            extracted_data,
            rejection_reason,
            reviewed_by,
            reviewed_at,
            id_verification,
        )

        conn = self._connect()
        try:
            with conn.cursor() as cursor:
                affected = cursor.execute(sql, params)
            conn.commit()
            if affected == 0:
                logger.warning(
                    "UPDATE no afectó filas: no existe verificación id=%s",
                    id_verification,
                )
            else:
                logger.info(
                    "Verificación id=%s actualizada a status=%s",
                    id_verification,
                    status,
                )
        except Exception:
            conn.rollback()
            raise
        finally:
            conn.close()
