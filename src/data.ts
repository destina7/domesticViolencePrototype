export type Kind = "Voice note" | "Photo, 2 items" | "Written note";

// Material Symbols icon per kind of entry. Used by the "Add to your record" buttons and by the entry rows, so they match.
export const KIND_ICON: Record<Kind, string> = { "Voice note": "mic", "Photo, 2 items": "photo_camera", "Written note": "edit_note" };

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

export type Sim = "off" | "mic" | "upload" | "password";
// The recording dot. fake = the wireframe's own "● rec" in the drawn status bar (desktop phone frame only).
// real = the actual microphone is opened while Nura records, so the phone shows its own dot (orange on iPhone).
// Nothing is saved or sent either way.
export const MIC_DESIGNS = ["fake", "real"] as const;
export type MicDesign = (typeof MIC_DESIGNS)[number];
// Colour schemes. none = no colour, the greyscale look the prototype was tested in until now. recommended = the palette
// from the trauma-informed colour research. The colours live in index.css (Colour schemes); add a name here to add a scheme.
export const SCHEME_DESIGNS = ["none", "recommended"] as const;
export type SchemeDesign = (typeof SCHEME_DESIGNS)[number];
export type Options = { sim: Sim; micDot: MicDesign; scheme: SchemeDesign };

export const DEFAULT_OPTIONS: Options = { sim: "off", micDot: "fake", scheme: "none" };

export type Draft = { kind: Kind; seconds: number; incident: string | null };

export const entrySub = (e: Entry) => `${e.day}, ${e.time}${e.extra ? ` · ${e.extra}` : ""}`;
