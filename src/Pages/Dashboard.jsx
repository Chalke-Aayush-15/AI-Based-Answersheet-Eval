import { Routes, Route } from "react-router-dom";

import Sidebar from "../components/Sidebar";
import SubjectManager from "../components/SubjectManager";
import EvaluationPanel from "../components/EvaluationPanel";
import PDFTools from "../components/PDFTools";
import Analytics from "../components/Analytics";
import Settings from "../components/Settings";

export default function Dashboard() {
  return (
    <div className="app">
      <Sidebar />

      <main>
        <Routes>
          <Route path="/" element={<SubjectManager />} />
          <Route path="evaluation" element={<EvaluationPanel />} />
          <Route path="pdf" element={<PDFTools />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="settings" element={<Settings />} />
        </Routes>
      </main>
    </div>
  );
}