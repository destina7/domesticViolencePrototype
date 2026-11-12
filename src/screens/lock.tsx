import { useEffect, useRef, useState } from "react";
import { Button, Card, Heading, Label, Spacer } from "../ui";
import type { SecretDesign } from "../data";

// What someone sees when they open the app. These screens must never say "Nura": to anyone holding the phone
// they are the cover app (Bloom by default). Chosen in the hidden menu → Lock screen version.

const REAL_PIN = "1234";

/** The cover app's logo: a wireframe app icon with a ring in it. */
function CoverLogo({ size = 72 }: { size?: number }) {
  return (
    <span aria-hidden className="border-[#1a1a1a] border-2 flex items-center justify-center shrink-0"
      style={{ width: size, height: size, borderRadius: size * 0.28 }}>
      <span className="border-[#1a1a1a] border-2 rounded-full" style={{ width: size * 0.45, height: size * 0.45 }} />
    </span>
  );
}

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "del"];

/**
 * A · Padlock. The cover app asks for a passcode, like any app with a lock.
 * 1234 opens Nura. Any other 4 digits open the cover app, so a wrong or panic PIN looks like it simply worked.
 * Has its own number pad, so the phone keyboard never covers it. On a laptop the number keys and Backspace work too.
 */
export function Padlock({ cover, onUnlock, onCover }: { cover: string; onUnlock: () => void; onCover: () => void }) {
  const [pin, setPin] = useState("");
  const press = (k: string) => {
    if (k === "del") setPin((p) => p.slice(0, -1));
    else if (k) setPin((p) => (p.length < 4 ? p + k : p));
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof Element && e.target.closest("[data-facilitator]")) return;
      if (/^[0-9]$/.test(e.key)) press(e.key);
      if (e.key === "Backspace") press("del");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // A short pause so the 4th dot is seen filling before the app opens.
  useEffect(() => {
    if (pin.length < 4) return;
    const t = window.setTimeout(() => (pin === REAL_PIN ? onUnlock() : onCover()), 350);
    return () => window.clearTimeout(t);
  }, [pin]);

  return (
    <main className="flex flex-1 flex-col items-center min-h-0 px-[24px] pt-[40px] pb-[28px] w-full max-w-[560px] mx-auto">
      <CoverLogo size={56} />
      <p className="f-b text-[20px] text-[#1a1a1a] mt-[14px]">{cover}</p>
      <p className="f-r text-[13px] text-[#666] mt-[4px]">Enter passcode</p>
      <div className="flex gap-[20px] mt-[24px]" aria-label={`${pin.length} of 4 digits entered`}>
        {[0, 1, 2, 3].map((i) => (
          <span key={i} className={`rounded-full size-[14px] border-2 border-[#1a1a1a] transition-colors ${pin[i] ? "bg-[#1a1a1a]" : ""}`} />
        ))}
      </div>
      <Spacer />
      <div className="grid grid-cols-3 gap-x-[24px] gap-y-[14px]">
        {KEYS.map((k, i) =>
          k === "" ? <span key={i} /> : (
            <button key={i} onClick={() => press(k)} aria-label={k === "del" ? "Delete" : k}
              className={`size-[68px] rounded-full flex items-center justify-center text-[#1a1a1a] active:scale-95 transition-transform ${k === "del" ? "hover:bg-[#f5f5f5]" : "border-[1.5px] border-[#c7c7c7] hover:bg-[#f5f5f5] f-m text-[26px]"}`}>
              {k === "del"
                ? <span data-symbol aria-hidden style={{ fontSize: 26 }} className="material-symbols-outlined leading-none">backspace</span>
                : k}
            </button>
          ),
        )}
      </div>
    </main>
  );
}

/* ---------- B · Fake loading ---------- */

// Loading speed. The bar runs from 0 to 1, and how fast depends on what the person is doing:
// untouched it opens the cover app in 3 s; impatient tapping keeps it to about 5 s; a finger held down or moving
// slows it right down (up to 10 s) to give time for the way in; once they stop, the rest fills quickly.
const IDLE_MS = 3000;      // pace when nobody touches the screen
const TAPPING_MS = 5000;   // pace just after quick taps
const ENGAGED_MS = 10000;  // pace while a finger is down, or just after a hold or a drag
const QUIET_MS = 800;      // no touch for this long after touching = they stopped
const FINISH_MS = 600;     // once they stop (or got the way in right), the rest of the bar fills at this pace
const MAX_MS = 10000;      // never longer than this, whatever happens

// A · Hold the icon.
const HOLD_MS = 3000;
const HOLD_SLOP = 24;      // px a held finger may drift and still count as holding

