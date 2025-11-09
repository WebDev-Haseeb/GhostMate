/**
 * Chat Service - Real-Time Messaging with Firebase
 * Handles all chat operations with Firebase Realtime Database
 */

import { database } from './firebase';
import { ref, push, set, update, onValue, off, query, orderByChild, get, runTransaction } from 'firebase/database';
import { Chat, Message, NewMessage } from '@/types/chat';
import { generateChatId, sanitizeMessageText, isValidMessage } from './chatUtils';
import { getTodayMidnight } from './dailyId';

/**
 * Create or get a one-to-one chat between two users
 */
export async function createOrGetChat(myDailyId: string, otherDailyId: string): Promise<string> {
  const chatId = generateChatId(myDailyId, otherDailyId);
  const chatRef = ref(database, `chats/${chatId}`);
  
  // Check if chat already exists
  const snapshot = await get(chatRef);
  
  if (!snapshot.exists()) {
    // Create new chat
    const newChat: Partial<Chat> = {
      chatId,
      participants: {
        [myDailyId]: true,
        [otherDailyId]: true
      },
      participantIds: [myDailyId, otherDailyId],
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    
    await set(chatRef, newChat);
  }
  
  return chatId;
}

/**
 * Send a message in a chat
 */
export async function sendMessage(
  chatId: string,
  senderId: string,
  message: NewMessage
): Promise<void> {
  // Validate message
  if (!isValidMessage(message.text)) {
    throw new Error('Invalid message: Message must be 1-1000 characters');
  }
  
  // Sanitize message text
  const sanitizedText = sanitizeMessageText(message.text);
  
  // Create message object
  const newMessage: Omit<Message, 'id'> = {
    senderId,
    recipientId: message.recipientId,
    text: sanitizedText,
    timestamp: Date.now(),
    read: false
  };
  
  // Push message to database
  const messagesRef = ref(database, `chats/${chatId}/messages`);
  const newMessageRef = push(messagesRef);
  
  await set(newMessageRef, newMessage);
  
  // Update chat metadata
  const chatRef = ref(database, `chats/${chatId}`);
  await update(chatRef, {
    lastMessage: sanitizedText.substring(0, 100), // First 100 chars for preview
    lastMessageTimestamp: Date.now(),
    updatedAt: Date.now()
  });

  const recipientId = message.recipientId;
  const unreadRef = ref(database, `chats/${chatId}/unreadCounts/${recipientId}`);
  const transactionResult = await runTransaction(unreadRef, (current) => (current || 0) + 1);
  const newUnreadCount = transactionResult.snapshot?.val() ?? 0;

  const rootRef = ref(database);
  await update(rootRef, {
    [`userUnread/${recipientId}/${chatId}`]: newUnreadCount,
    [`userUnread/${senderId}/${chatId}`]: 0,
    [`chats/${chatId}/unreadCounts/${senderId}`]: 0
  });
}

/**
 * Send a system message (notification) in a chat
 * Used for favorites, connection notifications, etc.
 */
export async function sendSystemMessage(
  chatId: string,
  text: string
): Promise<void> {
  // Create system message object
  const systemMessage: Omit<Message, 'id'> = {
    senderId: 'system',
    recipientId: 'system',
    text,
    timestamp: Date.now(),
    read: false,
    isSystemMessage: true
  };
  
  // Push message to database
  const messagesRef = ref(database, `chats/${chatId}/messages`);
  const newMessageRef = push(messagesRef);
  
  await set(newMessageRef, systemMessage);
  
  // Update chat metadata
  const chatRef = ref(database, `chats/${chatId}`);
  await update(chatRef, {
    lastMessage: text.substring(0, 100),
    lastMessageTimestamp: Date.now(),
    updatedAt: Date.now()
  });
}

/**
 * Listen for new messages in a chat
 * Returns unsubscribe function
 * 
 * IMPORTANT: Automatically filters out messages older than midnight PKT
 * This provides client-side message expiry without needing Cloud Functions
 */
export function listenToMessages(
  chatId: string,
  callback: (messages: Message[]) => void
): () => void {
  const messagesRef = ref(database, `chats/${chatId}/messages`);
  const messagesQuery = query(messagesRef, orderByChild('timestamp'));
  
  const unsubscribe = onValue(messagesQuery, (snapshot) => {
    const messages: Message[] = [];
    const midnightTimestamp = getTodayMidnight().getTime();
    
    snapshot.forEach((childSnapshot) => {
      const message = childSnapshot.val() as Omit<Message, 'id'>;
      
      // Only include messages from today (after midnight PKT)
      if (message.timestamp >= midnightTimestamp) {
        messages.push({
          id: childSnapshot.key!,
          ...message
        });
      }
    });
    
    callback(messages);
  });
  
  return () => off(messagesQuery);
}

/**
 * Get chat metadata
 */
export async function getChat(chatId: string): Promise<Chat | null> {
  const chatRef = ref(database, `chats/${chatId}`);
  const snapshot = await get(chatRef);
  
  if (!snapshot.exists()) {
    return null;
  }
  
  return snapshot.val() as Chat;
}

export async function resetUnreadCount(chatId: string, dailyId: string): Promise<void> {
  const rootRef = ref(database);
  await update(rootRef, {
    [`chats/${chatId}/unreadCounts/${dailyId}`]: 0,
    [`userUnread/${dailyId}/${chatId}`]: 0
  });
}

/**
 * Get all chats for a user (by their daily ID)
 */
export async function getUserChats(dailyId: string): Promise<Chat[]> {
  const chatsRef = ref(database, 'chats');
  const snapshot = await get(chatsRef);
  
  if (!snapshot.exists()) {
    return [];
  }
  
  const chats: Chat[] = [];
  snapshot.forEach((childSnapshot) => {
    const chat = childSnapshot.val() as Chat;
    // Check if user is a participant
    if (chat.participants && chat.participants[dailyId]) {
      chats.push(chat);
    }
  });
  
  // Sort by last message timestamp (most recent first)
  return chats.sort((a, b) => {
    const timeA = a.lastMessageTimestamp || a.createdAt || 0;
    const timeB = b.lastMessageTimestamp || b.createdAt || 0;
    return timeB - timeA;
  });
}

/**
 * Mark message as read
 */
export async function markMessageAsRead(chatId: string, messageId: string): Promise<void> {
  const messageRef = ref(database, `chats/${chatId}/messages/${messageId}`);
  await set(ref(database, `chats/${chatId}/messages/${messageId}/read`), true);
}

/**
 * Delete a chat (admin only or for testing)
 */
export async function deleteChat(chatId: string): Promise<void> {
  const chatRef = ref(database, `chats/${chatId}`);
  await set(chatRef, null);
}

