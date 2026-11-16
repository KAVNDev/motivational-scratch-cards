import { useEffect, useRef } from 'react';

// ----------------------------------------------------------------
// Static floating background shapes (stars + circles)
// ----------------------------------------------------------------
const BG_SHAPES = [
  { type: 'star',   x:  4, y:  5, size: 18, dur: 7.5, delay: 0.0 },
  { type: 'star',   x: 12, y: 22, size: 11, dur: 9.2, delay: 1.1 },
  { type: 'star',   x: 20, y: 72, size: 22, dur: 8.2, delay: 2.4 },
  { type: 'star',   x: 28, y: 42, size: 14, dur: 6.5, delay: 3.3 },
  { type: 'star',   x: 36, y: 88, size: 10, dur: 10,  delay: 0.7 },
  { type: 'star',   x: 48, y: 15, size: 16, dur: 9.5, delay: 0.9 },
  { type: 'star',   x: 55, y: 60, size: 12, dur: 7.8, delay: 4.1 },
  { type: 'star',   x: 63, y: 30, size: 20, dur: 8.9, delay: 1.6 },
  { type: 'star',   x: 72, y: 80, size: 15, dur: 6.8, delay: 0.6 },
  { type: 'star',   x: 80, y: 10, size: 13, dur: 11,  delay: 2.0 },
  { type: 'star',   x: 88, y: 50, size: 20, dur: 7.0, delay: 1.8 },
  { type: 'star',   x: 94, y: 20, size: 11, dur: 9.1, delay: 3.5 },
  { type: 'star',   x:  6, y: 55, size: 14, dur: 8.8, delay: 4.0 },
  { type: 'star',   x: 42, y: 95, size: 10, dur: 10,  delay: 3.0 },
  { type: 'star',   x: 76, y: 92, size: 17, dur: 6.3, delay: 1.3 },
  { type: 'star',   x: 92, y: 75, size: 12, dur: 8.4, delay: 2.7 },
  { type: 'circle', x: 10, y: 35, size: 26, dur: 11,  delay: 1.5 },
  { type: 'circle', x: 22, y: 58, size: 18, dur: 9,   delay: 3.5 },
  { type: 'circle', x: 33, y: 15, size: 32, dur: 12,  delay: 0.3 },
  { type: 'circle', x: 50, y: 78, size: 20, dur: 10,  delay: 2.2 },
  { type: 'circle', x: 60, y: 45, size: 14, dur: 8,   delay: 5.0 },
  { type: 'circle', x: 70, y: 65, size: 28, dur: 11,  delay: 0.8 },
  { type: 'circle', x: 82, y: 30, size: 16, dur: 9.3, delay: 3.8 },
  { type: 'circle', x: 90, y: 85, size: 24, dur: 12,  delay: 1.9 },
  { type: 'circle', x: 96, y: 48, size: 14, dur: 7.5, delay: 4.5 },
];

// ----------------------------------------------------------------
// Cursor glitter particle
// ----------------------------------------------------------------
interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  alpha: number;
  size: number;
  color: string;
  rotation: number;
  rotSpeed: number;
}

const COLORS = ['#E5557F', '#F7C873', '#FF8FAB', '#FFC2D1', '#FFF8F3', '#FFD6E0'];

function randomColor(): string {
  return COLORS[Math.floor(Math.random() * COLORS.length)] ?? '#F7C873';
}

