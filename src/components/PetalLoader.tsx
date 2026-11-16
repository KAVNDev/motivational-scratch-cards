import { useEffect, useRef } from 'react';

interface PetalLoaderProps {
  onDone: () => void;
}

interface Petal {
  // orbit-based position
  orbitAngle: number;
  orbitSpeed: number;
  orbitR: number;         // current orbit radius
  angle: number;          // self-rotation
  angleSpeed: number;
  scale: number;
  alpha: number;
  color: string;
  // phase-2 scatter
  scatterVx: number;
  scatterVy: number;
  scatterX: number;
  scatterY: number;
  phase2Started: boolean;
}

const PETAL_COLORS = [
  '#FFD6E0', '#FFC2D1', '#FF8FAB',
  '#E5557F', '#F7C873', '#FFF8F3',
  '#ffb3c6', '#ffd6a5',
];

function makePetal(cx: number, cy: number, screenW: number, screenH: number): Petal {
  const orbitAngle = Math.random() * Math.PI * 2;
  // Spread across the whole screen, not just centre
  const maxR = Math.max(screenW, screenH) * 0.55;
  const orbitR = Math.random() * maxR + 60;
  return {
    orbitAngle,
    orbitSpeed: (Math.random() * 0.022 + 0.012) * (Math.random() < 0.5 ? 1 : -1),
    orbitR,
    angle: Math.random() * Math.PI * 2,
    angleSpeed: (Math.random() - 0.5) * 0.07,
    scale: Math.random() * 0.9 + 0.35,
    alpha: Math.random() * 0.45 + 0.55,
    color: PETAL_COLORS[Math.floor(Math.random() * PETAL_COLORS.length)] ?? '#FFD6E0',
    scatterVx: (Math.random() - 0.5) * 18,
    scatterVy: (Math.random() - 0.5) * 18,
    scatterX: cx + Math.cos(orbitAngle) * orbitR,
    scatterY: cy + Math.sin(orbitAngle) * orbitR,
    phase2Started: false,
  };
}

function drawPetal(
  ctx: CanvasRenderingContext2D,
  x: number, y: number,
  angle: number, scale: number, color: string, alpha: number,
): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.globalAlpha = Math.max(0, alpha);
  ctx.fillStyle = color;
  ctx.beginPath();
  const w = 16 * scale;
  const h = 30 * scale;
  ctx.moveTo(0, -h / 2);
  ctx.bezierCurveTo( w, -h * 0.1,  w,  h * 0.4,  0,  h / 2);
  ctx.bezierCurveTo(-w,  h * 0.4, -w, -h * 0.1,  0, -h / 2);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

// ─────────────────────────────────────────────────────────────────
//  Timing:
//    0  –  3.0 s  → Phase 1: petals swirl
//    3.0 – 5.0 s  → Phase 2: petals scatter outward and fade
//    5.0 s        → onDone() fires (app fades in over it)
// ─────────────────────────────────────────────────────────────────
const PHASE1_END  = 3000;
const PHASE2_END  = 5000;

export function PetalLoader({ onDone }: PetalLoaderProps): JSX.Element {
  const canvasRef   = useRef<HTMLCanvasElement>(null);
  const rafRef      = useRef<number>(0);
  const startRef    = useRef<number>(0);
  const petalsRef   = useRef<Petal[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctxRaw = canvas.getContext('2d');
    if (!ctxRaw) return;
    // non-null alias for use inside closures
    const ctx = ctxRaw;

    const resize = (): void => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const W = canvas.width;
    const H = canvas.height;
    const cx = W / 2;
    const cy = H / 2;

    // 80 petals spread across the whole viewport
    petalsRef.current = Array.from({ length: 80 }, () => makePetal(cx, cy, W, H));

    function tick(ts: number): void {
      if (!startRef.current) startRef.current = ts;
      const elapsed = ts - startRef.current;

      ctx.clearRect(0, 0, W, H);

      if (elapsed < PHASE1_END) {
        // ── Phase 1: swirl inward ──────────────────────────────
        const t = elapsed / PHASE1_END; // 0→1

        for (const p of petalsRef.current) {
          // Speed up swirl as phase progresses
          p.orbitAngle += p.orbitSpeed * (1 + t * 2.5);
          // Gently tighten orbit toward centre as time passes
          p.orbitR     *= 0.9994;
          p.angle      += p.angleSpeed;

          const x = cx + Math.cos(p.orbitAngle) * p.orbitR;
          const y = cy + Math.sin(p.orbitAngle) * p.orbitR;

          // Fade in quickly at start, hold, then no fade yet
          const fadeIn = Math.min(elapsed / 400, 1);
          drawPetal(ctx, x, y, p.angle, p.scale, p.color, p.alpha * fadeIn);
          // Remember position for phase 2 start
          p.scatterX = x;
          p.scatterY = y;
          p.phase2Started = false;
        }

      } else if (elapsed < PHASE2_END) {
        // ── Phase 2: scatter outward ───────────────────────────
        const t2 = (elapsed - PHASE1_END) / (PHASE2_END - PHASE1_END); // 0→1
        const eased = t2 * t2; // ease-in so scatter starts slow then accelerates

        for (const p of petalsRef.current) {
          if (!p.phase2Started) {
            p.phase2Started = true;
          }

          const x = p.scatterX + p.scatterVx * eased * 60;
          const y = p.scatterY + p.scatterVy * eased * 60 + eased * eased * 120; // gravity pull
          p.angle += p.angleSpeed * 2; // spin faster during scatter

          // Fade out in phase 2
          const alpha = p.alpha * (1 - t2);
          drawPetal(ctx, x, y, p.angle, p.scale * (1 + t2 * 0.5), p.color, alpha);
        }

      } else {
        // ── Done ───────────────────────────────────────────────
        ctx.clearRect(0, 0, W, H);
        onDone();
        return;
      }

      rafRef.current = requestAnimationFrame(tick);
    }

    rafRef.current = requestAnimationFrame(tick);

    return (): void => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', resize);
    };
  }, [onDone]);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'linear-gradient(160deg, #FFD6E0 0%, #FFC2D1 50%, #FFF8F3 100%)',
      }}
      aria-label="Loading"
      role="status"
    >
      <canvas
        ref={canvasRef}
        style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
        aria-hidden="true"
      />
      {/* Centred title */}
      <div style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        pointerEvents: 'none',
        zIndex: 1,
      }}>
        <div style={{
          fontFamily: "'Fredoka', sans-serif",
          fontSize: 'clamp(1.8rem, 7vw, 2.8rem)',
          fontWeight: 600,
          color: '#5A2A3C',
          lineHeight: 1.2,
          textAlign: 'center',
          textShadow: '0 2px 12px rgba(255,255,255,0.7)',
        }}>
          Motivational<br />Scratch Cards
        </div>
        <div style={{
          marginTop: 12,
          fontFamily: "'Nunito', sans-serif",
          fontSize: '0.88rem',
          color: '#E5557F',
          letterSpacing: '0.09em',
          fontWeight: 700,
          textTransform: 'uppercase',
          textShadow: '0 1px 8px rgba(255,255,255,0.6)',
        }}>
          Your daily message awaits
        </div>
      </div>
    </div>
  );
}
