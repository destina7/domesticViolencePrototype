export type Kind = "Voice note" | "Photo, 2 items" | "Written note";

export type Entry = {
  id: number;
  kind: Kind;
  day: string;
  time: string;
  extra?: string;
  incident: string | null;
};

export type Incident = { name: string; chip: string };

export const INCIDENTS: Incident[] = [
  { name: "Kitchen · Tue 6 Oct", chip: "Kitchen · 6 Oct" },
  { name: "Hallway · Mon 28 Sep", chip: "Hallway · 28 Sep" },
];

// Newest first. Kept consistent so Home and Case tell the same story.
export const SEED: Entry[] = [
  { id: 4, kind: "Voice note", day: "Yesterday", time: "22:40", extra: "3 min", incident: INCIDENTS[0].name },
  { id: 3, kind: "Written note", day: "Sat 10 Oct", time: "19:12", incident: INCIDENTS[0].name },
  { id: 2, kind: "Photo, 2 items", day: "Sat 10 Oct", time: "19:05", incident: INCIDENTS[1].name },
  { id: 1, kind: "Written note", day: "Thu 1 Oct", time: "20:03", incident: null },
];

export const COVERS = [
  { name: "Bloom", sub: "Habit tracker" },
  { name: "Journal", sub: "Notes" },
  { name: "Coffee Tracker", sub: "Daily log" },
  { name: "Fitness", sub: "Workouts" },
];

export type HomeLayout = "A" | "B" | "C";
// bottom = fixed spot above the nav bar, content stops above it. float = floats over the content and moves up to clear each screen's buttons.
export type ExitPlace = "top" | "bottom" | "float" | "nav";
export type CaptureDesign = "1" | "2";
export type Sim = "off" | "mic" | "upload" | "password";
export type Options = { home: HomeLayout; exit: ExitPlace; capture: CaptureDesign; sim: Sim };

export const DEFAULT_OPTIONS: Options = { home: "A", exit: "top", capture: "1", sim: "off" };

export type Draft = { kind: Kind; seconds: number; incident: string | null };

export const entrySub = (e: Entry) => `${e.day}, ${e.time}${e.extra ? ` · ${e.extra}` : ""}`;
