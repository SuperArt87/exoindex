from rest_framework import viewsets
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import OrderingFilter, SearchFilter
from .models import Planet
from .serializers import PlanetSerializer, PlanetListSerializer


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
