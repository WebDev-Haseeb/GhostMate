/**
 * React Hook for Chat Limit Management
 * Manages the daily chat initiation limit state
 */

import { useState, useEffect, useCallback } from 'react';
import { getChatLimitStatus, incrementChatCount, canInitiateChat } from '@/lib/chatLimitService';

interface ChatLimitState {
  count: number;
  limit: number;
  remaining: number;
  isLimitReached: boolean;
  timeUntilReset: {
    hours: number;
    minutes: number;
    seconds: number;
    totalMs: number;
  };
  loading: boolean;
  error: string | null;
}

export function useChatLimit(userId: string | null) {
  const [state, setState] = useState<ChatLimitState>({
    count: 0,
    limit: 5,
    remaining: 5,
    isLimitReached: false,
    timeUntilReset: {
      hours: 0,
      minutes: 0,
      seconds: 0,
      totalMs: 0
    },
    loading: true,
    error: null
  });

  // Load initial status
  const loadStatus = useCallback(async () => {
    if (!userId) {
      setState(prev => ({ ...prev, loading: false }));
      return;
    }

    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      const status = await getChatLimitStatus(userId);
      setState({
        ...status,
        loading: false,
        error: null
      });
    } catch (error: any) {
      console.error('Error loading chat limit status:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'Failed to load chat limit status'
      }));
    }
  }, [userId]);

  // Check if user can initiate chat
  const checkCanInitiate = useCallback(async (): Promise<boolean> => {
    if (!userId) return false;
    
    try {
      return await canInitiateChat(userId);
    } catch (error) {
      console.error('Error checking chat initiation:', error);
      return false;
    }
  }, [userId]);

  // Increment count (call this when user initiates a chat)
  const recordChatInitiation = useCallback(async (): Promise<{
    success: boolean;
    message?: string;
  }> => {
    if (!userId) {
      return { success: false, message: 'User not authenticated' };
    }

    try {
      const result = await incrementChatCount(userId);
      
      // Update local state
      setState(prev => ({
        ...prev,
        count: result.newCount,
        remaining: result.remaining,
        isLimitReached: result.limitReached
      }));

      if (!result.success) {
        return {
          success: false,
          message: 'Daily chat limit reached. Please wait until midnight PKT.'
        };
      }

      return { success: true };
    } catch (error: any) {
      console.error('Error recording chat initiation:', error);
      return {
        success: false,
        message: error.message || 'Failed to record chat initiation'
      };
    }
  }, [userId]);

  // Update countdown timer every second
  useEffect(() => {
    if (!userId) return;

    // Initial load
    loadStatus();

    // Update countdown every second
    const interval = setInterval(() => {
      setState(prev => {
        const totalMs = prev.timeUntilReset.totalMs - 1000;
        
        // If countdown reached 0, reload status (new day)
        if (totalMs <= 0) {
          loadStatus();
          return prev;
        }

        const hours = Math.floor(totalMs / (1000 * 60 * 60));
        const minutes = Math.floor((totalMs % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((totalMs % (1000 * 60)) / 1000);

        return {
          ...prev,
          timeUntilReset: {
            hours,
            minutes,
            seconds,
            totalMs
          }
        };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [userId, loadStatus]);

  return {
    ...state,
    reload: loadStatus,
    checkCanInitiate,
    recordChatInitiation
  };
}

