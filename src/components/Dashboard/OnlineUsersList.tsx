'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { collection, Timestamp, onSnapshot } from 'firebase/firestore';
import { db, database } from '@/lib/firebase';
import { formatDailyId } from '@/lib/dailyId';
import { getChat } from '@/lib/chatService';
import { generateChatId, getOtherParticipantId } from '@/lib/chatUtils';
import { getRandomActiveDailyId } from '@/lib/randomConnect';
import styles from './OnlineUsersList.module.css';
import { useNotifications } from '@/components/ui/NotificationProvider';
import {
  ADMIN_SUPPORT_DAILY_ID,
  ADMIN_SUPPORT_DISPLAY_NAME,
  ADMIN_SUPPORT_USER_ID,
  isAdminSupportDailyId,
} from '@/config/adminSupport';
import { ref as realtimeRef, onValue } from 'firebase/database';

interface OnlineUser {
  userId: string;
  dailyId: string;
  createdAt: number;
  isActive: boolean;
  isSupportAgent?: boolean;
  displayName?: string;
  unreadCount?: number;
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
  const { notify } = useNotifications();
  const unreadCountsRef = useRef<Record<string, number>>({});
  const unreadInitialLoadRef = useRef(true);

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

    const dailyLookup = new Map<
      string,
      { dailyId: string; expiresAtMillis: number; createdAt: number }
    >();

    dailyDataRef.current.forEach((entry: any) => {
      const expiresAt = entry.expiresAt;
      let expiresAtMillis = 0;
      if (expiresAt instanceof Timestamp) {
        expiresAtMillis = expiresAt.toMillis();
      } else if (typeof expiresAt === 'number') {
        expiresAtMillis = expiresAt;
      } else if (expiresAt?.toDate) {
        expiresAtMillis = expiresAt.toDate().getTime();
      }

      const dailyIdFromDoc = entry.dailyId || entry.id;
      if (!entry.userId || !dailyIdFromDoc) {
        return;
      }

      dailyLookup.set(entry.userId, {
        dailyId: dailyIdFromDoc,
        expiresAtMillis,
        createdAt: entry.createdAt?.toMillis?.() ?? entry.createdAt ?? 0,
      });
    });

    const usersMap = new Map<string, OnlineUser>();

    presenceDataRef.current.forEach((entry: any) => {
      const userId = entry.userId;
      if (!userId || userId === currentUserId) {
        return;
      }

      const lastSeenValue = typeof entry.lastSeenMillis === 'number'
        ? entry.lastSeenMillis
        : entry.lastSeen?.toMillis
          ? entry.lastSeen.toMillis()
          : entry.lastSeen?.toDate
            ? entry.lastSeen.toDate().getTime()
            : entry.updatedAt?.toMillis
              ? entry.updatedAt.toMillis()
              : entry.updatedAt?.toDate
                ? entry.updatedAt.toDate().getTime()
                : 0;

      if (!lastSeenValue || now - lastSeenValue >= STALE_THRESHOLD) {
        return;
      }

      const lookup = dailyLookup.get(userId);
      let dailyId = entry.dailyId || lookup?.dailyId;
      let expiresAtMillis = entry.expiresAtMillis || lookup?.expiresAtMillis || 0;
      const createdAt = lookup?.createdAt || lastSeenValue;

      if (!dailyId) {
        return;
      }

      if (expiresAtMillis && expiresAtMillis <= now) {
        return;
      }

      usersMap.set(userId, {
        userId,
        dailyId,
        createdAt,
        isActive: true,
        unreadCount: unreadCountsRef.current[generateChatId(currentDailyId, dailyId)] ?? 0,
      });
    });

    if (!usersMap.has(ADMIN_SUPPORT_USER_ID)) {
      usersMap.set(ADMIN_SUPPORT_USER_ID, {
        userId: ADMIN_SUPPORT_USER_ID,
        dailyId: ADMIN_SUPPORT_DAILY_ID,
        createdAt: Number.MAX_SAFE_INTEGER,
        isActive: true,
        isSupportAgent: true,
        displayName: ADMIN_SUPPORT_DISPLAY_NAME,
        unreadCount: unreadCountsRef.current[generateChatId(currentDailyId, ADMIN_SUPPORT_DAILY_ID)] ?? 0,
      });
    } else {
      const admin = usersMap.get(ADMIN_SUPPORT_USER_ID);
      if (admin) {
        usersMap.set(ADMIN_SUPPORT_USER_ID, {
          ...admin,
          isSupportAgent: true,
          displayName: ADMIN_SUPPORT_DISPLAY_NAME,
          createdAt: Number.MAX_SAFE_INTEGER,
          isActive: true,
          unreadCount: unreadCountsRef.current[generateChatId(currentDailyId, ADMIN_SUPPORT_DAILY_ID)] ?? 0,
        });
      }
    }

