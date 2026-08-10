import { useTranslation } from "react-i18next"

export default function DataSourcesPage() {
  const { t } = useTranslation()
  const sourcesRaw = t("dataSources.sources", { returnObjects: true })
  const sources = Array.isArray(sourcesRaw) ? sourcesRaw : []

  return (
    <div className="max-w-3xl mx-auto px-4 py-12 w-full">
      <h1 className="text-2xl font-semibold text-slate-100 mb-3">{t("dataSources.title")}</h1>
      <p className="text-slate-400 text-sm leading-relaxed mb-10">{t("dataSources.intro")}</p>

      <div className="space-y-6">
        {sources.map((s) => (
          <div key={s.name} className="rounded-md border border-slate-800 p-4">
            <h2 className="text-slate-100 font-medium mb-1">{s.name}</h2>
            <p className="text-sm text-slate-400 leading-relaxed mb-2">{s.role}</p>
            <p className="text-xs text-slate-500">{s.license}</p>
          </div>
        ))}
      </div>

      <p className="text-xs text-slate-600 mt-10">{t("dataSources.footerNote")}</p>
    </div>
  )
}
