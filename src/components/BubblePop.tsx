import { useState, useEffect, useRef, useCallback } from 'react';

const EMOJIS = [
  '🌸', '🌺', '🌼', '🌻', '🌹',
  '💖', '💕', '💗', '💓', '✨',
  '🦋', '🌈', '🍀', '⭐', '🎀',
  '🫧', '🫶', '🌙', '🎵', '🌟',
];

const BUBBLE_COLORS = [
  'rgba(255,214,224,0.88)',
  'rgba(255,194,209,0.88)',
  'rgba(255,143,171,0.85)',
  'rgba(247,200,115,0.82)',
  'rgba(255,255,255,0.82)',
  'rgba(229,85,127,0.78)',
  'rgba(255,179,198,0.88)',
  'rgba(253,240,250,0.90)',
];

let _uid = 1000;
const uid = (): number => ++_uid;

// ─── Splash particle ────────────────────────────────────────────
interface SplashParticle {
  key: number;
  startX: number;
  startY: number;
  tx: number;      // px offset target
  ty: number;
  emoji: string;
  born: number;    // Date.now()
  dur: number;     // ms
}

// ─── Bubble (position driven by RAF) ────────────────────────────
interface BubbleData {
  id: number;
  side: 'left' | 'right';
  /** left offset in px — set once on spawn */
  leftPx: number;
  /** current Y in px from top */
  y: number;
  size: number;
  color: string;
  emoji: string;
  speed: number;   // px/frame at 60 fps
  popped: boolean;
  popY: number;
  popX: number;
}

function spawnBubble(side: 'left' | 'right', screenW: number, screenH: number): BubbleData {
  // left column:  0 – 18% of screen width
  // right column: 82 – 100% of screen width
  const colW = screenW * 0.18;
  const leftPx = side === 'left'
    ? Math.random() * colW
    : screenW - colW + Math.random() * colW;

  return {
    id: uid(),
    side,
    leftPx,
    y: screenH + Math.random() * screenH,   // start below screen, staggered
    size: Math.random() * 38 + 34,          // 34–72 px
    color: BUBBLE_COLORS[Math.floor(Math.random() * BUBBLE_COLORS.length)]!,
    emoji: EMOJIS[Math.floor(Math.random() * EMOJIS.length)]!,
    speed: Math.random() * 1.0 + 0.55,     // px per frame
    popped: false,
    popY: 0,
    popX: 0,
  };
}

