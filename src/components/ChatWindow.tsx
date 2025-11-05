'use client';

import { useEffect, useRef } from 'react';
import { Message } from '@/types/chat';
import { formatMessageTime } from '@/lib/chatUtils';
import styles from './ChatWindow.module.css';

interface ChatWindowProps {
  messages: Message[];
  myDailyId: string;
  otherDailyId: string;
}

export default function ChatWindow({ messages, myDailyId, otherDailyId }: ChatWindowProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
          const showTimestamp = 
            index === 0 || 
            (messages[index - 1].timestamp - message.timestamp) > 60000; // 1 min gap

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
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}

