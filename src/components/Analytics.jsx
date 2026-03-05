import { useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import styles from './Analytics.module.css';

// Updated Data
const SAMPLE_SCORES = [
  { name: 'Student 01', se: 78, cs: 82, ai: 70, bc: 88 },
  { name: 'Student 02', se: 65, cs: 71, ai: 80, bc: 60 },
  { name: 'Student 03', se: 90, cs: 95, ai: 88, bc: 92 },
  { name: 'Student 04', se: 55, cs: 60, ai: 72, bc: 58 },
  { name: 'Student 05', se: 84, cs: 79, ai: 91, bc: 76 },
];

// Calm Learning Theme Colors: Green, Blue, Teal, Cyan
const SUBJECT_COLORS = ['#16A34A', '#3B82F6', '#0D9488', '#06B6D4'];

const RADAR_DATA = [
  { metric: 'Semantic', score: 72 },
  { metric: 'Keywords', score: 65 },
  { metric: 'Structure', score: 80 },
  { metric: 'Length', score: 88 },
  { metric: 'Overall', score: 74 },
];

// Semantic Grade Colors
const GRADE_DIST = [
  { name: 'A (90–100)', value: 1, color: '#16A34A' }, // Primary Green (Excellent)
  { name: 'B (75–89)', value: 2, color: '#4ADE80' },  // Light Green (Good)
  { name: 'C (60–74)', value: 1, color: '#FBBF24' },  // Amber (Average)
  { name: 'D (<60)', value: 1, color: '#F87171' },    // Soft Red (Poor)
];

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
  const [activeSubject, setActiveSubject] = useState('all');

  const subjects = ['SE', 'CS', 'AI', 'BC'];
  const subjectKeys = { SE: 'se', CS: 'cs', AI: 'ai', BC: 'bc' };

  const avgScores = subjects.map((s, i) => ({
    subject: s,
    avg: Math.round(SAMPLE_SCORES.reduce((acc, st) => acc + st[subjectKeys[s]], 0) / SAMPLE_SCORES.length),
    color: SUBJECT_COLORS[i],
  }));

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Analytics</h1>
          <p className={styles.subtitle}>Performance insights across subjects and students</p>
        </div>
        <button className={styles.exportBtn}>📊 Export Report</button>
      </div>

      {/* Stats Row */}
      <div className={styles.statsRow}>
        <StatCard label="Total Students" value="5" sub="Evaluated" accent="#3B82F6" />
        <StatCard label="Average Score" value="74.8" sub="Across all subjects" accent="#0D9488" />
        <StatCard label="Highest Score" value="95" sub="Student 03 · CS" accent="#16A34A" />
        <StatCard label="Pass Rate" value="80%" sub="Score ≥ 60" accent="#06B6D4" />
      </div>

      {/* Charts Grid */}
      <div className={styles.chartsGrid}>
        {/* Bar Chart */}
        <div className={styles.chartCard}>
          <div className={styles.chartTitle}>📊 Student Scores by Subject</div>
          <div className={styles.chartWrap}>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={SAMPLE_SCORES} barGap={2} barSize={14}>
              <XAxis dataKey="name" tick={{ fill: '#6B7280', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#6B7280', fontSize: 10 }} axisLine={false} tickLine={false} domain={[0, 100]} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(22, 163, 74, 0.05)' }} />
              <Bar dataKey="se" name="Soft Eng" fill={SUBJECT_COLORS[0]} radius={[3,3,0,0]} />
              <Bar dataKey="cs" name="Cyber Sec" fill={SUBJECT_COLORS[1]} radius={[3,3,0,0]} />
              <Bar dataKey="ai" name="AI" fill={SUBJECT_COLORS[2]} radius={[3,3,0,0]} />
              <Bar dataKey="bc" name="Blockchain" fill={SUBJECT_COLORS[3]} radius={[3,3,0,0]} />
            </BarChart>
          </ResponsiveContainer>
          </div>
          <div className={styles.chartLegend}>
            {['Soft Eng', 'Cyber Sec', 'AI', 'Blockchain'].map((s, i) => (
              <div key={s} className={styles.legendItem}>
                <span className={styles.legendDot} style={{ background: SUBJECT_COLORS[i] }} />
                <span>{s}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Radar Chart */}
        <div className={styles.chartCard}>
          <div className={styles.chartTitle}>🕸️ Avg Scoring Dimension Profile</div>
          <div className={styles.chartWrap}>
          <ResponsiveContainer width="100%" height={220}>
            <RadarChart data={RADAR_DATA}>
              <PolarGrid stroke="#E5E7EB" />
              <PolarAngleAxis dataKey="metric" tick={{ fill: '#6B7280', fontSize: 11 }} />
              <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
              <Radar name="Score" dataKey="score" stroke="#16A34A" fill="#16A34A" fillOpacity={0.2} />
            </RadarChart>
          </ResponsiveContainer>
          </div>
        </div>

        {/* Pie Chart */}
        <div className={styles.chartCard}>
          <div className={styles.chartTitle}>🎓 Grade Distribution</div>
          <div className={styles.chartWrap}>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie 
                data={GRADE_DIST} 
                dataKey="value" 
                nameKey="name" 
                cx="50%" 
                cy="50%" 
                innerRadius={55} 
                outerRadius={90} 
                paddingAngle={4} 
                labelLine={false} 
                label={false}
              >
                {GRADE_DIST.map((g, i) => (
                  <Cell key={i} fill={g.color} stroke="#FFFFFF" strokeWidth={2} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          </div>
          <div className={styles.chartLegend}>
            {GRADE_DIST.map(g => (
              <div key={g.name} className={styles.legendItem}>
                <span className={styles.legendDot} style={{ background: g.color }} />
                <span>{g.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Subject Averages */}
        <div className={styles.chartCard}>
          <div className={styles.chartTitle}>📐 Subject Average Scores</div>
          <div className={styles.subjectAvgList}>
            {avgScores.map(s => (
              <div key={s.subject} className={styles.subjectAvgRow}>
                <div className={styles.subjectAvgLabel}>{s.subject}</div>
                <div className={styles.subjectAvgBarWrap}>
                  <div className={styles.subjectAvgBar} style={{ width: `${s.avg}%`, background: s.color }} />
                </div>
                <div className={styles.subjectAvgVal} style={{ color: s.color }}>{s.avg}</div>
              </div>
            ))}
          </div>

          <div className={styles.topStudents}>
            <div className={styles.topTitle}>🏆 Top Performers</div>
            {SAMPLE_SCORES
              .map(s => ({ ...s, total: (s.se + s.cs + s.ai + s.bc) / 4 }))
              .sort((a, b) => b.total - a.total)
              .slice(0, 3)
              .map((s, i) => (
                <div key={s.name} className={styles.topRow}>
                  <span className={styles.topRank}>#{i + 1}</span>
                  <span className={styles.topName}>{s.name}</span>
                  {/* Highlight rank 1 in primary green, others in grey */}
                  <span className={styles.topScore} style={{ color: i === 0 ? '#16A34A' : '#6B7280' }}>
                    {s.total.toFixed(1)}
                  </span>
                </div>
              ))
            }
          </div>
        </div>
      </div>
    </div>
  );
}