import { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { SubscriptionProvider, useSubscription } from './subscription/SubscriptionContext';
import { canAccess, PLANS } from './subscription/plans';

import Sidebar from './components/Sidebar';
import SubjectManager from './components/SubjectManager';
import EvaluationPanel from './components/EvaluationPanel';
import PDFTools from './components/PDFTools';
import Analytics from './components/Analytics';
import Settings from './components/Settings';
import LockedOverlay from './components/LockedOverlay';

import HomePage from './Pages/HomePage.jsx';
import LoginPage from './Pages/LoginPage.jsx';
import RegisterPage from './Pages/RegisterPage.jsx';
import PricingPage from './Pages/Pricingpage.jsx';

import appStyles from './App.module.css';

// ── Panel map ─────────────────────────────────────────────────────────────────
const PANELS = {
  subjects:   <SubjectManager />,
  evaluation: <EvaluationPanel />,
  pdf:        <PDFTools />,
  analytics:  <Analytics />,
  settings:   <Settings />,
};

// ── Dashboard (subscription-gated) ───────────────────────────────────────────
function Dashboard({ onOpenPricing }) {
  const { state } = useApp();
  const { state: subState, isActive } = useSubscription();
  const activeTab = state.activeTab;

  const planId = subState.planId;
  const isLocked = !isActive || (planId && !canAccess(planId, activeTab));

  return (
    <div className={appStyles.app}>
      <Sidebar onOpenPricing={onOpenPricing} />
      <main className={appStyles.content}>
        {PANELS[activeTab]}
        {isLocked && <LockedOverlay tabId={activeTab} onUpgrade={onOpenPricing} />}
      </main>
    </div>
  );
}

// ── Root App — reads auth from AppContext ────────────────────────────────────
function AppRouter() {
  const { state, login, register, logout } = useApp();
  const [page, setPage] = useState('home'); // 'home' | 'login' | 'register'

  const navigate = (target) => setPage(target);

  // While validating stored token — show nothing (or a spinner)
  if (state.authLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0c10' }}>
        <div style={{ width: 32, height: 32, border: '2px solid rgba(56,189,248,.2)', borderTopColor: '#38bdf8', borderRadius: '50%', animation: 'spin .8s linear infinite' }} />
      </div>
    );
  }

  // ── Not logged in ──────────────────────────────────────────────────────────
  if (!state.authUser) {
    if (page === 'home')     return <HomePage onNavigate={navigate} />;
    if (page === 'register') return <RegisterPage onNavigate={navigate} onRegister={register} />;
    // default: login
    return <LoginPage onNavigate={navigate} onLogin={login} />;
  }

  // ── Logged in → Dashboard with subscription context ────────────────────────
  return (
    <SubscriptionProvider>
      <DashboardRouter onLogout={logout} />
    </SubscriptionProvider>
  );
}

function DashboardRouter({ onLogout }) {
  const [showPricing, setShowPricing] = useState(false);
  const { state: subState } = useSubscription();

  if (!subState.planId && !showPricing) {
    return <PricingPage onBack={() => setShowPricing(true)} />;
  }

  if (showPricing || subState.showPricing) {
    return <PricingPage onBack={() => setShowPricing(false)} />;
  }

  return <Dashboard onOpenPricing={() => setShowPricing(true)} />;
}

// ── Entry point ───────────────────────────────────────────────────────────────
export default function App() {
  return (
    <AppProvider>
      <AppRouter />
    </AppProvider>
  );
}