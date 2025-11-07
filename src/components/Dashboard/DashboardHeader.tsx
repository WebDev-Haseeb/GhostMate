'use client';

import { useRouter } from 'next/navigation';
import styles from './DashboardHeader.module.css';

interface DashboardHeaderProps {
  timeUntilReset?: {
    hours: number;
    minutes: number;
    seconds: number;
  } | null;
  onSignOut: () => void;
}

export default function DashboardHeader({ timeUntilReset, onSignOut }: DashboardHeaderProps) {
  const router = useRouter();

  return (
    <header className={styles.header}>
      <div className={styles.container}>
        {/* Logo/Brand */}
        <div className={styles.brand}>
          <span className={styles.logo}>👻</span>
          <h1 className={styles.title}>GhostMate</h1>
        </div>

        {/* Countdown Timer */}
        {timeUntilReset && (
          <div className={styles.countdown}>
            <span className={styles.countdownLabel}>Reset in</span>
            <div className={styles.countdownTime}>
              <span className={styles.timeUnit}>
                {String(timeUntilReset.hours).padStart(2, '0')}
              </span>
              <span className={styles.separator}>:</span>
              <span className={styles.timeUnit}>
                {String(timeUntilReset.minutes).padStart(2, '0')}
              </span>
              <span className={styles.separator}>:</span>
              <span className={styles.timeUnit}>
                {String(timeUntilReset.seconds).padStart(2, '0')}
              </span>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className={styles.nav}>
          <button
            onClick={() => router.push('/stories')}
            className={styles.navButton}
            aria-label="View Featured Stories"
          >
            <span className={styles.navIcon}>✨</span>
            <span className={styles.navText}>Stories</span>
          </button>
          
          <button
            onClick={onSignOut}
            className={`${styles.navButton} ${styles.signOutButton}`}
            aria-label="Sign Out"
          >
            <span className={styles.navIcon}>🚪</span>
            <span className={styles.navText}>Sign Out</span>
          </button>
        </nav>
      </div>
    </header>
  );
}

