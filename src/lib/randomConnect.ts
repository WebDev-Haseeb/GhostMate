/**
 * Random Connect Service
 * Handles logic for pairing users with random active daily IDs
 */

import { 
  getFirestore, 
  collection, 
  query, 
  where, 
  getDocs 
} from 'firebase/firestore';
import { getDatabase, ref, get } from 'firebase/database';
import app from './firebase';
import { getTodayMidnight } from './dailyId';

const db = getFirestore(app);
const database = getDatabase(app);

/**
 * Get a random active user's daily ID
 * Excludes current user and users already chatted with
 */
export async function getRandomActiveDailyId(
  currentUserId: string,
  currentDailyId: string
): Promise<{ success: boolean; dailyId?: string; error?: string }> {
  try {
    // Get today's midnight for filtering expired IDs
    const todayMidnight = getTodayMidnight();
    
    // Query active daily IDs (not expired)
    const dailyIdsRef = collection(db, 'dailyIds');
    const activeIdsQuery = query(
      dailyIdsRef,
      where('expiresAt', '>', todayMidnight)
    );
    
    const snapshot = await getDocs(activeIdsQuery);
    
    if (snapshot.empty) {
      return {
        success: false,
        error: 'No active users online right now. Try again later!'
      };
    }
    
    // Get all active daily IDs except current user's
    const activeDailyIds: string[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      // Exclude current user
      if (data.userId !== currentUserId) {
        activeDailyIds.push(doc.id);
      }
    });
    
    if (activeDailyIds.length === 0) {
      return {
        success: false,
        error: 'No other users online right now. Try again later!'
      };
    }
    
    // Get list of daily IDs user has already chatted with
    const existingChatIds = await getExistingChatDailyIds(currentDailyId);
    
    // Filter out daily IDs already chatted with
    const availableDailyIds = activeDailyIds.filter(
      (id) => !existingChatIds.includes(id)
    );
    
    if (availableDailyIds.length === 0) {
      return {
        success: false,
        error: "You've already connected with everyone online! 🎉"
      };
    }
    
    // Select random daily ID from available ones
    const randomIndex = Math.floor(Math.random() * availableDailyIds.length);
    const randomDailyId = availableDailyIds[randomIndex];
    
    return {
      success: true,
      dailyId: randomDailyId
    };
  } catch (error) {
    console.error('Error getting random active daily ID:', error);
    return {
      success: false,
      error: 'Failed to connect. Please try again.'
    };
  }
}

/**
 * Get list of daily IDs the user has already chatted with today
 */
async function getExistingChatDailyIds(currentDailyId: string): Promise<string[]> {
  try {
    const chatsRef = ref(database, 'chats');
    const snapshot = await get(chatsRef);
    
    if (!snapshot.exists()) {
      return [];
    }
    
    const chats = snapshot.val();
    const existingDailyIds: string[] = [];
    
    // Extract daily IDs from chat IDs
    Object.keys(chats).forEach((chatId) => {
      // Chat ID format: "dailyId1_dailyId2" (sorted)
      const [id1, id2] = chatId.split('_');
      
      if (id1 === currentDailyId) {
        existingDailyIds.push(id2);
      } else if (id2 === currentDailyId) {
        existingDailyIds.push(id1);
      }
    });
    
    return existingDailyIds;
  } catch (error) {
    console.error('Error getting existing chat IDs:', error);
    return [];
  }
}


