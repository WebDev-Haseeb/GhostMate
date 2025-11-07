'use client';

import { useEffect, useState } from 'react';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import styles from './ActivitySummary.module.css';

interface ActivitySummaryProps {
  chatsUsed: number;
  chatsLimit: number;
  timeUntilReset?: string;
  userId?: string;
  dailyId?: string | null;
}

export default function ActivitySummary({ 
  chatsUsed, 
  chatsLimit, 
  timeUntilReset,
  userId,
  dailyId 
}: ActivitySummaryProps) {
  const [highlightsGiven, setHighlightsGiven] = useState<number>(0);
  const [activeConnections, setActiveConnections] = useState<number>(0);
  const [currentStreak, setCurrentStreak] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  const percentage = (chatsUsed / chatsLimit) * 100;
  const remaining = chatsLimit - chatsUsed;
  const isLimitReached = chatsUsed >= chatsLimit;

  // Fetch user stats
  useEffect(() => {
    if (!userId) return;

    const fetchStats = async () => {
      try {
        // Get highlights given today
        const highlightsRef = collection(db, 'highlights', userId, 'messages');
        const highlightsSnapshot = await getDocs(highlightsRef);
        setHighlightsGiven(highlightsSnapshot.size);

        // Get active connections (mutual favorites that haven't expired)
        const now = Timestamp.now();
        const connectionsRef = collection(db, 'connections');
        const connectionsQuery = query(
          connectionsRef,
          where('user1', '==', userId),
          where('expiresAt', '>', now)
        );
        const connectionsSnapshot = await getDocs(connectionsQuery);
        
        const connectionsQuery2 = query(
          connectionsRef,
          where('user2', '==', userId),
          where('expiresAt', '>', now)
        );
        const connectionsSnapshot2 = await getDocs(connectionsQuery2);
        
        setActiveConnections(connectionsSnapshot.size + connectionsSnapshot2.size);

        // Get user's current streak
        const usersRef = collection(db, 'users');
        const userQuery = query(usersRef, where('__name__', '==', userId));
        const userSnapshot = await getDocs(userQuery);
        
        if (!userSnapshot.empty) {
          const userData = userSnapshot.docs[0].data();
          setCurrentStreak(userData.currentStreak || 0);
        }
      } catch (error) {
        console.error('Error fetching activity stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [userId]);

  return (
    <div className={styles.card}>
      {/* Header */}
      <div className={styles.cardHeader}>
        <div className={styles.headerContent}>
          <h3 className={styles.title}>
            <span className={styles.titleIcon}>📊</span>
            Today's Activity
          </h3>
          <p className={styles.subtitle}>Your anonymous journey so far</p>
        </div>
        {timeUntilReset && (
          <div className={styles.resetBadge}>
            <span className={styles.badgeIcon}>⏰</span>
            <span className={styles.badgeText}>Resets in {timeUntilReset}</span>
          </div>
        )}
      </div>

      <div className={styles.cardBody}>
        {/* Main Stats Grid */}
        <div className={styles.statsGrid}>
          {/* Chats Used */}
          <div className={`${styles.statCard} ${styles.primary}`}>
            <div className={styles.statIcon}>💬</div>
            <div className={styles.statContent}>
              <div className={styles.statNumber}>
                {chatsUsed}<span className={styles.statTotal}>/{chatsLimit}</span>
              </div>
              <div className={styles.statLabel}>Chats Used</div>
            </div>
          </div>

          {/* Current Streak */}
          <div className={`${styles.statCard} ${styles.accent}`}>
            <div className={styles.statIcon}>🔥</div>
            <div className={styles.statContent}>
              <div className={styles.statNumber}>{loading ? '...' : currentStreak}</div>
              <div className={styles.statLabel}>Day Streak</div>
            </div>
          </div>

          {/* Highlights Given */}
          <div className={`${styles.statCard} ${styles.success}`}>
            <div className={styles.statIcon}>⭐</div>
            <div className={styles.statContent}>
              <div className={styles.statNumber}>{loading ? '...' : highlightsGiven}</div>
              <div className={styles.statLabel}>Highlights</div>
            </div>
          </div>

          {/* Active Connections */}
          <div className={`${styles.statCard} ${styles.info}`}>
            <div className={styles.statIcon}>🔗</div>
            <div className={styles.statContent}>
              <div className={styles.statNumber}>{loading ? '...' : activeConnections}</div>
              <div className={styles.statLabel}>Connections</div>
            </div>
          </div>
        </div>

        {/* Progress Bar Section */}
        <div className={styles.progressSection}>
          <div className={styles.progressHeader}>
            <span className={styles.progressLabel}>Chat Usage</span>
            <span className={styles.progressPercentage}>{Math.round(percentage)}%</span>
          </div>
          <div className={styles.progressBar}>
            <div 
              className={`${styles.progressFill} ${isLimitReached ? styles.limitReached : ''}`}
              style={{ width: `${Math.min(percentage, 100)}%` }}
            >
              <div className={styles.progressShine}></div>
            </div>
          </div>
        </div>

        {/* Status Message */}
        <div className={styles.statusMessage}>
          {isLimitReached ? (
            <div className={`${styles.message} ${styles.limitMessage}`}>
              <span className={styles.messageIcon}>🌙</span>
              <div className={styles.messageContent}>
                <strong>Daily limit reached!</strong>
                <span>New chats unlock in {timeUntilReset}</span>
              </div>
            </div>
          ) : remaining <= 2 ? (
            <div className={`${styles.message} ${styles.warningMessage}`}>
              <span className={styles.messageIcon}>⚠️</span>
              <div className={styles.messageContent}>
                <strong>Running low!</strong>
                <span>Only {remaining} chat{remaining === 1 ? '' : 's'} remaining today</span>
              </div>
            </div>
          ) : (
            <div className={`${styles.message} ${styles.normalMessage}`}>
              <span className={styles.messageIcon}>✨</span>
              <div className={styles.messageContent}>
                <strong>All systems go!</strong>
                <span>{remaining} chats available for new connections</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
