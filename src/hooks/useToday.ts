import { useState, useEffect, useRef } from 'react';

/** Returns the current local date as YYYY-MM-DD. */
function getLocalDateStr(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm   = String(d.getMonth() + 1).padStart(2, '0');
  const dd   = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Returns today's date string (YYYY-MM-DD) and re-renders when the date rolls
 * over at local midnight.  Detection happens via:
 *   - A 1-minute polling interval
 *   - A visibilitychange listener (catches returning to the tab after midnight)
 */
export function useToday(): string {
  const [today, setToday] = useState<string>(getLocalDateStr);
  const latestRef = useRef(today);
  latestRef.current = today;

  useEffect(() => {
    function check(): void {
      const current = getLocalDateStr();
      if (current !== latestRef.current) {
        setToday(current);
      }
    }

    const interval = setInterval(check, 60_000);

    function onVisibility(): void {
      if (!document.hidden) check();
    }
    document.addEventListener('visibilitychange', onVisibility);

    return (): void => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  return today;
}
