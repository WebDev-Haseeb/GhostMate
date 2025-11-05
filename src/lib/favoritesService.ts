/**
 * Firestore Service for Favorites and Connection Token System
 * 
 * FIRESTORE DATA MODEL:
 * 
 * Collection: userFavorites/{userId}
 * - Document contains all favorites for a specific user
 * - favorites: Map<dailyId, Favorite>
 * - updatedAt: timestamp
 * 
 * Collection: connections/{connectionId}
 * - Document contains mutual connection data
 * - connectionId format: "uid1_uid2" (sorted alphabetically)
 * - connectionToken: unique persistent token
 * - streakCount, isLocked, lockExpiresAt, etc.
 * 
 * Collection: dailyConnectionChecks/{date}_{connectionId}
 * - Tracks daily mutual favorite checks
 * - Resets at midnight PKT
 */

import { 
  getFirestore, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  runTransaction,
  serverTimestamp,
  Timestamp,
  onSnapshot,
  Unsubscribe
} from 'firebase/firestore';
import app from './firebase';
import { 
  Favorite, 
  Connection, 
  UserFavorites, 
  DailyConnectionCheck,
  FavoriteActionResult 
} from '@/types/favorites';
import type { CreateFavoriteInput } from '@/types/favorites';
import { getTodayDateString, getNextMidnight, formatDailyId } from './dailyId';
import { getUserIdFromDailyId } from './dailyIdService';
import { sendSystemMessage } from './chatService';
import { generateChatId } from './chatUtils';

// Re-export types for convenience
export type { CreateFavoriteInput, FavoriteActionResult, Connection, Favorite, UserFavorites } from '@/types/favorites';
export type { Unsubscribe };

const db = getFirestore(app);

/**
 * Generate a unique connection ID from two user IDs
 */
export function generateConnectionId(userId1: string, userId2: string): string {
  const sorted = [userId1, userId2].sort();
  return `${sorted[0]}_${sorted[1]}`;
}

/**
 * Generate a unique connection token (8-character alphanumeric)
 */
