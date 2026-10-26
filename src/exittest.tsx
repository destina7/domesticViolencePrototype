import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import type { ExitPlace, Options } from "./data";
import { Button, Heading, Label } from "./ui";
import {
  CUES_PER_BLOCK, MAX_GAP_MS, MIN_GAP_MS, PRACTICE_CUES,
  getCounter, loadData, orderFor, saveData, setCounter, wipeData,
} from "./testing";
import type { Hand, Participant, Rect, Tap, Trial } from "./testing";

export type Phase = "idle" | "intro" | "gap" | "cue" | "done";

type Draft = {
  block: number; cueNo: number; position: ExitPlace; screen: string; gapMs: number; cueAt: number;
  t0: number | null; firstTouchMs: number | null; firstTapHit: boolean | null; exitMs: number | null;
  exitRect: Rect | null; exitTap: { fx: number; fy: number } | null; missTaps: Tap[]; frameW: number; frameH: number;
};

const frameEl = () => document.querySelector("[data-phone]") as HTMLElement | null;
const exitEl = () => document.querySelector("[data-quick-exit]") as HTMLElement | null;
const rectOf = (el: Element | null): Rect | null => {
  const f = frameEl();
  if (!el || !f) return null;
  const r = el.getBoundingClientRect();
  const fr = f.getBoundingClientRect();
  return { x: Math.round(r.left - fr.left), y: Math.round(r.top - fr.top), w: Math.round(r.width), h: Math.round(r.height) };
};

function persist(p: Participant) {
  const d = loadData();
  const copy = JSON.parse(JSON.stringify(p)) as Participant;
  const i = d.participants.findIndex((x) => x.id === p.id);
  if (i >= 0) d.participants[i] = copy; else d.participants.push(copy);
  saveData(d);
}

/**
 * Runs the quick-exit speed test: four blocks (one per exit position, rotated per participant),
 * a few cues per block at random moments, and logs how long each exit takes.
 * `canCue` must be true only while the participant is inside the app (not in setup, not after quick exit).
 */
