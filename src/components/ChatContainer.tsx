'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useDailyId } from '@/hooks/useDailyId';
import { useChat } from '@/hooks/useChat';
import { useHighlights } from '@/hooks/useHighlights';
import { getUserIdFromDailyId } from '@/lib/dailyIdService';
import { generateChatId } from '@/lib/chatUtils';
import ChatWindow from './ChatWindow';
import ChatInput from './ChatInput';
import PurgeWarning from './PurgeWarning';
import FavoriteButton from './FavoriteButton';
import styles from './ChatContainer.module.css';

interface ChatContainerProps {
  otherDailyId: string;
}

export default function ChatContainer({ otherDailyId }: ChatContainerProps) {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { dailyId, loading: idLoading } = useDailyId(user?.uid || null);
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
  
  // Debug: Log highlight setup
  useEffect(() => {
    console.log('🎯 Highlight Setup:', {
      userId: user?.uid,
      otherUserId,
      chatId,
      myDailyId: dailyId,
      otherDailyId,
      highlightingEnabled: Boolean(user?.uid && otherUserId && chatId),
      messageCount: messages.length
    });
  }, [user?.uid, otherUserId, chatId, dailyId, otherDailyId, messages.length]);
  
  // Fetch other user's Firebase UID
  useEffect(() => {
    if (!otherDailyId) {
      setOtherUserIdLoading(false);
      return;
    }
    
    setOtherUserIdLoading(true);
    setOtherUserIdError(null);
    
    console.log('🔍 Fetching Firebase UID for daily ID:', otherDailyId);
    
    getUserIdFromDailyId(otherDailyId).then((uid) => {
      if (uid) {
        console.log('✅ Found Firebase UID:', uid, 'for daily ID:', otherDailyId);
        setOtherUserId(uid);
        setOtherUserIdError(null);
      } else {
        console.warn('⚠️ No Firebase UID found for daily ID:', otherDailyId);
        setOtherUserIdError('This Daily ID does not exist or has expired.');
      }
      setOtherUserIdLoading(false);
    }).catch((err) => {
      console.error('❌ Error fetching other user ID:', err);
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

  // Loading state
  if (authLoading || idLoading || chatLoading || otherUserIdLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <div className={styles.spinner}>👻</div>
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
      <div className={styles.header}>
        <button 
          className={styles.backButton}
          onClick={() => router.push('/')}
          aria-label="Go back"
        >
          ← Back
        </button>
        <div className={styles.chatInfo}>
          <h2>Chat with {otherDailyId}</h2>
          <span className={styles.subtitle}>One-to-one conversation</span>
        </div>
            <div className={styles.favoriteSection}>
              <FavoriteButton
                userId={user?.uid || null}
                userDailyId={dailyId}
                targetDailyId={otherDailyId}
              />
            </div>
      </div>

      {/* Purge Warning */}
      <div className={styles.warningContainer}>
        <PurgeWarning />
      </div>

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

