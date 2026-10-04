import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useSubscription } from '../subscription/SubscriptionContext';
import { canAccess } from '../subscription/plans';
import { ScrollReveal } from '../components/motion/ScrollReveal';

import Sidebar from '../components/Sidebar';
import SubjectManager from '../components/SubjectManager';
import EvaluationPanel from '../components/EvaluationPanel';
import PDFTools from '../components/PDFTools';
import Analytics from '../components/Analytics';
import Settings from '../components/Settings';
import LockedOverlay from '../components/LockedOverlay';
import Chatbot from '../components/Chatbot';

import appStyles from '../App.module.css';

const VALID_TABS = ['subjects', 'evaluation', 'pdf', 'analytics', 'settings'];

export default function Dashboard() {
  const { tab } = useParams();
  const navigate = useNavigate();
  const { state, dispatch } = useApp();
  const { state: subState, isActive } = useSubscription();

  // ── Analytics context for chatbot ─────────────────────────────────────────
  const [analyticsData, setAnalyticsData] = useState(null);

  const handleAnalyticsData = useCallback((data) => {
    setAnalyticsData(data);
  }, []);

  // Sync URL ↔ AppContext activeTab
  useEffect(() => {
    if (tab && VALID_TABS.includes(tab)) {
      if (state.activeTab !== tab) {
        dispatch({ type: 'SET_TAB', payload: tab });
      }
    } else {
      navigate(`/dashboard/${state.activeTab || 'subjects'}`, { replace: true });
    }
  }, [tab]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const currentTab = state.activeTab || 'subjects';
    if (tab !== currentTab) {
      navigate(`/dashboard/${currentTab}`, { replace: true });
    }
  }, [state.activeTab]); // eslint-disable-line react-hooks/exhaustive-deps

  const activeTab = state.activeTab || 'subjects';
  const planId    = subState.planId;
  const isLocked  = !isActive || (planId && !canAccess(planId, activeTab));

  function handleOpenPricing() {
    navigate('/pricing');
  }

  // ── Build panels — Analytics gets the context callback ────────────────────
  const PANELS = {
    subjects:   <SubjectManager />,
    evaluation: <EvaluationPanel />,
    pdf:        <PDFTools />,
    analytics:  <Analytics onAnalyticsData={handleAnalyticsData} />,
    settings:   <Settings />,
  };

  return (
    <div className={appStyles.app}>
      <Sidebar onOpenPricing={handleOpenPricing} />
      <main className={appStyles.content}>
        <ScrollReveal delay={0} type="fade-up" distance={20}>
          {PANELS[activeTab]}
        </ScrollReveal>
        {isLocked && (
          <ScrollReveal delay={0.2} type="fade-up" distance={20}>
            <LockedOverlay tabId={activeTab} onUpgrade={handleOpenPricing} />
          </ScrollReveal>
        )}
      </main>

      {/* Chatbot — only rendered when user is authenticated and has an active plan */}
      {isActive && (
        <ScrollReveal delay={0.4} type="fade-up" distance={20}>
          <Chatbot
            activeTab={activeTab}
            analyticsData={analyticsData}
          />
        </ScrollReveal>
      )}
    </div>
  );
}