'use client';

import { useEffect, useRef } from 'react';
import { Message } from '@/types/chat';
import type { MessageHighlightStatus } from '@/types/highlights';
import HighlightButton from './HighlightButton';
import styles from './ChatWindow.module.css';

interface ChatWindowProps {
  messages: Message[];
  myDailyId: string;
  otherDailyId: string;
  userId?: string;              // Firebase UID for highlight feature
  otherUserId?: string;         // Firebase UID of other user
  chatId?: string;              // Chat ID for highlights
  highlightStatuses?: Map<string, MessageHighlightStatus>;  // Highlight status per message
  onToggleHighlight?: (messageId: string, message: Message) => Promise<void>;  // Highlight toggle handler
}

export default function ChatWindow({ 
  messages, 
  myDailyId, 
  otherDailyId,
  userId,
  otherUserId,
  chatId,
  highlightStatuses,
  onToggleHighlight
}: ChatWindowProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Check if highlighting is enabled
  const highlightingEnabled = Boolean(userId && otherUserId && chatId && onToggleHighlight);

  const getRelativeTime = (timestamp: number) => {
    const now = Date.now();
    const diff = Math.max(0, now - timestamp);

    const minutes = Math.floor(diff / (1000 * 60));
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;

    const days = Math.floor(hours / 24);
    if (days < 7) return `${days} day${days === 1 ? '' : 's'} ago`;

    const weeks = Math.floor(days / 7);
    if (weeks < 4) return `${weeks} week${weeks === 1 ? '' : 's'} ago`;

    const months = Math.floor(days / 30);
    if (months < 12) return `${months} month${months === 1 ? '' : 's'} ago`;

    const years = Math.floor(days / 365);
    return `${years} year${years === 1 ? '' : 's'} ago`;
  };

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className={styles.emptyState}>
        <div className={styles.ghostIcon}>
          <img src="/favicon.svg" alt="No messages" />
        </div>
        <p>No messages yet</p>
        <span>Start the conversation!</span>
      </div>
    );
  }

  return (
    <div className={styles.chatWindow}>
      <div className={styles.messagesContainer}>
        {messages.map((message) => {
          const isMyMessage = message.senderId === myDailyId;
          const isSystem = message.isSystemMessage;

          if (isSystem) {
            return (
              <div key={message.id} className={styles.systemMessageWrapper}>
                <div className={styles.systemBubble}>
                  <p>{message.text}</p>
                </div>
              </div>
            );
          }

          // Get highlight status for this message
          const highlightStatus = highlightStatuses?.get(message.id) || {
            messageId: message.id,
            highlightedByMe: false,
            highlightedByOther: false,
            isMutual: false,
            queuedForStory: false,
            isLocked: false,
            lockExpiresAt: undefined
          };

          return (
            <div
              key={message.id}
              className={`${styles.messageWrapper} ${isMyMessage ? styles.myMessage : styles.theirMessage}`}
              title={getRelativeTime(message.timestamp)}
            >
              <div className={styles.timestamp}>
                {getRelativeTime(message.timestamp)}
              </div>
              <div className={styles.bubble}>
                <p>{message.text}</p>
              </div>
              {highlightingEnabled && (
                <div className={styles.highlightButtonContainer}>
                  <HighlightButton
                    messageId={message.id}
                    status={highlightStatus}
                    onToggle={() => onToggleHighlight!(message.id, message)}
                  />
                </div>
              )}
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}

