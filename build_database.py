"""
Combineert NASA Exoplanet Archive + statische zonnestelsel-data + gecureerde
JWST-molecuultabel tot één uniforme planeten-database volgens SCHEMA.md.

Gebruik:
    python3 build_database.py --limit 50 --out planets.json

Als de Exoplanet Archive niet bereikbaar is (bv. in een sandbox zonder
netwerktoegang tot dat domein) valt het script terug op een klein
demo-sample zodat je de rest van de pipeline (scoring, kleuren, HZ) toch
kunt testen.
"""
import argparse
import json
from collections import defaultdict

from solar_system_data import SOLAR_SYSTEM_PLANETS, SUN_STAR
from jwst_molecule_data import get_molecule_data  # fallback voor zeer recente detecties nog niet in exoplanet.eu
from scoring import (
    star_color_from_teff, spectral_type_from_teff,
    habitable_zone_au, is_in_habitable_zone,
    classify_planet_type, estimate_planet_color, estimate_rotation_state, visual_tag,
    surface_gravity_g, escape_velocity_km_s,
    earth_similarity_index, habitability_score, resource_score,
    confidence_score, biosignature_candidate,
)

PARSEC_TO_LY = 3.26156

# Klein demo-sample met dezelfde kolomnamen als de echte TAP-respons, voor
# als de live archive niet bereikbaar is in deze omgeving.
DEMO_SAMPLE = [
    dict(pl_name="Proxima Cen b", hostname="Proxima Centauri", sy_pnum=3, sy_dist=1.301,
         discoverymethod="Radial Velocity", disc_year=2016,
         pl_orbsmax=0.0485, pl_orbeccen=0.02, pl_orbincl=None, pl_orbper=11.19,
         pl_rade=1.07, pl_masse=1.07, pl_dens=None, pl_insol=0.65, pl_eqt=234,
         st_spectype="M5.5V", st_teff=3042, st_rad=0.154, st_mass=0.122, st_age=4.8, st_lum=-2.7,
         ra=217.4, dec=-62.7),
    dict(pl_name="TRAPPIST-1 e", hostname="TRAPPIST-1", sy_pnum=7, sy_dist=12.43,
         discoverymethod="Transit", disc_year=2017,
         pl_orbsmax=0.02928, pl_orbeccen=0.005, pl_orbincl=89.79, pl_orbper=6.10,
         pl_rade=0.92, pl_masse=0.69, pl_dens=5.65, pl_insol=0.66, pl_eqt=246,
         st_spectype="M8V", st_teff=2566, st_rad=0.119, st_mass=0.089, st_age=7.6, st_lum=-3.3,
         ra=346.6, dec=-5.0),
    dict(pl_name="WASP-39 b", hostname="WASP-39", sy_pnum=1, sy_dist=213.98,
         discoverymethod="Transit", disc_year=2011,
         pl_orbsmax=0.0486, pl_orbeccen=0.0, pl_orbincl=87.75, pl_orbper=4.06,
         pl_rade=14.1, pl_masse=27.9, pl_dens=0.18, pl_insol=None, pl_eqt=1170,
         st_spectype="G8V", st_teff=5326, st_rad=0.939, st_mass=0.93, st_age=None, st_lum=-0.11,
         ra=217.3, dec=-3.4),
    dict(pl_name="Kepler-452 b", hostname="Kepler-452", sy_pnum=1, sy_dist=550.0,
         discoverymethod="Transit", disc_year=2015,
         pl_orbsmax=1.046, pl_orbeccen=None, pl_orbincl=89.8, pl_orbper=384.8,
         pl_rade=1.63, pl_masse=None, pl_dens=None, pl_insol=1.10, pl_eqt=265,
         st_spectype="G2V", st_teff=5757, st_rad=1.11, st_mass=1.04, st_age=6.0, st_lum=0.11,
         ra=294.0, dec=44.3),
]


