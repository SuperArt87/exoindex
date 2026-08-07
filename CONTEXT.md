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

## Kostenstrategie Railway (verspreid besproken, hier samengevat)

Dit stond eerder verspreid over losse Q&A's in het gesprek -- hier bij
elkaar gezet zodat het niet verloren gaat.

### Het fundamentele inzicht: Railway rekent draaitijd, geen events

Kosten ontstaan door HOE LANG services draaien (compute-tijd), niet door
hoe vaak iemand inlogt of een API-request doet. Een gebruikerslogin is
gewoon een HTTP-request, geen apart afrekenmoment. Dit betekent: de
grootste kostenposten zijn de ALTIJD-AAN componenten (webserver, Postgres),
niet het aantal gebruikers op zich (bij bescheiden schaal).

### Database-grootte: EMPIRISCH getest, geen zorg

6000 synthetische testplaneten (evenveel als de volledige NASA Exoplanet
Archive) met alle ~50 velden ingevuld = 3,04 MB in SQLite. Zelfs met
Postgres-overhead (indexen, tuple-headers) ruim onder 15 MB voor de
VOLLEDIGE catalogus. Dit is GEEN kostenfactor, ongeacht hoe het platform
groeit qua planeten (het aantal is sowieso begrensd tot de bekende
exoplaneten, in tegenstelling tot bv. gebruikersdata die wel lineair
meegroeit).

### De grootste kostenval: afbeeldingen/egress -- en hoe we die vermeden hebben

Kernprincipe: **nooit afbeeldingen serveren via Railway/Django zelf** --
elke keer dat een bezoeker een afbeelding laadt via de eigen app-service,
telt dat mee in Railway's gemeten dataverkeer (~$0,05/GB). Bij een
beeldzware site loopt dat snel op (voorbeeld uit het gesprek: 2TB/maand
aan afbeeldingen = ~$100/maand via Railway, vs. ~$0 via de onderstaande
aanpak).

Drieledige oplossing, in volgorde van belangrijkheid:

1. **Procedurele planeten-rendering (grootste besparing)**: exoplaneten
   hebben sowieso GEEN echte foto's (alles is artistieke interpretatie) --
   dus render ze client-side met Three.js op basis van `planet_color_rgb`/
   `star_color_rgb`/`rotation_state`/`orbit_eccentricity` (data die je
   toch al via de API stuurt) i.p.v. afbeeldingsbestanden. Nul opslag,
   nul egress, voor de KERN van het product (duizenden planeten). Zie
   `frontend-demo/OrbitDemo.jsx`.
2. **Cloudflare R2 voor de weinige ECHTE afbeeldingen die overblijven**
   (zonnestelsel-teksturen -- deze bestaan wel echt en zijn publiek domein
   NASA-beeldmateriaal -- en UI/merch-assets): R2 heeft $0 egress (in
   tegenstelling tot Railway/S3) en een gratis tier van 10GB opslag,
   waarschijnlijk voor jaren voldoende voor dit platform. NOG NIET
   aangesloten in code (geen `django-storages`-configuratie aanwezig) --
   alleen de architectuurkeuze staat vast.
3. **Cloudflare Pages/Vercel voor de frontend zelf** (HTML/JS/CSS-bundle,
   los van de afbeeldingen): onbeperkte/genereuze gratis bandbreedte voor
   statische site-hosting, dus de frontend-deploy zelf hoeft niet via
   Railway te lopen. Railway blijft gereserveerd voor backend+database+
   cronjobs, waar het wel om draait.

### Praktisch advies dat nog niet als concrete actie is vastgelegd

- Zet een spending limit/alert in Railway's dashboard (voorkomt verrassingen,
  geen technische implementatie nodig, is een dashboard-instelling)
- Kies bij het aanmaken van de Railway-services EXPLICIET een EU-regio --
  dit raakt zowel de AVG-dataresidentie-eis (zie PRIVACY.md) als (vaak)
  lagere latency voor een overwegend Europese doelgroep
