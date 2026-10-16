import { useState } from "react";
import type { ReactNode } from "react";
import { BottomNav, Button, Card, Heading, Label, NAV_HEIGHT, QuickExit, Spacer, StatusBar, Toast, useToast } from "./ui";
import { DEFAULT_OPTIONS, SEED } from "./data";
import type { Draft, Entry, Kind, Options } from "./data";
import { HiddenMenu } from "./proto";
import type { Jump } from "./proto";
import { CoverChoice, SignIn, Warning, WayIn } from "./screens/setup";
import { AddSheet, HomeA, HomeB, HomeC } from "./screens/home";
import { Camera, Check, MicDenied, Note, Saved, UploadFailed, Voice } from "./screens/capture";
import { Case, EntryDetail } from "./screens/case";
import { Resources, Settings } from "./screens/support";

type Screen =
  | "warn" | "cover" | "way" | "signin"
  | "home" | "case" | "entry" | "resources" | "settings"
  | "note" | "voice" | "camera" | "check" | "saved" | "micDenied" | "uploadFailed"
  | "exited";
type Capture = "note" | "voice" | "camera";

const TABS = ["Home", "Case", "Resources", "Settings"];
const TAB_SCREEN: Record<string, Screen> = { Home: "home", Case: "case", Resources: "resources", Settings: "settings" };
const ACTIVE_TAB: Partial<Record<Screen, string>> = {
  home: "Home", note: "Home", voice: "Home", camera: "Home", check: "Home", saved: "Home", micDenied: "Home", uploadFailed: "Home",
  case: "Case", entry: "Case", resources: "Resources", settings: "Settings",
};
const MAIN: Screen[] = ["home", "case", "entry", "resources", "settings"];
const CAPTURE_SCREENS: Screen[] = ["note", "voice", "camera", "check", "saved", "micDenied", "uploadFailed"];
const STORAGE_KEY = "nura-prototype-options";

