'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import styles from './NotificationProvider.module.css';

type NotificationTone = 'info' | 'success' | 'warning' | 'error';

type NotificationInput = {
  title?: string;
  message: string;
  tone?: NotificationTone;
  duration?: number;
};

type NotificationRecord = {
  id: string;
  title?: string;
  message: string;
  tone: NotificationTone;
  duration: number;
  createdAt: number;
};

type NotificationContextValue = {
  notify: (input: NotificationInput) => string;
  dismiss: (id: string) => void;
};

const NotificationContext = createContext<NotificationContextValue | null>(null);

const ICONS: Record<NotificationTone, string> = {
  info: '💫',
  success: '✨',
  warning: '⚠️',
  error: '🛑',
};

const DEFAULT_DURATION = 5000;

function createId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2, 10);
}

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const timersRef = useRef<Record<string, number>>({});

  const dismiss = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((notification) => notification.id !== id));
    const timer = timersRef.current[id];
    if (timer) {
      window.clearTimeout(timer);
      delete timersRef.current[id];
    }
  }, []);

  const notify = useCallback(
    (input: NotificationInput) => {
      const id = createId();
      const tone = input.tone ?? 'info';
      const duration = Math.max(0, input.duration ?? DEFAULT_DURATION);

      const record: NotificationRecord = {
        id,
        tone,
        duration,
        title: input.title,
        message: input.message,
        createdAt: Date.now(),
      };

      setNotifications((prev) => [...prev, record]);

      if (duration > 0) {
        timersRef.current[id] = window.setTimeout(() => {
          dismiss(id);
        }, duration);
      }

      return id;
    },
    [dismiss],
  );

  useEffect(() => {
    return () => {
      Object.values(timersRef.current).forEach((timer) => window.clearTimeout(timer));
      timersRef.current = {};
    };
  }, []);

  const value = useMemo<NotificationContextValue>(
    () => ({
      notify,
      dismiss,
    }),
    [notify, dismiss],
  );

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <div className={styles.viewport} role="region" aria-live="polite" aria-label="GhostMate notifications">
        {notifications.map((notification) => (
          <article
            key={notification.id}
            className={`${styles.notification} ${styles[notification.tone]}`}
            data-tone={notification.tone}
          >
            <div className={styles.icon} aria-hidden>
              {ICONS[notification.tone]}
            </div>
            <div className={styles.content}>
              {notification.title && <h3 className={styles.title}>{notification.title}</h3>}
              <p className={styles.message}>{notification.message}</p>
            </div>
            <button
              type="button"
              className={styles.dismiss}
              aria-label="Dismiss notification"
              onClick={() => dismiss(notification.id)}
            >
              ✕
            </button>
            {notification.duration > 0 && (
              <span
                className={styles.timer}
                style={{ ['--duration' as string]: `${notification.duration}ms` }}
                aria-hidden
              />
            )}
          </article>
        ))}
      </div>
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}

