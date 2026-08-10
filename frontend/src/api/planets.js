import { apiFetch } from "./client"

export function listPlanets({ search, planetType, inHabitableZone, biosignatureCandidate, hasDetectedMolecules, ordering, page } = {}) {
  const params = new URLSearchParams()
  if (search) params.set("search", search)
  if (planetType) params.set("planet_type", planetType)
  if (inHabitableZone !== undefined && inHabitableZone !== "") params.set("in_habitable_zone", inHabitableZone)
  if (biosignatureCandidate !== undefined && biosignatureCandidate !== "") params.set("biosignature_candidate", biosignatureCandidate)
  if (hasDetectedMolecules !== undefined && hasDetectedMolecules !== "") params.set("has_detected_molecules", hasDetectedMolecules)
  if (ordering) params.set("ordering", ordering)
  if (page) params.set("page", page)
  const qs = params.toString()
  return apiFetch(`/api/planets/${qs ? `?${qs}` : ""}`)
}

export function getPlanet(id) {
  return apiFetch(`/api/planets/${id}/`)
}

/**
 * Alle planeten met hetzelfde host_name -- voor de stelsel-visualisatie.
 * full=true is nodig omdat de standaard lijst-serializer (voor de
 * catalogus-grid) orbit_semi_major_axis_au/hz_inner_au/hz_outer_au/etc.
 * NIET bevat -- zonder deze parameter kan de 3D-view niet correct
 * sorteren of de leefbare zone tekenen. De standaard paginagrootte (50,
 * zie backend REST_FRAMEWORK-settings) is ruim genoeg voor elk stelsel.
 */
export function listPlanetsByHost(hostName) {
  const params = new URLSearchParams({ host_name: hostName, full: "true" })
  return apiFetch(`/api/planets/?${params.toString()}`)
}

/** Prijshistorie voor de waardegrafiek. range: "week" | "month" | "year". */
export function getPlanetHistory(id, range = "month") {
  return apiFetch(`/api/planets/${id}/history/?range=${range}`)
}
