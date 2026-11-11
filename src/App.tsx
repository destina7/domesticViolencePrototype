import { useState } from "react";
import type { ReactNode } from "react";
import { BottomNav, Button, Card, Heading, Label, Spacer, StatusBar, Toast, useToast } from "./ui";
import { DEFAULT_OPTIONS, DESIGN_SYSTEMS, OPEN_CARD_DESIGNS, PIN_DESIGNS, RESOURCE_DESIGNS, SEED } from "./data";
import type { Draft, Entry, Kind, Options } from "./data";
import { HiddenMenu } from "./proto";
import type { Jump } from "./proto";
import { CoverChoice, SignIn, Warning, WayIn, WayInCentred } from "./screens/setup";
import { Home } from "./screens/home";
import { Camera, MicDenied, Note, Saved, UploadFailed, Voice } from "./screens/capture";
import { Case, EntryDetail } from "./screens/case";
import { Resources, Settings } from "./screens/support";

type Screen =
  | "warn" | "cover" | "way" | "signin"
  | "home" | "case" | "entry" | "resources" | "settings"
  | "note" | "voice" | "camera" | "saved" | "micDenied" | "uploadFailed"
  | "exited";
type Capture = "note" | "voice" | "camera";

const TABS = ["Home", "Case", "Resources", "Settings"];
const TAB_SCREEN: Record<string, Screen> = { Home: "home", Case: "case", Resources: "resources", Settings: "settings" };
const ACTIVE_TAB: Partial<Record<Screen, string>> = {
  home: "Home", note: "Home", voice: "Home", camera: "Home", saved: "Home", micDenied: "Home", uploadFailed: "Home",
  case: "Case", entry: "Case", resources: "Resources", settings: "Settings",
};
const MAIN: Screen[] = ["home", "case", "entry", "resources", "settings"];
const CAPTURE_SCREENS: Screen[] = ["note", "voice", "camera", "saved", "micDenied", "uploadFailed"];
const KIND_SCREEN: Record<Kind, Capture> = { "Voice note": "voice", "Written note": "note", "Photo, 2 items": "camera" };
const STORAGE_KEY = "nura-prototype-options";

function loadOptions(): Options {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      // Only the theme, design system and the screen A/B choices are remembered. Older saved layout choices are ignored.
      const { theme, ds, pin, resources, openCard } = JSON.parse(raw);
      // Older Material 3 choices ("m3" from before A/B/C, and the removed B and C) all become A; "nl" is gone.
      const saved = ds === "m3" || ds === "m3b" || ds === "m3c" ? "m3a" : ds;
      return {
        ...DEFAULT_OPTIONS,
        theme: theme ?? DEFAULT_OPTIONS.theme,
        ds: (DESIGN_SYSTEMS as readonly string[]).includes(saved) ? saved : DEFAULT_OPTIONS.ds,
        pin: (PIN_DESIGNS as readonly string[]).includes(pin) ? pin : DEFAULT_OPTIONS.pin,
        resources: (RESOURCE_DESIGNS as readonly string[]).includes(resources) ? resources : DEFAULT_OPTIONS.resources,
        openCard: (OPEN_CARD_DESIGNS as readonly string[]).includes(openCard) ? openCard : DEFAULT_OPTIONS.openCard,
      };
    }
  } catch { /* storage unavailable: fall back to defaults */ }
  return DEFAULT_OPTIONS;
}

