from django.db import models
from django.utils import timezone


class Planet(models.Model):
    planet_name = models.CharField(max_length=200, unique=True, db_index=True)
    host_name = models.CharField(max_length=200, db_index=True)
    is_solar_system = models.BooleanField(default=False)
    discovery_year = models.IntegerField(null=True, blank=True)
    discovery_method = models.CharField(max_length=100, null=True, blank=True)

    star_spectral_type = models.CharField(max_length=20, null=True, blank=True)
    star_teff_k = models.FloatField(null=True, blank=True)
    star_color_rgb = models.JSONField(null=True, blank=True)
    star_radius_solar = models.FloatField(null=True, blank=True)
    star_mass_solar = models.FloatField(null=True, blank=True)
    star_age_gyr = models.FloatField(null=True, blank=True)
    star_luminosity_solar = models.FloatField(null=True, blank=True)

    orbit_semi_major_axis_au = models.FloatField(null=True, blank=True)
    orbit_eccentricity = models.FloatField(null=True, blank=True)
    orbit_inclination_deg = models.FloatField(null=True, blank=True)
    orbit_period_days = models.FloatField(null=True, blank=True)
    rotation_state = models.CharField(max_length=20, null=True, blank=True)
    system_planet_count = models.IntegerField(null=True, blank=True)
    system_position = models.IntegerField(null=True, blank=True)
    planet_type = models.CharField(max_length=30, null=True, blank=True)
    planet_color_rgb = models.JSONField(null=True, blank=True)
    moon_count = models.IntegerField(null=True, blank=True)
    has_rings = models.BooleanField(null=True, blank=True)
    visual_tag = models.CharField(max_length=50, null=True, blank=True)

    mass_earth = models.FloatField(null=True, blank=True)
    radius_earth = models.FloatField(null=True, blank=True)
    density_g_cm3 = models.FloatField(null=True, blank=True)
    surface_gravity_g = models.FloatField(null=True, blank=True)
    escape_velocity_km_s = models.FloatField(null=True, blank=True)
    equilibrium_temp_k = models.FloatField(null=True, blank=True)
    insolation_flux_earth = models.FloatField(null=True, blank=True)

    distance_from_earth_ly = models.FloatField(null=True, blank=True)
    hz_inner_au = models.FloatField(null=True, blank=True)
    hz_outer_au = models.FloatField(null=True, blank=True)
    in_habitable_zone = models.BooleanField(null=True, blank=True)

    atmosphere_density = models.CharField(max_length=20, null=True, blank=True)
    detected_molecules = models.JSONField(null=True, blank=True)
    molecule_source = models.CharField(max_length=30, null=True, blank=True)
    c_to_o_ratio = models.FloatField(null=True, blank=True)
    magnetosphere_strength = models.CharField(max_length=20, null=True, blank=True)
    tectonic_activity = models.CharField(max_length=20, null=True, blank=True)

    esi_score = models.FloatField(null=True, blank=True)
    habitability_score = models.FloatField(null=True, blank=True, db_index=True)
    # base_resource_score: puur de formule (dichtheid/type/magnetosfeer/tektoniek/straal),
    # herberekend bij elke sync. resource_score: base + blijvende ResourceDiscovery-bonussen
    # (zie dat model) -- NOOIT direct overschreven door sync_planets, alleen door
    # apply_resource_discoveries. Zelfde patroon als base_market_value_credits/market_value_credits.
    base_resource_score = models.FloatField(null=True, blank=True)
    resource_score = models.FloatField(null=True, blank=True, db_index=True)
    confidence_score = models.FloatField(null=True, blank=True)
    biosignature_candidate = models.BooleanField(null=True, blank=True)

    # --- Handelsplatform ---
    # base_market_value: puur afgeleid van habitability/resource/schaarste (wetenschap).
    # market_value_credits: base_market_value x actieve sentiment-multiplier (macro-laag).
    # Bewust twee aparte velden -- nooit de wetenschappelijke basis stilzwijgend
    # laten vermengen met marktsentiment.
    base_market_value_credits = models.DecimalField(max_digits=14, decimal_places=2, null=True, blank=True)
    market_sentiment_multiplier = models.FloatField(default=1.0)
    demand_multiplier = models.FloatField(
        default=1.0,
        help_text="Vraag/populariteit op ons EIGEN platform (koop/verkoop-activiteit), los van externe marktsentiment.",
    )
    market_value_credits = models.DecimalField(max_digits=14, decimal_places=2, null=True, blank=True)

    last_synced_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-habitability_score"]

    def __str__(self):
        return f"{self.planet_name} ({self.visual_tag or self.planet_type})"


