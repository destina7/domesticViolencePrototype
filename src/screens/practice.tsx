import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { Button, CheckMark, Heading } from "../ui";
import type { SecretDesign } from "../data";
import { CoverLogo, MOVE_SLOP, PATTERN, TAP_MAX_MS, addCell, cellAt } from "./lock";
import { TAPS, WINDOW_MS } from "./cover";

/*
 * Guided practice for the loading screen's way in, in the version picked in the hidden menu (three taps on the
 * logo, or drawing the L). Opened from setup (Your private way in → Try now) and Settings → Practice.
 * It looks like the real loading screen (screens/lock.tsx) and uses its rules, but it is a separate screen on purpose:
 * the real one must never show tips, a grid or the word Nura, because anyone holding the phone would see them.
 *
 * Round 1, guided: the bar stops at 30% so there is no rush, and tips say what to do and what went wrong.
 *   Taps: a tooltip points at the logo and counts the taps. The L: the grid shows as dots, with the L to follow
 *   and a trail of what was drawn.
 * Round 2, as it really looks: no tips, no grid. Only after two misses (or a long wait) a quiet nudge appears.
 */

const PAUSE_AT = 0.3;        // the bar fills to here, then waits: practice never runs out of time
const FILL_MS = 900;         // how long the bar takes to reach PAUSE_AT
const FINISH_MS = 600;       // after the way in is done, the rest of the bar fills this fast
const HINT_AFTER_MS = 1500;  // round 1: no touch for this long → show the hint
const NUDGE_AFTER_MS = 6000; // round 2: no touch for this long → show the quiet nudge
const NUDGE_AFTER_MISSES = 2;
const CELEBRATE_MS = 1800;   // how long the "That's it" and "You're ready" screens stay before moving on

type Phase = "play" | "nice" | "next" | "done";
type Tip = "hint" | "one" | "two" | "slow" | "elsewhere" | "wrong" | "nudge" | null;

const TIPS: Record<SecretDesign, Partial<Record<Exclude<Tip, null>, string>>> = {
  taps: {
    hint: `Tap the logo ${TAPS} times`,
    one: "1 of 3, keep going",
    two: "2 of 3, one more",
    slow: "A bit quicker: 3 taps within 3 seconds",
    elsewhere: "Tap the logo",
    nudge: "Not quite. Tap the logo 3 times, quickly.",
  },
  pattern: {
    hint: "Draw an L: down the left side, then along the bottom",
    wrong: "Not quite. Start at the top left, go down, then right",
    nudge: "Not quite. Draw an L: down the left side, then along the bottom.",
  },
};

// The grid's cells in a 300 x 300 box over the screen, for the guide and the trail (round 1, the L only).
const cellPoint = (c: number) => `${(((c - 1) % 3) + 0.5) * 100},${(Math.floor((c - 1) / 3) + 0.5) * 100}`;

/** A short buzz on Android when the way in works. iPhones do not let websites vibrate, so nothing happens there. */
export function buzz() {
  try { navigator.vibrate?.(60); } catch { /* not supported */ }
}

