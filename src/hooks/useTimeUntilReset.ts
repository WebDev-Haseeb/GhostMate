import { useState, useEffect } from 'react';
import { getTimeUntilMidnight } from '@/lib/dailyId';

export interface TimeUntilReset {
  hours: number;
  minutes: number;
  seconds: number;
  totalMs: number;
}

export function useTimeUntilReset(): TimeUntilReset | null {
  const [timeUntilReset, setTimeUntilReset] = useState<TimeUntilReset | null>(null);

  useEffect(() => {
    const updateTime = () => {
      const time = getTimeUntilMidnight();
      setTimeUntilReset({
        hours: time.hours,
        minutes: time.minutes,
        seconds: time.seconds,
        totalMs: time.totalMs
      });
    };

    // Update immediately
    updateTime();
    
    // Update every second
    const interval = setInterval(updateTime, 1000);
    
    return () => clearInterval(interval);
  }, []);

  return timeUntilReset;
}

