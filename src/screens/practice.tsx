import { useEffect, useRef, useState } from "react";
import { Button, CheckMark, Heading } from "../ui";
import { CoverLogo, HOLD_MS, HOLD_SLOP } from "./lock";

/*
 * Guided practice for "hold the icon on the loading screen", opened from setup (Your private way in → Try now).
 * It looks like the real loading screen (screens/lock.tsx), but it is a separate screen on purpose: the real one
 * must never show hints, rings or the word Nura, because anyone holding the phone would see them.
 *
 * Round 1, guided: the bar stops at 30%, a hint points at the icon, a ring fills while holding, mistakes get a tip.
 * Round 2, as it really looks: no ring, no hint. Only after two misses (or a long wait) a quiet nudge appears.
 */

const PAUSE_AT = 0.3;        // the bar fills to here, then waits: practice never runs out of time
const FILL_MS = 900;         // how long the bar takes to reach PAUSE_AT
const FINISH_MS = 600;       // after a good hold, the rest of the bar fills this fast
const HINT_AFTER_MS = 1500;  // round 1: no touch for this long → show "Press and hold here"
const NUDGE_AFTER_MS = 6000; // round 2: no touch for this long → show the quiet nudge
const NUDGE_AFTER_MISSES = 2;
const CELEBRATE_MS = 1800;   // how long the "That's it" and "You're ready" screens stay before moving on

type Phase = "play" | "nice" | "next" | "done";
type Tip = "hint" | "holding" | "early" | "elsewhere" | "still" | "nudge" | null;

const TIPS: Record<Exclude<Tip, null>, string> = {
  hint: "Press and hold here for 3 seconds",
  holding: "Keep holding…",
  early: "Keep holding a little longer",
  elsewhere: "Hold on the icon",
  still: "Keep your finger still on the icon",
  nudge: "Not quite. Hold the icon for 3 seconds.",
};

// The ring around the icon: radius 55, just clear of the icon's rounded corners.
const RING_R = 55;
const RING_LEN = 2 * Math.PI * RING_R;

/** A short buzz on Android when the hold works. iPhones do not let websites vibrate, so nothing happens there. */
function buzz() {
  try { navigator.vibrate?.(60); } catch { /* not supported */ }
}

