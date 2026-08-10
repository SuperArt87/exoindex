import { Trans, useTranslation } from "react-i18next"

export default function HowItWorksPage() {
  const { t } = useTranslation()
  const scoresRaw = t("howItWorks.scores", { returnObjects: true })
  const layersRaw = t("howItWorks.valueLayers", { returnObjects: true })
  const scores = Array.isArray(scoresRaw) ? scoresRaw : []
  const layers = Array.isArray(layersRaw) ? layersRaw : []

  return (
    <div className="max-w-3xl mx-auto px-4 py-12 w-full">
      <h1 className="text-2xl font-semibold text-slate-100 mb-3">{t("howItWorks.title")}</h1>
      <p className="text-slate-400 text-sm leading-relaxed mb-10">{t("howItWorks.intro")}</p>

      <h2 className="text-lg font-semibold text-slate-100 mb-4">{t("howItWorks.scoresTitle")}</h2>
      <div className="space-y-6 mb-12">
        {scores.map((s) => (
          <div key={s.name} className="border-l-2 border-indigo-600/60 pl-4">
            <h3 className="text-slate-100 font-medium mb-1">{s.name}</h3>
            <p className="text-sm text-slate-400 leading-relaxed">{s.body}</p>
          </div>
        ))}
      </div>

      <h2 className="text-lg font-semibold text-slate-100 mb-4">{t("howItWorks.valueTitle")}</h2>
      <p className="text-sm text-slate-400 leading-relaxed mb-6">{t("howItWorks.valueIntro")}</p>
      <div className="space-y-6 mb-12">
        {layers.map((l) => (
          <div key={l.name} className="border-l-2 border-emerald-600/60 pl-4">
            <h3 className="text-slate-100 font-medium mb-1">{l.name}</h3>
            <p className="text-sm text-slate-400 leading-relaxed">{l.body}</p>
          </div>
        ))}
      </div>

      <h2 className="text-lg font-semibold text-slate-100 mb-3">{t("howItWorks.biosigTitle")}</h2>
      <p className="text-sm text-slate-400 leading-relaxed">
        <Trans i18nKey="howItWorks.biosigBody" components={[<span className="text-slate-300" />]} />
      </p>
    </div>
  )
}
