import { useEffect, useRef } from 'react';
import { getMessageForDate } from '../utils/dailyMessage';
import { Close } from './icons/Close';
import { History } from './icons/History';

interface HistoryDrawerProps {
  dates: string[];         // list of revealed dates, newest first
  onClose: () => void;
}

function formatDateLabel(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y!, m! - 1, d!);
  return date.toLocaleDateString(undefined, { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' });
}

export function HistoryDrawer({ dates, onClose }: HistoryDrawerProps): JSX.Element {
  const closeRef = useRef<HTMLButtonElement>(null);

  // Focus the close button when the drawer opens
  useEffect(() => {
    closeRef.current?.focus();
  }, []);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return (): void => document.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <>
      <div
        className="drawer-backdrop"
        onClick={onClose}
        role="presentation"
      />
      <div
        className="drawer"
        role="dialog"
        aria-label="Past cards"
        aria-modal="true"
      >
        <div className="drawer-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <History size={18} color="#5A2A3C" />
            <h2 className="drawer-title">Past Cards</h2>
          </div>
          <button
            ref={closeRef}
            className="drawer-close-btn"
            onClick={onClose}
            aria-label="Close past cards"
          >
            <Close size={22} color="#5A2A3C" />
          </button>
        </div>

        <div className="drawer-list" role="list">
          {dates.length === 0 ? (
            <p className="drawer-empty">No cards revealed yet. Come back tomorrow!</p>
          ) : (
            dates.map(date => {
              const msg = getMessageForDate(date);
              return (
                <div key={date} className="drawer-item" role="listitem">
                  <div className="drawer-item-date">{formatDateLabel(date)}</div>
                  <div className="drawer-item-text">{msg.text}</div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </>
  );
}
