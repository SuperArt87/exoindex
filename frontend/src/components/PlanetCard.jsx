import { Link } from "react-router-dom"
import { useTranslation } from "react-i18next"
import BiosignatureBadge from "./BiosignatureBadge"
import { formatCreditsRounded } from "../i18n/format"

function rgbCss(rgb) {
  if (!rgb) return "rgb(100,100,110)"
  return `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`
}

export default function PlanetCard({ planet }) {
  const { t, i18n } = useTranslation()
  const lang = i18n.resolvedLanguage || i18n.language

  return (
    <Link
      to={`/planets/${planet.id}`}
      className="group block rounded-lg border border-slate-800 bg-slate-900/40 overflow-hidden hover:border-slate-600 transition-colors"
    >
      <div
        className="h-24 flex items-end p-3"
        style={{
          background: `radial-gradient(circle at 30% 30%, ${rgbCss(planet.planet_color_rgb)}, #03040a 85%)`,
        }}
      >
        {planet.visual_tag && (
          <span className="text-xs px-2 py-0.5 rounded bg-black/50 text-slate-100 backdrop-blur">
            {planet.visual_tag}
          </span>
        )}
      </div>

      <div className="p-4 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="text-slate-100 font-medium group-hover:text-white truncate">{planet.planet_name}</h3>
            <p className="text-xs text-slate-500 truncate">{planet.host_name}</p>
          </div>
          {planet.is_updated && (
            <span
              className="shrink-0 text-xs px-2 py-0.5 rounded bg-amber-900/40 text-amber-300 border border-amber-800"
              title={t("planetCard.updatedTooltip")}
            >
              {t("planetCard.updated")}
            </span>
          )}
        </div>

        <BiosignatureBadge isCandidate={planet.biosignature_candidate} />

        <div className="flex justify-between text-xs text-slate-400 pt-1">
          <span>{t("planetCard.habitability")}: <span className="text-slate-200">{planet.habitability_score ?? "—"}</span></span>
          <span>{t("planetCard.resources")}: <span className="text-slate-200">{planet.resource_score ?? "—"}</span></span>
        </div>

        <div className="flex justify-between items-center pt-2 border-t border-slate-800">
          <span className="text-xs text-slate-500">
            {planet.distance_from_earth_ly === 0 ? t("planetCard.solarSystem") : t("planetCard.lightYears", { value: planet.distance_from_earth_ly ?? "?" })}
          </span>
          <span className="text-sm font-medium text-emerald-400">
            {planet.market_value_credits ? `${formatCreditsRounded(planet.market_value_credits, lang)} cr` : "—"}
          </span>
        </div>
      </div>
    </Link>
  )
}
