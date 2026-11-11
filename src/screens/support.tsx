import { useState } from "react";
import { Body, Button, Chevron, Chip, DangerCard, Label, ListItem, Switch, TextLine, TopBar } from "../ui";
import type { ResourceDesign } from "../data";

const SOON = "Not part of this test";

type Place = { t: string; s: string; c: string; kind: string };

// `kind` is the heading the place sits under in option A, in this order.
const PLACES: Place[] = [
  { t: "Veilig Thuis", s: "Advice and reporting", c: "Call", kind: "Mental help" },
  { t: "NEST / Lumens", s: "Support in Eindhoven", c: "Open", kind: "Mental help" },
  { t: "Police", s: "Reporting abuse", c: "Open", kind: "Legal help" },
  { t: "Your rights", s: "Plain-language guide", c: "Read", kind: "Legal help" },
];

/** Option B: tapping the card opens it. The chevron points down when closed and up when open. */
function ExpandRow({ place, open, onToggle, onAction }: { place: Place; open: boolean; onToggle: () => void; onAction: () => void }) {
  return (
    // data-open lets Material 3 show the open card as an elevated card (index.css). Elsewhere the dark border marks it.
    <div data-t="row" data-open={open || undefined} className={`border-[1.5px] flex flex-col rounded-[14px] w-full shrink-0 transition-colors ${open ? "border-[#1a1a1a]" : "border-[#c7c7c7]"}`}>
      <button aria-expanded={open} onClick={onToggle}
        className="flex gap-[12px] items-center min-h-[58px] px-[14px] py-[8px] w-full text-left cursor-pointer">
        <span className="flex flex-1 flex-col gap-[2px] min-w-0">
          <span className="f-s text-[14px] text-[#1a1a1a]">{place.t}</span>
          <span className="f-r text-[12px] text-[#666]">{place.s}</span>
        </span>
        {/* Hidden once open: the button inside the card does the same thing. */}
        {!open && <Chip quiet>{place.c}</Chip>}
        <span className={`flex transition-transform ${open ? "-rotate-90" : "rotate-90"}`}><Chevron /></span>
      </button>
      {open && (
        // Placeholder lines for the explanation, the same as on the setup screen. Real text comes later.
        <div className="flex flex-col gap-[8px] px-[14px] pb-[14px]">
          <TextLine w={260} /><TextLine w={230} /><TextLine w={150} />
          <div className="h-[4px]" />
          <Button variant="outline" size="normal" onClick={onAction}>{place.c}</Button>
        </div>
      )}
    </div>
  );
}

export function Resources({ design, toast }: { design: ResourceDesign; toast: (t: string) => void }) {
  const kinds = [...new Set(PLACES.map((p) => p.kind))];
  // Only one card is open at a time: opening another closes the one that was open. Tapping the open one closes it.
  const [openPlace, setOpenPlace] = useState<string | null>(null);
  return (
    <>
      <TopBar title="Resources" />
      <Body>
        <DangerCard onCall={() => toast("Prototype: no call is made")} />
        {design === "grouped"
          // Option A: a heading per kind of help, like the Settings page.
          ? kinds.map((k) => (
              <div key={k} className="contents">
                <Label>{k}</Label>
                {PLACES.filter((p) => p.kind === k).map((p) => (
                  <ListItem key={p.t} title={p.t} sub={p.s} trail={<Chip quiet>{p.c}</Chip>} onClick={() => toast(SOON)} />
                ))}
              </div>
            ))
          : PLACES.map((p) => (
              <ExpandRow key={p.t} place={p} open={openPlace === p.t}
                onToggle={() => setOpenPlace(openPlace === p.t ? null : p.t)} onAction={() => toast(SOON)} />
            ))}
      </Body>
    </>
  );
}

export function Settings({ cover, toast }: { cover: string; toast: (t: string) => void }) {
  const [shake, setShake] = useState(true);
  const [lock, setLock] = useState(true);
  const [notif, setNotif] = useState(false);
  const [backup, setBackup] = useState(false);
  const go = () => toast(SOON);
  return (
    <>
      <TopBar title="Settings" />
      <Body>
        <Label>Disguise</Label>
        <ListItem title="Cover app" sub={cover} trail={<Chevron />} onClick={go} />
        <ListItem title="Way in" sub="Hold the ring + PIN · practise again" trail={<Chevron />} onClick={go} />
        <Label>Pins</Label>
        <ListItem title="Change your PIN" trail={<Chevron />} onClick={go} />
        <ListItem title="Panic PIN & cover app" sub="Edit the fake entries" trail={<Chevron />} onClick={go} />
        <Label>Quick exit</Label>
        <ListItem title="Shake to hide" trail={<Switch on={shake} onChange={setShake} />} />
        <ListItem title="Lock when I leave" trail={<Switch on={lock} onChange={setLock} />} />
        <ListItem title="Notifications" sub={notif ? "On, no content shown" : "Off, nothing shows"} trail={<Switch on={notif} onChange={setNotif} />} />
        <Label>Backup</Label>
        <ListItem title="Safe email backup" sub="Optional" trail={<Switch on={backup} onChange={setBackup} />} />
      </Body>
    </>
  );
}
