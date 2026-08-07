# Planeet-database schema

Elke planeet (zonnestelsel + exoplaneet) krijgt hetzelfde record. Velden zijn
gegroepeerd per doel (visueel / leefbaarheid / grondstoffen) en gemarkeerd met
een bron en een confidence-tier:

- **MEASURED** — direct gemeten of afgeleid uit een primaire meting
- **MODELED** — berekend met een gevestigde wetenschappelijke formule op basis
  van gemeten input (bv. HZ-grenzen, ESI)
- **ESTIMATED** — heuristische inschatting bij ontbrekende data (bv. kleur,
  tidal locking-kans) — altijd expliciet gelabeld, nooit stilzwijgend als feit
  gepresenteerd
- **UNKNOWN** — niet gemeten en niet betrouwbaar te schatten; blijft `null`

## Identificatie
| Veld | Bron | Tier |
|---|---|---|
| `planet_name`, `host_name` | Exoplanet Archive / statisch | MEASURED |
| `is_solar_system` | afgeleid | MEASURED |
| `discovery_year`, `discovery_method` | Exoplanet Archive | MEASURED |

## Visueel — ster
| Veld | Bron | Tier |
|---|---|---|
| `star_spectral_type` | Exoplanet Archive (`st_spectype`), anders afgeleid uit `st_teff` | MEASURED/MODELED |
| `star_teff_k` | Exoplanet Archive (`st_teff`) | MEASURED |
| `star_color_rgb` | blackbody-benadering o.b.v. `st_teff` (Mitchell Charity-methode) | MODELED |
| `star_radius_solar`, `star_mass_solar`, `star_age_gyr`, `star_luminosity_solar` | Exoplanet Archive | MEASURED |

## Visueel — classificatietag
| Veld | Bron | Tier |
|---|---|---|
| `visual_tag` | afgeleid: temperatuurlabel (Cold/Warm/Hot/Ultra-hot, o.b.v. `equilibrium_temp_k`) + groottelabel (Sub-Earth/Earth-sized/Super-Earth/Sub-Neptune/Neptune/Jupiter, o.b.v. `radius_earth`) -- bv. "Hot Jupiter", "Cold Sub-Earth". Puur voor UI-weergave, telt niet mee in `habitability_score`/`resource_score` | MODELED |

## Visueel — planeet & systeem
| Veld | Bron | Tier |
|---|---|---|
| `orbit_semi_major_axis_au` | Exoplanet Archive (`pl_orbsmax`) | MEASURED |
| `orbit_eccentricity` | Exoplanet Archive (`pl_orbeccen`) | MEASURED (vaak ontbrekend → dan UNKNOWN, niet 0 aannemen) |
| `orbit_inclination_deg`, `orbit_period_days` | Exoplanet Archive | MEASURED |
| `rotation_state` | `"free"` \| `"resonant"` \| `"synchronous"` \| `null`. Bij exoplaneten: heuristiek o.b.v. afstand tot ster (ESTIMATED); alleen "synchronous"/"free" te onderscheiden. Bij zonnestelsel: MEASURED, inclusief "resonant" voor Mercurius (3:2 spin-baanresonantie) | MEASURED (zonnestelsel) / ESTIMATED (exoplaneten) |
| `system_planet_count` | afgeleid: aantal records met zelfde `host_name` | MEASURED |
| `system_position` | afgeleid: rangorde op `orbit_semi_major_axis_au` | MEASURED |
| `planet_type` | classificatie o.b.v. straal/massa/dichtheid (rocky / super-Earth / sub-Neptune / ice giant / gas giant) | MODELED |
| `planet_color_rgb` | heuristiek o.b.v. `planet_type` + evenwichtstemperatuur + (indien bekend) gedetecteerde moleculen | ESTIMATED — nooit als "gemeten kleur" tonen |
| `moon_count` | statisch (zonnestelsel) / Exoplanet Archive waar bekend | MEASURED, meestal UNKNOWN bij exoplaneten |
| `has_rings` | statisch / literatuur | MEASURED waar bekend, anders UNKNOWN |

## Fysiek
| Veld | Bron | Tier |
|---|---|---|
| `mass_earth`, `radius_earth`, `density_g_cm3` | Exoplanet Archive | MEASURED |
| `surface_gravity_g`, `escape_velocity_km_s` | berekend uit massa+straal | MODELED |
| `equilibrium_temp_k` | Exoplanet Archive (`pl_eqt`) | MEASURED |
| `insolation_flux_earth` | Exoplanet Archive (`pl_insol`) | MEASURED |

## Ster & baan — leefbaarheidscontext
| Veld | Bron | Tier |
|---|---|---|
| `distance_from_earth_ly` | Exoplanet Archive (`sy_dist`, parsec → ly) | MEASURED |
| `hz_inner_au`, `hz_outer_au` | Kopparapu et al.-benadering o.b.v. `st_teff`+`st_lum` | MODELED |
| `in_habitable_zone` | afgeleid: ligt `orbit_semi_major_axis_au` tussen HZ-grenzen | MODELED |
| `star_type_suitability` | G/K hoog, F/M laag (regel-gebaseerd) | MODELED |

