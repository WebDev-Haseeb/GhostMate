'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { 
  cleanupOldMessages, 
  deleteAllMessages, 
  getDatabaseStats 
} from '@/lib/chatCleanup';
import styles from './cleanup.module.css';

export default function CleanupPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [stats, setStats] = useState({
    totalChats: 0,
    totalMessages: 0,
    oldMessages: 0,
    todayMessages: 0
  });
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const data = await getDatabaseStats();
      setStats(data);
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCleanupOld = async () => {
    if (!confirm('Delete all messages older than midnight PKT?')) return;
    
    try {
      setProcessing(true);
      setResult(null);
      const count = await cleanupOldMessages();
      setResult(`✓ Cleaned up ${count} old messages`);
      await loadStats();
    } catch (error: any) {
      setResult(`✗ Error: ${error.message}`);
    } finally {
      setProcessing(false);
    }
  };

  const handleDeleteAll = async () => {
    if (!confirm('⚠️ DELETE ALL MESSAGES? This cannot be undone!')) return;
    if (!confirm('Are you ABSOLUTELY sure? This will delete everything!')) return;
    
    try {
      setProcessing(true);
      setResult(null);
      const count = await deleteAllMessages();
      setResult(`✓ Deleted all ${count} messages`);
      await loadStats();
    } catch (error: any) {
      setResult(`✗ Error: ${error.message}`);
    } finally {
      setProcessing(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading...</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button onClick={() => router.push('/')} className={styles.backButton}>
          ← Back to Home
        </button>
        <h1>Database Cleanup</h1>
      </div>

      <div className={styles.stats}>
        <h2>📊 Database Statistics</h2>
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>Total Chats</span>
            <span className={styles.statValue}>{stats.totalChats}</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>Total Messages</span>
            <span className={styles.statValue}>{stats.totalMessages}</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>Old Messages</span>
            <span className={styles.statValue}>{stats.oldMessages}</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>Today&apos;s Messages</span>
            <span className={styles.statValue}>{stats.todayMessages}</span>
          </div>
        </div>
        <button onClick={loadStats} className={styles.refreshButton} disabled={processing}>
          🔄 Refresh Stats
        </button>
      </div>

      <div className={styles.actions}>
        <h2>🗑️ Cleanup Actions</h2>
        
        <div className={styles.actionCard}>
          <h3>Clean Up Old Messages</h3>
          <p>Delete messages older than midnight PKT (keeps today&apos;s messages)</p>
          <button 
            onClick={handleCleanupOld} 
            className={styles.cleanupButton}
            disabled={processing || stats.oldMessages === 0}
          >
            {processing ? 'Processing...' : `Clean Up ${stats.oldMessages} Old Messages`}
          </button>
        </div>

        <div className={styles.actionCard}>
          <h3>⚠️ Delete All Messages</h3>
          <p className={styles.warning}>WARNING: This will delete ALL messages, including today&apos;s!</p>
          <button 
            onClick={handleDeleteAll} 
            className={styles.deleteAllButton}
            disabled={processing || stats.totalMessages === 0}
          >
            {processing ? 'Processing...' : `Delete All ${stats.totalMessages} Messages`}
          </button>
        </div>
      </div>

      {result && (
        <div className={result.startsWith('✓') ? styles.success : styles.error}>
          {result}
        </div>
      )}
    </div>
  );
}

