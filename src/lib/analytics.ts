import type { Analytics } from 'firebase/analytics';
import app from './firebase';

let analyticsPromise: Promise<Analytics | null> | null = null;

export async function getAnalyticsInstance(): Promise<Analytics | null> {
  if (typeof window === 'undefined') {
    return null;
  }

  if (!process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID) {
    return null;
  }

  if (!analyticsPromise) {
    analyticsPromise = import('firebase/analytics')
      .then(async ({ getAnalytics, isSupported }) => {
        try {
          const supported = await isSupported();
          if (!supported) {
            console.warn('[analytics] Analytics not supported in this environment');
            return null;
          }
          return getAnalytics(app);
        } catch (error) {
          console.warn('[analytics] Failed to initialize analytics:', error);
          return null;
        }
      })
      .catch((error) => {
        console.warn('[analytics] Failed to load analytics package:', error);
        return null;
      });
  }

  return analyticsPromise;
}

export async function logAnalyticsEvent(
  eventName: string,
  eventParams?: Record<string, unknown>
): Promise<void> {
  try {
    const analytics = await getAnalyticsInstance();
    if (!analytics) return;

    const { logEvent } = await import('firebase/analytics');
    logEvent(analytics, eventName, eventParams);
  } catch (error) {
    console.warn('[analytics] Failed to log event', eventName, error);
  }
}

