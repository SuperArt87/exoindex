# AVG/GDPR-overzicht

Dit document scheidt bewust wat **technisch al is opgelost** van wat
**een juridische/organisatorische beslissing van jou** vereist. Ik ben geen
jurist -- voor de definitieve inrichting (met name het privacybeleid en de
verwerkersovereenkomsten) raad ik aan een jurist of gespecialiseerd
adviesbureau te laten meekijken voordat je live gaat met echte gebruikers.

## Wat nu technisch geregeld is

- **Recht op inzage/dataportabiliteit** (art. 15/20): `python manage.py export_user_data <username>`
- **Recht op vergetelheid** (art. 17): `python manage.py anonymize_user <username> --confirm`
  -- wist persoonsgegevens, behoudt transacties voor fiscale bewaarplicht
  (dit is een expliciete AVG-uitzondering, geen omzeiling)
- **Toestemmingsregistratie**: `terms_accepted_at`, `privacy_policy_version_accepted`,
  `marketing_consent` (+tijdstempel) staan al op het User-model
- **Dataminimalisatie**: alleen username/e-mail/tier/credits worden opgeslagen,
  geen overbodige velden

## Wat jij nog moet regelen (organisatorisch/juridisch)

### 1. Privacybeleid en algemene voorwaarden
Verplicht voordat je persoonsgegevens verwerkt. Moet minimaal bevatten:
welke gegevens je verzamelt, waarom (rechtsgrond), hoe lang je ze bewaart,
en hoe gebruikers hun rechten kunnen uitoefenen. Laat dit opstellen of
controleren door een jurist -- een generieke template is een risico zodra
je een handelsplatform met echte betalingen wordt.

### 2. Verwerkersovereenkomsten (DPA's)
Met elke partij die namens jou persoonsgegevens verwerkt:
- **Hostingprovider** (Railway/Render) -- vraag na of ze een standaard-DPA
  aanbieden (de meeste grote providers wel)
- **E-mailprovider** zodra je die toevoegt (bv. SendGrid, Postmark)
- **Betalingsprovider** zodra het handelsplatform live gaat (bv. Stripe/Mollie)

### 3. Data-residentie
Kies bij Railway/Render expliciet een **EU-regio** voor zowel de webservice
als de Postgres-database. Dit voorkomt discussies over doorgifte van
persoonsgegevens buiten de EU (met VS-gehoste servers moet je anders
aanvullende waarborgen zoals Standard Contractual Clauses regelen).

### 4. Cookiebanner/toestemming (zodra de frontend er is)
Alleen noodzakelijk voor functionele cookies (bv. inlogsessie) is geen
toestemming vereist. Zodra je analytics, marketing-tracking, of
advertentiecookies toevoegt, is een cookiebanner met opt-in verplicht.

### 5. Bewaartermijnen
Er is nu geen automatische opschoning van oude/inactieve accounts. Bepaal
een bewaartermijn (bv. "na 3 jaar inactiviteit" -- moet in je privacybeleid
staan) en bouw hier op termijn een geplande taak voor, vergelijkbaar met
`sync_planets`.

### 6. Register van verwerkingsactiviteiten (art. 30)
Formeel verplicht voor de meeste organisaties (kleine uitzondering bestaat,
maar is smal en risicovol om op te steunen). Praktisch: een simpel document
dat bijhoudt welke persoonsgegevens je verwerkt, met welk doel, op welke
rechtsgrond, en hoe lang. Dit hoeft geen ingewikkeld systeem te zijn --
een bijgehouden Word/Sheet-document volstaat voor een platform van deze
omvang.

### 7. Data Protection Officer (DPO)
Waarschijnlijk (nog) niet verplicht voor een platform van deze schaal --
dit wordt relevant bij grootschalige of stelselmatige verwerking. Zodra je
platform groeit, is dit een moment om opnieuw te beoordelen (met een jurist).

## Samenvatting: wel/niet blocker voor launch

| Item | Blocker voor live gaan met echte gebruikers? |
|---|---|
| Privacybeleid + voorwaarden | **Ja** |
| Verwerkersovereenkomsten hosting | **Ja** |
| EU-dataresidentie | **Ja** (of alternatieve waarborgen) |
| Export/anonimisering (technisch) | Al geregeld |
| Cookiebanner | Pas relevant zodra frontend + tracking er is |
| Register verwerkingsactiviteiten | **Ja**, maar simpel op te zetten |
| DPO | Waarschijnlijk nog niet nodig |
