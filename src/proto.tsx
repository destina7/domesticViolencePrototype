import { useEffect, useState } from "react";
import { Label } from "./ui";
import type { Options } from "./data";

export type Jump = "warn" | "signin" | "lock" | "home" | "case" | "caseEmpty" | "resources" | "settings" | "exited";

type Row<K extends keyof Options> = { key: K; title: string; choices: [Options[K], string][] };

const ROWS: Row<keyof Options>[] = [
  { key: "resources", title: "Resources screen", choices: [["current", "A · Current"], ["grouped", "B · Grouped by help"], ["expand", "C · Cards that open"]] },
  { key: "caseEmpty", title: "Case, empty screen", choices: [["current", "A · Current"], ["preview", "B · Preview"], ["add", "C · Add right here"]] },
  { key: "lock", title: "Lock screen version", choices: [["padlock", "A · Padlock"], ["loading", "B · Fake loading"]] },
  { key: "secret", title: "Fake loading, way in", choices: [["hold", "A · Hold the icon"], ["rhythm", "B · Tap rhythm"], ["pattern", "C · Draw a pattern"]] },
  { key: "hints", title: "Fake loading, show what it detects", choices: [["off", "Off"], ["on", "On (demo)"]] },
  { key: "theme", title: "Themes", choices: [["none", "No theme"], ["research", "01 · Research"], ["quiet", "02 · Quiet neutral"], ["sunset", "03 · Sunset"],
    ["rose", "Soft rose"], ["butter", "Butter"], ["sage", "Sage"], ["sky", "Soft sky"], ["lavender", "Lavender"]] },
  { key: "ds", title: "Design system", choices: [["none", "None"], ["m3a", "Material 3"]] },
  { key: "sim", title: "Show next failure", choices: [["off", "Off"], ["mic", "Mic denied"], ["upload", "Not saved"], ["password", "Wrong password"]] },
] as Row<keyof Options>[];

const JUMPS: [Jump, string][] = [
  ["warn", "Setup"], ["signin", "Sign in"], ["lock", "Lock screen"], ["home", "Home"], ["case", "Case"], ["caseEmpty", "Case, empty"],
  ["resources", "Resources"], ["settings", "Settings"], ["exited", "After quick exit"],
];

// Small colour dots next to the theme names, so themes are easy to tell apart in the menu. Same colours as index.css.
const THEME_DOTS: Record<string, string[]> = {
  none: ["#ffffff", "#1a1a1a"],
  research: ["#F3EFE9", "#406690"],
  quiet: ["#F4EFE9", "#3F6690"],
  sunset: ["#FDEBB4", "#F8D4DF", "#8E3A5C"],
  rose: ["#F6D8D0", "#A8473F"],
  butter: ["#F8E3AE", "#946010"],
  sage: ["#D8E8DC", "#3E7A63"],
  sky: ["#D9E6F2", "#3F6690"],
  lavender: ["#E2D9F0", "#5E5390"],
};

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
          {r.key === "ds" && <p className="f-r text-[11px] text-[#666]">Material 3, outlined, all in grays and black, no colour.</p>}
          {r.key === "resources" && <p className="f-r text-[11px] text-[#666]">How the Resources tab explains what each place does.</p>}
          {r.key === "caseEmpty" && <p className="f-r text-[11px] text-[#666]">The Case tab before anything is added. See it with Jump to → Case, empty.</p>}
          {r.key === "lock" && <p className="f-r text-[11px] text-[#666]">What opening the app looks like. See it with Jump to → Lock screen. A: PIN 1234 opens Nura, any other PIN opens the cover app. B: loads, then the cover app, unless the way in below is done while it loads.</p>}
          {r.key === "secret" && <p className="f-r text-[11px] text-[#666]">Only for Lock screen B. A: hold the icon for 3 s. B: tap anywhere short, short, long, short (any speed). C: draw an L: down the left side, then along the bottom. Loading takes 3 s untouched, slows down while a finger is on the screen (up to 10 s) and finishes quickly once it stops.</p>}
          {r.key === "hints" && <p className="f-r text-[11px] text-[#666]">For demos. Shows on the loading screen what it picks up, and the grid for C. Never on for participants.</p>}          {r.key === "theme" && opt.ds !== "none" && <p className="f-r text-[11px] text-[#666]">Not used while a design system is on. Set the design system to None to use a colour theme.</p>}
          <div className={`flex flex-wrap gap-[6px] ${r.key === "theme" && opt.ds !== "none" ? "opacity-40" : ""}`}>
            {r.choices.map(([v, l]) => (
              <button key={String(v)} onClick={() => setOpt({ ...opt, [r.key]: v })}
                className={`${pill} ${opt[r.key] === v ? "bg-[#1a1a1a] border-[#1a1a1a] text-white" : "border-[#c7c7c7] hover:border-[#1a1a1a]"} ${r.key === "theme" ? "flex items-center gap-[6px]" : ""}`}>
                {r.key === "theme" && (
                  <span className="flex" aria-hidden>
                    {THEME_DOTS[String(v)].map((c, i) => <span key={i} className="size-[10px] rounded-full border border-[#c7c7c7] -ml-[3px] first:ml-0" style={{ background: c }} />)}
                  </span>
                )}
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
