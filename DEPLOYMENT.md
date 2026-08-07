# Deployment-gids: van lokaal naar online (Render)

Dit project is getest met Django 5.2 LTS + DRF 3.17. Gebruik exact
`requirements.txt` om versieverschillen te voorkomen.

**Waarom Render i.p.v. Railway**: Railway heeft geen gratis tier meer (je
betaalt vanaf dag een). Render heeft dat wel, met bewuste beperkingen (zie
"Wat de gratis tier NIET geeft" hieronder) -- prima voor de huidige
ontwikkelfase, op te schalen zodra het platform echt live gaat voor
gebruikers.

## Stap 0: lokaal draaien (ter controle voordat je deployt)

```bash
pip install -r requirements.txt
python manage.py migrate
python manage.py createsuperuser
python manage.py sync_planets --no-live   # vult de database met demo-data
python manage.py runserver
```
- Admin-portal: http://localhost:8000/admin/
- API: http://localhost:8000/api/planets/

Zodra dit werkt, ben je klaar om te deployen.

## Stap 1: account aanmaken

Maak een account op **render.com**, bij voorkeur door in te loggen met je
GitHub-account (dezelfde login als je `SuperArt87`-repo).

## Stap 2: deployen via Blueprint (render.yaml)

Dit project bevat al een `render.yaml` in de repo-root -- dat beschrijft de
webservice EN de Postgres-database samen, zodat je niet handmatig dingen
hoeft te koppelen in de dashboard.

1. Zorg dat `render.yaml` en `build.sh` op GitHub staan (staan er al na de
   laatste push).
2. In de Render Dashboard: **New** -> **Blueprint**.
3. Selecteer de `exoindex`-GitHub-repository, klik **Connect**.
4. Render herkent `render.yaml` automatisch en toont een preview van de
   services die aangemaakt gaan worden (1 webservice + 1 Postgres-database,
   beide op de gratis tier). Klik **Apply**.
5. Render bouwt en deployt automatisch. Dit duurt een paar minuten bij de
   eerste keer.

`render.yaml` regelt automatisch:
- `DATABASE_URL` -- gekoppeld aan de meegedeployde Postgres-database
- `DJANGO_SECRET_KEY` -- willekeurig gegenereerd door Render zelf
- `DJANGO_DEBUG=False`
- Build-commando (`build.sh`: installeert dependencies, verzamelt static
  files, draait migraties)
- Start-commando (`gunicorn backend.wsgi:application`)

`ALLOWED_HOSTS` hoeft niet handmatig ingesteld te worden op de exacte
`.onrender.com`-naam -- `backend/settings.py` leest Render's eigen
`RENDER_EXTERNAL_HOSTNAME`-variabele automatisch uit.

### Alternatief: handmatig via de dashboard (zonder render.yaml)

Wil je liever alles los aanmaken:
1. **New** -> **PostgreSQL** -> gratis plan, noteer de "Internal Database URL".
2. **New** -> **Web Service** -> koppel de `exoindex`-repo -> taal **Python 3**.
3. Build Command: `./build.sh`. Start Command: `gunicorn backend.wsgi:application`.
4. Onder "Environment" -> "Advanced" de env-vars toevoegen: `DATABASE_URL`
   (de interne database-URL van stap 1), `DJANGO_SECRET_KEY` (klik
   "Generate"), `DJANGO_DEBUG` = `False`.

## Stap 3: eerste keer superuser + data

Na de eerste succesvolle deploy: open de **Shell**-tab van je webservice in
de Render Dashboard en draai:

```bash
python manage.py createsuperuser
python manage.py sync_planets --limit 200   # eerste vulling, klein beginnen
python manage.py apply_resource_discoveries
python manage.py apply_market_events
python manage.py apply_demand_pricing
```

Ga daarna naar `https://<jouw-service>.onrender.com/admin/` en log in.

