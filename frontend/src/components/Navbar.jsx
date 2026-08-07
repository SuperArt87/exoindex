import { useState } from "react"
import { Link, NavLink } from "react-router-dom"
import { useAuth } from "../context/AuthContext"

const navLinkClass = ({ isActive }) =>
  `px-3 py-2 rounded-md text-sm font-medium ${isActive ? "bg-slate-800 text-white" : "text-slate-300 hover:text-white hover:bg-slate-800/60"
  }`

export default function Navbar() {
  const { user, logout } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <header className="border-b border-slate-800 bg-[#03040a]/95 backdrop-blur sticky top-0 z-20">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          <Link to="/" className="text-slate-100 font-semibold tracking-tight text-lg">
            Exo Index
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            <NavLink to="/" end className={navLinkClass}>Catalogus</NavLink>
            {user && <NavLink to="/portfolio" className={navLinkClass}>Portfolio</NavLink>}
          </nav>

          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <>
                <span className="text-sm text-slate-400">
                  {user.username} · <span className="text-emerald-400">{Number(user.credits_balance).toLocaleString("nl-NL", { minimumFractionDigits: 2 })} cr</span>
                </span>
                <button
                  onClick={logout}
                  className="px-3 py-1.5 text-sm rounded-md border border-slate-700 text-slate-300 hover:bg-slate-800"
                >
                  Uitloggen
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="px-3 py-1.5 text-sm rounded-md text-slate-300 hover:text-white">Inloggen</Link>
                <Link to="/register" className="px-3 py-1.5 text-sm rounded-md bg-indigo-600 text-white hover:bg-indigo-500">Registreren</Link>
              </>
            )}
          </div>

          <button
            className="md:hidden text-slate-300 p-2"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Menu"
          >
            {menuOpen ? "✕" : "☰"}
          </button>
        </div>

        {menuOpen && (
          <div className="md:hidden pb-4 flex flex-col gap-2">
            <NavLink to="/" end className={navLinkClass} onClick={() => setMenuOpen(false)}>Catalogus</NavLink>
            {user && (
              <NavLink to="/portfolio" className={navLinkClass} onClick={() => setMenuOpen(false)}>Portfolio</NavLink>
            )}
            {user ? (
              <>
                <span className="px-3 py-1 text-sm text-slate-400">
                  {user.username} · <span className="text-emerald-400">{Number(user.credits_balance).toLocaleString("nl-NL", { minimumFractionDigits: 2 })} cr</span>
                </span>
                <button
                  onClick={() => { logout(); setMenuOpen(false) }}
                  className="mx-3 px-3 py-1.5 text-sm rounded-md border border-slate-700 text-slate-300 text-left"
                >
                  Uitloggen
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="px-3 py-2 text-sm text-slate-300" onClick={() => setMenuOpen(false)}>Inloggen</Link>
                <Link to="/register" className="mx-3 px-3 py-1.5 text-sm rounded-md bg-indigo-600 text-white text-center" onClick={() => setMenuOpen(false)}>Registreren</Link>
              </>
            )}
          </div>
        )}
      </div>
    </header>
  )
}
