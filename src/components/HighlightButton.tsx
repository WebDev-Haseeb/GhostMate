'use client';

import { useState } from 'react';
import type { MessageHighlightStatus } from '@/types/highlights';
import styles from './HighlightButton.module.css';

interface HighlightButtonProps {
  messageId: string;
  status: MessageHighlightStatus;
  onToggle: () => Promise<void>;
  disabled?: boolean;
}

export default function HighlightButton({
  messageId,
  status,
  onToggle,
  disabled = false
}: HighlightButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    if (loading || disabled) return;

    setLoading(true);
    try {
      await onToggle();
    } catch (error) {
      console.error('Error toggling highlight:', error);
    } finally {
      setLoading(false);
    }
  };

  // Determine button state and icon
  const getButtonState = () => {
    if (status.isMutual) {
      const lockMessage = status.isLocked 
        ? ' 🔒 Locked until midnight (both highlighted)' 
        : '';
      return {
        icon: '💫',
        label: 'Mutual Highlight',
        className: styles.mutual,
        title: `Both of you highlighted this message!${lockMessage}`
      };
    } else if (status.highlightedByMe && status.highlightedByOther) {
      // Both highlighted but not yet mutual (shouldn't happen, but handle it)
      return {
        icon: '💫',
        label: 'Mutual Highlight',
        className: styles.mutual,
        title: 'Both of you highlighted this message!'
      };
    } else if (status.highlightedByMe) {
      return {
        icon: '⭐',
        label: 'You Highlighted',
        className: styles.highlighted,
        title: 'You highlighted this. Click to remove.'
      };
    } else if (status.highlightedByOther) {
      return {
        icon: '✨',
        label: 'Other Highlighted',
        className: styles.otherHighlighted,
        title: 'The other person highlighted this! Highlight it too to make it mutual.'
      };
    } else {
      return {
        icon: '☆',
        label: 'Highlight',
        className: styles.notHighlighted,
        title: 'Highlight this message'
      };
    }
  };

  const buttonState = getButtonState();
  const isLocked = status.isLocked;

  return (
    <button
      onClick={handleClick}
      disabled={disabled || loading || (isLocked && status.highlightedByMe)}
      className={`${styles.highlightButton} ${buttonState.className} ${
        loading ? styles.loading : ''
      } ${disabled ? styles.disabled : ''} ${
        isLocked ? styles.locked : ''
      }`}
      title={buttonState.title}
      aria-label={buttonState.label}
    >
      <span className={styles.icon}>{buttonState.icon}</span>
      {isLocked && <span className={styles.lockIcon}>🔒</span>}
    </button>
  );
}