export default function App() {
  const [opt, setOptState] = useState<Options>(loadOptions);
  const [screen, setScreen] = useState<Screen>("warn");
  const [history, setHistory] = useState<Screen[]>([]);
  const [cover, setCover] = useState("Bloom");
  const [entries, setEntries] = useState<Entry[]>(SEED);
  const [detailId, setDetailId] = useState<number | null>(null);
    const [draft, setDraft] = useState<Draft>({ kind: "Voice note", seconds: 0, incident: null });
  const [mic, setMic] = useState(false);
  const [toastText, toast] = useToast();

  const setOpt = (o: Options) => {
    setOptState(o);
    try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(o)); } catch { /* ignore */ }
  };
  const clearSim = () => setOpt({ ...opt, sim: "off" });

  /* ---------- navigation ---------- */

  const go = (s: Screen) => {
    if (s === "voice" && opt.sim === "mic") { clearSim(); s = "micDenied"; }
    setHistory((h) => [...h, screen]);
    setScreen(s);
  };
  const back = () => {
    setHistory((h) => { const p = h[h.length - 1] ?? "home"; setScreen(p); return h.slice(0, -1); });
  };
  const tab = (t: string) => { setHistory([]); setScreen(TAB_SCREEN[t]); };
  const quickExit = () => { setHistory([]); setScreen("exited"); };
  const homeToAdd = () => { setHistory([]); setScreen("home"); };
  const openEntry = (id: number) => { setDetailId(id); go("entry"); };

  /* ---------- capture ---------- */

  // Nothing captured is stored: Home and Case always show the same sample entries.
  const commit = (d: Draft) => {
    setDraft(d);
    if (opt.sim === "upload") { clearSim(); go("uploadFailed"); return; }
    go("saved");
  };
  const finish = (kind: Kind, seconds = 0) => commit({ kind, seconds, incident: null });
  // "Add another" on Saved reopens the same kind of capture. History is cleared so Back from there goes to Home, not Saved.
  const addAnother = () => { go(KIND_SCREEN[draft.kind]); setHistory([]); };

  // Quick exit lives in the nav bar, so the nav bar shows on every screen inside the app.
  const inApp = MAIN.includes(screen) || CAPTURE_SCREENS.includes(screen);

  /* ---------- hidden menu actions ---------- */

  const jump = (j: Jump) => {
    setHistory([]);
    if (j === "caseEmpty") { setEntries([]); setScreen("case"); return; }
    if (entries.length === 0) setEntries(SEED);
    setScreen(j);
  };
  // Back to a clean slate for the next participant, including the saved theme and design system.
  const reset = () => {
    setOpt(DEFAULT_OPTIONS);
    setEntries(SEED); setCover("Bloom"); setDetailId(null);
    setDraft({ kind: "Voice note", seconds: 0, incident: null }); setMic(false);
    setHistory([]); setScreen("warn");
  };

  /* ---------- screens ---------- */

  let view: ReactNode = null;
  switch (screen) {
    case "warn": view = <Warning onContinue={() => go("cover")} toast={toast} />; break;
    case "cover": view = <CoverChoice cover={cover} setCover={setCover} onContinue={() => go("way")} />; break;
    case "way":
      view = opt.pin === "centred"
        ? <WayInCentred cover={cover} onContinue={() => go("signin")} />
        : <WayIn onContinue={() => go("signin")} />;
      break;
    case "signin":
      view = <SignIn failOnce={opt.sim === "password"} onFailed={clearSim} onSignIn={() => { setHistory([]); setScreen("home"); }} />;
      break;
    case "home": view = <Home entries={entries} open={openEntry} start={go} />; break;
    case "case": view = <Case entries={entries} open={openEntry} onAdd={homeToAdd} />; break;
    case "entry": view = <EntryDetail entry={entries.find((e) => e.id === detailId) ?? entries[0]} onBack={back} />; break;
    case "resources": view = <Resources design={opt.resources} toast={toast} />; break;
    case "settings": view = <Settings cover={cover} toast={toast} />; break;
    case "note": view = <Note onBack={back} onSave={() => finish("Written note")} />; break;
    case "voice": view = <Voice onBack={back} onMic={setMic} onDone={(s) => finish("Voice note", s)} />; break;
    case "camera": view = <Camera onBack={back} onShutter={() => finish("Photo, 2 items")} />; break;
    case "saved": view = <Saved onAnother={addAnother} onDone={() => tab("Home")} />; break;
    case "micDenied":
      view = <MicDenied onBack={back} onAllow={() => setScreen("voice")} onNote={() => setScreen("note")} />;
      break;
    case "uploadFailed":
      view = <UploadFailed kind={draft.kind} onBack={back}
        onRetry={() => setScreen("saved")} onLater={() => tab("Home")} />;
      break;
    case "exited": view = <Exited onBack={() => tab("Home")} />; break;
  }

  return (
    <div className="w-full min-h-[100dvh] flex items-center justify-center bg-[#f2f2f2] sm:py-[24px]">
      <HiddenMenu opt={opt} setOpt={setOpt} jump={jump} reset={reset} />
      <div data-phone data-ds={opt.ds === "none" ? undefined : opt.ds} data-open-card={opt.openCard}data-theme={opt.ds !== "none" || opt.theme === "none" ? undefined : opt.theme} className="w-full h-[100dvh] sm:w-[360px] sm:h-[800px] sm:max-h-[calc(100dvh-48px)] sm:border-2 sm:border-[#1a1a1a] sm:rounded-[28px] flex flex-col bg-white relative overflow-hidden">
        {screen !== "exited" && <StatusBar mic={mic} />}
        {view}
        {inApp && <BottomNav tabs={TABS} active={ACTIVE_TAB[screen] ?? "Home"} onSelect={tab} onHide={quickExit} />}
        <Toast text={toastText} />
      </div>
    </div>
  );
}

/** Stand-in for the cover app / harmless site that quick exit leads to. Not part of this test. */
function Exited({ onBack }: { onBack: () => void }) {
  return (
    <div className="flex-1 bg-[#ebebeb] flex flex-col items-center justify-center gap-[12px] p-[20px]">
      <Card strong>
        <Label>Quick exit</Label>
        <Heading>Not yet implemented</Heading>
        <p className="f-r text-[13px] text-[#666]">
          In the finished app this closes Nura and shows the cover app. That part is not included in this test.
        </p>
      </Card>
      <Spacer />
      <Button onClick={onBack}>Back to Nura</Button>
    </div>
  );
}