def normalize_exoplanet_row(row, exoplanet_eu_data=None):
    """Zet een ruwe TAP-rij om naar het schema-format met afgeleide velden.

    exoplanet_eu_data: optionele dict {planeetnaam: {"molecules": [...], "magnetic_field": bool|None}}
    uit fetch_exoplanet_eu.fetch_atmosphere_data(). Dit is nu de primaire bron
    voor detected_molecules; de handmatige JWST-tabel is alleen nog een
    fallback voor de allernieuwste detecties die exoplanet.eu nog niet heeft
    verwerkt.
    """
    exoplanet_eu_data = exoplanet_eu_data or {}
    teff = row.get("st_teff")
    lum_log = row.get("st_lum")  # archive geeft log10(L/Lsun)
    lum_solar = (10 ** lum_log) if lum_log is not None else None

    spectral_type = row.get("st_spectype") or spectral_type_from_teff(teff)
    hz_inner, hz_outer = habitable_zone_au(teff, lum_solar)
    in_hz = is_in_habitable_zone(row.get("pl_orbsmax"), hz_inner, hz_outer)

    planet_type = classify_planet_type(row.get("pl_rade"), row.get("pl_dens"))
    rotation_state = estimate_rotation_state(row.get("pl_orbsmax"), spectral_type)

    eu_record = exoplanet_eu_data.get(row["pl_name"])
    if eu_record and eu_record.get("molecules"):
        detected_molecules = eu_record["molecules"]
        molecule_source = "exoplanet.eu"
    else:
        mol_data = get_molecule_data(row["pl_name"])  # fallback
        detected_molecules = mol_data["molecules"] if mol_data else None
        molecule_source = "manual_curation" if mol_data else None

    magnetosphere_detected = eu_record.get("magnetic_field") if eu_record else None

    planet = dict(
        planet_name=row["pl_name"], host_name=row["hostname"], is_solar_system=False,
        discovery_year=row.get("disc_year"), discovery_method=row.get("discoverymethod"),

        star_spectral_type=spectral_type, star_teff_k=teff,
        star_color_rgb=star_color_from_teff(teff),
        star_radius_solar=row.get("st_rad"), star_mass_solar=row.get("st_mass"),
        star_age_gyr=row.get("st_age"), star_luminosity_solar=lum_solar,

        orbit_semi_major_axis_au=row.get("pl_orbsmax"),
        orbit_eccentricity=row.get("pl_orbeccen"),
        orbit_inclination_deg=row.get("pl_orbincl"),
        orbit_period_days=row.get("pl_orbper"),
        rotation_state=rotation_state,  # "free" | "resonant" | "synchronous" | None (zie ESTIMATED-heuristiek)
        system_planet_count=row.get("sy_pnum"),

        mass_earth=row.get("pl_masse"), radius_earth=row.get("pl_rade"),
        density_g_cm3=row.get("pl_dens"),
        equilibrium_temp_k=row.get("pl_eqt"), insolation_flux_earth=row.get("pl_insol"),

        distance_from_earth_ly=round(row["sy_dist"] * PARSEC_TO_LY, 2) if row.get("sy_dist") else None,
        hz_inner_au=hz_inner, hz_outer_au=hz_outer, in_habitable_zone=in_hz,

        planet_type=planet_type,
        atmosphere_density=None,  # zelden betrouwbaar af te leiden voor exoplaneten zonder retrieval-analyse
        detected_molecules=detected_molecules, molecule_source=molecule_source,
        c_to_o_ratio=None,  # zelden publiek beschikbaar; hier structureel UNKNOWN tenzij handmatig aangevuld
        # exoplanet.eu geeft alleen "wel/geen veld gedetecteerd", geen sterkte-classificatie
        # zoals bij het zonnestelsel -- vandaar de aparte waarde "detected" i.p.v. strong/weak
        magnetosphere_strength=("detected" if magnetosphere_detected else
                                 ("none" if magnetosphere_detected is False else None)),
        tectonic_activity=None,  # niet meetbaar bij exoplaneten
        moon_count=None, has_rings=None,
    )

    planet["surface_gravity_g"] = surface_gravity_g(planet["mass_earth"], planet["radius_earth"])
    planet["escape_velocity_km_s"] = escape_velocity_km_s(planet["mass_earth"], planet["radius_earth"])
    planet["planet_color_rgb"] = estimate_planet_color(
        planet["planet_type"], planet["equilibrium_temp_k"], detected_molecules)
    planet["visual_tag"] = visual_tag(planet["radius_earth"], planet["equilibrium_temp_k"])

    return planet