class ResourceDiscovery(models.Model):
    """
    Specifieke, blijvende grondstofvondst (bv. 'grote diamantafzetting
    aangetroffen'). BEWUST GEEN vervaltijd zoals MarketEvent -- dit is een
    feit over de planeet, geen voorbijgaand sentiment. Telt permanent mee in
    resource_score totdat een beheerder het zelf aanpast/intrekt (bv. bij
    wetenschappelijke weerlegging).
    """
    planet = models.ForeignKey(Planet, on_delete=models.CASCADE, related_name="resource_discoveries")
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    source = models.CharField(max_length=300, blank=True, help_text="Bronvermelding/publicatie.")

    points_bonus = models.FloatField(
        help_text="Punten opgeteld bij base_resource_score (kan ook negatief zijn bij weerlegging).",
    )
    is_verified = models.BooleanField(
        default=True,
        help_text="Alleen geverifieerde ontdekkingen tellen mee -- zet uit om tijdelijk te pauzeren zonder te verwijderen.",
    )
    discovered_at = models.DateTimeField(default=timezone.now)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-discovered_at"]

    def __str__(self):
        return f"{self.planet.planet_name}: {self.title} ({self.points_bonus:+.0f} pt)"


class MarketEvent(models.Model):
    """
    Macro-economische/nieuws-laag, LOS van de wetenschappelijke scores.
    Beinvloedt alleen market_sentiment_multiplier / market_value_credits,
    nooit habitability_score/resource_score/esi_score zelf.
    """
    CATEGORY_CHOICES = [
        ("space_mission", "Ruimtemissie (bv. lancering, nieuwe observatiecampagne)"),
        ("tech_breakthrough", "Technologische doorbraak (bv. voortstuwing, detectiemethode)"),
        ("market_sentiment", "Algemeen marktsentiment (bv. stabiliteitsindex) -- GEEN directe verwijzing naar echte conflicten/tragedies in titel of beschrijving"),
        ("discovery", "Wetenschappelijke ontdekking (bv. nieuw biosignature-onderzoek)"),
    ]
    SCOPE_CHOICES = [
        ("global", "Alle planeten"),
        ("system", "Specifiek sterrenstelsel (host_name)"),
        ("planet_type", "Specifiek planeettype"),
        ("planet", "Specifieke planeet"),
    ]

    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    category = models.CharField(max_length=30, choices=CATEGORY_CHOICES)

    scope = models.CharField(max_length=20, choices=SCOPE_CHOICES, default="global")
    scope_value = models.CharField(
        max_length=200, null=True, blank=True,
        help_text="Alleen invullen bij scope != 'global': host_name, planet_type, of planet_name.",
    )

    # Multiplier-effect, bv. 0.15 = +15%, -0.10 = -10%. Verval zorgt dat een
    # nieuwsgebeurtenis na verloop van tijd vanzelf wegebt, net als bij een
    # echte markt -- geen enkel nieuwsbericht blijft voor altijd de prijs sturen.
    magnitude = models.FloatField(help_text="Bv. 0.15 voor +15%, -0.10 voor -10%.")
    starts_at = models.DateTimeField(default=timezone.now)
    half_life_days = models.FloatField(
        default=14, help_text="Na hoeveel dagen het effect gehalveerd is.",
    )
    is_active = models.BooleanField(default=True)
    is_auto_generated = models.BooleanField(
        default=False,
        help_text="True voor door sync_market_sentiment gegenereerde events -- "
                   "deze worden bij elke run vervangen, niet handmatig bewerken.",
    )

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-starts_at"]

    def __str__(self):
        return f"{self.title} ({self.category}, {self.magnitude:+.0%})"

    def current_effect(self, at_time=None):
        """Effectieve, met de tijd vervallen invloed van deze gebeurtenis."""
        import math
        at_time = at_time or timezone.now()
        if not self.is_active or at_time < self.starts_at:
            return 0.0
        days_elapsed = (at_time - self.starts_at).total_seconds() / 86400
        decay = 0.5 ** (days_elapsed / self.half_life_days) if self.half_life_days > 0 else 1.0
        return self.magnitude * decay

    def applies_to(self, planet):
        if self.scope == "global":
            return True
        if self.scope == "system":
            return planet.host_name == self.scope_value
        if self.scope == "planet_type":
            return planet.planet_type == self.scope_value
        if self.scope == "planet":
            return planet.planet_name == self.scope_value
        return False
