"""Adaptador de persistencia MariaDB (implementa IFeedRepository)."""
from __future__ import annotations

import logging
from datetime import datetime, timezone
from uuid import uuid4

import pymysql

from src.feature.FeedRecommendation.domain.entities import (
    CandidateCampaign,
    DonorProfile,
    Recommendation,
)
from src.feature.FeedRecommendation.domain.ports import IFeedRepository
from src.shared.database import parse_database_url

logger = logging.getLogger(__name__)

# Cuántas señales del historial se le muestran al LLM. Suficientes para captar
# el gusto del donante sin inflar el prompt.
_MAX_CATEGORIES = 5
_MAX_DONATED_TITLES = 10
_MAX_ENGAGED_TITLES = 10

_DONOR_IDS_SQL = """
    SELECT a.id_account
      FROM account a
      JOIN account_roles ar ON ar.id_account = a.id_account
      JOIN roles r          ON r.id_role     = ar.id_role
     WHERE r.name = 'DONOR'
       AND (a.is_active IS NULL OR a.is_active = 1)
"""

# La universidad sale del perfil; si el donante no la declaró, se cae a la que
# el LLM de KYC extrajo de su documento.
_UNIVERSITY_SQL = """
    SELECT COALESCE(
             NULLIF(i.name, ''),
             NULLIF(JSON_UNQUOTE(JSON_EXTRACT(v.extracted_data, '$.universidad')), '')
           ) AS university,
           NULLIF(JSON_UNQUOTE(JSON_EXTRACT(v.extracted_data, '$.escuela')), '') AS career
      FROM account a
      LEFT JOIN profile     p ON p.id_account     = a.id_account
      LEFT JOIN institution i ON i.id_institution = p.id_institution
      LEFT JOIN verification v ON v.id_account = a.id_account
                              AND v.status     = 'APPROVED'
     WHERE a.id_account = %s
     LIMIT 1
"""

# Categorías ordenadas por cuánto las ha tocado el donante. Una donación pesa
# más que una interacción suelta (ver, compartir).
_CATEGORIES_SQL = """
    SELECT c.name, SUM(t.weight) AS total
      FROM (
            SELECT id_campaign, 3 AS weight FROM donation             WHERE id_donor   = %s
             UNION ALL
            SELECT id_campaign, 1 AS weight FROM campaign_interaction WHERE id_account = %s
           ) t
      JOIN campaign_category cc ON cc.id_campaign  = t.id_campaign
      JOIN category          c  ON c.id_category   = cc.id_category
     GROUP BY c.name
     ORDER BY total DESC
     LIMIT %s
"""

_DONATED_TITLES_SQL = """
    SELECT DISTINCT c.title
      FROM donation d
      JOIN campaign c ON c.id_campaign = d.id_campaign
     WHERE d.id_donor = %s
     ORDER BY d.created_at DESC
     LIMIT %s
"""

_ENGAGED_TITLES_SQL = """
    SELECT DISTINCT c.title
      FROM campaign_interaction ci
      JOIN campaign c ON c.id_campaign = ci.id_campaign
     WHERE ci.id_account = %s
       AND ci.id_campaign NOT IN (SELECT id_campaign FROM donation WHERE id_donor = %s)
     ORDER BY ci.created_at DESC
     LIMIT %s
"""

# Candidatas: activas, ajenas y aún no donadas por este donante.
_CANDIDATES_SQL = """
    SELECT c.id_campaign,
           c.title,
           c.description,
           c.goal_amount,
           c.current_amount,
           DATEDIFF(c.end_date, NOW()) AS days_left,
           i.name AS creator_university,
           GROUP_CONCAT(DISTINCT cat.name) AS categories
      FROM campaign c
      LEFT JOIN profile           p   ON p.id_account      = c.id_creator
      LEFT JOIN institution       i   ON i.id_institution  = p.id_institution
      LEFT JOIN campaign_category cc  ON cc.id_campaign    = c.id_campaign
      LEFT JOIN category          cat ON cat.id_category   = cc.id_category
     WHERE c.status = 'ACTIVE'
       AND (c.id_creator IS NULL OR c.id_creator <> %s)
       AND c.id_campaign NOT IN (SELECT id_campaign FROM donation WHERE id_donor = %s)
     GROUP BY c.id_campaign
     ORDER BY c.created_at DESC
     LIMIT %s
"""

