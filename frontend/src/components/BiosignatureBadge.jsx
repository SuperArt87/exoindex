import { Trans, useTranslation } from "react-i18next"

/**
 * biosignature_candidate: True/False/null -- puur een UI-signaalvlag, GEEN
 * claim over leven (zie CONTEXT.md/SCHEMA.md). Moet ALTIJD met nuance
 * getoond worden: bekende abiotische verklaringen bestaan (bv.
 * foto-dissociatie bij rode dwergsterren).
 */
export default function BiosignatureBadge({ isCandidate, detailed = false }) {
  const { t } = useTranslation()
  if (!isCandidate) return null

  if (!detailed) {
    return (
      <span
        className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-cyan-900/40 text-cyan-300 border border-cyan-800"
        title={t("biosignature.tooltip")}
      >
        {t("biosignature.badge")}
      </span>
    )
  }

  return (
    <div className="rounded-md border border-cyan-800 bg-cyan-900/20 p-3 text-sm">
      <p className="text-cyan-300 font-medium mb-1">{t("biosignature.badge")}</p>
      <p className="text-slate-300">
        <Trans i18nKey="biosignature.body" components={[<strong />]} />
      </p>
    </div>
  )
}