/** `onExit(learned)`: learned is true once round 1 was done, so setup can mark the card as tried. */
export function LoadingPractice({ cover, secret, onExit }: { cover: string; secret: SecretDesign; onExit: (learned: boolean) => void }) {
  const [phase, setPhase] = useState<Phase>("play");
  const [round, setRound] = useState<1 | 2>(1);
  const [bar, setBar] = useState(0);
  const [tip, setTip] = useState<Tip>(null);
  const [trail, setTrail] = useState<number[]>([]);   // the L: cells drawn so far (shown in round 1)
  const learned = useRef(false);
  const mainRef = useRef<HTMLElement>(null);
  const logoRef = useRef<HTMLSpanElement>(null);
  const exit = useRef(onExit);
  exit.current = onExit;
  const s = useRef({
    down: false, id: -1, downAt: 0, x: 0, y: 0, moved: false, onLogo: false, path: [] as number[],
    taps: 0, idleSince: 0, misses: 0, finishing: false, bar: 0,
  });
  const windowTimer = useRef(0);
  const taps = secret === "taps";
  const guided = round === 1;

  const finish = () => {
    const t = s.current;
    t.finishing = true;
    window.clearTimeout(windowTimer.current);
    buzz();
    setTip(null);
  };
  const miss = (kind: Exclude<Tip, null>) => {
    const t = s.current;
    t.misses += 1;
    if (round === 1) setTip(kind);
    else if (t.misses >= NUDGE_AFTER_MISSES) setTip("nudge");
  };

  // One round: bar to 30%, wait for the way in, then fill the bar and celebrate.
  useEffect(() => {
    if (phase !== "play") return;
    Object.assign(s.current, { down: false, id: -1, moved: false, path: [], taps: 0, idleSince: performance.now(), misses: 0, finishing: false, bar: 0 });
    setBar(0); setTip(null); setTrail([]);
    let last = performance.now();
    // ~60 fps timer, not requestAnimationFrame, for the same reason as the real loading screen (hidden previews).
    const timer = window.setInterval(() => {
      const now = performance.now(), dt = Math.min(now - last, 250);
      last = now;
      const t = s.current;
      if (t.finishing) {
        t.bar = Math.min(1, t.bar + dt / FINISH_MS);
        if (t.bar >= 1) {
          window.clearInterval(timer);
          if (round === 1) learned.current = true;
          setPhase(round === 1 ? "nice" : "done");
        }
      } else {
        t.bar = Math.min(PAUSE_AT, t.bar + (dt / FILL_MS) * PAUSE_AT);
        // Hints when nobody is touching: soon in round 1, only after misses or a long wait in round 2.
        if (!t.down && t.taps === 0) {
          const idle = now - t.idleSince;
          if (round === 1 && idle > HINT_AFTER_MS) setTip((x) => x ?? "hint");
          if (round === 2 && (t.misses >= NUDGE_AFTER_MISSES || idle > NUDGE_AFTER_MS)) setTip("nudge");
        }
      }
      setBar(t.bar);
    }, 16);
    return () => { window.clearInterval(timer); window.clearTimeout(windowTimer.current); };
  }, [phase, round]);

  const track = (e: React.PointerEvent) => {
    const r = mainRef.current?.getBoundingClientRect();
    const c = r && cellAt(e.clientX, e.clientY, r);
    if (!c) return;
    const t = s.current, before = t.path.length;
    addCell(t.path, c);
    if (t.path.length !== before) setTrail([...t.path]);
  };

  const onDown = (e: React.PointerEvent<HTMLElement>) => {
    const t = s.current;
    if (t.finishing || t.down) return;
    if ((e.target as Element).closest("[data-practice-back]")) return;
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* ignore */ }
    Object.assign(t, {
      down: true, id: e.pointerId, downAt: performance.now(), x: e.clientX, y: e.clientY, moved: false, path: [],
      onLogo: !!logoRef.current?.contains(e.target as Node),
    });
    if (!taps) { setTrail([]); if (guided) setTip(null); track(e); }
    else if (guided && !t.onLogo) setTip("elsewhere");
  };
  const onMove = (e: React.PointerEvent) => {
    const t = s.current;
    if (!t.down || e.pointerId !== t.id) return;
    if (Math.hypot(e.clientX - t.x, e.clientY - t.y) > MOVE_SLOP) t.moved = true;
    if (!taps) track(e);
  };
  const onUp = (e: React.PointerEvent) => {
    const t = s.current;
    if (!t.down || e.pointerId !== t.id) return;
    const now = performance.now(), held = now - t.downAt;
    t.down = false;
    t.idleSince = now;
    if (t.finishing) return;
    if (taps) {
      if (!t.onLogo || t.moved || held > TAP_MAX_MS) return;
      t.taps += 1;
      // The first tap starts the 3 s window. If it runs out before the 3rd tap, the count starts over: a miss.
      if (t.taps === 1) {
        windowTimer.current = window.setTimeout(() => {
          if (t.finishing) return;
          t.taps = 0;
          t.idleSince = performance.now();
          miss("slow");
        }, WINDOW_MS);
      }
      if (t.taps >= TAPS) finish();
      else if (guided) setTip(t.taps === 1 ? "one" : "two");
    } else if (t.path.join() === PATTERN.join()) {
      finish();
    } else if (t.path.length > 0) {
      miss("wrong");
    }
  };

  const back = (
    <button data-practice-back onClick={() => exit.current(learned.current)}
      className="absolute left-[12px] top-[8px] z-10 flex items-center gap-[4px] h-[36px] pl-[6px] pr-[12px] rounded-full f-m text-[13px] text-[#1a1a1a] hover:bg-[#ebebeb]">
      <span data-symbol aria-hidden className="material-symbols-outlined leading-none" style={{ fontSize: 20 }}>arrow_back</span>
      Back
    </button>
  );

  if (phase !== "play") {
    return (
      <PracticeEnd phase={phase} back={back} onNext={() => setPhase("next")}
        onTry={() => { setRound(2); setPhase("play"); }} onExit={() => exit.current(true)}
        nice={taps ? "Tapping the logo 3 times opens Nura." : "Drawing the L while it loads opens Nura."}
        next={taps
          ? `This time it looks like the real thing: no tips. While ${cover} loads, tap the logo 3 times.`
          : `This time it looks like the real thing: no dots and no tips. While ${cover} loads, draw the L.`}
        done={taps
          ? `Whenever you open ${cover}, tap the logo 3 times while it loads to open Nura.`
          : `Whenever you open ${cover}, draw the L while it loads to open Nura.`} />
    );
  }

  const text = tip && (guided || tip === "nudge") ? TIPS[secret][tip] : undefined;
  // Round 1 pulses a halo around the logo while waiting or after a mistake, to point at it (taps only).
  const pulse = guided && taps && (tip === "hint" || tip === "slow" || tip === "elsewhere");
  const bubble = (where: string, arrow: "down" | null) => (
    <span data-practice-tip role="status" className={`absolute z-10 w-max max-w-[280px] text-center pointer-events-none ${where} ${
      guided ? "rounded-[10px] bg-[#1a1a1a] text-white px-[12px] py-[7px] f-s text-[13px]" : "f-r text-[13px] text-[#666]"}`}>
      {text}
      {guided && arrow && <span className="absolute left-1/2 -translate-x-1/2 top-full size-0 border-x-[6px] border-x-transparent border-t-[6px] border-t-[#1a1a1a]" />}
    </span>
  );

  return (
    <main ref={mainRef} onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}
      onContextMenu={(e) => e.preventDefault()} style={{ touchAction: "none", WebkitTouchCallout: "none" }}
      className="relative flex flex-1 flex-col items-center justify-center gap-[14px] min-h-0 px-[24px] w-full max-w-[560px] mx-auto select-none">
      {back}
      <span data-practice-label className="absolute right-[16px] top-[14px] f-m text-[11px] tracking-[0.6px] uppercase text-[#999]">
        Practice · {round} of 2
      </span>

      {/* The L, round 1: the invisible grid as dots, the L to follow (dashed) and what was drawn (solid). */}
      {!taps && guided && (
        <div aria-hidden className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 grid grid-cols-3 grid-rows-3">
            {Array.from({ length: 9 }, (_, i) => (
              <div key={i} className="flex items-center justify-center">
                <span className={`size-[12px] rounded-full ${trail.includes(i + 1) ? "bg-[#1a1a1a]" : "bg-[#c7c7c7]"}`} />
              </div>
            ))}
          </div>
          <svg viewBox="0 0 300 300" preserveAspectRatio="none" className="absolute inset-0 size-full">
            <polyline points={PATTERN.map(cellPoint).join(" ")} fill="none" stroke="#c7c7c7" strokeWidth="3"
              strokeDasharray="8 8" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
            {trail.length > 1 && (
              <polyline points={trail.map(cellPoint).join(" ")} fill="none" stroke="#1a1a1a" strokeWidth="4"
                strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
            )}
          </svg>
        </div>
      )}
      {/* The L: tips sit at the top, out of the way of the drawing. */}
      {!taps && text && bubble("left-1/2 -translate-x-1/2 top-[56px]", null)}

      <div className="flex-[2]" />
      {/* Same tap area around the logo as the real screen. Round 1 (taps): the tooltip above it and the halo around it. */}
      <span ref={logoRef} className="relative p-[10px] -m-[10px]">
        {pulse && (
          <svg aria-hidden viewBox="0 0 120 120" className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 size-[120px] pointer-events-none">
            <circle cx="60" cy="60" r="56" fill="none" stroke="#c7c7c7" strokeWidth="3" style={{ animation: "cue-pulse 1.2s ease-in-out infinite" }} />
          </svg>
        )}
        {taps && text && bubble("left-1/2 -translate-x-1/2 bottom-[calc(100%+14px)]", "down")}
        <CoverLogo size={88} />
      </span>
      <p className="relative f-b text-[22px] text-[#1a1a1a]">{cover}</p>
      <div className="flex-[3]" />
      <div className="w-[180px] h-[6px] rounded-full bg-[#ebebeb] overflow-hidden" role="progressbar" aria-label="Loading">
        <div className="h-full rounded-full bg-[#1a1a1a]" style={{ width: `${bar * 100}%` }} />
      </div>
      <p className="relative f-r text-[12px] text-[#666] mb-[40px]">Loading…</p>
    </main>
  );
}

