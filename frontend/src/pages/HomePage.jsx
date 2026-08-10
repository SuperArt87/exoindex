import { Link } from "react-router-dom"
import logo from "../assets/exoindex-logo-wordmark.png"

const FEATURES = [
  {
    title: "Wetenschappelijk onderbouwd",
    body: "Elke planeet krijgt een leefbaarheids- en grondstofscore op basis van echte data uit de NASA Exoplanet Archive en exoplanet.eu — geen gokwerk, geen zwarte doos.",
  },
  {
    title: "Transparante waardering",
    body: "De marktwaarde is opgebouwd uit duidelijk gescheiden lagen: wetenschap, marktsentiment en vraag/aanbod. Je kunt altijd zien waarom een planeet duurder of goedkoper is geworden.",
  },
  {
    title: "100% fictief, zonder risico",
    body: "Je handelt in gesloten platformcredits, niet in echt geld of echte grondeigendom. Ontdek, verzamel en bouw een portefeuille zonder financieel risico.",
  },
]

export default function HomePage() {
  return (
    <div className="flex-1 flex flex-col">
      <section className="max-w-5xl mx-auto px-4 pt-16 pb-14 text-center w-full">
        <img src={logo} alt="Exo Index" className="h-14 w-auto mx-auto mb-8" />
        <h1 className="text-3xl sm:text-4xl font-semibold text-slate-100 tracking-tight">
          Handel in de meest veelbelovende exoplaneten van de Melkweg
        </h1>
        <p className="mt-4 text-slate-400 text-base sm:text-lg max-w-2xl mx-auto">
          Exo Index is een fictief handelsplatform waarop je percelen op ontdekte exoplaneten
          verzamelt, gewaardeerd op basis van echte astronomische data — van leefbaarheid tot
          grondstofpotentieel.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <Link
            to="/catalogus"
            className="px-5 py-2.5 rounded-md bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-500"
          >
            Bekijk de catalogus
          </Link>
          <Link
            to="/hoe-werkt-het"
            className="px-5 py-2.5 rounded-md border border-slate-700 text-slate-300 text-sm font-medium hover:bg-slate-800"
          >
            Hoe werkt het?
          </Link>
        </div>
      </section>

      <section className="border-t border-slate-900 bg-slate-950/40">
        <div className="max-w-5xl mx-auto px-4 py-14 grid grid-cols-1 sm:grid-cols-3 gap-8">
          {FEATURES.map((f) => (
            <div key={f.title}>
              <h2 className="text-slate-100 font-medium mb-2">{f.title}</h2>
              <p className="text-sm text-slate-400 leading-relaxed">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-4 py-14 w-full text-center">
        <h2 className="text-xl font-semibold text-slate-100 mb-3">
          Van Earth-sized rotsplaneten tot Hot Jupiters
        </h2>
        <p className="text-slate-400 text-sm max-w-2xl mx-auto mb-6">
          Duizenden planeten, elk met een eigen leefbaarheids- en grondstofscore, biosignature-
          status en actuele marktwaarde. Begin gratis als Explorer, of ontgrendel meer als
          Prospector of Grondbaron.
        </p>
        <Link to="/register" className="text-indigo-400 text-sm font-medium hover:text-indigo-300">
          Maak een gratis account →
        </Link>
      </section>
    </div>
  )
}
