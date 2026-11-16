import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'motivationalscratch:v1';

export interface ScratchState {
  lastRevealedDate: string | null;
  streak: number;
  longestStreak: number;
  history: string[]; // list of YYYY-MM-DD dates, capped at 365, newest first
}

const DEFAULT_STATE: ScratchState = {
  lastRevealedDate: null,
  streak: 0,
  longestStreak: 0,
  history: [],
};

function readStorage(): ScratchState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_STATE };
    const parsed = JSON.parse(raw) as Partial<ScratchState>;
    return {
      lastRevealedDate: parsed.lastRevealedDate ?? null,
      streak: parsed.streak ?? 0,
      longestStreak: parsed.longestStreak ?? 0,
      history: Array.isArray(parsed.history) ? parsed.history.slice(0, 365) : [],
    };
  } catch {
    return { ...DEFAULT_STATE };
  }
}

function writeStorage(state: ScratchState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Private mode or storage full — no crash
  }
}

/** Returns the YYYY-MM-DD string for the day before the given date string. */
function yesterday(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  d.setDate(d.getDate() - 1);
  const yyyy = d.getFullYear();
  const mm   = String(d.getMonth() + 1).padStart(2, '0');
  const dd   = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

interface UseScratchStorageReturn {
  state: ScratchState;
  isRevealedToday: boolean;
  markRevealed: (today: string) => void;
  resetDay: (today: string) => void;
}

export function useScratchStorage(today: string): UseScratchStorageReturn {
  const [state, setState] = useState<ScratchState>(readStorage);

  // When today changes (midnight rollover) re-sync from storage
  useEffect(() => {
    setState(readStorage());
  }, [today]);

  const isRevealedToday = state.lastRevealedDate === today;

  const markRevealed = useCallback((currentDay: string): void => {
    setState(prev => {
      const wasYesterday = prev.lastRevealedDate === yesterday(currentDay);
      const newStreak = wasYesterday ? prev.streak + 1 : 1;
      const newLongest = Math.max(prev.longestStreak, newStreak);

      // Prepend today and cap history at 365 entries
      const newHistory = [currentDay, ...prev.history.filter(d => d !== currentDay)].slice(0, 365);

      const next: ScratchState = {
        lastRevealedDate: currentDay,
        streak: newStreak,
        longestStreak: newLongest,
        history: newHistory,
      };
      writeStorage(next);
      return next;
    });
  }, []);

  const resetDay = useCallback((currentDay: string): void => {
    setState(prev => {
      const next: ScratchState = {
        ...prev,
        lastRevealedDate: prev.lastRevealedDate === currentDay ? null : prev.lastRevealedDate,
        history: prev.history.filter(d => d !== currentDay),
      };
      writeStorage(next);
      return next;
    });
  }, []);

  return { state, isRevealedToday, markRevealed, resetDay };
}
