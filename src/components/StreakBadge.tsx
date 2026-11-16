import { Flame } from './icons/Flame';

interface StreakBadgeProps {
  streak: number;
}

export function StreakBadge({ streak }: StreakBadgeProps): JSX.Element | null {
  if (streak < 2) return null;

  return (
    <div className="streak-badge" role="status" aria-live="polite">
      <Flame size={16} color="#5A2A3C" />
      <span>{streak}-day streak</span>
    </div>
  );
}
