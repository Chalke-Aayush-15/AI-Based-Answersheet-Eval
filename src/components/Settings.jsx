import { useState } from 'react';
import { useApp } from '../context/AppContext';
import styles from './Settings.module.css';

function SettingSection({ title, children }) {
  return (
    <div className={styles.section}>
      <div className={styles.sectionTitle}>{title}</div>
      <div className={styles.sectionBody}>{children}</div>
    </div>
  );
}

function Field({ label, hint, children }) {
  return (
    <div className={styles.field}>
      <div className={styles.fieldMeta}>
        <label className={styles.fieldLabel}>{label}</label>
        {hint && <span className={styles.fieldHint}>{hint}</span>}
      </div>
      {children}
    </div>
  );
}

export default function Settings() {
  const { state, dispatch } = useApp();
  const [saved, setSaved] = useState(false);
  const [showPass, setShowPass] = useState(false);

  function save() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  function update(key, value) {
    dispatch({ type: 'UPDATE_SETTINGS', payload: { [key]: value } });
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Settings</h1>
          <p className={styles.subtitle}>Configure system preferences, API keys &amp; email credentials</p>
        </div>
        <button className={`${styles.saveBtn} ${saved ? styles.saved : ''}`} onClick={save}>
          {saved ? '✅ Saved!' : '💾 Save Settings'}
        </button>
      </div>

      <div className={styles.layout}>
        {/* Email Settings */}
        <SettingSection title="📧 Email Configuration">
          <Field label="Sender Email" hint="Gmail address used to send results">
            <input
              className={styles.input}
              type="email"
              placeholder="your@gmail.com"
              value={state.settings.senderEmail}
              onChange={(e) => update('senderEmail', e.target.value)}
            />
          </Field>
          <Field label="App Password" hint="Gmail App Password (not your regular password)">
            <div className={styles.passRow}>
              <input
                className={styles.input}
                type={showPass ? 'text' : 'password'}
                placeholder="xxxx xxxx xxxx xxxx"
                value={state.settings.appPassword}
                onChange={(e) => update('appPassword', e.target.value)}
              />
              <button className={styles.showPassBtn} onClick={() => setShowPass(p => !p)}>
                {showPass ? '🙈' : '👁️'}
              </button>
            </div>
          </Field>
          <button className={styles.testBtn}>🔌 Test Connection</button>
        </SettingSection>

        {/* OCR Settings */}
        <SettingSection title="🔍 OCR Configuration">
          <Field label="OCR API Key" hint="Get your key at ocr.space">
            <input
              className={styles.input}
              type="text"
              value={state.settings.ocrApiKey}
              onChange={(e) => update('ocrApiKey', e.target.value)}
            />
          </Field>
          <Field label="Output Directory" hint="Where extracted PDFs will be saved">
            <div className={styles.passRow}>
              <input
                className={styles.input}
                type="text"
                value={state.settings.outputDir}
                onChange={(e) => update('outputDir', e.target.value)}
              />
              <button className={styles.browseBtn}>📂</button>
            </div>
          </Field>
        </SettingSection>

        {/* Evaluation Settings */}
        <SettingSection title="⚙️ Evaluation Preferences">
          {[
            { key: 'useOCR', label: 'Enable OCR Processing', hint: 'For handwritten / scanned answer sheets' },
            { key: 'useSemantic', label: 'Semantic NLP Analysis', hint: 'Uses sentence-transformers (all-MiniLM-L6-v2)' },
            { key: 'sendEmails', label: 'Auto-send Results via Email', hint: 'Sends PDF report to each student email' },
          ].map(opt => (
            <div key={opt.key} className={styles.toggleField}>
              <div>
                <div className={styles.toggleLabel}>{opt.label}</div>
                <div className={styles.toggleHint}>{opt.hint}</div>
              </div>
              <label className={styles.toggle}>
                <input
                  type="checkbox"
                  checked={state.settings[opt.key]}
                  onChange={(e) => update(opt.key, e.target.checked)}
                />
                <span className={styles.toggleSlider} />
              </label>
            </div>
          ))}
        </SettingSection>

        {/* Scoring Weights Info */}
        <SettingSection title="📐 Scoring Weights (Read-only)">
          <div className={styles.weightInfo}>
            {[
              { label: 'Semantic Understanding', val: '60%', color: '#16A34A' }, // Primary Green
              { label: 'Keyword Coverage', val: '25%', color: '#3B82F6' },       // Accent Blue
              { label: 'Structure & Completeness', val: '10%', color: '#0D9488' }, // Teal
              { label: 'Length Appropriateness', val: '5%', color: '#06B6D4' },    // Cyan
            ].map(w => (
              <div key={w.label} className={styles.weightRow}>
                <span className={styles.weightDot} style={{ background: w.color }} />
                <span className={styles.weightLabel}>{w.label}</span>
                <span className={styles.weightVal} style={{ color: w.color }}>{w.val}</span>
              </div>
            ))}
          </div>
          <div className={styles.markNote}>
            Main Questions: <strong>10 marks</strong> each · Sub-Questions: <strong>5 marks</strong> each
          </div>
        </SettingSection>

        {/* Danger Zone */}
        <SettingSection title="⚠️ Danger Zone">
          <div className={styles.dangerRow}>
            <div>
              <div className={styles.dangerLabel}>Clear All Subjects</div>
              <div className={styles.dangerHint}>Removes all configured subjects and student data</div>
            </div>
            <button className={styles.dangerBtn} onClick={() => dispatch({ type: 'CLEAR_SUBJECTS' })}>
              🗑️ Clear
            </button>
          </div>
          <div className={styles.dangerRow}>
            <div>
              <div className={styles.dangerLabel}>Clear Evaluation Logs</div>
              <div className={styles.dangerHint}>Removes all evaluation and PDF processing logs</div>
            </div>
            <button className={styles.dangerBtn} onClick={() => {
              dispatch({ type: 'CLEAR_LOGS' });
              dispatch({ type: 'CLEAR_PDF_LOGS' });
            }}>
              🗑️ Clear
            </button>
          </div>
        </SettingSection>
      </div>
    </div>
  );
}