_DELETE_RECOMMENDATIONS_SQL = "DELETE FROM user_recommendation WHERE id_account = %s"

_INSERT_RECOMMENDATION_SQL = """
    INSERT INTO user_recommendation
           (id_recommendation, id_account, id_campaign, score, reason, created_at)
    VALUES (%s, %s, %s, %s, %s, %s)
"""


class MariaDBFeedRepository(IFeedRepository):
    """Implementación con pymysql. Abre/cierra conexión por operación.

    En el contexto de Lambda esto evita conexiones colgadas entre invocaciones.
    """

    def __init__(self, database_url: str) -> None:
        if not database_url:
            raise ValueError("DATABASE_URL es requerida para MariaDBFeedRepository")
        self._conn_kwargs = parse_database_url(database_url)

    def _connect(self) -> pymysql.connections.Connection:
        return pymysql.connect(
            **self._conn_kwargs,
            charset="utf8mb4",
            autocommit=False,
            cursorclass=pymysql.cursors.DictCursor,
            connect_timeout=10,
        )

    def list_donor_ids(self) -> list[str]:
        conn = self._connect()
        try:
            with conn.cursor() as cursor:
                cursor.execute(_DONOR_IDS_SQL)
                return [row["id_account"] for row in cursor.fetchall()]
        finally:
            conn.close()

    def get_donor_profile(self, account_id: str) -> DonorProfile:
        conn = self._connect()
        try:
            with conn.cursor() as cursor:
                cursor.execute(_UNIVERSITY_SQL, (account_id,))
                row = cursor.fetchone() or {}
                university = row.get("university") or ""
                career = row.get("career") or ""

                cursor.execute(_CATEGORIES_SQL, (account_id, account_id, _MAX_CATEGORIES))
                categories = [r["name"] for r in cursor.fetchall()]

                cursor.execute(_DONATED_TITLES_SQL, (account_id, _MAX_DONATED_TITLES))
                donated = [r["title"] for r in cursor.fetchall()]

                cursor.execute(
                    _ENGAGED_TITLES_SQL, (account_id, account_id, _MAX_ENGAGED_TITLES)
                )
                engaged = [r["title"] for r in cursor.fetchall()]
        finally:
            conn.close()

        return DonorProfile(
            account_id=account_id,
            university=university,
            career=career,
            top_categories=categories,
            donated_titles=donated,
            engaged_titles=engaged,
        )

    def list_candidates(self, account_id: str, limit: int) -> list[CandidateCampaign]:
        conn = self._connect()
        try:
            with conn.cursor() as cursor:
                cursor.execute(_CANDIDATES_SQL, (account_id, account_id, limit))
                rows = cursor.fetchall()
        finally:
            conn.close()

        return [self._to_candidate(row) for row in rows]

    def replace_recommendations(
        self,
        account_id: str,
        recommendations: list[Recommendation],
    ) -> None:
        now = datetime.now(timezone.utc)
        rows = [
            (
                str(uuid4()),
                account_id,
                rec.campaign_id,
                rec.score,
                rec.reason or None,
                now,
            )
            for rec in recommendations
        ]

        conn = self._connect()
        try:
            with conn.cursor() as cursor:
                cursor.execute(_DELETE_RECOMMENDATIONS_SQL, (account_id,))
                cursor.executemany(_INSERT_RECOMMENDATION_SQL, rows)
            conn.commit()
            logger.info(
                "Persistidas %d recomendaciones para el donante id=%s",
                len(rows),
                account_id,
            )
        except Exception:
            conn.rollback()
            raise
        finally:
            conn.close()

    @staticmethod
    def _to_candidate(row: dict[str, object]) -> CandidateCampaign:
        """Mapea una fila cruda a la entidad del dominio."""
        raw_categories = row.get("categories") or ""
        days_left = row.get("days_left")

        return CandidateCampaign(
            campaign_id=str(row["id_campaign"]),
            title=str(row.get("title") or ""),
            description=str(row.get("description") or ""),
            categories=[c for c in str(raw_categories).split(",") if c],
            creator_university=str(row.get("creator_university") or ""),
            goal_amount=float(row.get("goal_amount") or 0),
            current_amount=float(row.get("current_amount") or 0),
            days_left=int(days_left) if days_left is not None else None,
        )
