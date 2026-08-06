# Project-context: Exo Index

Dit document vat het volledige ontwerpgesprek samen dat aan dit project
voorafging, inclusief de redenatie ACHTER beslissingen -- niet alleen wat
er gebouwd is, maar waarom. Bedoeld zodat Claude Code (of een toekomstige
sessie) direct verder kan zonder de context opnieuw te hoeven opbouwen.

## Wat dit is

**Naam: Exo Index** (gekozen boven "Exo Score" vanwege de financiele
connotatie die past bij het handelsplatform-aspect, en omdat het beter een
brede catalogus dekt dan een op zichzelf staande rating-tool).

Een platform waarop mensen kunnen "handelen" in fictieve percelen op
exoplaneten en zonnestelselplaneten, gebaseerd op een wetenschappelijk
onderbouwde waarderingsindex. GEEN echte grondeigendom (juridisch
onmogelijk, Outer Space Treaty 1967) -- een gesloten-credits fantasy-
handelsplatform met een freemium-verdienmodel (zie business-beslissingen
hieronder).

## Belangrijke eerdere beslissingen (met redenering)

### Business-model
- Geen echte effecten-/geldhandel: dat zou onder effecten-/kansspelwetgeving
  vallen (Howey-test-achtige toetsen gelden ook binnen de EU). Oplossing:
  gesloten interne credits die NIET inwisselbaar zijn voor echt geld.
- Verdienmodel: freemium-abonnement (Explorer/gratis, Prospector/premium,
  Grondbaron/elite) + cosmetische microtransacties + B2B data-API-licenties.
  Zie de tier-namen terug in `accounts.User.TIER_CHOICES`.

### Databronnen (met reden waarom, niet alleen welke)
- **NASA Exoplanet Archive** (`pscomppars`-tabel, TAP-API) -- hoofdbron voor
  fysieke/orbitale/stellaire data. Wekelijks geupdatet.
- **exoplanet.eu** -- PRIMAIRE bron voor `detected_molecules` (species-kolom)
  en magnetic_field. Ontdekt tijdens het gesprek als beter alternatief dan
  handmatige curatie; heeft een echte TAP/VO-API en CC BY 4.0-licentie
  (commercieel bruikbaar met bronvermelding). Zie `fetch_exoplanet_eu.py`.
- **ExoAtmospheres (IAC)** -- bewust NIET gebruikt. Wel een purpose-built
  molecuulndatabase, maar geen API (robots.txt blokkeert scraping) en
  onduidelijke licentie voor commercieel gebruik. Beslissing: alleen
  gebruiken als exoplanet.eu ooit tekortschiet, en dan via direct contact
  met het IAC-team, niet via scraping.
- **Zonnestelsel**: bewust NIET live opgehaald -- verandert niet, dus een
  statische, handmatig onderhouden dataset (`solar_system_data.py`) is
  passender dan onnodige API-complexiteit.
- **JWST-molecuuldata**: `jwst_molecule_data.py` is een FALLBACK, niet de
  hoofdbron (zie exoplanet.eu hierboven). Blijft nuttig voor de allernieuwste
  detecties die exoplanet.eu nog niet heeft verwerkt.

