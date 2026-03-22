import { createContext, useContext, useReducer } from 'react';
import { canAccess, isTrialExpired, trialDaysRemaining } from './plans';

// ── Persist helpers ───────────────────────────────────────────────────────────
const STORAGE_KEY = 'evalai_subscription';

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function saveToStorage(planId, activatedAt) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ planId, activatedAt }));
  } catch {}
}

function clearStorage() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {}
}

// ── Initial state — hydrate from localStorage on load ─────────────────────────
const persisted = loadFromStorage();

const initialState = {
  planId:      persisted?.planId      ?? null,
  activatedAt: persisted?.activatedAt ?? null,
  showPricing: false,
  lockedTab:   null,
};

// ── Reducer ───────────────────────────────────────────────────────────────────
function reducer(state, action) {
  switch (action.type) {
    case 'ACTIVATE_PLAN': {
      const { planId } = action.payload;
      const activatedAt = Date.now();
      saveToStorage(planId, activatedAt);           // ← persist immediately
      return { ...state, planId, activatedAt, showPricing: false, lockedTab: null };
    }
    case 'OPEN_PRICING':
      return { ...state, showPricing: true, lockedTab: action.payload?.lockedTab || null };
    case 'CLOSE_PRICING':
      return { ...state, showPricing: false, lockedTab: null };
    case 'CANCEL_PLAN':
      clearStorage();
      return { ...state, planId: null, activatedAt: null };
    default:
      return state;
  }
}

// ── Context ───────────────────────────────────────────────────────────────────
const SubscriptionContext = createContext(null);

export function SubscriptionProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const isActive =
    state.planId !== null &&
    !(state.planId === 'free_trial' && isTrialExpired(state.activatedAt));

  const daysLeft =
    state.planId === 'free_trial'
      ? trialDaysRemaining(state.activatedAt)
      : null;

  function checkAccess(tabId) {
    if (!isActive) {
      dispatch({ type: 'OPEN_PRICING', payload: { lockedTab: tabId } });
      return false;
    }
    if (!canAccess(state.planId, tabId)) {
      dispatch({ type: 'OPEN_PRICING', payload: { lockedTab: tabId } });
      return false;
    }
    return true;
  }

  return (
    <SubscriptionContext.Provider value={{ state, dispatch, isActive, daysLeft, checkAccess }}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  return useContext(SubscriptionContext);
}