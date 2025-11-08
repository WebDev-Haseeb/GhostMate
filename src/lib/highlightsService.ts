/**
 * Highlights Service
 * 
 * Manages message highlighting and story queue functionality:
 * - Add/remove highlights for messages
 * - Detect mutual highlights
 * - Queue stories for admin review
 * - Real-time listeners for highlight status
 */

import {
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  collection,
  query,
  where,
  getDocs,
  Timestamp,
  runTransaction,
  onSnapshot,
  Unsubscribe
} from 'firebase/firestore';
import { db } from './firebase';
import { getNextMidnight } from './dailyId';
import type {
  MessageHighlight,
  QueuedStory,
  HighlightActionResult,
  CreateHighlightInput,
  MessageHighlightStatus,
  UserHighlights
} from '@/types/highlights';

/**
 * Generate a unique story ID from chat and message IDs
 */
export function generateStoryId(chatId: string, messageId: string): string {
  return `${chatId}_${messageId}`;
}

/**
 * Get the highlights collection path for a user
 */
export function getUserHighlightsPath(userId: string): string {
  return `highlights/${userId}`;
}

/**
 * Get a specific highlight document path
 */
export function getHighlightPath(userId: string, messageId: string): string {
  return `${getUserHighlightsPath(userId)}/messages/${messageId}`;
}

/**
 * Check if a message is highlighted by a user
 */
export async function isMessageHighlighted(
  userId: string,
  messageId: string
): Promise<boolean> {
  try {
    const highlightRef = doc(db, 'highlights', userId, 'messages', messageId);
    const highlightDoc = await getDoc(highlightRef);
    return highlightDoc.exists();
  } catch (error) {
    console.error('Error checking highlight status:', error);
    return false;
  }
}

/**
 * Get a user's highlight for a specific message
 */
export async function getUserHighlight(
  userId: string,
  messageId: string
): Promise<MessageHighlight | null> {
  try {
    const highlightRef = doc(db, 'highlights', userId, 'messages', messageId);
    const highlightDoc = await getDoc(highlightRef);
    
    if (!highlightDoc.exists()) {
      return null;
    }
    
    return highlightDoc.data() as MessageHighlight;
  } catch (error) {
    console.error('Error getting user highlight:', error);
    return null;
  }
}

/**
 * Check if both users have highlighted the same message
 */
export async function checkMutualHighlight(
  user1Id: string,
  user2Id: string,
  messageId: string
): Promise<boolean> {
  try {
    const [highlight1, highlight2] = await Promise.all([
      getUserHighlight(user1Id, messageId),
      getUserHighlight(user2Id, messageId)
    ]);
    
    return highlight1 !== null && highlight2 !== null;
  } catch (error) {
    console.error('Error checking mutual highlight:', error);
    return false;
  }
}

/**
 * Get all highlights for a specific chat (from current user)
 */
export async function getChatHighlights(
  userId: string,
  chatId: string
): Promise<MessageHighlight[]> {
  try {
    const highlightsRef = collection(db, 'highlights', userId, 'messages');
    const q = query(highlightsRef, where('chatId', '==', chatId));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => doc.data() as MessageHighlight);
  } catch (error) {
    console.error('Error getting chat highlights:', error);
    return [];
  }
}

/**
 * Check if a queued story is locked (prevents unfavorite)
 */
export function isStoryLocked(story: QueuedStory): boolean {
  if (!story.locked) return false;
  const now = Date.now();
  return story.lockExpiresAt > now;
}

/**
 * Get queued story for a message (if exists)
 */
export async function getQueuedStory(chatId: string, messageId: string): Promise<QueuedStory | null> {
  try {
    const storyId = generateStoryId(chatId, messageId);
    const storyRef = doc(db, 'queuedStories', storyId);
    const storyDoc = await getDoc(storyRef);
    
    if (!storyDoc.exists()) {
      return null;
    }
    
    return storyDoc.data() as QueuedStory;
  } catch (error) {
    console.error('Error getting queued story:', error);
    return null;
  }
}

