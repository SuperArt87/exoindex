import { Link } from "react-router-dom"
import { useTranslation } from "react-i18next"
import logo from "../assets/exoindex-logo-wordmark.png"

export default function HomePage() {
  const { t } = useTranslation()
  const featuresRaw = t("home.features", { returnObjects: true })
  const features = Array.isArray(featuresRaw) ? featuresRaw : []

  return (
    <div className="flex-1 flex flex-col">
      <section className="max-w-5xl mx-auto px-4 pt-16 pb-14 text-center w-full">
        <img src={logo} alt="Exo Index" className="h-14 w-auto mx-auto mb-8" />
        <h1 className="text-3xl sm:text-4xl font-semibold text-slate-100 tracking-tight">
          {t("home.title")}
        </h1>
        <p className="mt-4 text-slate-400 text-base sm:text-lg max-w-2xl mx-auto">
          {t("home.subtitle")}
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <Link
            to="/catalogus"
            className="px-5 py-2.5 rounded-md bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-500"
          >
            {t("home.ctaCatalog")}
          </Link>
          <Link
            to="/hoe-werkt-het"
            className="px-5 py-2.5 rounded-md border border-slate-700 text-slate-300 text-sm font-medium hover:bg-slate-800"
          >
            {t("home.ctaHowItWorks")}
          </Link>
        </div>
      </section>

      <section className="border-t border-slate-900 bg-slate-950/40">
        <div className="max-w-5xl mx-auto px-4 py-14 grid grid-cols-1 sm:grid-cols-3 gap-8">
          {features.map((f) => (
            <div key={f.title}>
              <h2 className="text-slate-100 font-medium mb-2">{f.title}</h2>
              <p className="text-sm text-slate-400 leading-relaxed">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-4 py-14 w-full text-center">
        <h2 className="text-xl font-semibold text-slate-100 mb-3">
          {t("home.bottomTitle")}
        </h2>
        <p className="text-slate-400 text-sm max-w-2xl mx-auto mb-6">
          {t("home.bottomBody")}
        </p>
        <Link to="/register" className="text-indigo-400 text-sm font-medium hover:text-indigo-300">
          {t("home.bottomCta")}
        </Link>
      </section>
    </div>
  )
}
