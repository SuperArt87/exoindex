import i18n from "i18next"
import { initReactI18next } from "react-i18next"
import LanguageDetector from "i18next-browser-languagedetector"

// Auto-discovers every src/locales/<code>/translation.json -- adding a new
// language later means dropping in a folder, no code change here.
const modules = import.meta.glob("./locales/*/translation.json", { eager: true })

const resources = {}
for (const path in modules) {
  const match = path.match(/\.\/locales\/([a-z-]+)\/translation\.json$/)
  if (match) resources[match[1]] = { translation: modules[path].default }
}

export const SUPPORTED_LANGUAGES = [
  { code: "nl", label: "Nederlands" },
  { code: "en", label: "English" },
  { code: "es", label: "Español" },
  { code: "pt", label: "Português" },
  { code: "pl", label: "Polski" },
  { code: "fr", label: "Français" },
  { code: "da", label: "Dansk" },
  { code: "de", label: "Deutsch" },
  { code: "it", label: "Italiano" },
  { code: "ar", label: "العربية" },
  { code: "tr", label: "Türkçe" },
  { code: "hi", label: "हिन्दी" },
  { code: "zh", label: "中文" },
  { code: "ja", label: "日本語" },
  { code: "ko", label: "한국어" },
  { code: "ru", label: "Русский" },
]

// Only Arabic among the requested languages is RTL.
const RTL_LANGUAGES = ["ar"]

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: "en",
    supportedLngs: SUPPORTED_LANGUAGES.map((l) => l.code),
    interpolation: { escapeValue: false },
    detection: {
      order: ["localStorage", "navigator"],
      caches: ["localStorage"],
      lookupLocalStorage: "exoindex_lang",
    },
  })

function applyDocumentDirection(lng) {
  document.documentElement.lang = lng
  document.documentElement.dir = RTL_LANGUAGES.includes(lng) ? "rtl" : "ltr"
}

applyDocumentDirection(i18n.language)
i18n.on("languageChanged", applyDocumentDirection)

export default i18n
