/**
 * Chat Limit Service - Daily Chat Initiation Tracking
 * Enforces the 5 chats per day limit for each user
 */

import { getFirestore, doc, getDoc, updateDoc, setDoc, runTransaction } from 'firebase/firestore';
import app from './firebase';
import { getTodayMidnight, getTimeUntilMidnight } from './dailyId';

const db = getFirestore(app);

export interface ChatLimitData {
  userId: string;
  chatCount: number;
  lastResetDate: string; // YYYY-MM-DD in PKT
  lastUpdated: number; // Unix timestamp
}

const MAX_CHATS_PER_DAY = 5;

/**
 * Get the current date string in PKT timezone (YYYY-MM-DD)
 */
function getTodayDateString(): string {
  const today = getTodayMidnight();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Get user's current chat initiation count and limit status
 */
export async function getChatLimitStatus(userId: string): Promise<{
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
}> {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    const today = getTodayDateString();
    let chatCount = 0;
    
    if (userDoc.exists()) {
      const data = userDoc.data();
      
      // Check if the date matches today (PKT)
      if (data.chatLimit?.lastResetDate === today) {
        chatCount = data.chatLimit?.chatCount || 0;
      }
      // If different date, count resets to 0
    }
    
    const remaining = Math.max(0, MAX_CHATS_PER_DAY - chatCount);
    const timeUntilReset = getTimeUntilMidnight();
    
    return {
      count: chatCount,
      limit: MAX_CHATS_PER_DAY,
      remaining,
      isLimitReached: chatCount >= MAX_CHATS_PER_DAY,
      timeUntilReset
    };
  } catch (error) {
    console.error('Error getting chat limit status:', error);
    throw error;
  }
}

/**
 * Increment chat initiation count (with automatic reset if new day)
 * Returns false if limit is reached, true if increment succeeded
 */
export async function incrementChatCount(userId: string): Promise<{
  success: boolean;
  newCount: number;
  remaining: number;
  limitReached: boolean;
}> {
  try {
    const userRef = doc(db, 'users', userId);
    const today = getTodayDateString();
    
    // Use transaction for atomicity (prevent race conditions)
    const result = await runTransaction(db, async (transaction) => {
      const userDoc = await transaction.get(userRef);
      
      let currentCount = 0;
      
      if (userDoc.exists()) {
        const data = userDoc.data();
        const lastResetDate = data.chatLimit?.lastResetDate;
        
        // If same day, use existing count
        if (lastResetDate === today) {
          currentCount = data.chatLimit?.chatCount || 0;
        }
        // If different day, count resets to 0
      }
      
      // Check if limit already reached
      if (currentCount >= MAX_CHATS_PER_DAY) {
        return {
          success: false,
          newCount: currentCount,
          remaining: 0,
          limitReached: true
        };
      }
      
      // Increment count
      const newCount = currentCount + 1;
      const limitReached = newCount >= MAX_CHATS_PER_DAY;
      
      // Update or create document
      if (userDoc.exists()) {
        transaction.update(userRef, {
          'chatLimit.chatCount': newCount,
          'chatLimit.lastResetDate': today,
          'chatLimit.lastUpdated': Date.now()
        });
      } else {
        transaction.set(userRef, {
          userId,
          chatLimit: {
            chatCount: newCount,
            lastResetDate: today,
            lastUpdated: Date.now()
          }
        });
      }
      
      return {
        success: true,
        newCount,
        remaining: MAX_CHATS_PER_DAY - newCount,
        limitReached
      };
    });
    
    return result;
  } catch (error) {
    console.error('Error incrementing chat count:', error);
    throw error;
  }
}

/**
 * Check if user can initiate a new chat (without incrementing)
 */
export async function canInitiateChat(userId: string): Promise<boolean> {
  const status = await getChatLimitStatus(userId);
  return !status.isLimitReached;
}

/**
 * Reset chat count for a user (for testing/admin purposes)
 */
export async function resetChatCount(userId: string): Promise<void> {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      'chatLimit.chatCount': 0,
      'chatLimit.lastResetDate': getTodayDateString(),
      'chatLimit.lastUpdated': Date.now()
    });
  } catch (error) {
    console.error('Error resetting chat count:', error);
    throw error;
  }
}

/**
 * Format time until reset for display
 */
export function formatTimeUntilReset(timeUntilReset: {
  hours: number;
  minutes: number;
  seconds: number;
}): string {
  const { hours, minutes, seconds } = timeUntilReset;
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  } else {
    return `${seconds}s`;
  }
}

