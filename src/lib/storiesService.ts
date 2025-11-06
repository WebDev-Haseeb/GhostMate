/**
 * Stories Service
 * 
 * Handles approved stories, queued stories, and story management.
 */

import {
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  setDoc,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import { QueuedStory, ApprovedStory } from '@/types/highlights';
import { getNextMidnight } from './dailyId';

/**
 * Get all queued stories (pending admin review)
 */
export async function getQueuedStories(): Promise<QueuedStory[]> {
  try {
    const queueRef = collection(db, 'queuedStories');
    // Simple query - no composite index needed
    const q = query(
      queueRef,
      orderBy('queuedAt', 'desc')
    );
    
    const snapshot = await getDocs(q);
    
    // Filter for pending status client-side
    return snapshot.docs
      .map(doc => ({
        storyId: doc.id,
        ...doc.data()
      } as QueuedStory))
      .filter(story => story.status === 'pending');
  } catch (error) {
    console.error('Error fetching queued stories:', error);
    return [];
  }
}

/**
 * Get a specific queued story
 */
export async function getQueuedStory(storyId: string): Promise<QueuedStory | null> {
  try {
    const storyRef = doc(db, 'queuedStories', storyId);
    const storyDoc = await getDoc(storyRef);
    
    if (storyDoc.exists()) {
      return {
        storyId: storyDoc.id,
        ...storyDoc.data()
      } as QueuedStory;
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching queued story:', error);
    return null;
  }
}

/**
 * Approve a queued story
 * Moves story to approvedStories collection
 */
export async function approveStory(
  storyId: string,
  adminId: string
): Promise<{ success: boolean; message: string }> {
  try {
    // Get the queued story
    const queuedStory = await getQueuedStory(storyId);
    
    if (!queuedStory) {
      return { success: false, message: 'Story not found' };
    }
    
    // Check if story is locked (not expired)
    if (queuedStory.locked) {
      const now = new Date();
      const expiresAt = queuedStory.lockExpiresAt instanceof Timestamp
        ? queuedStory.lockExpiresAt.toDate()
        : new Date(queuedStory.lockExpiresAt);
      
      if (expiresAt > now) {
        // Story is still locked, cannot approve
        return { success: false, message: 'Story is still locked. Wait until midnight PKT.' };
      }
    }
    
    // Create approved story
    const approvedStoryRef = doc(db, 'approvedStories', storyId);
    const approvedStory: ApprovedStory = {
      storyId,
      messageText: queuedStory.messageText,
      approvedAt: serverTimestamp(),
      approvedBy: adminId,
      expiresAt: Timestamp.fromDate(getExpiry24Hours()),
      metadata: {
        ...queuedStory.metadata,
        originalQueuedAt: queuedStory.queuedAt,
      }
    };
    
    await setDoc(approvedStoryRef, approvedStory);
    
    // Update queued story status
    const queuedStoryRef = doc(db, 'queuedStories', storyId);
    await updateDoc(queuedStoryRef, {
      status: 'approved',
      reviewedAt: serverTimestamp(),
      reviewedBy: adminId,
    });
    
    return { success: true, message: 'Story approved successfully' };
  } catch (error: any) {
    console.error('Error approving story:', error);
    return { success: false, message: error.message || 'Failed to approve story' };
  }
}

/**
 * Reject a queued story
 */
export async function rejectStory(
  storyId: string,
  adminId: string,
  reason?: string
): Promise<{ success: boolean; message: string }> {
  try {
    const queuedStoryRef = doc(db, 'queuedStories', storyId);
    
    // Update status to rejected
    await updateDoc(queuedStoryRef, {
      status: 'rejected',
      reviewedAt: serverTimestamp(),
      reviewedBy: adminId,
      rejectionReason: reason || 'Not approved for public feed',
    });
    
    return { success: true, message: 'Story rejected' };
  } catch (error: any) {
    console.error('Error rejecting story:', error);
    return { success: false, message: error.message || 'Failed to reject story' };
  }
}

/**
 * Get approved stories (visible in public feed)
 * Only returns stories that haven't expired (within 24 hours)
 */
export async function getApprovedStories(limitCount: number = 50): Promise<ApprovedStory[]> {
  try {
    const storiesRef = collection(db, 'approvedStories');
    const now = Timestamp.now();
    
    // Simple query - no composite index needed
    const q = query(
      storiesRef,
      where('expiresAt', '>', now),
      limit(limitCount)
    );
    
    const snapshot = await getDocs(q);
    
    // Sort by approvedAt client-side
    const stories = snapshot.docs.map(doc => ({
      storyId: doc.id,
      ...doc.data()
    } as ApprovedStory));
    
    return stories.sort((a, b) => {
      const timeA = a.approvedAt && typeof a.approvedAt !== 'string' 
        ? a.approvedAt.toMillis() 
        : 0;
      const timeB = b.approvedAt && typeof b.approvedAt !== 'string' 
        ? b.approvedAt.toMillis() 
        : 0;
      return timeB - timeA; // Most recent first
    });
  } catch (error) {
    console.error('Error fetching approved stories:', error);
    return [];
  }
}

/**
 * Delete expired stories (older than 24 hours)
 * This can be called manually or via a Cloud Function
 */
export async function deleteExpiredStories(): Promise<number> {
  try {
    const storiesRef = collection(db, 'approvedStories');
    const now = Timestamp.now();
    
    const q = query(
      storiesRef,
      where('expiresAt', '<=', now)
    );
    
    const snapshot = await getDocs(q);
    
    let deletedCount = 0;
    const deletePromises = snapshot.docs.map(async (docSnapshot) => {
      await deleteDoc(doc(db, 'approvedStories', docSnapshot.id));
      deletedCount++;
    });
    
    await Promise.all(deletePromises);
    
    return deletedCount;
  } catch (error) {
    console.error('Error deleting expired stories:', error);
    return 0;
  }
}

/**
 * Get expiry time (24 hours from now)
 */
function getExpiry24Hours(): Date {
  const now = new Date();
  now.setHours(now.getHours() + 24);
  return now;
}

