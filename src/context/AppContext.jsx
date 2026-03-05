import { createContext, useContext, useReducer } from 'react';

const initialState = {
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

function reducer(state, action) {
  switch (action.type) {
    case 'SET_TAB':
      return { ...state, activeTab: action.payload };
    case 'ADD_SUBJECT':
      return { ...state, subjects: [...state.subjects, action.payload] };
    case 'REMOVE_SUBJECT':
      return { ...state, subjects: state.subjects.filter((_, i) => i !== action.payload) };
    case 'UPDATE_SUBJECT':
      return {
        ...state,
        subjects: state.subjects.map((s, i) => i === action.payload.index ? action.payload.data : s),
      };
    case 'CLEAR_SUBJECTS':
      return { ...state, subjects: [] };
    case 'ADD_LOG':
      return { ...state, evaluationLogs: [...state.evaluationLogs, action.payload] };
    case 'CLEAR_LOGS':
      return { ...state, evaluationLogs: [] };
    case 'ADD_PDF_LOG':
      return { ...state, pdfLogs: [...state.pdfLogs, action.payload] };
    case 'CLEAR_PDF_LOGS':
      return { ...state, pdfLogs: [] };
    case 'SET_ANALYTICS':
      return { ...state, analytics: action.payload };
    case 'UPDATE_SETTINGS':
      return { ...state, settings: { ...state.settings, ...action.payload } };
    case 'SET_PROCESSING':
      return { ...state, isProcessing: action.payload };
    case 'SET_PROGRESS':
      return { ...state, progress: action.payload };
    default:
      return state;
  }
}

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}