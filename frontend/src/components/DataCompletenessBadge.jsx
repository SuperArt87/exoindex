/**
 * confidence_score: percentage van de scoring gebaseerd op ECHTE metingen
 * i.p.v. aannames (zie SCHEMA.md). Expliciet tonen i.p.v. verbergen --
 * belangrijk designprincipe van dit project (nooit data-gebrek verhullen).
 */
export default function DataCompletenessBadge({ confidenceScore }) {
  if (confidenceScore === null || confidenceScore === undefined) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-slate-800 text-slate-400 border border-slate-700">
        Data onbekend
      </span>
    )
  }

  const tone =
    confidenceScore >= 60
      ? "bg-emerald-900/40 text-emerald-300 border-emerald-800"
      : confidenceScore >= 30
        ? "bg-amber-900/40 text-amber-300 border-amber-800"
        : "bg-slate-800 text-slate-400 border-slate-700"

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs border ${tone}`}>
      {Math.round(confidenceScore)}% gemeten
    </span>
  )
}
