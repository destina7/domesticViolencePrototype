import { useState } from "react";
import { Body, Button, Card, Chip, Foot, Heading, Label, ListItem, Spacer, TextLine, TopBar } from "../ui";
import { COVERS } from "../data";

// Setup screens only collect choices for the test. Nothing is saved or applied.

export function Warning({ onContinue }: { onContinue: () => void }) {
  return (
    <>
      <TopBar title="Nura" />
      <Body>
        <div className="h-[8px]" />
        <Heading>Before you start</Heading>
        <Card strong>
          <p className="f-s text-[14px]">Someone who checks your phone could find this app.</p>
          <TextLine w={290} /><TextLine w={230} />
        </Card>
        <Card>
          <p className="f-s text-[14px]">In danger right now?</p>
          <p className="f-r text-[12px] text-[#999]">Call 112. No setup needed.</p>
        </Card>
        <Spacer />
        <Button onClick={onContinue}>Continue</Button>
        <Foot>Setup screen for this device</Foot>
      </Body>
    </>
  );
}

export function CoverChoice({ cover, setCover, onContinue }: { cover: string; setCover: (c: string) => void; onContinue: () => void }) {
  return (
    <>
      <TopBar title="Nura" />
      <Body>
        <div className="h-[8px]" />
        <Heading>Before you start</Heading>
        <Card strong>
          <p className="f-s text-[14px]">To help us protect you, choose a cover app.</p>
          <p className="f-r text-[12px] text-[#999]">This is what everyone sees when they open the app</p>
        </Card>
        <Label>Choose how Nura looks on your phone</Label>
        {COVERS.map((c) => (
          <ListItem key={c.name} lead="round" title={c.name} sub={c.sub} selected={cover === c.name}
            onClick={() => setCover(c.name)} trail={cover === c.name ? <Chip>Chosen</Chip> : undefined} />
        ))}
        <Spacer />
        <Button onClick={onContinue}>Continue</Button>
        <Foot>You can change this later in Settings.</Foot>
      </Body>
    </>
  );
}

function PinField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <label className="relative flex items-center gap-[12px] h-[48px] px-[16px] rounded-[14px] border-[1.5px] border-[#c7c7c7] focus-within:border-[#1a1a1a] cursor-text">
      {[0, 1, 2, 3].map((i) => (
        <span key={i} className={`rounded-full size-[13px] border-[1.5px] border-[#1a1a1a] ${value[i] ? "bg-[#1a1a1a]" : ""}`} />
      ))}
      <input inputMode="numeric" maxLength={4} value={value} aria-label="PIN"
        onChange={(e) => onChange(e.target.value.replace(/\D/g, "").slice(0, 4))}
        className="absolute inset-0 opacity-0 cursor-text" />
    </label>
  );
}

function WayCard({ n, text, on, onClick }: { n: number; text: string; on: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} aria-pressed={on}
      className={`flex-1 flex flex-col gap-[10px] items-start text-left p-[12px] rounded-[14px] border-[1.5px] min-h-[84px] transition-colors ${on ? "border-[#1a1a1a]" : "border-[#c7c7c7] hover:bg-[#f7f7f7]"}`}>
      <span className={`size-[20px] rounded-full border-[1.5px] border-[#1a1a1a] flex items-center justify-center f-s text-[11px] ${on ? "bg-[#1a1a1a] text-white" : ""}`}>{n}</span>
      <span className="f-s text-[12px] leading-snug">{text}</span>
    </button>
  );
}

export function WayIn({ onContinue }: { onContinue: () => void }) {
  const [gesture, setGesture] = useState(false);
  const [pin, setPin] = useState(false);
  const [mine, setMine] = useState("1234");
  const [panic, setPanic] = useState("123");
  return (
    <>
      <TopBar title="Nura" />
      <Body>
        <div className="h-[8px]" />
        <Heading>Your way in</Heading>
        <div className="flex gap-[10px]">
          <WayCard n={1} text="Hold the ring in the cover for 2 sec" on={gesture} onClick={() => setGesture(!gesture)} />
          <WayCard n={2} text="Type your PIN" on={pin} onClick={() => setPin(!pin)} />
        </div>
        <p className="f-s text-[12px] mt-[4px]">Your PIN · opens the real app</p>
        <PinField value={mine} onChange={setMine} />
        <p className="f-s text-[12px] mt-[4px]">Panic PIN · opens the cover app</p>
        <PinField value={panic} onChange={setPanic} />
        <Spacer />
        <Button onClick={onContinue}>Continue</Button>
        <Foot>You can change this later in Settings.</Foot>
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

/** Any input signs in. `failOnce` shows the wrong-password message the first time (set from the hidden menu). */
export function SignIn({ onSignIn, failOnce, onFailed }: { onSignIn: () => void; failOnce: boolean; onFailed: () => void }) {
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [error, setError] = useState(false);
  const submit = () => {
    if (failOnce) { setError(true); onFailed(); } else onSignIn();
  };
  return (
    <>
      <TopBar title="Nura" />
      <Body>
        <div className="h-[8px]" />
        <Heading>Sign in</Heading>
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
        {!error && (
          <Card strong>
            <p className="f-s text-[13px]">What Nura stores</p>
            <TextLine w={290} /><TextLine w={200} />
          </Card>
        )}
      </Body>
    </>
  );
}
