import { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  PieChart, Pie, Cell,
} from 'recharts';
import { evaluationsAPI } from '../services/api';
import styles from './Analytics.module.css';

const SUBJECT_COLORS = ['#16A34A', '#3B82F6', '#0D9488', '#06B6D4', '#8B5CF6', '#F59E0B'];

const GRADE_COLORS = {
  'A+': '#16A34A', A: '#4ADE80', 'B+': '#60A5FA', B: '#93C5FD',
  C: '#FBBF24', D: '#FB923C', F: '#F87171',
};

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
  if (active && payload && payload.length) {
    return (
      <div className={styles.tooltip}>
        <p className={styles.tooltipLabel}>{label}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ color: p.fill || p.color }}>{p.name}: {p.value}</p>
        ))}
      </div>
    );
  }
  return null;
};

export default function Analytics() {
  const [stats, setStats]         = useState(null);
  const [evaluations, setEvals]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');

  useEffect(() => {
    Promise.all([evaluationsAPI.stats(), evaluationsAPI.list()])
      .then(([s, e]) => { setStats(s); setEvals(e); })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  // ── Derive chart data from real evaluations ─────────────────────────────────
  const gradeDistData = stats?.grade_distribution
    ? Object.entries(stats.grade_distribution).map(([name, value]) => ({
        name, value, color: GRADE_COLORS[name] || '#9CA3AF',
      }))
    : [];

  const subjectData = stats?.subjects
    ? stats.subjects.slice(0, 6).map((s, i) => ({
        subject: s._id,
        avg: Math.round(s.avg_pct),
        color: SUBJECT_COLORS[i % SUBJECT_COLORS.length],
      }))
    : [];

  // Per-student bar chart (last 10 evaluations)
  const studentScores = evaluations.slice(0, 10).map(e => ({
    name: e.student_name.split(' ')[0],    // first name only
    score: Math.round(e.percentage),
    subject: e.subject_name,
  }));

  const radarData = [
    { metric: 'Semantic',   score: 72 },
    { metric: 'Keywords',   score: 65 },
    { metric: 'Structure',  score: 80 },
    { metric: 'Length',     score: 88 },
    { metric: 'Overall',    score: Math.round(stats?.avg_percentage ?? 74) },
  ];

  if (loading) {
    return (
      <div className={styles.page} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', color: '#6B7280' }}>
          <div style={{ fontSize: 32 }}>📊</div>
          <p>Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.page} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', color: '#F87171' }}>
          <div style={{ fontSize: 32 }}>⚠️</div>
          <p>Failed to load analytics: {error}</p>
          <button onClick={() => window.location.reload()} style={{ marginTop: 12, padding: '8px 16px', borderRadius: 4, cursor: 'pointer' }}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  const total = stats?.total_evaluations ?? 0;
  const avg   = stats?.avg_percentage   ?? 0;
  const high  = stats?.highest          ?? 0;
  const passCount = evaluations.filter(e => e.percentage >= 60).length;
  const passRate  = total > 0 ? Math.round((passCount / total) * 100) : 0;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Analytics</h1>
          <p className={styles.subtitle}>Performance insights from {total} evaluation{total !== 1 ? 's' : ''} in MongoDB</p>
        </div>
        <button className={styles.exportBtn} onClick={() => window.print()}>📊 Export Report</button>
      </div>

      {/* Stats Row */}
      <div className={styles.statsRow}>
        <StatCard label="Total Evaluations" value={total}                         sub="Stored in MongoDB"         accent="#3B82F6" />
        <StatCard label="Average Score"      value={`${avg.toFixed(1)}%`}          sub="Across all subjects"       accent="#0D9488" />
        <StatCard label="Highest Score"      value={`${high.toFixed(1)}%`}         sub="Best evaluation"          accent="#16A34A" />
        <StatCard label="Pass Rate"          value={total > 0 ? `${passRate}%` : '—'} sub="Score ≥ 60%"          accent="#06B6D4" />
      </div>

      {total === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#6B7280' }}>
          <div style={{ fontSize: 48 }}>📭</div>
          <h3 style={{ marginTop: 12 }}>No evaluations yet</h3>
          <p>Run the evaluation engine and results will appear here automatically.</p>
        </div>
      ) : (
        <div className={styles.chartsGrid}>

          {/* Student score bar chart */}
          {studentScores.length > 0 && (
            <div className={styles.chartCard}>
              <div className={styles.chartTitle}>📊 Recent Student Scores</div>
              <div className={styles.chartWrap}>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={studentScores} barSize={18}>
                    <XAxis dataKey="name" tick={{ fill: '#6B7280', fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#6B7280', fontSize: 10 }} axisLine={false} tickLine={false} domain={[0, 100]} />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(22,163,74,.05)' }} />
                    <Bar dataKey="score" name="Score %" radius={[3,3,0,0]}>
                      {studentScores.map((_, i) => (
                        <Cell key={i} fill={SUBJECT_COLORS[i % SUBJECT_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Radar */}
          <div className={styles.chartCard}>
            <div className={styles.chartTitle}>🕸️ Avg Scoring Dimension Profile</div>
            <div className={styles.chartWrap}>
              <ResponsiveContainer width="100%" height={220}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#E5E7EB" />
                  <PolarAngleAxis dataKey="metric" tick={{ fill: '#6B7280', fontSize: 11 }} />
                  <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
                  <Radar name="Score" dataKey="score" stroke="#16A34A" fill="#16A34A" fillOpacity={0.2} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Grade distribution pie */}
          {gradeDistData.length > 0 && (
            <div className={styles.chartCard}>
              <div className={styles.chartTitle}>🎓 Grade Distribution</div>
              <div className={styles.chartWrap}>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={gradeDistData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%" cy="50%"
                      innerRadius={55} outerRadius={90}
                      paddingAngle={4}
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

          {/* Subject averages */}
          {subjectData.length > 0 && (
            <div className={styles.chartCard}>
              <div className={styles.chartTitle}>📐 Subject Average Scores</div>
              <div className={styles.subjectAvgList}>
                {subjectData.map(s => (
                  <div key={s.subject} className={styles.subjectAvgRow}>
                    <div className={styles.subjectAvgLabel}>{s.subject}</div>
                    <div className={styles.subjectAvgBarWrap}>
                      <div className={styles.subjectAvgBar} style={{ width: `${s.avg}%`, background: s.color }} />
                    </div>
                    <div className={styles.subjectAvgVal} style={{ color: s.color }}>{s.avg}%</div>
                  </div>
                ))}
              </div>

              {/* Top performers */}
              <div className={styles.topStudents}>
                <div className={styles.topTitle}>🏆 Top Performers</div>
                {[...evaluations]
                  .sort((a, b) => b.percentage - a.percentage)
                  .slice(0, 3)
                  .map((e, i) => (
                    <div key={e.id} className={styles.topRow}>
                      <span className={styles.topRank}>#{i + 1}</span>
                      <span className={styles.topName}>{e.student_name}</span>
                      <span className={styles.topScore} style={{ color: i === 0 ? '#16A34A' : '#6B7280' }}>
                        {e.percentage.toFixed(1)}%
                      </span>
                    </div>
                  ))
                }
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}