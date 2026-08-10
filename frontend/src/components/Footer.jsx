import { Link } from "react-router-dom"

const LINKS = [
  { to: "/over-ons", label: "Over ons" },
  { to: "/hoe-werkt-het", label: "Hoe werkt het" },
  { to: "/faq", label: "FAQ" },
  { to: "/databronnen", label: "Databronnen" },
  { to: "/privacy", label: "Privacy" },
  { to: "/voorwaarden", label: "Voorwaarden" },
]

export default function Footer() {
  return (
    <footer className="border-t border-slate-900 py-6 text-center text-xs text-slate-600">
      <nav className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 mb-3 px-4">
        {LINKS.map((l) => (
          <Link key={l.to} to={l.to} className="hover:text-slate-400">
            {l.label}
          </Link>
        ))}
      </nav>
      <p>Exo Index — fictief handelsplatform, geen echte grondeigendom. Atmosferische data: exoplanet.eu, CC BY 4.0.</p>
    </footer>
  )
}
