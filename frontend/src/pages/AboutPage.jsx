export default function AboutPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12 w-full">
      <h1 className="text-2xl font-semibold text-slate-100 mb-3">Over Exo Index</h1>
      <p className="text-slate-400 text-sm leading-relaxed mb-8">
        Exo Index is een fantasy-handelsplatform waarop je percelen op exoplaneten en
        zonnestelselplaneten verzamelt, gewaardeerd door een wetenschappelijk onderbouwde index in
        plaats van willekeur.
      </p>

      <h2 className="text-lg font-semibold text-slate-100 mb-2">Geen echte grondeigendom</h2>
      <p className="text-sm text-slate-400 leading-relaxed mb-6">
        Alles op Exo Index is fictief. Volgens het Ruimteverdrag van 1967 (Outer Space Treaty) kan
        geen enkel land of individu eigendomsclaims leggen op hemellichamen — het kopen van een
        "perceel" op Exo Index geeft dan ook op geen enkele manier echte, juridisch afdwingbare
        grondeigendom. Je verzamelt een fictief bezit binnen een spel, niets meer en niets minder.
      </p>

      <h2 className="text-lg font-semibold text-slate-100 mb-2">Gesloten credits, geen echt geld</h2>
      <p className="text-sm text-slate-400 leading-relaxed mb-6">
        Je handelt met platformcredits die je op Exo Index verdient of aanschaft. Deze credits zijn
        niet inwisselbaar voor echt geld en hebben geen waarde buiten het platform. Exo Index is
        geen effecten- of beleggingsproduct en biedt geen financieel rendement.
      </p>

      <h2 className="text-lg font-semibold text-slate-100 mb-2">Hoe we het draaiend houden</h2>
      <p className="text-sm text-slate-400 leading-relaxed mb-6">
        Exo Index werkt met een freemium-model: gratis starten als <span className="text-slate-300">Explorer</span>,
        met optionele upgrades naar <span className="text-slate-300">Prospector</span> of{" "}
        <span className="text-slate-300">Grondbaron</span> voor extra functionaliteit, plus
        optionele cosmetische extra's. Zo blijft de kern van het platform gratis toegankelijk.
      </p>

      <h2 className="text-lg font-semibold text-slate-100 mb-2">Waarom we dit bouwen</h2>
      <p className="text-sm text-slate-400 leading-relaxed">
        Er is een schat aan publiek beschikbare exoplaneetdata die voor de meeste mensen ontoegankelijk
        blijft achter wetenschappelijke tabellen. Exo Index maakt die data tastbaar en speels, zonder
        de wetenschap geweld aan te doen — elke score is terug te herleiden tot echte metingen. Lees
        meer over de scoringsmethode op de pagina <a href="/hoe-werkt-het" className="text-indigo-400 hover:text-indigo-300">Hoe werkt het</a>.
      </p>
    </div>
  )
}
