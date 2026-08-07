import { useState } from "react"
import { Link } from "react-router-dom"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { getPortfolio, getTransactions, sellPlanet } from "../api/trading"
import { useAuth } from "../context/AuthContext"
import { ApiError } from "../api/client"

function credits(value) {
  return `${Number(value).toLocaleString("nl-NL", { minimumFractionDigits: 2 })} cr`
}

export default function PortfolioPage() {
  const { user, refreshUser } = useAuth()
  const queryClient = useQueryClient()
  const [error, setError] = useState(null)

  const { data: portfolio, isLoading: portfolioLoading } = useQuery({
    queryKey: ["portfolio"],
    queryFn: getPortfolio,
  })

  const { data: transactions, isLoading: txLoading } = useQuery({
    queryKey: ["transactions"],
    queryFn: getTransactions,
  })

  const sellMutation = useMutation({
    mutationFn: (planetId) => sellPlanet(planetId),
    onSuccess: async () => {
      setError(null)
      await queryClient.invalidateQueries({ queryKey: ["portfolio"] })
      await queryClient.invalidateQueries({ queryKey: ["transactions"] })
      await refreshUser()
    },
    onError: (err) => setError(err instanceof ApiError ? err.message : "Verkopen mislukt."),
  })

  const holdings = portfolio?.results ?? []

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 w-full">
      <h1 className="text-2xl font-semibold text-slate-100 mb-1">Portfolio</h1>
      <p className="text-slate-400 mb-6">
        Saldo: <span className="text-emerald-400 font-medium">{user ? credits(user.credits_balance) : "..."}</span>
      </p>

      {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

      <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wide mb-3">Bezit</h2>
      {portfolioLoading ? (
        <p className="text-slate-500 mb-8">Laden...</p>
      ) : holdings.length === 0 ? (
        <p className="text-slate-500 mb-8">Je bezit nog geen planeten. <Link to="/" className="text-indigo-400">Bekijk de catalogus</Link>.</p>
      ) : (
        <div className="space-y-2 mb-8">
          {holdings.map((h) => {
            const currentTotal = h.current_total_value_credits
            const costTotal = Number(h.purchase_price_credits) * h.quantity
            const gain = currentTotal !== null ? currentTotal - costTotal : null
            return (
              <div key={h.id} className="rounded-lg border border-slate-800 bg-slate-900/40 p-3 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <Link to={`/planets/${h.planet}`} className="text-slate-100 font-medium hover:text-white">{h.planet_name}</Link>
                  <p className="text-xs text-slate-500">
                    {h.quantity}x · gem. aankoopprijs {credits(h.purchase_price_credits)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-slate-200">{currentTotal !== null ? credits(currentTotal) : "—"}</p>
                  {gain !== null && (
                    <p className={`text-xs ${gain >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                      {gain >= 0 ? "+" : ""}{credits(gain)}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => sellMutation.mutate(h.planet)}
                  disabled={sellMutation.isPending}
                  className="px-3 py-1.5 rounded-md border border-red-800 text-red-400 text-sm hover:bg-red-950 disabled:opacity-50"
                >
                  Verkoop alles
                </button>
              </div>
            )
          })}
        </div>
      )}

      <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wide mb-3">Transactiegeschiedenis</h2>
      {txLoading ? (
        <p className="text-slate-500">Laden...</p>
      ) : !transactions?.results?.length ? (
        <p className="text-slate-500">Nog geen transacties.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500 border-b border-slate-800">
                <th className="py-2 pr-4">Planeet</th>
                <th className="py-2 pr-4">Actie</th>
                <th className="py-2 pr-4">Aantal</th>
                <th className="py-2 pr-4">Prijs/stuk</th>
                <th className="py-2 pr-4">Totaal</th>
                <th className="py-2">Datum</th>
              </tr>
            </thead>
            <tbody>
              {transactions.results.map((t) => (
                <tr key={t.id} className="border-b border-slate-900">
                  <td className="py-2 pr-4 text-slate-200">{t.planet_name}</td>
                  <td className={`py-2 pr-4 ${t.action === "buy" ? "text-emerald-400" : "text-red-400"}`}>
                    {t.action === "buy" ? "Koop" : "Verkoop"}
                  </td>
                  <td className="py-2 pr-4 text-slate-300">{t.quantity}x</td>
                  <td className="py-2 pr-4 text-slate-300">{credits(t.price_credits)}</td>
                  <td className="py-2 pr-4 text-slate-300">{credits(t.total_price_credits)}</td>
                  <td className="py-2 text-slate-500">{new Date(t.created_at).toLocaleString("nl-NL")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
