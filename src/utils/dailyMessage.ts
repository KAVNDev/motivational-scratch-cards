import { messages, type Message } from '../data/messages';
import { epochDate } from '../config';

export function daysSinceEpoch(dateStr: string): number {
  const [ey, em, ed] = epochDate.split('-').map(Number);
  const [ty, tm, td] = dateStr.split('-').map(Number);
  const epoch  = Date.UTC(ey!, em! - 1, ed!);
  const target = Date.UTC(ty!, tm! - 1, td!);
  return Math.floor((target - epoch) / 86_400_000);
}

/**
 * Seeded pseudo-random using the day index as seed.
 * Produces a stable but non-sequential index — every refresh on the same
 * day returns the same message, but consecutive days feel random.
 */
function seededIndex(seed: number, length: number): number {
  // xorshift32 — one round is enough for our purpose
  let s = (seed + 1) >>> 0; // ensure unsigned, avoid seed=0
  s ^= s << 13;
  s ^= s >>> 17;
  s ^= s << 5;
  return ((s >>> 0) % length + length) % length;
}

export function getMessageForDate(dateStr: string): Message {
  const day = daysSinceEpoch(dateStr);
  const idx = seededIndex(day, messages.length);
  return messages[idx]!;
}
