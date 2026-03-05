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

// ── Panel map ───────────────────────────────────────
const PANELS = {
  subjects:   <SubjectManager />,
  evaluation: <EvaluationPanel />,
  pdf:        <PDFTools />,
  analytics:  <Analytics />,
  settings:   <Settings />,
};

// ── Dashboard (subscription-gated) ─────────────────
function Dashboard({ onOpenPricing }) {
  const { state } = useApp();
  const { state: subState, isActive } = useSubscription();
  const activeTab = state.activeTab;

  // Check if current tab is locked
  const planId = subState.planId;
  const isLocked = !isActive || (planId && !canAccess(planId, activeTab));

  return (
    <div className={appStyles.app}>
      <Sidebar onOpenPricing={onOpenPricing} />
      <main className={appStyles.content}>
        {PANELS[activeTab]}
        {isLocked && (
          <LockedOverlay tabId={activeTab} onUpgrade={onOpenPricing} />
        )}
      </main>
    </div>
  );
}

// ── Root App Router ─────────────────────────────────
export default function App() {
  const [page, setPage] = useState('home');
  const navigate = (target) => setPage(target);

  if (page === 'home')     return <HomePage onNavigate={navigate} />;
  if (page === 'login')    return <LoginPage onNavigate={navigate} />;
  if (page === 'register') return <RegisterPage onNavigate={navigate} />;
  if (page === 'pricing')  return (
    <SubscriptionProvider>
      <PricingPage onBack={() => navigate('dashboard')} />
    </SubscriptionProvider>
  );

  // Dashboard with full subscription context
  return (
    <AppProvider>
      <SubscriptionProvider>
        <DashboardRouter navigate={navigate} />
      </SubscriptionProvider>
    </AppProvider>
  );
}

// Separate component so it can read SubscriptionContext
function DashboardRouter({ navigate }) {
  const [showPricing, setShowPricing] = useState(false);
  const { state: subState } = useSubscription();

  // If no plan selected yet → show pricing first
  if (!subState.planId && !showPricing) {
    return <PricingPage onBack={() => setShowPricing(true)} />;
  }

  if (showPricing || subState.showPricing) {
    return <PricingPage onBack={() => setShowPricing(false)} />;
  }

  return <Dashboard onOpenPricing={() => setShowPricing(true)} />;
}