- WebP/AVIF i.p.v. PNG/JPEG voor de wel-noodzakelijke zonnestelsel-
  afbeeldingen -- verlaagt zowel opslag als egress, ongeacht welke
  provider je uiteindelijk kiest

---

## VERVOLG: marktwaarde-architectuur (na de vorige handoff toegevoegd)

Dit hele hoofdstuk is uitgewerkt NA het moment waarop de vorige versie van
dit document werd gemaakt. De marktwaarde is uitgegroeid van "1 simpel
scoreveld" naar een pipeline van VIER opeenvolgende commands, elk met een
eigen, bewust gescheiden verantwoordelijkheid. Draai ze ALTIJD in deze
volgorde:

```
1. sync_planets               -- wetenschap: NASA/exoplanet.eu -> base_resource_score, habitability_score, esi_score
2. apply_resource_discoveries -- blijvende vondsten (bv. mineraalontdekkingen) -> resource_score
3. apply_market_events        -- macro/nieuws (missies, marktsentiment) -> base_market_value_credits, market_sentiment_multiplier
4. apply_demand_pricing       -- eigen platformactiviteit (koop/verkoop) -> demand_multiplier, FINALE market_value_credits
```

### De volledige formule, van boven naar beneden

```
combined = 0,5 x habitability_score + 0,5 x resource_score        [structureel 50/50, ALTIJD]

base_market_value_credits = combined x 100 x schaarste_bonus x confidence_factor
    schaarste_bonus    = max(0,5, 1 - afstand_lichtjaar/5000)      [zonnestelsel/onbekend: 1,0]
    confidence_factor  = 0,45 + 0,55 x (confidence_score/100)      [0,45x-1,0x -- zie sectie confidence hieronder]

market_sentiment_multiplier = max(0,1; 1 + Som(tijdvervallen effecten van actieve MarketEvent-objecten))
    per event: effect = magnitude x 0,5^(verstreken_dagen/half_life_days)

demand_multiplier = max(0,1; 1 + clip(0,03 x netto_transacties_7dagen, -0,25, +0,25))

market_value_credits = base_market_value_credits x market_sentiment_multiplier x demand_multiplier
```

**Waarom drie multiplicatieve lagen i.p.v. één grote formule**: elke laag
heeft een fundamenteel ander "ritme" van verandering. Wetenschap verandert
wekelijks (nieuwe metingen), marktsentiment beweegt dagelijks (beursdata,
nieuws) en vervalt vanzelf (half-life), vraag/aanbod beweegt continu (elke
transactie). Door ze als aparte, na elkaar draaiende commands te bouwen
i.p.v. één monolithische berekening, kan elke laag op zijn eigen frequentie
draaien zonder de andere te verstoren.

### Nieuwe modellen (allemaal in catalog/models.py, behalve Transaction)

