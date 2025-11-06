'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useDailyId } from '@/hooks/useDailyId';
import { useChatLimit } from '@/hooks/useChatLimit';
import { formatDailyId } from '@/lib/dailyId';
import { formatTimeUntilReset } from '@/lib/chatLimitService';
import { getChat } from '@/lib/chatService';
import { generateChatId } from '@/lib/chatUtils';
import RandomConnect from '@/components/RandomConnect';
import OnboardingTour from '@/components/OnboardingTour';
import styles from "./page.module.css";

export default function Home() {
  const { user, loading: authLoading, signOut } = useAuth();
  const { dailyId, loading: idLoading, error, timeUntilReset } = useDailyId(user?.uid || null);
  const chatLimit = useChatLimit(user?.uid || null);
  const router = useRouter();
  const [targetId, setTargetId] = useState('');
  const [copied, setCopied] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Prevent flash on initial mount
  useEffect(() => {
    setMounted(true);
  }, []);

  // Check if this is the user's first time - go straight to onboarding
  useEffect(() => {
    if (user && !authLoading && !idLoading && dailyId) {
      const hasCompletedOnboarding = localStorage.getItem('ghostmate-onboarding-completed');
      
      if (!hasCompletedOnboarding) {
        setTimeout(() => setShowOnboarding(true), 300);
      }
    }
  }, [user, authLoading, idLoading, dailyId]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  // Dev helper: Press Shift+R to reset onboarding
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.shiftKey && e.key === 'R') {
        localStorage.removeItem('ghostmate-onboarding-completed');
        alert('✅ Cache cleared! Refresh (F5) to see onboarding.');
      }
    };
    
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  // Show loading screen until mounted AND auth/id states are resolved
  if (!mounted || authLoading || idLoading) {
    return (
      <div className={styles.page}>
        <main className={styles.main}>
          <div className={styles.intro}>
            <div className={styles.loadingSpinner}>
              <div className={styles.ghostLoader}>
                <span>👻</span>
              </div>
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
    <>
      {/* Onboarding Tour */}
      {showOnboarding && (
        <OnboardingTour onComplete={() => setShowOnboarding(false)} />
      )}

      <div className={styles.page}>
      <main className={styles.main}>
        <div className={styles.intro}>
          <h1>Welcome to GhostMate</h1>
          <p className={styles.subtitle}>Your anonymous identity for today</p>

          <div className={`${styles.idCard} idCard`}>
            <div className={styles.idHeader}>
              <span className={styles.idLabel}>Your Daily ID</span>
              {timeUntilReset && (
                <span className={`${styles.resetTimer} resetTimer`}>
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
                <div className={styles.dailyIdWrapper}>
                  <div className={styles.dailyId}>
                    {formatDailyId(dailyId)}
                  </div>
                  <button
                    className={`${styles.copyButton} copyButton`}
                    onClick={() => {
                      navigator.clipboard.writeText(dailyId);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    }}
                    title="Copy ID"
                  >
                    {copied ? '✓' : '📋'}
                  </button>
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
          <div className={`${styles.chatSection} chatInput`}>
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
                      // Validation checks
                      if (!targetId || targetId.length !== 8) {
                        alert('Please enter a valid 8-digit ID');
                        return;
                      }
                      
                      if (!dailyId) {
                        alert('Your ID is not ready yet. Please wait...');
                        return;
                      }
                      
                      if (targetId === dailyId) {
                        alert('You cannot chat with yourself!');
                        return;
                      }
                      
                      try {
                        // ✅ NEW: Validate that the other daily ID exists in Firestore
                        const { getUserIdFromDailyId } = await import('@/lib/dailyIdService');
                        const otherUserId = await getUserIdFromDailyId(targetId);
                        
                        if (!otherUserId) {
                          alert('⚠️ This Daily ID does not exist or has expired.\n\nPlease check the ID and try again.');
                          return;
                        }

                        // Check if chat already exists
                        const chatId = generateChatId(dailyId, targetId);
                        const existingChat = await getChat(chatId);
                        
                        if (existingChat) {
                          // Chat already exists - navigate without incrementing limit
                          router.push(`/chat/${targetId}`);
                        } else {
                          // New chat - increment limit before navigating
                          const result = await chatLimit.recordChatInitiation();
                          
                          if (result.success) {
                            router.push(`/chat/${targetId}`);
                          } else {
                            alert(result.message || 'Failed to start chat');
                          }
                        }
                      } catch (error) {
                        console.error('Error checking chat:', error);
                        alert('Failed to start chat. Please try again.');
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

          {/* Random Connect Section */}
          <div className={`${styles.randomSection} randomSection`}>
            <h2>Or Try Random Connect</h2>
            <p className={styles.randomSubtitle}>Get paired with a random user instantly</p>
            
            <RandomConnect 
              userId={user?.uid || null}
              userDailyId={dailyId}
            />
          </div>

          {/* Navigation Buttons */}
          <div className={styles.navButtons}>
            <button 
              onClick={() => router.push('/stories')} 
              className={styles.storiesButton}
            >
              ✨ Featured Stories
            </button>
            <button onClick={signOut} className={styles.signOutButton}>
              Sign Out
            </button>
          </div>
        </div>
      </main>
    </div>
    </>
  );
}