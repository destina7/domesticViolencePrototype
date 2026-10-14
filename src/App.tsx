import { useEffect, useRef, useState } from "react";
import {
  BottomNav, Body, Button, Card, Chevron, Chip, Label, ListItem, Placeholder, QuickExit, Spacer, Switch, TextLine, TopBar,
} from "./ui";

type AB = "A" | "B";
type Options = { trigger: AB; exitPlace: AB; home: AB; verified: AB; exitTo: AB };
type Kind = "Voice note" | "Photo, 2 items" | "Written note";
type Entry = { id: number; kind: Kind; when: string };
type Screen =
  | "warning" | "signin" | "cover" | "coverSettings" | "harmless"
  | "home" | "case" | "plan" | "resources" | "settings" | "appearance"
  | "note" | "voice" | "camera" | "saved" | "detail" | "micDenied" | "uploadFailed";

const COVERS = [
  { name: "Bloom", sub: "Habit tracker" },
  { name: "Journal", sub: "Notes" },
  { name: "Coffee Tracker", sub: "Daily log" },
  { name: "Fitness", sub: "Workouts" },
];
const TABS = ["Home", "Case", "Plan", "Resources", "Settings"];
const TAB_SCREEN: Record<string, Screen> = { Home: "home", Case: "case", Plan: "plan", Resources: "resources", Settings: "settings" };
const SEED: Entry[] = [
  { id: 4, kind: "Voice note", when: "Tue 13 Oct, 21:14" },
  { id: 3, kind: "Photo, 2 items", when: "Mon 12 Oct, 19:05" },
  { id: 2, kind: "Written note", when: "Mon 12 Oct, 19:12" },
  { id: 1, kind: "Voice note", when: "Sat 10 Oct, 23:02" },
];
const PASSCODE = "1234";