- **`MarketEvent`** -- macro/nieuws-laag. Categorieen: space_mission,
  tech_breakthrough, market_sentiment, discovery. Heeft EEN scope
  (global/system/planet_type/planet) en een half-life (vervalt vanzelf).
  BELANGRIJKE ETHISCHE REGEL (staat ook in de admin-hulptekst): categorie
  market_sentiment mag NOOIT expliciet naar echte oorlogen/tragedies
  verwijzen in titel/beschrijving -- alleen abstract ("marktstabiliteits-
  correctie"), nooit gekoppeld aan een specifiek echt conflict.
- **`ResourceDiscovery`** -- BLIJVENDE (geen vervaltijd) vondst, bv. een
  diamantafzetting. Ontstond uit een expliciete gebruikersvraag: "een
  diamantvondst moet resource_score raken, niet habitability_score, en
  moet blijvend zijn, geen tijdelijk sentiment". Vandaar de aparte
  base_resource_score (pure formule) vs. resource_score (base + som van
  geverifieerde ResourceDiscovery-bonussen) -- exact hetzelfde patroon als
  base_market_value_credits vs. market_value_credits.
- **`Transaction`** (in accounts/models.py) -- ECHT transactielogboek
  (elke koop/verkoop-actie apart), in tegenstelling tot `PortfolioEntry`
  (dat toont alleen de HUIDIGE bezitsstatus). Bron voor demand_multiplier.
  LET OP: de daadwerkelijke koop/verkoop-endpoint (waar dit model door
  gevuld zou moeten worden) is nog NIET gebouwd -- dit is puur de
  prijsvormings-kant, klaar om te consumeren zodra die endpoint er is.

### fetch_market_sentiment.py -- geautomatiseerde beursdata-formule

Ontstond uit: "ik wil dit niet handmatig invullen, te foutgevoelig" +
"neem ook Europese/Aziatische beurzen mee, niet alleen VS". Eindresultaat,
in volgorde van toevoeging tijdens het gesprek:

1. Basis: Nasdaq-koersverandering, gedempt (factor 0,3) en begrensd (±15%)
2. Uitgebreid naar 3 regio's, gelijk gewogen: US_NASDAQ (^IXIC),
   EU_STOXX50 (^STOXX50E), ASIA_NIKKEI225 (^N225)
3. Verder verfijnd met (op gebruikersverzoek "zijn optie 2/3 ingewikkeld?"):
   - Voortschrijdend gemiddelde (3-daags venster) i.p.v. twee losse
     dagpunten -- voorkomt dat 1 rare handelsdag domineert
   - VIX-angstindicator (`^VIX`) als EXTRA dempingsfactor (nooit
     versterkend) -- `1 / (1 + 0,02 x max(0, VIX - 19))`
   - Ruimtevaart-ETF (`ARKX`) toegevoegd met dubbel gewicht t.o.v. de
     brede indices, want thematisch relevanter voor dit platform

BELANGRIJKE, EXPLICIET BENOEMDE BEPERKING (nog niet opgelost): de
constanten (dempingsfactor 0,3, VIX-baseline 19, VIX-sensitiviteit 0,02,
caps) zijn beargumenteerde aannames, GEEN historisch teruggetoetste
waarden. Backtesten tegen historische koersdata is nog niet gedaan.

### Confidence-score: twee iteraties, met een geleerde les

Gebruikersvraag: "kunnen bekende exoplaneten meer opvallen qua confidence?"
Eerste poging (band verbreden van 0,6-1,0 naar 0,3-1,0) werkte AVERECHTS --
de marktwaarde van HD 209458 b (een zeer bekende, goed gekarakteriseerde
planeet) DAALDE ondanks een hogere confidence-score, omdat de bredere band
alles harder afstraft tenzij confidence flink genoeg meestijgt om dat te
compenseren. Grondoorzaak gevonden: `detected_molecules` telde als plat
ja/nee-vakje -- 1 molecuul en 4 moleculen gaven exact hetzelfde krediet.

Uiteindelijke fix (beide tegelijk nodig):
- `confidence_score`: moleculen-rijkdom telt nu gedeeltelijk mee,
  `min(1, aantal_moleculen/3)` i.p.v. een vlak 0/1
- `confidence_factor`-band teruggezet naar een minder extreme 0,45-1,0
  (niet de oorspronkelijke 0,6-1,0, ook niet de te agressieve 0,3-1,0)

LES VOOR VERVOLGWERK: bij het aanpassen van een van de multiplicatieve
lagen, altijd controleren of de interactie met de ONDERLIGGENDE
scoreverdeling het gewenste effect ook echt oplevert -- een geïsoleerd
"logische" aanpassing kan averechts uitpakken door interactie-effecten.
Dit is nu twee keer gebeurd in dit project (zie ook de rotation_state-bug
hieronder) en is dus een patroon om alert op te blijven.

### Overige aanpassingen aan de bestaande scoringsformules

- HZ-status "onbekend": gaf voorheen 15 punten (=50% van het maximum),
  verlaagd naar 10 -- beloonde datagebrek te veel t.o.v. bevestigd
  binnen de HZ (30 punten).
- Magnetosfeer telt nu OOK mee in `habitability_score` (was voorheen
  alleen in resource_score) -- beschermt een atmosfeer tegen zonnewind-
  erosie (zie Mars), dus terecht ook relevant voor leefbaarheid.
  Gewicht: strong=6, weak/detected=3, none=0 (bewust kleiner dan
  atmosfeer zelf, want het is een BESCHERMENDE factor, geen directe
  leefbaarheidsvoorwaarde).
- `rotation_state="resonant"` (bv. Mercurius) gaf voorheen 6 punten,
  verlaagd naar 4 -- een gebruiker wees er terecht op dat een extreem
  lange dag/nacht-cyclus (Mercurius: ~176 aardse dagen) al een zware
  leefbaarheids-handicap is, ook al is het technisch geen permanente
  dag/nachtzijde zoals bij "synchronous" (2 punten).
- `demand_multiplier`-cap verlaagd van ±50% naar ±25% -- was voorheen
  ruimer dan market_sentiment_multiplier (±15%), nu meer in balans.

### sync_planets.py: race-condition-fix (belangrijk voor een handelsplatform)

Gebruikersvraag: "als de sync op een vast, voorspelbaar moment draait,
kunnen mensen daar dan niet op inspelen (front-running)?" Twee antwoorden:
1. Beleidsmatig: verberg het exacte cron-tijdstip, randomiseer binnen een
   venster, overweeg een korte handelspauze tijdens de sync (nog NIET
   geimplementeerd, wel besproken).
2. Technisch, WEL geimplementeerd: de update-loop in sync_planets.py stond
   niet in een transactie -- bij een sync van minuten (bij ~6000 planeten)
   zag de API tussentijds een mix van oude en nieuwe waarden. Gefixt met
   `transaction.atomic()` om de hele loop -- alle wijzigingen worden nu in
   een klap zichtbaar, nooit gedeeltelijk.

### Frontend: procedurele planeet-visualisatie (concept-demo gebouwd)

Vraag: "kunnen we afbeeldingen/CDN-kosten vermijden?" Antwoord: exoplaneten
hebben sowieso geen echte foto's (alles is artistieke interpretatie), dus
render ze client-side met Three.js op basis van `planet_color_rgb`/
`star_color_rgb` i.p.v. afbeeldingsbestanden op te slaan/serveren --
nul opslag, nul egress, en het is ook nog eens beter animeerbaar dan een
statische afbeelding (rotatie, elliptische baan o.b.v. echte eccentriciteit,
atmosfeer-gloed als losse transparante sphere). Zie `frontend-demo/OrbitDemo.jsx`
-- een werkende, geteste demo met 5 planeten die correct om een ster
draaien inclusief eccentrische banen en rotation_state-afhankelijke
eigen rotatie. Nog GEEN productie-integratie met de echte API-data.

### Architectuurbeslissingen die BESPROKEN maar NIET geimplementeerd zijn

- **Object storage (Cloudflare R2)** voor de weinige ECHTE afbeeldingen die
  nog wel nodig zijn (zonnestelsel-teksturen, UI-assets) -- CC BY 4.0/
  publiek-domein NASA-beeldmateriaal past ruim binnen R2's gratis tier
  (10GB gratis opslag, altijd $0 egress). Nog niet aangesloten in code.
- **Frontend-hosting**: Vercel/Cloudflare Pages voor de React/Three.js-kant,
  Railway blijft alleen voor backend+database+cronjobs. Reden: Vercel's
  serverless-functies zijn architecturaal ongeschikt voor WebSockets
  (nodig voor toekomstige live-koersupdates) en lange cronjobs.
- **Node.js/Express als alternatief voor Django**: afgewogen, niet gekozen
  voor nu (zou scoring.py/fetchers moeten herschrijven, admin-portal
  zelf moeten bouwen), maar WEL kansrijk voor een toekomstige, aparte
  microservice specifiek voor live WebSocket-koersupdates naast de
  bestaande Django-backend.

## Bijgewerkt bestandenoverzicht

```
scoring.py                     -- alle berekeningen (kleur, HZ, ESI, scores, tags, marktwaarde-formules)
solar_system_data.py           -- statische zonnestelseldata
jwst_molecule_data.py          -- FALLBACK molecuultabel (exoplanet.eu is primair)
fetch_exoplanet_archive.py     -- NASA Exoplanet Archive TAP-fetcher
fetch_exoplanet_eu.py          -- exoplanet.eu TAP-fetcher (molecules + magnetic_field)
fetch_market_sentiment.py      -- NIEUW: beursdata -> sentiment-magnitude (VS/EU/Azie + ARKX + VIX)
build_database.py              -- orkestreert wetenschap tot een planeten-JSON
catalog/
  models.py                    -- Planet (nu met base_resource_score/base_market_value_credits/
                                   market_sentiment_multiplier/demand_multiplier), MarketEvent, ResourceDiscovery
  admin.py                     -- admin-portal-configuratie voor alle drie modellen
  management/commands/
    sync_planets.py            -- stap 1, nu met transaction.atomic() (race-condition-fix)
    apply_resource_discoveries.py  -- NIEUW: stap 2
    apply_market_events.py     -- stap 3, schrijft NIET meer het finale market_value_credits
    apply_demand_pricing.py    -- NIEUW: stap 4 (laatste), combineert alle lagen
accounts/
  models.py                    -- User, PortfolioEntry, Transaction (NIEUW), GDPR-velden/commands
  management/commands/
    export_user_data.py, anonymize_user.py  -- AVG-commands (ongewijzigd)
backend/                       -- Django-projectinstellingen
frontend-demo/
  OrbitDemo.jsx                -- NIEUW: werkende Three.js-demo, procedurele planeten+animatie
SCHEMA.md                      -- volledige velddocumentatie met bron+confidence-tier
DEPLOYMENT.md                  -- stap-voor-stap Railway-deploymentgids
PRIVACY.md                     -- AVG-overzicht: wat is opgelost, wat moet nog
CONTEXT.md                     -- dit document
```

## Bijgewerkte openstaande vervolgstappen

1. **Frontend-integratie**: `OrbitDemo.jsx` bestaat als concept-demo met
   hardcoded voorbeelddata -- nog NIET gekoppeld aan de echte `/api/planets/`-
   endpoint. Logische volgende stap.
2. **Schrijf-API voor het handelsplatform** (planeten daadwerkelijk "kopen",
   wat `Transaction`-records zou aanmaken die `demand_multiplier` voedt) --
   nog steeds niet gebouwd. Nu extra relevant omdat de prijsvormings-kant
   (`apply_demand_pricing`) er al wel klaar voor staat.
3. **Live-testen van ALLE drie de fetchers** (`fetch_exoplanet_archive.py`,
   `fetch_exoplanet_eu.py`, `fetch_market_sentiment.py`) -- geen van drie
   ooit live getest, want de sandbox stond die domeinen niet toe. Test
   vooral: exoplanet.eu's `species`-veldformaat, en yfinance/Yahoo Finance's
   antwoordformaat voor `^IXIC`/`^STOXX50E`/`^N225`/`ARKX`/`^VIX`.
4. **Backtesten van de marktsentiment-constanten** (dempingsfactor, VIX-
   parameters, caps) tegen historische koersdata -- nu meerdere
   samenwerkende constanten, nog geen van allen empirisch gevalideerd.
5. **Cron-scheduling voor de nieuwe commands**: `apply_market_events` en
   vooral `apply_demand_pricing` zouden vaker moeten draaien dan de
   wekelijkse `sync_planets` (marktsentiment/vraag bewegen sneller dan
   astronomische data) -- nog geen concreet schema afgesproken.
6. **Beleidsmatige front-running-bescherming**: cron-tijdstip verbergen/
   randomiseren, eventueel een korte handelspauze tijdens sync -- alleen
   de technische race-condition is gefixt, het beleidsmatige stuk nog niet.
7. **Object storage (R2) daadwerkelijk aansluiten** voor de zonnestelsel-
   teksturen en UI-assets -- alleen besproken, nog geen `django-storages`-
   configuratie in de code.
8. **Privacybeleid + verwerkersovereenkomsten** -- juridisch traject, zie
   PRIVACY.md (ongewijzigd sinds vorige handoff).
