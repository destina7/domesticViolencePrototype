import { useEffect, useRef, useState } from "react";
import type { SecretDesign } from "../data";
import { TAPS, WINDOW_MS } from "./cover";

// What someone sees when they open the app: the cover app's loading screen (Fake loading, which won the user test
// against a passcode screen). It must never say "Nura": to anyone holding the phone it is the cover app (Bloom by default).

/** The cover app's logo: a wireframe app icon with a ring in it. */
export function CoverLogo({ size = 72 }: { size?: number }) {
  return (
    <span aria-hidden className="border-[#1a1a1a] border-2 flex items-center justify-center shrink-0"
      style={{ width: size, height: size, borderRadius: size * 0.28 }}>
      <span className="border-[#1a1a1a] border-2 rounded-full" style={{ width: size * 0.45, height: size * 0.45 }} />
    </span>
  );
}

// Loading speed. The bar runs from 0 to 1, and how fast depends on what the person is doing:
// untouched it opens the cover app in 3 s; impatient tapping elsewhere keeps it to about 5 s; a finger held down,
// drawing, or tapping the logo slows it right down (up to 10 s) to give time for the way in; once they stop, the rest
// fills quickly.
const IDLE_MS = 3000;      // pace when nobody touches the screen
const TAPPING_MS = 5000;   // pace just after quick taps elsewhere on the screen
const ENGAGED_MS = 10000;  // pace while a finger is down, or just after a hold, a drag or a tap on the logo
const QUIET_MS = 800;      // no touch for this long after touching = they stopped
const FINISH_MS = 600;     // once they stop (or got the way in right), the rest of the bar fills at this pace
const MAX_MS = 10000;      // never longer than this, whatever happens

// The rules below are shared with the guided practice (screens/practice.tsx), so it works exactly like the real thing.
export const MOVE_SLOP = 24;      // px a finger may drift and still count as a tap

// A · Three taps on the cover app's logo, the same rule as the cover app's own way in (TAPS within WINDOW_MS of the first tap).
export const TAP_MAX_MS = 500;    // a press longer than this is not a tap

// B · Draw a pattern on an invisible 3x3 grid that fills the screen. Cells are numbered 1-9, row by row.
export const PATTERN = [1, 4, 7, 8, 9]; // an L: down the left side, then along the bottom

/** How each way in is described, the same in setup, Settings and the practice. */
export const WAY_IN: Record<SecretDesign, { title: string; text: (cover: string) => string }> = {
  taps: { title: "Tap the logo", text: (cover) => `Tap the ${cover} logo 3 times while it loads` },
  pattern: { title: "Draw the L", text: (cover) => `Draw an L while ${cover} opens: down the left side, then along the bottom` },
};

/** B · Which grid cell (1–9) a point is in. Only the middle of a cell counts, so brushing past a corner adds nothing. */
export function cellAt(x: number, y: number, r: DOMRect): number | null {
  const cx = ((x - r.left) / r.width) * 3, cy = ((y - r.top) / r.height) * 3;
  if (cx < 0 || cy < 0 || cx >= 3 || cy >= 3) return null;
  const col = Math.floor(cx), row = Math.floor(cy);
  const fx = cx - col, fy = cy - row;
  if (fx < 0.2 || fx > 0.8 || fy < 0.2 || fy > 0.8) return null;
  return row * 3 + col + 1;
}

/** B · Adds a cell to the path, like a phone pattern lock: each cell once, and a skipped middle cell is filled in. */
export function addCell(path: number[], c: number) {
  if (path.includes(c)) return;
  const last = path[path.length - 1];
  if (last !== undefined) {
    const [r1, c1, r2, c2] = [Math.floor((last - 1) / 3), (last - 1) % 3, Math.floor((c - 1) / 3), (c - 1) % 3];
    if ((r1 + r2) % 2 === 0 && (c1 + c2) % 2 === 0) {
      const mid = ((r1 + r2) / 2) * 3 + (c1 + c2) / 2 + 1;
      if (mid !== c && !path.includes(mid)) path.push(mid);
    }
  }
  path.push(c);
}

type Touch = {
  id: number | null; down: boolean; downAt: number; x: number; y: number; moved: boolean; onLogo: boolean;
  lastUpAt: number; lastUpSlow: boolean; touched: boolean; unlock: boolean;
  taps: number; firstTap: number; path: number[];
};

/**
 * The cover app's splash screen with a loading bar. When the bar fills, the cover app opens, unless the secret way in
 * was done while it loaded: then the bar fills as usual and Nura opens instead.
 * Nothing on screen reacts to the way in (no trail, no message), so a wrong try just looks like the app loading.
 */
