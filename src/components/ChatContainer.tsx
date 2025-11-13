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
import {
  ADMIN_SUPPORT_DISPLAY_NAME,
  isAdminSupportDailyId,
} from '@/config/adminSupport';

interface ChatContainerProps {
  otherDailyId: string;
}

export default function ChatContainer({ otherDailyId }: ChatContainerProps) {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { dailyId, loading: idLoading } = useDailyId(user?.uid || null);
  const timeUntilReset = useTimeUntilReset();
  const isSupportChat = isAdminSupportDailyId(otherDailyId);

  // Auto-redirect to dashboard when reset time hits
  useEffect(() => {
    if (!timeUntilReset) return;

    // If less than 1 second until midnight, redirect to dashboard
    if (timeUntilReset.totalMs < 1000) {
      router.push('/');
    }
  }, [timeUntilReset, router]);
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
  const [selfChatBlocked, setSelfChatBlocked] = useState(false);
  
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
  
  // Detect attempts to chat with self once IDs are available
  useEffect(() => {
    if (!dailyId) return;
    setSelfChatBlocked(!!otherDailyId && otherDailyId === dailyId);
  }, [dailyId, otherDailyId]);

  // Fetch other user's Firebase UID
  useEffect(() => {
    if (!otherDailyId) {
      setOtherUserIdLoading(false);
      return;
    }

    if (isSupportChat) {
      setOtherUserId(null);
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

  if (selfChatBlocked) {
    return (
      <div className={styles.container}>
        <div className={styles.unavailableCard}>
          <div className={styles.unavailableIcon}>🚫</div>
          <h2>You already own this Daily ID</h2>
          <p>
            GhostMate connects you anonymously with <strong>other</strong> people. Try sharing your ID with someone else or browse the dashboard to find new connections.
          </p>
          <div className={styles.unavailableTips}>
            <div>
              <span>🎯</span>
              <p>Share your code with a friend so they can join this chat.</p>
            </div>
            <div>
              <span>✨</span>
              <p>Explore today’s highlights to see what’s trending.</p>
            </div>
          </div>
          <div className={styles.unavailableActions}>
            <button className={styles.primaryAction} onClick={() => router.push('/')}>
              Return to Dashboard
            </button>
            <button
              className={styles.secondaryAction}
              onClick={() => router.push('/stories')}
            >
              Explore Stories
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Error state - other user's ID doesn't exist
  if (otherUserIdError) {
    return (
      <div className={styles.container}>
        <div className={styles.unavailableCard}>
          <div className={styles.unavailableIcon}>👻</div>
          <h2>We couldn’t find that Daily ID</h2>
          <p>
            The Daily ID <strong>{otherDailyId}</strong> isn’t active anymore. IDs reset every midnight, so share your fresh ID or wait for your friend to come back online.
          </p>
          <div className={styles.unavailableTips}>
            <div>
              <span>🕛</span>
              <p>Daily IDs refresh every midnight. Grab the latest one from your dashboard.</p>
            </div>
            <div>
              <span>🔔</span>
              <p>Ask your friend to share their current ID so you can reconnect instantly.</p>
            </div>
          </div>
          <div className={styles.unavailableActions}>
            <button className={styles.primaryAction} onClick={() => router.push('/')}>
              Back to Dashboard
            </button>
            <button className={styles.secondaryAction} onClick={() => router.push('/stories')}>
              View Highlights
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Error state - chat error
  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.unavailableCard}>
          <div className={styles.unavailableIcon}>⚠️</div>
          <h2>We hit a snag</h2>
          <p>{error}</p>
          <div className={styles.unavailableTips}>
            <div>
              <span>🔁</span>
              <p>Try reloading the page – most issues resolve themselves.</p>
            </div>
            <div>
              <span>📮</span>
              <p>If it continues, let the GhostMate team know with a quick note.</p>
            </div>
          </div>
          <div className={styles.unavailableActions}>
            <button className={styles.primaryAction} onClick={() => router.push('/')}>
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  // No daily ID
  if (!dailyId) {
    return (
      <div className={styles.container}>
        <div className={styles.unavailableCard}>
          <div className={styles.unavailableIcon}>🔄</div>
          <h2>We couldn’t load your Daily ID</h2>
          <p>Refresh the dashboard to grab a fresh anonymous ID, then try again.</p>
          <div className={styles.unavailableTips}>
            <div>
              <span>💡</span>
              <p>Daily IDs are unique to you—get a new one instantly from the dashboard.</p>
            </div>
          </div>
          <div className={styles.unavailableActions}>
            <button className={styles.primaryAction} onClick={() => router.push('/')}>
              Reload Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <button 
          className={`${styles.backButton} ${styles.headerBack}`}
          onClick={() => router.push('/')}
          aria-label="Back to dashboard"
        >
          ← Back
        </button>
        <div className={`${styles.chatInfo} ${styles.headerInfo}`}>
          <h2>{isSupportChat ? ADMIN_SUPPORT_DISPLAY_NAME : 'Anonymous Chat'}</h2>
          <div className={styles.subtitle}>
            <span className={styles.statusIndicator}></span>
            {isSupportChat ? 'Support Channel' : `ID: ${otherDailyId}`}
          </div>
        </div>
        <div className={`${styles.favoriteSection} ${styles.headerActions}`}>
          {!isSupportChat && (
            <FavoriteButton
              userId={user?.uid || null}
              userDailyId={dailyId}
              targetDailyId={otherDailyId}
            />
          )}
        </div>
      </header>

      {timeUntilReset && (
        <div className={styles.resetBar}>
          <span className={styles.resetLabel}>Resets in</span>
          <span className={styles.resetValue}>
            🕐 {String(timeUntilReset.hours).padStart(2, '0')}:
            {String(timeUntilReset.minutes).padStart(2, '0')}:
            {String(timeUntilReset.seconds).padStart(2, '0')}
          </span>
        </div>
      )}

      {/* Removed PurgeWarning - reset time now in header */}

      {/* Chat Window */}
      <ChatWindow 
        messages={messages}
        myDailyId={dailyId}
        otherDailyId={otherDailyId}
        userId={!isSupportChat ? (user?.uid || undefined) : undefined}
        otherUserId={!isSupportChat ? (otherUserId || undefined) : undefined}
        chatId={!isSupportChat ? (chatId || undefined) : undefined}
        highlightStatuses={!isSupportChat ? highlightStatuses : undefined}
        onToggleHighlight={!isSupportChat ? toggleHighlight : undefined}
      />

      {/* Chat Input */}
      <ChatInput 
        onSend={sendMessage}
        disabled={sending}
        placeholder={isSupportChat ? 'Ask GhostMate Support anything...' : 'Type a message...'}
      />
    </div>
  );
}