/**
 * Listen to real-time highlight status for a message
 */
export function listenToMessageHighlightStatus(
  userId: string,
  otherUserId: string,
  messageId: string,
  chatId: string,
  callback: (status: MessageHighlightStatus) => void
): Unsubscribe {
  const myHighlightRef = doc(db, 'highlights', userId, 'messages', messageId);
  const otherHighlightRef = doc(db, 'highlights', otherUserId, 'messages', messageId);
  const storyId = generateStoryId(chatId, messageId);
  const storyRef = doc(db, 'queuedStories', storyId);
  
  let myHighlightData: MessageHighlight | null = null;
  let otherHighlightExists = false;
  let queuedStoryData: QueuedStory | null = null;
  let unsubscribed = false;
  
  const updateStatus = () => {
    if (unsubscribed) return;
    
    const isMutual = myHighlightData !== null && otherHighlightExists;
    const isLocked = queuedStoryData !== null && isStoryLocked(queuedStoryData);
    
    const status: MessageHighlightStatus = {
      messageId,
      highlightedByMe: myHighlightData !== null,
      highlightedByOther: otherHighlightExists,
      isMutual,
      myHighlight: myHighlightData || undefined,
      queuedForStory: isMutual,
      isLocked,
      lockExpiresAt: queuedStoryData?.lockExpiresAt
    };
    
    callback(status);
  };
  
  const unsubMy = onSnapshot(myHighlightRef, (doc) => {
    if (doc.exists()) {
      myHighlightData = doc.data() as MessageHighlight;
    } else {
      myHighlightData = null;
    }
    updateStatus();
  });
  
  const unsubOther = onSnapshot(otherHighlightRef, (doc) => {
    otherHighlightExists = doc.exists();
    updateStatus();
  });
  
  const unsubStory = onSnapshot(storyRef, (doc) => {
    if (doc.exists()) {
      queuedStoryData = doc.data() as QueuedStory;
    } else {
      queuedStoryData = null;
    }
    updateStatus();
  });
  
  return () => {
    unsubscribed = true;
    unsubMy();
    unsubOther();
    unsubStory();
  };
}

/**
 * Add a highlight to a message
 * Creates a queued story if both users have highlighted
 */
