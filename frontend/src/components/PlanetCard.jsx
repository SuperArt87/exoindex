import { Link } from "react-router-dom"
import BiosignatureBadge from "./BiosignatureBadge"

function rgbCss(rgb) {
  if (!rgb) return "rgb(100,100,110)"
  return `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`
}

export default function PlanetCard({ planet }) {
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
        <div>
          <h3 className="text-slate-100 font-medium group-hover:text-white truncate">{planet.planet_name}</h3>
          <p className="text-xs text-slate-500 truncate">{planet.host_name}</p>
        </div>

        <BiosignatureBadge isCandidate={planet.biosignature_candidate} />

        <div className="flex justify-between text-xs text-slate-400 pt-1">
          <span>Leefbaarheid: <span className="text-slate-200">{planet.habitability_score ?? "—"}</span></span>
          <span>Grondstoffen: <span className="text-slate-200">{planet.resource_score ?? "—"}</span></span>
        </div>

        <div className="flex justify-between items-center pt-2 border-t border-slate-800">
          <span className="text-xs text-slate-500">
            {planet.distance_from_earth_ly === 0 ? "Zonnestelsel" : `${planet.distance_from_earth_ly ?? "?"} lj`}
          </span>
          <span className="text-sm font-medium text-emerald-400">
            {planet.market_value_credits ? `${Number(planet.market_value_credits).toLocaleString("nl-NL", { maximumFractionDigits: 0 })} cr` : "—"}
          </span>
        </div>
      </div>
    </Link>
  )
}
