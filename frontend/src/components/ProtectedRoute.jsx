import { Navigate, useLocation } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { useAuth } from "../context/AuthContext"

export default function ProtectedRoute({ children }) {
  const { t } = useTranslation()
  const { user, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return <div className="flex-1 flex items-center justify-center text-slate-400">{t("common.loading")}</div>
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return children
}
