import { useLayoutEffect, useRef, useState } from "react";
import { Body, Chevron, Chip, DangerCard, Label, ListItem, Switch, TextLine, TopBar } from "../ui";
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

type Box = { top: number; left: number; width: number; height: number };
const boxOf = (el: HTMLElement): Box => ({ top: el.offsetTop, left: el.offsetLeft, width: el.offsetWidth, height: el.offsetHeight });
const sameBox = (a: Box, b: Box) => a.top === b.top && a.left === b.left && a.width === b.width && a.height === b.height;

// One speed for everything that moves when a card opens or closes, so it all lands together.
const EASE = "duration-300 ease-out motion-reduce:transition-none";

/**
 * Option B: tapping the card opens it. The chevron points down when closed and up when open.
 * Opening animates in two ways:
 * - The body grows from 0 to its full height (grid rows 0fr → 1fr), so the cards below slide down instead of jumping.
 * - The Call / Open / Read pill becomes the big button: it is one element that moves and resizes between two invisible
 *   spots, the pill's spot in the top row and the button's spot at the bottom of the body.
 */
function ExpandRow({ place, open, onToggle, onAction }: { place: Place; open: boolean; onToggle: () => void; onAction: () => void }) {
  const card = useRef<HTMLDivElement>(null);
  const pillSpot = useRef<HTMLSpanElement>(null);
  const buttonSpot = useRef<HTMLDivElement>(null);
  const [spots, setSpots] = useState<{ pill: Box; button: Box } | null>(null);

  // Measure both spots, and again whenever the card, its top row or a spot changes size (phone width, fonts loading,
  // switching design system: a new font resizes the pill without resizing the card).
  useLayoutEffect(() => {
    const measure = () => {
      if (!pillSpot.current || !buttonSpot.current) return;
      const next = { pill: boxOf(pillSpot.current), button: boxOf(buttonSpot.current) };
      setSpots((prev) => (prev && sameBox(prev.pill, next.pill) && sameBox(prev.button, next.button) ? prev : next));
    };
    measure();
    const ro = new ResizeObserver(measure);
    [card.current, card.current?.firstElementChild, pillSpot.current, buttonSpot.current].forEach((el) => el && ro.observe(el));
    document.fonts?.ready.then(measure);
    return () => ro.disconnect();
  }, []);

  const box = spots ? (open ? spots.button : spots.pill) : null;
  return (
    // data-open lets Material 3 show the open card as an elevated card (index.css). Elsewhere the dark border marks it.
    <div ref={card} data-t="row" data-open={open || undefined}
      className={`relative border-[1.5px] flex flex-col rounded-[14px] w-full shrink-0 transition-[background-color,border-color,box-shadow] ${EASE} ${open ? "border-[#1a1a1a]" : "border-[#c7c7c7]"}`}>
      <button aria-expanded={open} onClick={onToggle}
        className="flex gap-[12px] items-center min-h-[58px] px-[14px] py-[8px] w-full text-left cursor-pointer">
        <span className="flex flex-1 flex-col gap-[2px] min-w-0">
          <span className="f-s text-[14px] text-[#1a1a1a]">{place.t}</span>
          <span className="f-r text-[12px] text-[#666]">{place.s}</span>
        </span>
        {/* Invisible: keeps the pill's room in the row and tells the moving button where the pill sits. */}
        <span ref={pillSpot} aria-hidden className="invisible flex shrink-0"><Chip quiet>{place.c}</Chip></span>
        <span className={`flex transition-transform ${EASE} ${open ? "-rotate-90" : "rotate-90"}`}><Chevron /></span>
      </button>

      <div className={`grid transition-[grid-template-rows] ${EASE} ${open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
        <div className="min-h-0 overflow-hidden">
          {/* Placeholder lines for the explanation, the same as on the setup screen. Real text comes later. */}
          <div className={`flex flex-col gap-[8px] px-[14px] pb-[14px] transition-opacity ${EASE} ${open ? "opacity-100" : "opacity-0"}`}>
            <TextLine w={260} /><TextLine w={230} /><TextLine w={150} />
            <div className="h-[4px]" />
            <div ref={buttonSpot} className="h-[52px] w-full" />
          </div>
        </div>
      </div>

      {/* The pill that becomes the button. Closed it is a quiet chip (tapping it opens the card); open it is the outline button. */}
      <button type="button" onClick={open ? onAction : onToggle} tabIndex={open ? 0 : -1} aria-hidden={!open || undefined}
        data-t={open ? "btn-outline" : "chip-quiet"}
        style={box ? { top: box.top, left: box.left, width: box.width, height: box.height } : { visibility: "hidden" }}
        className={`absolute flex items-center justify-center whitespace-nowrap overflow-hidden transition-all ${EASE} ${open
          ? "border-2 rounded-[16px] border-[#1a1a1a] text-[#1a1a1a] f-s text-[15px] hover:bg-[#f5f5f5]"
          : "border-[1.5px] rounded-[12px] border-[#c7c7c7] text-[#666] f-m text-[12px]"}`}>
        {place.c}
      </button>
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