export default function App() {
  const [opt, setOpt] = useState<Options>({ trigger: "A", exitPlace: "A", home: "A", verified: "A", exitTo: "A" });
  const [screen, setScreen] = useState<Screen>("warning");
  const [history, setHistory] = useState<Screen[]>([]);
  const [cover, setCover] = useState("Bloom");
  const [entries, setEntries] = useState<Entry[]>(SEED);
  const [detailId, setDetailId] = useState<number | null>(null);
  const [sheet, setSheet] = useState(false);
  const [lastSaved, setLastSaved] = useState<Kind>("Voice note");
  const [signedInOnce, setSignedInOnce] = useState(false);

  const go = (s: Screen) => { setHistory((h) => [...h, screen]); setScreen(s); setSheet(false); };
  const back = () => { setHistory((h) => { const p = h[h.length - 1] ?? "home"; setScreen(p); return h.slice(0, -1); }); };
  const tab = (t: string) => { setHistory([]); setScreen(TAB_SCREEN[t]); setSheet(false); };
  const quickExit = () => { setHistory([]); setSheet(false); setScreen(opt.exitTo === "A" ? "cover" : "harmless"); };
  const unlock = () => go("signin");
  const save = (kind: Kind) => {
    setEntries((e) => [{ id: Date.now(), kind, when: "Tue 13 Oct, 21:14" }, ...e]);
    setLastSaved(kind);
    go("saved");
  };

  const exitBtn = opt.exitPlace === "A" ? <QuickExit onClick={quickExit} /> : undefined;
  const showFloat = opt.exitPlace === "B" && !["warning", "signin", "cover", "coverSettings", "harmless"].includes(screen);
  const activeTab = { home: "Home", case: "Case", plan: "Plan", resources: "Resources", settings: "Settings", appearance: "Settings" }[screen as string];
  const realApp = !!activeTab;

  let view: React.ReactNode = null;
  switch (screen) {
    case "warning":
      view = <Warning cover={cover} setCover={setCover} onContinue={() => go("signin")} />;
      break;
    case "signin":
      view = <SignIn onSignIn={() => { setSignedInOnce(true); setHistory([]); setScreen("home"); }} firstRun={!signedInOnce} />;
      break;
    case "cover":
      view = <Cover name={cover} trigger={opt.trigger} onUnlock={unlock} onSettings={() => go("coverSettings")} />;
      break;
    case "coverSettings":
      view = <CoverSettings name={cover} trigger={opt.trigger} onBack={back} onUnlock={unlock} />;
      break;
    case "harmless":
      view = <Harmless onReset={() => { setHistory([]); setScreen("cover"); }} />;
      break;
    case "home":
      view = opt.home === "A"
        ? <HomeA entries={entries} exit={exitBtn} go={go} open={(id) => { setDetailId(id); go("detail"); }} />
        : <HomeB entries={entries} exit={exitBtn} onAdd={() => setSheet(true)} open={(id) => { setDetailId(id); go("detail"); }} />;
      break;
    case "case":
      view = <Case entries={entries} exit={exitBtn} onAdd={() => (opt.home === "A" ? tab("Home") : (tab("Home"), setSheet(true)))} open={(id) => { setDetailId(id); go("detail"); }} />;
      break;
    case "detail": {
      const e = entries.find((x) => x.id === detailId) ?? entries[0];
      view = <Detail entry={e} variant={opt.verified} exit={exitBtn} onBack={back}
        onDelete={() => { setEntries((l) => l.filter((x) => x.id !== e.id)); back(); }} />;
      break;
    }
    case "plan": view = <Plan exit={exitBtn} />; break;
    case "resources": view = <Resources exit={exitBtn} />; break;
    case "settings":
      view = <Settings exit={exitBtn} cover={cover} opt={opt} go={go}
        onDeleteAll={() => setEntries([])} />;
      break;
    case "appearance":
      view = <Appearance cover={cover} trigger={opt.trigger} onBack={back} onApply={(c) => { setCover(c); back(); }} />;
      break;
    case "note": view = <Note exit={exitBtn} onBack={back} onSave={() => save("Written note")} />; break;
    case "voice": view = <Voice exit={exitBtn} onBack={back} onSave={() => save("Voice note")} />; break;
    case "camera": view = <Camera exit={exitBtn} onBack={back} onSave={() => save("Photo, 2 items")} />; break;
    case "saved":
      view = <Saved kind={lastSaved} exit={exitBtn} onAnother={() => { setHistory([]); setScreen("home"); if (opt.home === "B") setSheet(true); }} onDone={() => tab("Home")} />;
      break;
    case "micDenied":
      view = <Failure exit={exitBtn} onBack={back} title="Nura needs the microphone"
        text="Without it, voice notes cannot be recorded. You can still write a note or take a photo."
        primary="Allow microphone" secondary="Write a note instead"
        onPrimary={() => setScreen("voice")} onSecondary={() => setScreen("note")} />;
      break;
    case "uploadFailed":
      view = <Failure exit={exitBtn} onBack={back} title="Not saved yet"
        text="There is no connection. Your recording is kept on this phone until it can be saved."
        primary="Try again" secondary="Keep it for later"
        onPrimary={() => save("Voice note")} onSecondary={() => tab("Home")} />;
      break;
  }

  return (
    <div className="w-full min-h-[100dvh] flex items-center justify-center gap-[32px] bg-[#f2f2f2] sm:py-[24px]">
    <OptionsPanel opt={opt} setOpt={setOpt} jump={(s) => { setHistory([]); setSheet(false); setScreen(s); }} />
    <div className="w-full h-[100dvh] sm:w-[360px] sm:h-[800px] sm:max-h-[calc(100dvh-48px)] sm:border-2 sm:border-[#1a1a1a] sm:rounded-[28px] flex flex-col bg-white relative overflow-hidden">
      {view}
      {realApp && <BottomNav tabs={TABS} active={activeTab!} onSelect={tab} />}
      {showFloat && (
        <div className={`absolute right-[14px] z-20 ${realApp ? "bottom-[84px]" : "bottom-[16px]"}`}>
          <QuickExit onClick={quickExit} />
        </div>
      )}
      {sheet && <AddSheet onClose={() => setSheet(false)} go={go} />}
    </div>
    </div>
  );
}

/* ---------- First run ---------- */

function Warning({ cover, setCover, onContinue }: { cover: string; setCover: (c: string) => void; onContinue: () => void }) {
  return (
    <>
      <TopBar title="Nura" />
      <Body>
        <p className="f-b text-[22px]">Before you start</p>
        <Card strong>
          <p className="f-s text-[14px]">Someone who checks your phone could find this app.</p>
          <TextLine w={300} /><TextLine w={240} />
        </Card>
        <Label>Choose how Nura looks on your phone</Label>
        {COVERS.map((c) => (
          <ListItem key={c.name} lead="round" title={c.name} sub={c.sub} selected={cover === c.name}
            onClick={() => setCover(c.name)} trail={cover === c.name ? <Chip>Chosen</Chip> : undefined} />
        ))}
        <Spacer />
        <Button onClick={onContinue}>Continue</Button>
        <p className="f-r text-[12px] text-[#666] text-center">You can change this later in Settings.</p>
      </Body>
    </>
  );
}

