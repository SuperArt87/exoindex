/**
 * biosignature_candidate: True/False/null -- puur een UI-signaalvlag, GEEN
 * claim over leven (zie CONTEXT.md/SCHEMA.md). Moet ALTIJD met nuance
 * getoond worden: bekende abiotische verklaringen bestaan (bv.
 * foto-dissociatie bij rode dwergsterren).
 */
export default function BiosignatureBadge({ isCandidate, detailed = false }) {
  if (!isCandidate) return null

  if (!detailed) {
    return (
      <span
        className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-cyan-900/40 text-cyan-300 border border-cyan-800"
        title="O2 + H2O/CH4 gedetecteerd -- geen bewijs van leven"
      >
        Biosignature-kandidaat
      </span>
    )
  }

  return (
    <div className="rounded-md border border-cyan-800 bg-cyan-900/20 p-3 text-sm">
      <p className="text-cyan-300 font-medium mb-1">Biosignature-kandidaat</p>
      <p className="text-slate-300">
        Op deze planeet zijn zowel O2 als H2O of CH4 gedetecteerd, in een
        gematigde, rotsachtige context -- wetenschappelijk interessant, maar
        <strong> geen bewijs van leven</strong>. Er bestaan bekende
        abiotische (niet-biologische) verklaringen voor zulke combinaties,
        bijvoorbeeld foto-dissociatie van water bij rode dwergsterren.
      </p>
    </div>
  )
}
