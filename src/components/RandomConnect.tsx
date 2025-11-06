'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { getRandomActiveDailyId } from '@/lib/randomConnect';
import { useChatLimit } from '@/hooks/useChatLimit';
import { formatTimeUntilReset } from '@/lib/chatLimitService';
import styles from './RandomConnect.module.css';

interface RandomConnectProps {
  userId: string | null;
  userDailyId: string | null;
}

export default function RandomConnect({ userId, userDailyId }: RandomConnectProps) {
  const router = useRouter();
  const chatLimit = useChatLimit(userId);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRandomConnect = async () => {
    // Validation
    if (!userId || !userDailyId) {
      setError('Please sign in to connect');
      return;
    }

    // Check if limit reached
    if (chatLimit.isLimitReached) {
      setError(`Daily limit reached! Resets in ${formatTimeUntilReset(chatLimit.timeUntilReset)}`);
      return;
    }

    setConnecting(true);
    setError(null);

    try {
      // Get random active daily ID
      const result = await getRandomActiveDailyId(userId, userDailyId);

      if (!result.success || !result.dailyId) {
        setError(result.error || 'Connection failed');
        setConnecting(false);
        return;
      }

      // Record chat initiation (increment counter)
      const recorded = await chatLimit.recordChatInitiation();
      
      if (!recorded) {
        setError('Failed to record chat. Please try again.');
        setConnecting(false);
        return;
      }

      // Navigate to chat
      router.push(`/chat/${result.dailyId}`);
    } catch (err) {
      console.error('Error connecting randomly:', err);
      setError('Connection failed. Please try again.');
      setConnecting(false);
    }
  };

  // Show remaining chats
  const remainingChats = chatLimit.remaining;

  return (
    <div className={styles.container}>
      <button
        onClick={handleRandomConnect}
        disabled={connecting || chatLimit.isLimitReached || chatLimit.loading}
        className={`${styles.randomButton} ${
          connecting ? styles.connecting : ''
        } ${chatLimit.isLimitReached ? styles.disabled : ''}`}
        title={
          chatLimit.isLimitReached
            ? `Daily limit reached. Resets in ${formatTimeUntilReset(chatLimit.timeUntilReset)}`
            : `Connect with a random user (${remainingChats} remaining)`
        }
      >
        <span className={styles.icon}>
          {connecting ? '🔄' : '🎲'}
        </span>
        <span className={styles.text}>
          {connecting ? 'Connecting...' : 'Random Connect'}
        </span>
        {!connecting && !chatLimit.isLimitReached && (
          <span className={styles.badge}>{remainingChats}</span>
        )}
      </button>

      {error && (
        <div className={styles.error}>
          {error}
        </div>
      )}

      {chatLimit.isLimitReached && !error && (
        <div className={styles.limitMessage}>
          Daily limit reached. Resets in {formatTimeUntilReset(chatLimit.timeUntilReset)}
        </div>
      )}
    </div>
  );
}

