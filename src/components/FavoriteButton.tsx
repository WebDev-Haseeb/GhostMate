'use client';

import { useFavorite } from '@/hooks/useFavorite';
import styles from './FavoriteButton.module.css';

interface FavoriteButtonProps {
  userId: string | null;
  userDailyId: string | null;
  targetDailyId: string;
}

export default function FavoriteButton({ 
  userId, 
  userDailyId, 
  targetDailyId
}: FavoriteButtonProps) {
  const {
    isFavorited,
    hasMutual,
    isLocked,
    loading,
    toggling,
    error,
    toggleFavorite,
    lockExpiresAt,
    streakCount
  } = useFavorite({ userId, userDailyId, targetDailyId });

  const handleClick = async () => {
    // Don't allow action if locked
    if (isLocked) {
      return; // Button should be disabled, but just in case
    }
    
    await toggleFavorite();
    // Real-time updates will handle UI changes automatically
  };

  // Format lock expiry time
  const getLockTimeRemaining = () => {
    if (!lockExpiresAt) return '';
    
    const now = Date.now();
    const remaining = lockExpiresAt - now;
    
    if (remaining <= 0) return '';
    
    const hours = Math.floor(remaining / (1000 * 60 * 60));
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}h ${minutes}m`;
  };

  if (loading) {
    return (
      <button className={styles.favoriteButton} disabled>
        <span className={styles.icon}>⏳</span>
      </button>
    );
  }

  return (
    <div className={styles.container}>
      <button
        onClick={handleClick}
        disabled={toggling || isLocked}
        className={`${styles.favoriteButton} ${
          isFavorited ? styles.favorited : ''
        } ${hasMutual ? styles.mutual : ''} ${
          isLocked ? styles.locked : ''
        }`}
        title={
          isLocked
            ? `🔒 Locked until midnight (${getLockTimeRemaining()} remaining)`
            : isFavorited
            ? 'Unfavorite this user'
            : 'Add to favorites'
        }
      >
        {toggling ? (
          <span className={styles.icon}>⏳</span>
        ) : hasMutual ? (
          <span className={styles.icon}>🔗</span>
        ) : isFavorited ? (
          <span className={styles.icon}>⭐</span>
        ) : (
          <span className={styles.icon}>☆</span>
        )}
        
        {hasMutual && (
          <div className={styles.connectionInfo}>
            <span className={styles.label}>Connected</span>
            {streakCount > 0 && (
              <span className={styles.streak} title={`${streakCount}-day connection streak`}>
                🔥 {streakCount}
              </span>
            )}
          </div>
        )}
        {isLocked && (
          <span className={styles.lockLabel}>🔒 Until midnight</span>
        )}
      </button>

      {error && !isLocked && <div className={styles.error}>{error}</div>}
    </div>
  );
}

