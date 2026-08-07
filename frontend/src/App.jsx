import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { BrowserRouter, Route, Routes } from "react-router-dom"
import { AuthProvider } from "./context/AuthContext"
import Navbar from "./components/Navbar"
import ProtectedRoute from "./components/ProtectedRoute"
import CatalogPage from "./pages/CatalogPage"
import PlanetDetailPage from "./pages/PlanetDetailPage"
import LoginPage from "./pages/LoginPage"
import RegisterPage from "./pages/RegisterPage"
import PortfolioPage from "./pages/PortfolioPage"

const queryClient = new QueryClient()

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <Navbar />
          <main className="flex-1 flex flex-col">
            <Routes>
              <Route path="/" element={<CatalogPage />} />
              <Route path="/planets/:id" element={<PlanetDetailPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route
                path="/portfolio"
                element={
                  <ProtectedRoute>
                    <PortfolioPage />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </main>
          <footer className="border-t border-slate-900 py-4 text-center text-xs text-slate-600">
            Exo Index — fictief handelsplatform, geen echte grondeigendom. Atmosferische data: exoplanet.eu, CC BY 4.0.
          </footer>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
