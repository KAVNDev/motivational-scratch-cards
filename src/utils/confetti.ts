import confettiLib from 'canvas-confetti';

/**
 * Fire a celebration burst in the app's color palette.
 * Uses only geometric shapes — no emoji.
 * Respects prefers-reduced-motion by doing nothing when motion is reduced.
 */
export function fireConfetti(): void {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const colors = ['#FFD6E0', '#FFC2D1', '#FF8FAB', '#E5557F', '#F7C873', '#FFF8F3'];

  // Two bursts from slightly different origins for a natural look
  void confettiLib({
    particleCount: 90,
    spread: 70,
    origin: { x: 0.4, y: 0.6 },
    colors,
    shapes: ['circle', 'square'],
    scalar: 0.9,
    gravity: 1.1,
    drift: -0.3,
  });

  void confettiLib({
    particleCount: 70,
    spread: 60,
    origin: { x: 0.6, y: 0.6 },
    colors,
    shapes: ['circle', 'square'],
    scalar: 0.8,
    gravity: 1.1,
    drift: 0.3,
  });
}