def normalize_solar_system_row(row):
    planet = dict(row)
    planet["is_solar_system"] = True
    planet["molecule_source"] = "static_reference"
    planet["discovery_year"] = None
    planet["discovery_method"] = "Direct observation"
    planet["system_planet_count"] = len(SOLAR_SYSTEM_PLANETS)
    planet["insolation_flux_earth"] = None
    planet["distance_from_earth_ly"] = 0.0
    planet["hz_inner_au"], planet["hz_outer_au"] = habitable_zone_au(
        SUN_STAR["star_teff_k"], SUN_STAR["star_luminosity_solar"])
    planet["in_habitable_zone"] = is_in_habitable_zone(
        planet["orbit_semi_major_axis_au"], planet["hz_inner_au"], planet["hz_outer_au"])

    for k, v in SUN_STAR.items():
        planet[k] = v
    planet["star_color_rgb"] = star_color_from_teff(SUN_STAR["star_teff_k"])

    planet["surface_gravity_g"] = surface_gravity_g(planet["mass_earth"], planet["radius_earth"])
    planet["escape_velocity_km_s"] = escape_velocity_km_s(planet["mass_earth"], planet["radius_earth"])
    planet["planet_color_rgb"] = estimate_planet_color(
        planet["planet_type"], planet["equilibrium_temp_k"], planet.get("detected_molecules"))
    planet["visual_tag"] = visual_tag(planet["radius_earth"], planet["equilibrium_temp_k"])
    return planet


def assign_system_position(planets):
    """Rangschikt planeten binnen elk systeem op afstand tot de ster."""
    by_host = defaultdict(list)
    for p in planets:
        by_host[p["host_name"]].append(p)
    for host, group in by_host.items():
        group.sort(key=lambda p: (p["orbit_semi_major_axis_au"] is None, p["orbit_semi_major_axis_au"]))
        for i, p in enumerate(group, start=1):
            p["system_position"] = i
            p["system_planet_count"] = len(group)
    return planets


def compute_scores(planet):
    planet["esi_score"] = earth_similarity_index(
        planet.get("radius_earth"), planet.get("density_g_cm3"),
        planet.get("escape_velocity_km_s"), planet.get("equilibrium_temp_k"))
    planet["habitability_score"] = habitability_score(planet)
    planet["resource_score"] = resource_score(planet)
    planet["confidence_score"] = confidence_score(planet)
    planet["biosignature_candidate"] = biosignature_candidate(planet)
    return planet


def build(limit=None, use_live_api=True, out_path="planets.json"):
    exoplanets_raw = []
    if use_live_api:
        try:
            from fetch_exoplanet_archive import fetch_all_confirmed_planets
            exoplanets_raw = fetch_all_confirmed_planets(limit=limit)
            print(f"Live data opgehaald: {len(exoplanets_raw)} planeten.")
        except Exception as e:
            print(f"Live API niet bereikbaar ({e}); val terug op demo-sample.")
            exoplanets_raw = DEMO_SAMPLE
    else:
        exoplanets_raw = DEMO_SAMPLE

    exoplanet_eu_data = {}
    if use_live_api:
        try:
            from fetch_exoplanet_eu import fetch_atmosphere_data
            exoplanet_eu_data = fetch_atmosphere_data(limit=limit)
            print(f"exoplanet.eu atmosfeerdata opgehaald: {len(exoplanet_eu_data)} planeten met species-data.")
        except Exception as e:
            print(f"exoplanet.eu niet bereikbaar ({e}); molecuuldata valt terug op handmatige tabel.")

    planets = [normalize_exoplanet_row(r, exoplanet_eu_data) for r in exoplanets_raw]
    planets += [normalize_solar_system_row(r) for r in SOLAR_SYSTEM_PLANETS]

    planets = assign_system_position(planets)
    planets = [compute_scores(p) for p in planets]

    with open(out_path, "w") as f:
        json.dump(planets, f, indent=2, default=str)
    print(f"{len(planets)} planeten weggeschreven naar {out_path}")
    return planets


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--limit", type=int, default=None, help="Max aantal exoplaneten (voor testen)")
    parser.add_argument("--out", default="planets.json")
    parser.add_argument("--no-live", action="store_true", help="Forceer demo-sample i.p.v. live API")
    args = parser.parse_args()
    build(limit=args.limit, use_live_api=not args.no_live, out_path=args.out)
