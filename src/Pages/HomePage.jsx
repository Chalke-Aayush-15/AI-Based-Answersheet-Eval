import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { HeroScene } from '../components/three/HeroScene';
import { ScrollReveal } from '../components/motion/ScrollReveal';
import { ThreeDButton } from '../components/ui/ThreeDButton';
import { AnimatedStatCard } from '../components/ui/AnimatedStatCard';
import styles from './HomePage.module.css';

const NAV_LINKS = ['Features', 'How It Works', 'Subjects', 'Exam Mode', 'Contact'];

const FEATURES = [
  { icon: '🎯', title: 'Precision Grading', desc: 'AI-powered evaluation that matches human accuracy while eliminating bias and fatigue.' },
  { icon: '⚡', title: 'Blazing Fast Results', desc: 'Grade hundreds of answer sheets in minutes, not hours—get instant feedback for timely interventions.' },
  { icon: '📊', title: 'Deep Learning Analytics', desc: 'Rich insights with skill gap analysis, learning trend detection, and comparative performance dashboards.' },
  { icon: '📧', title: 'Automated Feedback Loop', desc: 'Personalized feedback reports automatically generated and delivered to each student via email/LMS.' },
  { icon: '🛡️', title: 'Academic Integrity Guard', desc: 'Built-in plagiarism detection and answer similarity analysis to uphold assessment fairness.' },
  { icon: '📱', title: 'Mobile-Friendly Workflow', desc: 'Evaluate on-the-go—upload sheets from any device and access results from your smartphone or tablet.' },
];

const HOW_IT_WORKS = [
  { step: '01', title: 'Upload & Configure', desc: 'Drag & drop answer sheets, select exam mode, and define evaluation criteria in seconds.' },
  { step: '02', title: 'AI Processing', desc: 'Our engine extracts text, analyzes content semantics, and applies your grading rubric automatically.' },
  { step: '03', title: 'Review Results', desc: 'View detailed scores, analytics reports, and flagged items requiring instructor attention.' },
  { step: '04', title: 'Distribute Feedback', desc: 'Send personalized feedback to students with one click or integrate directly with your LMS.' },
];

const SUBJECTS = [
  { name: 'Computer Science', icon: '💻' },
  { name: 'Engineering', icon: '⚙️' },
  { name: 'Business & Management', icon: '📊' },
  { name: 'Life Sciences', icon: '🔬' },
  { name: 'Social Sciences', icon: '👥' },
  { name: 'Languages & Humanities', icon: '📚' },
  { name: 'Mathematics', icon: '∑' },
  { name: 'Health Sciences', icon: '🏥' },
];

const CONTACT_INFO = [
  { icon: '✉️', label: 'Email', value: 'hello@evalai.tech', href: 'mailto:hello@evalai.tech' },
  { icon: '🌐', label: 'Website', value: 'evalai.tech', href: 'https://evalai.tech' },
  { icon: '📍', label: 'Headquarters', value: 'Pune, Maharashtra, India', href: null },
  { icon: '🕐', label: 'Support Hours', value: '24/7 Technical Support', href: null },
];

