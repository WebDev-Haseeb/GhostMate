'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useDailyId } from '@/hooks/useDailyId';
import { useChat } from '@/hooks/useChat';
import ChatWindow from './ChatWindow';
import ChatInput from './ChatInput';
import PurgeWarning from './PurgeWarning';
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

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  // Loading state
  if (authLoading || idLoading || chatLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <div className={styles.spinner}>👻</div>
          <p>Loading chat...</p>
        </div>
      </div>
    );
  }

  // Error state
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

