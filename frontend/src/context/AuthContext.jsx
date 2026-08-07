import { createContext, useCallback, useContext, useEffect, useState } from "react"
import { getMe, login as apiLogin, register as apiRegister } from "../api/auth"
import { clearTokens, getTokens, setTokens } from "../api/client"

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  const refreshUser = useCallback(async () => {
    const { access } = getTokens()
    if (!access) {
      setUser(null)
      return
    }
    try {
      const me = await getMe()
      setUser(me)
    } catch {
      clearTokens()
      setUser(null)
    }
  }, [])

  useEffect(() => {
    refreshUser().finally(() => setIsLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const login = useCallback(async (username, password) => {
    const tokens = await apiLogin({ username, password })
    setTokens(tokens)
    await refreshUser()
  }, [refreshUser])

  const register = useCallback(async (username, email, password) => {
    await apiRegister({ username, email, password })
    await login(username, password)
  }, [login])

  const logout = useCallback(() => {
    clearTokens()
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth moet binnen een AuthProvider gebruikt worden.")
  return ctx
}
