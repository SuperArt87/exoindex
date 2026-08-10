// Kleine, gedeelde locale-aware formatteerhelpers -- vervangen de eerder
// hardcoded "nl-NL" in toLocaleString-aanroepen door de actieve i18n-taal.
export function formatCredits(value, lang, opts = {}) {
  return Number(value).toLocaleString(lang, { minimumFractionDigits: 2, ...opts })
}

export function formatCreditsRounded(value, lang) {
  return Number(value).toLocaleString(lang, { maximumFractionDigits: 0 })
}

export function formatDate(iso, lang, opts) {
  return new Date(iso).toLocaleDateString(lang, opts)
}

export function formatDateTime(iso, lang) {
  return new Date(iso).toLocaleString(lang)
}
