from rest_framework import serializers
from .models import Planet, PriceHistory


class PlanetSerializer(serializers.ModelSerializer):
    class Meta:
        model = Planet
        fields = "__all__"


class PlanetListSerializer(serializers.ModelSerializer):
    """Lichtgewicht versie voor lijstweergaves (bv. kaarten-overzicht) --
    scheelt bandbreedte t.o.v. alle ~50 velden per planeet."""
    is_updated = serializers.SerializerMethodField()

    class Meta:
        model = Planet
        fields = (
            "id", "planet_name", "host_name", "visual_tag", "planet_type",
            "planet_color_rgb", "star_color_rgb", "habitability_score",
            "resource_score", "biosignature_candidate", "distance_from_earth_ly",
            "market_value_credits", "is_updated",
        )

    def get_is_updated(self, obj):
        """
        True als er nieuwe info is sinds de vorige keer dat DEZE gebruiker de
        catalogus bekeek (context["catalog_since"], gezet door
        PlanetViewSet.get_serializer_context()). Anoniem/nog nooit bekeken
        -> altijd False, geen "alles is nieuw"-ruis voor een eerste bezoek.
        """
        since = self.context.get("catalog_since")
        if since is None or obj.last_content_update_at is None:
            return False
        return obj.last_content_update_at > since


class PriceHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = PriceHistory
        fields = ("recorded_at", "market_value_credits")