// ─── Component ──────────────────────────────────────────────────
export function BubblePop(): JSX.Element {
  const reduced     = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const bubblesRef  = useRef<BubbleData[]>([]);
  const rafRef      = useRef<number>(0);
  const [, forceRender] = useState(0);           // tick counter to trigger re-render
  const [splashes, setSplashes] = useState<SplashParticle[]>([]);
  const screenW = useRef(window.innerWidth);
  const screenH = useRef(window.innerHeight);

  // ── Initialise ──────────────────────────────────────────────
  useEffect(() => {
    if (reduced) return;

    screenW.current = window.innerWidth;
    screenH.current = window.innerHeight;

    // Seed 7 per side, spread across the full height
    const initial: BubbleData[] = [
      ...Array.from({ length: 7 }, (_, i) => {
        const b = spawnBubble('left', screenW.current, screenH.current);
        b.y = (screenH.current / 7) * i + Math.random() * 60; // pre-spread
        return b;
      }),
      ...Array.from({ length: 7 }, (_, i) => {
        const b = spawnBubble('right', screenW.current, screenH.current);
        b.y = (screenH.current / 7) * i + Math.random() * 60;
        return b;
      }),
    ];
    bubblesRef.current = initial;

    let frame = 0;
    function tick(): void {
      frame++;
      const sw = screenW.current;
      const sh = screenH.current;

      bubblesRef.current = bubblesRef.current
        .map(b => {
          if (b.popped) return b;
          return { ...b, y: b.y - b.speed };
        })
        .filter(b => {
          // remove if fully above screen or popped-and-done
          if (b.popped) return false;
          return b.y > -b.size - 20;
        });

      // Continuously maintain 7 per side
      const leftCount  = bubblesRef.current.filter(b => b.side === 'left').length;
      const rightCount = bubblesRef.current.filter(b => b.side === 'right').length;
      for (let i = leftCount;  i < 7; i++) bubblesRef.current.push(spawnBubble('left',  sw, sh));
      for (let i = rightCount; i < 7; i++) bubblesRef.current.push(spawnBubble('right', sw, sh));

      // Re-render every 3 frames (~20 fps is enough for smooth float)
      if (frame % 3 === 0) forceRender(f => f + 1);

      rafRef.current = requestAnimationFrame(tick);
    }

    rafRef.current = requestAnimationFrame(tick);

    const onResize = (): void => {
      screenW.current = window.innerWidth;
      screenH.current = window.innerHeight;
    };
    window.addEventListener('resize', onResize);

    return (): void => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', onResize);
    };
  }, [reduced]);

  // Clean up old splashes
  useEffect(() => {
    const timer = setInterval(() => {
      const now = Date.now();
      setSplashes(prev => prev.filter(p => now - p.born < p.dur + 100));
    }, 500);
    return (): void => clearInterval(timer);
  }, []);

  // ── Pop handler ─────────────────────────────────────────────
  const handlePop = useCallback((id: number, clientX: number, clientY: number): void => {
    const target = bubblesRef.current.find(b => b.id === id);
    if (!target || target.popped) return;

    // Mark popped
    bubblesRef.current = bubblesRef.current.map(b =>
      b.id === id ? { ...b, popped: true, popX: clientX, popY: clientY } : b
    );

    // Spawn 10 splash particles
    const now = Date.now();
    const newParticles: SplashParticle[] = Array.from({ length: 10 }, (_, i) => {
      const angle = (i / 10) * Math.PI * 2 + Math.random() * 0.5;
      const dist  = Math.random() * 80 + 50;
      return {
        key: uid(),
        startX: clientX,
        startY: clientY,
        tx: Math.cos(angle) * dist,
        ty: Math.sin(angle) * dist,
        emoji: EMOJIS[Math.floor(Math.random() * EMOJIS.length)]!,
        born: now,
        dur: 700,
      };
    });
    setSplashes(prev => [...prev, ...newParticles]);

    if ('vibrate' in navigator) {
      try { navigator.vibrate([8, 15, 8]); } catch { /* ignore */ }
    }
  }, []);

  if (reduced) return <></>;

  const now = Date.now();

  return (
    <div
      style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 4, overflow: 'hidden' }}
      aria-hidden="true"
    >
      {/* ── Bubbles ── */}
      {bubblesRef.current.map(b => (
        <div
          key={b.id}
          onPointerDown={(e): void => {
            e.stopPropagation();
            handlePop(b.id, e.clientX, e.clientY);
          }}
          style={{
            position: 'fixed',
            left: b.leftPx,
            top: b.y,
            width:  b.size,
            height: b.size,
            borderRadius: '50%',
            background: b.color,
            border: '1.5px solid rgba(255,255,255,0.65)',
            boxShadow: [
              '0 3px 14px rgba(229,85,127,0.22)',
              'inset 0 -4px 10px rgba(255,255,255,0.3)',
              'inset 3px 3px 7px rgba(255,255,255,0.55)',
            ].join(', '),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: b.size * 0.47,
            lineHeight: 1,
            cursor: 'pointer',
            pointerEvents: 'auto',
            userSelect: 'none',
            willChange: 'transform',
            transition: 'transform 0.08s',
          }}
        >
          {b.emoji}
        </div>
      ))}

      {/* ── Splash particles ── */}
      {splashes.map(p => {
        const age      = now - p.born;
        const progress = Math.min(age / p.dur, 1);
        const tx       = p.tx * progress;
        const ty       = p.ty * progress;
        const scale    = 1 - progress * 0.75;
        const opacity  = 1 - progress;
        return (
          <div
            key={p.key}
            style={{
              position: 'fixed',
              left: p.startX,
              top:  p.startY,
              fontSize: 22,
              lineHeight: 1,
              pointerEvents: 'none',
              transform: `translate(${tx}px, ${ty}px) scale(${scale})`,
              opacity,
              willChange: 'transform, opacity',
            }}
          >
            {p.emoji}
          </div>
        );
      })}
    </div>
  );
}
