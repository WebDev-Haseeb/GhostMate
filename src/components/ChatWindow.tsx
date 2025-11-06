'use client';

import { useEffect, useRef } from 'react';
import { Message } from '@/types/chat';
import { formatMessageTime } from '@/lib/chatUtils';
import HighlightButton from './HighlightButton';
import type { MessageHighlightStatus } from '@/types/highlights';
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

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className={styles.emptyState}>
        <div className={styles.ghostIcon}>👻</div>
        <p>No messages yet</p>
        <span>Start the conversation!</span>
      </div>
    );
  }

  return (
    <div className={styles.chatWindow}>
      <div className={styles.messagesContainer}>
        {messages.map((message, index) => {
          const isMyMessage = message.senderId === myDailyId;
          const isSystem = message.isSystemMessage;
          const showTimestamp = 
            index === 0 || 
            (messages[index - 1].timestamp - message.timestamp) > 60000; // 1 min gap

          if (isSystem) {
            return (
              <div key={message.id} className={styles.systemMessageWrapper}>
                <div className={styles.systemBubble}>
                  <p>{message.text}</p>
                </div>
                {showTimestamp && (
                  <div className={styles.systemTimestamp}>
                    {formatMessageTime(message.timestamp)}
                  </div>
                )}
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
            >
              {showTimestamp && (
                <div className={styles.timestamp}>
                  {formatMessageTime(message.timestamp)}
                </div>
              )}
              <div className={styles.bubble}>
                <p>{message.text}</p>
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
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}

