import { useState } from "react"
import { Link, NavLink } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { useAuth } from "../context/AuthContext"
import { formatCredits } from "../i18n/format"
import LanguageSwitcher from "./LanguageSwitcher"
import logo from "../assets/exoindex-logo-wordmark.png"

const navLinkClass = ({ isActive }) =>
  `px-3 py-2 rounded-md text-sm font-medium ${isActive ? "bg-slate-800 text-white" : "text-slate-300 hover:text-white hover:bg-slate-800/60"
  }`

export default function Navbar() {
  const { t, i18n } = useTranslation()
  const { user, logout } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const lang = i18n.resolvedLanguage || i18n.language

  return (
    <header className="border-b border-slate-800 bg-[#03040a]/95 backdrop-blur sticky top-0 z-20">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          <Link to="/" className="flex items-center">
            <img src={logo} alt="Exo Index" className="h-8 w-auto" />
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            <NavLink to="/catalogus" className={navLinkClass}>{t("nav.catalog")}</NavLink>
            <NavLink to="/hoe-werkt-het" className={navLinkClass}>{t("nav.howItWorks")}</NavLink>
            <NavLink to="/faq" className={navLinkClass}>{t("nav.faq")}</NavLink>
            {user && <NavLink to="/portfolio" className={navLinkClass}>{t("nav.portfolio")}</NavLink>}
          </nav>

          <div className="hidden md:flex items-center gap-3">
            <LanguageSwitcher />
            {user ? (
              <>
                <span className="text-sm text-slate-400">
                  {user.username} · <span className="text-emerald-400">{formatCredits(user.credits_balance, lang)} cr</span>
                </span>
                <button
                  onClick={logout}
                  className="px-3 py-1.5 text-sm rounded-md border border-slate-700 text-slate-300 hover:bg-slate-800"
                >
                  {t("nav.logout")}
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="px-3 py-1.5 text-sm rounded-md text-slate-300 hover:text-white">{t("nav.login")}</Link>
                <Link to="/register" className="px-3 py-1.5 text-sm rounded-md bg-indigo-600 text-white hover:bg-indigo-500">{t("nav.register")}</Link>
              </>
            )}
          </div>

          <button
            className="md:hidden text-slate-300 p-2"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label={t("nav.menu")}
          >
            {menuOpen ? "✕" : "☰"}
          </button>
        </div>

        {menuOpen && (
          <div className="md:hidden pb-4 flex flex-col gap-2">
            <NavLink to="/catalogus" className={navLinkClass} onClick={() => setMenuOpen(false)}>{t("nav.catalog")}</NavLink>
            <NavLink to="/hoe-werkt-het" className={navLinkClass} onClick={() => setMenuOpen(false)}>{t("nav.howItWorks")}</NavLink>
            <NavLink to="/faq" className={navLinkClass} onClick={() => setMenuOpen(false)}>{t("nav.faq")}</NavLink>
            {user && (
              <NavLink to="/portfolio" className={navLinkClass} onClick={() => setMenuOpen(false)}>{t("nav.portfolio")}</NavLink>
            )}
            <div className="px-3 py-1">
              <LanguageSwitcher className="w-full" />
            </div>
            {user ? (
              <>
                <span className="px-3 py-1 text-sm text-slate-400">
                  {user.username} · <span className="text-emerald-400">{formatCredits(user.credits_balance, lang)} cr</span>
                </span>
                <button
                  onClick={() => { logout(); setMenuOpen(false) }}
                  className="mx-3 px-3 py-1.5 text-sm rounded-md border border-slate-700 text-slate-300 text-left"
                >
                  {t("nav.logout")}
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="px-3 py-2 text-sm text-slate-300" onClick={() => setMenuOpen(false)}>{t("nav.login")}</Link>
                <Link to="/register" className="mx-3 px-3 py-1.5 text-sm rounded-md bg-indigo-600 text-white text-center" onClick={() => setMenuOpen(false)}>{t("nav.register")}</Link>
              </>
            )}
          </div>
        )}
      </div>
    </header>
  )
}
