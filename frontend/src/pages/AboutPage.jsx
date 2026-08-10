import { Link } from "react-router-dom"
import { Trans, useTranslation } from "react-i18next"

export default function AboutPage() {
  const { t } = useTranslation()
  return (
    <div className="max-w-3xl mx-auto px-4 py-12 w-full">
      <h1 className="text-2xl font-semibold text-slate-100 mb-3">{t("about.title")}</h1>
      <p className="text-slate-400 text-sm leading-relaxed mb-8">{t("about.intro")}</p>

      <h2 className="text-lg font-semibold text-slate-100 mb-2">{t("about.section1Title")}</h2>
      <p className="text-sm text-slate-400 leading-relaxed mb-6">{t("about.section1Body")}</p>

      <h2 className="text-lg font-semibold text-slate-100 mb-2">{t("about.section2Title")}</h2>
      <p className="text-sm text-slate-400 leading-relaxed mb-6">{t("about.section2Body")}</p>

      <h2 className="text-lg font-semibold text-slate-100 mb-2">{t("about.section3Title")}</h2>
      <p className="text-sm text-slate-400 leading-relaxed mb-6">
        <Trans
          i18nKey="about.section3Body"
          components={[
            <span className="text-slate-300" />,
            <span className="text-slate-300" />,
            <span className="text-slate-300" />,
          ]}
        />
      </p>

      <h2 className="text-lg font-semibold text-slate-100 mb-2">{t("about.section4Title")}</h2>
      <p className="text-sm text-slate-400 leading-relaxed">
        <Trans
          i18nKey="about.section4Body"
          components={[<Link to="/hoe-werkt-het" className="text-indigo-400 hover:text-indigo-300" />]}
        />
      </p>
    </div>
  )
}
