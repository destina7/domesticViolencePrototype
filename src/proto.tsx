import { useEffect, useState } from "react";
import { Label } from "./ui";
import type { Options } from "./data";

export type Jump = "warn" | "signin" | "lock" | "coverApp" | "home" | "case" | "caseEmpty" | "resources" | "settings";

type Row<K extends keyof Options> = { key: K; title: string; choices: [Options[K], string][] };

const ROWS: Row<keyof Options>[] = [
  { key: "scheme", title: "Colour scheme", choices: [["none", "A · None"], ["recommended", "B · Recommended"]] },
  { key: "micDot", title: "Mic Toggle", choices: [["fake", "Fake dot"], ["real", "Real dot"]] },
  { key: "sim", title: "Show next failure", choices: [["off", "Off"], ["mic", "Mic denied"], ["upload", "Not saved"], ["password", "Wrong password"]] },
] as Row<keyof Options>[];

const JUMPS: [Jump, string][] = [
  ["warn", "Setup"], ["signin", "Sign in"], ["lock", "Lock screen"], ["coverApp", "Cover app (quick exit)"], ["home", "Home"], ["case", "Case"], ["caseEmpty", "Case, empty"],
  ["resources", "Resources"], ["settings", "Settings"],
];

const pill = "border-[1.5px] rounded-full px-[10px] py-[3px] f-m text-[12px]";

/**
 * Facilitator-only menu. Closed by default and invisible to participants.
 * Open it with the P key, or by tapping the top-left corner of the page three times quickly.
 */
export function HiddenMenu({ opt, setOpt, jump, reset }: {
  opt: Options; setOpt: (o: Options) => void; jump: (j: Jump) => void; reset: () => void;
}) {
  const [open, setOpen] = useState(false);
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

  return (
    <aside data-facilitator className="fixed left-[12px] top-[12px] z-[70] w-[300px] max-w-[calc(100vw-24px)] max-h-[calc(100dvh-24px)] overflow-y-auto bg-white border-2 border-[#1a1a1a] rounded-[16px] p-[16px] flex flex-col gap-[10px] shadow-[0_8px_24px_rgba(0,0,0,0.18)]">
      <div className="flex items-center justify-between">
        <p className="f-s text-[14px]">Test options</p>
        <button onClick={() => setOpen(false)} className="f-m text-[12px] text-[#666] border-[1.5px] border-[#c7c7c7] rounded-full px-[10px] py-[2px]">Close</button>
      </div>
      <p className="f-r text-[11px] text-[#666]">Hidden from participants. Press P or tap the top-left corner 3 times to toggle.</p>

      {ROWS.map((r) => (
        <div key={r.key} className="flex flex-col gap-[6px]">
          <Label>{r.title}</Label>
          {r.key === "sim" && <p className="f-r text-[11px] text-[#666]">A failure shows once, the next time the participant triggers it, then switches itself off.</p>}
          {r.key === "scheme" && <p className="f-r text-[11px] text-[#666]">A: no colour, the greyscale look tested so far. B: the palette from the trauma-informed colour research (oatmeal background, muted green, blue for buttons, red only for Call 112).</p>}
          {r.key === "micDot" && <p className="f-r text-[11px] text-[#666]">The dot that shows while Nura records (also the hidden recording from holding Bloom's progress bar). Fake: a drawn "● rec" in the status bar, only in the desktop phone frame. Real: opens the actual microphone so the phone shows its own dot (orange on iPhone). Nothing is saved. The browser asks for the mic the first time: allow it before the participant starts. Kept on Reset.</p>}
          <div className="flex flex-wrap gap-[6px]">
            {r.choices.map(([v, l]) => (
              <button key={String(v)} onClick={() => setOpt({ ...opt, [r.key]: v })}
                className={`${pill} ${opt[r.key] === v ? "bg-[#1a1a1a] border-[#1a1a1a] text-white" : "border-[#c7c7c7] hover:border-[#1a1a1a]"}`}>
                {l}
              </button>
            ))}
          </div>
        </div>
      ))}

      <Label>Jump to</Label>
      <div className="flex flex-wrap gap-[6px]">
        {JUMPS.map(([j, l]) => (
          <button key={j} onClick={() => { jump(j); setOpen(false); }}
            className={`${pill} border-[#c7c7c7] hover:border-[#1a1a1a]`}>{l}</button>
        ))}
      </div>

      <button onClick={() => { reset(); setOpen(false); }}
        className="border-[1.5px] border-[#1a1a1a] rounded-[12px] py-[6px] f-s text-[12px] hover:bg-[#f5f5f5]">Reset for the next participant</button>
    </aside>
  );
}
