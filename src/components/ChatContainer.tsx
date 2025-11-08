'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useDailyId } from '@/hooks/useDailyId';
import { useChat } from '@/hooks/useChat';
import { useHighlights } from '@/hooks/useHighlights';
import { useTimeUntilReset } from '@/hooks/useTimeUntilReset';
import { getUserIdFromDailyId } from '@/lib/dailyIdService';
import { generateChatId } from '@/lib/chatUtils';
import ChatWindow from './ChatWindow';
import ChatInput from './ChatInput';
import FavoriteButton from './FavoriteButton';
import styles from './ChatContainer.module.css';

interface ChatContainerProps {
  otherDailyId: string;
}

export default function ChatContainer({ otherDailyId }: ChatContainerProps) {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { dailyId, loading: idLoading } = useDailyId(user?.uid || null);
  const timeUntilReset = useTimeUntilReset();
  const { 
    messages, 
    loading: chatLoading, 
    error, 
    sendMessage, 
    sending 
  } = useChat({
    myDailyId: dailyId || '',
    otherDailyId
  });
  
  // State for other user's Firebase UID (needed for highlights)
  const [otherUserId, setOtherUserId] = useState<string | null>(null);
  const [otherUserIdLoading, setOtherUserIdLoading] = useState<boolean>(true);
  const [otherUserIdError, setOtherUserIdError] = useState<string | null>(null);
  
  // Generate chat ID
  const chatId = dailyId ? generateChatId(dailyId, otherDailyId) : null;
  
  // Initialize highlights functionality
  const {
    highlightStatuses,
    toggleHighlight,
    loading: highlightsLoading,
    error: highlightsError
  } = useHighlights({
    userId: user?.uid || null,
    otherUserId,
    chatId,
    myDailyId: dailyId,
    otherDailyId,
    messages
  });
  
  // Fetch other user's Firebase UID
  useEffect(() => {
    if (!otherDailyId) {
      setOtherUserIdLoading(false);
      return;
    }
    
    setOtherUserIdLoading(true);
    setOtherUserIdError(null);
    
    getUserIdFromDailyId(otherDailyId).then((uid) => {
      if (uid) {
        setOtherUserId(uid);
        setOtherUserIdError(null);
      } else {
        setOtherUserIdError('This Daily ID does not exist or has expired.');
      }
      setOtherUserIdLoading(false);
    }).catch((err) => {
      console.error('Error fetching other user ID:', err);
      setOtherUserIdError('Failed to validate Daily ID.');
      setOtherUserIdLoading(false);
    });
  }, [otherDailyId]);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  // Loading state - MATCHING DASHBOARD
  if (authLoading || idLoading || chatLoading || otherUserIdLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <div className={styles.loadingSpinner}>
            <div className={styles.spinner}>
              <img src="/favicon.svg" alt="Loading" />
            </div>
          </div>
          <p>Loading chat...</p>
        </div>
      </div>
    );
  }

  // Error state - other user's ID doesn't exist
  if (otherUserIdError) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <span className={styles.errorIcon}>⚠️</span>
          <h3>Invalid Daily ID</h3>
          <p>{otherUserIdError}</p>
          <p className={styles.errorDetail}>
            The Daily ID <strong>{otherDailyId}</strong> is not valid or has expired.
          </p>
          <button onClick={() => router.push('/')}>Go Home</button>
        </div>
      </div>
    );
  }

  // Error state - chat error
  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <span className={styles.errorIcon}>⚠️</span>
          <p>{error}</p>
          <button onClick={() => router.push('/')}>Go Home</button>
        </div>
      </div>
    );
  }

  // No daily ID
  if (!dailyId) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <p>Unable to load your daily ID</p>
          <button onClick={() => router.push('/')}>Go Home</button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <button 
          className={styles.backButton}
          onClick={() => router.push('/')}
          aria-label="Back to dashboard"
        >
          ← Back
        </button>
        <div className={styles.chatInfo}>
          <h2>Anonymous Chat</h2>
          <div className={styles.subtitle}>
            <span className={styles.statusIndicator}></span>
            ID: {otherDailyId}
          </div>
        </div>
        <div className={styles.resetTime}>
          🕐 {timeUntilReset}
        </div>
        <div className={styles.favoriteSection}>
          <FavoriteButton
            userId={user?.uid || null}
            userDailyId={dailyId}
            targetDailyId={otherDailyId}
          />
        </div>
      </header>

      {/* Removed PurgeWarning - reset time now in header */}

      {/* Chat Window */}
      <ChatWindow 
        messages={messages}
        myDailyId={dailyId}
        otherDailyId={otherDailyId}
        userId={user?.uid || undefined}
        otherUserId={otherUserId || undefined}
        chatId={chatId || undefined}
        highlightStatuses={highlightStatuses}
        onToggleHighlight={toggleHighlight}
      />

      {/* Chat Input */}
      <ChatInput 
        onSend={sendMessage}
        disabled={sending}
        placeholder="Type a message..."
      />
    </div>
  );
}