function Field({ label, value, onChange, type = "text", placeholder }: { label: string; value: string; onChange: (v: string) => void; type?: string; placeholder: string }) {
  return (
    <label className="border-[#1a1a1a] border-[1.5px] flex flex-col gap-[2px] justify-center min-h-[54px] px-[14px] py-[8px] rounded-[14px] w-full focus-within:shadow-[0_0_0_2px_#1a1a1a]">
      <span className="f-m text-[10px] text-[#666] tracking-[0.6px] uppercase">{label}</span>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className="f-r text-[14px] text-[#1a1a1a] placeholder:text-[#666] outline-none bg-transparent" />
    </label>
  );
}

function SignIn({ onSignIn, firstRun }: { onSignIn: () => void; firstRun: boolean }) {
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [error, setError] = useState(false);
  const submit = () => (pw.length >= 4 ? onSignIn() : setError(true));
  return (
    <>
      <TopBar title="Sign in" />
      <Body>
        <Field label="Email" value={email} onChange={setEmail} placeholder="name@example.com" />
        <Field label="Password" type="password" value={pw} onChange={(v) => { setPw(v); setError(false); }} placeholder="••••••••" />
        {error && (
          <div className="border-[#1a1a1a] border-[1.5px] flex flex-col gap-[6px] p-[12px] rounded-[16px]">
            <p className="f-s text-[14px]">That password does not match.</p>
            <p className="f-r text-[12px] text-[#666]">Check it and try again.</p>
          </div>
        )}
        <Button onClick={submit}>Sign in</Button>
        {!error && <Button variant="secondary" onClick={onSignIn}>Create an account</Button>}
        <Spacer />
        {firstRun && !error && (
          <Card>
            <p className="f-s text-[13px]">What Nura stores</p>
            <TextLine w={300} /><TextLine w={200} />
          </Card>
        )}
        <p className="f-r text-[11px] text-[#999] text-center">Prototype: any password of 4+ characters works.</p>
      </Body>
    </>
  );
}

/* ---------- Disguise ---------- */

const HABITS = [
  { t: "Morning meditation", s: "10 minutes" },
  { t: "Drink 8 glasses of water", s: "Daily goal" },
  { t: "30 min walk", s: "Outdoor" },
  { t: "Read 20 pages", s: "Current book" },
];

function Cover({ name, trigger, onUnlock, onSettings }: { name: string; trigger: AB; onUnlock: () => void; onSettings: () => void }) {
  const [done, setDone] = useState([true, true, true, false]);
  const [holding, setHolding] = useState(false);
  const timer = useRef<number | undefined>(undefined);
  const start = () => {
    if (trigger !== "A") return;
    setHolding(true);
    timer.current = window.setTimeout(() => { setHolding(false); onUnlock(); }, 2000);
  };
  const stop = () => { window.clearTimeout(timer.current); setHolding(false); };
  useEffect(() => () => window.clearTimeout(timer.current), []);
  return (
    <>
      <TopBar
        title={name}
        titleProps={{ onPointerDown: start, onPointerUp: stop, onPointerLeave: stop, style: { opacity: holding ? 0.6 : 1, transition: "opacity 2s" } }}
        right={<span className="border-[#1a1a1a] border-[1.5px] rounded-[10px] size-[20px] shrink-0" />}
      />
      <Body>
        <Card>
          <p className="f-s text-[14px]">Today</p>
          <div className="w-full bg-[#ebebeb] h-[8px] rounded-[4px] overflow-hidden">
            <div className="bg-[#c7c7c7] h-full transition-all" style={{ width: `${(done.filter(Boolean).length / 4) * 100}%` }} />
          </div>
        </Card>
        {HABITS.map((h, i) => (
          <ListItem key={h.t} lead="round" title={h.t} sub={h.s} selected={done[i]}
            onClick={() => setDone((d) => d.map((v, j) => (j === i ? !v : v)))}
            trail={done[i] ? <Chip>Done</Chip> : <Chip quiet>To do</Chip>} />
        ))}
        {trigger === "A" && <p className="f-r text-[11px] text-[#999] text-center mt-[8px]">Prototype: hold the title for two seconds.</p>}
      </Body>
      <BottomNav tabs={["Habits", "Stats", "Calendar", "Explore", "Settings"]} active="Habits"
        onSelect={(t) => t === "Settings" && onSettings()} />
    </>
  );
}

