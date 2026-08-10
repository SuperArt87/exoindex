const SOURCES = [
  {
    name: "NASA Exoplanet Archive",
    role: "Hoofdbron voor fysieke, orbitale en stellaire data (de pscomppars-tabel). Wekelijks bijgewerkt.",
    license: "Publiek beschikbaar (NASA, publiek domein).",
  },
  {
    name: "exoplanet.eu",
    role: "Primaire bron voor gedetecteerde moleculen en magnetische-veldgegevens.",
    license: "CC BY 4.0 — commercieel bruikbaar met bronvermelding.",
  },
  {
    name: "JWST-molecuuldata",
    role: "Aanvullende bron voor de nieuwste moleculaire detecties die nog niet in exoplanet.eu zijn verwerkt.",
    license: "Publiek beschikbaar onderzoeksdata.",
  },
  {
    name: "Zonnestelseldata",
    role: "Voor de acht planeten van ons eigen zonnestelsel gebruiken we een statische, handmatig samengestelde dataset — deze verandert immers niet.",
    license: "Samengesteld op basis van publiek beschikbare NASA-gegevens.",
  },
]

export default function DataSourcesPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12 w-full">
      <h1 className="text-2xl font-semibold text-slate-100 mb-3">Databronnen</h1>
      <p className="text-slate-400 text-sm leading-relaxed mb-10">
        Elke score op Exo Index is herleidbaar tot publiek beschikbare astronomische data. Hieronder
        de bronnen die we gebruiken, en waarvoor.
      </p>

      <div className="space-y-6">
        {SOURCES.map((s) => (
          <div key={s.name} className="rounded-md border border-slate-800 p-4">
            <h2 className="text-slate-100 font-medium mb-1">{s.name}</h2>
            <p className="text-sm text-slate-400 leading-relaxed mb-2">{s.role}</p>
            <p className="text-xs text-slate-500">{s.license}</p>
          </div>
        ))}
      </div>

      <p className="text-xs text-slate-600 mt-10">
        Atmosferische data: exoplanet.eu, CC BY 4.0. Exo Index is niet aangesloten bij of onderschreven
        door NASA of exoplanet.eu.
      </p>
    </div>
  )
}
