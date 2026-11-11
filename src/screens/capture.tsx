import { useEffect, useState } from "react";
import type { Kind } from "../data";
import { Body, Button, Card, CheckMark, Foot, Heading, Label, Placeholder, Spacer, TopBar, fmtTime, useTimer } from "../ui";

type Common = { onBack: () => void };

/* ---------- Written note ---------- */

export function Note({ onBack, onSave }: Common & { onSave: () => void }) {
  const [text, setText] = useState("");
  return (
    <>
      <TopBar title="Written note" onBack={onBack} />
      <Body>
        <Card strong>
          <Label>Date and time</Label>
          <p className="f-s text-[14px]">Tue 13 Oct, 21:14</p>
          <p className="f-r text-[12px] text-[#666]">Set automatically</p>
        </Card>
        <textarea data-t="field" value={text} onChange={(e) => setText(e.target.value)} placeholder="Write what happened, in your own words."
          className="border-[#c7c7c7] border-[1.5px] rounded-[16px] p-[14px] flex-1 min-h-[160px] f-r text-[14px] placeholder:text-[#666] outline-none focus:border-[#1a1a1a] resize-none" />
        <p className="f-r text-[12px] text-[#666]">Saved as you type. Nothing is sent until you choose.</p>
        <Button onClick={onSave}>Save note</Button>
      </Body>
    </>
  );
}

/* ---------- Voice note ---------- */

const BARS = [10, 18, 28, 20, 34, 44, 30, 40, 26, 36, 46, 32, 22, 38, 28, 16, 24, 12];

/** Starts recording as soon as the screen opens. Big Stop button saves it. */
export function Voice({ onBack, onDone, onMic }: Common & { onDone: (seconds: number) => void; onMic: (on: boolean) => void }) {
  const [paused, setPaused] = useState(false);
  const sec = useTimer(!paused);
  useEffect(() => { onMic(true); return () => onMic(false); }, []);

  return (
    <>
      <TopBar title="Voice note" onBack={onBack} />
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
        <Spacer />
        <div className="flex items-end justify-center gap-[44px] pb-[14px]">
          <button onClick={() => setPaused(!paused)} className="flex flex-col items-center gap-[4px]">
            {/* Material Symbols pause_circle / play_circle: the circle is part of the icon, so no border of our own.
                The size is set inline: the icon font's own 24 px rule beats Tailwind's text-[48px]. */}
            <span data-symbol aria-hidden style={{ fontSize: 48 }} className="material-symbols-outlined flex items-center justify-center size-[48px] leading-none text-[#1a1a1a]">
              {paused ? "play_circle" : "pause_circle"}
            </span>
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

/* ---------- Photo or video ---------- */

export function Camera({ onBack, onShutter }: Common & { onShutter: () => void }) {
  const [mode, setMode] = useState<"Photo" | "Video">("Photo");
  const modeBtn = (m: "Photo" | "Video") => (
    <button data-t="choice" onClick={() => setMode(m)}
      className={`border-[1.5px] rounded-[16px] w-[76px] h-[44px] f-s text-[14px] ${mode === m ? "border-[#1a1a1a]" : "border-[#c7c7c7] text-[#666]"}`}>{m}</button>
  );
  return (
    <>
      <TopBar title="Photo or video" onBack={onBack} />
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

/* ---------- Saved ---------- */

export function Saved({ onAnother, onDone }: { onAnother: () => void; onDone: () => void }) {
  return (
    <>
      <TopBar title="Saved" />
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
      <TopBar title={p.topTitle} onBack={p.onBack} />
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
  return <Failure topTitle="Voice note" onBack={p.onBack} title="Nura needs the microphone"
    text="Without it, voice notes cannot be recorded. You can still write a note or take a photo."
    primary="Allow microphone" secondary="Write a note instead" onPrimary={p.onAllow} onSecondary={p.onNote} />;
}

export function UploadFailed(p: Common & { kind: Kind; onRetry: () => void; onLater: () => void }) {
  const thing = p.kind === "Voice note" ? "recording" : p.kind === "Photo, 2 items" ? "photo" : "note";
  return <Failure topTitle={p.kind === "Photo, 2 items" ? "Photo or video" : p.kind} onBack={p.onBack} title="Not saved yet"
    text={`There is no connection. Your ${thing} is kept on this phone until it can be saved.`}
    primary="Try again" secondary="Keep it for later" onPrimary={p.onRetry} onSecondary={p.onLater} />;
}
