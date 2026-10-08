import { useState, useEffect, useCallback } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  PieChart, Pie, Cell, LineChart, Line, CartesianGrid, Legend,
} from 'recharts';
import { evaluationAPI, analyticsAPI } from '../services/api';
import styles from './Analytics.module.css';

// ── Colour palettes (match existing app theme) ────────────────────────────────
const SUBJECT_COLORS = ['#16A34A', '#3B82F6', '#0D9488', '#06B6D4', '#8B5CF6', '#F59E0B'];
const GRADE_COLORS   = {
  'A+': '#16A34A', A: '#4ADE80', 'B+': '#60A5FA', B: '#93C5FD',
  C: '#FBBF24', D: '#FB923C', F: '#F87171',
};

// ── Small reusable pieces ─────────────────────────────────────────────────────
function StatCard({ label, value, sub, accent }) {
  return (
    <div className={styles.statCard}>
      <div className={styles.statValue} style={{ color: accent }}>{value}</div>
      <div className={styles.statLabel}>{label}</div>
      {sub && <div className={styles.statSub}>{sub}</div>}
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className={styles.tooltip}>
      <p className={styles.tooltipLabel}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.fill || p.color || '#16A34A' }}>
          {p.name}: <strong>{p.value}</strong>
        </p>
      ))}
    </div>
  );
};

// ── Spinner ───────────────────────────────────────────────────────────────────
function Spinner() {
  return (
    <div className={styles.spinnerWrap}>
      <div className={styles.spinner} />
      <p>Loading analytics…</p>
    </div>
  );
}

// ── Default date range helpers ────────────────────────────────────────────────
function toDateInputValue(d) {
  return d.toISOString().slice(0, 10);
}
function defaultDateFrom() {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 1);
  return toDateInputValue(d);
}
function defaultDateTo() {
  return toDateInputValue(new Date());
}

