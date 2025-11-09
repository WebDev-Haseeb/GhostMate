'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useDailyId } from '@/hooks/useDailyId';
import { useChatLimit } from '@/hooks/useChatLimit';
import { formatTimeUntilReset } from '@/lib/chatLimitService';
import DashboardHeader from '@/components/Dashboard/DashboardHeader';
import DailyIdCard from '@/components/Dashboard/DailyIdCard';
import ActivitySummary from '@/components/Dashboard/ActivitySummary';
import OnlineUsersList from '@/components/Dashboard/OnlineUsersList';
import OnboardingTour from '@/components/OnboardingTour';
import styles from '@/app/page.module.css';

export default function HomePageClient() {
  const { user, loading: authLoading, signOut } = useAuth();
  const { dailyId, loading: idLoading, error, timeUntilReset } = useDailyId(user?.uid || null);
  const chatLimit = useChatLimit(user?.uid || null);
  const router = useRouter();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !authLoading && !idLoading && (user || !authLoading)) {
      const timer = setTimeout(() => {
        setIsReady(true);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [mounted, authLoading, idLoading, user]);

  useEffect(() => {
    if (user && !authLoading && !idLoading && dailyId) {
      const onboardingCompleted = localStorage.getItem('ghostmate-onboarding-completed');
      const onboardingTimestamp = localStorage.getItem('ghostmate-onboarding-timestamp');
      const userOnboarding = localStorage.getItem(`ghostmate-onboarding-${user.uid}`);

      if (!onboardingCompleted && !onboardingTimestamp && !userOnboarding) {
        setTimeout(() => setShowOnboarding(true), 300);
      }
    }
  }, [user, authLoading, idLoading, dailyId]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.shiftKey && e.key === 'R') {
        localStorage.removeItem('ghostmate-onboarding-completed');
        localStorage.removeItem('ghostmate-onboarding-timestamp');
        if (user?.uid) {
          localStorage.removeItem(`ghostmate-onboarding-${user.uid}`);
        }
        alert('✅ All onboarding flags cleared! Refresh (F5) to see onboarding.');
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [user]);

  if (!isReady) {
    return (
      <div className={styles.page}>
        <main className={styles.main}>
          <div className={styles.intro}>
            <div className={styles.loadingSpinner}>
              <div className={styles.ghostLoader}>
                <img src="/favicon.svg" alt="Loading" style={{ width: '4rem', height: '4rem' }} />
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const handleOnboardingComplete = () => {
    localStorage.setItem('ghostmate-onboarding-completed', 'true');
    localStorage.setItem('ghostmate-onboarding-timestamp', Date.now().toString());
    if (user?.uid) {
      localStorage.setItem(`ghostmate-onboarding-${user.uid}`, 'true');
    }
    setShowOnboarding(false);
  };

  return (
    <>
      {showOnboarding && (
        <OnboardingTour onComplete={handleOnboardingComplete} />
      )}

      <div className={styles.page}>
        <DashboardHeader
          timeUntilReset={timeUntilReset}
          onSignOut={signOut}
        />

        <main className={styles.main}>
          <div className={styles.container}>
            <div className={styles.welcomeSection}>
              <h1 className={styles.welcomeTitle}>Welcome to GhostMate</h1>
              <p className={styles.welcomeSubtitle}>
                Your anonymous, ephemeral connection platform
              </p>
            </div>

            <div className={styles.dashboardGrid}>
              <div className={styles.primaryColumn}>
                <DailyIdCard
                  dailyId={dailyId}
                  loading={idLoading}
                  error={error}
                />

                <OnlineUsersList
                  currentUserId={user?.uid || null}
                  currentDailyId={dailyId}
                  chatLimit={chatLimit}
                />
              </div>

              <ActivitySummary
                chatsUsed={chatLimit.count}
                chatsLimit={chatLimit.limit}
                timeUntilReset={formatTimeUntilReset(chatLimit.timeUntilReset)}
                userId={user?.uid}
                dailyId={dailyId}
              />
            </div>
          </div>
        </main>
      </div>
    </>
  );
}