export function FloatingShapes(): JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particles = useRef<Particle[]>([]);
  const rafRef    = useRef<number>(0);
  const reduced   = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ----------------------------------------------------------------
  // Canvas cursor-glitter system
  // ----------------------------------------------------------------
  useEffect(() => {
    if (reduced) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Size canvas to viewport
    function resize(): void {
      if (!canvas) return;
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    // Spawn particles on pointer/touch move
    function spawnAt(x: number, y: number, count = 3): void {
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 2.5 + 0.5;
        particles.current.push({
          x, y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 1.2, // slight upward drift
          alpha: 1,
          size: Math.random() * 7 + 4,
          color: randomColor(),
          rotation: Math.random() * Math.PI * 2,
          rotSpeed: (Math.random() - 0.5) * 0.2,
        });
      }
      // Cap total particles to keep it smooth
      if (particles.current.length > 220) {
        particles.current.splice(0, particles.current.length - 220);
      }
    }

    function onPointerMove(e: PointerEvent): void {
      spawnAt(e.clientX, e.clientY, 3);
    }
    function onTouchMove(e: TouchEvent): void {
      for (let i = 0; i < e.touches.length; i++) {
        const t = e.touches[i];
        if (t) spawnAt(t.clientX, t.clientY, 3);
      }
    }

    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('touchmove',   onTouchMove,   { passive: true });

    // Draw a four-point star
    function drawStar(
      c: CanvasRenderingContext2D,
      cx: number, cy: number,
      size: number, rotation: number,
    ): void {
      c.save();
      c.translate(cx, cy);
      c.rotate(rotation);
      c.beginPath();
      const arm = size / 2;
      const nib = arm * 0.22;
      c.moveTo(0, -arm);
      c.lineTo(nib, -nib);
      c.lineTo(arm, 0);
      c.lineTo(nib, nib);
      c.lineTo(0, arm);
      c.lineTo(-nib, nib);
      c.lineTo(-arm, 0);
      c.lineTo(-nib, -nib);
      c.closePath();
      c.fill();
      c.restore();
    }

    // Animation loop
    function tick(): void {
      if (!canvas || !ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.current = particles.current.filter(p => p.alpha > 0.02);

      for (const p of particles.current) {
        p.x  += p.vx;
        p.y  += p.vy;
        p.vy += 0.07; // gravity
        p.alpha     -= 0.022;
        p.rotation  += p.rotSpeed;

        ctx.globalAlpha = Math.max(0, p.alpha);
        ctx.fillStyle   = p.color;

        // Alternate between stars and tiny circles for variety
        if (p.size > 7) {
          drawStar(ctx, p.x, p.y, p.size, p.rotation);
        } else {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size / 2, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      ctx.globalAlpha = 1;
      rafRef.current = requestAnimationFrame(tick);
    }

    rafRef.current = requestAnimationFrame(tick);

    return (): void => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', resize);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('touchmove', onTouchMove);
    };
  }, [reduced]);

  return (
    <>
      {/* Canvas for cursor-following glitter */}
      <canvas
        ref={canvasRef}
        style={{
          position: 'fixed',
          inset: 0,
          pointerEvents: 'none',
          zIndex: 2,
        }}
        aria-hidden="true"
      />

      {/* Static floating background shapes */}
      <div className="floating-shapes" aria-hidden="true">
        {BG_SHAPES.map((s, i) => {
          const style: React.CSSProperties = {
            left: `${s.x}%`,
            top:  `${s.y}%`,
            animation: reduced
              ? 'none'
              : `float-shape ${s.dur}s ease-in-out ${s.delay}s infinite alternate`,
          };

          if (s.type === 'star') {
            const w = s.size, h = s.size;
            const cx = w / 2, cy = h / 2;
            const arm = h / 2, nib = arm * 0.22;
            const d = `M ${cx} ${cy - arm} L ${cx + nib} ${cy - nib} L ${cx + arm} ${cy} L ${cx + nib} ${cy + nib} L ${cx} ${cy + arm} L ${cx - nib} ${cy + nib} L ${cx - arm} ${cy} L ${cx - nib} ${cy - nib} Z`;
            return (
              <svg key={i} width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={style}>
                <path d={d} fill="#E5557F" />
              </svg>
            );
          }

          const r = s.size / 2;
          return (
            <svg key={i} width={s.size} height={s.size} viewBox={`0 0 ${s.size} ${s.size}`} style={style}>
              <circle cx={r} cy={r} r={r * 0.85} fill="#FF8FAB" />
            </svg>
          );
        })}

        <style>{`
          @keyframes float-shape {
            from { transform: translateY(0px) rotate(0deg); }
            to   { transform: translateY(-20px) rotate(18deg); }
          }
        `}</style>
      </div>
    </>
  );
}
