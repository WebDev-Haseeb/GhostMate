'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import styles from "./page.module.css";

export default function Home() {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className={styles.page}>
        <main className={styles.main}>
          <div className={styles.intro}>
            <p>Loading...</p>
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
          <p className={styles.subtitle}>You're signed in!</p>
          
          <div className={styles.userInfo}>
            <p>Your Firebase UID:</p>
            <code className={styles.uid}>{user.uid}</code>
          </div>

          <button onClick={signOut} className={styles.signOutButton}>
            Sign Out
          </button>
        </div>
      </main>
    </div>
  );
}