Let op: de eerste volledige sync (zonder `--limit`) van alle ~6000
exoplaneten kan enkele minuten duren -- dat is normaal voor de TAP-query's.
Dit is ook het eerste échte moment om te ontdekken of de fetchers
(`fetch_exoplanet_archive.py`, `fetch_exoplanet_eu.py`) tegen de
verwachting in toch iets anders teruggeven dan verwacht -- ze zijn nooit
eerder tegen de echte endpoints getest.

## Stap 4: herhaalde sync -- (nog) handmatig op de gratis tier

Render's **Cron Jobs** vereisen een betaald instance-type -- die zitten NIET
in de gratis laag (in tegenstelling tot Railway). Voor nu betekent dit: run
de commando's hierboven af en toe handmatig via de Shell-tab, in deze
volgorde:

```
1. sync_planets                (wekelijks genoeg -- astronomische data verandert traag)
2. apply_resource_discoveries
3. apply_market_events         (vaker zinvol, bv. dagelijks -- marktsentiment beweegt sneller)
4. apply_demand_pricing        (net zo vaak als stap 3)
```

Zodra je opschaalt naar een betaald Render-plan (of teruggaat naar Railway,
dat wel standaard cron-jobs heeft), kun je dit automatiseren met een
losse Cron Job-service per commando, of een enkel commando dat alle vier
achter elkaar aanroept.

## Wat de gratis tier NIET geeft (belangrijke beperkingen)

- **Spint uit na 15 minuten inactiviteit** -- de eerste bezoeker na een
  stille periode wacht ~1 minuut tot de service weer opstart.
- **Gratis Postgres-database verloopt na 30 dagen** -- na die periode moet
  je een nieuwe aanmaken (data gaat dan verloren, tenzij je eerst een
  back-up/dump maakt) of overstappen naar een betaald databaseplan.
- **Bestandssysteem is ephemeral** -- alles wat lokaal op de server
  wordt weggeschreven (behalve de Postgres-database zelf) verdwijnt bij elke
  herstart/redeploy. Niet relevant voor dit project zolang er geen lokale
  bestandsopslag wordt gebruikt (afbeeldingen gaan sowieso via Cloudflare
  R2 zodra dat wordt aangesloten, zie CONTEXT.md).
- **Geen cron jobs** (zie stap 4 hierboven).

Prima voor de huidige ontwikkel-/testfase, niet geschikt om zonder
aanpassingen een permanente, publieke launch op te draaien -- zie ook de
eerdere kostenafweging in CONTEXT.md.

## Wat je NU hebt na deze stappen

- Werkend admin-portal met gebruikersbeheer (`/admin/`) -- planeten
  bekijken/bewerken, gebruikers met tier (free/premium/elite) en
  credits-saldo beheren, MarketEvent/ResourceDiscovery beheren
- Read-only API (`/api/planets/`) klaar voor een frontend
- Handmatig herhaalbare datasync + marktwaarde-pijplijn

## Wat nog ontbreekt (bewuste scope-keuzes voor een volgende stap)

- **Frontend**: nog geen visuele website -- de API is er klaar voor;
  `frontend-demo/OrbitDemo.jsx` bestaat als concept, nog niet gekoppeld
- **CORS-configuratie** -- nodig zodra een frontend op een ander domein
  (bv. Vercel) met deze API gaat praten; `django-cors-headers` staat nog
  niet in `requirements.txt`
- **Schrijf-API voor het handelsplatform** (planeten "kopen", portfolio
  aanpassen, `Transaction`-records aanmaken) -- bewust nog niet gebouwd
- **Auth-API** (registratie/login voor de frontend) -- nu alleen
  Django's ingebouwde admin-login
- **E-mailverificatie/wachtwoord-reset voor gebruikersaccounts** -- Django
  heeft dit ingebouwd, maar vereist een e-mailprovider-configuratie
  (bv. SendGrid) die we nog niet hebben gezet
