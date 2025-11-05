'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useDailyId } from '@/hooks/useDailyId';
import { useChatLimit } from '@/hooks/useChatLimit';
import { formatDailyId } from '@/lib/dailyId';
import { formatTimeUntilReset } from '@/lib/chatLimitService';
import styles from "./page.module.css";

export default function Home() {
  const { user, loading: authLoading, signOut } = useAuth();
  const { dailyId, loading: idLoading, error, timeUntilReset } = useDailyId(user?.uid || null);
  const chatLimit = useChatLimit(user?.uid || null);
  const router = useRouter();
  const [targetId, setTargetId] = useState('');

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

          {/* Chat Initiation Section */}
          <div className={styles.chatSection}>
            <h2>Start a Conversation</h2>
            <p className={styles.chatSubtitle}>Enter someone&apos;s daily ID to start chatting</p>
            
            <div className={styles.chatForm}>
              <input
                type="text"
                placeholder="Enter 8-digit ID"
                value={targetId}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '').slice(0, 8);
                  setTargetId(value);
                }}
                maxLength={8}
                className={styles.chatInput}
                disabled={chatLimit.isLimitReached}
              />
              
              <button
                onClick={async () => {
                  if (targetId.length === 8 && dailyId && targetId !== dailyId) {
                    // Record chat initiation
                    const result = await chatLimit.recordChatInitiation();
                    
                    if (result.success) {
                      router.push(`/chat/${targetId}`);
                    } else {
                      alert(result.message || 'Failed to start chat');
                    }
                  } else if (targetId === dailyId) {
                    alert('You cannot chat with yourself!');
                  } else {
                    alert('Please enter a valid 8-digit ID');
                  }
                }}
                disabled={chatLimit.isLimitReached || !targetId || targetId.length !== 8}
                className={styles.startChatButton}
              >
                {chatLimit.isLimitReached ? 'Limit Reached' : 'Start Chat'}
              </button>
            </div>
            
            {/* Chat Limit Status */}
            <div className={styles.limitStatus}>
              <div className={styles.limitInfo}>
                <span className={styles.limitLabel}>Today&apos;s chats:</span>
                <span className={styles.limitCount}>
                  {chatLimit.count} / {chatLimit.limit}
                </span>
              </div>
              
              {chatLimit.isLimitReached && (
                <div className={styles.limitReached}>
                  <p>⏰ Daily limit reached!</p>
                  <p className={styles.resetInfo}>
                    Resets in {formatTimeUntilReset(chatLimit.timeUntilReset)}
                  </p>
                </div>
              )}
              
              {!chatLimit.isLimitReached && chatLimit.remaining <= 2 && chatLimit.remaining > 0 && (
                <div className={styles.limitWarning}>
                  <p>⚠️ Only {chatLimit.remaining} chat{chatLimit.remaining === 1 ? '' : 's'} remaining today</p>
                </div>
              )}
            </div>
          </div>

          <button onClick={signOut} className={styles.signOutButton}>
            Sign Out
          </button>
        </div>
      </main>
    </div>
  );
}
