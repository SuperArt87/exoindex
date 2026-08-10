from datetime import timedelta

import django_filters
from django.db.models import Q
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


def _molecule_tokens(molecules):
    # Zelfde tokenisatie als scoring.py: strip "(trace)"/"(tentative)"-
    # suffixen zodat "CO2 (tentative)" nog steeds matcht op "CO2".
    return {m.split(" ")[0] for m in (molecules or [])}


class PlanetFilter(django_filters.FilterSet):
    # detected_molecules is een JSONField (lijst) -- "leeg/null" en "gevuld"
    # zijn geen standaard filterset_fields-lookup, dus een expliciete
    # BooleanFilter met eigen queryset-logica.
    has_detected_molecules = django_filters.BooleanFilter(method="filter_has_detected_molecules")
    has_atmosphere = django_filters.BooleanFilter(method="filter_has_atmosphere")
    has_h2o = django_filters.BooleanFilter(method="filter_has_h2o")
    has_carbon = django_filters.BooleanFilter(method="filter_has_carbon")

    class Meta:
        model = Planet
        fields = ["planet_type", "in_habitable_zone", "is_solar_system",
                  "biosignature_candidate", "host_name"]

    def filter_has_detected_molecules(self, queryset, name, value):
        empty = Q(detected_molecules__isnull=True) | Q(detected_molecules=[])
        return queryset.exclude(empty) if value else queryset.filter(empty)

    def filter_has_atmosphere(self, queryset, name, value):
        # atmosphere_density kent zowel NULL (onbekend) als het expliciete
        # "none" (gemeten: geen atmosfeer) -- beide horen bij "geen atmosfeer".
        no_atmosphere = Q(atmosphere_density__isnull=True) | Q(atmosphere_density="none")
        return queryset.exclude(no_atmosphere) if value else queryset.filter(no_atmosphere)

    def filter_has_h2o(self, queryset, name, value):
        # Python-side tokenmatch i.p.v. een JSONField-containment-query,
        # zodat dit exact hetzelfde gedrag heeft als scoring.py's
        # "H2O" in tokens -- inclusief het negeren van (trace)/(tentative).
        ids = [p.id for p in queryset.only("id", "detected_molecules")
               if "H2O" in _molecule_tokens(p.detected_molecules)]
        return queryset.filter(id__in=ids) if value else queryset.exclude(id__in=ids)

    def filter_has_carbon(self, queryset, name, value):
        ids = [p.id for p in queryset.only("id", "detected_molecules")
               if _molecule_tokens(p.detected_molecules) & {"C", "CO2"}]
        return queryset.filter(id__in=ids) if value else queryset.exclude(id__in=ids)


class PlanetViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Read-only API voor de frontend. Schrijven (aankopen, portfolio-mutaties)
    hoort in een aparte, geauthenticeerde viewset in de accounts-app zodra
    het handelsplatform gebouwd wordt -- hier bewust niet vermengd.
    """
    queryset = Planet.objects.all()
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_class = PlanetFilter
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
