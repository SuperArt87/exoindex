import { useEffect, useState } from "react"
import { keepPreviousData, useQuery } from "@tanstack/react-query"
import { listPlanets } from "../api/planets"
import PlanetCard from "../components/PlanetCard"

const PLANET_TYPES = [
  { value: "", label: "Alle types" },
  { value: "rocky", label: "Rotsachtig" },
  { value: "super_earth", label: "Super-Earth" },
  { value: "sub_neptune", label: "Sub-Neptune" },
  { value: "ice_giant", label: "IJsreus" },
  { value: "gas_giant", label: "Gasreus" },
]

const ORDERINGS = [
  { value: "-habitability_score", label: "Leefbaarheid (hoog → laag)" },
  { value: "habitability_score", label: "Leefbaarheid (laag → hoog)" },
  { value: "-resource_score", label: "Grondstoffen (hoog → laag)" },
  { value: "resource_score", label: "Grondstoffen (laag → hoog)" },
  { value: "distance_from_earth_ly", label: "Afstand (dichtbij → ver)" },
]

export default function CatalogPage() {
  const [searchInput, setSearchInput] = useState("")
  const [search, setSearch] = useState("")
  const [planetType, setPlanetType] = useState("")
  const [inHabitableZone, setInHabitableZone] = useState("")
  const [hasDetectedMolecules, setHasDetectedMolecules] = useState("")
  const [biosignatureOnly, setBiosignatureOnly] = useState(false)
  const [ordering, setOrdering] = useState("-habitability_score")
  const [page, setPage] = useState(1)

  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput), 350)
    return () => clearTimeout(t)
  }, [searchInput])

  useEffect(() => {
    setPage(1)
  }, [search, planetType, inHabitableZone, hasDetectedMolecules, biosignatureOnly, ordering])

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["planets", { search, planetType, inHabitableZone, hasDetectedMolecules, biosignatureOnly, ordering, page }],
    queryFn: () =>
      listPlanets({
        search: search || undefined,
        planetType: planetType || undefined,
        inHabitableZone: inHabitableZone || undefined,
        hasDetectedMolecules: hasDetectedMolecules || undefined,
        biosignatureCandidate: biosignatureOnly ? "true" : undefined,
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
        <h1 className="text-2xl font-semibold text-slate-100">Planetencatalogus</h1>
        <p className="text-slate-500 text-sm mt-1">
          {data ? `${data.count} planeten` : "Laden..."} — wetenschappelijk onderbouwde waarderingsindex.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        <input
          type="text"
          placeholder="Zoek op naam of ster..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="col-span-2 sm:col-span-3 lg:col-span-2 rounded-md bg-slate-900 border border-slate-700 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
        />
        <select
          value={planetType}
          onChange={(e) => setPlanetType(e.target.value)}
          className="rounded-md bg-slate-900 border border-slate-700 px-3 py-2 text-sm text-slate-100"
        >
          {PLANET_TYPES.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <select
          value={inHabitableZone}
          onChange={(e) => setInHabitableZone(e.target.value)}
          className="rounded-md bg-slate-900 border border-slate-700 px-3 py-2 text-sm text-slate-100"
        >
          <option value="">HZ: alle</option>
          <option value="true">In leefbare zone</option>
          <option value="false">Buiten leefbare zone</option>
        </select>
        <select
          value={hasDetectedMolecules}
          onChange={(e) => setHasDetectedMolecules(e.target.value)}
          className="rounded-md bg-slate-900 border border-slate-700 px-3 py-2 text-sm text-slate-100"
        >
          <option value="">Moleculen: alle</option>
          <option value="true">Moleculen gedetecteerd</option>
          <option value="false">Geen moleculen gedetecteerd</option>
        </select>
        <select
          value={ordering}
          onChange={(e) => setOrdering(e.target.value)}
          className="rounded-md bg-slate-900 border border-slate-700 px-3 py-2 text-sm text-slate-100"
        >
          {ORDERINGS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <label className="flex items-center gap-2 text-sm text-slate-300 px-1">
          <input
            type="checkbox"
            checked={biosignatureOnly}
            onChange={(e) => setBiosignatureOnly(e.target.checked)}
            className="rounded border-slate-700"
          />
          Alleen biosignature-kandidaten
        </label>
      </div>

      {isError && (
        <p className="text-red-400 text-sm mb-4">Kon planeten niet laden: {error.message}</p>
      )}

      {isLoading ? (
        <p className="text-slate-500">Laden...</p>
      ) : results.length === 0 ? (
        <p className="text-slate-500">Geen planeten gevonden met deze filters.</p>
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
          Vorige
        </button>
        <span className="px-3 py-2 text-sm text-slate-500">Pagina {page}</span>
        <button
          disabled={!hasNext}
          onClick={() => setPage((p) => p + 1)}
          className="px-4 py-2 text-sm rounded-md border border-slate-700 text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-800"
        >
          Volgende
        </button>
      </div>
    </div>
  )
}
