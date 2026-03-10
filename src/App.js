import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import { AuthProvider } from "./context/Authcontext";
import { AppProvider } from "./context/AppContext";
import { SubscriptionProvider } from "./subscription/SubscriptionContext";

import ProtectedRoute from "./components/ProtectedRoute";

import HomePage from "./Pages/HomePage";
import LoginPage from "./Pages/LoginPage";
import RegisterPage from "./Pages/RegisterPage";
import PricingPage from "./Pages/Pricingpage";
import Dashboard from "./Pages/Dashboard";

export default function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <SubscriptionProvider>
          <BrowserRouter>
            <Routes>

              {/* Public routes */}
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/pricing" element={<PricingPage />} />

              {/* Protected dashboard */}
              <Route
                path="/dashboard/*"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />

              {/* fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />

            </Routes>
          </BrowserRouter>
        </SubscriptionProvider>
      </AppProvider>
    </AuthProvider>
  );
}