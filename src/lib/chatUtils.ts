/**
 * Chat Utility Functions
 * Helper functions for managing one-to-one chat data
 */

/**
 * Generate a unique chat ID from two daily IDs
 * IDs are sorted alphabetically to ensure consistency
 * regardless of who initiates the chat
 * 
 * @example
 * generateChatId("12345678", "87654321") // "12345678_87654321"
 * generateChatId("87654321", "12345678") // "12345678_87654321" (same result)
 */
export function generateChatId(dailyId1: string, dailyId2: string): string {
  const sortedIds = [dailyId1, dailyId2].sort();
  return `${sortedIds[0]}_${sortedIds[1]}`;
}

/**
 * Extract the other participant's daily ID from a chat
 * Given a chat ID and current user's daily ID, return the other user's ID
 * 
 * @example
 * getOtherParticipantId("12345678_87654321", "12345678") // "87654321"
 */
export function getOtherParticipantId(chatId: string, myDailyId: string): string {
  const [id1, id2] = chatId.split('_');
  return id1 === myDailyId ? id2 : id1;
}

/**
 * Validate that a chat has exactly 2 participants (one-to-one only)
 */
export function isValidOneToOneChat(participantIds: string[]): boolean {
  return participantIds.length === 2;
}

/**
 * Check if a daily ID is a participant in a chat
 */
export function isParticipant(chatId: string, dailyId: string): boolean {
  return chatId.includes(dailyId);
}

/**
 * Format timestamp for display
 * Shows "Just now", "X min ago", "X hours ago", or date
 */
export function formatMessageTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) return 'Yesterday';
  
  const date = new Date(timestamp);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/**
 * Sanitize message text (basic XSS prevention)
 */
export function sanitizeMessageText(text: string): string {
  return text
    .trim()
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .substring(0, 1000); // Max 1000 characters
}

/**
 * Validate message text
 */
export function isValidMessage(text: string): boolean {
  const trimmed = text.trim();
  return trimmed.length > 0 && trimmed.length <= 1000;
}

