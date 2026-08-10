import { useState } from "react"
import { Link } from "react-router-dom"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { getPortfolio, getTransactions, sellPlanet } from "../api/trading"
import { useAuth } from "../context/AuthContext"
import { ApiError } from "../api/client"
import { formatCredits, formatDateTime } from "../i18n/format"

export default function PortfolioPage() {
  const { t, i18n } = useTranslation()
  const lang = i18n.resolvedLanguage || i18n.language
  const credits = (value) => `${formatCredits(value, lang)} cr`
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
    onError: (err) => setError(err instanceof ApiError ? err.message : t("portfolio.sellError")),
  })

  const holdings = portfolio?.results ?? []

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 w-full">
      <h1 className="text-2xl font-semibold text-slate-100 mb-1">{t("portfolio.title")}</h1>
      <p className="text-slate-400 mb-6">
        {t("portfolio.balance")}: <span className="text-emerald-400 font-medium">{user ? credits(user.credits_balance) : "..."}</span>
      </p>

      {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

      <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wide mb-3">{t("portfolio.holdings")}</h2>
      {portfolioLoading ? (
        <p className="text-slate-500 mb-8">{t("common.loading")}</p>
      ) : holdings.length === 0 ? (
        <p className="text-slate-500 mb-8">
          {t("portfolio.empty")} <Link to="/catalogus" className="text-indigo-400">{t("portfolio.viewCatalog")}</Link>.
        </p>
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
                    {t("portfolio.avgPurchasePrice", { quantity: h.quantity, price: credits(h.purchase_price_credits) })}
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
                  {t("portfolio.sellAll")}
                </button>
              </div>
            )
          })}
        </div>
      )}

      <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wide mb-3">{t("portfolio.transactions")}</h2>
      {txLoading ? (
        <p className="text-slate-500">{t("common.loading")}</p>
      ) : !transactions?.results?.length ? (
        <p className="text-slate-500">{t("portfolio.noTransactions")}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500 border-b border-slate-800">
                <th className="py-2 pr-4">{t("portfolio.table.planet")}</th>
                <th className="py-2 pr-4">{t("portfolio.table.action")}</th>
                <th className="py-2 pr-4">{t("portfolio.table.quantity")}</th>
                <th className="py-2 pr-4">{t("portfolio.table.pricePerUnit")}</th>
                <th className="py-2 pr-4">{t("portfolio.table.total")}</th>
                <th className="py-2">{t("portfolio.table.date")}</th>
              </tr>
            </thead>
            <tbody>
              {transactions.results.map((tr) => (
                <tr key={tr.id} className="border-b border-slate-900">
                  <td className="py-2 pr-4 text-slate-200">{tr.planet_name}</td>
                  <td className={`py-2 pr-4 ${tr.action === "buy" ? "text-emerald-400" : "text-red-400"}`}>
                    {tr.action === "buy" ? t("portfolio.table.buy") : t("portfolio.table.sell")}
                  </td>
                  <td className="py-2 pr-4 text-slate-300">{tr.quantity}x</td>
                  <td className="py-2 pr-4 text-slate-300">{credits(tr.price_credits)}</td>
                  <td className="py-2 pr-4 text-slate-300">{credits(tr.total_price_credits)}</td>
                  <td className="py-2 text-slate-500">{formatDateTime(tr.created_at, lang)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