/**
 * The screens between and after the two rounds, shared by both practices (this one and screens/practice-tap.tsx).
 * "That's it" (after round 1) moves on to "Now without help" by itself; "You're ready" (after round 2) leaves by itself.
 */
export function PracticeEnd({ phase, back, nice, next, done, onNext, onTry, onExit }: {
  phase: "nice" | "next" | "done"; back?: ReactNode; nice: string; next: string; done: string;
  onNext: () => void; onTry: () => void; onExit: () => void;
}) {
  const go = useRef({ onNext, onExit });
  go.current = { onNext, onExit };
  useEffect(() => {
    if (phase === "next") return;
    const id = window.setTimeout(() => (phase === "nice" ? go.current.onNext() : go.current.onExit()), CELEBRATE_MS);
    return () => window.clearTimeout(id);
  }, [phase]);

  return (
    <main className="relative flex flex-1 flex-col items-center justify-center gap-[16px] min-h-0 px-[24px] w-full max-w-[560px] mx-auto text-center">
      {back}
      {phase === "nice" && (
        <>
          <CheckMark size={72} />
          <Heading>That's it</Heading>
          <p className="f-r text-[14px] text-[#666]">{nice}</p>
        </>
      )}
      {phase === "next" && (
        <>
          <Heading>Now without help</Heading>
          <p className="f-r text-[14px] text-[#666]">{next}</p>
          <div className="w-full flex flex-col gap-[10px] mt-[8px]">
            <Button onClick={onTry}>Try it</Button>
            <Button variant="secondary" onClick={onExit}>Back to setup</Button>
          </div>
        </>
      )}
      {phase === "done" && (
        <>
          <CheckMark size={72} />
          <Heading>You're ready</Heading>
          <p className="f-r text-[14px] text-[#666]">{done}</p>
        </>
      )}
    </main>
  );
}
