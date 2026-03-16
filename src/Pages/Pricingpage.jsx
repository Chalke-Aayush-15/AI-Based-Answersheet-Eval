import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PLANS, TAB_META } from '../subscription/plans';
import { useSubscription } from '../subscription/SubscriptionContext';
import styles from './PricingPage.module.css';

function PlanCard({ plan, isCurrentPlan, onSelect, animDelay }) {
  const [hover, setHover] = useState(false);

  return (
    <div
      className={`${styles.card} ${plan.popular ? styles.cardPopular : ''} ${isCurrentPlan ? styles.cardActive : ''}`}
      style={{ animationDelay: `${animDelay}s`, borderColor: isCurrentPlan ? plan.color : '' }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      {plan.popular && (
        <div className={styles.popularBadge} style={{ background: plan.color }}>🥇 Most Popular</div>
      )}
      {isCurrentPlan && (
        <div className={styles.activeBadge} style={{ background: plan.color }}>✅ Current Plan</div>
      )}

      <div className={styles.cardHeader} style={{ background: plan.bgGradient }}>
        <div className={styles.planBadge}>{plan.badge}</div>
        <h3 className={styles.planName} style={{ color: plan.color }}>{plan.name}</h3>
        <p className={styles.planTagline}>{plan.tagline}</p>
        <div className={styles.priceRow}>
          <span className={styles.price} style={{ color: plan.color }}>{plan.priceLabel}</span>
          {plan.durationDays
            ? <span className={styles.pricePer}>/ {plan.durationDays} days</span>
            : plan.price > 0
            ? <span className={styles.pricePer}>/ month</span>
            : null}
        </div>
        {plan.id === 'free_trial' && (
          <div className={styles.trialChip}>⏱️ 5 days · No credit card</div>
        )}
      </div>

      <div className={styles.cardBody}>
        <div className={styles.accessTitle}>Services Included</div>
        <div className={styles.accessGrid}>
          {Object.entries(TAB_META).map(([tabId, meta]) => {
            const allowed = plan.allowedTabs.includes(tabId);
            return (
              <div key={tabId} className={`${styles.accessItem} ${allowed ? styles.accessAllowed : styles.accessLocked}`}>
                <span className={styles.accessIcon}>{meta.icon}</span>
                <span className={styles.accessLabel}>{meta.label}</span>
                <span className={styles.accessCheck}>{allowed ? '✅' : '🔒'}</span>
              </div>
            );
          })}
        </div>
        <div className={styles.featureList}>
          {plan.features.map(f => (
            <div key={f.text} className={`${styles.featureItem} ${!f.included ? styles.featureDisabled : ''}`}>
              <span className={styles.featureDot} style={{ color: f.included ? plan.color : '#D1D5DB' }}>
                {f.included ? '✓' : '✗'}
              </span>
              <span>{f.text}</span>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.cardFooter}>
        <button
          className={styles.selectBtn}
          style={isCurrentPlan ? { background: plan.color } : {
            background: plan.popular ? plan.color : 'transparent',
            color: plan.popular ? 'white' : plan.color,
            border: `2px solid ${plan.color}`,
          }}
          onClick={() => onSelect(plan.id)}
          disabled={isCurrentPlan}
        >
          {isCurrentPlan ? '✅ Active Plan' : plan.id === 'free_trial' ? '⚡ Start Free Trial' : `Choose ${plan.name}`}
        </button>
      </div>
    </div>
  );
}

export default function PricingPage() {
  const navigate = useNavigate();
  const { state, dispatch } = useSubscription();
  const [selected, setSelected] = useState(null);
  const [confirming, setConfirming] = useState(false);

  function handleSelect(planId) {
    setSelected(planId);
    setConfirming(true);
  }

  function handleConfirm() {
    dispatch({ type: 'ACTIVATE_PLAN', payload: { planId: selected } });
    // After activating, go to dashboard
    navigate('/dashboard', { replace: true });
  }

  function handleBack() {
    // Go back to dashboard if already have a plan, else go home
    if (state.planId) {
      navigate('/dashboard');
    } else {
      navigate('/');
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.bg}>
        <div className={styles.bgBlob1} />
        <div className={styles.bgBlob2} />
        <div className={styles.bgGrid} />
      </div>

      <div className={styles.inner}>
        <div className={styles.pageHeader}>
          {/* ← use navigate instead of onBack prop */}
          <button className={styles.backBtn} onClick={handleBack}>← Back to Dashboard</button>

          <div className={styles.headerTag}>💳 Subscription Plans</div>
          <h1 className={styles.pageTitle}>
            Choose your <span className={styles.titleAccent}>learning plan</span>
          </h1>
          <p className={styles.pageSub}>
            Start free for 5 days, then pick the plan that fits your institution's needs.
          </p>

          <div className={styles.comparisonChips}>
            <div className={styles.chip} style={{ borderColor: '#9CA3AF', color: '#6B7280' }}>
              ⏱️ Free Trial — All features · 5 days
            </div>
            <div className={styles.chipArrow}>→</div>
            <div className={styles.chip} style={{ borderColor: '#94A3B8', color: '#64748B' }}>
              🥈 Silver — Subjects + Evaluation
            </div>
            <div className={styles.chipArrow}>→</div>
            <div className={styles.chip} style={{ borderColor: '#F59E0B', color: '#D97706', background: '#FFFBEB' }}>
              🥇 Gold — Everything Unlocked
            </div>
          </div>
        </div>

        <div className={styles.cardsRow}>
          {Object.values(PLANS).map((plan, i) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              isCurrentPlan={state.planId === plan.id}
              onSelect={handleSelect}
              animDelay={i * 0.12}
            />
          ))}
        </div>

        {/* Feature Comparison Table */}
        <div className={styles.compareSection}>
          <h2 className={styles.compareTitle}>Full Feature Comparison</h2>
          <div className={styles.compareTable}>
            <div className={styles.compareHeader}>
              <div className={styles.compareFeatureCol}>Feature</div>
              {Object.values(PLANS).map(p => (
                <div key={p.id} className={styles.comparePlanCol} style={{ color: p.color }}>
                  {p.badge} {p.name}
                </div>
              ))}
            </div>
            {[
              { label: '📚 Subject Manager', key: 'subjects' },
              { label: '🎯 Evaluation Engine', key: 'evaluation' },
              { label: '📄 PDF OCR Tools', key: 'pdf' },
              { label: '📊 Analytics', key: 'analytics' },
              { label: '⚙️ Settings', key: 'settings' },
              { label: '✉️ Email Reports', vals: [true, false, true] },
              { label: '🎓 Priority Support', vals: [false, false, true] },
              { label: '👥 Unlimited Students', vals: [false, false, true] },
            ].map((row, i) => (
              <div key={i} className={`${styles.compareRow} ${i % 2 === 0 ? styles.compareRowAlt : ''}`}>
                <div className={styles.compareFeatureCol}>{row.label}</div>
                {Object.values(PLANS).map((p, j) => {
                  const has = row.key ? p.allowedTabs.includes(row.key) : row.vals[j];
                  return (
                    <div key={p.id} className={styles.comparePlanCol}>
                      <span className={has ? styles.checkYes : styles.checkNo}>{has ? '✅' : '—'}</span>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* FAQ strip */}
        <div className={styles.faqStrip}>
          {[
            { q: 'No credit card for trial?', a: 'Correct — start free, no card needed.' },
            { q: 'Can I upgrade anytime?', a: 'Yes, upgrade instantly from Silver to Gold.' },
            { q: 'What happens after trial?', a: 'Access is paused until you pick a plan.' },
          ].map(f => (
            <div key={f.q} className={styles.faqItem}>
              <span className={styles.faqQ}>{f.q}</span>
              <span className={styles.faqA}>{f.a}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Confirm Modal */}
      {confirming && selected && (
        <div className={styles.modalOverlay} onClick={() => setConfirming(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalIcon}>{PLANS[selected].badge}</div>
            <h3 className={styles.modalTitle}>Activate {PLANS[selected].name} Plan?</h3>
            <p className={styles.modalSub}>
              {PLANS[selected].id === 'free_trial'
                ? 'You will get full access for 5 days — completely free.'
                : `You will be charged ${PLANS[selected].priceLabel}/month. Services: ${PLANS[selected].allowedTabs.map(t => TAB_META[t].label).join(', ')}.`}
            </p>
            <div className={styles.modalAccessList}>
              {Object.entries(TAB_META).map(([tabId, meta]) => {
                const allowed = PLANS[selected].allowedTabs.includes(tabId);
                return (
                  <span key={tabId} className={`${styles.modalAccessChip} ${allowed ? styles.chipAllowed : styles.chipLocked}`}>
                    {meta.icon} {meta.label}
                  </span>
                );
              })}
            </div>
            <div className={styles.modalActions}>
              <button className={styles.modalConfirm} style={{ background: PLANS[selected].color }} onClick={handleConfirm}>
                ✅ Confirm &amp; Activate
              </button>
              <button className={styles.modalCancel} onClick={() => setConfirming(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}