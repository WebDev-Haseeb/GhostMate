'use client';

import { useState } from 'react';
import { formatDailyId } from '@/lib/dailyId';
import styles from './DailyIdCard.module.css';

interface DailyIdCardProps {
  dailyId: string | null;
  loading?: boolean;
  error?: string | null;
}

export default function DailyIdCard({ dailyId, loading, error }: DailyIdCardProps) {
  const [copied, setCopied] = useState(false);
  const [shared, setShared] = useState(false);

  const handleCopy = async () => {
    if (!dailyId) return;
    
    try {
      await navigator.clipboard.writeText(dailyId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleShare = async () => {
    if (!dailyId) return;

    // Curated share message with ID and URL
    const shareText = `🌟 Let's chat anonymously on GhostMate!

My Daily ID: ${formatDailyId(dailyId)}

Connect with me at:
https://ghostmate.online/chat/${dailyId}

🔒 Anonymous • 💬 Ephemeral • 🌙 Resets daily`;

    // Check if Web Share API is available
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'GhostMate - Connect Anonymously',
          text: shareText
        });
        setShared(true);
        setTimeout(() => setShared(false), 2000);
      } catch (err) {
        // User cancelled or error occurred
        console.error('Share failed:', err);
      }
    } else {
      // Fallback: Copy to clipboard
      try {
        await navigator.clipboard.writeText(shareText);
        setShared(true);
        setTimeout(() => setShared(false), 2000);
      } catch (err) {
        console.error('Failed to copy:', err);
      }
    }
  };

  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <div className={styles.headerContent}>
          <h2 className={styles.title}>Your Daily ID</h2>
          <p className={styles.subtitle}>Anonymous identity for today</p>
        </div>
        
        <div className={styles.badge}>
          <span className={styles.badgeIcon}>🌙</span>
          <span className={styles.badgeText}>Resets at Midnight</span>
        </div>
      </div>

      <div className={styles.cardBody}>
        {error ? (
          <div className={styles.error}>
            <span className={styles.errorIcon}>⚠️</span>
            <div className={styles.errorContent}>
              <p className={styles.errorTitle}>Failed to load ID</p>
              <p className={styles.errorMessage}>{error}</p>
            </div>
          </div>
        ) : loading ? (
          <div className={styles.loading}>
            <div className={styles.loadingSpinner}>
              <img src="/favicon.svg" alt="GhostMate" style={{ width: '1.5rem', height: '1.5rem' }} />
            </div>
            <p className={styles.loadingText}>Generating your ID...</p>
          </div>
        ) : dailyId ? (
          <>
            <div className={styles.idDisplay}>
              <div className={styles.idValue}>
                {formatDailyId(dailyId)}
              </div>
            </div>

            <div className={styles.actions}>
              <button
                onClick={handleCopy}
                className={`${styles.actionButton} ${copied ? styles.success : ''}`}
                disabled={copied}
                aria-label="Copy Daily ID"
              >
                <span className={`${styles.buttonIcon} ${copied ? styles.iconSuccess : ''}`}>
                  {copied ? '✅' : '📋'}
                </span>
                <div className={styles.buttonTextGroup}>
                  <span className={styles.buttonPrimaryText}>{copied ? 'ID Copied' : 'Copy ID'}</span>
                  <span className={styles.buttonSecondaryText}>{copied ? 'Ready to share' : 'Instant copy to clipboard'}</span>
                </div>
              </button>

              <button
                onClick={handleShare}
                className={`${styles.actionButton} ${shared ? styles.success : ''}`}
                disabled={shared}
                aria-label="Share Daily ID"
              >
                <span className={`${styles.buttonIcon} ${shared ? styles.iconSuccess : ''}`}>
                  {shared ? '✅' : '🔗'}
                </span>
                <div className={styles.buttonTextGroup}>
                  <span className={styles.buttonPrimaryText}>{shared ? 'Shared!' : 'Share Link'}</span>
                  <span className={styles.buttonSecondaryText}>{shared ? 'Sent to your friend' : 'Send invite or copy template'}</span>
                </div>
              </button>
            </div>
          </>
        ) : (
          <div className={styles.placeholder}>
            <div className={styles.idValue}>---- ----</div>
            <p className={styles.placeholderText}>Waiting for ID...</p>
          </div>
        )}
      </div>

      <div className={styles.cardFooter}>
        <p className={styles.footerText}>
          <span className={styles.footerIcon}>🔒</span>
          Resets at midnight PKT • Completely anonymous
        </p>
      </div>
    </div>
  );
}