export function useExitTest({ screen, canCue, opt, setOpt }: { screen: string; canCue: boolean; opt: Options; setOpt: (o: Options) => void }) {
  const [phase, setPhaseState] = useState<Phase>("idle");
  const [blockIdx, setBlockIdx] = useState(0);
  const [cueNo, setCueNo] = useState(1);
  const [introKind, setIntroKind] = useState<"start" | "moved">("start");
  const [participantNo, setParticipantNoState] = useState(getCounter);

  const phaseRef = useRef<Phase>("idle");
  const setPhase = (p: Phase) => { phaseRef.current = p; setPhaseState(p); };
  const runRef = useRef<Participant | null>(null);
  const blockRef = useRef(0);
  const cueNoRef = useRef(1);
  const cueRef = useRef<Draft | null>(null);
  const remainingRef = useRef<number | null>(null);
  const gapRef = useRef(0);
  const screenRef = useRef(screen); screenRef.current = screen;
  const optRef = useRef(opt); optRef.current = opt;

  /* ---------- the random wait between cues (pauses while the participant is outside the app) ---------- */

  useEffect(() => {
    if (phase !== "gap" || !canCue) return;
    if (remainingRef.current === null) {
      gapRef.current = MIN_GAP_MS + Math.random() * (MAX_GAP_MS - MIN_GAP_MS);
      remainingRef.current = gapRef.current;
    }
    const wait = remainingRef.current;
    const began = performance.now();
    const id = window.setTimeout(() => { remainingRef.current = null; fireCue(); }, wait);
    return () => {
      window.clearTimeout(id);
      if (remainingRef.current !== null) remainingRef.current = Math.max(0, wait - (performance.now() - began));
    };
  }, [phase, canCue]);

  const fireCue = () => {
    const p = runRef.current;
    if (!p) return;
    const fr = frameEl()?.getBoundingClientRect();
    cueRef.current = {
      block: blockRef.current + 1, cueNo: cueNoRef.current, position: p.order[blockRef.current],
      screen: screenRef.current, gapMs: Math.round(gapRef.current), cueAt: Date.now(),
      t0: null, firstTouchMs: null, firstTapHit: null, exitMs: null, exitRect: null, exitTap: null, missTaps: [],
      frameW: fr ? Math.round(fr.width) : 0, frameH: fr ? Math.round(fr.height) : 0,
    };
    setPhase("cue");
  };

  /* ---------- record every touch while a cue is showing ---------- */

  useEffect(() => {
    if (phase !== "cue") return;
    const onDown = (e: PointerEvent) => {
      const c = cueRef.current;
      if (!c || c.t0 === null) return;
      const target = e.target instanceof Element ? e.target : null;
      if (target?.closest("[data-facilitator]")) return;
      const dt = Math.round(performance.now() - c.t0);
      const fr = frameEl()?.getBoundingClientRect();
      const fx = Math.round(e.clientX - (fr?.left ?? 0));
      const fy = Math.round(e.clientY - (fr?.top ?? 0));
      const hit = target?.closest("[data-quick-exit]") ?? null;
      if (c.firstTouchMs === null) { c.firstTouchMs = dt; c.firstTapHit = !!hit; }
      if (hit) {
        if (c.exitMs === null) { c.exitMs = dt; c.exitRect = rectOf(hit) ?? c.exitRect; c.exitTap = { fx, fy }; }
      } else if (c.exitMs === null) {
        const ex = exitEl()?.getBoundingClientRect();
        const dist = ex ? Math.round(Math.hypot(e.clientX - (ex.left + ex.width / 2), e.clientY - (ex.top + ex.height / 2))) : null;
        c.missTaps.push({ t: dt, fx, fy, dist });
      }
    };
    window.addEventListener("pointerdown", onDown, true);
    return () => window.removeEventListener("pointerdown", onDown, true);
  }, [phase]);

  /* ---------- finishing a cue and moving on ---------- */

  const complete = () => {
    const p = runRef.current;
    const c = cueRef.current;
    if (!p || !c) return;
    const trial: Trial = {
      id: p.trials.length + 1, block: c.block, position: c.position, cueIndex: c.cueNo, practice: c.cueNo <= PRACTICE_CUES,
      screen: c.screen, gapMs: c.gapMs, cueAt: c.cueAt, firstTouchMs: c.firstTouchMs,
      exitMs: c.exitMs ?? (c.t0 !== null ? Math.round(performance.now() - c.t0) : null),
      firstTapHit: c.firstTapHit, missTaps: c.missTaps, exitRect: c.exitRect, exitTap: c.exitTap, frameW: c.frameW, frameH: c.frameH,
    };
    p.trials.push(trial);
    cueRef.current = null;
    remainingRef.current = null;
    if (cueNoRef.current < CUES_PER_BLOCK) {
      cueNoRef.current += 1; setCueNo(cueNoRef.current);
      persist(p); setPhase("gap");
    } else if (blockRef.current < p.order.length - 1) {
      blockRef.current += 1; cueNoRef.current = 1;
      setBlockIdx(blockRef.current); setCueNo(1);
      setOpt({ ...optRef.current, exit: p.order[blockRef.current] });
      setIntroKind("moved");
      persist(p); setPhase("intro");
    } else {
      p.status = "completed"; p.endedAt = Date.now();
      persist(p); setPhase("done");
    }
  };

  /** Call from the app's quick exit handler (runs on release of the tap). */
  const onQuickExit = () => {
    const p = runRef.current;
    if (!p) return;
    if (phaseRef.current === "cue") complete();
    else if (phaseRef.current === "gap") {
      p.unprompted.push({ at: Date.now(), block: blockRef.current + 1, position: p.order[blockRef.current], screen: screenRef.current });
      persist(p);
    }
  };

  /* ---------- controls used by the facilitator menu ---------- */

  const clearRun = () => {
    runRef.current = null; cueRef.current = null; remainingRef.current = null;
    setPhase("idle");
  };

  const start = (hand: Hand) => {
    const order = orderFor(participantNo);
    const p: Participant = {
      id: participantNo, startedAt: Date.now(), endedAt: null, status: "running", hand, order,
      homeLayout: optRef.current.home, captureDesign: optRef.current.capture,
      viewport: { w: window.innerWidth, h: window.innerHeight },
      touch: navigator.maxTouchPoints > 0, userAgent: navigator.userAgent, trials: [], unprompted: [],
    };
    runRef.current = p; cueRef.current = null; remainingRef.current = null;
    blockRef.current = 0; cueNoRef.current = 1;
    setBlockIdx(0); setCueNo(1); setIntroKind("start");
    setOpt({ ...optRef.current, exit: order[0], sim: "off" });
    persist(p);
    setPhase("intro");
  };

  const stop = () => {
    const p = runRef.current;
    if (p && p.status === "running") { p.status = "stopped"; p.endedAt = Date.now(); persist(p); }
    clearRun();
  };

  /** Fire the next cue right now instead of waiting for the random timer. */
  const fireNow = () => {
    if (phaseRef.current !== "gap" || !canCue) return;
    remainingRef.current = null; gapRef.current = 0;
    fireCue();
  };

  /** Stop any running test, delete all recorded data and move on to the next participant number. */
  const wipe = () => {
    clearRun();
    const ids = loadData().participants.map((p) => p.id);
    wipeData();
    if (ids.length) {
      const next = Math.max(participantNo, ...ids) + 1;
      setCounter(next); setParticipantNoState(next);
    }
  };

  const setParticipantNo = (n: number) => {
    const v = Math.max(1, Math.floor(n));
    setCounter(v); setParticipantNoState(v);
  };

  const continueIntro = () => { remainingRef.current = null; setPhase("gap"); };
  const dismissDone = () => { runRef.current = null; setPhase("idle"); };

  /* ---------- what the participant sees ---------- */

  let overlay: ReactNode = null;
  if (phase === "cue") {
    overlay = <CueOverlay onShown={() => {
      const c = cueRef.current;
      if (!c || c.t0 !== null) return;
      c.t0 = performance.now();
      c.exitRect = rectOf(exitEl());
    }} />;
  } else if ((phase === "intro" || phase === "done") && screen !== "exited") {
    overlay = phase === "done"
      ? <Interlude label="All done" title="Thank you" text="That was the last part of this test." button="Close" onContinue={dismissDone} />
      : <Interlude label={`Part ${blockIdx + 1} of 4`}
          title={introKind === "start" ? "Quick exit" : "Quick exit has moved"}
          text={introKind === "start"
            ? "Use the app as you normally would. When the edge of the screen turns red, press Quick exit."
            : "Take a moment to find it. Then carry on as before."}
          button="Continue" onContinue={continueIntro} />;
  }

  return {
    phase, running: phase !== "idle", blockIdx, cueNo, participantNo, order: orderFor(participantNo),
    trialsDone: runRef.current?.trials.length ?? 0, canCue,
    start, stop, fireNow, wipe, setParticipantNo, onQuickExit, abort: clearRun, overlay,
  };
}

