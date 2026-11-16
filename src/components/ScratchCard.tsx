import {
  useRef,
  useEffect,
  useCallback,
  useState,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import { drawFoil, scratchStroke, calcScratchedPercent } from '../utils/scratchCanvas';
import { Sparkle } from './icons/Sparkle';
import { senderName, recipientName } from '../config';

/** Physical pixels per CSS pixel. Used to size the canvas for crisp retina rendering. */
function dpr(): number {
  return window.devicePixelRatio || 1;
}

const REVEAL_THRESHOLD = 55; // percent scratched to auto-reveal
const SCRATCH_WIDTH_CSS = 32; // CSS pixels stroke width
const PERCENT_THROTTLE_MS = 150;

interface ScratchCardProps {
  message: string;
  isAlreadyRevealed: boolean;
  onReveal: () => void;
}

export function ScratchCard({ message, isAlreadyRevealed, onReveal }: ScratchCardProps): JSX.Element {
  const canvasRef     = useRef<HTMLCanvasElement>(null);
  const wrapperRef    = useRef<HTMLDivElement>(null);
  // Keep latest onReveal in a ref so handlers don't become stale
  const onRevealRef   = useRef<() => void>(onReveal);
  onRevealRef.current = onReveal;

  const revealedRef   = useRef<boolean>(isAlreadyRevealed);
  const scratchingRef = useRef<boolean>(false);
  const lastPosRef    = useRef<{ x: number; y: number } | null>(null);
  const lastCheckRef  = useRef<number>(0);

  const [isFading, setIsFading] = useState<boolean>(false);
  const [isHidden, setIsHidden] = useState<boolean>(isAlreadyRevealed);
  const [revealed, setRevealed] = useState<boolean>(isAlreadyRevealed);

  // ----------------------------------------------------------------
  // Canvas setup: size to wrapper's physical pixels and draw foil
  // ----------------------------------------------------------------
  const initCanvas = useCallback((): void => {
    const canvas  = canvasRef.current;
    const wrapper = wrapperRef.current;
    if (!canvas || !wrapper) return;
    if (revealedRef.current) return;

    const rect  = wrapper.getBoundingClientRect();
    const scale = dpr();
    const physW = Math.round(rect.width  * scale);
    const physH = Math.round(rect.height * scale);

    canvas.width  = physW;
    canvas.height = physH;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    drawFoil(ctx, physW, physH);
  }, []);

  useEffect(() => {
    initCanvas();

    const observer = new ResizeObserver(() => {
      if (!revealedRef.current) initCanvas();
    });
    if (wrapperRef.current) observer.observe(wrapperRef.current);
    return (): void => observer.disconnect();
  }, [initCanvas]);

  // ----------------------------------------------------------------
  // Reveal: fade the canvas out, then hide it and fire the callback
  // ----------------------------------------------------------------
  const triggerReveal = useCallback((): void => {
    if (revealedRef.current) return;
    revealedRef.current = true;

    if ('vibrate' in navigator) {
      try { navigator.vibrate(10); } catch { /* ignore */ }
    }

    setIsFading(true);
    setTimeout((): void => {
      setIsHidden(true);
      setRevealed(true);
      onRevealRef.current();
    }, 620);
  }, []);

  // ----------------------------------------------------------------
  // Helpers (not callbacks — they read refs, not props/state)
  // ----------------------------------------------------------------
  function getCanvasXY(e: ReactPointerEvent<HTMLCanvasElement>): { x: number; y: number } {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect  = canvas.getBoundingClientRect();
    const scale = dpr();
    return {
      x: (e.clientX - rect.left) * scale,
      y: (e.clientY - rect.top)  * scale,
    };
  }

  function checkPercent(): void {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const pct = calcScratchedPercent(ctx, canvas.width, canvas.height);
    if (pct >= REVEAL_THRESHOLD) triggerReveal();
  }

  // ----------------------------------------------------------------
  // Pointer event handlers
  // All are defined inline (not memoised) because the canvas element
  // is never re-rendered as a sibling; re-creating them is free.
  // ----------------------------------------------------------------
  function handlePointerDown(e: ReactPointerEvent<HTMLCanvasElement>): void {
    if (revealedRef.current) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    scratchingRef.current = true;
    const pos = getCanvasXY(e);
    lastPosRef.current = pos;

    // Single dot on touch-down
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    scratchStroke(ctx, pos.x, pos.y, pos.x, pos.y, SCRATCH_WIDTH_CSS * dpr());
  }

  function handlePointerMove(e: ReactPointerEvent<HTMLCanvasElement>): void {
    if (!scratchingRef.current || revealedRef.current) return;
    e.preventDefault();

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const current = getCanvasXY(e);
    const last    = lastPosRef.current ?? current;

    scratchStroke(ctx, last.x, last.y, current.x, current.y, SCRATCH_WIDTH_CSS * dpr());
    lastPosRef.current = current;

    const now = performance.now();
    if (now - lastCheckRef.current > PERCENT_THROTTLE_MS) {
      lastCheckRef.current = now;
      checkPercent();
    }
  }

  function handlePointerUp(e: ReactPointerEvent<HTMLCanvasElement>): void {
    if (!scratchingRef.current) return;
    e.preventDefault();
    scratchingRef.current = false;
    lastPosRef.current = null;
    if (!revealedRef.current) checkPercent();
  }

  function handlePointerLeave(e: ReactPointerEvent<HTMLCanvasElement>): void {
    if (!scratchingRef.current) return;
    e.preventDefault();
    scratchingRef.current = false;
    lastPosRef.current = null;
  }

  function handlePointerCancel(_e: ReactPointerEvent<HTMLCanvasElement>): void {
    scratchingRef.current = false;
    lastPosRef.current = null;
    if (!revealedRef.current) checkPercent();
  }

  // ----------------------------------------------------------------
  // Canvas class composition
  // ----------------------------------------------------------------
  const canvasClass = [
    'scratch-canvas',
    isFading ? 'is-fading' : '',
    isHidden ? 'is-hidden' : '',
  ].filter(Boolean).join(' ');

  return (
    <div className="card-container">
      <div
        className={`card-wrapper${revealed ? ' is-revealed' : ''}`}
        ref={wrapperRef}
      >
        {/* Message layer — in DOM from the start, hidden from AT until revealed */}
        <div
          className="card-message-layer"
          aria-hidden={!revealed}
          aria-live="polite"
        >
          <div className="card-sparkle-top">
            <Sparkle size={28} color="#F7C873" />
          </div>

          {recipientName && (
            <div className="card-sender" style={{ color: 'var(--pink-400)' }}>
              For {recipientName}
            </div>
          )}

          <p className="card-message-text">{message}</p>

          {senderName && (
            <div className="card-sender">From: {senderName}</div>
          )}
        </div>

        {/* Foil canvas overlay */}
        <canvas
          ref={canvasRef}
          className={canvasClass}
          aria-label="Scratch here to reveal today's motivational message"
          role="img"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerLeave}
          onPointerCancel={handlePointerCancel}
        />
      </div>


    </div>
  );
}