function CoverSettings({ name, trigger, onBack, onUnlock }: { name: string; trigger: AB; onBack: () => void; onUnlock: () => void }) {
  const [reminders, setReminders] = useState(true);
  const [entering, setEntering] = useState(false);
  const [code, setCode] = useState("");
  const [wrong, setWrong] = useState(false);
  useEffect(() => {
    if (code.length === 4) {
      if (code === PASSCODE && trigger === "B") onUnlock();
      else { setWrong(true); window.setTimeout(() => { setCode(""); setWrong(false); }, 600); }
    }
  }, [code]);
  return (
    <>
      <TopBar title="Settings" onBack={onBack} />
      <Body>
        <ListItem title="Reminders" sub="Morning, evening" trail={<Switch on={reminders} onChange={setReminders} />} />
        <ListItem title="Units" sub="Metric" trail={<Chevron />} onClick={() => {}} />
        <ListItem title="Appearance" sub="Light" trail={<Chevron />} onClick={() => {}} />
        <ListItem title="Passcode" sub="Off" trail={<Chevron />} onClick={() => setEntering(true)} />
        {entering && (
          <div className="border-[#1a1a1a] border-[1.5px] flex flex-col gap-[8px] items-center px-[20px] py-[12px] rounded-[16px]">
            <p className="f-m text-[11px] text-[#666]">Enter passcode</p>
            <label className={`flex gap-[10px] relative ${wrong ? "animate-pulse" : ""}`}>
              {[0, 1, 2, 3].map((i) => (
                <span key={i} className={`border-[1.5px] border-dashed rounded-[12px] w-[52px] h-[60px] flex items-center justify-center f-b text-[22px] ${code[i] ? "bg-white border-[#1a1a1a]" : "bg-[#ebebeb] border-[#c7c7c7]"}`}>
                  {code[i] ? "•" : ""}
                </span>
              ))}
              <input autoFocus inputMode="numeric" maxLength={4} value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 4))}
                className="absolute inset-0 opacity-0" aria-label="Passcode" />
            </label>
            {trigger === "B" && <p className="f-r text-[11px] text-[#999]">Prototype: your code is {PASSCODE}.</p>}
          </div>
        )}
      </Body>
      <BottomNav tabs={["Habits", "Stats", "Calendar", "Explore", "Settings"]} active="Settings"
        onSelect={(t) => t === "Habits" && onBack()} />
      <span className="hidden">{name}</span>
    </>
  );
}

function Harmless({ onReset }: { onReset: () => void }) {
  return (
    <div className="flex-1 bg-[#ebebeb] flex flex-col items-center justify-center gap-[16px] p-[16px]">
      <div className="bg-white border-[#c7c7c7] border-[1.5px] border-dashed flex flex-col gap-[10px] p-[16px] rounded-[16px] w-full max-w-[420px]">
        <Label>Weather · Eindhoven</Label>
        <p className="f-b text-[28px]">14° Cloudy</p>
        <Placeholder className="h-[110px] w-full">Plain public page, e.g. weather or news. Browser history cleared.</Placeholder>
      </div>
      <button onClick={onReset} className="f-r text-[11px] text-[#999] underline">Prototype: reopen the app (cover)</button>
    </div>
  );
}

function Appearance({ cover, trigger, onBack, onApply }: { cover: string; trigger: AB; onBack: () => void; onApply: (c: string) => void }) {
  const [sel, setSel] = useState(cover);
  return (
    <>
      <TopBar title="Appearance" onBack={onBack} />
      <Body>
        <p className="f-r text-[13px] text-[#666]">Choose what this app looks like on your phone. Name and icon change.</p>
        {COVERS.map((c) => (
          <ListItem key={c.name} lead="image" title={c.name} sub={c.sub} selected={sel === c.name}
            onClick={() => setSel(c.name)} trail={sel === c.name ? <Chip>Chosen</Chip> : undefined} />
        ))}
        <div className="bg-[#ebebeb] flex flex-col gap-[6px] p-[12px] rounded-[16px]">
          <Label>Way back in</Label>
          <p className="f-r text-[12px] text-[#666]">
            {trigger === "A" ? `Hold the "${sel}" title for two seconds.` : `Settings › Passcode, then your 4-digit code.`}
          </p>
        </div>
        <Spacer />
        <Button onClick={() => onApply(sel)}>Apply</Button>
      </Body>
    </>
  );
}

/* ---------- Home and capture ---------- */

function EntryRow({ e, sub, onClick }: { e: Entry; sub?: string; onClick: () => void }) {
  return <ListItem title={e.kind} sub={sub ?? e.when} trail={<Chip>Saved</Chip>} onClick={onClick} />;
}

function Empty({ text }: { text: string }) {
  return <p className="f-r text-[13px] text-[#666] py-[8px]">{text}</p>;
}

