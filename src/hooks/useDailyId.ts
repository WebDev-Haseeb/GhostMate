/**
 * Custom React Hook for Daily ID Management
 * Handles automatic midnight reset and ID lifecycle
 */

import { useState, useEffect, useCallback } from 'react';
import { getOrCreateDailyId, refreshDailyId } from '@/lib/dailyIdService';
import { getTimeUntilMidnight } from '@/lib/dailyId';

interface UseDailyIdReturn {
  dailyId: string | null;
  loading: boolean;
  error: string | null;
  timeUntilReset: {
    hours: number;
    minutes: number;
    seconds: number;
  } | null;
  refreshId: () => Promise<void>;
}

export function useDailyId(userId: string | null): UseDailyIdReturn {
  const [dailyId, setDailyId] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [timeUntilReset, setTimeUntilReset] = useState<{
    hours: number;
    minutes: number;
    seconds: number;
  } | null>(null);

  // Load daily ID
  const loadDailyId = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const id = await getOrCreateDailyId(userId);
      setDailyId(id);
    } catch (err: any) {
      console.error('Failed to load daily ID:', err);
      setError(err.message || 'Failed to load daily ID');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Manual refresh
  const refreshId = useCallback(async () => {
    if (!userId) return;

    try {
      setLoading(true);
      setError(null);
      const newId = await refreshDailyId(userId);
      setDailyId(newId);
    } catch (err: any) {
      console.error('Failed to refresh daily ID:', err);
      setError(err.message || 'Failed to refresh daily ID');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Initial load
  useEffect(() => {
    loadDailyId();
  }, [loadDailyId]);

  // Countdown timer to midnight
  useEffect(() => {
    const updateCountdown = () => {
      const time = getTimeUntilMidnight();
      setTimeUntilReset({
        hours: time.hours,
        minutes: time.minutes,
        seconds: time.seconds
      });
    };

    // Update immediately
    updateCountdown();

    // Update every second
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, []);

  // Auto-refresh at midnight
  useEffect(() => {
    if (!userId) return;

    const checkAndRefresh = () => {
      const time = getTimeUntilMidnight();
      
      // If less than 1 second until midnight, refresh
      if (time.totalMs < 1000) {
        loadDailyId();
      }
    };

    // Check every 30 seconds
    const interval = setInterval(checkAndRefresh, 30000);

    return () => clearInterval(interval);
  }, [userId, loadDailyId]);

  return {
    dailyId,
    loading,
    error,
    timeUntilReset,
    refreshId
  };
}

