from django.db import models


class Planet(models.Model):
    # --- Identificatie ---
    planet_name = models.CharField(max_length=200, unique=True, db_index=True)
    host_name = models.CharField(max_length=200, db_index=True)
    is_solar_system = models.BooleanField(default=False)
    discovery_year = models.IntegerField(null=True, blank=True)
    discovery_method = models.CharField(max_length=100, null=True, blank=True)

    # --- Ster (visueel) ---
    star_spectral_type = models.CharField(max_length=20, null=True, blank=True)
    star_teff_k = models.FloatField(null=True, blank=True)
    star_color_rgb = models.JSONField(null=True, blank=True)  # [r,g,b]
    star_radius_solar = models.FloatField(null=True, blank=True)
    star_mass_solar = models.FloatField(null=True, blank=True)
    star_age_gyr = models.FloatField(null=True, blank=True)
    star_luminosity_solar = models.FloatField(null=True, blank=True)

    # --- Baan / systeem (visueel) ---
    orbit_semi_major_axis_au = models.FloatField(null=True, blank=True)
    orbit_eccentricity = models.FloatField(null=True, blank=True)
    orbit_inclination_deg = models.FloatField(null=True, blank=True)
    orbit_period_days = models.FloatField(null=True, blank=True)
    rotation_state = models.CharField(max_length=20, null=True, blank=True)  # free/resonant/synchronous
    system_planet_count = models.IntegerField(null=True, blank=True)
    system_position = models.IntegerField(null=True, blank=True)
    planet_type = models.CharField(max_length=30, null=True, blank=True)
    planet_color_rgb = models.JSONField(null=True, blank=True)
    moon_count = models.IntegerField(null=True, blank=True)
    has_rings = models.BooleanField(null=True, blank=True)
    visual_tag = models.CharField(max_length=50, null=True, blank=True)  # bv. "Hot Jupiter"

    # --- Fysiek ---
    mass_earth = models.FloatField(null=True, blank=True)
    radius_earth = models.FloatField(null=True, blank=True)
    density_g_cm3 = models.FloatField(null=True, blank=True)
    surface_gravity_g = models.FloatField(null=True, blank=True)
    escape_velocity_km_s = models.FloatField(null=True, blank=True)
    equilibrium_temp_k = models.FloatField(null=True, blank=True)
    insolation_flux_earth = models.FloatField(null=True, blank=True)

    # --- Leefbaarheidscontext ---
    distance_from_earth_ly = models.FloatField(null=True, blank=True)
    hz_inner_au = models.FloatField(null=True, blank=True)
    hz_outer_au = models.FloatField(null=True, blank=True)
    in_habitable_zone = models.BooleanField(null=True, blank=True)

    # --- Atmosfeer & samenstelling ---
    atmosphere_density = models.CharField(max_length=20, null=True, blank=True)
    detected_molecules = models.JSONField(null=True, blank=True)  # lijst van strings
    molecule_source = models.CharField(max_length=30, null=True, blank=True)
    c_to_o_ratio = models.FloatField(null=True, blank=True)
    magnetosphere_strength = models.CharField(max_length=20, null=True, blank=True)
    tectonic_activity = models.CharField(max_length=20, null=True, blank=True)

    # --- Scores ---
    esi_score = models.FloatField(null=True, blank=True)
    habitability_score = models.FloatField(null=True, blank=True, db_index=True)
    resource_score = models.FloatField(null=True, blank=True, db_index=True)
    confidence_score = models.FloatField(null=True, blank=True)
    biosignature_candidate = models.BooleanField(null=True, blank=True)

    # --- Handelsplatform (fase 2, alvast voorbereid) ---
    market_value_credits = models.DecimalField(max_digits=14, decimal_places=2, null=True, blank=True)

    last_synced_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-habitability_score"]

    def __str__(self):
        return f"{self.planet_name} ({self.visual_tag or self.planet_type})"