### Scoringsmodel (drie onafhankelijke scores, bewust niet gemengd)
- `esi_score` -- Earth Similarity Index, gevestigde formule (Schulze-Makuch
  et al. 2011). Let op: scoort Aarde zelf NIET op exact 1.0 (0.916 in de
  praktijk), omdat we overal `equilibrium_temp_k` gebruiken i.p.v. Aardes
  werkelijke oppervlaktetemperatuur -- bewust zo gelaten (zie gesprek: "moet
  niet exact 1.0 zijn").
- `habitability_score` -- eigen 0-100-score, NIET aan Aarde geankerd (kan
  theoretisch >100 ongecapped zijn, capped op 100). Weegt: HZ-ligging,
  sterrentype (G/K beter dan M), massa 0.5-5 M-aarde, eccentriciteit,
  rotatiestaat, atmosfeer-dichtheid, moleculen (CONTEXTGEVOELIG, zie
  biosignature-sectie), C/O-ratio.
- `resource_score` -- volledig losstaand van leefbaarheid, gericht op
  grondstofpotentieel (dichtheid, planeettype, tektoniek, magnetosfeer).
- `confidence_score` -- % van scoring gebaseerd op ECHTE metingen i.p.v.
  aannames. Belangrijk designprincipe door het hele project heen: als iets
  niet gemeten is, blijft het `null`/`None`, NOOIT gegokt of op een
  neutrale waarde gezet die als feit oogt.

### Tri-state in plaats van boolean (herhaald patroon)
Meerdere velden zijn INEENS omgezet van boolean naar een klein enum omdat
de werkelijkheid tussenliggende staten kent:
- `rotation_state`: "free" / "resonant" (bv. Mercurius, 3:2-resonantie) /
  "synchronous" / null. Bij exoplaneten kan de heuristiek alleen
  synchronous/free onderscheiden -- "resonant" alleen handmatig invullen bij
  specifiek gemeten gevallen.
- `magnetosphere_strength`: "strong" / "weak" / "detected" (exoplaneten via
  exoplanet.eu, sterkte onbekend) / "none" / null.
- `tectonic_activity`: "active" / "dormant" (bv. Mars) / "none" / null.
- `atmosphere_density`: "trace" / "thin" / "moderate" / "thick" / "deep".
Als je platform groeit, is dit patroon (boolean -> klein enum met
tussenwaarde) waarschijnlijk ook toe te passen op andere velden.

### Biosignature-logica (belangrijke correctie tijdens het gesprek)
Oorspronkelijk kreeg elke H2O/CO2-detectie een vlakke bonus, ongeacht
context. Terechte kritiek: water op een hete gasreus betekent iets heel
anders dan water+zuurstof op een gematigde rotsachtige planeet. Opgelost:
- Molecuulbonus is nu CONTEXTGEVOELIG (rocky/super-earth vs. gasreus weegt
  anders).
- O2 werd aanvankelijk PER ONGELUK helemaal niet meegewogen -- gefixt.
- Nieuw, apart `biosignature_candidate`-veld (True/False/null): slaat aan
  op O2 + (H2O of CH4) op een gematigde rotsachtige planeet. Bewust LOS
  van de numerieke score gehouden (aparte UI-badge), met verplichte nuance
  in de UI dat dit geen bewijs van leven is (bekende abiotische
  verklaringen bestaan, o.a. foto-dissociatie bij rode dwergen).

### Bugs die zijn opgetreden en gefixt (nuttig om te weten bij verder bouwen)
1. Kleurheuristiek: `"O2" in m` matchte per ongeluk substring binnen "CO2"
   (Venus/Mars kregen onterecht een blauwe "waterwereld"-kleur). Fix:
   exacte token-matching i.p.v. substring-check.
2. `rotation_tidally_locked` stond hardcoded op `None` voor ALLE
   zonnestelselplaneten i.p.v. de juiste waarde -- Aarde miste hierdoor 10
   scorepunten. Gefixt, en meteen uitgebreid naar het tri-state
   `rotation_state`-veld.
3. Bij het herschrijven van Uranus/Neptunus smolten twee dict-definities
   per ongeluk samen tot ongeldige Python-syntax -- opgemerkt bij het
   testen, hersteld voor het de output bereikte.

### Backend-architectuur (waarom Django)
Gekozen boven een lichter framework (bv. FastAPI) OMDAT de vraag naar een
kant-en-klaar admin-portal met gebruikersbeheer centraal stond -- Django's
ingebouwde admin site + auth-systeem geeft dat vrijwel gratis, en de hele
pipeline was toch al in Python geschreven (scoring.py, fetchers).

- **Eigen `accounts.User`-model** i.p.v. Django's standaard: bewust vanaf
  het begin, omdat je dit achteraf niet meer zonder pijnlijke migratie kunt
  vervangen.
- **Django 5.2 LTS gepind** (niet de nieuwste 6.1) omdat de sandbox-omgeving
  toevallig een pre-release Django had die nog niet compatibel was met de
  nieuwste DRF-release -- 5.2 LTS is ook gewoon de juridisch/technisch
  stabielere keuze voor productie.
- **`sync_planets`-management command** ontkoppelt de zware TAP-API-calls
  van de webserver zelf -- draait als losse cronjob, niet in de request-cycle.

### GDPR/AVG (belangrijke openstaande punten, zie PRIVACY.md)
Technisch al opgelost: recht op inzage/portabiliteit (`export_user_data`),
recht op vergetelheid (`anonymize_user` -- behoudt transactiedata i.v.m.
wettelijke bewaarplicht, dit is een AVG-uitzondering, geen omzeiling),
toestemmingsvelden op het User-model.

NOG NIET technisch, wel noodzakelijk (organisatorisch/juridisch, zie
PRIVACY.md voor de volledige lijst): privacybeleid, verwerkersovereenkomsten
met hosting/e-mail/betalingsprovider, EXPLICIET EU-regio kiezen bij
Railway/Render, register van verwerkingsactiviteiten. Gemarkeerd als
blockers voor livegang met echte gebruikers, niet voor de huidige
ontwikkelfase.

## Bestandenoverzicht

```
scoring.py                  -- alle berekeningen (kleur, HZ, ESI, scores, tags)
solar_system_data.py        -- statische zonnestelseldata
jwst_molecule_data.py        -- FALLBACK molecuultabel (exoplanet.eu is primair)
fetch_exoplanet_archive.py  -- NASA Exoplanet Archive TAP-fetcher
fetch_exoplanet_eu.py       -- exoplanet.eu TAP-fetcher (molecules + magnetic_field)
build_database.py           -- orkestreert alles tot een planeten-JSON
catalog/                    -- Django-app: Planet-model, admin, API (DRF)
accounts/                   -- Django-app: User-model, GDPR-commands, portfolio
backend/                    -- Django-projectinstellingen
SCHEMA.md                   -- volledige velddocumentatie met bron+confidence-tier
DEPLOYMENT.md               -- stap-voor-stap Railway-deploymentgids
PRIVACY.md                  -- AVG-overzicht: wat is opgelost, wat moet nog
```

## Openstaande vervolgstappen (nog niet gebouwd, wel besproken)

1. **Frontend/3D-visualisatie** van het roterende stelsel -- geopperd
   (React + Three.js), nog niet uitgevoerd.
2. **Schrijf-API voor het handelsplatform** (planeten daadwerkelijk "kopen",
   portfolio-mutaties, credits-transacties) -- bewust nog niet gebouwd,
   vereist zorgvuldig ontworpen authenticatie- en transactielogica.
3. **Live-testen van de fetchers** -- `fetch_exoplanet_archive.py` en
   `fetch_exoplanet_eu.py` zijn correct volgens de gedocumenteerde
   API-syntax, maar NOOIT live getest tegen de echte endpoints (de
   ontwikkel-sandbox stond die domeinen niet toe). Valideer vooral het
   exacte formaat van exoplanet.eu's `species`-kolom bij eerste gebruik.
4. **Privacybeleid + verwerkersovereenkomsten** -- juridisch traject, zie
   PRIVACY.md.
