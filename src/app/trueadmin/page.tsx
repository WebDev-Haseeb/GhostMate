'use client';

/**
 * True Admin Panel
 * 
 * Secret admin dashboard for reviewing and managing story highlights.
 * Only accessible with valid admin session.
 */

import { useEffect, useMemo, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { getQueuedStories, approveStory, rejectStory } from '@/lib/storiesService';
import {
  deleteAllChats,
  deleteExpiredChats,
  deleteAllAppData,
  DeleteAllDataResult
} from '@/lib/adminMaintenance';
import { QueuedStory } from '@/types/highlights';
import styles from './admin.module.css';
import { auth, database } from '@/lib/firebase';
import { ref, onValue } from 'firebase/database';
import { Chat, Message } from '@/types/chat';
import { listenToMessages, sendMessage as sendChatMessage } from '@/lib/chatService';
import { ADMIN_SUPPORT_DAILY_ID, ADMIN_SUPPORT_DISPLAY_NAME } from '@/config/adminSupport';
import { formatDailyId } from '@/lib/dailyId';

interface SupportChatSummary {
  chatId: string;
  otherDailyId: string;
  lastMessage?: string;
  lastMessageTimestamp?: number;
}

export default function TrueAdminPanel() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [checking, setChecking] = useState(true);
  const [queuedStories, setQueuedStories] = useState<QueuedStory[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [maintenanceLoading, setMaintenanceLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [supportChats, setSupportChats] = useState<SupportChatSummary[]>([]);
  const [supportLoading, setSupportLoading] = useState(true);
  const [supportMessagesLoading, setSupportMessagesLoading] = useState(false);
  const [supportMessages, setSupportMessages] = useState<Message[]>([]);
  const [selectedSupportChatId, setSelectedSupportChatId] = useState<string | null>(null);
  const [supportInput, setSupportInput] = useState('');
  const [supportSending, setSupportSending] = useState(false);
  const [supportError, setSupportError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      const isAuthenticated = !!user;
      setIsAdmin(isAuthenticated);
      setChecking(false);

      if (!isAuthenticated) {
        router.push('/trueadmin/login');
      }
    });

    return () => unsubscribe();
  }, [router]);

  // Fetch queued stories
  useEffect(() => {
    if (!isAdmin) return;

    const fetchStories = async () => {
      try {
        setLoading(true);
        setError(null);
        const stories = await getQueuedStories();
        setQueuedStories(stories);
      } catch (err: any) {
        setError(err.message || 'Failed to load stories');
      } finally {
        setLoading(false);
      }
    };

    fetchStories();
  }, [isAdmin]);

  const handleApprove = async (storyId: string) => {
    try {
      setActionLoading(storyId);
      setError(null);
      setSuccessMessage(null);

      const result = await approveStory(storyId, 'admin'); // Use 'admin' as adminId

      if (result.success) {
        setSuccessMessage('Story approved! It will appear in the public feed for 24 hours.');
        // Remove from queued stories
        setQueuedStories(prev => prev.filter(s => s.storyId !== storyId));
      } else {
        setError(result.message);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to approve story');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (storyId: string) => {
    try {
      setActionLoading(storyId);
      setError(null);
      setSuccessMessage(null);

      const result = await rejectStory(storyId, 'admin'); // Use 'admin' as adminId

      if (result.success) {
        setSuccessMessage('Story rejected');
        // Remove from queued stories
        setQueuedStories(prev => prev.filter(s => s.storyId !== storyId));
      } else {
        setError(result.message);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to reject story');
    } finally {
      setActionLoading(null);
    }
  };

  const runMaintenanceAction = async <T,>(
    actionKey: string,
    action: () => Promise<T>,
    formatMessage: (result: T) => string
  ): Promise<T | null> => {
    try {
      setMaintenanceLoading(actionKey);
      setError(null);
      setSuccessMessage(null);

      const result = await action();
      setSuccessMessage(formatMessage(result));
      return result;
    } catch (err: any) {
      console.error(`Maintenance action "${actionKey}" failed:`, err);
      setError(err.message || `Failed to complete ${actionKey} action`);
      return null;
    } finally {
      setMaintenanceLoading(null);
    }
  };

  const handleDeleteAllChats = async () => {
    if (!window.confirm('Delete every chat today? This cannot be undone.')) {
      return;
    }

    await runMaintenanceAction('deleteAllChats', deleteAllChats, (result) => {
      const { deletedChats, deletedMessages } = result;
      return `🧹 Removed ${deletedChats} chats and ${deletedMessages} messages from the realtime database.`;
    });
  };

  const handleDeleteExpiredChats = async () => {
    if (!window.confirm('Purge chats/messages from previous days?')) {
      return;
    }

    await runMaintenanceAction('deleteExpiredChats', deleteExpiredChats, (result) => {
      const { deletedChats, deletedMessages } = result;
      if (deletedChats === 0 && deletedMessages === 0) {
        return '✨ No expired chats found. Everything is already fresh.';
      }
      return `🧼 Cleared ${deletedMessages} expired messages and removed ${deletedChats} empty chats.`;
    });
  };

  const handleDeleteAllAppData = async () => {
    if (
      !window.confirm(
        'This will delete ALL app data including users, chats, favorites, highlights, queued and approved stories.\n\nAre you absolutely sure?'
      )
    ) {
      return;
    }

    const result = await runMaintenanceAction(
      'deleteAllData',
      deleteAllAppData,
      (data: DeleteAllDataResult) => {
        setQueuedStories([]);
        const accessibleCollections = data.collections.filter(({ deleted, error }) => !error && deleted > 0);
        const collectionsSummary = accessibleCollections
          .map(({ collection, deleted }) => `${collection} (${deleted})`)
          .join(', ');

        const highlightSummary = data.highlightError
          ? 'Highlights skipped (insufficient permissions).'
          : `${data.highlightMessages} highlight messages across ${data.highlightUsers} users`;

        return [
          `☢️ Full reset complete.`,
          `Realtime DB: removed ${data.deletedChats.deletedChats} chats (${data.deletedChats.deletedMessages} messages).`,
          collectionsSummary
            ? `Firestore: cleared ${collectionsSummary}.`
            : 'Firestore: no accessible documents to remove.',
          `Highlights: ${highlightSummary}.`
        ].join(' ');
      }
    );

    if (!result) {
      return;
    }

    const permissionIssues = result.collections.filter(({ error }) => error === 'permission-denied');
    const otherErrors = result.collections.filter(
      ({ error }) => error && error !== 'permission-denied'
    );
    const highlightPermissionIssue = result.highlightError === 'permission-denied';

    if (permissionIssues.length || highlightPermissionIssue) {
      const collectionNames = permissionIssues.map(({ collection }) => collection).join(', ');
      setError(
        [
          collectionNames
            ? `Firestore rules prevented deleting: ${collectionNames}.`
            : null,
          highlightPermissionIssue
            ? 'Highlights collection is protected by rules and remained untouched.'
            : null,
          'Update Firestore security rules to grant the admin account delete access if full wipes are required.'
        ]
          .filter(Boolean)
          .join(' ')
      );
    } else if (otherErrors.length > 0 || (result.highlightError && result.highlightError !== 'permission-denied')) {
      const otherMessages = otherErrors
        .map(({ collection, error }) => `${collection}: ${error}`)
        .join(', ');
      const highlightMessage =
        result.highlightError && result.highlightError !== 'permission-denied'
          ? `Highlights: ${result.highlightError}`
          : null;
      setError([otherMessages || null, highlightMessage || null].filter(Boolean).join(' | '));
    }
  };

  const isStoryLocked = (story: QueuedStory): boolean => {
    if (!story.locked) {
      return false;
    }

    if (!story.lockExpiresAt) {
      return false;
    }

    const lockValue = story.lockExpiresAt as any;
    const lockDate =
      typeof lockValue === 'object' && typeof lockValue.toDate === 'function'
        ? lockValue.toDate()
        : new Date(lockValue);

    return lockDate.getTime() > Date.now();
  };

  const queuedStoriesWithLockState = useMemo(
    () =>
      queuedStories.map((story) => ({
        story,
        locked: isStoryLocked(story)
      })),
    [queuedStories]
  );

  const handleLogout = () => {
    signOut(auth).catch(() => {
      /* ignore failed signOut */
    });
    router.push('/trueadmin/login');
  };

  useEffect(() => {
    if (!isAdmin) {
      setSupportChats([]);
      setSupportMessages([]);
      setSupportLoading(false);
      return;
    }

    setSupportLoading(true);
    const chatsRef = ref(database, 'chats');

    const unsubscribe = onValue(
      chatsRef,
      (snapshot) => {
        const collected: SupportChatSummary[] = [];

        snapshot.forEach((child) => {
          const chat = child.val() as Chat;
          if (!chat.participants || !chat.participants[ADMIN_SUPPORT_DAILY_ID]) {
            return;
          }

          const chatId = child.key || chat.chatId;
          if (!chatId) {
            return;
          }

          const otherDailyId =
            chat.participantIds?.find((id) => id !== ADMIN_SUPPORT_DAILY_ID) ||
            Object.keys(chat.participants).find((id) => id !== ADMIN_SUPPORT_DAILY_ID) ||
            'UNKNOWN';

          collected.push({
            chatId,
            otherDailyId,
            lastMessage: chat.lastMessage,
            lastMessageTimestamp: chat.lastMessageTimestamp || chat.updatedAt || chat.createdAt,
          });
        });

        collected.sort((a, b) => (b.lastMessageTimestamp ?? 0) - (a.lastMessageTimestamp ?? 0));
        setSupportChats(collected);
        setSupportLoading(false);
        setSelectedSupportChatId((current) => {
          if (current && collected.some((chat) => chat.chatId === current)) {
            return current;
          }
          return collected.length > 0 ? collected[0].chatId : null;
        });
      },
      (err) => {
        console.error('Error loading support chats:', err);
        setSupportError(err.message || 'Failed to load support conversations');
        setSupportChats([]);
        setSupportLoading(false);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [isAdmin]);

  useEffect(() => {
    if (!isAdmin || !selectedSupportChatId) {
      setSupportMessages([]);
      setSupportMessagesLoading(false);
      return;
    }

    setSupportMessagesLoading(true);
    const unsubscribe = listenToMessages(selectedSupportChatId, (msgs) => {
      setSupportMessages(msgs);
      setSupportMessagesLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, [isAdmin, selectedSupportChatId]);

  const selectedSupportChat = useMemo(
    () => supportChats.find((chat) => chat.chatId === selectedSupportChatId) || null,
    [supportChats, selectedSupportChatId]
  );

  const supportConversationTitle = selectedSupportChat
    ? `Chat with ${formatDailyId(selectedSupportChat.otherDailyId)}`
    : 'Select a conversation';

  const formatRelativeTime = (timestamp?: number) => {
    if (!timestamp) {
      return 'Unknown';
    }

    const now = Date.now();
    const diff = Math.max(0, now - timestamp);
    const minutes = Math.floor(diff / (1000 * 60));
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes} min${minutes === 1 ? '' : 's'} ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hr${hours === 1 ? '' : 's'} ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days} day${days === 1 ? '' : 's'} ago`;
    const weeks = Math.floor(days / 7);
    if (weeks < 4) return `${weeks} wk${weeks === 1 ? '' : 's'} ago`;
    const months = Math.floor(days / 30);
    if (months < 12) return `${months} mo${months === 1 ? '' : 's'} ago`;
    const years = Math.floor(days / 365);
    return `${years} yr${years === 1 ? '' : 's'} ago`;
  };

  const handleSendSupportMessage = async () => {
    if (!selectedSupportChat || !supportInput.trim()) {
      return;
    }

    try {
      setSupportSending(true);
      setSupportError(null);
      const text = supportInput.trim();
      await sendChatMessage(selectedSupportChat.chatId, ADMIN_SUPPORT_DAILY_ID, {
        text,
        recipientId: selectedSupportChat.otherDailyId,
      });
      setSupportInput('');
    } catch (err: any) {
      console.error('Error sending support reply:', err);
      setSupportError(err.message || 'Failed to send reply');
    } finally {
      setSupportSending(false);
    }
  };

  const handleSupportInputKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendSupportMessage();
    }
  };

  // Loading state
  if (checking || loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <div className={styles.spinner}>⚙️</div>
          <p>Loading admin panel...</p>
        </div>
      </div>
    );
  }

  // Not admin
  if (!isAdmin) {
    return null; // Will redirect via useEffect
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>
          <img src="/favicon.svg" alt="Loading" className={styles.icon} />
          Admin Panel
        </h1>
        <div className={styles.headerButtons}>
          <button 
            className={styles.homeButton}
            onClick={() => router.push('/')}
          >
            🏠 Home
          </button>
          <button 
            className={styles.logoutButton}
            onClick={handleLogout}
          >
            🔓 Logout
          </button>
        </div>
      </header>

      <section className={styles.maintenanceSection}>
        <h2 className={styles.sectionTitle}>Maintenance Utilities</h2>
        <div className={styles.maintenanceGrid}>
          <div className={styles.maintenanceCard}>
            <div>
              <h3>Delete All Chats</h3>
              <p>Removes every chat thread and message from the realtime database for a hard reset.</p>
            </div>
            <button
              className={styles.maintenanceButton}
              onClick={handleDeleteAllChats}
              disabled={maintenanceLoading === 'deleteAllChats'}
            >
              {maintenanceLoading === 'deleteAllChats' ? 'Deleting…' : 'Delete All Chats'}
            </button>
          </div>

          <div className={styles.maintenanceCard}>
            <div>
              <h3>Clear Expired Chats</h3>
              <p>Deletes chat messages that passed midnight PKT and prunes empty threads.</p>
            </div>
            <button
              className={styles.maintenanceButton}
              onClick={handleDeleteExpiredChats}
              disabled={maintenanceLoading === 'deleteExpiredChats'}
            >
              {maintenanceLoading === 'deleteExpiredChats' ? 'Purging…' : 'Delete Expired Chats'}
            </button>
          </div>

          <div className={styles.maintenanceCardWarning}>
            <div>
              <h3>Delete ALL App Data</h3>
              <p>Deletes users, daily IDs, favorites, connections, stories, highlights, and chats. Use with caution.</p>
            </div>
            <button
              className={styles.maintenanceButtonDanger}
              onClick={handleDeleteAllAppData}
              disabled={maintenanceLoading === 'deleteAllData'}
            >
              {maintenanceLoading === 'deleteAllData' ? 'Wiping…' : 'Full Data Wipe'}
            </button>
          </div>
        </div>
      </section>

      <section className={styles.supportSection}>
        <h2 className={styles.sectionTitle}>{ADMIN_SUPPORT_DISPLAY_NAME} Inbox</h2>
        <div className={styles.supportLayout}>
          <aside className={styles.supportSidebar}>
            {supportLoading ? (
              <div className={styles.supportLoading}>Loading conversations…</div>
            ) : supportChats.length === 0 ? (
              <div className={styles.supportEmpty}>
                <span>📭</span>
                <p>No support conversations yet.</p>
                <p className={styles.supportHint}>They’ll appear here when users contact support.</p>
              </div>
            ) : (
              <div className={styles.supportChatList}>
                {supportChats.map((chat) => (
                  <button
                    key={chat.chatId}
                    className={`${styles.supportChatButton} ${
                      selectedSupportChatId === chat.chatId ? styles.supportChatButtonActive : ''
                    }`}
                    onClick={() => setSelectedSupportChatId(chat.chatId)}
                  >
                    <div className={styles.supportChatHeading}>
                      <span className={styles.supportChatTitle}>
                        {formatDailyId(chat.otherDailyId)}
                      </span>
                      <span className={styles.supportTimestamp}>
                        {formatRelativeTime(chat.lastMessageTimestamp)}
                      </span>
                    </div>
                    {chat.lastMessage && (
                      <p className={styles.supportChatPreview}>{chat.lastMessage}</p>
                    )}
                  </button>
                ))}
              </div>
            )}
          </aside>
          <div className={styles.supportConversation}>
            <header className={styles.supportConversationHeader}>
              <h3>{supportConversationTitle}</h3>
              {selectedSupportChat && (
                <span className={styles.supportConversationSubtext}>
                  Daily ID: {selectedSupportChat.otherDailyId}
                </span>
              )}
            </header>

            {supportError && (
              <div className={styles.supportError}>
                <span>⚠️</span>
                <p>{supportError}</p>
              </div>
            )}

            <div className={styles.supportMessages}>
              {supportMessagesLoading ? (
                <div className={styles.supportLoading}>Loading messages…</div>
              ) : !selectedSupportChat ? (
                <div className={styles.supportEmptyConversation}>
                  <span>👻</span>
                  <p>Select a conversation to review messages.</p>
                </div>
              ) : supportMessages.length === 0 ? (
                <div className={styles.supportEmptyConversation}>
                  <span>✨</span>
                  <p>No messages yet. Say hello!</p>
                </div>
              ) : (
                supportMessages.map((message) => {
                  const isAdminMessage = message.senderId === ADMIN_SUPPORT_DAILY_ID;
                  return (
                    <div
                      key={message.id}
                      className={`${styles.supportMessage} ${
                        isAdminMessage ? styles.supportMessageAdmin : styles.supportMessageUser
                      }`}
                    >
                      <div className={styles.supportMessageBubble}>
                        <p>{message.text}</p>
                        <span className={styles.supportMessageMeta}>
                          {isAdminMessage ? ADMIN_SUPPORT_DISPLAY_NAME : formatDailyId(message.senderId)} ·{' '}
                          {formatRelativeTime(message.timestamp)}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className={styles.supportComposer}>
              <textarea
                className={styles.supportComposerInput}
                placeholder={selectedSupportChat ? 'Type a reply…' : 'Select a conversation to respond.'}
                value={supportInput}
                onChange={(event) => setSupportInput(event.target.value)}
                onKeyDown={handleSupportInputKeyDown}
                disabled={!selectedSupportChat || supportSending}
                rows={3}
              />
              <button
                className={styles.supportComposerButton}
                onClick={handleSendSupportMessage}
                disabled={!selectedSupportChat || supportSending || supportInput.trim().length === 0}
              >
                {supportSending ? 'Sending…' : 'Send Reply'}
              </button>
            </div>
          </div>
        </div>
      </section>

      <div className={styles.stats}>
        <div className={styles.statCard}>
          <span className={styles.statValue}>{queuedStoriesWithLockState.length}</span>
          <span className={styles.statLabel}>Pending Review</span>
        </div>
      </div>

      {error && (
        <div className={styles.error}>
          <span className={styles.errorIcon}>⚠️</span>
          {error}
          <button onClick={() => setError(null)} className={styles.closeButton}>✕</button>
        </div>
      )}

      {successMessage && (
        <div className={styles.success}>
          <span className={styles.successIcon}>✅</span>
          {successMessage}
          <button onClick={() => setSuccessMessage(null)} className={styles.closeButton}>✕</button>
        </div>
      )}

      <main className={styles.main}>
        <h2 className={styles.sectionTitle}>Queued Stories (Pending Review)</h2>

        {queuedStoriesWithLockState.length === 0 ? (
          <div className={styles.emptyState}>
            <span className={styles.emptyIcon}>📭</span>
            <p>No stories in queue</p>
            <p className={styles.emptySubtext}>
              Stories will appear here when both users highlight the same message
            </p>
          </div>
        ) : (
          <div className={styles.storyGrid}>
            {queuedStoriesWithLockState.map(({ story, locked }) => (
              <div key={story.storyId} className={styles.storyCard}>
                <div className={styles.storyHeader}>
                  <span className={styles.storyId}>#{story.storyId.slice(0, 8)}</span>
                  <span className={styles.storyDate}>
                    {story.queuedAt ? (() => {
                      try {
                        // Handle Firestore Timestamp
                        if (story.queuedAt && typeof story.queuedAt === 'object' && 'toDate' in story.queuedAt) {
                          const timestamp = story.queuedAt as { toDate: () => Date };
                          return new Date(timestamp.toDate()).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          });
                        }
                        // Handle regular Date or timestamp
                        return new Date(story.queuedAt as Date | number).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        });
                      } catch {
                        return 'Unknown date';
                      }
                    })() : 'Unknown date'}
                  </span>
                </div>

                <div className={styles.storyContent}>
                  <p className={styles.messageText}>"{story.messageText}"</p>
                </div>

                {locked && (
                  <div className={styles.lockBadge}>
                    🔒 Locked until midnight PKT
                  </div>
                )}

                <div className={styles.storyActions}>
                  <button
                    className={`${styles.actionButton} ${styles.approveButton}`}
                    onClick={() => handleApprove(story.storyId)}
                    disabled={locked || actionLoading === story.storyId}
                    title={locked ? 'Locked until midnight PKT' : undefined}
                  >
                    {actionLoading === story.storyId ? '...' : '✅ Approve'}
                  </button>
                  <button
                    className={`${styles.actionButton} ${styles.rejectButton}`}
                    onClick={() => handleReject(story.storyId)}
                    disabled={actionLoading === story.storyId}
                  >
                    {actionLoading === story.storyId ? '...' : '❌ Reject'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

