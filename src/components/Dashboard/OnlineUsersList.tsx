'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { collection, query, where, getDocs, doc, setDoc, deleteDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { formatDailyId } from '@/lib/dailyId';
import { getChat } from '@/lib/chatService';
import { generateChatId } from '@/lib/chatUtils';
import { getRandomActiveDailyId } from '@/lib/randomConnect';
import styles from './OnlineUsersList.module.css';

interface OnlineUser {
  userId: string;
  dailyId: string;
  createdAt: number;
  isActive: boolean;
}

interface OnlineUsersListProps {
  currentUserId: string | null;
  currentDailyId: string | null;
  chatLimit: {
    count: number;
    limit: number;
    remaining: number;
    isLimitReached: boolean;
    recordChatInitiation: () => Promise<{ success: boolean; message?: string }>;
  };
}

export default function OnlineUsersList({ currentUserId, currentDailyId, chatLimit }: OnlineUsersListProps) {
  const router = useRouter();
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [connectingTo, setConnectingTo] = useState<string | null>(null);
  const [randomConnecting, setRandomConnecting] = useState(false);

  // Mark user as online with heartbeat
  useEffect(() => {
    if (!currentUserId) return;

    const presenceRef = doc(db, 'presence', currentUserId);
    let heartbeatInterval: NodeJS.Timeout;

    // Mark as online with timestamp
    const markOnline = async () => {
      try {
        await setDoc(presenceRef, {
          userId: currentUserId,
          isOnline: true,
          lastSeen: Timestamp.now(),
          updatedAt: Timestamp.now()
        });
      } catch (error) {
        console.error('Error marking user online:', error);
      }
    };

    // Mark as offline
    const markOffline = async () => {
      try {
        await deleteDoc(presenceRef);
      } catch (error) {
        console.error('Error marking user offline:', error);
      }
    };

    // Initial mark online
    markOnline();

    // Heartbeat every 15 seconds to stay online
    heartbeatInterval = setInterval(markOnline, 15000);

    // Clean up handlers
    const handleBeforeUnload = () => {
      // Use sendBeacon for reliability on page unload
      markOffline();
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        markOffline();
      } else {
        markOnline();
        // Restart heartbeat if tab becomes visible again
        clearInterval(heartbeatInterval);
        heartbeatInterval = setInterval(markOnline, 15000);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(heartbeatInterval);
      markOffline();
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [currentUserId]);

  // Fetch online users with stale presence filtering
  const fetchOnlineUsers = async () => {
    if (!currentUserId || !currentDailyId) return;

    try {
      setRefreshing(true);
      
      // Get all presence records
      const presenceRef = collection(db, 'presence');
      const presenceQuery = query(presenceRef, where('isOnline', '==', true));
      const presenceSnapshot = await getDocs(presenceQuery);
      
      // Filter out stale presence (not updated in last 30 seconds)
      const now = Date.now();
      const STALE_THRESHOLD = 30000; // 30 seconds
      const onlineUserIds = new Set<string>();
      
      presenceSnapshot.forEach((doc) => {
        const data = doc.data();
        const lastSeen = data.lastSeen?.toMillis() || 0;
        const isRecent = (now - lastSeen) < STALE_THRESHOLD;
        
        // Only include if recent and not current user
        if (isRecent && data.userId !== currentUserId) {
          onlineUserIds.add(data.userId);
        }
      });

      // Get daily IDs for truly online users
      const nowTimestamp = Timestamp.now();
      const dailyIdsRef = collection(db, 'dailyIds');
      const q = query(dailyIdsRef, where('expiresAt', '>', nowTimestamp));
      const snapshot = await getDocs(q);
      
      const users: OnlineUser[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        // Only include users who are genuinely online with valid IDs
        if (onlineUserIds.has(data.userId) && data.userId !== currentUserId) {
          users.push({
            userId: data.userId,
            dailyId: data.dailyId,
            createdAt: data.createdAt?.toMillis() || Date.now(),
            isActive: true
          });
        }
      });

      // Sort by most recent
      users.sort((a, b) => b.createdAt - a.createdAt);

      setOnlineUsers(users);
    } catch (error) {
      console.error('Error fetching online users:', error);
      setOnlineUsers([]); // Clear on error
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOnlineUsers();
  }, [currentUserId, currentDailyId]);

  const handleConnect = async (targetDailyId: string) => {
    if (!currentDailyId || chatLimit.isLimitReached) return;

    setConnectingTo(targetDailyId);

    try {
      // Check if chat already exists
      const chatId = generateChatId(currentDailyId, targetDailyId);
      const existingChat = await getChat(chatId);

      if (existingChat) {
        router.push(`/chat/${targetDailyId}`);
      } else {
        const result = await chatLimit.recordChatInitiation();
        if (result.success) {
          router.push(`/chat/${targetDailyId}`);
        } else {
          alert(result.message || 'Failed to start chat');
          setConnectingTo(null);
        }
      }
    } catch (error) {
      console.error('Error connecting to user:', error);
      alert('Failed to connect. Please try again.');
      setConnectingTo(null);
    }
  };

  const handleRandomConnect = async () => {
    if (!currentUserId || !currentDailyId || chatLimit.isLimitReached) return;

    setRandomConnecting(true);

    try {
      const result = await getRandomActiveDailyId(currentUserId, currentDailyId);

      if (result.success && result.dailyId) {
        const chatId = generateChatId(currentDailyId, result.dailyId);
        const existingChat = await getChat(chatId);

        if (existingChat) {
          router.push(`/chat/${result.dailyId}`);
        } else {
          const limitResult = await chatLimit.recordChatInitiation();
          if (limitResult.success) {
            router.push(`/chat/${result.dailyId}`);
          } else {
            alert(limitResult.message || 'Failed to connect');
            setRandomConnecting(false);
          }
        }
      } else {
        alert(result.error || 'No users available');
        setRandomConnecting(false);
      }
    } catch (error) {
      console.error('Error with random connect:', error);
      alert('Failed to connect. Please try again.');
      setRandomConnecting(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <h2 className={styles.title}>Online Users</h2>
          <p className={styles.subtitle}>Click to chat instantly</p>
        </div>
        <div className={styles.headerActions}>
          <button
            onClick={handleRandomConnect}
            disabled={chatLimit.isLimitReached || randomConnecting || loading}
            className={`${styles.randomButton} ${randomConnecting ? styles.connecting : ''}`}
            title="Random Connect"
          >
            <span className={styles.buttonIcon}>{randomConnecting ? '⏳' : '🎲'}</span>
          </button>
          <button
            onClick={fetchOnlineUsers}
            disabled={refreshing}
            className={`${styles.refreshButton} ${refreshing ? styles.refreshing : ''}`}
            title="Refresh"
          >
            <span className={styles.buttonIcon}>🔄</span>
          </button>
          <div className={styles.badge}>
            {loading ? '⏳' : `${onlineUsers.length}`}
          </div>
        </div>
      </div>

      {chatLimit.isLimitReached && (
        <div className={styles.limitWarning}>
          <span className={styles.warningIcon}>⏰</span>
          <p className={styles.warningText}>
            Daily chat limit reached! New chats unlock at midnight PKT.
          </p>
        </div>
      )}

      <div className={styles.scrollContainer}>
        {loading ? (
          <div className={styles.loadingState}>
            <div className={styles.spinner}>
              <img src="/favicon.svg" alt="Loading" style={{ width: '2rem', height: '2rem' }} />
            </div>
            <p>Finding online users...</p>
          </div>
        ) : onlineUsers.length === 0 ? (
          <div className={styles.emptyState}>
            <span className={styles.emptyIcon}>😔</span>
            <p className={styles.emptyTitle}>No users online</p>
            <p className={styles.emptySubtitle}>Share your ID to invite friends!</p>
          </div>
        ) : (
          <div className={styles.userGrid}>
            {onlineUsers.map((user) => (
              <button
                key={user.dailyId}
                onClick={() => handleConnect(user.dailyId)}
                disabled={chatLimit.isLimitReached || connectingTo === user.dailyId}
                className={`${styles.userCard} ${connectingTo === user.dailyId ? styles.connecting : ''}`}
              >
                <div className={styles.userIcon}>
                  <img src="/favicon.svg" alt="" style={{ width: '2.5rem', height: '2.5rem', opacity: 0.5 }} />
                </div>
                <div className={styles.userId}>
                  {formatDailyId(user.dailyId)}
                </div>
                <div className={styles.userStatus}>
                  {connectingTo === user.dailyId ? (
                    <>
                      <span className={styles.connectingDot}>⏳</span>
                      <span>Connecting...</span>
                    </>
                  ) : (
                    <>
                      <span className={styles.onlineDot}></span>
                      <span>Online</span>
                    </>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
