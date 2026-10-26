import { useEffect, useState } from "react";
import { Label } from "./ui";
import type { Options } from "./data";
import type { ExitTest } from "./exittest";
import { CUES_PER_BLOCK, MAX_GAP_MS, MIN_GAP_MS, POSITION_LABEL, downloadText, loadData, openAnalytics, stamp, trialsCsv, unpromptedCsv } from "./testing";
import type { Hand } from "./testing";

export type Jump = "warn" | "signin" | "home" | "case" | "caseEmpty" | "resources" | "settings" | "exited";

type Row<K extends keyof Options> = { key: K; title: string; choices: [Options[K], string][] };

const ROWS: Row<keyof Options>[] = [
  { key: "home", title: "Home layout", choices: [["A", "A · Action first"], ["B", "B · One button"], ["C", "C · Capture first"]] },
  { key: "exit", title: "Quick exit position", choices: [["top", "Top right"], ["bottom", "Bottom right · fixed"], ["float", "Bottom right · floating"], ["nav", "Nav bar"]] },
  { key: "capture", title: "Capture design", choices: [["1", "1 · Direct save"], ["2", "2 · Check first"]] },
  { key: "voice", title: "Voice recording", choices: [["1", "1 · Tap to record"], ["2", "2 · Starts straight away"]] },
  { key: "sim", title: "Show next failure", choices: [["off", "Off"], ["mic", "Mic denied"], ["upload", "Not saved"], ["password", "Wrong password"]] },
] as Row<keyof Options>[];

const JUMPS: [Jump, string][] = [
  ["warn", "Setup"], ["signin", "Sign in"], ["home", "Home"], ["case", "Case"], ["caseEmpty", "Case, empty"],
  ["resources", "Resources"], ["settings", "Settings"], ["exited", "After quick exit"],
];

const HANDS: [Hand, string][] = [["right", "Right"], ["left", "Left"], ["unknown", "Not noted"]];

const pill = "border-[1.5px] rounded-full px-[10px] py-[3px] f-m text-[12px]";

function statusText(t: ExitTest): string {
  switch (t.phase) {
    case "intro": return `Part ${t.blockIdx + 1} of 4 · waiting for the participant to tap Continue`;
    case "gap": return t.canCue
      ? `Part ${t.blockIdx + 1} of 4 · cue ${t.cueNo} of ${CUES_PER_BLOCK} · waiting for a random moment`
      : `Part ${t.blockIdx + 1} of 4 · paused, participant is outside the app`;
    case "cue": return `Part ${t.blockIdx + 1} of 4 · cue ${t.cueNo} of ${CUES_PER_BLOCK} is showing`;
    case "done": return "Finished. All four parts are recorded.";
    default: return "Not running.";
  }
}

/**
 * Facilitator-only menu. Closed by default and invisible to participants.
 * Open it with the P key, or by tapping the top-left corner of the page three times quickly.
 */
