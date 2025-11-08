'use client';

/**
 * True Admin Panel
 * 
 * Secret admin dashboard for reviewing and managing story highlights.
 * Only accessible with valid admin session.
 */

import { useEffect, useMemo, useState } from 'react';
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
import { auth } from '@/lib/firebase';

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

