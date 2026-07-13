"""Utilidades de conexión a MariaDB compartidas por los adaptadores."""
from __future__ import annotations

from urllib.parse import unquote, urlparse


def parse_database_url(database_url: str) -> dict[str, object]:
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
