import { createContext, useContext, useReducer, useEffect } from 'react';
import { authAPI, getToken, getUser, setToken, setUser, removeToken, removeUser } from '../services/api';

// ── Initial state ─────────────────────────────────────────────────────────────
const initialState = {
  // Auth
  authUser: getUser(),          // persisted from localStorage on refresh
  authLoading: !!getToken(),    // true only if there's a token to validate
  authChecked: !getToken(),     // skip check if no token stored

  // App
  activeTab: 'subjects',
  subjects: [],
  evaluationLogs: [],
  pdfLogs: [],
  analytics: null,
  settings: {
    senderEmail: '',
    appPassword: '',
    ocrApiKey: 'K83661332788957',
    outputDir: 'extracted_pdfs',
    useOCR: true,
    useSemantic: true,
    sendEmails: false,
  },
  isProcessing: false,
  progress: 0,
};

// ── Reducer ───────────────────────────────────────────────────────────────────
function reducer(state, action) {
  switch (action.type) {
    // ── Auth ──────────────────────────────────────────────────────────────────
    case 'AUTH_LOGIN':
      return { ...state, authUser: action.payload, authLoading: false, authChecked: true };
    case 'AUTH_LOGOUT':
      return { ...state, authUser: null, authLoading: false, authChecked: true };
    case 'AUTH_CHECKED':
      return { ...state, authLoading: false, authChecked: true };

    // ── App ───────────────────────────────────────────────────────────────────
    case 'SET_TAB':           return { ...state, activeTab: action.payload };
    case 'ADD_SUBJECT':       return { ...state, subjects: [...state.subjects, action.payload] };
    case 'REMOVE_SUBJECT':    return { ...state, subjects: state.subjects.filter((_, i) => i !== action.payload) };
    case 'UPDATE_SUBJECT':    return { ...state, subjects: state.subjects.map((s, i) => i === action.payload.index ? action.payload.data : s) };
    case 'CLEAR_SUBJECTS':    return { ...state, subjects: [] };
    case 'ADD_LOG':           return { ...state, evaluationLogs: [...state.evaluationLogs, action.payload] };
    case 'CLEAR_LOGS':        return { ...state, evaluationLogs: [] };
    case 'ADD_PDF_LOG':       return { ...state, pdfLogs: [...state.pdfLogs, action.payload] };
    case 'CLEAR_PDF_LOGS':    return { ...state, pdfLogs: [] };
    case 'SET_ANALYTICS':     return { ...state, analytics: action.payload };
    case 'UPDATE_SETTINGS':   return { ...state, settings: { ...state.settings, ...action.payload } };
    case 'SET_PROCESSING':    return { ...state, isProcessing: action.payload };
    case 'SET_PROGRESS':      return { ...state, progress: action.payload };
    default:                  return state;
  }
}

// ── Context ───────────────────────────────────────────────────────────────────
const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  // On mount: validate stored JWT token with the backend
  useEffect(() => {
    const token = getToken();
    if (!token) {
      dispatch({ type: 'AUTH_CHECKED' });
      return;
    }
    authAPI.me()
      .then((user) => {
        setUser(user);
        dispatch({ type: 'AUTH_LOGIN', payload: user });
      })
      .catch(() => {
        removeToken();
        removeUser();
        dispatch({ type: 'AUTH_LOGOUT' });
      });
  }, []);

  // ── Auth helpers ─────────────────────────────────────────────────────────────
  async function login(email, password) {
    const data = await authAPI.login(email, password);
    setToken(data.access_token);
    setUser(data.user);
    dispatch({ type: 'AUTH_LOGIN', payload: data.user });
    return data.user;
  }

  async function register(name, email, password) {
    const data = await authAPI.register(name, email, password);
    setToken(data.access_token);
    setUser(data.user);
    dispatch({ type: 'AUTH_LOGIN', payload: data.user });
    return data.user;
  }

  function logout() {
    authAPI.logout();
    dispatch({ type: 'AUTH_LOGOUT' });
  }

  return (
    <AppContext.Provider value={{ state, dispatch, login, register, logout }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}