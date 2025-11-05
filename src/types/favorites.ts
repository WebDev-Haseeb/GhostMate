/**
 * Type definitions for Favorites and Connection Token System
 */

/**
 * A favorite record - represents one user favoriting another
 */
export interface Favorite {
  // The Firebase UID of the user who favorited
  userId: string;
  
  // The daily ID that was favorited
  favoritedDailyId: string;
  
  // When this favorite was created
  createdAt: number;
  
  // The user's daily ID at the time of favoriting (for history tracking)
  userDailyId: string;
}

/**
 * A mutual connection - created when two users favorite each other
 */
export interface Connection {
  // Unique connection token (persists beyond daily IDs)
  connectionToken: string;
  
  // Firebase UIDs of both users (sorted alphabetically for consistency)
  userIds: [string, string];
  
  // When the connection was first established
  createdAt: number;
  
  // Last time both users mutually favorited (for streak tracking)
  lastMutualFavoriteAt: number;
  
  // Current streak count (consecutive days of mutual re-favorites)
  streakCount: number;
  
  // Is this connection currently locked? (24-hour lock after mutual favorite)
  isLocked: boolean;
  
  // When the lock expires (Unix timestamp)
  lockExpiresAt: number | null;
  
  // Last date the streak was updated (to detect missed days)
  lastStreakDate: string; // Format: "YYYY-MM-DD" in PKT
  
  // Connection status
  status: 'active' | 'expired' | 'broken';
}

/**
 * User favorites document - stores all of a user's favorites
 */
export interface UserFavorites {
  userId: string;
  
  // Map of daily IDs this user has favorited
  // Key: favoritedDailyId, Value: Favorite object
  favorites: Record<string, Favorite>;
  
  // Last updated timestamp
  updatedAt: number;
}

/**
 * Daily connection check - tracks if users have favorited each other today
 */
export interface DailyConnectionCheck {
  // Format: "userId1_userId2" (sorted)
  connectionId: string;
  
  // Has user1 favorited user2 today?
  user1Favorited: boolean;
  
  // Has user2 favorited user1 today?
  user2Favorited: boolean;
  
  // Date this check is for (PKT timezone)
  date: string; // Format: "YYYY-MM-DD"
  
  // Timestamps for each favorite action
  user1FavoritedAt: number | null;
  user2FavoritedAt: number | null;
}

/**
 * Input for creating a new favorite
 */
export interface CreateFavoriteInput {
  userId: string;
  userDailyId: string;
  favoritedDailyId: string;
}

/**
 * Result of a favorite action
 */
export interface FavoriteActionResult {
  success: boolean;
  message?: string;
  mutualConnection?: boolean;
  connectionToken?: string;
  isLocked?: boolean;
  lockExpiresAt?: number;
}