// ── Main component ────────────────────────────────────────────────────────────
export default function Analytics({ onAnalyticsData }) {
  // ── Filter state ────────────────────────────────────────────────────────────
  const [subject,   setSubject]   = useState('');
  const [grade,     setGrade]     = useState('');
  const [dateFrom,  setDateFrom]  = useState(defaultDateFrom());
  const [dateTo,    setDateTo]    = useState(defaultDateTo());
  const [groupBy,   setGroupBy]   = useState('day');

  // ── Data state ──────────────────────────────────────────────────────────────
  const [summary,      setSummary]      = useState(null);
  const [trend,        setTrend]        = useState([]);
  const [students,     setStudents]     = useState([]);
  const [subjectList,  setSubjectList]  = useState([]);
  const [resultFiles,  setResultFiles]  = useState([]);

  const [loading,     setLoading]     = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error,       setError]       = useState('');

  // ── Student table pagination ─────────────────────────────────────────────────
  const [studentSkip,  setStudentSkip]  = useState(0);
  const [studentTotal, setStudentTotal] = useState(0);
  const STUDENT_LIMIT = 10;

  // ── Fetch all data ────────────────────────────────────────────────────────────
  const fetchData = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setLoading(true);
      setStudentSkip(0);
    }
    setError('');

    const params = { subject, grade, date_from: dateFrom, date_to: dateTo };

    try {
      const [summaryRes, trendRes, studentsRes, filesRes] = await Promise.allSettled([
        analyticsAPI.summary(params),
        analyticsAPI.trend({ ...params, group_by: groupBy }),
        analyticsAPI.students({ ...params, limit: STUDENT_LIMIT, skip: 0 }),
        evaluationAPI.listResults(),
      ]);

      if (summaryRes.status === 'fulfilled') {
        setSummary(summaryRes.value);
      } else {
        setError(summaryRes.reason?.message || 'Failed to load summary');
      }

      if (trendRes.status === 'fulfilled') {
        setTrend(trendRes.value?.trend ?? []);
      }

      if (studentsRes.status === 'fulfilled') {
        setStudents(studentsRes.value?.students ?? []);
        setStudentTotal(studentsRes.value?.total ?? 0);
        setStudentSkip(0);
      }

      if (filesRes.status === 'fulfilled') {
        setResultFiles(filesRes.value?.files ?? []);
      }

      // ── Pass analytics context to parent (for chatbot) ───────────────────
      if (onAnalyticsData && summaryRes.status === 'fulfilled') {
        onAnalyticsData({
          ...summaryRes.value,
          trend: trendRes.status === 'fulfilled' ? (trendRes.value?.trend ?? []) : [],
        });
      }
    } finally {
      setLoading(false);
    }
  }, [subject, grade, dateFrom, dateTo, groupBy, onAnalyticsData]);

  // ── Load subject list once ────────────────────────────────────────────────
  useEffect(() => {
    analyticsAPI.subjects().then(r => setSubjectList(r?.subjects ?? [])).catch(() => {});
  }, []);

  // ── Initial load ─────────────────────────────────────────────────────────
  useEffect(() => { fetchData(true); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Load more students ────────────────────────────────────────────────────
  async function loadMoreStudents() {
    const nextSkip = studentSkip + STUDENT_LIMIT;
    setLoadingMore(true);
    try {
      const r = await analyticsAPI.students({
        subject, grade, date_from: dateFrom, date_to: dateTo,
        limit: STUDENT_LIMIT, skip: nextSkip,
      });
      setStudents(prev => [...prev, ...(r?.students ?? [])]);
      setStudentSkip(nextSkip);
    } finally {
      setLoadingMore(false);
    }
  }

  // ── Download file ─────────────────────────────────────────────────────────
  async function handleDownload(filename) {
    try { await evaluationAPI.downloadFile(filename); }
    catch (err) { alert(`Download failed: ${err.message}`); }
  }

  // ── Derived chart data ────────────────────────────────────────────────────
  const gradeDistData = summary?.grade_distribution
    ? Object.entries(summary.grade_distribution)
        .filter(([, v]) => v > 0)
        .map(([name, value]) => ({ name, value, color: GRADE_COLORS[name] || '#9CA3AF' }))
    : [];

  const subjectChartData = (summary?.subjects ?? []).slice(0, 8).map((s, i) => ({
    subject: (s.subject || '').length > 12 ? (s.subject || '').slice(0, 12) + '…' : (s.subject || ''),
    fullName: s.subject || 'Unknown',
    avg:     Math.round(s.avg_pct ?? 0),
    count:   s.count ?? 0,
    color:   SUBJECT_COLORS[i % SUBJECT_COLORS.length],
  }));

  const trendData = trend.map(t => ({
    date:      t.date,
    avgScore:  t.avg_score,
    count:     t.count,
    highest:   t.highest,
  }));

  // ── Stats ─────────────────────────────────────────────────────────────────
  const total   = summary?.total_evaluations ?? 0;
  const avg     = summary?.avg_percentage    ?? 0;
  const high    = summary?.highest           ?? 0;
  const passRate= summary?.pass_rate         ?? 0;

  // ── Top 3 students from current page ─────────────────────────────────────
  const topStudents = [...students]
    .sort((a, b) => (b.percentage ?? 0) - (a.percentage ?? 0))
    .slice(0, 3);

  // ── Render ────────────────────────────────────────────────────────────────
  if (loading) return <Spinner />;

  return (
    <div className={styles.page}>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Analytics</h1>
          <p className={styles.subtitle}>
            {total} evaluation{total !== 1 ? 's' : ''} · {' '}
            {error
              ? <span style={{ color: '#EF4444' }}>⚠️ {error}</span>
              : <span style={{ color: '#16A34A' }}>✅ Live · your data only</span>
            }
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className={styles.exportBtn} onClick={() => fetchData(true)}>🔄 Refresh</button>
          <button className={styles.exportBtn} onClick={() => window.print()}>📊 Export</button>
        </div>
      </div>

      {/* ── Filter Bar ─────────────────────────────────────────────────────── */}
      <div className={styles.filterBar}>
        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>Subject</label>
          <select
            className={styles.filterSelect}
            value={subject}
            onChange={e => setSubject(e.target.value)}
          >
            <option value="">All Subjects</option>
            {subjectList.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>Grade</label>
          <select
            className={styles.filterSelect}
            value={grade}
            onChange={e => setGrade(e.target.value)}
          >
            <option value="">All Grades</option>
            {['A+', 'A', 'B+', 'B', 'C', 'D', 'F'].map(g => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
        </div>

        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>From</label>
          <input
            type="date"
            className={styles.filterInput}
            value={dateFrom}
            onChange={e => setDateFrom(e.target.value)}
          />
        </div>

        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>To</label>
          <input
            type="date"
            className={styles.filterInput}
            value={dateTo}
            onChange={e => setDateTo(e.target.value)}
          />
        </div>

        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>Trend by</label>
          <select
            className={styles.filterSelect}
            value={groupBy}
            onChange={e => setGroupBy(e.target.value)}
          >
            <option value="day">Day</option>
            <option value="month">Month</option>
          </select>
        </div>

        <button className={styles.applyBtn} onClick={() => fetchData(true)}>
          🔍 Apply Filters
        </button>

        <button
          className={styles.clearBtn}
          onClick={() => {
            setSubject(''); setGrade('');
            setDateFrom(defaultDateFrom()); setDateTo(defaultDateTo());
            setGroupBy('day');
          }}
        >
          ✕ Clear
        </button>
      </div>

      {/* ── Active filter chips ─────────────────────────────────────────────── */}
      {(subject || grade) && (
        <div className={styles.chipRow}>
          {subject && <span className={styles.chip}>📚 {subject}</span>}
          {grade   && <span className={styles.chip}>🎓 Grade {grade}</span>}
        </div>
      )}

      {/* ── Empty state ─────────────────────────────────────────────────────── */}
      {total === 0 ? (
        <div className={styles.emptyState}>
          <div style={{ fontSize: 48 }}>📭</div>
          <h3>No evaluations match your filters</h3>
          <p>Run the evaluation engine to generate data, or clear your filters.</p>
        </div>
      ) : (
        <>
          {/* ── Stat cards ───────────────────────────────────────────────────── */}
          <div className={styles.statsRow}>
            <StatCard label="Total Evaluations" value={total}                  sub="In selected range"  accent="#3B82F6" />
            <StatCard label="Average Score"      value={`${avg.toFixed(1)}%`}  sub="Across all subjects" accent="#0D9488" />
            <StatCard label="Highest Score"      value={`${high.toFixed(1)}%`} sub="Best result"         accent="#16A34A" />
            <StatCard label="Pass Rate"          value={`${passRate}%`}        sub="Score ≥ 60%"         accent="#06B6D4" />
          </div>

          {/* ── Charts grid ──────────────────────────────────────────────────── */}
          <div className={styles.chartsGrid}>

            {/* Trend line chart */}
            {trendData.length > 1 && (
              <div className={`${styles.chartCard} ${styles.wideCard}`}>
                <div className={styles.chartTitle}>📈 Score Trend Over Time</div>
                <div className={styles.chartWrap}>
                  <ResponsiveContainer width="100%" height={220}>
                    <LineChart data={trendData} margin={{ left: -10, right: 10 }}>
                      <CartesianGrid stroke="#F3F4F6" vertical={false} />
                      <XAxis
                        dataKey="date"
                        tick={{ fill: '#6B7280', fontSize: 10 }}
                        axisLine={false} tickLine={false}
                        interval="preserveStartEnd"
                      />
                      <YAxis
                        tick={{ fill: '#6B7280', fontSize: 10 }}
                        axisLine={false} tickLine={false}
                        domain={[0, 100]}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend
                        wrapperStyle={{ fontSize: 11, color: '#6B7280' }}
                        formatter={v => v === 'avgScore' ? 'Avg Score %' : 'Highest %'}
                      />
                      <Line
                        type="monotone" dataKey="avgScore" name="avgScore"
                        stroke="#16A34A" strokeWidth={2} dot={false}
                        activeDot={{ r: 4, fill: '#16A34A' }}
                      />
                      <Line
                        type="monotone" dataKey="highest" name="highest"
                        stroke="#06B6D4" strokeWidth={1.5} dot={false} strokeDasharray="4 2"
                        activeDot={{ r: 3, fill: '#06B6D4' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Subject avg bar chart */}
            {subjectChartData.length > 0 && (
              <div className={styles.chartCard}>
                <div className={styles.chartTitle}>📚 Subject Average Scores</div>
                <div className={styles.chartWrap}>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={subjectChartData} barSize={20} margin={{ left: -10 }}>
                      <XAxis
                        dataKey="subject"
                        tick={{ fill: '#6B7280', fontSize: 10 }}
                        axisLine={false} tickLine={false}
                      />
                      <YAxis
                        tick={{ fill: '#6B7280', fontSize: 10 }}
                        axisLine={false} tickLine={false}
                        domain={[0, 100]}
                      />
                      <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(22,163,74,.04)' }} />
                      <Bar dataKey="avg" name="Avg %" radius={[4, 4, 0, 0]}>
                        {subjectChartData.map((s, i) => (
                          <Cell key={i} fill={s.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                {/* Subject progress bars */}
                <div className={styles.subjectAvgList}>
                  {subjectChartData.map(s => (
                    <div key={s.fullName} className={styles.subjectAvgRow}>
                      <div className={styles.subjectAvgLabel} title={s.fullName}>{s.subject}</div>
                      <div className={styles.subjectAvgBarWrap}>
                        <div className={styles.subjectAvgBar} style={{ width: `${s.avg}%`, background: s.color }} />
                      </div>
                      <div className={styles.subjectAvgVal}>{s.avg}%</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Grade distribution doughnut */}
            {gradeDistData.length > 0 && (
              <div className={styles.chartCard}>
                <div className={styles.chartTitle}>🎓 Grade Distribution</div>
                <div className={styles.chartWrap}>
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie
                        data={gradeDistData}
                        dataKey="value" nameKey="name"
                        cx="50%" cy="50%"
                        innerRadius={55} outerRadius={90}
                        paddingAngle={3}
                      >
                        {gradeDistData.map((g, i) => (
                          <Cell key={i} fill={g.color} stroke="#FFFFFF" strokeWidth={2} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className={styles.chartLegend}>
                  {gradeDistData.map(g => (
                    <div key={g.name} className={styles.legendItem}>
                      <span className={styles.legendDot} style={{ background: g.color }} />
                      <span>{g.name} ({g.value})</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Pass vs Fail doughnut */}
            {total > 0 && (
              <div className={styles.chartCard}>
                <div className={styles.chartTitle}>✅ Pass / Fail Ratio</div>
                <div className={styles.chartWrap}>
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Pass (≥60%)', value: summary?.pass_count ?? 0, color: '#16A34A' },
                          { name: 'Fail (<60%)', value: summary?.fail_count ?? 0, color: '#F87171' },
                        ]}
                        dataKey="value" nameKey="name"
                        cx="50%" cy="50%"
                        innerRadius={55} outerRadius={90}
                        paddingAngle={3}
                      >
                        <Cell fill="#16A34A" stroke="#FFFFFF" strokeWidth={2} />
                        <Cell fill="#F87171" stroke="#FFFFFF" strokeWidth={2} />
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className={styles.chartLegend}>
                  <div className={styles.legendItem}>
                    <span className={styles.legendDot} style={{ background: '#16A34A' }} />
                    <span>Pass — {summary?.pass_count ?? 0}</span>
                  </div>
                  <div className={styles.legendItem}>
                    <span className={styles.legendDot} style={{ background: '#F87171' }} />
                    <span>Fail — {summary?.fail_count ?? 0}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Radar — scoring dimensions (avg from summary) */}
            <div className={styles.chartCard}>
              <div className={styles.chartTitle}>🕸️ Scoring Dimension Profile</div>
              <div className={styles.chartWrap}>
                <ResponsiveContainer width="100%" height={220}>
                  <RadarChart data={[
                    { metric: 'Semantic',  score: 60 },
                    { metric: 'Keywords',  score: 25 },
                    { metric: 'Structure', score: 10 },
                    { metric: 'Length',    score: 5  },
                    { metric: 'Overall',   score: Math.round(avg) },
                  ]}>
                    <PolarGrid stroke="#E5E7EB" />
                    <PolarAngleAxis dataKey="metric" tick={{ fill: '#6B7280', fontSize: 11 }} />
                    <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
                    <Radar name="Weight %" dataKey="score" stroke="#16A34A" fill="#16A34A" fillOpacity={0.18} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
              <div style={{ fontSize: 11, color: '#9CA3AF', textAlign: 'center', lineHeight: 1.6 }}>
                FAIR scoring: Semantic 60% · Keywords 25% · Structure 10% · Length 5%
              </div>
            </div>

            {/* Top 3 performers */}
            {topStudents.length > 0 && (
              <div className={styles.chartCard}>
                <div className={styles.chartTitle}>🏆 Top Performers</div>
                <div className={styles.topStudents}>
                  {topStudents.map((e, i) => (
                    <div key={i} className={styles.topRow}>
                      <span className={styles.topRank}>#{i + 1}</span>
                      <div className={styles.topInfo}>
                        <span className={styles.topName}>{e.student_name || '—'}</span>
                        <span className={styles.topMeta}>{e.subject_name || ''} · {e.grade || ''}</span>
                      </div>
                      <span className={styles.topScore} style={{ color: i === 0 ? '#16A34A' : '#6B7280' }}>
                        {(e.percentage ?? 0).toFixed(1)}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>

          {/* ── Student Table ─────────────────────────────────────────────────── */}
          {students.length > 0 && (
            <div className={styles.tableCard}>
              <div className={styles.tableHeader}>
                <div className={styles.chartTitle} style={{ borderBottom: 'none', paddingBottom: 0 }}>
                  👥 Student Results
                </div>
                <span className={styles.tableCount}>{studentTotal} total</span>
              </div>
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Student</th>
                      <th>Roll No.</th>
                      <th>Subject</th>
                      <th>Marks</th>
                      <th>Score</th>
                      <th>Grade</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((s, i) => (
                      <tr key={s.id || i}>
                        <td>{s.student_name || '—'}</td>
                        <td style={{ color: '#9CA3AF', fontSize: 11 }}>{s.student_roll_no || '—'}</td>
                        <td>{s.subject_name || '—'}</td>
                        <td style={{ fontFamily: 'monospace' }}>
                          {(s.total_marks ?? 0).toFixed(1)}/{s.max_marks ?? 0}
                        </td>
                        <td>
                          <div className={styles.scoreBar}>
                            <div
                              className={styles.scoreBarFill}
                              style={{
                                width: `${Math.round(s.percentage ?? 0)}%`,
                                background: (s.percentage ?? 0) >= 60 ? '#16A34A' : '#F87171',
                              }}
                            />
                            <span className={styles.scorePct}>{(s.percentage ?? 0).toFixed(1)}%</span>
                          </div>
                        </td>
                        <td>
                          <span
                            className={styles.gradeBadge}
                            style={{ background: (GRADE_COLORS[s.grade] || '#9CA3AF') + '22',
                                     color: GRADE_COLORS[s.grade] || '#9CA3AF' }}
                          >
                            {s.grade || '—'}
                          </span>
                        </td>
                        <td style={{ color: '#9CA3AF', fontSize: 11 }}>
                          {s.evaluated_at
                            ? new Date(s.evaluated_at).toLocaleDateString()
                            : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {students.length < studentTotal && (
                <div style={{ textAlign: 'center', padding: '12px 0' }}>
                  <button
                    className={styles.exportBtn}
                    onClick={loadMoreStudents}
                    disabled={loadingMore}
                  >
                    {loadingMore ? '⏳ Loading…' : `⬇ Load More (${studentTotal - students.length} remaining)`}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ── Downloadable result files ─────────────────────────────────────── */}
          {resultFiles.length > 0 && (
            <div className={styles.tableCard}>
              <div className={styles.chartTitle} style={{ borderBottom: 'none' }}>📁 Result Files</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 4 }}>
                {resultFiles.map((f, i) => (
                  <div
                    key={i}
                    className={styles.fileChip}
                    onClick={() => handleDownload(f.name)}
                    title={`Download ${f.name}`}
                  >
                    <span>📥</span>
                    <div>
                      <div className={styles.fileName}>{f.name}</div>
                      <div className={styles.fileSize}>{f.size_kb} KB</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
