const FAQS = [
  {
    q: "Koop ik echt een stuk van een exoplaneet?",
    a: "Nee. Exo Index is volledig fictief entertainment. Volgens het Ruimteverdrag van 1967 kan niemand eigendomsclaims leggen op hemellichamen. Je verzamelt een digitaal spelobject, geen echte grond.",
  },
  {
    q: "Kan ik credits omzetten in echt geld?",
    a: "Nee. Platformcredits zijn gesloten: ze zijn alleen te gebruiken binnen Exo Index en hebben geen waarde of wisselkoers buiten het platform.",
  },
  {
    q: "Waar komen de planeetgegevens vandaan?",
    a: "Voornamelijk uit de NASA Exoplanet Archive en exoplanet.eu, aangevuld met JWST-detecties. Zie de pagina Databronnen voor het volledige overzicht.",
  },
  {
    q: "Wat betekent de biosignature-badge?",
    a: "Die verschijnt bij een specifieke combinatie van gedetecteerde moleculen (zuurstof met water of methaan) op een gematigde rotsplaneet in de leefbare zone. Het is een wetenschappelijk interessant signaal, geen bewijs van leven — er bestaan ook verklaringen zonder biologie.",
  },
  {
    q: "Waarom verandert de prijs van een planeet?",
    a: "De marktwaarde combineert drie lagen: de wetenschappelijke basiswaarde (verandert bij nieuwe metingen), marktsentiment (reageert op nieuws en vervaagt vanzelf) en vraag/aanbod (reageert op koop- en verkoopactiviteit binnen het platform). Zie Hoe werkt het voor de volledige uitleg.",
  },
  {
    q: "Wat is het verschil tussen Explorer, Prospector en Grondbaron?",
    a: "Explorer is de gratis laag waarmee je direct aan de slag kunt. Prospector en Grondbaron zijn betaalde tiers die extra functionaliteit ontgrendelen. Alle tiers gebruiken hetzelfde wetenschappelijke waarderingsmodel.",
  },
  {
    q: "Is mijn score op de Aarde precies 1,0?",
    a: "Nee, bewust niet. De Earth Similarity Index gebruikt voor alle planeten dezelfde berekende evenwichtstemperatuur in plaats van Aardes werkelijke oppervlaktetemperatuur, zodat de vergelijking tussen planeten eerlijk blijft. Daardoor scoort de Aarde zelf net onder de 1,0.",
  },
]

export default function FaqPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12 w-full">
      <h1 className="text-2xl font-semibold text-slate-100 mb-8">Veelgestelde vragen</h1>
      <div className="space-y-8">
        {FAQS.map((f) => (
          <div key={f.q}>
            <h2 className="text-slate-100 font-medium mb-1.5">{f.q}</h2>
            <p className="text-sm text-slate-400 leading-relaxed">{f.a}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
