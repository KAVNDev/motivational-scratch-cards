/**
 * Canvas helpers for the scratch foil layer.
 * All sizing is in physical pixels (already multiplied by devicePixelRatio).
 */

/**
 * Draw the metallic foil layer onto the given context.
 * w / h are the physical pixel dimensions of the canvas.
 */
export function drawFoil(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  ctx.clearRect(0, 0, w, h);

  // Base metallic gradient: pink -> gold -> pink
  const grad = ctx.createLinearGradient(0, 0, w, h);
  grad.addColorStop(0,    '#f9b4c8');
  grad.addColorStop(0.35, '#F7C873');
  grad.addColorStop(0.65, '#f9b4c8');
  grad.addColorStop(1,    '#FF8FAB');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  // Subtle noise overlay — small semi-transparent dots
  drawNoiseSpeckles(ctx, w, h);

  // Sparkle star shapes scattered across the foil
  drawFoilSparkles(ctx, w, h);

  // "Scratch here" hint text
  drawHintText(ctx, w, h);
}

/** Scatter ~260 tiny speckles to simulate foil grain. */
function drawNoiseSpeckles(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  // Use a seeded pseudo-random sequence so the speckles are deterministic
  let seed = 42;
  const rng = (): number => {
    seed = (seed * 1664525 + 1013904223) & 0xffffffff;
    return (seed >>> 0) / 0xffffffff;
  };

  ctx.save();
  for (let i = 0; i < 260; i++) {
    const x = rng() * w;
    const y = rng() * h;
    const r = rng() * 2.5 + 0.5;
    const alpha = rng() * 0.25 + 0.05;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255,255,255,${alpha})`;
    ctx.fill();
  }
  ctx.restore();
}

/** Draw small four-point star shapes across the foil surface. */
function drawFoilSparkles(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  let seed = 99;
  const rng = (): number => {
    seed = (seed * 1664525 + 1013904223) & 0xffffffff;
    return (seed >>> 0) / 0xffffffff;
  };

  const count = Math.floor((w * h) / 12000);
  ctx.save();
  for (let i = 0; i < count; i++) {
    const x = rng() * w;
    const y = rng() * h;
    const size = rng() * 7 + 4;
    const alpha = rng() * 0.4 + 0.15;
    drawStar4(ctx, x, y, size, `rgba(255,255,255,${alpha})`);
  }
  ctx.restore();
}

/** Draw a four-point star centred at (cx, cy) with arm length `size`. */
function drawStar4(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  size: number,
  color: string,
): void {
  ctx.beginPath();
  ctx.moveTo(cx, cy - size);
  ctx.lineTo(cx + size * 0.2, cy - size * 0.2);
  ctx.lineTo(cx + size, cy);
  ctx.lineTo(cx + size * 0.2, cy + size * 0.2);
  ctx.lineTo(cx, cy + size);
  ctx.lineTo(cx - size * 0.2, cy + size * 0.2);
  ctx.lineTo(cx - size, cy);
  ctx.lineTo(cx - size * 0.2, cy - size * 0.2);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
}

/** Draw the centred "Scratch here" hint text. */
function drawHintText(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Shadow for legibility
  ctx.shadowColor = 'rgba(90,42,60,0.4)';
  ctx.shadowBlur = 6;

  ctx.font = `bold ${Math.round(w * 0.065)}px 'Fredoka', sans-serif`;
  ctx.fillStyle = 'rgba(90,42,60,0.75)';
  ctx.fillText('Scratch here', w / 2, h / 2);
  ctx.restore();
}

/**
 * Erase a scratch stroke on the canvas.
 * Uses destination-out composite operation for the transparency cutout effect.
 */
export function scratchStroke(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  lineWidth: number,
): void {
  ctx.save();
  ctx.globalCompositeOperation = 'destination-out';
  ctx.lineWidth = lineWidth;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = 'rgba(0,0,0,1)';
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.restore();
}

/**
 * Estimate the percentage of the foil that has been scratched away.
 * Samples every `step`-th pixel (in each dimension) to keep it fast.
 * Returns a number 0–100.
 */
export function calcScratchedPercent(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  step = 8,
): number {
  const data = ctx.getImageData(0, 0, w, h).data;
  let transparent = 0;
  let total = 0;

  for (let y = 0; y < h; y += step) {
    for (let x = 0; x < w; x += step) {
      const idx = (y * w + x) * 4;
      // alpha channel is at idx+3
      if ((data[idx + 3] ?? 255) < 128) transparent++;
      total++;
    }
  }

  return total === 0 ? 0 : (transparent / total) * 100;
}
