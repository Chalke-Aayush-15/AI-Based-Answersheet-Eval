import { useState } from 'react';
import { useApp } from '../context/AppContext';
import styles from './EvaluationPanel.module.css';

// Updated Colors: Calm Learning Theme (Green, Blue, Teal, Cyan)
const SCORE_WEIGHTS = [
  { label: 'Semantic Understanding', weight: 60, color: '#16A34A' }, // Primary Green
  { label: 'Keyword Coverage', weight: 25, color: '#3B82F6' },       // Accent Blue
  { label: 'Structure & Completeness', weight: 10, color: '#0D9488' }, // Teal
  { label: 'Length Appropriateness', weight: 5, color: '#06B6D4' },    // Cyan
];

function WeightBar({ label, weight, color }) {
  return (
    <div className={styles.weightRow}>
      <span className={styles.weightLabel}>{label}</span>
      <div className={styles.weightBarWrap}>
        <div className={styles.weightBarFill} style={{ width: `${weight}%`, background: color, boxShadow: `0 0 10px ${color}66` }} />
      </div>
      <span className={styles.weightPct} style={{ color }}>{weight}%</span>
    </div>
  );
}

function LogEntry({ entry }) {
  const isSuccess = entry.text.includes('✅') || entry.text.includes('📊') || entry.text.includes('🎯');
  const isError = entry.text.includes('❌') || entry.text.includes('⚠️');
  const isHeader = entry.text.startsWith('=') || entry.text.startsWith('━');

  return (
    <div className={`${styles.logEntry} ${isSuccess ? styles.logSuccess : ''} ${isError ? styles.logError : ''} ${isHeader ? styles.logHeader : ''}`}>
      <span className={styles.logTs}>{entry.time}</span>
      <span className={styles.logText}>{entry.text}</span>
    </div>
  );
}

