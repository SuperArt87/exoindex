from django.contrib import admin
from .models import Planet, ResourceDiscovery, MarketEvent, PriceHistory


@admin.register(ResourceDiscovery)
class ResourceDiscoveryAdmin(admin.ModelAdmin):
    list_display = ("planet", "title", "points_bonus", "is_verified", "discovered_at")
    list_filter = ("is_verified",)
    search_fields = ("title", "planet__planet_name")
    autocomplete_fields = ["planet"]


@admin.register(PriceHistory)
class PriceHistoryAdmin(admin.ModelAdmin):
    list_display = ("planet", "market_value_credits", "recorded_at")
    list_filter = ("recorded_at",)
    search_fields = ("planet__planet_name",)
    autocomplete_fields = ["planet"]


@admin.register(MarketEvent)
class MarketEventAdmin(admin.ModelAdmin):
    list_display = ("title", "category", "scope", "scope_value", "magnitude",
                     "starts_at", "half_life_days", "is_active", "is_auto_generated")
    list_filter = ("category", "scope", "is_active", "is_auto_generated")
    search_fields = ("title", "scope_value")
    readonly_fields = ("is_auto_generated",)


@admin.register(Planet)
class PlanetAdmin(admin.ModelAdmin):
    list_display = (
        "planet_name", "host_name", "visual_tag", "planet_type",
        "habitability_score", "base_resource_score", "resource_score", "confidence_score",
        "biosignature_candidate", "is_solar_system", "last_synced_at", "last_content_update_at",
    )
    list_filter = (
        "is_solar_system", "planet_type", "in_habitable_zone",
        "biosignature_candidate", "molecule_source", "rotation_state",
    )
    search_fields = ("planet_name", "host_name")
    readonly_fields = ("last_synced_at", "last_content_update_at")
    ordering = ("-habitability_score",)

    fieldsets = (
        ("Identificatie", {
            "fields": ("planet_name", "host_name", "is_solar_system",
                       "discovery_year", "discovery_method")
        }),
        ("Ster", {
            "fields": ("star_spectral_type", "star_teff_k", "star_color_rgb",
                       "star_radius_solar", "star_mass_solar", "star_age_gyr",
                       "star_luminosity_solar")
        }),
        ("Baan & systeem", {
            "fields": ("orbit_semi_major_axis_au", "orbit_eccentricity",
                       "orbit_inclination_deg", "orbit_period_days",
                       "rotation_state", "system_planet_count", "system_position",
                       "planet_type", "planet_color_rgb", "moon_count",
                       "has_rings", "visual_tag")
        }),
        ("Fysiek", {
            "fields": ("mass_earth", "radius_earth", "density_g_cm3",
                       "surface_gravity_g", "escape_velocity_km_s",
                       "equilibrium_temp_k", "insolation_flux_earth")
        }),
        ("Leefbaarheidscontext", {
            "fields": ("distance_from_earth_ly", "hz_inner_au", "hz_outer_au",
                       "in_habitable_zone")
        }),
        ("Atmosfeer & samenstelling", {
            "fields": ("atmosphere_density", "detected_molecules", "molecule_source",
                       "c_to_o_ratio", "magnetosphere_strength", "tectonic_activity")
        }),
        ("Scores (esi/habitability/base_resource: alleen-lezen aanbevolen -- herberekend bij sync)", {
            "fields": ("esi_score", "habitability_score", "base_resource_score",
                       "resource_score", "confidence_score", "biosignature_candidate")
        }),
        ("Handelsplatform", {
            "fields": ("base_market_value_credits", "market_sentiment_multiplier",
                       "demand_multiplier", "market_value_credits")
        }),
    )
