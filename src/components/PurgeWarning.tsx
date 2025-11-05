'use client';

import { useEffect, useState } from 'react';
import { getTimeUntilMidnight } from '@/lib/dailyId';
import styles from './PurgeWarning.module.css';

export default function PurgeWarning() {
  const [timeUntil, setTimeUntil] = useState(getTimeUntilMidnight());

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeUntil(getTimeUntilMidnight());
    }, 1000); // Update every second

    return () => clearInterval(interval);
  }, []);

  const { hours, minutes, seconds } = timeUntil;

  return (
    <div className={styles.warning}>
      <span className={styles.icon}>⚠️</span>
      <div className={styles.text}>
        <strong>Messages expire at midnight PKT</strong>
        <span className={styles.countdown}>
          {hours}h {minutes}m {seconds}s remaining
        </span>
      </div>
    </div>
  );
}