export function FakeLoading({ cover, secret, onUnlock, onDone }: {
  cover: string; secret: SecretDesign; onUnlock: () => void; onDone: () => void;
}) {
  const [progress, setProgress] = useState(0);
  const mainRef = useRef<HTMLElement>(null);
  const logoRef = useRef<HTMLSpanElement>(null);
  const exits = useRef({ onUnlock, onDone });
  exits.current = { onUnlock, onDone };
  const t = useRef<Touch>({
    id: null, down: false, downAt: 0, x: 0, y: 0, moved: false, onLogo: false,
    lastUpAt: -Infinity, lastUpSlow: false, touched: false, unlock: false, taps: 0, firstTap: 0, path: [],
  });

  const track = (e: React.PointerEvent) => {
    const r = mainRef.current?.getBoundingClientRect();
    const c = r && cellAt(e.clientX, e.clientY, r);
    if (c) addCell(t.current.path, c);
  };

  const onDown = (e: React.PointerEvent<HTMLElement>) => {
    const s = t.current;
    if (s.unlock || s.down) return; // one finger at a time
    // Keep getting moves even when the finger leaves the screen area. Can throw for an inactive pointer; harmless.
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* ignore */ }
    Object.assign(s, {
      id: e.pointerId, down: true, downAt: performance.now(), x: e.clientX, y: e.clientY, moved: false, touched: true,
      onLogo: !!logoRef.current?.contains(e.target as Node), path: [],
    });
    if (secret === "pattern") track(e);
  };
  const onMove = (e: React.PointerEvent) => {
    const s = t.current;
    if (!s.down || e.pointerId !== s.id) return;
    if (Math.hypot(e.clientX - s.x, e.clientY - s.y) > MOVE_SLOP) s.moved = true;
    if (secret === "pattern") track(e);
  };
  const onUp = (e: React.PointerEvent) => {
    const s = t.current;
    if (!s.down || e.pointerId !== s.id) return;
    const now = performance.now(), held = now - s.downAt;
    Object.assign(s, { down: false, id: null, lastUpAt: now, lastUpSlow: held > 300 || s.moved || s.onLogo });
    // A: a quick tap on the logo counts. The first tap starts the window; if it runs out, the count starts over.
    if (secret === "taps" && s.onLogo && !s.moved && held <= TAP_MAX_MS) {
      if (s.taps === 0 || now - s.firstTap > WINDOW_MS) Object.assign(s, { taps: 1, firstTap: now });
      else s.taps += 1;
      if (s.taps >= TAPS) s.unlock = true;
    }
    // B: the whole drawn path must be the pattern.
    if (secret === "pattern" && s.path.join() === PATTERN.join()) s.unlock = true;
  };

  useEffect(() => {
    // A ~60 fps timer rather than requestAnimationFrame: animation frames stop in hidden previews and some embedded
    // views, and the screen must still move on to the cover app there.
    const start = performance.now();
    let last = start, p = 0;
    const tick = () => {
      const now = performance.now();
      const s = t.current;
      const dt = Math.min(now - last, 250); // a phone waking up must not jump the bar straight to the end
      last = now;
      const quiet = !s.down && now - s.lastUpAt > QUIET_MS;
      const pace = s.unlock ? FINISH_MS
        : s.down ? ENGAGED_MS
        : !quiet ? (s.lastUpSlow ? ENGAGED_MS : TAPPING_MS)
        : s.touched ? FINISH_MS
        : IDLE_MS;
      p = Math.min(1, p + dt / pace);
      if (now - start >= MAX_MS) p = 1;
      setProgress(p);
      if (p >= 1) {
        window.clearInterval(timer);
        if (s.unlock) exits.current.onUnlock(); else exits.current.onDone();
      }
    };
    const timer = window.setInterval(tick, 16);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <main ref={mainRef} onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}
      onContextMenu={(e) => e.preventDefault()} style={{ touchAction: "none", WebkitTouchCallout: "none" }}
      className="relative flex flex-1 flex-col items-center justify-center gap-[14px] min-h-0 px-[24px] w-full max-w-[560px] mx-auto select-none">
      <div className="flex-[2]" />
      {/* The logo takes the taps (A), with a little room around it so a tap just beside it still counts. */}
      <span ref={logoRef} data-loading-logo className="p-[10px] -m-[10px]"><CoverLogo size={88} /></span>
      <p className="f-b text-[22px] text-[#1a1a1a]">{cover}</p>
      <div className="flex-[3]" />
      <div data-loading-bar className="w-[180px] h-[6px] rounded-full bg-[#ebebeb] overflow-hidden" role="progressbar" aria-label="Loading">
        {/* Eases out, so it feels like a real app: quick at first, slower near the end. */}
        <div className="h-full rounded-full bg-[#1a1a1a]" style={{ width: `${(1 - (1 - progress) ** 2) * 100}%` }} />
      </div>
      <p className="f-r text-[12px] text-[#666] mb-[40px]">Loading…</p>
    </main>
  );
}
