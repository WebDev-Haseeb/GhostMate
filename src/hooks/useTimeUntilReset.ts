import { useState, useEffect } from 'react';

export function useTimeUntilReset(): string {
  const [timeUntilReset, setTimeUntilReset] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      // Pakistan timezone (PKT) is UTC+5
      const now = new Date();
      const pktOffset = 5 * 60; // minutes
      const localOffset = now.getTimezoneOffset(); // minutes from UTC
      
      // Convert to PKT
      const pktTime = new Date(now.getTime() + (pktOffset + localOffset) * 60000);
      
      // Calculate time until midnight PKT
      const midnight = new Date(pktTime);
      midnight.setHours(24, 0, 0, 0);
      
      const diff = midnight.getTime() - pktTime.getTime();
      
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      
      setTimeUntilReset(`${hours}h ${minutes}m`);
    };

    updateTime();
    const interval = setInterval(updateTime, 60000); // Update every minute
    
    return () => clearInterval(interval);
  }, []);

  return timeUntilReset;
}