    const users = Array.from(usersMap.values()).sort((a, b) => b.createdAt - a.createdAt);

    setOnlineUsers(users);
    setLoading(false);
  }, [currentUserId, currentDailyId]);

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

  useEffect(() => {
    if (!currentDailyId) {
      unreadCountsRef.current = {};
      return;
    }

    const userUnreadRef = realtimeRef(database, `userUnread/${currentDailyId}`);

    const unsubscribe = onValue(
      userUnreadRef,
      (snapshot) => {
        const snapshotValue = snapshot.val() as Record<string, number | string> | null;
        const dataEntries = Object.entries(snapshotValue ?? {});
        const normalizedEntries = dataEntries.map<[string, number]>(([chatId, count]) => [
          chatId,
          typeof count === 'number' ? count : Number(count) || 0,
        ]);
        const data = Object.fromEntries(normalizedEntries);
        const previous = unreadCountsRef.current;

        const isInitialLoad = unreadInitialLoadRef.current;

        Object.entries(data).forEach(([chatId, count]) => {
          const prev = previous[chatId] ?? 0;
          if (!isInitialLoad && count > prev) {
            const otherDailyId = getOtherParticipantId(chatId, currentDailyId);
            notify({
              tone: 'info',
              title: 'New message',
              message: `Message from ${formatDailyId(otherDailyId)}`,
            });
          }
        });

        unreadInitialLoadRef.current = false;
        unreadCountsRef.current = data;
        computeOnlineUsers();
      },
      (error) => {
        console.error('Error listening to unread counts:', error);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [currentDailyId, notify, computeOnlineUsers]);

  const handleConnect = async (targetDailyId: string) => {
    if (!currentDailyId) return;

    const isSupportChat = isAdminSupportDailyId(targetDailyId);
    if (chatLimit.isLimitReached && !isSupportChat) return;

    setConnectingTo(targetDailyId);

    try {
      // Check if chat already exists
      const chatId = generateChatId(currentDailyId, targetDailyId);
      const existingChat = await getChat(chatId);

      if (existingChat || isSupportChat) {
        router.push(`/chat/${targetDailyId}`);
        setConnectingTo(null);
        return;
      }

      const result = await chatLimit.recordChatInitiation();
      if (result.success) {
        router.push(`/chat/${targetDailyId}`);
      } else {
        notify({
          tone: 'warning',
          title: 'Chat limit reached',
          message: result.message || 'Unable to start a new chat right now.',
        });
        setConnectingTo(null);
      }
    } catch (error) {
      console.error('Error connecting to user:', error);
      notify({
        tone: 'error',
        title: 'Connection failed',
        message: 'We could not connect you. Please try again.',
      });
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
          setRandomConnecting(false);
          router.push(`/chat/${result.dailyId}`);
        } else {
          const limitResult = await chatLimit.recordChatInitiation();
          if (limitResult.success) {
            setRandomConnecting(false);
            router.push(`/chat/${result.dailyId}`);
          } else {
            notify({
              tone: 'warning',
              title: 'Chat limit reached',
              message: limitResult.message || 'Unable to start a new chat right now.',
            });
            setRandomConnecting(false);
          }
        }
      } else {
        notify({
          tone: 'info',
          title: 'No matches available',
          message: result.error || 'No one is ready right now. Check back in a moment.',
        });
        setRandomConnecting(false);
      }
    } catch (error) {
      console.error('Error with random connect:', error);
      notify({
        tone: 'error',
        title: 'Connection failed',
        message: 'We could not connect you. Please try again.',
      });
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
            {onlineUsers.map((user) => {
              const unreadCount = user.unreadCount ?? 0;

              return (
                <button
                  key={user.dailyId}
                  onClick={() => handleConnect(user.dailyId)}
                  disabled={(chatLimit.isLimitReached && !user.isSupportAgent) || connectingTo === user.dailyId}
                  className={`${styles.userCard} ${connectingTo === user.dailyId ? styles.connecting : ''}`}
                >
                  {unreadCount > 0 && (
                    <span className={styles.unreadBadge}>
                      {unreadCount > 3 ? '3+' : unreadCount}
                    </span>
                  )}
                  <div className={styles.userIcon}>
                    <img src="/favicon.svg" alt="" style={{ width: '2.5rem', height: '2.5rem', opacity: 0.5 }} />
                  </div>
                  <span className={styles.userId}>
                    {user.displayName ?? formatDailyId(user.dailyId)}
                  </span>
                  <div className={styles.userStatus}>
                    {connectingTo === user.dailyId ? (
                      <>
                        <span className={styles.connectingDot}>⏳</span>
                        <span>Connecting...</span>
                      </>
                    ) : (
                      <>
                        <span className={styles.onlineDot}></span>
                        <span>{user.isSupportAgent ? 'Support' : 'Online'}</span>
                      </>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
