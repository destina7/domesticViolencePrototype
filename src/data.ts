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
// 1 = tap Record to start, tap again to stop. 2 = starts recording as soon as the screen opens, big Stop button.
export type VoiceDesign = "1" | "2";
export type Sim = "off" | "mic" | "upload" | "password";
// Colour themes for user testing. "none" is the black-and-white wireframe. The colours live in index.css.
export type Theme = "none" | "research" | "quiet" | "sunset" | "rose" | "butter" | "sage" | "sky" | "lavender";
// Design systems to compare with the team. "none" = the wireframe (with an optional colour theme).
// m3a = Material 3, outlined (the A that won against B and C). All grayscale, no colour.
// A design system sets its own colours, shapes, type and component rules, so it replaces the colour theme while it is on.
export const DESIGN_SYSTEMS = ["none", "m3a"] as const;
export type DesignSystem = (typeof DESIGN_SYSTEMS)[number];
// PIN setup on "Your way in". field = both PINs on one screen, dots inside a field (the original).
// centred = one PIN per screen, big centred dots with no field, moves on by itself after the 4th digit.
export const PIN_DESIGNS = ["field", "centred"] as const;
export type PinDesign = (typeof PIN_DESIGNS)[number];
// Resources tab. current = the original single list. grouped = the places listed under headings by kind of help,
// like Settings. expand = one list as before, each card opens to show more about that place.
export const RESOURCE_DESIGNS = ["current", "grouped", "expand"] as const;
export type ResourceDesign = (typeof RESOURCE_DESIGNS)[number];
// Case tab with no entries yet. current = illustration + "Add the first entry" (goes to Home).
// preview = empty summary and faint rows where entries will go. add = the three capture buttons right on the screen.
export const CASE_EMPTY_DESIGNS = ["current", "preview", "add"] as const;
export type CaseEmptyDesign = (typeof CASE_EMPTY_DESIGNS)[number];
export type Options = { home: HomeLayout; exit: ExitPlace; capture: CaptureDesign; voice: VoiceDesign; sim: Sim; theme: Theme; ds: DesignSystem; pin: PinDesign; resources: ResourceDesign; caseEmpty: CaseEmptyDesign };

export const DEFAULT_OPTIONS: Options = { home: "A", exit: "top", capture: "1", voice: "1", sim: "off", theme: "none", ds: "none", pin: "field", resources: "current", caseEmpty: "current" };

export type Draft = { kind: Kind; seconds: number; incident: string | null };

export const entrySub = (e: Entry) => `${e.day}, ${e.time}${e.extra ? ` · ${e.extra}` : ""}`;
