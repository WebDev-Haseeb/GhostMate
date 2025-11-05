/**
 * Chat Data Model Types
 * Supports one-to-one conversations only (no group chats)
 */

/**
 * Message in a chat
 */
export interface Message {
  id: string; // Unique message ID (Firebase push key)
  senderId: string; // Daily ID of sender
  recipientId: string; // Daily ID of recipient
  text: string; // Message content
  timestamp: number; // Unix timestamp in milliseconds
  read?: boolean; // Optional: Message read status
}

/**
 * One-to-one chat between two users
 */
export interface Chat {
  chatId: string; // Unique chat ID (sorted daily IDs concatenated)
  participants: {
    [dailyId: string]: boolean; // Map of participant daily IDs for quick lookup
  };
  participantIds: string[]; // Array of exactly 2 daily IDs
  lastMessage?: string; // Last message text (for preview)
  lastMessageTimestamp?: number; // Timestamp of last message
  createdAt: number; // Chat creation timestamp
  updatedAt: number; // Last update timestamp
}

/**
 * Chat list item for UI
 */
export interface ChatListItem {
  chatId: string;
  otherUserDailyId: string; // The other participant's daily ID
  lastMessage?: string;
  lastMessageTimestamp?: number;
  unreadCount?: number;
}

/**
 * New message data for sending
 */
export interface NewMessage {
  text: string;
  recipientId: string;
}