function loadOptions(): Options {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...DEFAULT_OPTIONS, ...JSON.parse(raw), sim: "off" };
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
  const [sheet, setSheet] = useState(false);
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
    setSheet(false);
  };
  const back = () => {
    setHistory((h) => { const p = h[h.length - 1] ?? "home"; setScreen(p); return h.slice(0, -1); });
  };
  const tab = (t: string) => { setHistory([]); setScreen(TAB_SCREEN[t]); setSheet(false); };
  const quickExit = () => { setHistory([]); setSheet(false); setScreen("exited"); };
  const homeToAdd = () => { setHistory([]); setScreen("home"); setSheet(opt.home === "B"); };
  const openEntry = (id: number) => { setDetailId(id); go("entry"); };

  /* ---------- capture ---------- */

  // Nothing captured is stored: Home and Case always show the same sample entries.
  const commit = (d: Draft) => {
    setDraft(d);
    if (opt.sim === "upload") { clearSim(); go("uploadFailed"); return; }
    go("saved");
  };
  const finish = (kind: Kind, seconds = 0) => {
    const d = { kind, seconds, incident: null };
    if (opt.capture === "2") { setDraft(d); go("check"); } else commit(d);
  };

  /* ---------- quick exit placement ---------- */

  const exitTop: ReactNode = opt.exit === "top" ? <QuickExit onClick={quickExit} /> : undefined;
  const inApp = MAIN.includes(screen) || CAPTURE_SCREENS.includes(screen);
  const showNav = MAIN.includes(screen) || (CAPTURE_SCREENS.includes(screen) && (opt.capture === "2" || opt.exit === "nav"));
  const showStrip = opt.exit === "bottom" && inApp;
  const showFloat = opt.exit === "float" && inApp;
  // Floating mode only: lifts the button clear of each screen's own bottom buttons so it never hides them.
  const lift = (() => {
    switch (screen) {
      case "home": return { A: 0, B: 60, C: 220 }[opt.home];
      case "note": return 70;
      case "check": return 120;
      case "camera": return 84;
      case "saved": return 140;
      case "voice": return opt.capture === "1" ? 130 : 0;
      default: return 0;
    }
  })();

  /* ---------- hidden menu actions ---------- */

  const jump = (j: Jump) => {
    setHistory([]); setSheet(false);
    if (j === "caseEmpty") { setEntries([]); setScreen("case"); return; }
    if (entries.length === 0) setEntries(SEED);
    setScreen(j);
  };
  const reset = () => { setEntries(SEED); setCover("Bloom"); setHistory([]); setSheet(false); setScreen("warn"); };

  /* ---------- screens ---------- */

  let view: ReactNode = null;
  switch (screen) {
    case "warn": view = <Warning onContinue={() => go("cover")} />; break;
    case "cover": view = <CoverChoice cover={cover} setCover={setCover} onContinue={() => go("way")} />; break;
    case "way": view = <WayIn onContinue={() => go("signin")} />; break;
    case "signin":
      view = <SignIn failOnce={opt.sim === "password"} onFailed={clearSim} onSignIn={() => { setHistory([]); setScreen("home"); }} />;
      break;
    case "home":
      view = opt.home === "A" ? <HomeA entries={entries} exit={exitTop} open={openEntry} start={go} />
        : opt.home === "B" ? <HomeB entries={entries} exit={exitTop} open={openEntry} onAdd={() => setSheet(true)} />
        : <HomeC entries={entries} exit={exitTop} open={openEntry} start={go} />;
      break;
    case "case": view = <Case entries={entries} exit={exitTop} open={openEntry} onAdd={homeToAdd} />; break;
    case "entry": view = <EntryDetail entry={entries.find((e) => e.id === detailId) ?? entries[0]} exit={exitTop} onBack={back} />; break;
    case "resources": view = <Resources exit={exitTop} toast={toast} />; break;
    case "settings": view = <Settings exit={exitTop} cover={cover} toast={toast} />; break;
    case "note": view = <Note design={opt.capture} exit={exitTop} onBack={back} onSave={() => finish("Written note")} />; break;
    case "voice": view = <Voice design={opt.capture} exit={exitTop} onBack={back} onMic={setMic} onDone={(s) => finish("Voice note", s)} />; break;
    case "camera": view = <Camera exit={exitTop} onBack={back} onShutter={() => finish("Photo, 2 items")} />; break;
    case "check":
      view = <Check kind={draft.kind} seconds={draft.seconds} exit={exitTop}
        onSave={(incident) => commit({ ...draft, incident })} onDiscard={() => tab("Home")} />;
      break;
    case "saved": view = <Saved exit={exitTop} onAnother={homeToAdd} onDone={() => tab("Home")} />; break;
    case "micDenied":
      view = <MicDenied exit={exitTop} onBack={back} onAllow={() => setScreen("voice")} onNote={() => setScreen("note")} />;
      break;
    case "uploadFailed":
      view = <UploadFailed kind={draft.kind} exit={exitTop} onBack={back}
        onRetry={() => setScreen("saved")} onLater={() => tab("Home")} />;
      break;
    case "exited": view = <Exited onBack={() => tab("Home")} />; break;
  }

  return (
    <div className="w-full min-h-[100dvh] flex items-center justify-center bg-[#f2f2f2] sm:py-[24px]">
      <HiddenMenu opt={opt} setOpt={setOpt} jump={jump} reset={reset} />
      <div className="w-full h-[100dvh] sm:w-[360px] sm:h-[800px] sm:max-h-[calc(100dvh-48px)] sm:border-2 sm:border-[#1a1a1a] sm:rounded-[28px] flex flex-col bg-white relative overflow-hidden">
        {screen !== "exited" && <StatusBar mic={mic} />}
        {view}
        {/* Fixed mode: a reserved strip, so the button sits in the same spot on every screen and the content stops above it. */}
        {showStrip && (
          <div className="relative h-[52px] shrink-0">
            <div className="absolute right-[14px] top-[8px] z-40"><QuickExit onClick={quickExit} /></div>
          </div>
        )}
        {/* Screens without a nav bar get a blank band of the same height, so the button does not move. */}
        {showStrip && !showNav && <div className="h-[65.5px] shrink-0" />}
        {showFloat && (
          <div className="absolute right-[14px] z-40" style={{ bottom: (showNav ? NAV_HEIGHT : 0) + 14 + lift }}>
            <QuickExit onClick={quickExit} />
          </div>
        )}
        {showNav && <BottomNav tabs={TABS} active={ACTIVE_TAB[screen] ?? "Home"} onSelect={tab} onHide={opt.exit === "nav" ? quickExit : undefined} />}
        {sheet && <AddSheet onClose={() => setSheet(false)} start={(c: Capture) => go(c)} keepNav={opt.exit === "nav"} />}
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
