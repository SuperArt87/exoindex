import { useState } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { ApiError } from "../api/client"

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)
    try {
      await login(username, password)
      navigate(location.state?.from?.pathname || "/catalogus", { replace: true })
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Inloggen mislukt.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-sm mx-auto px-4 py-16 w-full">
      <h1 className="text-xl font-semibold text-slate-100 mb-6">Inloggen</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm text-slate-400 mb-1">Gebruikersnaam</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            className="w-full rounded-md bg-slate-900 border border-slate-700 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
          />
        </div>
        <div>
          <label className="block text-sm text-slate-400 mb-1">Wachtwoord</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full rounded-md bg-slate-900 border border-slate-700 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
          />
        </div>
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-2 rounded-md bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-500 disabled:opacity-50"
        >
          {isSubmitting ? "Bezig..." : "Inloggen"}
        </button>
      </form>
      <p className="text-sm text-slate-500 mt-4">
        Nog geen account? <Link to="/register" className="text-indigo-400">Registreer</Link>
      </p>
    </div>
  )
}