export async function addHighlight(
  input: CreateHighlightInput
): Promise<HighlightActionResult> {
  const {
    userId,
    chatId,
    messageId,
    messageText,
    messageTimestamp,
    otherUserId,
    otherUserDailyId,
    senderDailyId,
    recipientDailyId
  } = input;
  
  // Validate input
  if (!userId || !chatId || !messageId || !messageText || !otherUserId) {
    return {
      success: false,
      message: 'Missing required fields'
    };
  }
  
  try {
    const result = await runTransaction(db, async (transaction) => {
      // === PHASE 1: ALL READS ===
      const myHighlightRef = doc(db, 'highlights', userId, 'messages', messageId);
      const myHighlightSnap = await transaction.get(myHighlightRef);
      
      const otherHighlightRef = doc(db, 'highlights', otherUserId, 'messages', messageId);
      const otherHighlightSnap = await transaction.get(otherHighlightRef);
      
      const storyId = generateStoryId(chatId, messageId);
      const queuedStoryRef = doc(db, 'queuedStories', storyId);
      const queuedStorySnap = await transaction.get(queuedStoryRef);
      
      // === PHASE 2: PROCESS DATA ===
      
      // Check if already highlighted
      if (myHighlightSnap.exists()) {
        return {
          success: false,
          message: 'Message already highlighted'
        };
      }
      
      // Create highlight object
      const highlight: MessageHighlight = {
        userId,
        chatId,
        messageId,
        messageText,
        messageTimestamp,
        highlightedAt: Date.now(),
        otherUserId,
        otherUserDailyId,
        senderDailyId,
        recipientDailyId
      };
      
      // Check for mutual highlight
      const isMutual = otherHighlightSnap.exists();
      
      // === PHASE 3: ALL WRITES ===
      
      // Save the highlight
      transaction.set(myHighlightRef, highlight);
      
      // If mutual and not already queued, create queued story
      if (isMutual && !queuedStorySnap.exists()) {
        const otherHighlight = otherHighlightSnap.data() as MessageHighlight;
        const lockExpiresAt = getNextMidnight().getTime();  // Convert Date to Unix timestamp
        
        const queuedStory: QueuedStory = {
          storyId,
          messageText,
          originalTimestamp: messageTimestamp,
          queuedAt: Date.now(),
          chatId,
          status: 'pending',
          anonymized: true,
          locked: true,                          // Lock prevents unfavorite
          lockExpiresAt,                         // Expires at midnight PKT
          metadata: {
            user1Id: userId,
            user2Id: otherUserId,
            user1DailyIdAtTime: userId === senderDailyId ? senderDailyId : recipientDailyId,
            user2DailyIdAtTime: otherUserDailyId,
            senderDailyId,
            bothHighlightedAt: Date.now()
          }
        };
        
        transaction.set(queuedStoryRef, queuedStory);
        
        return {
          success: true,
          message: '💫 Both of you highlighted this! Message sent to admin for review and locked until midnight.',
          mutualHighlight: true,
          queuedStoryId: storyId,
          highlight
        };
      }
      
      return {
        success: true,
        message: 'Message highlighted',
        mutualHighlight: false,
        highlight
      };
    });
    
    return result;
  } catch (error: any) {
    console.error('Error adding highlight:', error);
    return {
      success: false,
      message: error.message || 'Failed to highlight message'
    };
  }
}

/**
 * Remove a highlight from a message
 * Checks if the highlight is locked (mutual highlight) before allowing removal
 */
export async function removeHighlight(
  userId: string,
  messageId: string,
  chatId: string
): Promise<HighlightActionResult> {
  if (!userId || !messageId || !chatId) {
    return {
      success: false,
      message: 'Missing required fields'
    };
  }
  
  try {
    const highlightRef = doc(db, 'highlights', userId, 'messages', messageId);
    const highlightSnap = await getDoc(highlightRef);
    
    if (!highlightSnap.exists()) {
      return {
        success: false,
        message: 'Highlight not found'
      };
    }
    
    // Check if there's a locked queued story
    const queuedStory = await getQueuedStory(chatId, messageId);
    if (queuedStory && isStoryLocked(queuedStory)) {
      const timeRemaining = Math.ceil((queuedStory.lockExpiresAt - Date.now()) / (1000 * 60 * 60));
      return {
        success: false,
        message: `🔒 Both of you highlighted this! Cannot remove until midnight (~${timeRemaining}h remaining).`
      };
    }
    
    await deleteDoc(highlightRef);
    
    return {
      success: true,
      message: 'Highlight removed'
    };
  } catch (error: any) {
    console.error('Error removing highlight:', error);
    return {
      success: false,
      message: error.message || 'Failed to remove highlight'
    };
  }
}

/**
 * Toggle highlight status for a message
 */
export async function toggleHighlight(
  input: CreateHighlightInput
): Promise<HighlightActionResult> {
  const isHighlighted = await isMessageHighlighted(input.userId, input.messageId);
  
  if (isHighlighted) {
    return removeHighlight(input.userId, input.messageId, input.chatId);
  } else {
    return addHighlight(input);
  }
}

/**
 * Get all queued stories pending admin review
 */
export async function getQueuedStories(): Promise<QueuedStory[]> {
  try {
    const queuedStoriesRef = collection(db, 'queuedStories');
    const q = query(queuedStoriesRef, where('status', '==', 'pending'));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => doc.data() as QueuedStory);
  } catch (error) {
    console.error('Error getting queued stories:', error);
    return [];
  }
}

