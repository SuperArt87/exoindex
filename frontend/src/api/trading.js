import { apiFetch } from "./client"

export function getPortfolio() {
  return apiFetch("/api/portfolio/", { auth: true })
}

export function getTransactions() {
  return apiFetch("/api/transactions/", { auth: true })
}

export function buyPlanet(planetId, quantity) {
  return apiFetch(`/api/planets/${planetId}/buy/`, {
    method: "POST",
    auth: true,
    body: quantity ? { quantity } : {},
  })
}

export function sellPlanet(planetId, quantity) {
  return apiFetch(`/api/planets/${planetId}/sell/`, {
    method: "POST",
    auth: true,
    body: quantity ? { quantity } : {},
  })
}
