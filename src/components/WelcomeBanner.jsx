import styles from './WelcomeBanner.module.css';

export default function WelcomeBanner({ userName, planName, onNavigate }) {
  return (
    <section className={styles.page}>
      <div className={styles.banner}>
        <div className={styles.bannerContent}>
          <div className={styles.bannerEyebrow}>EVALAI · EXAM EVALUATOR</div>
          <div className={styles.bannerText}>
            <h1>Welcome back, {userName}.</h1>
            <p>Your <strong>{planName}</strong> plan is active. Ready to evaluate your next set of answer sheets?</p>
          </div>
          <button className={styles.primaryAction} onClick={() => onNavigate('evaluation')}>
            Start an evaluation <span aria-hidden="true">→</span>
          </button>
        </div>
      </div>

      <div className={styles.quickActions}>
        <button className={styles.action} onClick={() => onNavigate('subjects')}>
          <span className={styles.actionIcon} aria-hidden="true">01</span>
          <span className={styles.actionText}>
            <strong>Manage subjects</strong>
            <span>Organize answer keys and student sheets</span>
          </span>
          <span className={styles.actionArrow} aria-hidden="true">↗</span>
        </button>
        <button className={styles.action} onClick={() => onNavigate('analytics')}>
          <span className={styles.actionIcon} aria-hidden="true">02</span>
          <span className={styles.actionText}>
            <strong>Review analytics</strong>
            <span>See evaluation results and trends</span>
          </span>
          <span className={styles.actionArrow} aria-hidden="true">↗</span>
        </button>
      </div>
    </section>
  );
}