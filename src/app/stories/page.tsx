'use client';

/**
 * Public Stories Feed
 * 
 * Displays approved stories that are visible for 24 hours.
 * Stories are anonymous and only show the message text.
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { getApprovedStories } from '@/lib/storiesService';
import { ApprovedStory } from '@/types/highlights';
import styles from './stories.module.css';

export default function StoriesFeed() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [stories, setStories] = useState<ApprovedStory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  // Fetch approved stories
  useEffect(() => {
    if (!user) return;

    const fetchStories = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch active stories
        const approvedStories = await getApprovedStories(100);
        setStories(approvedStories);
      } catch (err: any) {
        console.error('Error fetching stories:', err);
        setError(err.message || 'Failed to load stories');
      } finally {
        setLoading(false);
      }
    };

    fetchStories();

    // Refresh stories every 5 minutes
    const interval = setInterval(fetchStories, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [user]);

  // Calculate time remaining for a story
  const getTimeRemaining = (expiresAt: any): string => {
    if (!expiresAt) return 'Unknown';

    const now = new Date();
    const expiry = expiresAt.toDate ? expiresAt.toDate() : new Date(expiresAt);
    const diffMs = expiry.getTime() - now.getTime();

    if (diffMs <= 0) return 'Expired';

    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  // Loading state
  if (authLoading || loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loaderCard}>
          <div className={styles.loaderSpinner}>
            <div className={styles.loaderCore}>
              <img src="/favicon.svg" alt="Loading stories" />
            </div>
          </div>
          <h2>Gathering today&apos;s highlights...</h2>
          <p className={styles.loaderSubtitle}>Give us a second while we surface the most magical chats.</p>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!user) {
    return null; // Will redirect via useEffect
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>
          <span className={styles.icon}>✨</span>
          Featured Stories
        </h1>
        <button 
          className={styles.homeButton}
          onClick={() => router.push('/')}
        >
          🏠 Home
        </button>
      </header>

      <div className={styles.subtitle}>
        <p>Anonymous moments that resonated with two souls ✨</p>
        <p className={styles.subtitleSmall}>Stories disappear after 24 hours</p>
      </div>

      {error && (
        <div className={styles.error}>
          <span className={styles.errorIcon}>⚠️</span>
          {error}
        </div>
      )}

      <main className={styles.main}>
        {stories.length === 0 ? (
          <div className={styles.emptyState}>
            <span className={styles.emptyIcon}>🌌</span>
            <p>No stories yet</p>
            <p className={styles.emptySubtext}>
              When two users highlight the same message and it's approved by an admin, it will appear here for 24 hours
            </p>
          </div>
        ) : (
          <div className={styles.storyGrid}>
            {stories.map((story, index) => (
              <div key={story.storyId} className={styles.storyCard}>
                <div className={styles.storyNumber}>
                  #{index + 1}
                </div>

                <div className={styles.storyContent}>
                  <p className={styles.messageText}>"{story.messageText}"</p>
                </div>

                <div className={styles.storyFooter}>
                  <span className={styles.timeRemaining}>
                    ⏱️ {getTimeRemaining(story.expiresAt)} left
                  </span>
                  <span className={styles.mutualBadge}>
                    💫 Mutual highlight
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

