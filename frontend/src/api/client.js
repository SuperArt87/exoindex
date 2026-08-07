const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "https://exoindex-backend.onrender.com"

const ACCESS_KEY = "exoindex_access_token"
const REFRESH_KEY = "exoindex_refresh_token"

export function getTokens() {
  return {
    access: localStorage.getItem(ACCESS_KEY),
    refresh: localStorage.getItem(REFRESH_KEY),
  }
}

export function setTokens({ access, refresh }) {
  if (access) localStorage.setItem(ACCESS_KEY, access)
  if (refresh) localStorage.setItem(REFRESH_KEY, refresh)
}

export function clearTokens() {
  localStorage.removeItem(ACCESS_KEY)
  localStorage.removeItem(REFRESH_KEY)
}

export class ApiError extends Error {
  constructor(message, status, data) {
    super(message)
    this.status = status
    this.data = data
  }
}

async function parseErrorMessage(response) {
  try {
    const data = await response.json()
    if (typeof data.detail === "string") return { message: data.detail, data }
    // DRF-validatiefouten komen als { veldnaam: ["foutmelding"] }
    const firstKey = Object.keys(data)[0]
    if (firstKey && Array.isArray(data[firstKey])) {
      return { message: data[firstKey][0], data }
    }
    return { message: "Er ging iets mis.", data }
  } catch {
    return { message: `Serverfout (${response.status}).`, data: null }
  }
}

async function refreshAccessToken() {
  const { refresh } = getTokens()
  if (!refresh) return false
  const resp = await fetch(`${API_BASE_URL}/api/auth/token/refresh/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh }),
  })
  if (!resp.ok) return false
  const data = await resp.json()
  setTokens({ access: data.access })
  return true
}

/**
 * Fetch-wrapper: voegt automatisch de Bearer-token toe, en probeert bij een
 * 401 eenmalig de access-token te verversen voordat de request wordt herhaald.
 */
export async function apiFetch(path, { auth = false, method = "GET", body } = {}) {
  const doFetch = () => {
    const headers = { "Content-Type": "application/json" }
    if (auth) {
      const { access } = getTokens()
      if (access) headers.Authorization = `Bearer ${access}`
    }
    return fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  }

  let response = await doFetch()

  if (response.status === 401 && auth) {
    const refreshed = await refreshAccessToken()
    if (refreshed) {
      response = await doFetch()
    } else {
      clearTokens()
    }
  }

  if (!response.ok) {
    const { message, data } = await parseErrorMessage(response)
    throw new ApiError(message, response.status, data)
  }

  if (response.status === 204) return null
  return response.json()
}

export { API_BASE_URL }