// 3D Tilt hook
const useTilt = () => {
  const ref = useRef(null);
  const [transform, setTransform] = useState('');
  useEffect(() => {
    const move = (e) => {
      if (!ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      const rx = (((e.clientY - rect.top) / rect.height) - 0.5) * -10;
      const ry = (((e.clientX - rect.left) / rect.width) - 0.5) * 10;
      setTransform(`perspective(1000px) rotateX(${rx}deg) rotateY(${ry}deg) scale(1.02)`);
    };
    const leave = () => setTransform('perspective(1000px) rotateX(0) rotateY(0) scale(1)');
    const el = ref.current;
    if (el) { el.addEventListener('mousemove', move); el.addEventListener('mouseleave', leave); }
    return () => { if (el) { el.removeEventListener('mousemove', move); el.removeEventListener('mouseleave', leave); } };
  }, []);
  return { ref, style: { transform } };
};

// ── Contact Form Component ──────────────────────────────────────────
function ContactSection() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [status, setStatus] = useState('idle');
  const [touched, setTouched] = useState({});

  const errors = {
    name: !form.name.trim() ? 'Name is required' : '',
    email: !form.email.trim() ? 'Email is required' : !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email) ? 'Enter a valid email' : '',
    subject: !form.subject ? 'Please select a topic' : '',
    message: form.message.trim().length < 20 ? 'Message must be at least 20 characters' : '',
  };
  const isValid = Object.values(errors).every(e => !e);

  const blur = (f) => setTouched(t => ({ ...t, [f]: true }));
  const change = (f, v) => setForm(p => ({ ...p, [f]: v }));

  function submit(e) {
    e.preventDefault();
    setTouched({ name: true, email: true, subject: true, message: true });
    if (!isValid) return;
    setStatus('sending');
    setTimeout(() => {
      setStatus('success');
      setForm({ name: '', email: '', subject: '', message: '' });
      setTouched({});
    }, 1800);
  }

  if (status === 'success') {
    return (
      <section className={styles.contactSection} id="contact">
        <div className={styles.sectionInner}>
          <div className={styles.successState}>
            <div className={styles.successIcon}>🎉</div>
            <h3 className={styles.successTitle}>Message Sent Successfully!</h3>
            <p className={styles.successDesc}>Thank you for reaching out. Our team will respond within 2 business hours.</p>
            <button className={styles.successResetBtn} onClick={() => setStatus('idle')}>
              ✉️ Send Another Message
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className={styles.contactSection} id="contact">
      <div className={styles.sectionInner}>
        <div className={styles.sectionHead}>
          <span className={styles.sectionTag}>Contact</span>
          <h2 className={styles.sectionTitle}>Get in Touch</h2>
          <p className={styles.sectionSub}>Questions about EvalAI? We're here to help educators transform their grading workflow.</p>
        </div>
        <div className={styles.contactLayout}>
          <div className={styles.contactInfoCard}>
            <h3 className={styles.contactInfoTitle}>Let's connect 👋</h3>
            <p className={styles.contactInfoDesc}>
              Whether you're an educator, administrator, or institution leader — we're here
              to help you implement AI-powered grading that saves time and improves learning outcomes.
            </p>
            <div className={styles.contactInfoList}>
              {CONTACT_INFO.map(item => (
                <div key={item.label} className={styles.contactInfoItem}>
                  <div className={styles.contactInfoIconBox}>{item.icon}</div>
                  <div>
                    <div className={styles.contactInfoLabel}>{item.label}</div>
                    {item.href
                      ? <a href={item.href} className={styles.contactInfoValue}>{item.value}</a>
                      : <span className={styles.contactInfoValue}>{item.value}</span>}
                  </div>
                </div>
              ))}
            </div>
            <div className={styles.socialLinks}>
              <a href="https://github.com/evalai-tech" target="_blank" rel="noreferrer" className={styles.socialLink}>⬛ GitHub</a>
              <a href="https://linkedin.com/company/evalai-tech" target="_blank" rel="noreferrer" className={styles.socialLink}>🔵 LinkedIn</a>
              <a href="https://twitter.com/evalai_tech" target="_blank" rel="noreferrer" className={styles.socialLink}>🐦 Twitter</a>
            </div>
          </div>

          <form className={styles.contactForm} onSubmit={submit} noValidate>
            <div className={styles.contactFormRow}>
              <div className={styles.contactField}>
                <label className={styles.contactLabel}>Full Name <span className={styles.req}>*</span></label>
                <div className={`${styles.contactInputWrap} ${touched.name && errors.name ? styles.inputErr : ''}`}>
                  <span className={styles.contactInputIcon}>👤</span>
                  <input className={styles.contactInput} type="text" placeholder="Dr. / Prof. / Your Name"
                    value={form.name} onChange={e => change('name', e.target.value)} onBlur={() => blur('name')} />
                </div>
                {touched.name && errors.name && <span className={styles.contactErrMsg}>⚠ {errors.name}</span>}
              </div>
              <div className={styles.contactField}>
                <label className={styles.contactLabel}>Email <span className={styles.req}>*</span></label>
                <div className={`${styles.contactInputWrap} ${touched.email && errors.email ? styles.inputErr : ''}`}>
                  <span className={styles.contactInputIcon}>✉️</span>
                  <input className={styles.contactInput} type="email" placeholder="you@institution.edu"
                    value={form.email} onChange={e => change('email', e.target.value)} onBlur={() => blur('email')} />
                </div>
                {touched.email && errors.email && <span className={styles.contactErrMsg}>⚠ {errors.email}</span>}
              </div>
            </div>
            <div className={styles.contactField}>
              <label className={styles.contactLabel}>Topic <span className={styles.req}>*</span></label>
              <div className={`${styles.contactInputWrap} ${touched.subject && errors.subject ? styles.inputErr : ''}`}>
                <span className={styles.contactInputIcon}>📋</span>
                <select className={`${styles.contactInput} ${styles.contactSelect}`}
                  value={form.subject} onChange={e => change('subject', e.target.value)} onBlur={() => blur('subject')}>
                  <option value="">Select a topic</option>
                  <option value="demo">Request a Demo</option>
                  <option value="pricing">Pricing Inquiry</option>
                  <option value="support">Technical Support</option>
                  <option value="integration">LMS Integration</option>
                  <option value="partnership">Partnership</option>
                  <option value="other">Other</option>
                </select>
              </div>
              {touched.subject && errors.subject && <span className={styles.contactErrMsg}>⚠ {errors.subject}</span>}
            </div>
            <div className={styles.contactField}>
              <label className={styles.contactLabel}>Message <span className={styles.req}>*</span></label>
              <div className={`${styles.contactInputWrap} ${touched.message && errors.message ? styles.inputErr : ''}`}>
                <textarea className={`${styles.contactInput} ${styles.contactTextarea}`} placeholder="Write your message here (min. 20 characters)..."
                  value={form.message} onChange={e => change('message', e.target.value)} onBlur={() => blur('message')} rows={4} />
              </div>
              {touched.message && errors.message && <span className={styles.contactErrMsg}>⚠ {errors.message}</span>}
            </div>
            <button className={`${styles.contactSubmitBtn} ${status === 'sending' ? styles.contactSubmitSending : ''}`} type="submit" disabled={status === 'sending'}>
              {status === 'sending' ? <><span className={styles.spinner} /> Sending...</> : '📨 Send Message'}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}

// ── Main HomePage Component ───────────────────────────────────────────────────
export default function HomePage() {
  const navigate = useNavigate();  // ← React Router hook
  const [menuOpen, setMenuOpen] = useState(false);
  const { ref: heroCardRef, style: heroCardStyle } = useTilt();

  return (
    <div className={styles.page}>
    {/* ── NAVBAR ── */}
<header className={styles.nav}>
  <div className={styles.navInner}>

    {/* Brand */}
    <div className={styles.brand}>
      <span className={styles.brandIcon}>🎓</span>
      <span className={styles.brandName}>
        EvalAI <span className={styles.brandSub}>Grader</span>
      </span>
    </div>

    {/* Navigation Links */}
    <nav className={styles.navLinks}>
      {NAV_LINKS.map(l => (
        <a
          key={l}
          href={`#${l.toLowerCase().replaceAll(' ', '-')}`}
          className={styles.navLink}
          onClick={() => setMenuOpen(false)}
        >
          {l}
        </a>
      ))}
    </nav>

    {/* CTA Buttons */}
    <div className={styles.navCtas}>
      <button
        className={styles.navLogin}
        onClick={() => navigate('/login')}
      >
        Sign In
      </button>

      <button
        className={styles.navRegister}
        onClick={() => navigate('/register')}
      >
        Get Started →
      </button>
    </div>

    {/* Mobile Hamburger */}
    <button
      className={`${styles.hamburger} ${menuOpen ? styles.hamburgerActive : ''}`}
      onClick={() => setMenuOpen(!menuOpen)}
      aria-label="Toggle menu"
    >
      <span></span>
      <span></span>
      <span></span>
    </button>

  </div>
</header> 

      {/* ── HERO ── */}
      <section className={styles.hero}>
        <div className={styles.heroBg}>
          {/* Replace static blobs with 3D particle field */}
          <div className={styles.hero3DContainer}>
            <HeroScene />
          </div>
          <div className={styles.gridPattern} />
        </div>
        <div className={styles.heroContainer}>
          <div className={styles.heroContent}>
            <div className={styles.heroBadge}>
              <span className={styles.heroBadgeDot} />
              Trusted by Educators Worldwide
            </div>
            <h1 className={styles.heroTitle}>
              Stop Manual Grading. Start Impacting Learning.
            </h1>
            <p className={styles.heroDesc}>
              EvalAI transforms hours of grading into minutes of insight. Upload any answer sheet and get immediate,
              fair, and detailed feedback that helps students improve—while you reclaim your time for what matters most.
            </p>

            {/* Enhanced stats with animations */}
            <div className={styles.heroStats}>
              <ScrollReveal delay={0} type="fade-up" distance={30}>
                <AnimatedStatCard
                  icon="⏱️"
                  value="80%"
                  label="Time Saved"
                  delay={0}
                />
              </ScrollReveal>
              <ScrollReveal delay={0.1} type="fade-up" distance={30}>
                <AnimatedStatCard
                  icon="🎯"
                  value="95%"
                  label="Grading Accuracy"
                  delay={0.1}
                />
              </ScrollReveal>
              <ScrollReveal delay={0.2} type="fade-up" distance={30}>
                <AnimatedStatCard
                  icon="📈"
                  value="2x"
                  label="Learning Improvement"
                  delay={0.2}
                />
              </ScrollReveal>
              <ScrollReveal delay={0.3} type="fade-up" distance={30}>
                <AnimatedStatCard
                  icon="🌍"
                  value="500+"
                  label="Institutions Trusted"
                  delay={0.3}
                />
              </ScrollReveal>
            </div>

            <div className={styles.heroCtas}>
              <ThreeDButton
                variant="primary"
                size="lg"
                onClick={() => navigate('/register')}
              >
                🚀 Start Grading Now
              </ThreeDButton>
              <ScrollReveal delay={0.4} type="fade-up" distance={20}>
                <a href="#how-it-works" className={styles.ctaSecondary}>See How It Works ↓</a>
              </ScrollReveal>
            </div>
          </div>

          {/* Keep the tilt card for now, but we could enhance it later */}
          <div className={styles.heroVisual} ref={heroCardRef} style={heroCardStyle}>
            <div className={styles.heroCard}>
              <div className={styles.heroCardHeader}>
                <div className={styles.heroCardDots}>
                  <span className={styles.heroCardDot} style={{ background: '#ef4444' }} />
                  <span className={styles.heroCardDot} style={{ background: '#f59e0b' }} />
                  <span className={styles.heroCardDot} style={{ background: '#22c55e' }} />
                </div>
                <span className={styles.heroCardTitle}>Live Evaluation Process</span>
              </div>
              <div className={styles.heroCardBody}>
                {['Student_01.pdf', 'Student_02.pdf', 'Student_03.pdf'].map((name, i) => (
                  <div key={name} className={styles.heroCardRow} style={{ animationDelay: `${i * 0.4}s` }}>
                    <div className={styles.fileIcon}>📄</div>
                    <div className={styles.fileInfo}>
                      <span className={styles.heroCardName}>{name}</span>
                      <div className={styles.heroCardBar}>
                        <div className={styles.heroCardBarFill} style={{ width: `${[78, 65, 92][i]}%`, animationDelay: `${i * 0.4 + 0.3}s` }} />
                      </div>
                    </div>
                    <span className={styles.heroCardScore}>{[78, 65, 92][i]}%</span>
                  </div>
                ))}
              </div>
              <div className={styles.heroCardFooter}>
                <span className={styles.heroCardBadge}>✅ Evaluation Complete</span>
                <span className={styles.heroCardTime}>2.3s</span>
              </div>
              <div className={styles.scanLine} />
            </div>
            <div className={styles.heroFloatA}><span>🧠</span> NLP Active</div>
            <div className={styles.heroFloatB}><span>📊</span> Analytics Ready</div>
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className={styles.section} id="features">
        <div className={styles.sectionInner}>
          <div className={styles.sectionHead}>
            <span className={styles.sectionTag}>Why Educators Choose EvalAI</span>
            <h2 className={styles.sectionTitle}>Grade Smarter, Not Harder</h2>
            <p className={styles.sectionSub}>AI-powered tools designed to reduce workload while improving learning outcomes</p>
          </div>
          <div className={styles.featuresGrid}>
            {FEATURES.map((f, i) => (
              <div key={f.title} className={styles.featureCard} style={{ animationDelay: `${i * 0.1}s` }}>
                <div className={styles.featureIconWrapper}>{f.icon}</div>
                <h3 className={styles.featureTitle}>{f.title}</h3>
                <p className={styles.featureDesc}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className={styles.howSection} id="how-it-works">
        <div className={styles.sectionInner}>
          <div className={styles.sectionHead}>
            <span className={styles.sectionTag}>Process</span>
            <h2 className={styles.sectionTitle}>How It Works</h2>
            <p className={styles.sectionSub}>Four simple steps from upload to results</p>
          </div>
          <div className={styles.stepsRow}>
            {HOW_IT_WORKS.map((step, i) => (
              <div key={step.step} className={styles.stepCard}>
                <div className={styles.stepNum}>{step.step}</div>
                {i < HOW_IT_WORKS.length - 1 && <div className={styles.stepConnector} />}
                <h3 className={styles.stepTitle}>{step.title}</h3>
                <p className={styles.stepDesc}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SUBJECTS ── */}
      <section className={styles.section} id="subjects">
        <div className={styles.sectionInner}>
          <div className={styles.sectionHead}>
            <span className={styles.sectionTag}>Subject Coverage</span>
            <h2 className={styles.sectionTitle}>Broad Academic Domain Support</h2>
            <p className={styles.sectionSub}>Specialized AI models trained for accurate evaluation across disciplines</p>
          </div>
          <div className={styles.subjectsGrid}>
            {SUBJECTS.map(s => (
              <div key={s.name} className={styles.subjectPill}>
                <span className={styles.subjectPillIcon}>{s.icon}</span>
                <span>{s.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── EXAM MODE ── */}
      <section className={styles.section} id="exam-mode">
        <div className={styles.sectionInner}>
          <div className={styles.sectionHead}>
            <span className={styles.sectionTag}>Flexible Assessment</span>
            <h2 className={styles.sectionTitle}>Adapt to Your Assessment Needs</h2>
            <p className={styles.sectionSub}>From traditional exams to continuous assessment, EvalAI fits your workflow</p>
          </div>
          <div className={styles.examModeGrid}>
            <div className={styles.examModeCard}>
              <div className={styles.examModeIcon}>📝</div>
              <h3 className={styles.examModeTitle}>Traditional Exams</h3>
              <p className={styles.examModeDesc}>Midterms, finals, and standardized tests with secure batch processing</p>
            </div>
            <div className={styles.examModeCard}>
              <div className={styles.examModeIcon}>🔄</div>
              <h3 className={styles.examModeTitle}>Continuous Assessment</h3>
              <p className={styles.examModeDesc}>Weekly quizzes, assignments, and formative evaluations with instant feedback</p>
            </div>
            <div className={styles.examModeCard}>
              <div className={styles.examModeIcon}>👥</div>
              <h3 className={styles.examModeTitle}>Group Projects</h3>
              <p className={styles.examModeDesc}>Evaluate collaborative work with individual contribution tracking</p>
            </div>
            <div className={styles.examModeCard}>
              <div className={styles.examModeIcon}>📋</div>
              <h3 className={styles.examModeTitle}>Practical Assessments</h3>
              <p className={styles.examModeDesc}>Lab reports, case studies, and hands-on evaluations with rubric-based scoring</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── CONTACT ── */}
      <ContactSection />

      {/* ── CTA BANNER ── */}
      <section className={styles.ctaBanner}>
        <div className={styles.ctaBannerInner}>
          <h2 className={styles.ctaBannerTitle}>Join 500+ Institutions Saving 10+ Hours Weekly</h2>
          <p className={styles.ctaBannerSub}>Experience AI-powered grading that's accurate, fair, and designed specifically for educators like you.</p>
          <button className={styles.ctaBannerBtn} onClick={() => navigate('/register')}>🚀 Start Free Trial →</button>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <div className={styles.footerBrand}>
            <span className={styles.brandIcon}>🎓</span>
            <span className={styles.brandName}>EvalAI <span className={styles.brandSub}>Grader</span></span>
          </div>
          <nav className={styles.footerNav}>
            {NAV_LINKS.map(l => (
              <a key={l} href={`#${l.toLowerCase().replace(' ', '-')}`} className={styles.footerNavLink}>{l}</a>
            ))}
          </nav>
          <p className={styles.footerCopy}>© 2026 EvalAI Grader · Built with ❤️ for educators</p>
        </div>
      </footer>
    </div>
  );
}