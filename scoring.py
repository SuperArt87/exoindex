"""
Alle afgeleide berekeningen: sterkleur, habitable zone, planeetclassificatie,
planeetkleur-heuristiek, en de drie scores (ESI, habitability, resource) plus
een confidence-score die aangeeft hoeveel van de score op echte metingen
berust versus aannames.
"""
import math

EARTH_RADIUS_KM = 6371.0
EARTH_MASS_KG = 5.972e24
G_CONST = 6.674e-11
SOLAR_RADIUS_TO_AU = 0.00465047


# ---------------------------------------------------------------------------
# Sterkleur uit temperatuur (blackbody-benadering, Mitchell Charity-methode,
# vereenvoudigd tot een paar ankerpunten + lineaire interpolatie)
# ---------------------------------------------------------------------------
_TEFF_COLOR_ANCHORS = [
    (2000, (255, 122, 61)),    # M-dwerg, diep oranje-rood
    (3500, (255, 165, 90)),
    (5000, (255, 210, 161)),   # K-dwerg, zachtgeel
    (5778, (255, 244, 234)),   # G-ster (zon), wit-geel
    (7500, (202, 215, 255)),   # F-ster, wit-blauw
    (10000, (170, 191, 255)),  # A-ster
    (25000, (155, 176, 255)),  # O/B-ster, blauw
]


def star_color_from_teff(teff_k):
    """Retourneert RGB-tuple. Tier: MODELED."""
    if teff_k is None:
        return None
    anchors = _TEFF_COLOR_ANCHORS
    if teff_k <= anchors[0][0]:
        return anchors[0][1]
    if teff_k >= anchors[-1][0]:
        return anchors[-1][1]
    for (t1, c1), (t2, c2) in zip(anchors, anchors[1:]):
        if t1 <= teff_k <= t2:
            frac = (teff_k - t1) / (t2 - t1)
            return tuple(round(c1[i] + frac * (c2[i] - c1[i])) for i in range(3))
    return anchors[-1][1]


def spectral_type_from_teff(teff_k):
    """Ruwe indeling als st_spectype ontbreekt. Tier: MODELED."""
    if teff_k is None:
        return None
    bounds = [(30000, "O"), (10000, "B"), (7500, "A"), (6000, "F"),
              (5200, "G"), (3700, "K"), (0, "M")]
    for limit, letter in bounds:
        if teff_k >= limit:
            return letter
    return "M"


# ---------------------------------------------------------------------------
# Habitable zone -- vereenvoudigde Kopparapu et al. (2013) benadering
# HZ-afstand (AU) = sqrt(L_star / S_eff), met lineaire teff-correctie
# ---------------------------------------------------------------------------
def habitable_zone_au(star_teff_k, star_luminosity_solar):
    if star_teff_k is None or star_luminosity_solar is None:
        return None, None
    t_star = star_teff_k - 5780
    # Seff coefficients voor 'moist greenhouse' (binnengrens) en
    # 'maximum greenhouse' (buitengrens), Kopparapu et al. 2013, vereenvoudigd
    seff_inner = 1.0140 + 8.1774e-5 * t_star + 1.7063e-9 * t_star**2
    seff_outer = 0.3438 + 5.8942e-5 * t_star + 1.6558e-9 * t_star**2
    inner_au = math.sqrt(star_luminosity_solar / seff_inner)
    outer_au = math.sqrt(star_luminosity_solar / seff_outer)
    return round(inner_au, 3), round(outer_au, 3)


def is_in_habitable_zone(semi_major_axis_au, hz_inner, hz_outer):
    if None in (semi_major_axis_au, hz_inner, hz_outer):
        return None
    return hz_inner <= semi_major_axis_au <= hz_outer


# ---------------------------------------------------------------------------
# Planeetclassificatie op basis van straal/dichtheid
# ---------------------------------------------------------------------------
def classify_planet_type(radius_earth, density_g_cm3=None):
    if radius_earth is None:
        return None
    if radius_earth < 1.75:
        return "rocky"
    if radius_earth < 3.0:
        if density_g_cm3 and density_g_cm3 > 3.5:
            return "super_earth"
        return "sub_neptune"
    if radius_earth < 6.0:
        return "ice_giant"
    return "gas_giant"