// B · Tap rhythm, anywhere on the screen. "." = short press, "-" = long press.
const RHYTHM = "..-.";
const RHYTHM_LABEL = "short, short, long, short";
const LONG_RATIO = 1.8;    // a long press must last at least this many times the longest short one
const LONG_MIN = 250;      // ms; and at least this long, so two quick taps never count as short + long
const PRESS_MAX = 1500;    // ms; a press longer than this is a hold, not part of a rhythm

// C · Draw a pattern on an invisible 3×3 grid that fills the screen. Cells are numbered 1–9, row by row.
const PATTERN = [1, 4, 7, 8, 9]; // an L: down the left side, then along the bottom
const PATTERN_LABEL = "an L: down the left side, then along the bottom";

/**
 * B · Rhythm check. Presses are compared with each other, not with fixed times, so slow and fast tappers both work:
 * the longest presses (as many as the rhythm has long ones) must clearly outlast the rest, and sit in the right places.
 */
function matchRhythm(presses: number[], want: string) {
  if (presses.length !== want.length || presses.some((d) => d > PRESS_MAX)) return false;
  const longs = [...want].filter((c) => c === "-").length;
  if (longs === 0 || longs === want.length) return false;
  const sorted = [...presses].sort((a, b) => a - b);
  const maxShort = sorted[sorted.length - longs - 1];
  const minLong = sorted[sorted.length - longs];
  if (minLong < LONG_MIN || minLong < maxShort * LONG_RATIO) return false;
  return presses.every((d, i) => (d >= minLong ? "-" : ".") === want[i]);
}

/** C · Which grid cell (1–9) a point is in. Only the middle of a cell counts, so brushing past a corner adds nothing. */
function cellAt(x: number, y: number, r: DOMRect): number | null {
  const cx = ((x - r.left) / r.width) * 3, cy = ((y - r.top) / r.height) * 3;
  if (cx < 0 || cy < 0 || cx >= 3 || cy >= 3) return null;
  const col = Math.floor(cx), row = Math.floor(cy);
  const fx = cx - col, fy = cy - row;
  if (fx < 0.2 || fx > 0.8 || fy < 0.2 || fy > 0.8) return null;
  return row * 3 + col + 1;
}

/** C · Adds a cell to the path, like a phone pattern lock: each cell once, and a skipped middle cell is filled in. */
function addCell(path: number[], c: number) {
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
  id: number | null; down: boolean; downAt: number; x: number; y: number; moved: boolean; onIcon: boolean;
  lastUpAt: number; lastUpWasHold: boolean; touched: boolean; checked: boolean; unlock: boolean;
  presses: number[]; path: number[];
};

/**
 * B · Fake loading. The cover app's splash screen with a loading bar. When the bar fills, the cover app opens,
 * unless the secret way in was done while it loaded: then the bar fills as usual and Nura opens instead.
 * Nothing on screen reacts to the way in (no trail, no message), so a wrong try just looks like the app loading.
 */
