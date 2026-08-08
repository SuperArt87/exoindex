import { apiFetch } from "./client"

export function listPlanets({ search, planetType, inHabitableZone, biosignatureCandidate, ordering, page } = {}) {
  const params = new URLSearchParams()
  if (search) params.set("search", search)
  if (planetType) params.set("planet_type", planetType)
  if (inHabitableZone !== undefined && inHabitableZone !== "") params.set("in_habitable_zone", inHabitableZone)
  if (biosignatureCandidate !== undefined && biosignatureCandidate !== "") params.set("biosignature_candidate", biosignatureCandidate)
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
 * De standaard paginagrootte (50, zie backend REST_FRAMEWORK-settings) is
 * ruim genoeg voor elk stelsel in deze catalogus.
 */
export function listPlanetsByHost(hostName) {
  const params = new URLSearchParams({ host_name: hostName })
  return apiFetch(`/api/planets/?${params.toString()}`)
}
