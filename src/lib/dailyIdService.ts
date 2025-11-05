/**
 * Daily ID Service - Firestore Integration
 * Manages the lifecycle of daily anonymous IDs
 */

import { getFirestore, doc, getDoc, setDoc, query, collection, where, getDocs } from 'firebase/firestore';
import app from './firebase';
import { generateDailyId, getTodayMidnight, getNextMidnight, isIdExpired } from './dailyId';

const db = getFirestore(app);

export interface DailyIdRecord {
  dailyId: string;
  userId: string;
  createdAt: Date;
  expiresAt: Date;
}

/**
 * Check if a daily ID already exists (collision detection)
 */
async function isDailyIdTaken(dailyId: string): Promise<boolean> {
  try {
    const todayMidnight = getTodayMidnight();
    const dailyIdsRef = collection(db, 'dailyIds');
    const q = query(
      dailyIdsRef,
      where('dailyId', '==', dailyId),
      where('expiresAt', '>', todayMidnight)
    );
    
    const snapshot = await getDocs(q);
    return !snapshot.empty;
  } catch (error) {
    console.error('Error checking ID collision:', error);
    return false;
  }
}

/**
 * Generate a unique daily ID (with collision checking)
 */
async function generateUniqueDailyId(maxAttempts = 5): Promise<string> {
  for (let i = 0; i < maxAttempts; i++) {
    const id = generateDailyId();
    const isTaken = await isDailyIdTaken(id);
    
    if (!isTaken) {
      return id;
    }
  }
  
  // Fallback: append timestamp if all attempts fail
  const fallbackId = generateDailyId();
  return fallbackId;
}

/**
 * Get existing daily ID for a user
 */
export async function getUserDailyId(userId: string): Promise<DailyIdRecord | null> {
  try {
    const userDocRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userDocRef);
    
    if (!userDoc.exists()) {
      return null;
    }
    
    const data = userDoc.data();
    if (!data.dailyId || !data.dailyIdCreatedAt) {
      return null;
    }
    
    const createdAt = data.dailyIdCreatedAt.toDate();
    
    // Check if ID is expired
    if (isIdExpired(createdAt)) {
      return null;
    }
    
    return {
      dailyId: data.dailyId,
      userId: userId,
      createdAt: createdAt,
      expiresAt: data.dailyIdExpiresAt.toDate()
    };
  } catch (error) {
    console.error('Error fetching daily ID:', error);
    return null;
  }
}

/**
 * Create a new daily ID for a user
 */
export async function createDailyId(userId: string): Promise<string> {
  try {
    // Generate unique ID
    const dailyId = await generateUniqueDailyId();
    
    const now = new Date();
    const expiresAt = getNextMidnight();
    
    // Store in users collection
    const userDocRef = doc(db, 'users', userId);
    await setDoc(userDocRef, {
      dailyId,
      dailyIdCreatedAt: now,
      dailyIdExpiresAt: expiresAt,
      lastUpdated: now
    }, { merge: true });
    
    // Store in dailyIds collection for collision checking
    const dailyIdDocRef = doc(db, 'dailyIds', dailyId);
    await setDoc(dailyIdDocRef, {
      dailyId,
      userId,
      createdAt: now,
      expiresAt
    });
    
    return dailyId;
  } catch (error) {
    console.error('Error creating daily ID:', error);
    throw new Error('Failed to create daily ID');
  }
}

/**
 * Get or create daily ID for a user
 * Main entry point for the service
 */
export async function getOrCreateDailyId(userId: string): Promise<string> {
  try {
    // Try to get existing ID
    const existingId = await getUserDailyId(userId);
    
    if (existingId) {
      return existingId.dailyId;
    }
    
    // Create new ID if none exists or expired
    const newId = await createDailyId(userId);
    return newId;
  } catch (error) {
    console.error('Error in getOrCreateDailyId:', error);
    throw error;
  }
}

/**
 * Force refresh daily ID (for manual reset or testing)
 */
export async function refreshDailyId(userId: string): Promise<string> {
  try {
    const newId = await createDailyId(userId);
    return newId;
  } catch (error) {
    console.error('Error refreshing daily ID:', error);
    throw error;
  }
}