function HomeA({ entries, exit, go, open }: { entries: Entry[]; exit: React.ReactNode; go: (s: Screen) => void; open: (id: number) => void }) {
  return (
    <>
      <TopBar title="Home" right={exit} />
      <Body>
        <Label>Add to your record</Label>
        <Button tall icon="square" onClick={() => go("note")}>Write a note</Button>
        <Button tall icon="round" onClick={() => go("voice")}>Record your voice</Button>
        <Button tall icon="square" onClick={() => go("camera")}>Take a photo or video</Button>
        <Label>Recent</Label>
        {entries.length === 0 && <Empty text="Nothing yet." />}
        {entries.slice(0, 2).map((e) => <EntryRow key={e.id} e={e} onClick={() => open(e.id)} />)}
      </Body>
    </>
  );
}

function HomeB({ entries, exit, onAdd, open }: { entries: Entry[]; exit: React.ReactNode; onAdd: () => void; open: (id: number) => void }) {
  const groups: Record<string, Entry[]> = {};
  entries.forEach((e) => { const d = e.when.split(",")[0]; (groups[d] ??= []).push(e); });
  return (
    <>
      <TopBar title="Home" right={exit} />
      <Body>
        <Label>Your record</Label>
        {entries.length === 0 && <Empty text="Nothing yet." />}
        {Object.entries(groups).map(([d, list]) => (
          <div key={d} className="flex flex-col gap-[12px]">
            <Label>{d}</Label>
            {list.map((e) => <EntryRow key={e.id} e={e} sub={e.when.split(", ")[1]} onClick={() => open(e.id)} />)}
          </div>
        ))}
        <Spacer />
        <div className="pr-0"><Button onClick={onAdd}>Add entry</Button></div>
      </Body>
    </>
  );
}

function AddSheet({ onClose, go }: { onClose: () => void; go: (s: Screen) => void }) {
  return (
    <div className="absolute inset-0 z-30 flex flex-col justify-end">
      <button aria-label="Close" onClick={onClose} className="absolute inset-0 bg-[rgba(26,26,26,0.35)]" />
      <div className="relative bg-white border-t-2 border-[#1a1a1a] rounded-t-[24px] flex flex-col gap-[10px] items-center px-[18px] pt-[18px] pb-[18px] w-full max-w-[560px] mx-auto">
        <div className="bg-[#c7c7c7] h-[4px] w-[36px] rounded-[2px]" />
        <p className="f-s text-[16px]">What do you want to add?</p>
        <Button icon="square" onClick={() => go("note")}>Write a note</Button>
        <Button icon="round" onClick={() => go("voice")}>Record your voice</Button>
        <Button icon="square" onClick={() => go("camera")}>Take a photo or video</Button>
      </div>
    </div>
  );
}

function Note({ exit, onBack, onSave }: { exit: React.ReactNode; onBack: () => void; onSave: () => void }) {
  const [text, setText] = useState("");
  return (
    <>
      <TopBar title="Written note" onBack={onBack} right={exit} />
      <Body>
        <Card>
          <Label>Date and time</Label>
          <p className="f-s text-[14px]">Tue 13 Oct, 21:14</p>
          <p className="f-r text-[12px] text-[#666]">Set automatically</p>
        </Card>
        <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="Write what happened, in your own words."
          className="border-[#1a1a1a] border-[1.5px] rounded-[16px] p-[14px] flex-1 min-h-[200px] f-r text-[14px] placeholder:text-[#666] outline-none resize-none" />
        <p className="f-r text-[12px] text-[#666]">Saved as you type. Nothing is sent until you choose.</p>
        <Button onClick={onSave}>Save note</Button>
      </Body>
    </>
  );
}

function Voice({ exit, onBack, onSave }: { exit: React.ReactNode; onBack: () => void; onSave: () => void }) {
  const [rec, setRec] = useState(false);
  const [sec, setSec] = useState(0);
  useEffect(() => {
    if (!rec) return;
    const t = window.setInterval(() => setSec((s) => s + 1), 1000);
    return () => window.clearInterval(t);
  }, [rec]);
  const mm = String(Math.floor(sec / 60)).padStart(2, "0");
  const ss = String(sec % 60).padStart(2, "0");
  return (
    <>
      <TopBar title="Voice note" onBack={onBack} right={exit} />
      <Body center>
        <Spacer />
        <button onClick={() => (rec ? onSave() : setRec(true))}
          className={`border-[#1a1a1a] border-[2.5px] flex items-center justify-center rounded-full size-[128px] shrink-0 f-s text-[15px] transition-colors ${rec ? "bg-[#1a1a1a] text-white" : "hover:bg-[#f5f5f5]"}`}>
          {rec ? "Stop" : "Record"}
        </button>
        <p className="f-m text-[28px] tabular-nums">{mm}:{ss}</p>
        <p className="f-r text-[13px] text-[#666] text-center w-[240px]">Tap to start. Tap again to stop and save.</p>
        <Spacer />
        <Card>
          <Label>After saving</Label>
          <TextLine w={280} /><TextLine w={220} />
          <p className="f-r text-[12px] text-[#666]">Text from the recording. Automatic, may contain mistakes.</p>
        </Card>
      </Body>
    </>
  );
}

