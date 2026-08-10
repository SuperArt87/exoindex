import { useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { getPlanetHistory } from "../api/planets"

const RANGES = [
  { value: "week", label: "Week" },
  { value: "month", label: "Maand" },
  { value: "year", label: "Jaar" },
]

const WIDTH = 480
const HEIGHT = 180
const PAD_LEFT = 56
const PAD_RIGHT = 12
const PAD_TOP = 12
const PAD_BOTTOM = 26

function formatCredits(value) {
  return `${Number(value).toLocaleString("nl-NL", { maximumFractionDigits: 0 })} cr`
}

function formatDate(iso, range) {
  const d = new Date(iso)
  if (range === "year") return d.toLocaleDateString("nl-NL", { month: "short", year: "2-digit" })
  return d.toLocaleDateString("nl-NL", { day: "numeric", month: "short" })
}

/**
 * Prijshistorie-grafiek -- toont ALLEEN echte momentopnamen (PriceHistory,
 * weggeschreven door apply_demand_pricing). Bewust GEEN interpolatie/
 * opvulling tussen punten en GEEN synthetische historie i.p.v. echte data
 * -- bij minder dan 2 punten volgt een expliciete lege staat i.p.v. een
 * misleidende platte lijn (zie CONTEXT.md-designprincipe: nooit iets tonen
 * dat als gemeten oogt maar dat niet is). Zelfgebouwde SVG-lijngrafiek,
 * bewust geen chart-library -- eenvoudige tijd/waarde-reeks, geen behoefte
 * aan een zware dependency hiervoor.
 */
export default function PriceHistoryChart({ planetId }) {
  const [range, setRange] = useState("month")
  const [hoverIndex, setHoverIndex] = useState(null)

  const { data, isLoading } = useQuery({
    queryKey: ["planet-history", planetId, range],
    queryFn: () => getPlanetHistory(planetId, range),
  })

  const points = data ?? []

  const geometry = useMemo(() => {
    if (points.length < 2) return null
    const values = points.map((p) => Number(p.market_value_credits))
    const times = points.map((p) => new Date(p.recorded_at).getTime())
    const vMin = Math.min(...values)
    const vMax = Math.max(...values)
    const tMin = Math.min(...times)
    const tMax = Math.max(...times)
    const vSpan = vMax - vMin || 1
    const tSpan = tMax - tMin || 1

    const coords = points.map((p, i) => {
      const x = PAD_LEFT + ((times[i] - tMin) / tSpan) * (WIDTH - PAD_LEFT - PAD_RIGHT)
      const y = HEIGHT - PAD_BOTTOM - ((values[i] - vMin) / vSpan) * (HEIGHT - PAD_TOP - PAD_BOTTOM)
      return { x, y, value: values[i], recorded_at: p.recorded_at }
    })

    return { coords, vMin, vMax }
  }, [points])

  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">Waardeverloop</h2>
        <div className="flex gap-1">
          {RANGES.map((r) => (
            <button
              key={r.value}
              onClick={() => setRange(r.value)}
              className={`px-2.5 py-1 text-xs rounded ${range === r.value
                ? "bg-indigo-600 text-white"
                : "bg-slate-800 text-slate-400 hover:text-slate-200"
                }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <p className="text-slate-500 text-sm h-[180px] flex items-center justify-center">Laden...</p>
      ) : !geometry ? (
        <div className="h-[180px] flex flex-col items-center justify-center text-center gap-1">
          <p className="text-slate-500 text-sm">Nog niet genoeg historie voor deze periode.</p>
          <p className="text-slate-600 text-xs">
            Dit platform draait nog maar kort -- de grafiek vult zich naarmate de marktwaarde vaker wordt herberekend.
          </p>
        </div>
      ) : (
        <div
          onMouseLeave={() => setHoverIndex(null)}
        >
          <svg
            viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
            className="w-full h-[180px]"
            onMouseMove={(e) => {
              const rect = e.currentTarget.getBoundingClientRect()
              const relX = ((e.clientX - rect.left) / rect.width) * WIDTH
              let nearest = 0
              let nearestDist = Infinity
              geometry.coords.forEach((c, i) => {
                const dist = Math.abs(c.x - relX)
                if (dist < nearestDist) { nearestDist = dist; nearest = i }
              })
              setHoverIndex(nearest)
            }}
          >
            {/* horizontale hulplijnen op min/max */}
            <line x1={PAD_LEFT} y1={PAD_TOP} x2={WIDTH - PAD_RIGHT} y2={PAD_TOP} stroke="#1e293b" strokeWidth="1" />
            <line x1={PAD_LEFT} y1={HEIGHT - PAD_BOTTOM} x2={WIDTH - PAD_RIGHT} y2={HEIGHT - PAD_BOTTOM} stroke="#1e293b" strokeWidth="1" />

            <text x={4} y={PAD_TOP + 4} fill="#64748b" fontSize="10">{formatCredits(geometry.vMax)}</text>
            <text x={4} y={HEIGHT - PAD_BOTTOM + 4} fill="#64748b" fontSize="10">{formatCredits(geometry.vMin)}</text>

            <text x={PAD_LEFT} y={HEIGHT - 6} fill="#64748b" fontSize="10">
              {formatDate(points[0].recorded_at, range)}
            </text>
            <text x={WIDTH - PAD_RIGHT} y={HEIGHT - 6} fill="#64748b" fontSize="10" textAnchor="end">
              {formatDate(points[points.length - 1].recorded_at, range)}
            </text>

            <polyline
              points={geometry.coords.map((c) => `${c.x},${c.y}`).join(" ")}
              fill="none"
              stroke="#34d399"
              strokeWidth="2"
            />

            {geometry.coords.map((c, i) => (
              <circle
                key={i}
                cx={c.x}
                cy={c.y}
                r={i === hoverIndex ? 4 : 2.5}
                fill={i === hoverIndex ? "#34d399" : "#059669"}
              />
            ))}

            {hoverIndex !== null && (
              <line
                x1={geometry.coords[hoverIndex].x} y1={PAD_TOP}
                x2={geometry.coords[hoverIndex].x} y2={HEIGHT - PAD_BOTTOM}
                stroke="#334155" strokeWidth="1" strokeDasharray="3,3"
              />
            )}
          </svg>

          {hoverIndex !== null && (
            <p className="text-xs text-slate-300 text-center -mt-1">
              {new Date(geometry.coords[hoverIndex].recorded_at).toLocaleString("nl-NL")} ·{" "}
              <span className="text-emerald-400">{formatCredits(geometry.coords[hoverIndex].value)}</span>
            </p>
          )}
        </div>
      )}
    </div>
  )
}
