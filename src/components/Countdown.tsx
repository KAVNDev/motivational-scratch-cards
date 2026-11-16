import { useState, useEffect } from 'react';

interface CountdownProps {
  onMidnight?: () => void;
}

function getMsUntilMidnight(): number {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  return midnight.getTime() - now.getTime();
}

function formatTime(ms: number): string {
  const totalSecs = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(totalSecs / 3600);
  const m = Math.floor((totalSecs % 3600) / 60);
  const s = totalSecs % 60;
  return [h, m, s].map(v => String(v).padStart(2, '0')).join(':');
}

export function Countdown({ onMidnight }: CountdownProps): JSX.Element {
  const [msLeft, setMsLeft] = useState<number>(getMsUntilMidnight);

  useEffect(() => {
    const tick = (): void => {
      const remaining = getMsUntilMidnight();
      setMsLeft(remaining);
      if (remaining <= 0) {
        onMidnight?.();
      }
    };

    const interval = setInterval(tick, 1000);
    return (): void => clearInterval(interval);
  }, [onMidnight]);

  return (
    <div className="countdown" aria-live="off">
      <div className="countdown-label">Next card in</div>
      <div className="countdown-time" aria-label={`Next card in ${formatTime(msLeft)}`}>
        {formatTime(msLeft)}
      </div>
    </div>
  );
}
