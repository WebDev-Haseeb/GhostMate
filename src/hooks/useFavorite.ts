/**
 * useFavorite Hook - Manage favorite status for a specific user
 */

import { useState, useEffect, useCallback } from 'react';
import { 
  addFavorite as addFavoriteService,
  removeFavorite as removeFavoriteService,
  hasFavorited,
  hasMutualConnection,
  isConnectionLocked,
  listenToConnection,
  listenToUserFavorites,
  CreateFavoriteInput,
  FavoriteActionResult,
  Unsubscribe
} from '@/lib/favoritesService';
import { getUserIdFromDailyId } from '@/lib/dailyIdService';
import { Connection } from '@/types/favorites';
import { logAnalyticsEvent } from '@/lib/analytics';

interface UseFavoriteProps {
  userId: string | null;
  userDailyId: string | null;
  targetDailyId: string;
}

interface UseFavoriteReturn {
  isFavorited: boolean;
  hasMutual: boolean;
  connection: Connection | null;
  isLocked: boolean;
  loading: boolean;
  toggling: boolean;
  error: string | null;
  toggleFavorite: () => Promise<FavoriteActionResult>;
  lockExpiresAt: number | null;
  streakCount: number;
}

/**
 * Hook for managing favorite status for a specific target daily ID
 */
export function useFavorite({ 
  userId, 
  userDailyId, 
  targetDailyId 
}: UseFavoriteProps): UseFavoriteReturn {
  const [isFavorited, setIsFavorited] = useState(false);
  const [hasMutual, setHasMutual] = useState(false);
  const [connection, setConnection] = useState<Connection | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  const [lockExpiresAt, setLockExpiresAt] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load initial favorite status and set up real-time listeners
  useEffect(() => {
    let isMounted = true;
    let unsubscribeFavorites: Unsubscribe | null = null;
    let unsubscribeConnection: Unsubscribe | null = null;

    async function loadAndListen() {
      if (!userId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Get the other user's ID
        const otherUserId = await getUserIdFromDailyId(targetDailyId);
        
        if (!otherUserId) {
          setLoading(false);
          return;
        }

        // Listen to user's favorites in real-time
        unsubscribeFavorites = listenToUserFavorites(userId, (favorites) => {
          if (isMounted && favorites) {
            setIsFavorited(favorites.favorites[targetDailyId] !== undefined);
          }
        });

        // Listen to connection status in real-time
        unsubscribeConnection = listenToConnection(userId, otherUserId, (conn) => {
          if (isMounted) {
            setConnection(conn);
            setHasMutual(!!conn);
            setIsLocked(conn ? isConnectionLocked(conn) : false);
            setLockExpiresAt(conn?.lockExpiresAt || null);
          }
        });
        
        setLoading(false);
      } catch (err: any) {
        console.error('Error loading favorite status:', err);
        if (isMounted) {
          setError(err.message || 'Failed to load favorite status');
          setLoading(false);
        }
      }
    }

    loadAndListen();

    return () => {
      isMounted = false;
      if (unsubscribeFavorites) unsubscribeFavorites();
      if (unsubscribeConnection) unsubscribeConnection();
    };
  }, [userId, targetDailyId]);

  // Toggle favorite
  const toggleFavorite = useCallback(async (): Promise<FavoriteActionResult> => {
    // Validation checks
    if (!userId || !userDailyId || !targetDailyId) {
      return {
        success: false,
        message: 'Missing required information'
      };
    }
    
    // Prevent self-favorite
    if (userDailyId === targetDailyId) {
      return {
        success: false,
        message: 'Cannot favorite yourself'
      };
    }

    if (toggling) {
      return {
        success: false,
        message: 'Action already in progress'
      };
    }

    try {
      setToggling(true);
      setError(null);

      const wasFavorited = isFavorited;
      let result: FavoriteActionResult;

      if (wasFavorited) {
        // Remove favorite
        result = await removeFavoriteService(userId, targetDailyId, userDailyId);
      } else {
        // Add favorite
        const input: CreateFavoriteInput = {
          userId,
          userDailyId,
          favoritedDailyId: targetDailyId
        };
        result = await addFavoriteService(input);
      }

      if (result.success) {
        setIsFavorited(!wasFavorited);
        
        // If mutual connection was established
        if (result.mutualConnection && result.connectionToken) {
          setHasMutual(true);
          setIsLocked(result.isLocked || false);
          setLockExpiresAt(result.lockExpiresAt || null);
        }

        logAnalyticsEvent(
          result.mutualConnection
            ? 'favorite_mutual'
            : wasFavorited
              ? 'favorite_removed'
              : 'favorite_added',
          {
          user_id: userId,
          target_daily_id: targetDailyId,
          mutual: result.mutualConnection ?? false,
          locked: result.isLocked ?? false
        });
      } else {
        setError(result.message || 'Action failed');
        
        // If locked, update lock status
        if (result.isLocked && result.lockExpiresAt) {
          setIsLocked(true);
          setLockExpiresAt(result.lockExpiresAt);
        }
      }

      setToggling(false);
      return result;
    } catch (err: any) {
      console.error('Error toggling favorite:', err);
      const errorMessage = err.message || 'Failed to toggle favorite';
      setError(errorMessage);
      setToggling(false);
      
      return {
        success: false,
        message: errorMessage
      };
    }
  }, [userId, userDailyId, targetDailyId, isFavorited, toggling]);

  return {
    isFavorited,
    hasMutual,
    connection,
    isLocked,
    loading,
    toggling,
    error,
    toggleFavorite,
    lockExpiresAt,
    streakCount: connection?.streakCount || 0
  };
}

