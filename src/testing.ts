import type { ExitPlace } from "./data";

/* ------------------------------------------------------------------ */
/* Settings for the quick-exit speed test. Change the numbers here.    */
/* ------------------------------------------------------------------ */

export const CUES_PER_BLOCK = 4; // cues per exit position
export const PRACTICE_CUES = 1; // the first cue(s) of every block are practice and left out of the stats by default
export const MIN_GAP_MS = 20_000; // shortest wait before the next cue
export const MAX_GAP_MS = 45_000; // longest wait before the next cue

export const POSITIONS: ExitPlace[] = ["top", "bottom", "float", "nav"];
export const POSITION_LABEL: Record<ExitPlace, string> = {
  top: "Top right",
  bottom: "Bottom right · fixed",
  float: "Bottom right · floating",
  nav: "Nav bar",
};

// Williams design for 4 conditions: every position appears once in every slot
// and follows every other position equally often over a group of 4 participants.
const WILLIAMS = [[0, 1, 3, 2], [1, 2, 0, 3], [2, 3, 1, 0], [3, 0, 2, 1]];
export const orderFor = (participant: number): ExitPlace[] =>
  WILLIAMS[(((participant - 1) % 4) + 4) % 4].map((i) => POSITIONS[i]);

/* ------------------------------------------------------------------ */
/* Data model                                                          */
/* ------------------------------------------------------------------ */

export type Hand = "right" | "left" | "unknown";
export type Rect = { x: number; y: number; w: number; h: number };
/** A tap that was not on the quick exit button. fx/fy are px from the phone frame's top-left. */
export type Tap = { t: number; fx: number; fy: number; dist: number | null };

export type Trial = {
  id: number;
  block: number; // 1..4
  position: ExitPlace;
  cueIndex: number; // 1-based within the block
  practice: boolean;
  screen: string; // screen the participant was on when the cue appeared
  gapMs: number; // wait before this cue (0 = fired by hand from the menu)
  cueAt: number; // epoch ms
  firstTouchMs: number | null; // cue shown -> first touch anywhere
  exitMs: number | null; // cue shown -> touch down on the quick exit button
  firstTapHit: boolean | null; // was the first touch already on the quick exit button
  missTaps: Tap[]; // touches elsewhere before the exit button was hit
  exitRect: Rect | null; // where the button was, relative to the phone frame
  exitTap: { fx: number; fy: number } | null;
  frameW: number;
  frameH: number;
};

/** An exit press while no cue was showing. May be an accident or a participant exploring. */
export type Unprompted = { at: number; block: number; position: ExitPlace; screen: string };

export type Participant = {
  id: number;
  startedAt: number;
  endedAt: number | null;
  status: "running" | "completed" | "stopped";
  hand: Hand;
  order: ExitPlace[];
  homeLayout: string;
  captureDesign: string;
  viewport: { w: number; h: number };
  touch: boolean;
  userAgent: string;
  trials: Trial[];
  unprompted: Unprompted[];
};

export type TestData = { participants: Participant[] };

/* ------------------------------------------------------------------ */
/* Storage (localStorage, so the analytics tab can read it)            */
/* ------------------------------------------------------------------ */

const DATA_KEY = "nura-test-data";
const COUNTER_KEY = "nura-test-counter";

export function loadData(): TestData {
  try {
    const raw = window.localStorage.getItem(DATA_KEY);
    if (raw) {
      const d = JSON.parse(raw);
      if (d && Array.isArray(d.participants)) return d as TestData;
    }
  } catch { /* storage unavailable */ }
  return { participants: [] };
}

export function saveData(d: TestData) {
  try { window.localStorage.setItem(DATA_KEY, JSON.stringify(d)); } catch { /* ignore */ }
}

export function wipeData() {
  try { window.localStorage.removeItem(DATA_KEY); } catch { /* ignore */ }
}

/** The participant number survives a wipe, so the position order keeps rotating from one participant to the next. */
export function getCounter(): number {
  try {
    const n = Number(window.localStorage.getItem(COUNTER_KEY));
    if (Number.isFinite(n) && n >= 1) return Math.floor(n);
  } catch { /* ignore */ }
  return 1;
}

export function setCounter(n: number) {
  try { window.localStorage.setItem(COUNTER_KEY, String(Math.max(1, Math.floor(n)))); } catch { /* ignore */ }
}

export function openAnalytics() {
  const u = new URL(window.location.href);
  u.hash = "analytics";
  window.open(u.toString(), "_blank");
}

/* ------------------------------------------------------------------ */
/* Stats and CSV                                                       */
/* ------------------------------------------------------------------ */

export const median = (a: number[]): number | null => {
  if (!a.length) return null;
  const s = [...a].sort((x, y) => x - y);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};
export const mean = (a: number[]): number | null => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : null);
export const secs = (ms: number | null, digits = 2) => (ms === null ? "–" : `${(ms / 1000).toFixed(digits)} s`);

const esc = (v: unknown) => {
  const s = v === null || v === undefined ? "" : String(v);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
const row = (cells: unknown[]) => cells.map(esc).join(",");

export function trialsCsv(ps: Participant[]): string {
  const head = [
    "participant", "hand", "touch_device", "viewport_w", "viewport_h", "home_layout", "capture_design",
    "block", "position", "cue_in_block", "practice", "screen", "gap_ms", "cue_time",
    "first_touch_ms", "exit_ms", "first_tap_hit", "miss_taps", "avg_miss_distance_px",
    "exit_x", "exit_y", "exit_w", "exit_h", "frame_w", "frame_h",
  ];
  const lines = [row(head)];
  for (const p of ps) {
    for (const t of p.trials) {
      const d = t.missTaps.map((m) => m.dist).filter((x): x is number => x !== null);
      lines.push(row([
        p.id, p.hand, p.touch, p.viewport.w, p.viewport.h, p.homeLayout, p.captureDesign,
        t.block, t.position, t.cueIndex, t.practice, t.screen, t.gapMs, new Date(t.cueAt).toISOString(),
        t.firstTouchMs, t.exitMs, t.firstTapHit, t.missTaps.length, d.length ? Math.round(mean(d) as number) : "",
        t.exitRect?.x.toFixed(0), t.exitRect?.y.toFixed(0), t.exitRect?.w.toFixed(0), t.exitRect?.h.toFixed(0), t.frameW, t.frameH,
      ]));
    }
  }
  return lines.join("\r\n");
}

export function unpromptedCsv(ps: Participant[]): string {
  const lines = [row(["participant", "block", "position", "screen", "time"])];
  for (const p of ps) for (const u of p.unprompted) lines.push(row([p.id, u.block, u.position, u.screen, new Date(u.at).toISOString()]));
  return lines.join("\r\n");
}

export function downloadText(name: string, text: string) {
  const url = URL.createObjectURL(new Blob(["﻿" + text], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export const stamp = () => new Date().toISOString().slice(0, 16).replace(/[:T]/g, "-");