export default function EvaluationPanel() {
  const { state, dispatch } = useApp();
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);

  function mockEvaluate() {
    if (!state.subjects.length) {
      return alert('Please add at least one subject before evaluating.');
    }
    setRunning(true);
    setProgress(0);
    dispatch({ type: 'CLEAR_LOGS' });

    const logs = [
      '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
      '🚀 Starting FAIR Multi-Subject Evaluation Engine v2.0',
      '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
      `📚 Total subjects to evaluate: ${state.subjects.length}`,
      '⚙️  NLP Semantic Engine: ACTIVE (all-MiniLM-L6-v2)',
      '',
      ...state.subjects.flatMap((s, i) => [
        `\n📖 [${i + 1}/${state.subjects.length}] Processing: ${s.name}`,
        `   Master Sheet: ${s.masterPdf}`,
        `   Students: ${s.studentPdfs.length} answer sheet(s)`,
        `   🔍 Extracting text from master answer sheet...`,
        `   ✅ Master answers extracted: Q1, Q2, Q3, Q1a, Q2b (5 questions)`,
        `   📊 Evaluating student answers...`,
        `   ✅ Student_01.pdf → Score: 78/100 — Very good performance`,
        `   ✅ Student_02.pdf → Score: 65/100 — Satisfactory performance`,
        `   ✅ Student_03.pdf → Score: 90/100 — Outstanding performance`,
        `   📝 Results CSV saved: ${s.name.replace(/\s/g,'_')}_results.csv`,
      ]),
      '\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
      '🎉 Evaluation Complete!',
      `✅ Subjects processed: ${state.subjects.length}`,
      '📊 Consolidated results saved to: consolidated_results.xlsx',
      '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
    ];

    let i = 0;
    const interval = setInterval(() => {
      if (i < logs.length) {
        dispatch({ type: 'ADD_LOG', payload: { text: logs[i], time: new Date().toLocaleTimeString() } });
        setProgress(Math.floor((i / logs.length) * 100));
        i++;
      } else {
        clearInterval(interval);
        setRunning(false);
        setProgress(100);
      }
    }, 120);
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Evaluation Engine</h1>
          <p className={styles.subtitle}>FAIR multi-subject scoring with NLP semantic analysis</p>
        </div>
        <div className={styles.nlpBadge}>
          <span className={styles.nlpDot} />
          <span>NLP Semantic Active</span>
        </div>
      </div>

      <div className={styles.layout}>
        {/* Left Controls */}
        <div className={styles.sidebar}>
          {/* Scoring Weights */}
          <div className={styles.card}>
            <div className={styles.cardTitle}>⚖️ Scoring Weights</div>
            <div className={styles.weightList}>
              {SCORE_WEIGHTS.map(w => (
                <WeightBar key={w.label} {...w} />
              ))}
            </div>
            <div className={styles.markScheme}>
              <div className={styles.markItem}>
                <span>Main Questions (Q1, Q2…)</span>
                <span className={styles.markVal}>10 marks</span>
              </div>
              <div className={styles.markItem}>
                <span>Sub-Questions (Q1a, Q2b…)</span>
                <span className={styles.markVal}>5 marks</span>
              </div>
            </div>
          </div>

          {/* Options */}
          <div className={styles.card}>
            <div className={styles.cardTitle}>⚙️ Options</div>
            <div className={styles.optionList}>
              {[
                { key: 'useOCR', label: 'Use OCR for handwritten sheets', hint: 'Powered by OCR.space API' },
                { key: 'useSemantic', label: 'Advanced Semantic NLP Analysis', hint: 'sentence-transformers' },
                { key: 'sendEmails', label: 'Send results via Email', hint: 'SMTP / Gmail App Password' },
              ].map(opt => (
                <label key={opt.key} className={styles.optionRow}>
                  <div className={styles.toggle}>
                    <input
                      type="checkbox"
                      checked={state.settings[opt.key]}
                      onChange={(e) => dispatch({ type: 'UPDATE_SETTINGS', payload: { [opt.key]: e.target.checked } })}
                    />
                    <span className={styles.toggleSlider} />
                  </div>
                  <div className={styles.optionText}>
                    <span className={styles.optionLabel}>{opt.label}</span>
                    <span className={styles.optionHint}>{opt.hint}</span>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Subjects Summary */}
          <div className={styles.card}>
            <div className={styles.cardTitle}>📋 Queued Subjects</div>
            {state.subjects.length === 0
              ? <p className={styles.emptySub}>No subjects configured. Go to Subject Manager.</p>
              : state.subjects.map((s, i) => (
                <div key={i} className={styles.queueItem}>
                  <span className={styles.queueNum}>{i + 1}</span>
                  <div>
                    <div className={styles.queueName}>{s.name}</div>
                    <div className={styles.queueMeta}>{s.studentPdfs.length} student(s)</div>
                  </div>
                </div>
              ))
            }
          </div>

          <button
            className={`${styles.runBtn} ${running ? styles.running : ''}`}
            onClick={mockEvaluate}
            disabled={running}
          >
            {running ? (
              <><span className={styles.spinner} />Evaluating...</>
            ) : (
              <>🚀 Start Evaluation</>
            )}
          </button>

          {(running || state.evaluationLogs.length > 0) && (
            <div className={styles.progressWrap}>
              <div className={styles.progressTrack}>
                <div className={styles.progressFill} style={{ width: `${progress}%` }} />
              </div>
              <span className={styles.progressPct}>{progress}%</span>
            </div>
          )}
        </div>

        {/* Right: Log */}
        <div className={styles.logPanel}>
          <div className={styles.logHeader}>
            <span className={styles.logTitle}>📜 Evaluation Log</span>
            <div className={styles.logActions}>
              <button className={styles.logActionBtn} onClick={() => dispatch({ type: 'CLEAR_LOGS' })}>Clear</button>
              <button className={styles.logActionBtn}>💾 Save Log</button>
            </div>
          </div>
          <div className={styles.logBody}>
            {state.evaluationLogs.length === 0
              ? <div className={styles.logEmpty}>
                  <span>▶</span>
                  <p>Evaluation log will appear here once started</p>
                </div>
              : state.evaluationLogs.map((entry, i) => (
                <LogEntry key={i} entry={entry} />
              ))
            }
          </div>
        </div>
      </div>
    </div>
  );
}