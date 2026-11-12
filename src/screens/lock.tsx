import { useEffect, useState } from "react";
import { Button, Card, Heading, Label, Spacer } from "../ui";

// What someone sees when they open the app. These screens must never say "Nura": to anyone holding the phone
// they are the cover app (Bloom by default). Chosen in the hidden menu → Lock screen version.

const REAL_PIN = "1234";

/** The cover app's logo: a wireframe app icon with a ring in it. */
function CoverLogo({ size = 72 }: { size?: number }) {
  return (
    <span aria-hidden className="border-[#1a1a1a] border-2 flex items-center justify-center shrink-0"
      style={{ width: size, height: size, borderRadius: size * 0.28 }}>
      <span className="border-[#1a1a1a] border-2 rounded-full" style={{ width: size * 0.45, height: size * 0.45 }} />
    </span>
  );
}

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "del"];

/**
 * A · Padlock. The cover app asks for a passcode, like any app with a lock.
 * 1234 opens Nura. Any other 4 digits open the cover app, so a wrong or panic PIN looks like it simply worked.
 * Has its own number pad, so the phone keyboard never covers it. On a laptop the number keys and Backspace work too.
 */
export function Padlock({ cover, onUnlock, onCover }: { cover: string; onUnlock: () => void; onCover: () => void }) {
  const [pin, setPin] = useState("");
  const press = (k: string) => {
    if (k === "del") setPin((p) => p.slice(0, -1));
    else if (k) setPin((p) => (p.length < 4 ? p + k : p));
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof Element && e.target.closest("[data-facilitator]")) return;
      if (/^[0-9]$/.test(e.key)) press(e.key);
      if (e.key === "Backspace") press("del");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // A short pause so the 4th dot is seen filling before the app opens.
  useEffect(() => {
    if (pin.length < 4) return;
    const t = window.setTimeout(() => (pin === REAL_PIN ? onUnlock() : onCover()), 350);
    return () => window.clearTimeout(t);
  }, [pin]);

  return (
    <main className="flex flex-1 flex-col items-center min-h-0 px-[24px] pt-[40px] pb-[28px] w-full max-w-[560px] mx-auto">
      <CoverLogo size={56} />
      <p className="f-b text-[20px] text-[#1a1a1a] mt-[14px]">{cover}</p>
      <p className="f-r text-[13px] text-[#666] mt-[4px]">Enter passcode</p>
      <div className="flex gap-[20px] mt-[24px]" aria-label={`${pin.length} of 4 digits entered`}>
        {[0, 1, 2, 3].map((i) => (
          <span key={i} className={`rounded-full size-[14px] border-2 border-[#1a1a1a] transition-colors ${pin[i] ? "bg-[#1a1a1a]" : ""}`} />
        ))}
      </div>
      <Spacer />
      <div className="grid grid-cols-3 gap-x-[24px] gap-y-[14px]">
        {KEYS.map((k, i) =>
          k === "" ? <span key={i} /> : (
            <button key={i} onClick={() => press(k)} aria-label={k === "del" ? "Delete" : k}
              className={`size-[68px] rounded-full flex items-center justify-center text-[#1a1a1a] active:scale-95 transition-transform ${k === "del" ? "hover:bg-[#f5f5f5]" : "border-[1.5px] border-[#c7c7c7] hover:bg-[#f5f5f5] f-m text-[26px]"}`}>
              {k === "del"
                ? <span data-symbol aria-hidden style={{ fontSize: 26 }} className="material-symbols-outlined leading-none">backspace</span>
                : k}
            </button>
          ),
        )}
      </div>
    </main>
  );
}

const LOAD_MS = 5000;

/**
 * B · Fake loading. The cover app's splash screen with a loading bar. When it fills (5 s) the cover app opens.
 * There is no secret way into Nura from here yet.
 */
export function FakeLoading({ cover, onDone }: { cover: string; onDone: () => void }) {
  const [started, setStarted] = useState(false);
  useEffect(() => {
    // Start the bar on the next frame so the width transition runs from 0.
    const raf = window.requestAnimationFrame(() => setStarted(true));
    const t = window.setTimeout(onDone, LOAD_MS);
    return () => { window.cancelAnimationFrame(raf); window.clearTimeout(t); };
  }, []);
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-[14px] min-h-0 px-[24px] w-full max-w-[560px] mx-auto">
      <div className="flex-[2]" />
      <CoverLogo size={88} />
      <p className="f-b text-[22px] text-[#1a1a1a]">{cover}</p>
      <div className="flex-[3]" />
      <div className="w-[180px] h-[6px] rounded-full bg-[#ebebeb] overflow-hidden" role="progressbar" aria-label="Loading">
        {/* Eases out, so it feels like a real app: quick at first, slower near the end. */}
        <div className="h-full rounded-full bg-[#1a1a1a]"
          style={{ width: started ? "100%" : "0%", transition: `width ${LOAD_MS}ms cubic-bezier(0.25, 0.6, 0.35, 1)` }} />
      </div>
      <p className="f-r text-[12px] text-[#666] mb-[40px]">Loading…</p>
    </main>
  );
}

/** Stand-in for the cover app itself. Not part of this test. */
export function CoverApp({ cover, onBack }: { cover: string; onBack: () => void }) {
  return (
    <div className="flex-1 bg-[#ebebeb] flex flex-col items-center justify-center gap-[12px] p-[20px]">
      <Card strong>
        <Label>Cover app · {cover}</Label>
        <Heading>Not yet implemented</Heading>
        <p className="f-r text-[13px] text-[#666]">
          In the finished app this is {cover}, the cover app. That part is not included in this test.
        </p>
      </Card>
      <Spacer />
      <Button onClick={onBack}>Back to Nura</Button>
    </div>
  );
}
