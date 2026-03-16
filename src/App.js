import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import { SubscriptionProvider, useSubscription } from './subscription/SubscriptionContext';
import styles from './App.module.css';

import HomePage     from './Pages/HomePage';
import LoginPage    from './Pages/LoginPage';
import RegisterPage from './Pages/RegisterPage';
import PricingPage  from './Pages/Pricingpage';
import Dashboard    from './Pages/Dashboard';

// ── Auth guard: redirects to /login if not logged in ─────────────────────────
function RequireAuth({ children }) {
  const { state } = useApp();

  if (state.authLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0c10' }}>
        <div style={{ width: 32, height: 32, border: '2px solid rgba(56,189,248,.2)', borderTopColor: '#38bdf8', borderRadius: '50%', animation: 'spin .8s linear infinite' }} />
      </div>
    );
  }

  if (!state.authUser) return <Navigate to="/login" replace />;
  return children;
}

// ── Guest guard: redirects to /dashboard if already logged in ────────────────
function GuestOnly({ children }) {
  const { state } = useApp();
  if (state.authLoading) return null;
  if (state.authUser) return <Navigate to="/dashboard" replace />;
  return children;
}

// ── Dashboard wrapper that also wraps SubscriptionProvider ───────────────────
function DashboardLayout() {
  return (
    <SubscriptionProvider>
      <DashboardRoutes />
    </SubscriptionProvider>
  );
}

function DashboardRoutes() {
  const { state: subState } = useSubscription();

  // If the user hasn't picked a plan yet, send them to pricing
  if (!subState.planId) return <Navigate to="/pricing" replace />;

  return <Dashboard />;
}

// ── Root Router ───────────────────────────────────────────────────────────────
function AppRouter() {
  const { login, register, logout } = useApp();

  return (
    <Routes>
      {/* Public pages */}
      <Route path="/"         element={<HomePage />} />
      <Route path="/login"    element={<GuestOnly><LoginPage onLogin={login} /></GuestOnly>} />
      <Route path="/register" element={<GuestOnly><RegisterPage onRegister={register} /></GuestOnly>} />

      {/* Pricing — accessible when logged in (plan selection) */}
      <Route path="/pricing"  element={<RequireAuth><SubscriptionProvider><PricingPage /></SubscriptionProvider></RequireAuth>} />

      {/* Protected dashboard */}
      <Route
        path="/dashboard"
        element={
          <RequireAuth>
            <DashboardLayout />
          </RequireAuth>
        }
      />
      <Route
        path="/dashboard/:tab"
        element={
          <RequireAuth>
            <DashboardLayout />
          </RequireAuth>
        }
      />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <div className={styles.app}>
          <div className={styles.content}>
            <AppRouter />
          </div>
        </div>
      </AppProvider>
    </BrowserRouter>
  );
}