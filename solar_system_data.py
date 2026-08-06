"""
Statische dataset van ons eigen zonnestelsel.
Bron: NASA Planetary Fact Sheets (JPL/GSFC) + gevestigde planetaire
wetenschap (magnetosfeer, platentektoniek, ringen, manen).
Wordt NIET live opgevraagd -- dit verandert niet; jaarlijks handmatig
controleren op updates (bv. nieuw ontdekte manen) is voldoende.
"""

SOLAR_SYSTEM_PLANETS = [
    dict(
        planet_name="Mercury", host_name="Sun", is_solar_system=True,
        orbit_semi_major_axis_au=0.387, orbit_eccentricity=0.206,
        orbit_inclination_deg=7.0, orbit_period_days=88.0,
        rotation_period_hours=1407.6,
        rotation_state="resonant",  # 3:2 spin-orbit resonantie -- niet vrij, maar ook niet volledig vergrendeld
        mass_earth=0.0553, radius_earth=0.383, density_g_cm3=5.427,
        equilibrium_temp_k=440, moon_count=0, has_rings=False,
        planet_type="rocky", atmosphere_density="trace", detected_molecules=["O2 (trace)", "Na", "He"],
        magnetosphere_strength="weak", tectonic_activity="none",  # ~1% van de veldsterkte van de Aarde
        c_to_o_ratio=None,
    ),
    dict(
        planet_name="Venus", host_name="Sun", is_solar_system=True,
        orbit_semi_major_axis_au=0.723, orbit_eccentricity=0.007,
        orbit_inclination_deg=3.39, orbit_period_days=224.7,
        rotation_period_hours=-5832.5,  # retrograde rotatie
        rotation_state="free",
        mass_earth=0.815, radius_earth=0.949, density_g_cm3=5.243,
        equilibrium_temp_k=737, moon_count=0, has_rings=False,
        planet_type="rocky", atmosphere_density="thick",
        detected_molecules=["CO2", "N2", "SO2"],
        magnetosphere_strength="none", tectonic_activity="none",  # geen actieve platen, wel resurfacing-vulkanisme
        c_to_o_ratio=None,
    ),
    dict(
        planet_name="Earth", host_name="Sun", is_solar_system=True,
        orbit_semi_major_axis_au=1.000, orbit_eccentricity=0.0167,
        orbit_inclination_deg=0.0, orbit_period_days=365.25,
        rotation_period_hours=23.93,
        rotation_state="free",
        mass_earth=1.0, radius_earth=1.0, density_g_cm3=5.514,
        equilibrium_temp_k=255, moon_count=1, has_rings=False,
        planet_type="rocky", atmosphere_density="moderate",
        detected_molecules=["N2", "O2", "CO2", "H2O", "Ar"],
        magnetosphere_strength="strong", tectonic_activity="active",
        c_to_o_ratio=0.55,
    ),
    dict(
        planet_name="Mars", host_name="Sun", is_solar_system=True,
        orbit_semi_major_axis_au=1.524, orbit_eccentricity=0.0934,
        orbit_inclination_deg=1.85, orbit_period_days=687.0,
        rotation_period_hours=24.62,
        rotation_state="free",
        mass_earth=0.107, radius_earth=0.532, density_g_cm3=3.933,
        equilibrium_temp_k=210, moon_count=2, has_rings=False,
        planet_type="rocky", atmosphere_density="thin",
        detected_molecules=["CO2", "N2", "Ar"],
        magnetosphere_strength="weak", tectonic_activity="dormant",  # lokaal restmagnetisme in de korst, geen globaal veld meer
        c_to_o_ratio=None,
    ),
    dict(
        planet_name="Jupiter", host_name="Sun", is_solar_system=True,
        orbit_semi_major_axis_au=5.203, orbit_eccentricity=0.0489,
        orbit_inclination_deg=1.30, orbit_period_days=4331.0,
        rotation_period_hours=9.93,
        rotation_state="free",
        mass_earth=317.8, radius_earth=11.21, density_g_cm3=1.326,
        equilibrium_temp_k=110, moon_count=95, has_rings=True,
        planet_type="gas_giant", atmosphere_density="deep",
        detected_molecules=["H2", "He", "CH4", "NH3"],
        magnetosphere_strength="strong", tectonic_activity=None,  # niet van toepassing, geen vast oppervlak
        c_to_o_ratio=None,
    ),
    dict(
        planet_name="Saturn", host_name="Sun", is_solar_system=True,
        orbit_semi_major_axis_au=9.537, orbit_eccentricity=0.0565,
        orbit_inclination_deg=2.49, orbit_period_days=10747.0,
        rotation_period_hours=10.66,
        rotation_state="free",
        mass_earth=95.16, radius_earth=9.45, density_g_cm3=0.687,
        equilibrium_temp_k=81, moon_count=146, has_rings=True,
        planet_type="gas_giant", atmosphere_density="deep",
        detected_molecules=["H2", "He", "CH4", "NH3"],
        magnetosphere_strength="strong", tectonic_activity=None,
        c_to_o_ratio=None,
    ),
    dict(
        planet_name="Uranus", host_name="Sun", is_solar_system=True,
        orbit_semi_major_axis_au=19.19, orbit_eccentricity=0.0457,
        orbit_inclination_deg=0.77, orbit_period_days=30589.0,
        rotation_period_hours=-17.24,  # retrograde, extreme axiale kanteling (~98 graden)
        rotation_state="free",
        mass_earth=14.54, radius_earth=4.01, density_g_cm3=1.271,
        equilibrium_temp_k=58, moon_count=28, has_rings=True,
        planet_type="ice_giant", atmosphere_density="deep",
        detected_molecules=["H2", "He", "CH4"],
        magnetosphere_strength="weak", tectonic_activity=None,  # veld aanwezig maar sterk gekanteld/asymmetrisch t.o.v. Jupiter/Saturn
        c_to_o_ratio=None,
    ),
    dict(
        planet_name="Neptune", host_name="Sun", is_solar_system=True,
        orbit_semi_major_axis_au=30.07, orbit_eccentricity=0.0113,
        orbit_inclination_deg=1.77, orbit_period_days=59800.0,
        rotation_period_hours=16.11,
        rotation_state="free",
        mass_earth=17.15, radius_earth=3.88, density_g_cm3=1.638,
        equilibrium_temp_k=47, moon_count=16, has_rings=True,
        planet_type="ice_giant", atmosphere_density="deep",
        detected_molecules=["H2", "He", "CH4"],
        magnetosphere_strength="weak", tectonic_activity=None,  # zelfde nuance als Uranus
        c_to_o_ratio=None,
    ),
]

# Zon als "host_star" record, zelfde structuur als exoplaneet-hoststerren
SUN_STAR = dict(
    host_name="Sun", star_spectral_type="G2V", star_teff_k=5778,
    star_radius_solar=1.0, star_mass_solar=1.0, star_age_gyr=4.6,
    star_luminosity_solar=1.0,
)
