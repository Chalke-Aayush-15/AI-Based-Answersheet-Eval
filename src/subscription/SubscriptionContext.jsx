import { createContext, useContext, useReducer } from 'react';
import { canAccess, isTrialExpired, trialDaysRemaining } from './plans';

const initialState = {
  planId: null,          // null = not subscribed yet
  activatedAt: null,     // timestamp when plan was activated
  showPricing: false,    // whether pricing modal is open
  lockedTab: null,       // tab the user tried to access (for upsell messaging)
};

function reducer(state, action) {
  switch (action.type) {
    case 'ACTIVATE_PLAN':
      return {
        ...state,
        planId: action.payload.planId,
        activatedAt: Date.now(),
        showPricing: false,
        lockedTab: null,
      };
    case 'OPEN_PRICING':
      return { ...state, showPricing: true, lockedTab: action.payload?.lockedTab || null };
    case 'CLOSE_PRICING':
      return { ...state, showPricing: false, lockedTab: null };
    case 'CANCEL_PLAN':
      return { ...state, planId: null, activatedAt: null };
    default:
      return state;
  }
}

const SubscriptionContext = createContext(null);

export function SubscriptionProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const isActive = state.planId !== null &&
    !(state.planId === 'free_trial' && isTrialExpired(state.activatedAt));

  const daysLeft = state.planId === 'free_trial'
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
