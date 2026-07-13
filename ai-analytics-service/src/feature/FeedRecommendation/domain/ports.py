"""Puertos (interfaces abstractas) del dominio FeedRecommendation.

Definen los contratos que la capa de aplicación necesita. Los adaptadores
concretos en `infrastructure/` los implementan (Inversión de Dependencias).
"""
from __future__ import annotations

from abc import ABC, abstractmethod

from src.feature.FeedRecommendation.domain.entities import (
    CandidateCampaign,
    DonorProfile,
    Recommendation,
)


class IFeedRepository(ABC):
    """Puerto de persistencia para el feed personalizado."""

    @abstractmethod
    def list_donor_ids(self) -> list[str]:
        """Devuelve los ids de las cuentas activas con rol DONOR."""
        raise NotImplementedError

    @abstractmethod
    def get_donor_profile(self, account_id: str) -> DonorProfile:
        """Reúne las señales conocidas del donante (universidad, historial)."""
        raise NotImplementedError

    @abstractmethod
    def list_candidates(self, account_id: str, limit: int) -> list[CandidateCampaign]:
        """Campañas activas recomendables: excluye las propias y las ya donadas."""
        raise NotImplementedError

    @abstractmethod
    def replace_recommendations(
        self,
        account_id: str,
        recommendations: list[Recommendation],
    ) -> None:
        """Reemplaza atómicamente el feed guardado del donante.

        Debe borrar las recomendaciones previas e insertar las nuevas en una
        sola transacción: un feed a medio escribir es peor que uno viejo.
        """
        raise NotImplementedError


class IRecommenderService(ABC):
    """Puerto del servicio de IA que rankea campañas para un donante."""

    @abstractmethod
    def rank(
        self,
        profile: DonorProfile,
        candidates: list[CandidateCampaign],
        top_n: int,
    ) -> list[Recommendation]:
        """Ordena las candidatas por afinidad con el donante y devuelve las mejores.

        Debe lanzar una excepción si no logra producir un ranking válido.
        """
        raise NotImplementedError
