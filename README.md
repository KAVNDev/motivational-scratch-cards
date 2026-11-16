# Motivational Scratch Cards for the Day

A mobile-first daily scratch card web app. Each day a new motivational message is waiting under a metallic foil layer. Scratch it away with a finger or mouse to reveal the message, then come back tomorrow for the next one.

---

## What it is

- A fresh card is available every day, picked deterministically from a list of 65 original messages.
- Scratch the foil with touch, mouse, or stylus. Once 55% is cleared the card auto-reveals.
- A keyboard-accessible "Reveal card" button is always present for users who cannot scratch.
- Streaks, longest streak, and a 365-day history are stored in localStorage.
- After revealing: a countdown to the next card, a share button, and a past-cards drawer.
- Fully offline-capable and installable as a PWA.

---

## Running locally

```bash
npm install
npm run dev
```

Then open http://localhost:5173 in your browser.

---

## Editing messages and sender name

**Messages** live in `src/data/messages.ts` as a plain array of `{ id, text }` objects. Add, remove, or edit entries freely. The daily picker uses `daysSinceEpoch(date) % messages.length`, so the total count determines how often the cycle repeats.

**Sender / recipient names** are set in `src/config.ts`:

```ts
export const senderName    = '';   // shown as "From: ..." — leave empty to hide
export const recipientName = '';   // shown as "For ..." — leave empty to hide
export const epochDate     = '2024-01-01'; // keep this constant in production
```

Change `epochDate` only before first deployment; changing it afterwards shifts every day's message.

---

## Testing different dates with debug mode

Add `?debug=1` to the URL:

```
http://localhost:5173/?debug=1
```

A small panel appears in the top-right corner with three buttons:

- **Reset today** — clears today's reveal so you can scratch again.
- **Next day** — advances the displayed date by one day.
- **Previous day** — moves the displayed date back one day.

The debug panel is completely inert (zero code loaded) unless `?debug=1` is present.

---

## Deploying on Vercel

1. Push the repository to GitHub (or GitLab / Bitbucket).
2. Go to https://vercel.com and click **Add New Project**.
3. Import the repository.
4. Framework preset: **Vite** (auto-detected).
5. Build command: `npm run build` (default).
6. Output directory: `dist` (default).
7. Click **Deploy**. No environment variables are needed.

The site is a fully static bundle — no server-side logic.

---

## Project structure

```
src/
  main.tsx                  Entry point
  App.tsx                   Root component, state orchestration
  config.ts                 Sender name, recipient name, epoch date
  data/messages.ts          65 original motivational messages
  components/
    ScratchCard.tsx          Canvas foil + message reveal
    Countdown.tsx            HH:MM:SS timer to local midnight
    StreakBadge.tsx          Flame + streak count (shows at streak >= 2)
    HistoryDrawer.tsx        Bottom-sheet list of past cards
    FloatingShapes.tsx       Decorative background stars and circles
    icons/                   Inline SVG icon components
  hooks/
    useToday.ts              Current date string with midnight rollover
    useScratchStorage.ts     localStorage with safe private-mode fallback
  utils/
    dailyMessage.ts          Deterministic date -> message picker
    scratchCanvas.ts         Foil drawing + scratch stroke + % sampler
    confetti.ts              canvas-confetti wrapper (geometric shapes only)
  styles/
    global.css               CSS variables, layout, component styles
public/
  favicon.svg                Four-point star in --pink-600
  manifest.webmanifest       PWA manifest
```

---

## Technical notes

- **Scratch mechanic**: the canvas is sized at `wrapper.width * devicePixelRatio` for crisp retina rendering. Scratching uses `globalCompositeOperation = 'destination-out'` to erase the foil. Pointer capture via `setPointerCapture` ensures swipes remain registered even if the pointer leaves the canvas boundary.
- **Determinism**: today's message index is `daysSinceEpoch(today) % messages.length`. No `Math.random()` is involved, so every user and every refresh shows the same card on the same day.
- **Persistence**: a versioned localStorage key (`motivationalscratch:v1`) stores reveal date, streak, and history. All reads/writes are wrapped in try/catch so private browsing mode never crashes the app.
- **Date rollover**: `useToday` polls every 60 seconds and also listens for `visibilitychange` to catch the user returning to the tab after midnight.
- **Accessibility**: the message text is in the DOM from the start but `aria-hidden="true"` until revealed. An `aria-live="polite"` region announces the reveal. All interactive elements have focus rings and `aria-label`s. `prefers-reduced-motion` skips confetti and disables animations.
- **Bundle size**: 57.6 KB gzipped (JS), 2.4 KB gzipped (CSS).
