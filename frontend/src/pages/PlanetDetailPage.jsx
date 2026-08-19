import { useState } from "react"
import { useParams, useLocation, useNavigate, Link } from "react-router-dom"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { getPlanet, listPlanetsByHost } from "../api/planets"
import { getPortfolio, buyPlanet, sellPlanet } from "../api/trading"
import { useAuth } from "../context/AuthContext"
import DataCompletenessBadge from "../components/DataCompletenessBadge"
import BiosignatureBadge from "../components/BiosignatureBadge"
import PlanetSphere from "../components/PlanetSphere"
import SystemOrbitView from "../components/SystemOrbitView"
import PriceHistoryChart from "../components/PriceHistoryChart"
import { ApiError } from "../api/client"
import { formatCredits } from "../i18n/format"

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

export default function PlanetDetailPage() {
  const { t, i18n } = useTranslation()
  const lang = i18n.resolvedLanguage || i18n.language
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { user, refreshUser } = useAuth()
  const queryClient = useQueryClient()
  const [buyQty, setBuyQty] = useState(1)
  const [sellQty, setSellQty] = useState("")
  const [actionError, setActionError] = useState(null)
  const [actionMessage, setActionMessage] = useState(null)

  const notMeasured = <span className="text-slate-600">{t("planetDetail.notMeasured")}</span>
  const fmt = (value, unit = "") => (value === null || value === undefined ? notMeasured : `${value}${unit}`)

  const ROTATION_LABELS = {
    free: t("planetDetail.rotationStates.free"),
    resonant: t("planetDetail.rotationStates.resonant"),
    synchronous: t("planetDetail.rotationStates.synchronous"),
  }

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

  // Navigeert terug in de browserhistory i.p.v. altijd naar het kale
  // "/catalogus" -- als je hier via een gefilterde catalogus-kaart bent
  // gekomen, staat die filter-querystring al in de vorige history-entry
  // (CatalogPage.jsx spiegelt filters naar de URL), dus history-back
  // herstelt ze vanzelf. location.key === "default" betekent dat er geen
  // eigen in-app-historie is (bv. direct geopende/ververste URL) -- dan
  // zou navigate(-1) de gebruiker de site uit sturen, dus dan alsnog naar
  // de kale catalogus.
  const backToCatalog = () => {
    if (location.key !== "default") navigate(-1)
    else navigate("/catalogus")
  }

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
    onError: (err) => setActionError(err instanceof ApiError ? err.message : t("planetDetail.buyError")),
  })

  const sellMutation = useMutation({
    mutationFn: () => sellPlanet(id, sellQty ? Number(sellQty) : undefined),
    onSuccess: async (data) => {
      setActionError(null)
      setActionMessage(data.detail)
      setSellQty("")
      await invalidateAfterTrade()
    },
    onError: (err) => setActionError(err instanceof ApiError ? err.message : t("planetDetail.sellError")),
  })

  if (isLoading) return <div className="max-w-4xl mx-auto px-4 py-6 text-slate-500">{t("common.loading")}</div>
  if (isError || !planet) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-6">
        <p className="text-red-400">{t("planetDetail.notFound")}</p>
        <button type="button" onClick={backToCatalog} className="text-indigo-400 text-sm">← {t("planetDetail.backToCatalog")}</button>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 w-full">
      <button type="button" onClick={backToCatalog} className="text-indigo-400 text-sm">← {t("planetDetail.backToCatalog")}</button>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3 mb-2">
        <div className="rounded-lg overflow-hidden border border-slate-800 bg-slate-900/40 relative">
          <PlanetSphere planet={planet} />
          {planet.visual_tag && (
            <span className="absolute bottom-3 left-3 text-sm px-2 py-1 rounded bg-black/50 text-slate-100 backdrop-blur">
              {planet.visual_tag}
            </span>
          )}
        </div>

        <div className="rounded-lg overflow-hidden border border-slate-800 bg-slate-900/40">
          {systemPlanets?.results?.length ? (
            <SystemOrbitView
              planets={systemPlanets.results}
              highlightPlanetId={id}
              onPlanetClick={(planetId) => navigate(`/planets/${planetId}`)}
            />
          ) : (
            <div className="h-64 sm:h-80 flex items-center justify-center text-slate-600 text-sm">
              {t("common.loading")}
            </div>
          )}
        </div>
      </div>

      {systemPlanets?.results?.length > 1 && (
        <div className="flex flex-wrap items-center gap-2 mb-4 text-xs">
          <span className="text-slate-500">{t("planetDetail.system", { name: planet.host_name })}:</span>
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
            <p className="text-xs text-slate-400 uppercase tracking-wide">{t("planetDetail.marketValuePerUnit")}</p>
            <p className="text-2xl font-semibold text-emerald-400">
              {planet.market_value_credits ? t("planetDetail.creditsAmount", { value: formatCredits(planet.market_value_credits, lang) }) : t("planetDetail.notSyncedYet")}
            </p>
          </div>
          {planet.base_market_value_credits && (
            <p className="text-xs text-slate-500">
              {t("planetDetail.basisSentimentDemand", {
                basis: Number(planet.base_market_value_credits).toLocaleString(lang),
                sentiment: planet.market_sentiment_multiplier,
                demand: planet.demand_multiplier,
              })}
            </p>
          )}
        </div>

        {actionError && <p className="text-red-400 text-sm mb-3">{actionError}</p>}
        {actionMessage && <p className="text-emerald-400 text-sm mb-3">{actionMessage}</p>}

        {!user ? (
          <Link to="/login" className="inline-block px-4 py-2 rounded-md bg-indigo-600 text-white text-sm hover:bg-indigo-500">
            {t("planetDetail.loginToTrade")}
          </Link>
        ) : (
          <div className="flex flex-wrap gap-6">
            <div className="flex items-end gap-2">
              <div>
                <label className="block text-xs text-slate-400 mb-1">{t("planetDetail.quantity")}</label>
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
                {t("planetDetail.buy")}
              </button>
            </div>

            {holding && holding.quantity > 0 && (
              <div className="flex items-end gap-2">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">
                    {t("planetDetail.quantityOwned", { count: holding.quantity })}
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={holding.quantity}
                    placeholder={t("planetDetail.all")}
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
                  {t("planetDetail.sell")}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="mb-6">
        <PriceHistoryChart planetId={id} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Section title={t("planetDetail.sections.identification")}>
          <Field label={t("planetDetail.fields.discoveredIn")} value={fmt(planet.discovery_year)} />
          <Field label={t("planetDetail.fields.method")} value={fmt(planet.discovery_method)} />
          <Field label={t("planetDetail.fields.solarSystem")} value={planet.is_solar_system ? t("common.yes") : t("common.no")} />
        </Section>

        <Section title={t("planetDetail.sections.star")}>
          <Field label={t("planetDetail.fields.spectralType")} value={fmt(planet.star_spectral_type)} />
          <Field label={t("planetDetail.fields.temperature")} value={fmt(planet.star_teff_k, " K")} />
          <Field label={t("planetDetail.fields.radius")} value={fmt(planet.star_radius_solar, " R☉")} />
          <Field label={t("planetDetail.fields.mass")} value={fmt(planet.star_mass_solar, " M☉")} />
          <Field label={t("planetDetail.fields.age")} value={fmt(planet.star_age_gyr, " Gyr")} />
        </Section>

        <Section title={t("planetDetail.sections.orbit")}>
          <Field label={t("planetDetail.fields.type")} value={fmt(planet.planet_type)} />
          <Field label={t("planetDetail.fields.semiMajorAxis")} value={fmt(planet.orbit_semi_major_axis_au, " AU")} />
          <Field label={t("planetDetail.fields.eccentricity")} value={fmt(planet.orbit_eccentricity)} />
          <Field label={t("planetDetail.fields.orbitalPeriod")} value={fmt(planet.orbit_period_days, ` ${t("planetDetail.days")}`)} />
          <Field label={t("planetDetail.fields.rotation")} value={planet.rotation_state ? ROTATION_LABELS[planet.rotation_state] : notMeasured} />
          <Field label={t("planetDetail.fields.moons")} value={fmt(planet.moon_count)} />
          <Field label={t("planetDetail.fields.rings")} value={planet.has_rings === null ? notMeasured : planet.has_rings ? t("common.yes") : t("common.no")} />
        </Section>

        <Section title={t("planetDetail.sections.physical")}>
          <Field label={t("planetDetail.fields.massEarth")} value={fmt(planet.mass_earth, " M⊕")} />
          <Field label={t("planetDetail.fields.radiusEarth")} value={fmt(planet.radius_earth, " R⊕")} />
          <Field label={t("planetDetail.fields.density")} value={fmt(planet.density_g_cm3, " g/cm³")} />
          <Field label={t("planetDetail.fields.gravity")} value={fmt(planet.surface_gravity_g, " g")} />
          <Field label={t("planetDetail.fields.equilibriumTemp")} value={fmt(planet.equilibrium_temp_k, " K")} />
        </Section>

        <Section title={t("planetDetail.sections.habitabilityContext")}>
          <Field
            label={t("planetDetail.fields.distance")}
            value={planet.distance_from_earth_ly === 0 ? t("planetDetail.inSolarSystem") : fmt(planet.distance_from_earth_ly, ` ${t("planetDetail.lightYearsShort")}`)}
          />
          <Field
            label={t("planetDetail.fields.habitableZone")}
            value={planet.in_habitable_zone === null ? notMeasured : planet.in_habitable_zone ? t("planetDetail.inside") : t("planetDetail.outside")}
          />
          <Field
            label={t("planetDetail.fields.hzBounds")}
            value={planet.hz_inner_au && planet.hz_outer_au ? `${planet.hz_inner_au} - ${planet.hz_outer_au} AU` : notMeasured}
          />
        </Section>

        <Section title={t("planetDetail.sections.atmosphere")}>
          <Field label={t("planetDetail.fields.atmosphereDensity")} value={fmt(planet.atmosphere_density)} />
          <Field label={t("planetDetail.fields.molecules")} value={planet.detected_molecules?.length ? planet.detected_molecules.join(", ") : notMeasured} />
          <Field label={t("planetDetail.fields.magnetosphere")} value={fmt(planet.magnetosphere_strength)} />
          <Field label={t("planetDetail.fields.tectonics")} value={fmt(planet.tectonic_activity)} />
        </Section>

        <Section title={t("planetDetail.sections.scores")}>
          <Field label={t("planetDetail.fields.esi")} value={fmt(planet.esi_score)} />
          <Field label={t("planetDetail.fields.habitability")} value={fmt(planet.habitability_score)} />
          <Field label={t("planetDetail.fields.resources")} value={fmt(planet.resource_score)} />
        </Section>
      </div>

      {planet.detected_molecules?.length > 0 && planet.molecule_source === "exoplanet.eu" && (
        <p className="text-xs text-slate-600 mt-6">{t("planetDetail.dataSourceNote")}</p>
      )}
    </div>
  )
}
