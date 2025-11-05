/**
 * Chat Cleanup Utilities
 * Functions to clean up old messages from Firebase Realtime Database
 */

import { database } from './firebase';
import { ref, get, remove } from 'firebase/database';
import { getTodayMidnight } from './dailyId';

/**
 * Delete all messages older than midnight PKT from all chats
 * This helps minimize storage costs and keeps the database clean
 * 
 * Returns: Number of messages deleted
 */
export async function cleanupOldMessages(): Promise<number> {
  const chatsRef = ref(database, 'chats');
  const midnightTimestamp = getTodayMidnight().getTime();
  let deletedCount = 0;

  try {
    const chatsSnapshot = await get(chatsRef);
    
    if (!chatsSnapshot.exists()) {
      return 0;
    }

    const deletePromises: Promise<void>[] = [];

    chatsSnapshot.forEach((chatSnapshot) => {
      const chatId = chatSnapshot.key;
      if (!chatId) return;

      const messagesData = chatSnapshot.child('messages').val();
      if (!messagesData) return;

      Object.keys(messagesData).forEach((messageId) => {
        const message = messagesData[messageId];
        
        // If message is older than midnight, mark for deletion
        if (message.timestamp < midnightTimestamp) {
          const messageRef = ref(database, `chats/${chatId}/messages/${messageId}`);
          deletePromises.push(remove(messageRef));
          deletedCount++;
        }
      });
    });

    await Promise.all(deletePromises);
    // Silently cleaned up old messages
    
    return deletedCount;
  } catch (error) {
    console.error('Error cleaning up old messages:', error);
    throw error;
  }
}

/**
 * Delete ALL messages from ALL chats (use with caution!)
 * Useful for testing or complete database reset
 */
export async function deleteAllMessages(): Promise<number> {
  const chatsRef = ref(database, 'chats');
  let deletedCount = 0;

  try {
    const chatsSnapshot = await get(chatsRef);
    
    if (!chatsSnapshot.exists()) {
      return 0;
    }

    const deletePromises: Promise<void>[] = [];

    chatsSnapshot.forEach((chatSnapshot) => {
      const chatId = chatSnapshot.key;
      if (!chatId) return;

      const messagesData = chatSnapshot.child('messages').val();
      if (!messagesData) return;

      Object.keys(messagesData).forEach((messageId) => {
        const messageRef = ref(database, `chats/${chatId}/messages/${messageId}`);
        deletePromises.push(remove(messageRef));
        deletedCount++;
      });
    });

    await Promise.all(deletePromises);
    // Silently deleted all messages
    
    return deletedCount;
  } catch (error) {
    console.error('Error deleting all messages:', error);
    throw error;
  }
}

/**
 * Delete a specific chat and all its messages
 */
export async function deleteChat(chatId: string): Promise<void> {
  const chatRef = ref(database, `chats/${chatId}`);
  await remove(chatRef);
  // Silently deleted chat
}

/**
 * Get database storage statistics
 */
export async function getDatabaseStats(): Promise<{
  totalChats: number;
  totalMessages: number;
  oldMessages: number;
  todayMessages: number;
}> {
  const chatsRef = ref(database, 'chats');
  const midnightTimestamp = getTodayMidnight().getTime();
  
  const stats = {
    totalChats: 0,
    totalMessages: 0,
    oldMessages: 0,
    todayMessages: 0
  };

  try {
    const chatsSnapshot = await get(chatsRef);
    
    if (!chatsSnapshot.exists()) {
      return stats;
    }

    chatsSnapshot.forEach((chatSnapshot) => {
      stats.totalChats++;
      
      const messagesData = chatSnapshot.child('messages').val();
      if (!messagesData) return;

      Object.values(messagesData).forEach((message: any) => {
        stats.totalMessages++;
        
        if (message.timestamp < midnightTimestamp) {
          stats.oldMessages++;
        } else {
          stats.todayMessages++;
        }
      });
    });

    return stats;
  } catch (error) {
    console.error('Error getting database stats:', error);
    throw error;
  }
}