/** `onExit(learned)`: learned is true once round 1 was done, so setup can mark the card as tried. */
export function HoldPractice({ cover, onExit }: { cover: string; onExit: (learned: boolean) => void }) {
  const [phase, setPhase] = useState<Phase>("play");
  const [round, setRound] = useState<1 | 2>(1);
  const [bar, setBar] = useState(0);
  const [ring, setRing] = useState(0);   // 0–1, how much of the 3 s hold is done (only drawn in round 1)
  const [tip, setTip] = useState<Tip>(null);
  const learned = useRef(false);
  const iconRef = useRef<HTMLSpanElement>(null);
  const exit = useRef(onExit);
  exit.current = onExit;
  const s = useRef({ down: false, id: -1, downAt: 0, x: 0, y: 0, onIcon: false, moved: false, idleSince: 0, misses: 0, finishing: false, bar: 0 });

  // One round: bar to 30%, wait for a 3 s hold on the icon, then fill the bar and celebrate.
  useEffect(() => {
    if (phase !== "play") return;
    Object.assign(s.current, { down: false, id: -1, moved: false, idleSince: performance.now(), misses: 0, finishing: false, bar: 0 });
    setBar(0); setRing(0); setTip(null);
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
        const holding = t.down && t.onIcon && !t.moved;
        const p = holding ? (now - t.downAt) / HOLD_MS : 0;
        if (p >= 1) { t.finishing = true; buzz(); setTip(null); }
        if (round === 1) setRing(Math.min(1, p));
        // Hints when nobody is touching: straight away-ish in round 1, only after misses or a long wait in round 2.
        if (!t.down) {
          const idle = now - t.idleSince;
          if (round === 1 && idle > HINT_AFTER_MS) setTip((x) => x ?? "hint");
          if (round === 2 && (t.misses >= NUDGE_AFTER_MISSES || idle > NUDGE_AFTER_MS)) setTip("nudge");
        }
      }
      setBar(t.bar);
    }, 16);
    return () => window.clearInterval(timer);
  }, [phase, round]);

  // "That's it" moves on to round 2's intro by itself; "You're ready" goes back to setup by itself.
  useEffect(() => {
    if (phase !== "nice" && phase !== "done") return;
    const id = window.setTimeout(() => (phase === "nice" ? setPhase("next") : exit.current(true)), CELEBRATE_MS);
    return () => window.clearTimeout(id);
  }, [phase]);

  const onDown = (e: React.PointerEvent<HTMLElement>) => {
    const t = s.current;
    if (t.finishing || t.down) return;
    if ((e.target as Element).closest("[data-practice-back]")) return;
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* ignore */ }
    const onIcon = !!iconRef.current?.contains(e.target as Node);
    Object.assign(t, { down: true, id: e.pointerId, downAt: performance.now(), x: e.clientX, y: e.clientY, onIcon, moved: false });
    if (round === 1) setTip(onIcon ? "holding" : "elsewhere");
  };
  const onMove = (e: React.PointerEvent) => {
    const t = s.current;
    if (!t.down || e.pointerId !== t.id || t.moved) return;
    if (Math.hypot(e.clientX - t.x, e.clientY - t.y) > HOLD_SLOP) {
      t.moved = true;
      if (round === 1 && t.onIcon) setTip("still");
    }
  };
  const onUp = (e: React.PointerEvent) => {
    const t = s.current;
    if (!t.down || e.pointerId !== t.id) return;
    t.down = false;
    t.idleSince = performance.now();
    if (t.finishing) return;
    t.misses += 1;
    setRing(0);
    if (round === 1) setTip(!t.onIcon ? "elsewhere" : t.moved ? "still" : "early");
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
      <main className="relative flex flex-1 flex-col items-center justify-center gap-[16px] min-h-0 px-[24px] w-full max-w-[560px] mx-auto text-center">
        {back}
        {phase === "nice" && (
          <>
            <CheckMark size={72} />
            <Heading>That's it</Heading>
            <p className="f-r text-[14px] text-[#666]">Holding the icon for 3 seconds opens Nura.</p>
          </>
        )}
        {phase === "next" && (
          <>
            <Heading>Now without help</Heading>
            <p className="f-r text-[14px] text-[#666]">This time it looks like the real thing: no ring and no tips. Hold the {cover} icon for 3 seconds.</p>
            <div className="w-full flex flex-col gap-[10px] mt-[8px]">
              <Button onClick={() => { setRound(2); setPhase("play"); }}>Try it</Button>
              <Button variant="secondary" onClick={() => exit.current(true)}>Back to setup</Button>
            </div>
          </>
        )}
        {phase === "done" && (
          <>
            <CheckMark size={72} />
            <Heading>You're ready</Heading>
            <p className="f-r text-[14px] text-[#666]">Whenever you open {cover}, hold the icon for 3 seconds to open Nura.</p>
          </>
        )}
      </main>
    );
  }

  const guided = round === 1;
  // Round 1 pulses the icon while waiting or after a mistake, to point at it.
  const pulse = guided && (tip === "hint" || tip === "early" || tip === "elsewhere" || tip === "still");

  return (
    <main onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}
      onContextMenu={(e) => e.preventDefault()} style={{ touchAction: "none", WebkitTouchCallout: "none" }}
      className="relative flex flex-1 flex-col items-center justify-center gap-[14px] min-h-0 px-[24px] w-full max-w-[560px] mx-auto select-none">
      {back}
      <span data-practice-label className="absolute right-[16px] top-[14px] f-m text-[11px] tracking-[0.6px] uppercase text-[#999]">
        Practice · {round} of 2
      </span>

      <div className="flex-[2]" />
      <span ref={iconRef} className="relative">
        <CoverLogo size={88} />
        {/* Tip bubble above the icon (round 1), or the quiet nudge (round 2). */}
        {tip && (guided || tip === "nudge") && (
          <span data-practice-tip className={`absolute left-1/2 -translate-x-1/2 bottom-[calc(100%+30px)] whitespace-nowrap pointer-events-none ${
            guided ? "rounded-[10px] bg-[#1a1a1a] text-white px-[12px] py-[7px] f-s text-[13px]" : "f-r text-[13px] text-[#666]"}`}>
            {TIPS[tip]}
            {guided && <span className="absolute left-1/2 -translate-x-1/2 top-full size-0 border-x-[6px] border-x-transparent border-t-[6px] border-t-[#1a1a1a]" />}
          </span>
        )}
        {guided && (
          <svg aria-hidden viewBox="0 0 120 120" className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 size-[120px] pointer-events-none">
            {/* Pulsing halo that points at the icon */}
            {pulse && <circle cx="60" cy="60" r={RING_R} fill="none" stroke="#c7c7c7" strokeWidth="3" style={{ animation: "cue-pulse 1.2s ease-in-out infinite" }} />}
            {/* Fills over the 3 s hold */}
            <circle cx="60" cy="60" r={RING_R} fill="none" stroke="#1a1a1a" strokeWidth="3" strokeLinecap="round"
              strokeDasharray={RING_LEN} strokeDashoffset={RING_LEN * (1 - ring)} transform="rotate(-90 60 60)"
              opacity={ring > 0 ? 1 : 0} />
          </svg>
        )}
      </span>
      {/* A little more room than the real screen, so the ring never touches the name. */}
      <p className="relative mt-[8px] f-b text-[22px] text-[#1a1a1a]">{cover}</p>
      <div className="flex-[3]" />
      <div className="relative w-[180px] h-[6px] rounded-full bg-[#ebebeb] overflow-hidden" role="progressbar" aria-label="Loading">
        <div className="h-full rounded-full bg-[#1a1a1a]" style={{ width: `${bar * 100}%` }} />
      </div>
      <p className="relative f-r text-[12px] text-[#666] mb-[40px]">Loading…</p>
    </main>
  );
}