function Camera({ exit, onBack, onSave }: { exit: React.ReactNode; onBack: () => void; onSave: () => void }) {
  const [mode, setMode] = useState<"Photo" | "Video">("Photo");
  return (
    <>
      <TopBar title="Photo or video" onBack={onBack} right={exit} />
      <div className="flex flex-1 flex-col gap-[12px] min-h-0 pt-[8px] pb-[16px] w-full">
        <Placeholder className="flex-1 w-full rounded-none border-x-0">Camera view</Placeholder>
        <div className="flex items-center justify-center gap-[28px] h-[68px]">
          {(["Photo", "Video"] as const).map((m, i) => (
            <button key={m} onClick={() => setMode(m)} style={{ order: i === 0 ? 0 : 2 }}
              className={`border-2 rounded-[16px] w-[76px] h-[44px] f-s text-[15px] ${mode === m ? "border-[#1a1a1a]" : "border-[#c7c7c7]"}`}>{m}</button>
          ))}
          <button aria-label="Shutter" onClick={onSave} style={{ order: 1 }}
            className="border-[#1a1a1a] border-[2.5px] rounded-full size-[68px] shadow-[inset_0_0_0_5px_#fff] bg-[#1a1a1a] active:scale-95 transition-transform" />
        </div>
      </div>
    </>
  );
}

function Saved({ kind, exit, onAnother, onDone }: { kind: Kind; exit: React.ReactNode; onAnother: () => void; onDone: () => void }) {
  return (
    <>
      <TopBar title="Saved" right={exit} />
      <Body center>
        <Spacer />
        <div className="border-[#1a1a1a] border-[2.5px] flex items-center justify-center rounded-full size-[84px] f-s text-[14px]">Check</div>
        <p className="f-b text-[26px]">Saved</p>
        <p className="f-r text-[13px] text-[#666] text-center w-[240px]">Tue 13 Oct, 21:14. Stored encrypted. You can find it under Case.</p>
        <span className="sr-only">{kind}</span>
        <Spacer />
        <Button onClick={onAnother}>Add another</Button>
        <Button variant="secondary" onClick={onDone}>Done</Button>
      </Body>
    </>
  );
}

/* ---------- Case ---------- */

function Case({ entries, exit, onAdd, open }: { entries: Entry[]; exit: React.ReactNode; onAdd: () => void; open: (id: number) => void }) {
  const [exported, setExported] = useState(false);
  if (entries.length === 0) {
    return (
      <>
        <TopBar title="Case" right={exit} />
        <Body center>
          <Spacer />
          <Placeholder className="w-[140px] h-[110px]">soft illustration, no people</Placeholder>
          <p className="f-b text-[22px]">Nothing here yet</p>
          <p className="f-r text-[13px] text-[#666] text-center w-[230px]">What you add on Home will appear here, newest first.</p>
          <Button onClick={onAdd}>Add the first entry</Button>
          <Spacer />
        </Body>
      </>
    );
  }
  return (
    <>
      <TopBar title="Case" right={exit} />
      <Body>
        <div className="border-[#1a1a1a] border-[1.5px] flex flex-col gap-[6px] p-[12px] rounded-[16px]">
          <Label>Your case</Label>
          <p className="f-b text-[18px]">Case 1</p>
          <p className="f-r text-[12px] text-[#666]">{entries.length + 5} entries · first entry 2 Sep</p>
        </div>
        <Button onClick={() => setExported(true)}>{exported ? "Export ready to share" : "Export for a professional"}</Button>
        <Label>Entries</Label>
        {entries.map((e) => <EntryRow key={e.id} e={e} onClick={() => open(e.id)} />)}
      </Body>
    </>
  );
}

