import { apiFetch } from "./client"

export function register({ username, email, password }) {
  return apiFetch("/api/auth/register/", { method: "POST", body: { username, email, password } })
}

export function login({ username, password }) {
  return apiFetch("/api/auth/token/", { method: "POST", body: { username, password } })
}

export function getMe() {
  return apiFetch("/api/auth/me/", { auth: true })
}
