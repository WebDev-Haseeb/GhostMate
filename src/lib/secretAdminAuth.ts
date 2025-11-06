/**
 * Secret Admin Authentication
 * 
 * Simple authentication system using hardcoded credentials from .env
 * No Firebase admin collection needed - just check credentials and set cookie
 */

import Cookies from 'js-cookie';

const ADMIN_SESSION_KEY = 'ghost_admin_session';
const SESSION_DURATION_DAYS = 7; // Session lasts 7 days

/**
 * Verify admin credentials against .env values
 */
export function verifyAdminCredentials(email: string, password: string): boolean {
  const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL;
  const adminPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    console.error('Admin credentials not configured in .env');
    return false;
  }

  return email === adminEmail && password === adminPassword;
}

/**
 * Set admin session cookie
 */
export function setAdminSession(): void {
  // Create a simple session token (in production, use JWT or more secure method)
  const sessionToken = btoa(`admin:${Date.now()}`);
  Cookies.set(ADMIN_SESSION_KEY, sessionToken, { 
    expires: SESSION_DURATION_DAYS,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production'
  });
}

/**
 * Check if admin session is valid
 */
export function isAdminSessionValid(): boolean {
  const session = Cookies.get(ADMIN_SESSION_KEY);
  return !!session;
}

/**
 * Clear admin session (logout)
 */
export function clearAdminSession(): void {
  Cookies.remove(ADMIN_SESSION_KEY);
}

/**
 * Get admin session info
 */
export function getAdminSession(): string | undefined {
  return Cookies.get(ADMIN_SESSION_KEY);
}

