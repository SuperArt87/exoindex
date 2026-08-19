import { useEffect, useRef, useState } from "react"
import { useSearchParams } from "react-router-dom"
import { keepPreviousData, useQuery } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { listPlanets } from "../api/planets"
import PlanetCard from "../components/PlanetCard"

const PLANET_TYPE_VALUES = ["", "rocky", "super_earth", "sub_neptune", "ice_giant", "gas_giant"]
const ORDERING_VALUES = [
  "-habitability_score", "habitability_score", "-resource_score", "resource_score", "distance_from_earth_ly",
]

export default function CatalogPage() {
  const { t } = useTranslation()
  // Filters leven ook in de URL-querystring (?search=...&planet_type=...) --
  // niet alleen in React state. Zonder dit werden ze bij het verlaten van
  // de pagina (bv. een planeetkaart openen) simpelweg weggegooid: React
  // state overleeft geen unmount, dus "vorige" (browser-back of de terug-
  // link op de detailpagina, zie PlanetDetailPage.jsx) landde altijd op een
  // kale, ongefilterde catalogus. Met de filters in de URL herstelt de
  // browser ze vanzelf zodra je terugkeert naar diezelfde URL.
  const [searchParams, setSearchParams] = useSearchParams()

  const [searchInput, setSearchInput] = useState(() => searchParams.get("search") || "")
  const [search, setSearch] = useState(() => searchParams.get("search") || "")
  const [planetType, setPlanetType] = useState(() => searchParams.get("planet_type") || "")
  const [inHabitableZone, setInHabitableZone] = useState(() => searchParams.get("in_habitable_zone") || "")
  const [hasDetectedMolecules, setHasDetectedMolecules] = useState(() => searchParams.get("has_detected_molecules") || "")
  const [biosignatureOnly, setBiosignatureOnly] = useState(() => searchParams.get("biosignature") === "true")
  const [atmosphereOnly, setAtmosphereOnly] = useState(() => searchParams.get("atmosphere") === "true")
  const [h2oOnly, setH2oOnly] = useState(() => searchParams.get("h2o") === "true")
  const [carbonOnly, setCarbonOnly] = useState(() => searchParams.get("carbon") === "true")
  const [ordering, setOrdering] = useState(() => searchParams.get("ordering") || "-habitability_score")
  const [page, setPage] = useState(() => Number(searchParams.get("page")) || 1)

  useEffect(() => {
    const timeout = setTimeout(() => setSearch(searchInput), 350)
    return () => clearTimeout(timeout)
  }, [searchInput])

  // Elke keer dat een filter verandert hoort de paginering terug naar 1 --
  // BEHALVE bij de allereerste render, want dan komt page mogelijk net uit
  // de URL (herstelde staat), en zou dit die meteen weer overschrijven.
  const skipNextPageReset = useRef(true)
  useEffect(() => {
    if (skipNextPageReset.current) {
      skipNextPageReset.current = false
      return
    }
    setPage(1)
  }, [search, planetType, inHabitableZone, hasDetectedMolecules, biosignatureOnly, atmosphereOnly, h2oOnly, carbonOnly, ordering])

  // Spiegelt de huidige filterstaat terug naar de URL -- replace i.p.v. push,
  // anders vult elke tik in een filter de browserhistory met tussenstappen
  // en moet je een hele reeks oude filtercombinaties door-backen voor je
  // weer bij de vorige pagina bent.
  useEffect(() => {
    const params = new URLSearchParams()
    if (search) params.set("search", search)
    if (planetType) params.set("planet_type", planetType)
    if (inHabitableZone) params.set("in_habitable_zone", inHabitableZone)
    if (hasDetectedMolecules) params.set("has_detected_molecules", hasDetectedMolecules)
    if (biosignatureOnly) params.set("biosignature", "true")
    if (atmosphereOnly) params.set("atmosphere", "true")
    if (h2oOnly) params.set("h2o", "true")
    if (carbonOnly) params.set("carbon", "true")
    if (ordering !== "-habitability_score") params.set("ordering", ordering)
    if (page !== 1) params.set("page", String(page))
    setSearchParams(params, { replace: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, planetType, inHabitableZone, hasDetectedMolecules, biosignatureOnly, atmosphereOnly, h2oOnly, carbonOnly, ordering, page])

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["planets", { search, planetType, inHabitableZone, hasDetectedMolecules, biosignatureOnly, atmosphereOnly, h2oOnly, carbonOnly, ordering, page }],
    queryFn: () =>
      listPlanets({
        search: search || undefined,
        planetType: planetType || undefined,
        inHabitableZone: inHabitableZone || undefined,
        hasDetectedMolecules: hasDetectedMolecules || undefined,
        biosignatureCandidate: biosignatureOnly ? "true" : undefined,
        hasAtmosphere: atmosphereOnly ? "true" : undefined,
        hasH2o: h2oOnly ? "true" : undefined,
        hasCarbon: carbonOnly ? "true" : undefined,
        ordering,
        page,
      }),
    placeholderData: keepPreviousData,
  })

  const results = data?.results ?? []
  const hasNext = Boolean(data?.next)
  const hasPrev = Boolean(data?.previous)

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 w-full">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-100">{t("catalog.title")}</h1>
        <p className="text-slate-500 text-sm mt-1">
          {data ? t("catalog.count", { count: data.count }) : t("common.loading")} — {t("catalog.subtitle")}
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        <input
          type="text"
          placeholder={t("catalog.searchPlaceholder")}
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="col-span-2 sm:col-span-3 lg:col-span-2 rounded-md bg-slate-900 border border-slate-700 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
        />
        <select
          value={planetType}
          onChange={(e) => setPlanetType(e.target.value)}
          className="rounded-md bg-slate-900 border border-slate-700 px-3 py-2 text-sm text-slate-100"
        >
          {PLANET_TYPE_VALUES.map((v) => (
            <option key={v} value={v}>{t(`catalog.types.${v || "all"}`)}</option>
          ))}
        </select>
        <select
          value={inHabitableZone}
          onChange={(e) => setInHabitableZone(e.target.value)}
          className="rounded-md bg-slate-900 border border-slate-700 px-3 py-2 text-sm text-slate-100"
        >
          <option value="">{t("catalog.hz.all")}</option>
          <option value="true">{t("catalog.hz.inside")}</option>
          <option value="false">{t("catalog.hz.outside")}</option>
        </select>
        <select
          value={hasDetectedMolecules}
          onChange={(e) => setHasDetectedMolecules(e.target.value)}
          className="rounded-md bg-slate-900 border border-slate-700 px-3 py-2 text-sm text-slate-100"
        >
          <option value="">{t("catalog.molecules.all")}</option>
          <option value="true">{t("catalog.molecules.detected")}</option>
          <option value="false">{t("catalog.molecules.notDetected")}</option>
        </select>
        <select
          value={ordering}
          onChange={(e) => setOrdering(e.target.value)}
          className="rounded-md bg-slate-900 border border-slate-700 px-3 py-2 text-sm text-slate-100"
        >
          {ORDERING_VALUES.map((v) => (
            <option key={v} value={v}>{t(`catalog.orderings.${v}`)}</option>
          ))}
        </select>
      </div>

      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mb-6">
        <label className="flex items-center gap-2 text-sm text-slate-300">
          <input
            type="checkbox"
            checked={biosignatureOnly}
            onChange={(e) => setBiosignatureOnly(e.target.checked)}
            className="rounded border-slate-700"
          />
          {t("catalog.checkboxes.biosignature")}
        </label>
        <label className="flex items-center gap-2 text-sm text-slate-300">
          <input
            type="checkbox"
            checked={atmosphereOnly}
            onChange={(e) => setAtmosphereOnly(e.target.checked)}
            className="rounded border-slate-700"
          />
          {t("catalog.checkboxes.atmosphere")}
        </label>
        <label className="flex items-center gap-2 text-sm text-slate-300">
          <input
            type="checkbox"
            checked={h2oOnly}
            onChange={(e) => setH2oOnly(e.target.checked)}
            className="rounded border-slate-700"
          />
          {t("catalog.checkboxes.h2o")}
        </label>
        <label className="flex items-center gap-2 text-sm text-slate-300">
          <input
            type="checkbox"
            checked={carbonOnly}
            onChange={(e) => setCarbonOnly(e.target.checked)}
            className="rounded border-slate-700"
          />
          {t("catalog.checkboxes.carbon")}
        </label>
      </div>

      {isError && (
        <p className="text-red-400 text-sm mb-4">{t("catalog.error", { message: error.message })}</p>
      )}

      {isLoading ? (
        <p className="text-slate-500">{t("common.loading")}</p>
      ) : results.length === 0 ? (
        <p className="text-slate-500">{t("catalog.empty")}</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {results.map((p) => <PlanetCard key={p.id} planet={p} />)}
        </div>
      )}

      <div className="flex justify-center gap-3 mt-8">
        <button
          disabled={!hasPrev}
          onClick={() => setPage((p) => p - 1)}
          className="px-4 py-2 text-sm rounded-md border border-slate-700 text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-800"
        >
          {t("catalog.prev")}
        </button>
        <span className="px-3 py-2 text-sm text-slate-500">{t("catalog.page", { page })}</span>
        <button
          disabled={!hasNext}
          onClick={() => setPage((p) => p + 1)}
          className="px-4 py-2 text-sm rounded-md border border-slate-700 text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-800"
        >
          {t("catalog.next")}
        </button>
      </div>
    </div>
  )
}
