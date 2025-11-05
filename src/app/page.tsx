'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useDailyId } from '@/hooks/useDailyId';
import { formatDailyId } from '@/lib/dailyId';
import styles from "./page.module.css";

export default function Home() {
  const { user, loading: authLoading, signOut } = useAuth();
  const { dailyId, loading: idLoading, error, timeUntilReset } = useDailyId(user?.uid || null);
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  if (authLoading || idLoading) {
    return (
      <div className={styles.page}>
        <main className={styles.main}>
          <div className={styles.intro}>
            <div className={styles.loadingSpinner}>
              <div className={styles.spinner}></div>
              <p>Loading your anonymous ID...</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!user) {
    return null; // Redirecting...
  }

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <div className={styles.intro}>
          <h1>Welcome to GhostMate</h1>
          <p className={styles.subtitle}>Your anonymous identity for today</p>

          <div className={styles.idCard}>
            <div className={styles.idHeader}>
              <span className={styles.idLabel}>Your Daily ID</span>
              {timeUntilReset && (
                <span className={styles.resetTimer}>
                  Resets in {String(timeUntilReset.hours).padStart(2, '0')}:
                  {String(timeUntilReset.minutes).padStart(2, '0')}:
                  {String(timeUntilReset.seconds).padStart(2, '0')}
                </span>
              )}
            </div>

            {error ? (
              <div className={styles.error}>
                <p>Failed to load ID</p>
                <span>{error}</span>
              </div>
            ) : dailyId ? (
              <div className={styles.dailyId}>
                {formatDailyId(dailyId)}
              </div>
            ) : (
              <div className={styles.dailyId}>
                ---- ----
              </div>
            )}

            <p className={styles.idDescription}>
              This ID resets at midnight PKT and is completely anonymous
            </p>
          </div>

          <button onClick={signOut} className={styles.signOutButton}>
            Sign Out
          </button>
        </div>
      </main>
    </div>
  );
}