# ---------------------------------------------------------------------------
# Visuele classificatietag (bv. "Hot Jupiter", "Cold Sub-Earth") -- LOS van
# het waarderingsmodel, puur voor UI/weergave. Combineert een groottelabel
# (dezelfde categorieen die NASA's eigen exoplaneet-visualisaties gebruiken)
# met een temperatuurlabel op basis van de evenwichtstemperatuur.
# ---------------------------------------------------------------------------
def size_label(radius_earth):
    if radius_earth is None:
        return None
    if radius_earth < 0.8:
        return "Sub-Earth"
    if radius_earth < 1.25:
        return "Earth-sized"
    if radius_earth < 2.0:
        return "Super-Earth"
    if radius_earth < 4.0:
        return "Sub-Neptune"
    if radius_earth < 8.0:
        return "Neptune"
    return "Jupiter"


def temperature_label(eq_temp_k):
    if eq_temp_k is None:
        return None
    if eq_temp_k < 200:
        return "Cold"
    if eq_temp_k < 350:
        return "Warm"
    if eq_temp_k < 1000:
        return "Hot"
    return "Ultra-hot"


def visual_tag(radius_earth, eq_temp_k):
    """Retourneert bv. 'Hot Jupiter', 'Cold Sub-Earth'. None als een van
    beide inputs ontbreekt -- geen tag tonen is beter dan een gokje."""
    size = size_label(radius_earth)
    temp = temperature_label(eq_temp_k)
    if size is None or temp is None:
        return None
    return f"{temp} {size}"


# ---------------------------------------------------------------------------
# Planeetkleur -- ARTISTIEKE HEURISTIEK, geen meting. Combineert type,
# evenwichtstemperatuur en (indien bekend) gedetecteerde moleculen.
# ---------------------------------------------------------------------------
def estimate_planet_color(planet_type, eq_temp_k, molecules=None):
    molecules = molecules or []
    if planet_type == "gas_giant":
        base = (222, 184, 135) if (eq_temp_k or 0) < 150 else (230, 160, 110)
    elif planet_type == "ice_giant":
        base = (140, 200, 230)
    elif planet_type in ("rocky", "super_earth"):
        molecule_tokens = {m.split(" ")[0] for m in molecules}  # strip "(trace)"/"(tentative)"-suffixen
        if "H2O" in molecule_tokens or "O2" in molecule_tokens:
            base = (90, 140, 210)   # water/zuurstof aanwezig -> blauwig, aardachtig
        elif eq_temp_k and eq_temp_k > 600:
            base = (150, 80, 60)    # verzengd, gesteentekleurig rood-bruin
        else:
            base = (170, 140, 110)  # kaal gesteente, neutraal bruin-grijs
    else:
        base = (180, 180, 190)  # sub-Neptune / onbekend, neutraal
    return base


# ---------------------------------------------------------------------------
# Rotatiestaat -- drie mogelijke waarden i.p.v. alleen True/False:
#   "free"        -> vrije rotatie, geen spin-baan-koppeling (zoals de Aarde)
#   "resonant"    -> spin-baanresonantie zonder volledige vergrendeling
#                    (zoals Mercurius, 3:2-resonantie: wél een dag/nacht-cyclus,
#                    maar niet zo evenwichtig als vrije rotatie)
#   "synchronous" -> volledige 1:1 getijdevergrendeling (permanente dag/nachtzijde)
#   None          -> onbekend/niet gemeten
#
# Bij exoplaneten is dit vrijwel nooit direct gemeten. De heuristiek hieronder
# kan alleen onderscheid maken tussen "synchronous" en "free" op basis van
# afstand tot de ster -- resonante staten zoals bij Mercurius zijn met de
# huidige exoplaneetdata niet betrouwbaar te detecteren en blijven "free" als
# beste benadering, tenzij een specifieke planeet dit uit de literatuur heeft
# (dan handmatig invullen, net als bij het zonnestelsel).
# ---------------------------------------------------------------------------
def estimate_rotation_state(semi_major_axis_au, star_spectral_type):
    if semi_major_axis_au is None:
        return None
    threshold = 0.05 if (star_spectral_type or "").startswith("M") else 0.02
    return "synchronous" if semi_major_axis_au <= threshold else "free"


