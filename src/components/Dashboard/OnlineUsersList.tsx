'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { collection, doc, setDoc, deleteDoc, Timestamp, onSnapshot, serverTimestamp } from 'firebase/firestore';
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
  const [connectingTo, setConnectingTo] = useState<string | null>(null);
  const [randomConnecting, setRandomConnecting] = useState(false);

  const presenceDataRef = useRef<any[]>([]);
  const dailyDataRef = useRef<any[]>([]);
  const readinessRef = useRef<{ presence: boolean; daily: boolean }>({ presence: false, daily: false });

  const computeOnlineUsers = useCallback(() => {
    if (!currentUserId || !currentDailyId) {
      setOnlineUsers([]);
      setLoading(false);
      return;
    }

    const { presence, daily } = readinessRef.current;
    if (!presence || !daily) {
      return;
    }

    const now = Date.now();
    const STALE_THRESHOLD = 180000; // 3 minutes to tolerate background tab throttling

    const onlineUserIds = new Set<string>();
    presenceDataRef.current.forEach((entry: any) => {
      const userId = entry.userId;
      const lastSeenValue = entry.lastSeen?.toMillis
        ? entry.lastSeen.toMillis()
        : typeof entry.lastSeen === 'number'
          ? entry.lastSeen
          : entry.lastSeen?.toDate
            ? entry.lastSeen.toDate().getTime()
            : 0;

      if (
        userId &&
        userId !== currentUserId &&
        now - lastSeenValue < STALE_THRESHOLD
      ) {
        onlineUserIds.add(userId);
      }
    });

    const users: OnlineUser[] = dailyDataRef.current
      .map((entry: any) => {
        const expiresAt = entry.expiresAt;
        let expiresAtMillis = 0;
        if (expiresAt instanceof Timestamp) {
          expiresAtMillis = expiresAt.toMillis();
        } else if (typeof expiresAt === 'number') {
          expiresAtMillis = expiresAt;
        } else if (expiresAt?.toDate) {
          expiresAtMillis = expiresAt.toDate().getTime();
        }

        return {
          userId: entry.userId,
          dailyId: entry.dailyId,
          createdAt: entry.createdAt?.toMillis?.() ?? entry.createdAt ?? Date.now(),
          expiresAtMillis
        };
      })
      .filter((entry) => {
        return (
          entry.userId &&
          entry.userId !== currentUserId &&
          entry.expiresAtMillis > now &&
          onlineUserIds.has(entry.userId)
        );
      })
      .map((entry) => ({
        userId: entry.userId,
        dailyId: entry.dailyId,
        createdAt: entry.createdAt,
        isActive: true
      }));

    users.sort((a, b) => b.createdAt - a.createdAt);

    setOnlineUsers(users);
    setLoading(false);
  }, [currentUserId, currentDailyId]);

  // Mark user as online with heartbeat
  useEffect(() => {
    if (!currentUserId) return;

    const presenceRef = doc(db, 'presence', currentUserId);
    let heartbeatInterval: NodeJS.Timeout;

    // Mark as online with timestamp
    const markOnline = async () => {
      try {
        await setDoc(
          presenceRef,
          {
            userId: currentUserId,
            isOnline: true,
            lastSeen: serverTimestamp(),
            updatedAt: serverTimestamp()
          },
          { merge: true }
        );
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

  // Real-time listeners for presence and active IDs
  useEffect(() => {
    if (!currentUserId || !currentDailyId) return;

    setLoading(true);
    presenceDataRef.current = [];
    dailyDataRef.current = [];
    readinessRef.current = { presence: false, daily: false };

    const presenceRef = collection(db, 'presence');
    const dailyIdsRef = collection(db, 'dailyIds');

    const presenceUnsub = onSnapshot(
      presenceRef,
      (snapshot) => {
        presenceDataRef.current = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data()
        }));
        readinessRef.current.presence = true;
        computeOnlineUsers();
      },
      (error) => {
        console.error('Error listening to presence:', error);
        readinessRef.current.presence = false;
        setOnlineUsers([]);
        setLoading(false);
      }
    );

    const dailyUnsub = onSnapshot(
      dailyIdsRef,
      (snapshot) => {
        dailyDataRef.current = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data()
        }));
        readinessRef.current.daily = true;
        computeOnlineUsers();
      },
      (error) => {
        console.error('Error listening to daily IDs:', error);
        readinessRef.current.daily = false;
        setOnlineUsers([]);
        setLoading(false);
      }
    );

    return () => {
      presenceUnsub();
      dailyUnsub();
      readinessRef.current = { presence: false, daily: false };
      presenceDataRef.current = [];
      dailyDataRef.current = [];
    };
  }, [currentUserId, currentDailyId, computeOnlineUsers]);

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
