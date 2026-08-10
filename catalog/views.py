from datetime import timedelta

from django.utils import timezone
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import OrderingFilter, SearchFilter
from .models import Planet
from .serializers import PlanetSerializer, PlanetListSerializer, PriceHistorySerializer

HISTORY_RANGES = {
    "week": timedelta(days=7),
    "month": timedelta(days=30),
    "year": timedelta(days=365),
}


class PlanetViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Read-only API voor de frontend. Schrijven (aankopen, portfolio-mutaties)
    hoort in een aparte, geauthenticeerde viewset in de accounts-app zodra
    het handelsplatform gebouwd wordt -- hier bewust niet vermengd.
    """
    queryset = Planet.objects.all()
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ["planet_type", "in_habitable_zone", "is_solar_system",
                         "biosignature_candidate", "host_name"]
    search_fields = ["planet_name", "host_name"]
    ordering_fields = ["habitability_score", "resource_score", "distance_from_earth_ly"]

    def get_serializer_class(self):
        # ?full=true forceert de volledige serializer op de lijst-actie --
        # nodig voor bv. de stelsel-3D-visualisatie (orbit/HZ/fysieke
        # velden), zonder de standaard-catalogusrespons zwaarder te maken.
        wants_full = self.request.query_params.get("full") == "true"
        if self.action == "list" and not wants_full:
            return PlanetListSerializer
        return PlanetSerializer

    @action(detail=True, methods=["get"])
    def history(self, request, pk=None):
        """
        GET /api/planets/{id}/history/?range=week|month|year (default: month)
        Prijshistorie voor de waardegrafiek -- alleen ECHTE momentopnamen
        (zie PriceHistory/apply_demand_pricing), geen geïnterpoleerde of
        opgevulde punten. Bij een net gestart platform kan dit dus terecht
        weinig/geen punten bevatten.
        """
        planet = self.get_object()
        range_param = request.query_params.get("range", "month")
        delta = HISTORY_RANGES.get(range_param, HISTORY_RANGES["month"])
        cutoff = timezone.now() - delta
        history = planet.price_history.filter(recorded_at__gte=cutoff).order_by("recorded_at")
        return Response(PriceHistorySerializer(history, many=True).data)