# ---------------------------------------------------------------------------
# Fysieke afgeleiden
# ---------------------------------------------------------------------------
def surface_gravity_g(mass_earth, radius_earth):
    if not mass_earth or not radius_earth:
        return None
    return round(mass_earth / (radius_earth ** 2), 3)  # in eenheden van g_aarde


def escape_velocity_km_s(mass_earth, radius_earth):
    if not mass_earth or not radius_earth:
        return None
    m = mass_earth * EARTH_MASS_KG
    r = radius_earth * EARTH_RADIUS_KM * 1000
    v = math.sqrt(2 * G_CONST * m / r) / 1000
    return round(v, 2)


# ---------------------------------------------------------------------------
# Earth Similarity Index -- gevestigde formule (Schulze-Makuch et al. 2011)
# ---------------------------------------------------------------------------
def earth_similarity_index(radius_earth, density_g_cm3, escape_vel_km_s, eq_temp_k):
    ref = dict(radius=1.0, density=5.514, escape_vel=11.19, temp=288.0)
    weights = dict(radius=0.57, density=1.07, escape_vel=0.70, temp=5.58)
    vals = dict(radius=radius_earth, density=density_g_cm3,
                escape_vel=escape_vel_km_s, temp=eq_temp_k)
    if any(v is None for v in vals.values()):
        return None
    terms = []
    for key in ref:
        x, x0, w = vals[key], ref[key], weights[key]
        term = (1 - abs((x - x0) / (x + x0))) ** (w / 4)
        terms.append(term)
    esi = 1
    for t in terms:
        esi *= t
    return round(esi, 3)


# ---------------------------------------------------------------------------
# Habitability score (0-100) -- eigen samengestelde score
# ---------------------------------------------------------------------------
def habitability_score(planet):
    if planet.get("in_habitable_zone") is False:
        # buiten de HZ: harde beperking, maar niet automatisch 0 --
        # geef een lage basisscore i.p.v. de planeet volledig diskwalificeren,
        # zodat randgevallen (net buiten HZ-grens) niet onterecht op 0 staan
        score = 5
    else:
        score = 30 if planet.get("in_habitable_zone") else 15  # None (onbekend) = neutraal laag

    star_type = (planet.get("star_spectral_type") or "")[:1]
    star_points = {"G": 20, "K": 18, "F": 12, "M": 6}.get(star_type, 8)
    score += star_points

    mass = planet.get("mass_earth")
    if mass is not None:
        score += 20 if 0.5 <= mass <= 5 else max(0, 20 - abs(mass - 2.75) * 2)

    ecc = planet.get("orbit_eccentricity")
    if ecc is not None:
        score += 10 * max(0, 1 - ecc / 0.3)

    rotation_state = planet.get("rotation_state")
    rotation_points = {"free": 10, "resonant": 6, "synchronous": 2}.get(rotation_state, 0)
    score += rotation_points

    # Een gebalanceerde, matige atmosfeer (zoals de Aarde) is ideaal; te dun
    # biedt weinig bescherming/broeikaseffect, te dik overhit (Venus), "deep"
    # (gasreuzen) en "none" hebben geen vast oppervlak/geen bescherming.
    atmo_points = {"moderate": 8, "thin": 4, "thick": 3, "trace": 1, "deep": 0, "none": 0}.get(
        planet.get("atmosphere_density"), 0)
    score += atmo_points

    # Moleculen -- CONTEXTGEVOELIG in plaats van vlak. Dezelfde detectie
    # betekent iets heel anders op een hete gasreus (triviaal, water zit
    # overal) dan op een gematigde rotsachtige planeet (potentieel signaal).
    molecules = planet.get("detected_molecules") or []
    tokens = {m.split(" ")[0] for m in molecules}  # strip "(trace)"/"(tentative)"
    has_h2o, has_co2, has_o2, has_ch4 = ("H2O" in tokens, "CO2" in tokens,
                                          "O2" in tokens, "CH4" in tokens)
    rocky_context = planet.get("planet_type") in ("rocky", "super_earth")
    temperate_context = planet.get("in_habitable_zone") is True

    if has_h2o:
        score += 3 if rocky_context else 1
    if has_co2:
        score += 2
    if has_o2:
        score += 3 if rocky_context else 0.5  # O2 op een gasreus is weinig zeggend

    # Biosignature-synergie: O2 samen met H2O of CH4, specifiek op een
    # gematigde rotsachtige planeet, is een erkend (maar niet doorslaggevend)
    # signaal in de astrobiologie. Losse detecties worden nooit zo hoog
    # gewaardeerd als deze combinatie -- vandaar een aparte, forse bonus i.p.v.
    # gewoon de losse punten optellen.
    if rocky_context and temperate_context and has_o2 and (has_h2o or has_ch4):
        score += 15

    c_o = planet.get("c_to_o_ratio")
    if c_o is not None:
        score += 5 * max(0, 1 - abs(c_o - 0.55) / 0.55)

    return round(min(100, max(0, score)), 1)


