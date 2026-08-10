import { Link } from "react-router-dom"
import { useTranslation } from "react-i18next"

const LINK_KEYS = [
  { to: "/over-ons", key: "footer.about" },
  { to: "/hoe-werkt-het", key: "footer.howItWorks" },
  { to: "/faq", key: "footer.faq" },
  { to: "/databronnen", key: "footer.dataSources" },
  { to: "/privacy", key: "footer.privacy" },
  { to: "/voorwaarden", key: "footer.terms" },
]

export default function Footer() {
  const { t } = useTranslation()
  return (
    <footer className="border-t border-slate-900 py-6 text-center text-xs text-slate-600">
      <nav className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 mb-3 px-4">
        {LINK_KEYS.map((l) => (
          <Link key={l.to} to={l.to} className="hover:text-slate-400">
            {t(l.key)}
          </Link>
        ))}
      </nav>
      <p>{t("footer.disclaimer")}</p>
    </footer>
  )
}