export type ExitTest = ReturnType<typeof useExitTest>;

/* ------------------------------------------------------------------ */

/** Red edge plus a short message. Never blocks touches. The message sits mid-screen so it does not hint at where the button is. */
function CueOverlay({ onShown }: { onShown: () => void }) {
  useEffect(() => {
    let id2 = 0;
    const id1 = requestAnimationFrame(() => { id2 = requestAnimationFrame(onShown); });
    return () => { cancelAnimationFrame(id1); cancelAnimationFrame(id2); };
  }, []);
  return (
    <div role="alert" aria-live="assertive" className="absolute inset-0 z-[45] pointer-events-none">
      <div className="absolute inset-0 border-[8px] border-[#e5221b] sm:rounded-[26px]" style={{ animation: "cue-pulse 0.9s ease-in-out infinite" }} />
      <div className="absolute inset-x-0 top-[42%] flex justify-center">
        <span className="bg-[#e5221b] text-white f-b text-[18px] rounded-full px-[22px] py-[8px] shadow-lg">Exit now</span>
      </div>
    </div>
  );
}

/** Card between parts. The backdrop lets touches through, so the participant can look around the app while it is shown. */
function Interlude({ label, title, text, button, onContinue }: { label: string; title: string; text: string; button: string; onContinue: () => void }) {
  return (
    <div className="absolute inset-0 z-[60] flex items-center justify-center p-[20px] pointer-events-none">
      <div className="pointer-events-auto bg-white border-[#1a1a1a] border-2 rounded-[20px] p-[18px] flex flex-col gap-[10px] w-full max-w-[300px] shadow-[0_8px_24px_rgba(0,0,0,0.22)]">
        <Label>{label}</Label>
        <Heading>{title}</Heading>
        <p className="f-r text-[13px] text-[#444]">{text}</p>
        <Button onClick={onContinue}>{button}</Button>
      </div>
    </div>
  );
}
