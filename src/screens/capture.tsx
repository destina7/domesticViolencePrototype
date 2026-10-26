import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { Body, Button, Card, CheckMark, Chip, Foot, Heading, Label, Placeholder, Spacer, TextLine, TopBar, fmtTime, useTimer } from "../ui";
import { INCIDENTS } from "../data";
import type { CaptureDesign, Kind, VoiceDesign } from "../data";

type Common = { exit: ReactNode; onBack: () => void };

/* ---------- Written note ---------- */

export function Note({ design, exit, onBack, onSave }: Common & { design: CaptureDesign; onSave: () => void }) {
  const [text, setText] = useState("");
  return (
    <>
      <TopBar title="Written note" onBack={onBack} right={exit} />
      <Body>
        <Card strong>
          <Label>Date and time</Label>
          <p className="f-s text-[14px]">Tue 13 Oct, 21:14</p>
          <p className="f-r text-[12px] text-[#666]">Set automatically</p>
        </Card>
        <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="Write what happened, in your own words."
          className="border-[#c7c7c7] border-[1.5px] rounded-[16px] p-[14px] flex-1 min-h-[160px] f-r text-[14px] placeholder:text-[#666] outline-none focus:border-[#1a1a1a] resize-none" />
        <p className="f-r text-[12px] text-[#666]">
          {design === "1" ? "Saved as you type. Nothing is sent until you choose." : "✓ Saved as you type. Nothing is shared."}
        </p>
        <Button onClick={onSave}>Save note</Button>
      </Body>
    </>
  );
}

/* ---------- Voice note ---------- */

const BARS = [10, 18, 28, 20, 34, 44, 30, 40, 26, 36, 46, 32, 22, 38, 28, 16, 24, 12];

/**
 * Design 1: tap Record, then tap again. Design 2: starts recording straight away, big Stop button.
 * `saveOnStop` is true when the capture design saves directly, false when a check screen follows.
 */