function Detail({ entry, variant, exit, onBack, onDelete }: { entry: Entry; variant: AB; exit: React.ReactNode; onBack: () => void; onDelete: () => void }) {
  const [proof, setProof] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const media = entry.kind === "Voice note" ? "Audio player · 03:12" : entry.kind === "Photo, 2 items" ? "Photo · 2 items" : "Written note";
  return (
    <>
      <TopBar title={entry.kind} onBack={onBack} right={exit} />
      <Body>
        <div className="flex gap-[8px] items-center">
          <Chip>{variant === "A" ? "Saved and verified" : "Saved"}</Chip>
          <p className="f-r text-[12px] text-[#666]">{entry.when}</p>
        </div>
        <Card><Placeholder className="h-[46px] w-full">{media}</Placeholder></Card>
        {entry.kind === "Voice note" && (
          <Card>
            <Label>Text from the recording</Label>
            <TextLine w={280} /><TextLine w={230} /><TextLine w={160} />
            <p className="f-r text-[12px] text-[#666]">Automatic. May contain mistakes.</p>
          </Card>
        )}
        {variant === "A" || proof ? (
          <>
            <Label>Details</Label>
            <ListItem title="Recorded" sub={`${entry.when}:07`} />
            <ListItem title="Time confirmed by" sub="trusted timestamp" />
          </>
        ) : (
          <ListItem title="How this entry is protected" sub="Time, encryption, integrity" trail={<Chevron />} onClick={() => setProof(true)} />
        )}
        <Spacer />
        {confirm ? (
          <div className="border-[#1a1a1a] border-[1.5px] flex flex-col gap-[10px] p-[12px] rounded-[16px]">
            <p className="f-s text-[14px]">Delete this entry?</p>
            <p className="f-r text-[12px] text-[#666]">It will be removed from your case and cannot be used as evidence later.</p>
            <Button onClick={onDelete}>Delete entry</Button>
            <Button variant="secondary" onClick={() => setConfirm(false)}>Keep it</Button>
          </div>
        ) : (
          <Button variant="outline" onClick={() => setConfirm(true)}>Delete entry</Button>
        )}
      </Body>
    </>
  );
}

/* ---------- Support and settings ---------- */

function Plan({ exit }: { exit: React.ReactNode }) {
  const items = [
    { t: "People I can call", s: "0 added" },
    { t: "A safe place to go", s: "Not set" },
    { t: "Important documents", s: "Checklist" },
    { t: "What to keep nearby", s: "Checklist" },
  ];
  return (
    <>
      <TopBar title="Plan" right={exit} />
      <Body>
        <p className="f-r text-[13px] text-[#666]">Small steps you can take when you are ready. Skip anything.</p>
        {items.map((i) => <ListItem key={i.t} lead="square" title={i.t} sub={i.s} trail={<Chevron />} onClick={() => {}} />)}
      </Body>
    </>
  );
}

function Resources({ exit }: { exit: React.ReactNode }) {
  const items = [
    { t: "Veilig Thuis", s: "Advice and reporting", c: "Call" },
    { t: "NEST / Lumens", s: "Support in Eindhoven", c: "Open" },
    { t: "Police", s: "Reporting abuse", c: "Open" },
    { t: "Your rights", s: "Plain-language guide", c: "Read" },
  ];
  return (
    <>
      <TopBar title="Resources" right={exit} />
      <Body>
        <div className="border-[#1a1a1a] border-[1.5px] flex flex-col gap-[6px] p-[12px] rounded-[16px]">
          <p className="f-s text-[15px]">In danger now</p>
          <p className="f-r text-[13px] text-[#666]">Call 112.</p>
          <a href="tel:112" className="bg-[#1a1a1a] text-white rounded-[14px] min-h-[44px] flex items-center justify-center f-s text-[15px]">Call 112</a>
        </div>
        {items.map((i) => <ListItem key={i.t} title={i.t} sub={i.s} trail={<Chip quiet>{i.c}</Chip>} onClick={() => {}} />)}
      </Body>
    </>
  );
}

function Settings({ exit, cover, opt, go, onDeleteAll }: { exit: React.ReactNode; cover: string; opt: Options; go: (s: Screen) => void; onDeleteAll: () => void }) {
  const [notif, setNotif] = useState(false);
  const [confirm, setConfirm] = useState(false);
  return (
    <>
      <TopBar title="Settings" right={exit} />
      <Body>
        <ListItem title="Look of this app" sub={cover} trail={<Chevron />} onClick={() => go("appearance")} />
        <ListItem title="Way back in" sub={opt.trigger === "A" ? "Hold the title" : "Passcode in settings"} trail={<Chevron />} onClick={() => go("appearance")} />
        <ListItem title="Quick exit goes to" sub={opt.exitTo === "A" ? "Cover app" : "Harmless website"} trail={<Chevron />} onClick={() => {}} />
        <ListItem title="Lock the app after" sub="2 minutes" trail={<Chevron />} onClick={() => {}} />
        <ListItem title="Notifications" sub={notif ? "On, no content shown" : "Off, nothing shows"} trail={<Switch on={notif} onChange={setNotif} />} />
        <ListItem title="Language" sub="Nederlands" trail={<Chevron />} onClick={() => {}} />
        <ListItem title="What Nura stores" sub="Plain explanation" trail={<Chevron />} onClick={() => {}} />
        <Spacer />
        {confirm ? (
          <div className="border-[#1a1a1a] border-[1.5px] flex flex-col gap-[10px] p-[12px] rounded-[16px]">
            <p className="f-s text-[14px]">Delete everything?</p>
            <p className="f-r text-[12px] text-[#666]">All entries on this phone and in your account are removed. This cannot be undone.</p>
            <Button onClick={() => { onDeleteAll(); setConfirm(false); }}>Delete everything</Button>
            <Button variant="secondary" onClick={() => setConfirm(false)}>Cancel</Button>
          </div>
        ) : (
          <Button variant="outline" onClick={() => setConfirm(true)}>Delete everything</Button>
        )}
      </Body>
    </>
  );
}

