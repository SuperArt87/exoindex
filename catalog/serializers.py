from rest_framework import serializers
from .models import Planet, PriceHistory


class PlanetSerializer(serializers.ModelSerializer):
    class Meta:
        model = Planet
        fields = "__all__"


class PlanetListSerializer(serializers.ModelSerializer):
    """Lichtgewicht versie voor lijstweergaves (bv. kaarten-overzicht) --
    scheelt bandbreedte t.o.v. alle ~50 velden per planeet."""
    class Meta:
        model = Planet
        fields = (
            "id", "planet_name", "host_name", "visual_tag", "planet_type",
            "planet_color_rgb", "star_color_rgb", "habitability_score",
            "resource_score", "biosignature_candidate", "distance_from_earth_ly",
            "market_value_credits",
        )


class PriceHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = PriceHistory
        fields = ("recorded_at", "market_value_credits")
