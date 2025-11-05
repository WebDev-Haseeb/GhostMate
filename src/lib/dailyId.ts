/**
 * Daily ID Generation and Management Utilities
 * Handles anonymous 8-digit numeric IDs that reset daily at midnight PKT
 */

/**
 * Generate a random 8-digit numeric ID
 */
export function generateDailyId(): string {
  const min = 10000000;
  const max = 99999999;
  const id = Math.floor(Math.random() * (max - min + 1)) + min;
  return id.toString();
}

/**
 * Get Pakistan timezone offset (PKT = UTC+5)
 */
function getPakistanTime(): Date {
  const now = new Date();
  const pktOffset = 5 * 60; // 5 hours in minutes
  const utcTime = now.getTime() + (now.getTimezoneOffset() * 60000);
  const pktTime = new Date(utcTime + (pktOffset * 60000));
  return pktTime;
}

/**
 * Get the start of the current day (midnight) in PKT
 */
export function getTodayMidnight(): Date {
  const pktNow = getPakistanTime();
  const midnight = new Date(pktNow.getFullYear(), pktNow.getMonth(), pktNow.getDate(), 0, 0, 0, 0);
  const pktOffset = 5 * 60;
  const localOffset = new Date().getTimezoneOffset();
  const adjustment = (pktOffset + localOffset) * 60000;
  return new Date(midnight.getTime() - adjustment);
}

/**
 * Get the start of the next day (midnight) in PKT
 */
export function getNextMidnight(): Date {
  const today = getTodayMidnight();
  const tomorrow = new Date(today.getTime() + (24 * 60 * 60 * 1000));
  return tomorrow;
}

/**
 * Check if a timestamp is from today
 */
export function isToday(timestamp: Date): boolean {
  const todayMidnight = getTodayMidnight();
  return timestamp >= todayMidnight;
}

/**
 * Check if an ID has expired (past midnight)
 */
export function isIdExpired(createdAt: Date): boolean {
  return !isToday(createdAt);
}

/**
 * Format daily ID for display with spacing
 */
export function formatDailyId(id: string): string {
  if (id.length !== 8) return id;
  return `${id.slice(0, 4)} ${id.slice(4)}`;
}

/**
 * Calculate time until next midnight reset (PKT)
 */
export function getTimeUntilMidnight(): {
  hours: number;
  minutes: number;
  seconds: number;
  totalMs: number;
} {
  const now = new Date();
  const nextMidnight = getNextMidnight();
  const totalMs = nextMidnight.getTime() - now.getTime();
  
  const hours = Math.floor(totalMs / (1000 * 60 * 60));
  const minutes = Math.floor((totalMs % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((totalMs % (1000 * 60)) / 1000);
  
  return { hours, minutes, seconds, totalMs };
}