function Failure(p: { exit: React.ReactNode; onBack: () => void; title: string; text: string; primary: string; secondary: string; onPrimary: () => void; onSecondary: () => void }) {
  return (
    <>
      <TopBar title="Voice note" onBack={p.onBack} right={p.exit} />
      <Body center>
        <Spacer />
        <p className="f-b text-[22px] text-center w-[260px]">{p.title}</p>
        <p className="f-r text-[13px] text-[#666] text-center w-[250px]">{p.text}</p>
        <Button onClick={p.onPrimary}>{p.primary}</Button>
        <Button variant="secondary" onClick={p.onSecondary}>{p.secondary}</Button>
        <Spacer />
      </Body>
    </>
  );
}

/* ---------- Prototype controls ---------- */

function OptionsPanel({ opt, setOpt, jump }: { opt: Options; setOpt: (o: Options) => void; jump: (s: Screen) => void }) {
  // Sits next to the phone frame on wide screens. On narrow screens it is hidden:
  // tap the top-left corner of the screen 3 times quickly, or press "P" on a keyboard, to toggle it.
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
      if (e.key === "p" || e.key === "P") setOpen((o) => !o);
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
  const rows: [keyof Options, string][] = [
    ["trigger", "1. Way back in: hold title / passcode"],
    ["exitPlace", "2. Quick exit: top bar / floating"],
    ["home", "3. Home: three buttons / Add entry"],
    ["verified", "4. Verified: chip / details on tap"],
    ["exitTo", "5. Quick exit to: cover / harmless site"],
  ];
  return (
    <aside className={`${open ? "fixed left-[12px] right-[12px] top-[12px] z-50 flex max-h-[calc(100dvh-24px)] overflow-y-auto" : "hidden"} md:static md:flex md:z-auto md:w-[280px] md:max-h-none md:overflow-visible bg-white border-2 border-[#1a1a1a] rounded-[16px] p-[16px] shrink-0 flex-col gap-[10px] shadow-[0_8px_24px_rgba(0,0,0,0.08)]`}>
      <div className="flex items-center justify-between">
        <p className="f-s text-[14px] text-[#1a1a1a]">Prototype options</p>
        <button onClick={() => setOpen(false)} aria-label="Close prototype options"
          className="md:hidden f-m text-[12px] text-[#666] border-[1.5px] border-[#c7c7c7] rounded-full px-[10px] py-[2px]">Close</button>
      </div>
      <Label>Open decisions</Label>
      {rows.map(([k, l]) => (
        <div key={k} className="flex items-center justify-between gap-[8px]">
          <span className="f-r text-[12px] text-[#1a1a1a] leading-tight">{l}</span>
          <div className="flex border-[1.5px] border-[#1a1a1a] rounded-full overflow-hidden shrink-0">
            {(["A", "B"] as const).map((v) => (
              <button key={v} onClick={() => setOpt({ ...opt, [k]: v })}
                className={`w-[28px] h-[22px] f-s text-[11px] ${opt[k] === v ? "bg-[#1a1a1a] text-white" : ""}`}>{v}</button>
            ))}
          </div>
        </div>
      ))}
      <Label>Jump to</Label>
      <div className="flex flex-wrap gap-[6px]">
        {([["warning", "First run"], ["cover", "Cover app"], ["home", "Home"], ["micDenied", "Mic denied"], ["uploadFailed", "Upload failed"]] as [Screen, string][]).map(([s, l]) => (
          <button key={s} onClick={() => { jump(s); setOpen(false); }}
            className="border-[1.5px] border-[#c7c7c7] rounded-full px-[10px] py-[2px] f-m text-[12px] hover:border-[#1a1a1a]">{l}</button>
        ))}
      </div>
    </aside>
  );
}
