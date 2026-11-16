import { useEffect, useRef, useState } from "react";
import { Bloom, TAPS, WINDOW_MS } from "./cover";
import { PracticeEnd, buzz } from "./practice";

/*
 * Guided practice for "tap the progress bar in Bloom 3 times", opened from setup (Your private way in → Try now)
 * and from Settings → Practice. It is the real Bloom screen (screens/cover.tsx) with a practice strip on top, but a
 * separate screen on purpose: the real one must never show tips or the word Nura, because anyone holding the phone
 * would see them.
 *
 * The taps count the same way as the real thing: 3 taps within 3 s of the first one, otherwise the count starts over.
 * Round 1, guided: a tooltip points at the ring, counts the taps ("1 of 3"), and says what went wrong.
 * Round 2, as it really looks: no tooltip. Only after two misses (or a long wait) a quiet nudge appears.
 */

const HINT_AFTER_MS = 1500;  // round 1: no tap for this long → show "Tap the progress bar 3 times"
const NUDGE_AFTER_MS = 6000; // round 2: no tap for this long → show the quiet nudge
const NUDGE_AFTER_MISSES = 2;
const OPEN_DELAY_MS = 500;   // after the 3rd tap, a short pause before "That's it", so the last tap is seen to land

type Phase = "play" | "nice" | "next" | "done";
type Tip = "hint" | "one" | "two" | "slow" | "elsewhere" | "nudge" | null;

const TIPS: Record<Exclude<Tip, null>, string> = {
  hint: `Tap the progress bar ${TAPS} times`,
  one: "1 of 3, keep going",
  two: "2 of 3, one more",
  slow: "A bit quicker: 3 taps within 3 seconds",
  elsewhere: "Tap the progress bar, here",
  nudge: "Not quite. Tap the progress bar 3 times, quickly.",
};

/** `onExit(learned)`: learned is true once round 1 was done, so setup can mark the card as tried. */
export function TapPractice({ cover, toast, onExit }: { cover: string; toast: (t: string) => void; onExit: (learned: boolean) => void }) {
  const [phase, setPhase] = useState<Phase>("play");
  const [round, setRound] = useState<1 | 2>(1);
  const [tip, setTip] = useState<Tip>(null);
  const learned = useRef(false);
  const exit = useRef(onExit);
  exit.current = onExit;
  const s = useRef({ count: 0, misses: 0, lastTap: 0, done: false });
  const windowTimer = useRef(0);

  // One round: wait for 3 quick taps on the ring. Hints appear when nobody is tapping.
  useEffect(() => {
    if (phase !== "play") return;
    Object.assign(s.current, { count: 0, misses: 0, lastTap: performance.now(), done: false });
    setTip(null);
    const id = window.setInterval(() => {
      const t = s.current;
      if (t.done || t.count > 0) return;
      const idle = performance.now() - t.lastTap;
      if (round === 1 && idle > HINT_AFTER_MS) setTip((x) => x ?? "hint");
      if (round === 2 && (t.misses >= NUDGE_AFTER_MISSES || idle > NUDGE_AFTER_MS)) setTip("nudge");
    }, 200);
    return () => { window.clearInterval(id); window.clearTimeout(windowTimer.current); };
  }, [phase, round]);

  const onRingTap = () => {
    const t = s.current;
    if (t.done) return;
    t.lastTap = performance.now();
    t.count += 1;
    // The first tap starts the 3 s window. If it runs out before the 3rd tap, the count starts over: a miss.
    if (t.count === 1) {
      windowTimer.current = window.setTimeout(() => {
        if (t.done) return;
        t.count = 0;
        t.misses += 1;
        t.lastTap = performance.now();
        if (round === 1) setTip("slow");
        else if (t.misses >= NUDGE_AFTER_MISSES) setTip("nudge");
      }, WINDOW_MS);
    }
    if (t.count >= TAPS) {
      t.done = true;
      window.clearTimeout(windowTimer.current);
      buzz();
      setTip(null);
      window.setTimeout(() => {
        if (round === 1) learned.current = true;
        setPhase(round === 1 ? "nice" : "done");
      }, OPEN_DELAY_MS);
      return;
    }
    if (round === 1) setTip(t.count === 1 ? "one" : "two");
  };

  // Round 1: a tap anywhere but the ring (and the Back button) gets pointed back to the ring.
  const onPointerDown = (e: React.PointerEvent) => {
    const el = e.target as Element;
    if (round !== 1 || s.current.done || el.closest("[data-ring]") || el.closest("[data-practice-back]")) return;
    setTip("elsewhere");
  };

  // A strip above Bloom, so Back and the round never sit on top of the cover app's own title.
  const strip = (
    <div className="flex items-center justify-between shrink-0 px-[12px] pt-[4px] w-full max-w-[560px] mx-auto">
      <button data-practice-back onClick={() => exit.current(learned.current)}
        className="flex items-center gap-[4px] h-[36px] pl-[6px] pr-[12px] rounded-full f-m text-[13px] text-[#1a1a1a] hover:bg-[#ebebeb]">
        <span data-symbol aria-hidden className="material-symbols-outlined leading-none" style={{ fontSize: 20 }}>arrow_back</span>
        Back
      </button>
      {phase === "play" && (
        <span data-practice-label className="f-m text-[11px] tracking-[0.6px] uppercase text-[#999]">Practice · {round} of 2</span>
      )}
    </div>
  );

  if (phase !== "play") {
    return (
      <>
        {strip}
        <PracticeEnd phase={phase} onNext={() => setPhase("next")}
          onTry={() => { setRound(2); setPhase("play"); }} onExit={() => exit.current(true)}
          nice={`Tapping the progress bar ${TAPS} times opens Nura.`}
          next={`This time it looks like the real thing: no tips. Tap the progress bar in ${cover} ${TAPS} times.`}
          done={`Whenever you're in ${cover}, tap the progress bar ${TAPS} times to open Nura.`} />
      </>
    );
  }

  const guided = round === 1;
  // Round 1 pulses a halo around the ring while waiting or after a mistake, to point at it.
  const pulse = guided && (tip === "hint" || tip === "slow" || tip === "elsewhere");
  const shown = tip && (guided || tip === "nudge") ? tip : null;

  const overlay = (
    <>
      {pulse && (
        <svg aria-hidden viewBox="0 0 88 88" className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 size-[88px] pointer-events-none">
          <circle cx="44" cy="44" r="41" fill="none" stroke="#c7c7c7" strokeWidth="3" style={{ animation: "cue-pulse 1.2s ease-in-out infinite" }} />
        </svg>
      )}
      {/* Tooltip under the ring, its arrow pointing up at it. Left-aligned to the ring: centred, it would run off the screen. */}
      {shown && (
        <span data-practice-tip role="status" className={`absolute left-[-6px] top-[calc(100%+14px)] z-10 w-max max-w-[280px] pointer-events-none rounded-[10px] px-[12px] py-[7px] text-[13px] ${
          guided ? "bg-[#1a1a1a] text-white f-s" : "bg-white text-[#666] f-r border-[1.5px] border-[#c7c7c7]"}`}>
          {TIPS[shown]}
          {guided && <span className="absolute left-[42px] -translate-x-1/2 bottom-full size-0 border-x-[6px] border-x-transparent border-b-[6px] border-b-[#1a1a1a]" />}
        </span>
      )}
    </>
  );

  return (
    <>
      {strip}
      <div className="flex flex-1 flex-col min-h-0" onPointerDown={onPointerDown}>
        <Bloom name={cover} toast={toast} onRingTap={onRingTap} ringOverlay={overlay} />
      </div>
    </>
  );
}
