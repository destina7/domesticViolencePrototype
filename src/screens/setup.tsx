import { useState } from "react";
import type { ReactNode } from "react";
import { Body, Button, Card, Chip, DangerCard, Dock, Foot, Heading, Label, ListItem, Spacer, TextLine, TopBar } from "../ui";
import { COVERS } from "../data";
import { HoldIconArt } from "./illustrations";

// Setup screens only collect choices for the test. Nothing is saved or applied.

/** First screen of setup. Emergency help comes before anything else; the warning about being found is on the next screen. */
export function Welcome({ onContinue, toast }: { onContinue: () => void; toast: (t: string) => void }) {
  return (
    <>
      <TopBar title="Nura" />
      <Body>
        <Heading>A private space, just for you</Heading>
        <Card strong>
          <p className="f-s text-[14px]">About us</p>
          <p className="f-r text-[13px] text-[#666]">Nura helps you keep a safe record of what happens to you, with notes, voice notes and photos. Only you can see it, and you decide if you ever share it.</p>        </Card>
        <DangerCard title="Are you in danger right now?" onCall={() => toast("Prototype: no call is made")} />
      </Body>
      {/* Same place as Continue on the next screen, so the button does not jump between steps. */}
      <Dock>
        <Button onClick={onContinue}>Let's set it up</Button>
        <Foot>Setup screen for this device</Foot>
      </Dock>
    </>
  );
}

export function CoverChoice({ cover, setCover, onContinue }: { cover: string; setCover: (c: string) => void; onContinue: () => void }) {
  return (
    <>
      <TopBar title="Nura" />
      <Body fade>
        <Heading>Choose your disguise</Heading>
        <Card strong>
          <p className="f-s text-[14px]">Someone checking your phone could find this app. Let's make Nura look like an everyday app.</p>
          <p className="f-r text-[12px] text-[#999]">Anyone who opens it will only see this cover.</p>
        </Card>
        <Label>Choose how Nura looks on your phone</Label>
        {COVERS.map((c) => (
          <ListItem key={c.name} lead="round" title={c.name} sub={c.sub} selected={cover === c.name}
            onClick={() => setCover(c.name)} trail={cover === c.name ? <Chip>Chosen</Chip> : undefined} />
        ))}
      </Body>
      {/* Continue stays in reach however long the list of cover apps gets. */}
      <Dock>
        <Button onClick={onContinue}>Continue</Button>
        <Foot>You can change this later in Settings.</Foot>
      </Dock>
    </>
  );
}

/**
 * One way in, as a Material 3 outlined card: no fill, 1 px outline, 12 px corners, no shadow.
 * The top 80% is media (a grey placeholder for an image or animation of the gesture), edge to edge like M3 card media.
 * The text and a small outlined Try now button sit along the bottom with M3's 16 px padding.
 * Try now runs whatever the screen passes in; a tried card gets a darker outline.
 */
function WayCard({ text, on, onTry, media }: { text: string; on: boolean; onTry: () => void; media?: ReactNode }) {
  return (
    <div data-t="way-card" className={`flex-1 grid grid-rows-[4fr_1fr] min-h-[220px] bg-transparent rounded-[12px] border overflow-hidden transition-colors ${on ? "border-[#1a1a1a]" : "border-[#c7c7c7]"}`}>
      {/* 4fr / 1fr rows: the media takes exactly 80% of the card, whatever its height. */}
      {/* The illustration sits absolutely inside, so it scales to fit the media area instead of stretching the card. */}
      <div className="relative min-h-0 bg-[#ebebeb] flex items-center justify-center f-m text-[12px] text-[#999]">
        {media ? <div className="absolute inset-0 p-[10px] flex items-center justify-center">{media}</div> : "Add content"}
      </div>
      <div className="flex items-center gap-[12px] px-[16px] py-[8px]">
        <p className="flex-1 min-w-0 f-r text-[13px] leading-[18px] text-[#1a1a1a]">{text}</p>
        {/* M3 outlined button, small: 32 px tall, full pill, 1 px outline, medium-weight label. */}
        <button onClick={onTry} className="shrink-0 h-[32px] px-[14px] rounded-full border border-[#767676] f-m text-[13px] text-[#1a1a1a] hover:bg-[#f2f2f2]">Try now</button>
      </div>
    </div>
  );
}

/** `onTryHold` opens the real loading screen to practise card 2; `holdTried` marks that card once they have been there. */
export function WayIn({ cover, onContinue, onTryHold, holdTried }: { cover: string; onContinue: () => void; onTryHold: () => void; holdTried: boolean }) {
  // Card 1 has no practice screen yet, so its Try now only marks the card.
  const [gesture, setGesture] = useState(false);
  // The texts name the cover app chosen on the previous screen (Bloom unless another was picked).
  return (
    <>
      <TopBar title="Nura" />
      <Body fade>
        <Heading>Your private way in</Heading>
        {/* The two cards share the space left on the screen, one above the other. */}
        <div className="flex-1 flex flex-col gap-[10px]">
          <WayCard text={`Press and hold the progress bar in ${cover} for 3 seconds`} on={gesture} onTry={() => setGesture(true)} />
          <WayCard text={`Press and hold the ${cover} icon in the loading screen for 3 seconds`} on={holdTried} onTry={onTryHold} media={<HoldIconArt cover={cover} />} />
        </div>
      </Body>
      <Dock>
        <Button onClick={onContinue}>Continue</Button>
        <Foot>You can change this later in Settings.</Foot>
      </Dock>
    </>
  );
}

function Field({ label, value, onChange, type = "text", placeholder }: { label: string; value: string; onChange: (v: string) => void; type?: string; placeholder: string }) {
  return (
    <label data-t="field" className="border-[#1a1a1a] border-[1.5px] flex flex-col gap-[2px] justify-center min-h-[54px] px-[14px] py-[8px] rounded-[14px] w-full focus-within:shadow-[0_0_0_2px_#1a1a1a]">
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
        <Heading>Welcome back</Heading>
        <Field label="Email" value={email} onChange={setEmail} placeholder="name@example.com" />
        <Field label="Password" type="password" value={pw} onChange={(v) => { setPw(v); setError(false); }} placeholder="••••••••" />
        {error && (
          <div data-t="card-strong" className="border-[#1a1a1a] border-[1.5px] flex flex-col gap-[6px] p-[12px] rounded-[16px]">
            <p className="f-s text-[14px]">That password does not match.</p>
            <p className="f-r text-[12px] text-[#666]">Check it and try again.</p>
          </div>
        )}
        <Button onClick={submit}>Sign in</Button>
        {!error && <Button variant="secondary" onClick={onSignIn}>New here? Create an account</Button>}
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
