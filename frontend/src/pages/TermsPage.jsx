import { useTranslation } from "react-i18next"

export default function TermsPage() {
  const { t } = useTranslation()
  const sectionsRaw = t("terms.sections", { returnObjects: true })
  const sections = Array.isArray(sectionsRaw) ? sectionsRaw : []

  return (
    <div className="max-w-3xl mx-auto px-4 py-12 w-full">
      <h1 className="text-2xl font-semibold text-slate-100 mb-3">{t("terms.title")}</h1>

      <div className="rounded-md border border-amber-700/40 bg-amber-950/20 px-4 py-3 mb-8">
        <p className="text-sm text-amber-300/90 leading-relaxed">{t("terms.disclaimer")}</p>
      </div>

      {sections.map((s, i) => (
        <div key={s.title}>
          <h2 className="text-lg font-semibold text-slate-100 mb-2">{s.title}</h2>
          <p className={`text-sm text-slate-400 leading-relaxed ${i < sections.length - 1 ? "mb-6" : ""}`}>{s.body}</p>
        </div>
      ))}
    </div>
  )
}