export function generateConnectionToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let token = '';
  for (let i = 0; i < 8; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

/**
 * Get today's date string in PKT timezone (YYYY-MM-DD)
 */
function getTodayDate(): string {
  return getTodayDateString();
}

/**
 * Check if a connection is currently locked (24-hour lockout)
 */
export function isConnectionLocked(connection: Connection): boolean {
  if (!connection.isLocked || !connection.lockExpiresAt) {
    return false;
  }
  
  return Date.now() < connection.lockExpiresAt;
}

/**
 * Get all favorites for a user
 */
export async function getUserFavorites(userId: string): Promise<UserFavorites | null> {
  try {
    const docRef = doc(db, 'userFavorites', userId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return docSnap.data() as UserFavorites;
    }
    
    return null;
  } catch (error) {
    console.error('Error getting user favorites:', error);
    throw error;
  }
}

/**
 * Check if user has favorited a specific daily ID
 */
export async function hasFavorited(
  userId: string, 
  dailyId: string
): Promise<boolean> {
  try {
    const favorites = await getUserFavorites(userId);
    return favorites?.favorites?.[dailyId] !== undefined;
  } catch (error) {
    console.error('Error checking favorite status:', error);
    return false;
  }
}

/**
 * Get connection between two users (if exists)
 */
export async function getConnection(
  userId1: string, 
  userId2: string
): Promise<Connection | null> {
  try {
    const connectionId = generateConnectionId(userId1, userId2);
    const docRef = doc(db, 'connections', connectionId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return docSnap.data() as Connection;
    }
    
    return null;
  } catch (error) {
    console.error('Error getting connection:', error);
    throw error;
  }
}

/**
 * Listen to connection changes in real-time
 */
export function listenToConnection(
  userId1: string,
  userId2: string,
  callback: (connection: Connection | null) => void
): Unsubscribe {
  const connectionId = generateConnectionId(userId1, userId2);
  const connectionRef = doc(db, 'connections', connectionId);
  
  return onSnapshot(connectionRef, (snapshot) => {
    if (snapshot.exists()) {
      callback(snapshot.data() as Connection);
    } else {
      callback(null);
    }
  }, (error) => {
    console.error('Error listening to connection:', error);
    callback(null);
  });
}

/**
 * Listen to user favorites in real-time
 */
export function listenToUserFavorites(
  userId: string,
  callback: (favorites: UserFavorites | null) => void
): Unsubscribe {
  const favoritesRef = doc(db, 'userFavorites', userId);
  
  return onSnapshot(favoritesRef, (snapshot) => {
    if (snapshot.exists()) {
      callback(snapshot.data() as UserFavorites);
    } else {
      callback(null);
    }
  }, (error) => {
    console.error('Error listening to favorites:', error);
    callback(null);
  });
}

/**
 * Check if two users have a mutual connection
 */
export async function hasMutualConnection(
  userId1: string,
  userId2: string
): Promise<{ hasConnection: boolean; connection?: Connection }> {
  try {
    const connection = await getConnection(userId1, userId2);
    
    if (connection && connection.status === 'active') {
      return { hasConnection: true, connection };
    }
    
    return { hasConnection: false };
  } catch (error) {
    console.error('Error checking mutual connection:', error);
    return { hasConnection: false };
  }
}

/**
 * Create a mutual connection between two users
 */
async function createMutualConnection(
  userId1: string,
  userId2: string,
  dailyId1: string,
  dailyId2: string,
  transaction: any
): Promise<{ connectionToken: string; lockExpiresAt: number; streakCount: number }> {
  const connectionId = generateConnectionId(userId1, userId2);
  const connectionToken = generateConnectionToken();
  const now = Date.now();
  const lockExpiresAt = getNextMidnight().getTime(); // Lock until midnight PKT
  const today = getTodayDate();
  
  const newConnection: Connection = {
    connectionToken,
    userIds: [userId1, userId2].sort() as [string, string],
    createdAt: now,
    lastMutualFavoriteAt: now,
    streakCount: 1,
    isLocked: true,
    lockExpiresAt,
    lastStreakDate: today,
    status: 'active'
  };
  
  const connectionRef = doc(db, 'connections', connectionId);
  transaction.set(connectionRef, newConnection);
  
  return { connectionToken, lockExpiresAt, streakCount: 1 };
}

/**
 * Update existing connection with streak logic
 * Called when users re-favorite after lock expires
 */
async function updateConnectionStreak(
  userId1: string,
  userId2: string,
  existingConnection: Connection,
  dailyId1: string,
  dailyId2: string,
  transaction: any
): Promise<{ connectionToken: string; lockExpiresAt: number; streakCount: number; streakIncremented: boolean }> {
  const connectionId = generateConnectionId(userId1, userId2);
  const now = Date.now();
  const lockExpiresAt = getNextMidnight().getTime(); // Lock until midnight PKT
  const today = getTodayDate();
  const yesterday = getYesterdayDate();
  
  let newStreakCount = existingConnection.streakCount;
  let streakIncremented = false;
  
  // Check if this is consecutive days
  if (existingConnection.lastStreakDate === yesterday) {
    // Consecutive day - increment streak
    newStreakCount = existingConnection.streakCount + 1;
    streakIncremented = true;
  } else if (existingConnection.lastStreakDate !== today) {
    // Missed days - reset streak to 1
    newStreakCount = 1;
  }
  // If lastStreakDate === today, keep current streak (already favorited today)
  
  const updatedConnection: Connection = {
    ...existingConnection,
    lastMutualFavoriteAt: now,
    streakCount: newStreakCount,
    isLocked: true,
    lockExpiresAt,
    lastStreakDate: today,
    status: 'active'
  };
  
  const connectionRef = doc(db, 'connections', connectionId);
  transaction.set(connectionRef, updatedConnection);
  
  return { 
    connectionToken: existingConnection.connectionToken, 
    lockExpiresAt, 
    streakCount: newStreakCount,
    streakIncremented
  };
}

/**
 * Get yesterday's date string in PKT timezone (YYYY-MM-DD format)
 */
function getYesterdayDate(): string {
  const pktTime = getPakistanTime();
  pktTime.setDate(pktTime.getDate() - 1); // Go back one day
  
  const year = pktTime.getFullYear();
  const month = String(pktTime.getMonth() + 1).padStart(2, '0');
  const day = String(pktTime.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}

/**
 * Get Pakistan time
 */
function getPakistanTime(): Date {
  const now = new Date();
  const pktOffset = 5 * 60; // PKT is UTC+5
  const localOffset = now.getTimezoneOffset();
  const pktTime = new Date(now.getTime() + (pktOffset + localOffset) * 60 * 1000);
  return pktTime;
}

/**
 * Add a favorite (and check for mutual favorite)
 * This is the main function that orchestrates the entire favorite logic
 */
export async function addFavorite(
  input: CreateFavoriteInput
): Promise<FavoriteActionResult> {
  const { userId, userDailyId, favoritedDailyId } = input;
  
  // Input validation
  if (!userId || !userDailyId || !favoritedDailyId) {
    return {
      success: false,
      message: 'Invalid input parameters'
    };
  }
  
  // Cannot favorite yourself (daily ID check)
  if (userDailyId === favoritedDailyId) {
    return {
      success: false,
      message: 'Cannot favorite yourself'
    };
  }
  
  // First, get the other user's ID from their daily ID (OUTSIDE transaction - read-only lookup)
  const otherUserId = await getUserIdFromDailyId(favoritedDailyId);
  
  if (!otherUserId) {
    return {
      success: false,
      message: 'User not found or daily ID expired'
    };
  }
  
  // Cannot favorite yourself (UID check - backup safety)
  if (userId === otherUserId) {
    return {
      success: false,
      message: 'Cannot favorite yourself'
    };
  }
  
  try {
    // Run in a transaction to ensure atomicity
    // ALL reads must happen before ALL writes in a transaction
    const result = await runTransaction(db, async (transaction) => {
      // === PHASE 1: ALL READS ===
      
      // Read user's favorites
      const favoritesRef = doc(db, 'userFavorites', userId);
      const favoritesSnap = await transaction.get(favoritesRef);
      
      // Read other user's favorites
      const otherFavoritesRef = doc(db, 'userFavorites', otherUserId);
      const otherFavoritesSnap = await transaction.get(otherFavoritesRef);
      
      // Read existing connection (if any)
      const connectionId = generateConnectionId(userId, otherUserId);
      const connectionRef = doc(db, 'connections', connectionId);
      const connectionSnap = await transaction.get(connectionRef);
      
      // === PHASE 2: PROCESS DATA ===
      
      // Get current favorites
      const currentFavorites = favoritesSnap.exists() 
        ? (favoritesSnap.data() as UserFavorites)
        : { userId, favorites: {}, updatedAt: Date.now() };
      
      // Check if already favorited
      if (currentFavorites.favorites[favoritedDailyId]) {
        return { 
          success: false, 
          message: 'Already favorited this user' 
        };
      }
      
      // Check for existing connection and lock
      const existingConnection = connectionSnap.exists() 
        ? (connectionSnap.data() as Connection) 
        : null;
        
      if (existingConnection && isConnectionLocked(existingConnection)) {
        return {
          success: false,
          message: 'Connection is locked. Please wait for the 24-hour period to expire.',
          isLocked: true,
          lockExpiresAt: existingConnection.lockExpiresAt!
        };
      }
      
      // === PHASE 3: ALL WRITES ===
      
      // Create new favorite
      const newFavorite: Favorite = {
        userId,
        favoritedDailyId,
        createdAt: Date.now(),
        userDailyId
      };
      
      // Update favorites
      currentFavorites.favorites[favoritedDailyId] = newFavorite;
      currentFavorites.updatedAt = Date.now();
      
      transaction.set(favoritesRef, currentFavorites);
      
      // Check if the other user has already favorited us (mutual favorite)
      if (otherFavoritesSnap.exists()) {
        const otherFavorites = otherFavoritesSnap.data() as UserFavorites;
        
        // Check if they have favorited our current daily ID
        if (otherFavorites.favorites[userDailyId]) {
          // Mutual favorite detected!
          
          // Check if this is a new connection or an existing one
          if (existingConnection) {
            // Existing connection - update streak
            const { connectionToken, lockExpiresAt, streakCount, streakIncremented } = 
              await updateConnectionStreak(
                userId,
                otherUserId,
                existingConnection,
                userDailyId,
                favoritedDailyId,
                transaction
              );
            
            const streakMessage = streakIncremented 
              ? `🔥 ${streakCount}-day streak!` 
              : `Connection renewed! Current streak: ${streakCount}`;
            
            return {
              success: true,
              message: `Mutual connection re-established! ${streakMessage}`,
              mutualConnection: true,
              connectionToken,
              isLocked: true,
              lockExpiresAt
            };
          } else {
            // New connection - create it
            const { connectionToken, lockExpiresAt, streakCount } = await createMutualConnection(
              userId,
              otherUserId,
              userDailyId,
              favoritedDailyId,
              transaction
            );
            
            return {
              success: true,
              message: 'Mutual connection established! 🎉',
              mutualConnection: true,
              connectionToken,
              isLocked: true,
              lockExpiresAt
            };
          }
        }
      }
      
      return { 
        success: true, 
        message: 'Favorite added successfully',
        mutualConnection: false 
      };
    });
    
    // Send chat notifications AFTER transaction completes (async - don't wait)
    if (result.success && result.mutualConnection) {
      // Mutual connection message - both users see the same message
      const chatId = generateChatId(userDailyId, favoritedDailyId);
      const streakInfo = result.streakCount && result.streakCount > 1 
        ? ` 🔥 ${result.streakCount}-day streak!` 
        : '';
      sendSystemMessage(
        chatId, 
        `💫 You both favorited each other! Connection established!${streakInfo}`
      ).catch((err) => 
        console.error('Error sending chat notification:', err)
      );
    } else if (result.success && !result.mutualConnection) {
      // Single favorite notification - personalized for both users
      const chatId = generateChatId(userDailyId, favoritedDailyId);
      const formattedUserDailyId = formatDailyId(userDailyId);
      const formattedTargetDailyId = formatDailyId(favoritedDailyId);
      sendSystemMessage(
        chatId, 
        `⭐ ${formattedUserDailyId} added ${formattedTargetDailyId} to favorites`
      ).catch((err) => 
        console.error('Error sending chat notification:', err)
      );
    }
    
    return result;
  } catch (error: any) {
    console.error('Error adding favorite:', error);
    return {
      success: false,
      message: error.message || 'Failed to add favorite'
    };
  }
}

/**
 * Remove a favorite
 */
export async function removeFavorite(
  userId: string,
  favoritedDailyId: string,
  userDailyId?: string
): Promise<FavoriteActionResult> {
  // Input validation
  if (!userId || !favoritedDailyId) {
    return {
      success: false,
      message: 'Invalid input parameters'
    };
  }
  
  // Get the other user's ID from their daily ID
  const otherUserId = await getUserIdFromDailyId(favoritedDailyId);
  
  if (!otherUserId) {
    return {
      success: false,
      message: 'User not found or daily ID expired'
    };
  }
  
  // Check if there's a locked connection
  const existingConnection = await getConnection(userId, otherUserId);
  if (existingConnection && isConnectionLocked(existingConnection)) {
    return {
      success: false,
      message: 'Connection is locked until midnight',
      isLocked: true,
      lockExpiresAt: existingConnection.lockExpiresAt!
    };
  }
  
  try {
    const result = await runTransaction(db, async (transaction) => {
      const favoritesRef = doc(db, 'userFavorites', userId);
      const favoritesSnap = await transaction.get(favoritesRef);
      
      if (!favoritesSnap.exists()) {
        return { 
          success: false, 
          message: 'No favorites found' 
        };
      }
      
      const favorites = favoritesSnap.data() as UserFavorites;
      
      // Check if favorite exists
      if (!favorites.favorites[favoritedDailyId]) {
        return { 
          success: false, 
          message: 'Favorite not found' 
        };
      }
      
      // Remove favorite
      delete favorites.favorites[favoritedDailyId];
      favorites.updatedAt = Date.now();
      
      transaction.set(favoritesRef, favorites);
      
      return { 
        success: true, 
        message: 'Favorite removed successfully' 
      };
    });
    
    // Send unfavorite notification if we have the user's daily ID
    if (result.success && userDailyId) {
      const chatId = generateChatId(userDailyId, favoritedDailyId);
      const formattedUserDailyId = formatDailyId(userDailyId);
      const formattedTargetDailyId = formatDailyId(favoritedDailyId);
      
      // Send notification asynchronously (non-blocking)
      sendSystemMessage(
        chatId, 
        `💔 ${formattedUserDailyId} removed ${formattedTargetDailyId} from favorites`
      ).catch((err) => 
        console.error('Error sending unfavorite notification:', err)
      );
    }
    
    return result;
  } catch (error: any) {
    console.error('Error removing favorite:', error);
    return {
      success: false,
      message: error.message || 'Failed to remove favorite'
    };
  }
}

