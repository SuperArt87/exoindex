export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12 w-full">
      <h1 className="text-2xl font-semibold text-slate-100 mb-3">Privacybeleid</h1>

      <div className="rounded-md border border-amber-700/40 bg-amber-950/20 px-4 py-3 mb-8">
        <p className="text-sm text-amber-300/90 leading-relaxed">
          Dit is een conceptversie, nog niet juridisch getoetst. Voordat Exo Index live gaat met
          echte gebruikersgegevens, wordt dit document nagelopen door een jurist.
        </p>
      </div>

      <h2 className="text-lg font-semibold text-slate-100 mb-2">Welke gegevens we verzamelen</h2>
      <p className="text-sm text-slate-400 leading-relaxed mb-6">
        We beperken ons bewust tot het minimum: gebruikersnaam, e-mailadres, je account-tier en je
        creditsaldo. Geen overbodige velden, geen gegevens die we niet nodig hebben om het
        platform te laten werken.
      </p>

      <h2 className="text-lg font-semibold text-slate-100 mb-2">Waarom we ze verzamelen</h2>
      <p className="text-sm text-slate-400 leading-relaxed mb-6">
        Om je account te beheren, je portefeuille en transacties bij te houden, en — als je daar
        toestemming voor geeft — om je op de hoogte te houden van nieuwe functies.
      </p>

      <h2 className="text-lg font-semibold text-slate-100 mb-2">Jouw rechten</h2>
      <p className="text-sm text-slate-400 leading-relaxed mb-6">
        Je hebt recht op inzage en overdraagbaarheid van je gegevens, en recht op vergetelheid.
        Bij een verzoek tot verwijdering anonimiseren we je persoonsgegevens; transactiegegevens
        bewaren we in dat geval alleen nog in geanonimiseerde vorm, voor zover wettelijk vereist.
      </p>

      <h2 className="text-lg font-semibold text-slate-100 mb-2">Bewaartermijn</h2>
      <p className="text-sm text-slate-400 leading-relaxed mb-6">
        We bewaren accountgegevens zolang je account actief is. Bij langdurige inactiviteit
        hanteren we een nader te bepalen bewaartermijn, die in een definitieve versie van dit
        beleid wordt vastgelegd.
      </p>

      <h2 className="text-lg font-semibold text-slate-100 mb-2">Cookies</h2>
      <p className="text-sm text-slate-400 leading-relaxed mb-6">
        We gebruiken alleen functionele cookies die nodig zijn om je ingelogd te houden. Zodra we
        analytics- of marketingcookies toevoegen, vragen we daar eerst expliciet toestemming voor.
      </p>

      <h2 className="text-lg font-semibold text-slate-100 mb-2">Vragen</h2>
      <p className="text-sm text-slate-400 leading-relaxed">
        Heb je vragen over je gegevens of wil je een van bovenstaande rechten uitoefenen? Neem
        contact met ons op via het e-mailadres dat bij je account hoort.
      </p>
    </div>
  )
}