export function Voice({ design, saveOnStop, exit, onBack, onDone, onMic }: Common & { design: VoiceDesign; saveOnStop: boolean; onDone: (seconds: number) => void; onMic: (on: boolean) => void }) {
  const [rec, setRec] = useState(design === "2");
  const [paused, setPaused] = useState(false);
  const sec = useTimer(rec && !paused);
  useEffect(() => { onMic(rec); return () => onMic(false); }, [rec]);

  if (design === "2") {
    return (
      <>
        <TopBar title="Voice note" onBack={onBack} right={exit} />
        <Body center>
          <Spacer />
          <span className="border-[#1a1a1a] border-[1.5px] rounded-full px-[10px] py-[2px] flex items-center gap-[6px] f-m text-[12px]">
            <span className={`size-[8px] rounded-full bg-[#1a1a1a] ${paused ? "opacity-30" : ""}`} />{paused ? "Paused" : "Recording"}
          </span>
          <p className="f-b text-[40px] tabular-nums">{fmtTime(sec)}</p>
          <div className="flex items-center gap-[4px] h-[52px]" aria-hidden>
            {BARS.map((h, i) => (
              <span key={i} className="w-[4px] rounded-full bg-[#c7c7c7] origin-center"
                style={{ height: h, animation: paused ? "none" : `wave 1.1s ease-in-out ${(i % 6) * 0.13}s infinite` }} />
            ))}
          </div>
          <p className="f-r text-[12px] text-[#666] text-center">Saved inside the app while you record.</p>
          <div className="border-[#c7c7c7] border-[1.5px] border-dashed rounded-[12px] px-[12px] py-[10px] w-full">
            <p className="f-r text-[12px] text-[#666]">Your phone shows a dot while the mic is on.</p>
          </div>
          <Spacer />
          <div className="flex items-end justify-center gap-[44px] pb-[14px]">
            <button onClick={() => setPaused(!paused)} className="flex flex-col items-center gap-[4px]">
              <span className="border-[#1a1a1a] border-[1.5px] rounded-full size-[48px] flex items-center justify-center f-s text-[14px] hover:bg-[#f5f5f5]">{paused ? "▶" : "II"}</span>
              <span className="f-m text-[11px]">{paused ? "Resume" : "Pause"}</span>
            </button>
            <button onClick={() => onDone(sec)} aria-label="Stop" className="flex flex-col items-center gap-[4px] active:scale-95 transition-transform">
              <span className="bg-[#1a1a1a] rounded-full size-[84px] flex items-center justify-center">
                <span className="bg-white size-[16px] rounded-[3px]" />
              </span>
              <span className="f-s text-[12px]">Stop</span>
            </button>
            <span className="w-[48px]" />
          </div>
        </Body>
      </>
    );
  }

  return (
    <>
      <TopBar title="Voice note" onBack={onBack} right={exit} />
      <Body center>
        <Spacer />
        <button onClick={() => (rec ? onDone(sec) : setRec(true))}
          className={`border-[#1a1a1a] border-[2.5px] flex items-center justify-center rounded-full size-[128px] shrink-0 f-s text-[15px] transition-colors ${rec ? "bg-[#1a1a1a] text-white" : "hover:bg-[#f5f5f5]"}`}>
          {rec ? "Stop" : "Record"}
        </button>
        <p className="f-m text-[28px] tabular-nums">{fmtTime(sec)}</p>
        <p className="f-r text-[13px] text-[#666] text-center w-[240px]">{saveOnStop ? "Tap to start. Tap again to stop and save." : "Tap to start. Tap again to stop."}</p>
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

/* ---------- Photo or video ---------- */

export function Camera({ exit, onBack, onShutter }: Common & { onShutter: () => void }) {
  const [mode, setMode] = useState<"Photo" | "Video">("Photo");
  const modeBtn = (m: "Photo" | "Video") => (
    <button onClick={() => setMode(m)}
      className={`border-[1.5px] rounded-[16px] w-[76px] h-[44px] f-s text-[14px] ${mode === m ? "border-[#1a1a1a]" : "border-[#c7c7c7] text-[#666]"}`}>{m}</button>
  );
  return (
    <>
      <TopBar title="Photo or video" onBack={onBack} right={exit} />
      <div className="flex flex-1 flex-col gap-[12px] min-h-0 pt-[8px] pb-[16px] w-full">
        <Placeholder className="flex-1 w-full rounded-none border-x-0">Camera view</Placeholder>
        <div className="flex items-center justify-center gap-[28px] h-[68px]">
          {modeBtn("Photo")}
          <button aria-label="Shutter" onClick={onShutter}
            className="border-[#1a1a1a] border-[2.5px] rounded-full size-[68px] shadow-[inset_0_0_0_5px_#fff] bg-white active:scale-95 transition-transform" />
          {modeBtn("Video")}
        </div>
      </div>
    </>
  );
}

/* ---------- Check before saving (design 2 only) ---------- */

export function Check({ kind, seconds, exit, onSave, onDiscard }: { kind: Kind; seconds: number; exit: ReactNode; onSave: (incident: string | null) => void; onDiscard: () => void }) {
  const total = Math.max(seconds, 1);
  const [playing, setPlaying] = useState(false);
  const played = useTimer(playing);
  useEffect(() => { if (played >= total) setPlaying(false); }, [played, total]);
  const [extra, setExtra] = useState<string | null>(null);
  const [sel, setSel] = useState<string | null>(INCIDENTS[0].name);
  const chips = [...INCIDENTS.map((i) => ({ name: i.name, chip: i.chip })), ...(extra ? [{ name: extra, chip: "New · 13 Oct" }] : [])];
  return (
    <>
      <TopBar title="Check before saving" right={exit} />
      <Body>
        {kind === "Voice note" ? (
          <div className="border-[#1a1a1a] border-[1.5px] flex items-center gap-[12px] p-[12px] rounded-[16px] shrink-0">
            <button onClick={() => setPlaying(!playing)} aria-label={playing ? "Pause" : "Play"}
              className="border-[#1a1a1a] border-[1.5px] rounded-full size-[40px] flex items-center justify-center shrink-0 hover:bg-[#f5f5f5] f-s text-[13px]">{playing ? "II" : "▶"}</button>
            <div className="flex-1 flex flex-col gap-[6px]">
              <div className="bg-[#ebebeb] h-[6px] rounded-full overflow-hidden"><div className="bg-[#1a1a1a] h-full transition-all" style={{ width: `${Math.min(100, (Math.min(played, total) / total) * 100)}%` }} /></div>
              <p className="f-r text-[11px] text-[#666]">{Math.floor(played / 60)}:{String(played % 60).padStart(2, "0")} / {Math.floor(total / 60)}:{String(total % 60).padStart(2, "0")}</p>
            </div>
          </div>
        ) : kind === "Photo, 2 items" ? (
          <Placeholder className="h-[96px] w-full">Photo preview · 2 items</Placeholder>
        ) : (
          <Card strong><Label>Your note</Label><TextLine w={280} /><TextLine w={220} /></Card>
        )}
        <Card>
          <Label>Date and time</Label>
          <p className="f-s text-[14px]">Tue 13 Oct, 21:14</p>
          <p className="f-r text-[12px] text-[#666]">Set automatically, cannot be changed</p>
        </Card>
        <p className="f-s text-[13px] text-center mt-[4px]">Add to an incident (optional)</p>
        <div className="flex flex-wrap justify-center gap-[8px]">
          {chips.map((c) => <Chip key={c.name} solid={sel === c.name} onClick={() => setSel(c.name)}>{c.chip}</Chip>)}
          {!extra && <Chip onClick={() => { setExtra("New incident · Tue 13 Oct"); setSel("New incident · Tue 13 Oct"); }}>+ New</Chip>}
          <Chip solid={sel === null} onClick={() => setSel(null)}>Not now</Chip>
        </div>
        <p className="f-s text-[13px] text-center mt-[4px]">A few words (optional)</p>
        <input placeholder="For example where you were"
          className="border-[#c7c7c7] border-[1.5px] rounded-[14px] px-[14px] min-h-[44px] f-r text-[13px] placeholder:text-[#666] outline-none focus:border-[#1a1a1a]" />
        <Spacer />
        <Button onClick={() => onSave(sel)}>Save</Button>
        <button onClick={onDiscard} className="f-s text-[14px] min-h-[40px]">Delete this {kind === "Voice note" ? "recording" : kind === "Photo, 2 items" ? "photo" : "note"}</button>
      </Body>
    </>
  );
}

/* ---------- Saved ---------- */

export function Saved({ exit, onAnother, onDone }: { exit: ReactNode; onAnother: () => void; onDone: () => void }) {
  return (
    <>
      <TopBar title="Saved" right={exit} />
      <Body center>
        <Spacer />
        <CheckMark />
        <p className="f-b text-[26px]">Saved</p>
        <p className="f-r text-[13px] text-[#666] text-center w-[240px]">Tue 13 Oct, 21:14. Stored encrypted. You can find it under Case.</p>
        <Spacer />
        <Button onClick={onAnother}>Add another</Button>
        <Button variant="outline" onClick={onDone}>Done</Button>
      </Body>
    </>
  );
}

/* ---------- Failure states (triggered from the hidden menu) ---------- */

function Failure(p: Common & { topTitle: string; title: string; text: string; primary: string; secondary: string; onPrimary: () => void; onSecondary: () => void }) {
  return (
    <>
      <TopBar title={p.topTitle} onBack={p.onBack} right={p.exit} />
      <Body center>
        <Spacer />
        <div className="w-[260px] text-center"><Heading>{p.title}</Heading></div>
        <p className="f-r text-[13px] text-[#666] text-center w-[250px]">{p.text}</p>
        <Button onClick={p.onPrimary}>{p.primary}</Button>
        <Button variant="outline" onClick={p.onSecondary}>{p.secondary}</Button>
        <Spacer />
        <Foot>&nbsp;</Foot>
      </Body>
    </>
  );
}

export function MicDenied(p: Common & { onAllow: () => void; onNote: () => void }) {
  return <Failure topTitle="Voice note" exit={p.exit} onBack={p.onBack} title="Nura needs the microphone"
    text="Without it, voice notes cannot be recorded. You can still write a note or take a photo."
    primary="Allow microphone" secondary="Write a note instead" onPrimary={p.onAllow} onSecondary={p.onNote} />;
}

export function UploadFailed(p: Common & { kind: Kind; onRetry: () => void; onLater: () => void }) {
  const thing = p.kind === "Voice note" ? "recording" : p.kind === "Photo, 2 items" ? "photo" : "note";
  return <Failure topTitle={p.kind === "Photo, 2 items" ? "Photo or video" : p.kind} exit={p.exit} onBack={p.onBack} title="Not saved yet"
    text={`There is no connection. Your ${thing} is kept on this phone until it can be saved.`}
    primary="Try again" secondary="Keep it for later" onPrimary={p.onRetry} onSecondary={p.onLater} />;
}
