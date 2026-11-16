import { useState, useCallback, useRef } from 'react';
import { useToday } from './hooks/useToday';
import { useScratchStorage } from './hooks/useScratchStorage';
import { getMessageForDate } from './utils/dailyMessage';
import { fireConfetti } from './utils/confetti';
import { ScratchCard } from './components/ScratchCard';
import { Countdown } from './components/Countdown';
import { StreakBadge } from './components/StreakBadge';
import { HistoryDrawer } from './components/HistoryDrawer';
import { FloatingShapes } from './components/FloatingShapes';
import { BubblePop } from './components/BubblePop';
import { PetalLoader } from './components/PetalLoader';
import { Share } from './components/icons/Share';
import { History } from './components/icons/History';

function useDebugMode(): boolean {
  const params = new URLSearchParams(window.location.search);
  return params.get('debug') === '1';
}

function formatDisplayDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y!, m! - 1, d!);
  return date.toLocaleDateString(undefined, {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  });
}

function offsetDate(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y!, m! - 1, d!);
  date.setDate(date.getDate() + days);
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-');
}

function useToast(): { message: string | null; showToast: (msg: string) => void } {
  const [message, setMessage] = useState<string | null>(null);
  const timerRef = useRef<number | null>(null);
  const showToast = useCallback((msg: string): void => {
    if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    setMessage(msg);
    timerRef.current = window.setTimeout(() => setMessage(null), 2600);
  }, []);
  return { message, showToast };
}

export function App(): JSX.Element {
  const [loading, setLoading]   = useState<boolean>(true);
  const [visible, setVisible]   = useState<boolean>(false);  // fade-in after loader
  const realToday               = useToday();
  const isDebug                 = useDebugMode();
  const [debugDate, setDebugDate] = useState<string | null>(null);
  const today                   = isDebug && debugDate !== null ? debugDate : realToday;

  const { state, isRevealedToday, markRevealed, resetDay } = useScratchStorage(today);
  const message = getMessageForDate(today);

  const [showHistory, setShowHistory] = useState<boolean>(false);
  const { message: toastMsg, showToast } = useToast();
  const [resetCount, setResetCount]   = useState<number>(0);

  const handleLoaderDone = useCallback((): void => {
    setLoading(false);
    // tiny delay so React paints the app shell, then fade it in
    requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)));
  }, []);

  const handleReveal = useCallback((): void => {
    markRevealed(today);
    fireConfetti();
  }, [markRevealed, today]);

  const handleShare = useCallback(async (): Promise<void> => {
    const text = `Today's motivational card: "${message.text}"`;
    if (navigator.share) {
      try { await navigator.share({ title: 'Motivational Scratch Cards', text }); }
      catch { /* cancelled */ }
    } else {
      try {
        await navigator.clipboard.writeText(text);
        showToast('Copied to clipboard');
      } catch { showToast('Could not copy'); }
    }
  }, [message.text, showToast]);

  // Redo: show loader again, then reset card
  const handleRedo = useCallback((): void => {
    setVisible(false);
    setLoading(true);
    resetDay(today);
    setResetCount(c => c + 1);
  }, [resetDay, today]);

  const handleDebugReset = useCallback((): void => { resetDay(today); }, [resetDay, today]);
  const handleDebugNext  = useCallback((): void => { setDebugDate(offsetDate(debugDate ?? realToday, 1)); }, [debugDate, realToday]);
  const handleDebugPrev  = useCallback((): void => { setDebugDate(offsetDate(debugDate ?? realToday, -1)); }, [debugDate, realToday]);

  if (loading) {
    return <PetalLoader onDone={handleLoaderDone} />;
  }

  return (
    <div className={`app${visible ? ' app-visible' : ''}`}>
      <FloatingShapes />
      <BubblePop />

      <div className="app-inner">
        {/* ---- Header ---- */}
        <header className="app-header">
          <h1 className="app-title">Motivational<br />Scratch Cards</h1>
          <div className="app-date" aria-label={`Today is ${formatDisplayDate(today)}`}>
            {formatDisplayDate(today)}
          </div>
        </header>

        {/* ---- Scratch Card ---- */}
        <main style={{ width: '100%' }}>
          <ScratchCard
            key={`${today}-${resetCount}`}
            message={message.text}
            isAlreadyRevealed={isRevealedToday}
            onReveal={handleReveal}
          />
        </main>

        {/* ---- Progress hint ---- */}
        <p className="progress-hint" aria-live="polite">
          {isRevealedToday ? 'See you tomorrow' : "Scratch to reveal today's motivation"}
        </p>

        {/* ---- Post-reveal content ---- */}
        {isRevealedToday && (
          <>
            <StreakBadge streak={state.streak} />
            <Countdown onMidnight={() => window.location.reload()} />
            <div className="action-row">
              <button className="share-btn" onClick={handleShare} aria-label="Share today's card">
                <Share size={16} color="#FFF8F3" />
                Share
              </button>
              {state.history.length > 1 && (
                <button className="history-btn" onClick={() => setShowHistory(true)} aria-label="View past cards">
                  <History size={15} color="#5A2A3C" />
                  Past cards
                </button>
              )}
            </div>
          </>
        )}

        <footer className="app-footer"><span>Made with care</span></footer>
      </div>

      {showHistory && (
        <HistoryDrawer dates={state.history} onClose={() => setShowHistory(false)} />
      )}

      {toastMsg && (
        <div className="toast" role="status" aria-live="polite">{toastMsg}</div>
      )}

      {/* Redo button */}
      <button className="redo-btn" onClick={handleRedo} aria-label="Scratch this card again" title="Scratch again">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <polyline points="23 4 23 10 17 10" />
          <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
        </svg>
      </button>

      {isDebug && (
        <div className="debug-panel" aria-label="Debug controls">
          <span>DEBUG — {today}</span>
          <button onClick={handleDebugReset}>Reset today</button>
          <button onClick={handleDebugNext}>Next day</button>
          <button onClick={handleDebugPrev}>Previous day</button>
        </div>
      )}
    </div>
  );
}
