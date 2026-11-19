import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { BottomNav, StatusBar, Toast, useToast } from "./ui";
import { DEFAULT_OPTIONS, MIC_DESIGNS, SCHEME_DESIGNS, SEED } from "./data";
import type { Draft, Entry, Kind, Options } from "./data";
import { HiddenMenu } from "./proto";
import type { Jump } from "./proto";
import { CoverChoice, SignIn, Welcome, WayIn } from "./screens/setup";
import { Home } from "./screens/home";
import { Camera, MicDenied, Note, Saved, UploadFailed, Voice } from "./screens/capture";
import type { Recording } from "./screens/capture";
import { Case, EntryDetail } from "./screens/case";
import { Resources, Settings } from "./screens/support";
import { FakeLoading } from "./screens/lock";
import { CoverApp } from "./screens/cover";
import { LoadingPractice } from "./screens/practice";
import { TapPractice } from "./screens/practice-tap";

type Screen =
  | "warn" | "cover" | "way" | "practiceLoading" | "practiceTap" | "signin" | "lock" | "coverApp"
  | "home" | "case" | "entry" | "resources" | "settings"
  | "note" | "voice" | "camera" | "saved" | "micDenied" | "uploadFailed";
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
      // Only the Mic Toggle and the colour scheme are remembered. Choices for options that user testing settled (Resources,
      // Case empty, lock screen, the loading screen's way in, demo hints, themes, design system) are ignored.
      const { micDot, scheme } = JSON.parse(raw);
      return {
        ...DEFAULT_OPTIONS,
        micDot: (MIC_DESIGNS as readonly string[]).includes(micDot) ? micDot : DEFAULT_OPTIONS.micDot,
        scheme: (SCHEME_DESIGNS as readonly string[]).includes(scheme) ? scheme : DEFAULT_OPTIONS.scheme,
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
  // The voice recording, kept here rather than on the voice screen so it outlives that screen: Back, the tabs and
  // quick exit all leave it running (or paused), and only Stop ends it. Started on the voice screen, or hidden from
  // the cover app by holding its progress bar. While there is one, opening Nura goes straight to the voice screen.
  const [rec, setRec] = useState<Recording | null>(null);
  // The microphone is on: a recording that is not paused. The rec dot shows while it is.
  const recording = rec !== null && rec.since !== null;
  const startRec = (hidden: boolean) => setRec((r) => r ?? { banked: 0, since: Date.now(), hidden });
  const pauseRec = () => setRec((r) => (r && r.since !== null ? { ...r, banked: r.banked + Date.now() - r.since, since: null } : r));
  const resumeRec = () => setRec((r) => (r && r.since === null ? { ...r, since: Date.now() } : r));
  // Mic Toggle → Real dot: while recording, open the actual microphone so the phone shows its own dot (orange on
  // iPhone). The stream is never stored or sent, and it is closed the moment recording stops. If the mic is refused
  // or not available (an http page, no microphone), the fake dot shows instead.
  const stream = useRef<MediaStream | null>(null);
  const [realMic, setRealMic] = useState(false);
  useEffect(() => {
    if (!recording || opt.micDot !== "real") return;
    const devices = navigator.mediaDevices;
    if (!devices?.getUserMedia) return;
    let closed = false;
    devices.getUserMedia({ audio: true })
      .then((s) => {
        if (closed) { s.getTracks().forEach((t) => t.stop()); return; }
        stream.current = s;
        setRealMic(true);
      })
      .catch(() => { /* refused or not available: the fake dot stays */ });
    return () => {
      closed = true;
      stream.current?.getTracks().forEach((t) => t.stop());
      stream.current = null;
      setRealMic(false);
    };
  }, [recording, opt.micDot]);
  // Bumped on every jump from the hidden menu, so jumping to the lock screen again starts it fresh (bar at 0).
  const [visit, setVisit] = useState(0);
  // Set once they have done a way-in practice (at least round 1), so its setup card stays marked.
  const [loadingTried, setLoadingTried] = useState(false);
  const [tapTried, setTapTried] = useState(false);
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
  // Quick exit drops straight into the cover app, as if Nura was never open.
  const quickExit = () => { setHistory([]); setScreen("coverApp"); };
  const homeToAdd = () => { setHistory([]); setScreen("home"); };
  // Every way into Nura (the loading screen's way in, Bloom's 3 taps) lands on Home, or on the recording if there is one.
  const openNura = () => { setHistory([]); setScreen(rec !== null ? "voice" : "home"); };
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
    setVisit((v) => v + 1);
    if (j === "caseEmpty") { setEntries([]); setScreen("case"); return; }
    if (entries.length === 0) setEntries(SEED);
    setScreen(j);
  };
  // Back to a clean slate for the next participant, including the saved test options. The Mic Toggle is kept: it is
  // about the test device (the mic was allowed on it), not about the participant.
  const reset = () => {
    setOpt({ ...DEFAULT_OPTIONS, micDot: opt.micDot });
    setEntries(SEED); setCover("Bloom"); setDetailId(null);
    setDraft({ kind: "Voice note", seconds: 0, incident: null }); setRec(null); setLoadingTried(false); setTapTried(false);
    setHistory([]); setScreen("warn");
  };

  /* ---------- screens ---------- */

  let view: ReactNode = null;
  switch (screen) {
    case "warn": view = <Welcome onContinue={() => go("cover")} toast={toast} />; break;
    case "cover": view = <CoverChoice cover={cover} setCover={setCover} onContinue={() => go("way")} />; break;
    case "way": view = <WayIn cover={cover} onContinue={() => go("signin")}
      tapTried={tapTried} onTryTap={() => go("practiceTap")} loadingTried={loadingTried} onTryLoading={() => go("practiceLoading")} />; break;
    // Guided practice (two rounds), from setup or Settings. Back, or finishing, returns to where it was opened;
    // the setup card is marked once round 1 is done.
    case "practiceLoading":
      view = <LoadingPractice cover={cover} onExit={(learned) => { if (learned) setLoadingTried(true); back(); }} />;
      break;
    case "practiceTap":
      view = <TapPractice cover={cover} toast={toast} onExit={(learned) => { if (learned) setTapTried(true); back(); }} />;
      break;
    case "signin":
      view = <SignIn failOnce={opt.sim === "password"} onFailed={clearSim} onSignIn={() => { setHistory([]); setScreen("home"); }} />;
      break;
    case "lock":
      view = <FakeLoading key={visit} cover={cover}
        onUnlock={openNura} onDone={() => setScreen("coverApp")} />;
      break;
    case "coverApp": view = <CoverApp cover={cover} toast={toast} onUnlock={openNura} onRecord={() => { startRec(true); resumeRec(); }} />; break;
    case "home": view = <Home entries={entries} open={openEntry} start={go} />; break;
    case "case": view = <Case entries={entries} open={openEntry} onAdd={homeToAdd} />; break;
    case "entry": view = <EntryDetail entry={entries.find((e) => e.id === detailId) ?? entries[0]} onBack={back} />; break;
    case "resources": view = <Resources toast={toast} />; break;
    case "settings": view = <Settings cover={cover} toast={toast} onPracticeTap={() => go("practiceTap")} onPracticeLoading={() => go("practiceLoading")} />; break;
    case "note": view = <Note onBack={back} onSave={() => finish("Written note")} />; break;
    case "voice":
      view = <Voice rec={rec} onStart={() => startRec(false)} onPause={pauseRec} onResume={resumeRec} onBack={back}
        onDone={(s) => { setRec(null); finish("Voice note", s); }} />;
      break;
    case "camera": view = <Camera onBack={back} onShutter={() => finish("Photo, 2 items")} />; break;
    case "saved": view = <Saved onAnother={addAnother} onDone={() => tab("Home")} />; break;
    case "micDenied":
      view = <MicDenied onBack={back} onAllow={() => setScreen("voice")} onNote={() => setScreen("note")} />;
      break;
    case "uploadFailed":
      view = <UploadFailed kind={draft.kind} onBack={back}
        onRetry={() => setScreen("saved")} onLater={() => tab("Home")} />;
      break;
  }

  return (
    <div className="w-full min-h-[100dvh] flex items-center justify-center bg-[#f2f2f2] sm:py-[24px]">
      <HiddenMenu opt={opt} setOpt={setOpt} jump={jump} reset={reset} />
      {/* Material 3 (outlined) styles everything inside the phone frame, in the colours of the picked scheme: see index.css. */}
      <div data-phone data-ds="m3" data-scheme={opt.scheme} className="w-full h-[100dvh] sm:w-[360px] sm:h-[800px] sm:max-h-[calc(100dvh-48px)] sm:border-2 sm:border-[#1a1a1a] sm:rounded-[28px] flex flex-col bg-white relative overflow-hidden">
        {/* The drawn dot: Fake dot mode, or Real dot mode while the real mic is not open (yet). */}
        <StatusBar mic={recording && (opt.micDot === "fake" || !realMic)} />
        {view}
        {inApp && <BottomNav tabs={TABS} active={ACTIVE_TAB[screen] ?? "Home"} onSelect={tab} onHide={quickExit} />}
        <Toast text={toastText} />
      </div>
    </div>
  );
}
