import { useTranslation } from "react-i18next"

export default function FaqPage() {
  const { t } = useTranslation()
  const faqsRaw = t("faq.items", { returnObjects: true })
  const faqs = Array.isArray(faqsRaw) ? faqsRaw : []

  return (
    <div className="max-w-3xl mx-auto px-4 py-12 w-full">
      <h1 className="text-2xl font-semibold text-slate-100 mb-8">{t("faq.title")}</h1>
      <div className="space-y-8">
        {faqs.map((f) => (
          <div key={f.q}>
            <h2 className="text-slate-100 font-medium mb-1.5">{f.q}</h2>
            <p className="text-sm text-slate-400 leading-relaxed">{f.a}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
