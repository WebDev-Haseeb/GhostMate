export const ADMIN_SUPPORT_USER_ID = 'ghostmate_admin_support';
export const ADMIN_SUPPORT_DAILY_ID = 'ADMINHELP';
export const ADMIN_SUPPORT_DISPLAY_NAME = 'GhostMate';
export const ADMIN_SUPPORT_AVATAR = '/favicon.svg';

export function isAdminSupportDailyId(dailyId: string | null | undefined): boolean {
  if (!dailyId) {
    return false;
  }
  return dailyId.toUpperCase() === ADMIN_SUPPORT_DAILY_ID;
}

export function isAdminSupportUserId(userId: string | null | undefined): boolean {
  if (!userId) {
    return false;
  }
  return userId === ADMIN_SUPPORT_USER_ID;
}

