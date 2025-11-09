'use client';

import { useEffect, useRef } from 'react';
import { doc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { useDailyId } from '@/hooks/useDailyId';
import { getNextMidnight } from '@/lib/dailyId';

const HEARTBEAT_INTERVAL = 15000;

async function safelyDeletePresence(userId: string) {
  try {
    const presenceRef = doc(db, 'presence', userId);
    await deleteDoc(presenceRef);
  } catch (error) {
    console.error('Error clearing presence:', error);
  }
}

export default function PresenceManager() {
  const { user } = useAuth();
  const userId = user?.uid ?? null;
  const { dailyId } = useDailyId(userId);
  const heartbeatRef = useRef<NodeJS.Timeout | null>(null);
  const cleanupUserRef = useRef<string | null>(null);

  useEffect(() => {
    if (!userId || !dailyId) {
      return;
    }

    const presenceRef = doc(db, 'presence', userId);
    cleanupUserRef.current = userId;
    let stopped = false;

    const markOnline = async () => {
      try {
        await setDoc(
          presenceRef,
          {
            userId,
            dailyId,
            isOnline: true,
            lastSeen: serverTimestamp(),
            lastSeenMillis: Date.now(),
            updatedAt: serverTimestamp(),
            expiresAtMillis: getNextMidnight().getTime(),
          },
          { merge: true },
        );
      } catch (error) {
        console.error('Error marking presence:', error);
      }
    };

    const markOffline = async () => {
      if (stopped) {
        return;
      }
      stopped = true;
      if (heartbeatRef.current) {
        clearInterval(heartbeatRef.current);
        heartbeatRef.current = null;
      }
      await safelyDeletePresence(userId);
    };

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        markOnline();
      }
    };

    const handleBeforeUnload = () => {
      markOffline();
    };

    markOnline();
    heartbeatRef.current = setInterval(markOnline, HEARTBEAT_INTERVAL);

    window.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('pagehide', handleBeforeUnload);

    return () => {
      window.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('pagehide', handleBeforeUnload);
      markOffline();
    };
  }, [userId, dailyId]);

  useEffect(() => {
    if (!userId && cleanupUserRef.current) {
      safelyDeletePresence(cleanupUserRef.current);
      cleanupUserRef.current = null;
    }
  }, [userId]);

  return null;
}