## Atmosfeer & samenstelling
| Veld | Bron | Tier |
|---|---|---|
| `has_atmosphere_detected` | afgeleid uit `detected_molecules` (aanwezig = detectie) | MEASURED waar bekend, anders UNKNOWN |
| `atmosphere_density` | `"trace"` \| `"thin"` \| `"moderate"` \| `"thick"` \| `"deep"` \| `null`. Zonnestelsel: MEASURED. Exoplaneten: zelden betrouwbaar af te leiden zonder retrieval-analyse, blijft meestal `null` | MEASURED (zonnestelsel) / UNKNOWN (exoplaneten) |
| `detected_molecules` | **primair: exoplanet.eu `species`-kolom** (TAP-API, wekelijks te verversen, CC BY 4.0). Fallback: handmatig gecureerde JWST/HST-tabel (`JWST_MOLECULE_DATA`) voor de allernieuwste detecties die exoplanet.eu nog niet heeft | MEASURED waar aanwezig |
| `molecule_source` | `"exoplanet.eu"` \| `"manual_curation"` \| `"static_reference"` (zonnestelsel) \| `null`. Traceert waar `detected_molecules` vandaan komt | — |
| `co2_h2o_present` | afgeleid uit `detected_molecules` | MEASURED waar bekend |
| `c_to_o_ratio` | literatuur (zelden beschikbaar) | MEASURED waar bekend, anders UNKNOWN |
| `magnetosphere_strength` | `"strong"` \| `"weak"` \| `"detected"` \| `"none"` \| `null`. Zonnestelsel: fijne sterkte-classificatie (MEASURED). Exoplaneten: exoplanet.eu `magnetic_field`-kolom geeft alleen aanwezig/afwezig, dus `"detected"` (sterkte onbekend) i.p.v. `"strong"`/`"weak"` | MEASURED (zonnestelsel + exoplaneten waar exoplanet.eu data heeft) / UNKNOWN anders |
| `tectonic_activity` | `"active"` \| `"dormant"` \| `"none"` \| `null` (n.v.t. bij gas-/ijsreuzen). Alleen bekend voor zonnestelsel | MEASURED (zonnestelsel) / UNKNOWN (exoplaneten) |

**Bronattributie verplicht**: exoplanet.eu is CC BY 4.0 -- vermeld dit duidelijk op je platform (bv. footer: "Atmospheric data: exoplanet.eu, CC BY 4.0") zodra je deze bron live gebruikt.

## Scores (berekend, zie `scoring.py`-functies)
| Veld | Betekenis |
|---|---|
| `esi_score` | Earth Similarity Index (0-1), gevestigde formule |
| `habitability_score` | eigen samengestelde 0-100 score o.b.v. HZ, sterrentype, massa/straal, eccentriciteit, atmosfeer, magnetosfeer, C/O. Molecuulbonus is CONTEXTGEVOELIG: dezelfde detectie weegt zwaarder op een gematigde rotsachtige planeet dan op een hete gasreus |
| `base_resource_score` | pure formule (dichtheid/type/magnetosfeer/tektoniek/straal), herberekend bij elke `sync_planets`-run |
| `resource_score` | `base_resource_score` + som van geverifieerde `ResourceDiscovery`-bonussen (blijvend, geen vervaltijd). Wordt NOOIT door `sync_planets` overschreven -- alleen door `apply_resource_discoveries` |
| `confidence_score` | 0-100, % van scoring gebaseerd op gemeten i.p.v. geschatte velden. `detected_molecules` telt gedeeltelijk mee naar rijkdom (`min(1, aantal/3)`), niet als plat ja/nee-vakje |
| `biosignature_candidate` | `True`/`False`/`null` -- UI-signaalvlag, GEEN claim over leven. `True` = O2 samen met H2O of CH4 gedetecteerd op een gematigde (`in_habitable_zone=True`) rotsachtige planeet |

## Marktwaarde (drie lagen, elk door een apart command bijgewerkt)
| Veld | Betekenis | Bijgewerkt door |
|---|---|---|
| `base_market_value_credits` | `(0,5×habitability + 0,5×resource) × 100 × schaarste_bonus × confidence_factor` | `apply_market_events` |
| `market_sentiment_multiplier` | macro/nieuws-laag, 0,1-onbegrensd naar boven maar events zelf begrensd op ±15% na demping | `apply_market_events` |
| `demand_multiplier` | eigen platform-vraag (koop/verkoop-activiteit laatste 7 dagen), begrensd op ±25% | `apply_demand_pricing` |
| `market_value_credits` | FINAAL: `base × sentiment × demand` | `apply_demand_pricing` (laatste stap) |

Zie `CONTEXT.md` voor de volledige formules en de redenering achter elke
constante (dempingsfactoren, caps, VIX-gevoeligheid).

## Belangrijke datalimitatie om te communiceren op de website
Bij verreweg de meeste exoplaneten zijn rotatiesnelheid, magnetosfeer,
platentektoniek en exacte kleur **niet gemeten**. Toon dit expliciet
(bv. een "Data completeness"-badge) in plaats van deze velden stilzwijgend
in te vullen — dat is zowel wetenschappelijk correcter als beter voor
gebruikersvertrouwen in het platform.
