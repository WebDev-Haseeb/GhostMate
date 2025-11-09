'use client';

import { useState, FormEvent, KeyboardEvent, useRef, useEffect } from 'react';
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
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const refocusTextarea = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.focus();
      const length = textarea.value.length;
      textarea.setSelectionRange(length, length);
    }
  };

  const scheduleRefocus = () => {
    requestAnimationFrame(refocusTextarea);
  };

  useEffect(() => {
    scheduleRefocus();
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    const trimmedText = text.trim();
    if (!trimmedText || disabled) return;

    const previousText = trimmedText;

    try {
      setText('');
      scheduleRefocus();
      await onSend(trimmedText);
    } catch (error) {
      console.error('Failed to send message:', error);
      setText(previousText);
    } finally {
      scheduleRefocus();
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };

  const isValid = text.trim().length > 0 && text.trim().length <= 1000;

  const handleContainerClick = (e: React.MouseEvent<HTMLFormElement>) => {
    if ((e.target as HTMLElement).closest('button')) return;
    refocusTextarea();
  };

  return (
    <form className={styles.chatInput} onSubmit={handleSubmit} onClick={handleContainerClick}>
      <div className={styles.inputWrapper}>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className={styles.textarea}
          rows={1}
          maxLength={1000}
          ref={textareaRef}
          autoFocus
        />
        <div className={styles.charCount}>
          {text.length}/1000
        </div>
      </div>
      <button
        type="submit"
        disabled={!isValid || disabled}
        className={styles.sendButton}
        aria-label="Send message"
      >
        <span>➤</span>
      </button>
    </form>
  );
}

