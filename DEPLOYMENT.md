# Deployment-gids: van lokaal naar online

Dit project is getest met Django 5.2 LTS + DRF 3.17. Gebruik exact
`requirements.txt` om versieverschillen te voorkomen.

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

## Stap 1: platform kiezen -- Railway (aanbevolen voor jouw niveau)

Railway kiest automatisch de juiste buildpack, koppelt gemakkelijk een
Postgres-database, en heeft ingebouwde cron-jobs. Render is een prima
alternatief met een vergelijkbare workflow als je liever daar zit.

1. Maak een account op railway.app en koppel je GitHub-account
2. Zet dit hele project in een GitHub-repository (`git init`, commit, push)
3. In Railway: "New Project" -> "Deploy from GitHub repo" -> kies je repository
4. Railway herkent Django automatisch via `requirements.txt`

## Stap 2: Postgres-database toevoegen

1. In je Railway-project: "New" -> "Database" -> "PostgreSQL"
2. Railway zet automatisch een `DATABASE_URL`-environment variable klaar
   die door onze `settings.py` wordt opgepikt (zie de `DATABASE_URL`-check
   die we toevoegden) -- je hoeft dus niets handmatig te configureren

## Stap 3: environment variables instellen

In de Railway-projectinstellingen, tab "Variables", zet je:

| Variable | Waarde |
|---|---|
| `DJANGO_SECRET_KEY` | genereer met het commando hieronder |
| `DJANGO_DEBUG` | `False` |
| `DJANGO_ALLOWED_HOSTS` | `jouwapp.up.railway.app` (of je eigen domein zodra gekoppeld) |

Genereer een secret key:
```bash
python3 -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
```

## Stap 4: start-commando instellen

Railway heeft een `Procfile` of expliciet start-commando nodig. Maak een
bestand met de naam `Procfile` (geen extensie) met deze inhoud:

```
release: python manage.py migrate
web: gunicorn backend.wsgi --log-file -
```

De `release`-regel draait migraties automatisch bij elke deploy.

## Stap 5: static files (admin-CSS etc.)

Whitenoise (al in `requirements.txt` en `settings.py` geconfigureerd)
regelt dit automatisch. Voeg dit toe aan je build-instellingen in Railway
("Settings" -> "Build Command"):

```
python manage.py collectstatic --noinput
```

## Stap 6: eerste deploy + superuser aanmaken

Na de eerste succesvolle deploy, open een shell binnen Railway ("Deployments"
-> je laatste deploy -> terminal-icoon) en draai:

```bash
python manage.py createsuperuser
python manage.py sync_planets --limit 200   # eerste vulling, klein beginnen
```

Ga daarna naar `https://jouwapp.up.railway.app/admin/` en log in.

## Stap 7: de sync als terugkerende taak (cron)

Voor het wekelijks verversen van de data (zoals eerder besproken):

1. In Railway: voeg een tweede service toe binnen hetzelfde project,
   type "Cron Job" (of gebruik Railway's ingebouwde Cron-functionaliteit
   onder je service -> "Settings" -> "Cron Schedule")
2. Schema: `0 3 * * 1` (elke maandag 03:00 UTC)
3. Commando: `python manage.py sync_planets`

Let op: de eerste volledige sync (zonder `--limit`) van alle ~6000
exoplaneten kan enkele minuten duren -- dat is normaal voor de TAP-query's.

## Stap 8: domeinnaam koppelen (optioneel, later)

Railway -> je service -> "Settings" -> "Domains" -> "Custom Domain".
Volg de DNS-instructies (meestal een CNAME-record bij je domeinregistrar).

## Wat je NU hebt na deze stappen

- Werkend admin-portal met gebruikersbeheer (`/admin/`) -- planeten
  bekijken/bewerken, gebruikers met tier (free/premium/elite) en
  credits-saldo beheren
- Read-only API (`/api/planets/`) klaar voor een frontend
- Herhaalbare, geautomatiseerde datasync

## Wat nog ontbreekt (bewuste scope-keuzes voor een volgende stap)

- **Frontend**: nog geen visuele website -- de API is er klaar voor
- **Schrijf-API voor het handelsplatform** (planeten "kopen", portfolio
  aanpassen) -- bewust nog niet gebouwd, want vereist authenticatie-flow
  en transactielogica die zorgvuldiger ontworpen moet worden
- **E-mailverificatie/wachtwoord-reset voor gebruikersaccounts** -- Django
  heeft dit ingebouwd, maar vereist een e-mailprovider-configuratie
  (bv. SendGrid) die we nog niet hebben gezet