export function FakeLoading({ cover, secret, hints, onUnlock, onDone }: {
  cover: string; secret: SecretDesign; hints: boolean; onUnlock: () => void; onDone: () => void;
}) {
  const [progress, setProgress] = useState(0);
  const [hint, setHint] = useState("");
  const mainRef = useRef<HTMLElement>(null);
  const iconRef = useRef<HTMLSpanElement>(null);
  const exits = useRef({ onUnlock, onDone });
  exits.current = { onUnlock, onDone };
  const t = useRef<Touch>({
    id: null, down: false, downAt: 0, x: 0, y: 0, moved: false, onIcon: false,
    lastUpAt: -Infinity, lastUpWasHold: false, touched: false, checked: true, unlock: false, presses: [], path: [],
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
    const now = performance.now();
    if (now - s.lastUpAt > QUIET_MS) s.presses = []; // a pause starts a new attempt
    Object.assign(s, {
      id: e.pointerId, down: true, downAt: now, x: e.clientX, y: e.clientY, moved: false, touched: true, checked: false,
      onIcon: !!iconRef.current?.contains(e.target as Node), path: [],
    });
    if (secret === "pattern") track(e);
  };
  const onMove = (e: React.PointerEvent) => {
    const s = t.current;
    if (!s.down || e.pointerId !== s.id) return;
    if (Math.hypot(e.clientX - s.x, e.clientY - s.y) > HOLD_SLOP) s.moved = true;
    if (secret === "pattern") track(e);
  };
  const onUp = (e: React.PointerEvent) => {
    const s = t.current;
    if (!s.down || e.pointerId !== s.id) return;
    const now = performance.now(), held = now - s.downAt;
    Object.assign(s, { down: false, id: null, lastUpAt: now, lastUpWasHold: held > 300 || s.moved });
    if (secret === "rhythm") s.presses.push(held);
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
      // A: held on the icon long enough without sliding off.
      if (secret === "hold" && s.down && s.onIcon && !s.moved && now - s.downAt >= HOLD_MS) s.unlock = true;
      // B: the rhythm is checked once, when the tapping stops.
      if (secret === "rhythm" && quiet && !s.checked) {
        s.checked = true;
        if (matchRhythm(s.presses, RHYTHM)) s.unlock = true;
      }

      let pace: number, mode: string;
      if (s.unlock) [pace, mode] = [FINISH_MS, "way in done, opening Nura"];
      else if (s.down) [pace, mode] = [ENGAGED_MS, "finger down, slow"];
      else if (!quiet) [pace, mode] = s.lastUpWasHold ? [ENGAGED_MS, "just let go, slow"] : [TAPPING_MS, "tapping, medium"];
      else if (s.touched) [pace, mode] = [FINISH_MS, "stopped, finishing"];
      else [pace, mode] = [IDLE_MS, "untouched, 3 s"];
      p = Math.min(1, p + dt / pace);
      if (now - start >= MAX_MS) p = 1;
      setProgress(p);

      if (hints) {
        const input = secret === "hold"
          ? `Holding the icon: ${s.down && s.onIcon && !s.moved ? ((now - s.downAt) / 1000).toFixed(1) : "0.0"} of ${HOLD_MS / 1000} s`
          : secret === "rhythm"
            ? `Presses (ms): ${s.presses.map(Math.round).join(", ") || "none"}`
            : `Cells: ${s.path.join("-") || "none"}`;
        setHint(`${input}\nLoading: ${mode} · ${((now - start) / 1000).toFixed(1)} s`);
      }

      if (p >= 1) {
        window.clearInterval(timer);
        if (s.unlock) exits.current.onUnlock(); else exits.current.onDone();
      }
    };
    const timer = window.setInterval(tick, 16);
    return () => window.clearInterval(timer);
  }, []);

  const want = secret === "hold" ? `Hold the icon for ${HOLD_MS / 1000} s` : secret === "rhythm" ? `Tap ${RHYTHM_LABEL}` : `Draw ${PATTERN_LABEL}`;

  return (
    <main ref={mainRef} onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}
      onContextMenu={(e) => e.preventDefault()} style={{ touchAction: "none", WebkitTouchCallout: "none" }}
      className="relative flex flex-1 flex-col items-center justify-center gap-[14px] min-h-0 px-[24px] w-full max-w-[560px] mx-auto select-none">
      {/* Demo only: the invisible grid for C, numbered 1–9. */}
      {hints && secret === "pattern" && (
        <div aria-hidden className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none">
          {Array.from({ length: 9 }, (_, i) => (
            <div key={i} className={`border border-dashed border-[#c7c7c7] flex items-center justify-center f-m text-[13px] ${t.current.path.includes(i + 1) ? "text-[#1a1a1a] bg-[#f5f5f5]" : "text-[#c7c7c7]"}`}>{i + 1}</div>
          ))}
        </div>
      )}
      <div className="flex-[2]" />
      <span ref={iconRef} className="relative"><CoverLogo size={88} /></span>
      <p className="relative f-b text-[22px] text-[#1a1a1a]">{cover}</p>
      <div className="flex-[3]" />
      <div className="relative w-[180px] h-[6px] rounded-full bg-[#ebebeb] overflow-hidden" role="progressbar" aria-label="Loading">
        {/* Eases out, so it feels like a real app: quick at first, slower near the end. */}
        <div className="h-full rounded-full bg-[#1a1a1a]" style={{ width: `${(1 - (1 - progress) ** 2) * 100}%` }} />
      </div>
      <p className="relative f-r text-[12px] text-[#666] mb-[40px]">Loading…</p>
      {hints && (
        <div data-hints className="absolute left-[12px] right-[12px] bottom-[8px] pointer-events-none rounded-[10px] bg-[#1a1a1a]/85 px-[10px] py-[6px] f-r text-[11px] leading-snug text-white whitespace-pre-line">
          {`Demo · ${want}\n${hint}`}
        </div>
      )}
    </main>
  );
}

/** Stand-in for the cover app itself. Not part of this test. */
export function CoverApp({ cover, onBack }: { cover: string; onBack: () => void }) {
  return (
    <div className="flex-1 bg-[#ebebeb] flex flex-col items-center justify-center gap-[12px] p-[20px]">
      <Card strong>
        <Label>Cover app · {cover}</Label>
        <Heading>Not yet implemented</Heading>
        <p className="f-r text-[13px] text-[#666]">
          In the finished app this is {cover}, the cover app. That part is not included in this test.
        </p>
      </Card>
      <Spacer />
      <Button onClick={onBack}>Back to Nura</Button>
    </div>
  );
}
