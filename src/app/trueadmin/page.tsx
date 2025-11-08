'use client';

/**
 * True Admin Panel
 * 
 * Secret admin dashboard for reviewing and managing story highlights.
 * Only accessible with valid admin session.
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isAdminSessionValid, clearAdminSession } from '@/lib/secretAdminAuth';
import { getQueuedStories, approveStory, rejectStory } from '@/lib/storiesService';
import { QueuedStory } from '@/types/highlights';
import styles from './admin.module.css';

export default function TrueAdminPanel() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [checking, setChecking] = useState(true);
  const [queuedStories, setQueuedStories] = useState<QueuedStory[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Check admin session
  useEffect(() => {
    const valid = isAdminSessionValid();
    setIsAdmin(valid);
    setChecking(false);

    if (!valid) {
      router.push('/trueadmin/login');
    }
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

  const handleLogout = () => {
    clearAdminSession();
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

      <div className={styles.stats}>
        <div className={styles.statCard}>
          <span className={styles.statValue}>{queuedStories.length}</span>
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

        {queuedStories.length === 0 ? (
          <div className={styles.emptyState}>
            <span className={styles.emptyIcon}>📭</span>
            <p>No stories in queue</p>
            <p className={styles.emptySubtext}>
              Stories will appear here when both users highlight the same message
            </p>
          </div>
        ) : (
          <div className={styles.storyGrid}>
            {queuedStories.map((story) => (
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

                {story.locked && (
                  <div className={styles.lockBadge}>
                    🔒 Locked until midnight PKT
                  </div>
                )}

                <div className={styles.storyActions}>
                  <button
                    className={`${styles.actionButton} ${styles.approveButton}`}
                    onClick={() => handleApprove(story.storyId)}
                    disabled={actionLoading === story.storyId}
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

