import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { BrowserRouter, Route, Routes } from "react-router-dom"
import { AuthProvider } from "./context/AuthContext"
import Navbar from "./components/Navbar"
import Footer from "./components/Footer"
import ProtectedRoute from "./components/ProtectedRoute"
import HomePage from "./pages/HomePage"
import CatalogPage from "./pages/CatalogPage"
import PlanetDetailPage from "./pages/PlanetDetailPage"
import LoginPage from "./pages/LoginPage"
import RegisterPage from "./pages/RegisterPage"
import PortfolioPage from "./pages/PortfolioPage"
import HowItWorksPage from "./pages/HowItWorksPage"
import AboutPage from "./pages/AboutPage"
import PrivacyPage from "./pages/PrivacyPage"
import TermsPage from "./pages/TermsPage"
import FaqPage from "./pages/FaqPage"
import DataSourcesPage from "./pages/DataSourcesPage"

const queryClient = new QueryClient()

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <Navbar />
          <main className="flex-1 flex flex-col">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/catalogus" element={<CatalogPage />} />
              <Route path="/planets/:id" element={<PlanetDetailPage />} />
              <Route path="/hoe-werkt-het" element={<HowItWorksPage />} />
              <Route path="/over-ons" element={<AboutPage />} />
              <Route path="/faq" element={<FaqPage />} />
              <Route path="/databronnen" element={<DataSourcesPage />} />
              <Route path="/privacy" element={<PrivacyPage />} />
              <Route path="/voorwaarden" element={<TermsPage />} />
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
          <Footer />
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
