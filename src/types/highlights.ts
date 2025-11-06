/**
 * Type definitions for Message Highlighting and Story Queue system
 * 
 * This module defines the data structures for:
 * - User message highlights
 * - Mutual highlight detection
 * - Admin story queue
 */

import { Timestamp } from 'firebase/firestore';

/**
 * Represents a single message highlight by a user
 * Stored in: highlights/{userId}/messages/{messageId}
 */
export interface MessageHighlight {
  userId: string;              // Firebase UID of user who highlighted
  chatId: string;              // Reference to the chat
  messageId: string;           // Reference to the specific message
  messageText: string;         // Content of the highlighted message (for queue)
  messageTimestamp: number;    // Original message timestamp (Unix ms)
  highlightedAt: number;       // When the highlight was created (Unix ms)
  otherUserId: string;         // The other participant in the chat (for mutual detection)
  otherUserDailyId: string;    // Daily ID of other user at time of highlight
  senderDailyId: string;       // Daily ID of message sender
  recipientDailyId: string;    // Daily ID of message recipient
}

/**
 * Represents a user's collection of highlights
 * Firestore structure: highlights/{userId}
 */
export interface UserHighlights {
  userId: string;
  highlights: {
    [messageId: string]: MessageHighlight;
  };
  updatedAt: number;
}

/**
 * Status of a queued story awaiting admin review
 */
export type StoryStatus = 'pending' | 'approved' | 'rejected';

/**
 * Represents a story queued for admin review
 * Created when both users highlight the same message
 * Stored in: queuedStories/{storyId}
 */
export interface QueuedStory {
  storyId: string;                    // Unique ID for the story
  messageText: string;                // The highlighted message content
  originalTimestamp: number;          // When message was sent (Unix ms)
  queuedAt: number;                   // When story was queued (Unix ms)
  chatId: string;                     // Reference (not displayed publicly)
  status: StoryStatus;                // Review status
  anonymized: boolean;                // Always true for privacy
  locked: boolean;                    // True when both users highlighted (prevents unfavorite)
  lockExpiresAt: number;              // When lock expires (midnight PKT)
  reviewedAt?: number;                // When admin reviewed (Unix ms)
  reviewedBy?: string;                // Admin UID who reviewed
  approvedUntil?: number;             // Expiry timestamp if approved (24h from approval)
  rejectionReason?: string;           // Optional reason for rejection
  
  // Metadata for admin context only (not displayed in stories feed)
  metadata: {
    user1Id: string;                  // Firebase UID (admin only)
    user2Id: string;                  // Firebase UID (admin only)
    user1DailyIdAtTime: string;       // For admin reference
    user2DailyIdAtTime: string;       // For admin reference
    senderDailyId: string;            // Who sent the message
    bothHighlightedAt: number;        // When mutual highlight occurred
  };
}

/**
 * Represents an approved story displayed in the global feed
 * Copied from queuedStories after admin approval
 * Stored in: approvedStories/{storyId}
 */
export interface ApprovedStory {
  storyId: string;
  messageText: string;
  originalTimestamp: number;          // For "X hours ago" display
  approvedAt: number;                 // When admin approved
  expiresAt: number;                  // Auto-delete after 24h
  viewCount: number;                  // How many users viewed
  likeCount?: number;                 // Optional: future feature
}

/**
 * Result of a highlight action (add/remove)
 */
export interface HighlightActionResult {
  success: boolean;
  message?: string;
  mutualHighlight?: boolean;          // True if this action created mutual highlight
  queuedStoryId?: string;             // ID of queued story if mutual
  highlight?: MessageHighlight;       // The created/removed highlight
}

/**
 * Input for creating a new highlight
 */
export interface CreateHighlightInput {
  userId: string;
  chatId: string;
  messageId: string;
  messageText: string;
  messageTimestamp: number;
  otherUserId: string;
  otherUserDailyId: string;
  senderDailyId: string;
  recipientDailyId: string;
}

/**
 * Real-time highlight status for a message
 * Used in UI to show highlight state
 */
export interface MessageHighlightStatus {
  messageId: string;
  highlightedByMe: boolean;           // Current user highlighted this
  highlightedByOther: boolean;        // Other user highlighted this
  isMutual: boolean;                  // Both users highlighted
  myHighlight?: MessageHighlight;     // Current user's highlight data
  queuedForStory: boolean;            // Queued for admin review
  isLocked: boolean;                  // Cannot unfavorite (mutual highlight active)
  lockExpiresAt?: number;             // When lock expires (midnight PKT)
}

