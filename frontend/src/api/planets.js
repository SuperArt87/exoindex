import { apiFetch } from "./client"

export function listPlanets({
  search, planetType, inHabitableZone, biosignatureCandidate, hasDetectedMolecules,
  hasAtmosphere, hasH2o, hasCarbon, ordering, page,
} = {}) {
  const params = new URLSearchParams()
  if (search) params.set("search", search)
  if (planetType) params.set("planet_type", planetType)
  if (inHabitableZone !== undefined && inHabitableZone !== "") params.set("in_habitable_zone", inHabitableZone)
  if (biosignatureCandidate !== undefined && biosignatureCandidate !== "") params.set("biosignature_candidate", biosignatureCandidate)
  if (hasDetectedMolecules !== undefined && hasDetectedMolecules !== "") params.set("has_detected_molecules", hasDetectedMolecules)
  if (hasAtmosphere !== undefined && hasAtmosphere !== "") params.set("has_atmosphere", hasAtmosphere)
  if (hasH2o !== undefined && hasH2o !== "") params.set("has_h2o", hasH2o)
  if (hasCarbon !== undefined && hasCarbon !== "") params.set("has_carbon", hasCarbon)
  if (ordering) params.set("ordering", ordering)
  if (page) params.set("page", page)
  const qs = params.toString()
  // auth: true -- niet verplicht (catalogus is publiek), maar zorgt dat een
  // ingelogde gebruiker de "update"-tag (is_updated) en de bijbehorende
  // catalog_last_viewed_at-bijwerking krijgt. Zonder token stuurt apiFetch
  // gewoon geen Authorization-header mee, dan werkt dit endpoint identiek
  // aan voorheen.
  return apiFetch(`/api/planets/${qs ? `?${qs}` : ""}`, { auth: true })
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
