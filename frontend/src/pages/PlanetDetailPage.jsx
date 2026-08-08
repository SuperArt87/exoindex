import { useState } from "react"
import { useParams, Link } from "react-router-dom"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { getPlanet, listPlanetsByHost } from "../api/planets"
import { getPortfolio, buyPlanet, sellPlanet } from "../api/trading"
import { useAuth } from "../context/AuthContext"
import DataCompletenessBadge from "../components/DataCompletenessBadge"
import BiosignatureBadge from "../components/BiosignatureBadge"
import SystemOrbitView from "../components/SystemOrbitView"
import { ApiError } from "../api/client"

function fmt(value, unit = "") {
  if (value === null || value === undefined) return <span className="text-slate-600">niet gemeten</span>
  return `${value}${unit}`
}

function Section({ title, children }) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-4">
      <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wide mb-3">{title}</h2>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">{children}</dl>
    </div>
  )
}

function Field({ label, value }) {
  return (
    <div>
      <dt className="text-slate-500">{label}</dt>
      <dd className="text-slate-200">{value}</dd>
    </div>
  )
}

const ROTATION_LABELS = { free: "Vrij", resonant: "Resonant", synchronous: "Synchroon (getijdevergrendeld)" }

export default function PlanetDetailPage() {
  const { id } = useParams()
  const { user, refreshUser } = useAuth()
  const queryClient = useQueryClient()
  const [buyQty, setBuyQty] = useState(1)
  const [sellQty, setSellQty] = useState("")
  const [actionError, setActionError] = useState(null)
  const [actionMessage, setActionMessage] = useState(null)

  const { data: planet, isLoading, isError } = useQuery({
    queryKey: ["planet", id],
    queryFn: () => getPlanet(id),
  })

  const { data: portfolio } = useQuery({
    queryKey: ["portfolio"],
    queryFn: getPortfolio,
    enabled: Boolean(user),
  })

  const { data: systemPlanets } = useQuery({
    queryKey: ["planets-by-host", planet?.host_name],
    queryFn: () => listPlanetsByHost(planet.host_name),
    enabled: Boolean(planet?.host_name),
  })

  const holding = portfolio?.results?.find((entry) => String(entry.planet) === String(id))

  const invalidateAfterTrade = async () => {
    await queryClient.invalidateQueries({ queryKey: ["portfolio"] })
    await queryClient.invalidateQueries({ queryKey: ["transactions"] })
    await refreshUser()
  }

  const buyMutation = useMutation({
    mutationFn: () => buyPlanet(id, Number(buyQty) || 1),
    onSuccess: async (data) => {
      setActionError(null)
      setActionMessage(data.detail)
      await invalidateAfterTrade()
    },
    onError: (err) => setActionError(err instanceof ApiError ? err.message : "Kopen mislukt."),
  })

  const sellMutation = useMutation({
    mutationFn: () => sellPlanet(id, sellQty ? Number(sellQty) : undefined),
    onSuccess: async (data) => {
      setActionError(null)
      setActionMessage(data.detail)
      setSellQty("")
      await invalidateAfterTrade()
    },
    onError: (err) => setActionError(err instanceof ApiError ? err.message : "Verkopen mislukt."),
  })

  if (isLoading) return <div className="max-w-4xl mx-auto px-4 py-6 text-slate-500">Laden...</div>
  if (isError || !planet) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-6">
        <p className="text-red-400">Planeet niet gevonden.</p>
        <Link to="/" className="text-indigo-400 text-sm">← Terug naar catalogus</Link>
      </div>
    )
  }

  const rgb = planet.planet_color_rgb
  const rgbCss = rgb ? `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})` : "rgb(100,100,110)"

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 w-full">
      <Link to="/" className="text-indigo-400 text-sm">← Terug naar catalogus</Link>

      <div className="rounded-lg mt-3 mb-2 overflow-hidden border border-slate-800 bg-slate-900/40 relative">
        {systemPlanets?.results?.length ? (
          <SystemOrbitView planets={systemPlanets.results} highlightPlanetId={id} />
        ) : (
          <div
            className="h-64 sm:h-80"
            style={{ background: `radial-gradient(circle at 30% 30%, ${rgbCss}, #03040a 85%)` }}
          />
        )}
        {planet.visual_tag && (
          <span className="absolute bottom-3 left-3 text-sm px-2 py-1 rounded bg-black/50 text-slate-100 backdrop-blur">
            {planet.visual_tag}
          </span>
        )}
      </div>

      {systemPlanets?.results?.length > 1 && (
        <div className="flex flex-wrap items-center gap-2 mb-4 text-xs">
          <span className="text-slate-500">Stelsel {planet.host_name}:</span>
          {systemPlanets.results.map((p) =>
            String(p.id) === String(id) ? (
              <span key={p.id} className="px-2 py-0.5 rounded bg-cyan-900/40 text-cyan-300 border border-cyan-800">
                {p.planet_name}
              </span>
            ) : (
              <Link
                key={p.id}
                to={`/planets/${p.id}`}
                className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 hover:bg-slate-700"
              >
                {p.planet_name}
              </Link>
            )
          )}
        </div>
      )}

      <div className="flex flex-wrap items-start justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-100">{planet.planet_name}</h1>
          <p className="text-slate-500">{planet.host_name}</p>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <DataCompletenessBadge confidenceScore={planet.confidence_score} />
          <BiosignatureBadge isCandidate={planet.biosignature_candidate} />
        </div>
      </div>

      <BiosignatureBadge isCandidate={planet.biosignature_candidate} detailed />
      {planet.biosignature_candidate && <div className="mb-4" />}

      {/* Marktwaarde + handelspaneel */}
      <div className="rounded-lg border border-indigo-900 bg-indigo-950/30 p-4 mb-6">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-wide">Marktwaarde per eenheid</p>
            <p className="text-2xl font-semibold text-emerald-400">
              {planet.market_value_credits ? `${Number(planet.market_value_credits).toLocaleString("nl-NL", { minimumFractionDigits: 2 })} credits` : "nog niet gesynchroniseerd"}
            </p>
          </div>
          {planet.base_market_value_credits && (
            <p className="text-xs text-slate-500">
              basis {Number(planet.base_market_value_credits).toLocaleString("nl-NL")} × sentiment {planet.market_sentiment_multiplier}× × vraag {planet.demand_multiplier}×
            </p>
          )}
        </div>

        {actionError && <p className="text-red-400 text-sm mb-3">{actionError}</p>}
        {actionMessage && <p className="text-emerald-400 text-sm mb-3">{actionMessage}</p>}

        {!user ? (
          <Link to="/login" className="inline-block px-4 py-2 rounded-md bg-indigo-600 text-white text-sm hover:bg-indigo-500">
            Log in om te handelen
          </Link>
        ) : (
          <div className="flex flex-wrap gap-6">
            <div className="flex items-end gap-2">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Aantal</label>
                <input
                  type="number"
                  min="1"
                  value={buyQty}
                  onChange={(e) => setBuyQty(e.target.value)}
                  className="w-24 rounded-md bg-slate-900 border border-slate-700 px-2 py-1.5 text-sm text-slate-100"
                />
              </div>
              <button
                onClick={() => buyMutation.mutate()}
                disabled={buyMutation.isPending || !planet.market_value_credits}
                className="px-4 py-1.5 rounded-md bg-emerald-600 text-white text-sm hover:bg-emerald-500 disabled:opacity-50"
              >
                Koop
              </button>
            </div>

            {holding && holding.quantity > 0 && (
              <div className="flex items-end gap-2">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">
                    Aantal (je bezit {holding.quantity}x)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={holding.quantity}
                    placeholder="alles"
                    value={sellQty}
                    onChange={(e) => setSellQty(e.target.value)}
                    className="w-24 rounded-md bg-slate-900 border border-slate-700 px-2 py-1.5 text-sm text-slate-100"
                  />
                </div>
                <button
                  onClick={() => sellMutation.mutate()}
                  disabled={sellMutation.isPending}
                  className="px-4 py-1.5 rounded-md bg-red-700 text-white text-sm hover:bg-red-600 disabled:opacity-50"
                >
                  Verkoop
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Section title="Identificatie">
          <Field label="Ontdekt in" value={fmt(planet.discovery_year)} />
          <Field label="Methode" value={fmt(planet.discovery_method)} />
          <Field label="Zonnestelsel" value={planet.is_solar_system ? "Ja" : "Nee"} />
        </Section>

        <Section title="Ster">
          <Field label="Spectraaltype" value={fmt(planet.star_spectral_type)} />
          <Field label="Temperatuur" value={fmt(planet.star_teff_k, " K")} />
          <Field label="Straal" value={fmt(planet.star_radius_solar, " R☉")} />
          <Field label="Massa" value={fmt(planet.star_mass_solar, " M☉")} />
          <Field label="Leeftijd" value={fmt(planet.star_age_gyr, " Gyr")} />
        </Section>

        <Section title="Baan & systeem">
          <Field label="Type" value={fmt(planet.planet_type)} />
          <Field label="Halve lange as" value={fmt(planet.orbit_semi_major_axis_au, " AU")} />
          <Field label="Excentriciteit" value={fmt(planet.orbit_eccentricity)} />
          <Field label="Omlooptijd" value={fmt(planet.orbit_period_days, " dagen")} />
          <Field label="Rotatie" value={planet.rotation_state ? ROTATION_LABELS[planet.rotation_state] : fmt(null)} />
          <Field label="Manen" value={fmt(planet.moon_count)} />
          <Field label="Ringen" value={planet.has_rings === null ? fmt(null) : planet.has_rings ? "Ja" : "Nee"} />
        </Section>

        <Section title="Fysiek">
          <Field label="Massa" value={fmt(planet.mass_earth, " M⊕")} />
          <Field label="Straal" value={fmt(planet.radius_earth, " R⊕")} />
          <Field label="Dichtheid" value={fmt(planet.density_g_cm3, " g/cm³")} />
          <Field label="Zwaartekracht" value={fmt(planet.surface_gravity_g, " g")} />
          <Field label="Evenwichtstemperatuur" value={fmt(planet.equilibrium_temp_k, " K")} />
        </Section>

        <Section title="Leefbaarheidscontext">
          <Field label="Afstand" value={planet.distance_from_earth_ly === 0 ? "In het zonnestelsel" : fmt(planet.distance_from_earth_ly, " lj")} />
          <Field label="Leefbare zone" value={planet.in_habitable_zone === null ? fmt(null) : planet.in_habitable_zone ? "Binnen" : "Buiten"} />
          <Field label="HZ-grenzen" value={planet.hz_inner_au && planet.hz_outer_au ? `${planet.hz_inner_au} - ${planet.hz_outer_au} AU` : fmt(null)} />
        </Section>

        <Section title="Atmosfeer & samenstelling">
          <Field label="Dichtheid atmosfeer" value={fmt(planet.atmosphere_density)} />
          <Field label="Moleculen" value={planet.detected_molecules?.length ? planet.detected_molecules.join(", ") : fmt(null)} />
          <Field label="Magnetosfeer" value={fmt(planet.magnetosphere_strength)} />
          <Field label="Tektoniek" value={fmt(planet.tectonic_activity)} />
        </Section>

        <Section title="Scores">
          <Field label="ESI (Earth Similarity)" value={fmt(planet.esi_score)} />
          <Field label="Leefbaarheid" value={fmt(planet.habitability_score)} />
          <Field label="Grondstoffen" value={fmt(planet.resource_score)} />
        </Section>
      </div>

      {planet.detected_molecules?.length > 0 && planet.molecule_source === "exoplanet.eu" && (
        <p className="text-xs text-slate-600 mt-6">
          Atmosferische data: exoplanet.eu, CC BY 4.0.
        </p>
      )}
    </div>
  )
}