def biosignature_candidate(planet):
    """
    True/False/None -- puur een UI-signaalvlag, GEEN claim over leven.
    True betekent: O2 + (H2O of CH4) gedetecteerd op een gematigde rotsachtige
    planeet -- wetenschappelijk interessant, maar met bekende abiotische
    verklaringen (bv. foto-dissociatie bij rode dwergsterren). Toon dit altijd
    met die nuance in de UI, nooit als "leven gevonden".
    """
    molecules = planet.get("detected_molecules")
    if molecules is None:
        return None  # onbekend, niet "nee"
    tokens = {m.split(" ")[0] for m in molecules}
    has_o2, has_h2o, has_ch4 = "O2" in tokens, "H2O" in tokens, "CH4" in tokens
    rocky_context = planet.get("planet_type") in ("rocky", "super_earth")
    temperate_context = planet.get("in_habitable_zone") is True
    return bool(rocky_context and temperate_context and has_o2 and (has_h2o or has_ch4))


# ---------------------------------------------------------------------------
# Resource score (0-100) -- losstaand van leefbaarheid
# ---------------------------------------------------------------------------
def resource_score(planet):
    score = 0
    density = planet.get("density_g_cm3")
    ptype = planet.get("planet_type")

    if ptype in ("rocky", "super_earth") and density:
        score += min(40, density * 6)  # hoge dichtheid -> metaalrijke kern-indicatie
    if ptype == "gas_giant":
        score += 35  # speculatieve waarde: volatiles / He-3
    if ptype == "ice_giant":
        score += 30  # waterijs / vluchtige stoffen

    magnetosphere_points = {"strong": 10, "weak": 5, "detected": 6, "none": 0}.get(
        planet.get("magnetosphere_strength"), 0)
    score += magnetosphere_points

    tectonic_points = {"active": 15, "dormant": 7, "none": 0}.get(planet.get("tectonic_activity"), 0)
    score += tectonic_points

    radius = planet.get("radius_earth")
    if radius:
        score += min(15, radius * 3)  # grotere planeet = meer totaal volume grondstoffen

    return round(min(100, score), 1)


# ---------------------------------------------------------------------------
# Confidence score -- percentage kernvelden dat MEASURED is i.p.v. onbekend/geschat
# ---------------------------------------------------------------------------
CONFIDENCE_FIELDS = [
    "mass_earth", "radius_earth", "density_g_cm3", "orbit_eccentricity",
    "equilibrium_temp_k", "atmosphere_density", "detected_molecules",
    "c_to_o_ratio", "magnetosphere_strength", "tectonic_activity",
]


def confidence_score(planet):
    known = 0
    for f in CONFIDENCE_FIELDS:
        v = planet.get(f)
        if v not in (None, [], ""):
            known += 1
    return round(100 * known / len(CONFIDENCE_FIELDS), 1)