export function HiddenMenu({ opt, setOpt, jump, reset, test, onStartTest }: {
  opt: Options; setOpt: (o: Options) => void; jump: (j: Jump) => void; reset: () => void;
  test: ExitTest; onStartTest: (hand: Hand) => void;
}) {
  const [open, setOpen] = useState(false);
  const [hand, setHand] = useState<Hand>("unknown");
  const [confirm, setConfirm] = useState(false);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
      if (e.key === "p" || e.key === "P") setOpen((o) => !o);
      if (e.key === "Escape") setOpen(false);
    };
    let taps: number[] = [];
    const onTap = (e: PointerEvent) => {
      if (e.clientX > 60 || e.clientY > 60) { taps = []; return; }
      const now = Date.now();
      taps = [...taps.filter((t) => now - t < 800), now];
      if (taps.length >= 3) { taps = []; setOpen((o) => !o); }
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("pointerdown", onTap, true);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerdown", onTap, true);
    };
  }, []);
  if (!open) return null;

  const close = () => { setOpen(false); setConfirm(false); };
  const data = loadData();
  const trialCount = data.participants.reduce((n, p) => n + p.trials.length, 0);
  const hasData = data.participants.length > 0;
  const doReset = () => { setConfirm(false); reset(); setOpen(false); };
  const exportCsv = () => {
    downloadText(`nura-exit-test-${stamp()}.csv`, trialsCsv(data.participants));
    if (data.participants.some((p) => p.unprompted.length)) downloadText(`nura-exit-test-unprompted-${stamp()}.csv`, unpromptedCsv(data.participants));
  };

  return (
    <aside data-facilitator className="fixed left-[12px] top-[12px] z-[70] w-[300px] max-w-[calc(100vw-24px)] max-h-[calc(100dvh-24px)] overflow-y-auto bg-white border-2 border-[#1a1a1a] rounded-[16px] p-[16px] flex flex-col gap-[10px] shadow-[0_8px_24px_rgba(0,0,0,0.18)]">
      <div className="flex items-center justify-between">
        <p className="f-s text-[14px]">Test options</p>
        <button onClick={close} className="f-m text-[12px] text-[#666] border-[1.5px] border-[#c7c7c7] rounded-full px-[10px] py-[2px]">Close</button>
      </div>
      <p className="f-r text-[11px] text-[#666]">Hidden from participants. Press P or tap the top-left corner 3 times to toggle.</p>

      {ROWS.map((r) => {
        const locked = r.key === "exit" && test.running;
        return (
          <div key={r.key} className="flex flex-col gap-[6px]">
            <Label>{r.title}</Label>
            {r.key === "sim" && <p className="f-r text-[11px] text-[#666]">A failure shows once, the next time the participant triggers it, then switches itself off.</p>}
            <div className="flex flex-wrap gap-[6px]">
              {r.choices.map(([v, l]) => (
                <button key={String(v)} disabled={locked} onClick={() => setOpt({ ...opt, [r.key]: v })}
                  className={`${pill} disabled:opacity-60 ${opt[r.key] === v ? "bg-[#1a1a1a] border-[#1a1a1a] text-white" : "border-[#c7c7c7] hover:border-[#1a1a1a]"}`}>{l}</button>
              ))}
            </div>
            {locked && <p className="f-r text-[11px] text-[#666]">Set by the speed test while it runs.</p>}
          </div>
        );
      })}
      {/* ---------- quick exit speed test ---------- */}
      <div className="border-[1.5px] border-[#1a1a1a] rounded-[12px] p-[10px] flex flex-col gap-[8px]">
        <Label>Quick exit speed test</Label>
        <div className="flex items-center justify-between gap-[8px]">
          <p className="f-s text-[13px]">Participant {test.participantNo}</p>
          <div className="flex gap-[6px]">
            <button disabled={test.running || test.participantNo <= 1} onClick={() => test.setParticipantNo(test.participantNo - 1)}
              className={`${pill} border-[#c7c7c7] disabled:opacity-40`} aria-label="Previous participant number">−</button>
            <button disabled={test.running} onClick={() => test.setParticipantNo(test.participantNo + 1)}
              className={`${pill} border-[#c7c7c7] disabled:opacity-40`} aria-label="Next participant number">+</button>
          </div>
        </div>
        <p className="f-r text-[11px] text-[#666]">Order: {test.order.map((p) => POSITION_LABEL[p]).join(" → ")}</p>
        <div className="flex flex-wrap items-center gap-[6px]">
          <span className="f-m text-[11px] text-[#666]">Thumb:</span>
          {HANDS.map(([v, l]) => (
            <button key={v} disabled={test.running} onClick={() => setHand(v)}
              className={`${pill} disabled:opacity-60 ${hand === v ? "bg-[#1a1a1a] border-[#1a1a1a] text-white" : "border-[#c7c7c7] hover:border-[#1a1a1a]"}`}>{l}</button>
          ))}
        </div>
        {test.running ? (
          <>
            <p className="f-m text-[12px]">{statusText(test)}</p>
            <p className="f-r text-[11px] text-[#666]">{test.trialsDone} of {CUES_PER_BLOCK * 4} cues recorded.</p>
            <div className="flex gap-[6px]">
              <button onClick={() => { test.fireNow(); setOpen(false); }} disabled={test.phase !== "gap" || !test.canCue}
                className="flex-1 border-[1.5px] border-[#1a1a1a] rounded-[12px] py-[6px] f-s text-[12px] hover:bg-[#f5f5f5] disabled:opacity-40">Fire cue now</button>
              <button onClick={test.stop}
                className="flex-1 border-[1.5px] border-[#1a1a1a] rounded-[12px] py-[6px] f-s text-[12px] hover:bg-[#f5f5f5]">Stop test</button>
            </div>
          </>
        ) : (
          <>
            <button onClick={() => { onStartTest(hand); setOpen(false); }}
              className="bg-[#1a1a1a] text-white rounded-[12px] py-[8px] f-s text-[13px] hover:bg-[#333]">Start testing</button>
            <p className="f-r text-[11px] text-[#666]">
              Four parts, one per exit position. Each part has {CUES_PER_BLOCK} cues (the first is practice), {MIN_GAP_MS / 1000}–{MAX_GAP_MS / 1000} s apart at random moments.
            </p>
          </>
        )}
        <button onClick={openAnalytics}
          className="border-[1.5px] border-[#1a1a1a] rounded-[12px] py-[6px] f-s text-[12px] hover:bg-[#f5f5f5]">View test analytics</button>
      </div>

      <Label>Jump to</Label>
      <div className="flex flex-wrap gap-[6px]">
        {JUMPS.map(([j, l]) => (
          <button key={j} onClick={() => { jump(j); setOpen(false); }}
            className={`${pill} border-[#c7c7c7] hover:border-[#1a1a1a]`}>{l}</button>
        ))}
      </div>

      {confirm ? (
        <div className="border-[1.5px] border-[#1a1a1a] rounded-[12px] p-[10px] flex flex-col gap-[8px]">
          <p className="f-s text-[12px]">Wipe {trialCount} recorded {trialCount === 1 ? "cue" : "cues"} and reset?</p>
          <p className="f-r text-[11px] text-[#666]">This deletes the test data and returns the layout options to their defaults. Download the CSV first if you want to keep it.</p>
          <button onClick={exportCsv} className="border-[1.5px] border-[#1a1a1a] rounded-[12px] py-[6px] f-s text-[12px] hover:bg-[#f5f5f5]">Download CSV</button>
          <div className="flex gap-[6px]">
            <button onClick={() => setConfirm(false)} className="flex-1 border-[1.5px] border-[#c7c7c7] rounded-[12px] py-[6px] f-s text-[12px] hover:bg-[#f5f5f5]">Cancel</button>
            <button onClick={doReset} className="flex-1 bg-[#1a1a1a] text-white rounded-[12px] py-[6px] f-s text-[12px] hover:bg-[#333]">Wipe and reset</button>
          </div>
        </div>
      ) : (
        <button onClick={() => (hasData ? setConfirm(true) : doReset())}
          className="border-[1.5px] border-[#1a1a1a] rounded-[12px] py-[6px] f-s text-[12px] hover:bg-[#f5f5f5]">Reset for the next participant</button>
      )}
    </aside>
  );
}
