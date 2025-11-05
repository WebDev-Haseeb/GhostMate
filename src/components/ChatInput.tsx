'use client';

import { useState, FormEvent, KeyboardEvent } from 'react';
import styles from './ChatInput.module.css';

interface ChatInputProps {
  onSend: (text: string) => Promise<void>;
  disabled?: boolean;
  placeholder?: string;
}

export default function ChatInput({ 
  onSend, 
  disabled = false,
  placeholder = "Type a message..." 
}: ChatInputProps) {
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    const trimmedText = text.trim();
    if (!trimmedText || sending || disabled) return;

    try {
      setSending(true);
      await onSend(trimmedText);
      setText('');
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };

  const isValid = text.trim().length > 0 && text.trim().length <= 1000;

  return (
    <form className={styles.chatInput} onSubmit={handleSubmit}>
      <div className={styles.inputWrapper}>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled || sending}
          className={styles.textarea}
          rows={1}
          maxLength={1000}
        />
        <div className={styles.charCount}>
          {text.length}/1000
        </div>
      </div>
      <button
        type="submit"
        disabled={!isValid || disabled || sending}
        className={styles.sendButton}
        aria-label="Send message"
      >
        {sending ? (
          <span className={styles.spinner}>⏳</span>
        ) : (
          <span>📤</span>
        )}
      </button>
    </form>
  );
}

