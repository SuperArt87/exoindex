import { useTranslation } from "react-i18next"
import { SUPPORTED_LANGUAGES } from "../i18n"

export default function LanguageSwitcher({ className = "" }) {
  const { i18n } = useTranslation()

  return (
    <select
      aria-label="Language"
      value={i18n.resolvedLanguage || i18n.language}
      onChange={(e) => i18n.changeLanguage(e.target.value)}
      className={`rounded-md bg-slate-900 border border-slate-700 px-2 py-1.5 text-sm text-slate-300 focus:outline-none focus:border-indigo-500 ${className}`}
    >
      {SUPPORTED_LANGUAGES.map((l) => (
        <option key={l.code} value={l.code}>{l.label}</option>
      ))}
    </select>
  )
}
