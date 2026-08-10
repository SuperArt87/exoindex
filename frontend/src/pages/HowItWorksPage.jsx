const SCORES = [
  {
    name: "Earth Similarity Index (ESI)",
    body: "Een gevestigde wetenschappelijke formule (Schulze-Makuch et al., 2011) die uitdrukt hoe fysiek vergelijkbaar een planeet is met de Aarde, op basis van straal, dichtheid, ontsnappingssnelheid en evenwichtstemperatuur. Let op: de Aarde zelf scoort geen exacte 1.0 — we gebruiken voor alle planeten dezelfde berekende evenwichtstemperatuur in plaats van Aardes werkelijke oppervlaktetemperatuur, voor een eerlijke onderlinge vergelijking.",
  },
  {
    name: "Leefbaarheidsscore (0-100)",
    body: "Onze eigen samengestelde score, los van de ESI. Weegt onder andere: ligging in de leefbare zone, het type ster, massa, baanexcentriciteit, rotatiestaat, atmosfeerdichtheid, magnetosfeer en gedetecteerde moleculen. Moleculen wegen contextgevoelig mee — water op een hete gasreus betekent iets heel anders dan water én zuurstof op een gematigde rotsplaneet.",
  },
  {
    name: "Grondstofscore (0-100)",
    body: "Volledig losstaand van leefbaarheid. Gebaseerd op dichtheid (metaalrijke kern-indicatie), planeettype, tektonische activiteit en magnetosfeersterkte. Een gloeiend hete gasreus kan dus een hoge grondstofscore hebben en tegelijk een lage leefbaarheidsscore.",
  },
  {
    name: "Confidence-score",
    body: "Het percentage van de score dat op echte metingen berust in plaats van aannames. Wat niet gemeten is, blijft onbekend — we gokken nooit een neutrale waarde die als feit oogt. Een planeet met een rijk gekarakteriseerd spectrum (meerdere gedetecteerde moleculen) krijgt een hogere confidence dan een planeet met slechts een losse detectie.",
  },
]

const VALUE_LAYERS = [
  {
    name: "1. Wetenschappelijke basiswaarde",
    body: "Combineert leefbaarheids- en grondstofscore (elk voor de helft), met een schaarstepremie voor planeten die dichter bij de Aarde staan en een correctie voor lage confidence. Verandert alleen bij nieuwe astronomische metingen.",
  },
  {
    name: "2. Marktsentiment",
    body: "Een macro-laag die reageert op nieuws — ruimtemissies, technologische doorbraken, algemeen beursklimaat. Effecten vervallen vanzelf na verloop van tijd (half-life), net als echt marktnieuws langzaam uit het geheugen verdwijnt.",
  },
  {
    name: "3. Vraag en aanbod",
    body: "De laatste laag reageert op activiteit binnen het platform zelf: veel kopers duwen de prijs omhoog, veel verkopers duwen 'm omlaag — begrensd, zodat een enkele grote transactie de prijs niet laat ontsporen.",
  },
]

export default function HowItWorksPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12 w-full">
      <h1 className="text-2xl font-semibold text-slate-100 mb-3">Hoe werkt Exo Index?</h1>
      <p className="text-slate-400 text-sm leading-relaxed mb-10">
        Elke planeet in de catalogus krijgt vier onafhankelijke scores en een marktwaarde die is
        opgebouwd uit duidelijk gescheiden lagen. Geen zwarte doos: de waardering is altijd terug
        te leiden tot echte astronomische data.
      </p>

      <h2 className="text-lg font-semibold text-slate-100 mb-4">De vier scores</h2>
      <div className="space-y-6 mb-12">
        {SCORES.map((s) => (
          <div key={s.name} className="border-l-2 border-indigo-600/60 pl-4">
            <h3 className="text-slate-100 font-medium mb-1">{s.name}</h3>
            <p className="text-sm text-slate-400 leading-relaxed">{s.body}</p>
          </div>
        ))}
      </div>

      <h2 className="text-lg font-semibold text-slate-100 mb-4">Hoe de marktwaarde tot stand komt</h2>
      <p className="text-sm text-slate-400 leading-relaxed mb-6">
        De uiteindelijke prijs van een planeet is de wetenschappelijke basiswaarde, vermenigvuldigd
        met marktsentiment en vraag/aanbod. Drie lagen met een eigen ritme van verandering, in
        plaats van één ondoorzichtige formule:
      </p>
      <div className="space-y-6 mb-12">
        {VALUE_LAYERS.map((l) => (
          <div key={l.name} className="border-l-2 border-emerald-600/60 pl-4">
            <h3 className="text-slate-100 font-medium mb-1">{l.name}</h3>
            <p className="text-sm text-slate-400 leading-relaxed">{l.body}</p>
          </div>
        ))}
      </div>

      <h2 className="text-lg font-semibold text-slate-100 mb-3">Biosignature-kandidaten</h2>
      <p className="text-sm text-slate-400 leading-relaxed">
        Sommige planeten krijgen een biosignature-badge: zuurstof samen met water of methaan,
        gedetecteerd op een gematigde rotsachtige planeet in de leefbare zone. Dit is een
        wetenschappelijk interessant signaal — <span className="text-slate-300">geen bewijs van
        leven</span>. Er bestaan bekende verklaringen zonder biologie, zoals fotodissociatie bij
        rode dwergsterren.
      </p>
    </div>
  )
}
