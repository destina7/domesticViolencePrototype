import type { ReactNode } from "react";
import { Body, Button, CheckMark, Chip, Label, ListItem, Spacer, TopBar } from "../ui";
import { entrySub } from "../data";
import type { Entry } from "../data";

type Capture = "note" | "voice" | "camera";
type Common = { entries: Entry[]; exit: ReactNode; open: (id: number) => void };

export function EntryRow({ e, sub, lead, onClick }: { e: Entry; sub?: string; lead?: boolean; onClick: () => void }) {
  return <ListItem lead={lead ? "square" : undefined} title={e.kind} sub={sub ?? entrySub(e)} trail={<Chip>Saved</Chip>} onClick={onClick} />;
}

function Empty() {
  return <p className="f-r text-[13px] text-[#666] py-[8px]">Nothing yet.</p>;
}

/** Option A: capture buttons first, recent entries below. */
export function HomeA({ entries, exit, open, start }: Common & { start: (c: Capture) => void }) {
  return (
    <>
      <TopBar title="Home" right={exit} />
      <Body>
        <Label>Add to your record</Label>
        <Button size="tall" icon="square" onClick={() => start("note")}>Write a note</Button>
        <Button size="tall" icon="round" onClick={() => start("voice")}>Record your voice</Button>
        <Button size="tall" icon="square" onClick={() => start("camera")}>Take a photo or video</Button>
        <Label>Recent</Label>
        {entries.length === 0 && <Empty />}
        {entries.slice(0, 2).map((e) => <EntryRow key={e.id} e={e} onClick={() => open(e.id)} />)}
      </Body>
    </>
  );
}

/** Option B: the record grouped by day with one "Add entry" button that opens a sheet. */
export function HomeB({ entries, exit, open, onAdd }: Common & { onAdd: () => void }) {
  const groups: [string, Entry[]][] = [];
  entries.forEach((e) => {
    const g = groups.find(([d]) => d === e.day);
    if (g) g[1].push(e); else groups.push([e.day, [e]]);
  });
  return (
    <>
      <TopBar title="Home" right={exit} />
      <Body>
        <Label>Your record</Label>
        {entries.length === 0 && <Empty />}
        {groups.map(([day, list]) => (
          <div key={day} className="flex flex-col gap-[12px]">
            <Label>{day}</Label>
            {list.map((e) => <EntryRow key={e.id} e={e} sub={`${e.time}${e.extra ? ` · ${e.extra}` : ""}`} onClick={() => open(e.id)} />)}
          </div>
        ))}
        <Spacer />
        <Button onClick={onAdd}>Add entry</Button>
      </Body>
    </>
  );
}

/** Option C: status first, capture buttons in the lower half where the thumb reaches. */
export function HomeC({ entries, exit, open, start }: Common & { start: (c: Capture) => void }) {
  const last = entries[0];
  return (
    <>
      <TopBar title="Home" right={exit} />
      <Body>
        <div data-t="card-strong" className="border-[#1a1a1a] border-[1.5px] flex gap-[12px] items-center p-[14px] rounded-[16px] shrink-0">
          <CheckMark size={36} />
          <div className="flex flex-col gap-[2px]">
            <p className="f-s text-[15px]">Everything is saved</p>
            <p className="f-r text-[12px] text-[#666]">{entries.length} entries{last ? ` · last one ${last.day === "Today" || last.day === "Yesterday" ? last.day.toLowerCase() : last.day} ${last.time}` : ""}</p>
          </div>
        </div>
        <Label>Recent</Label>
        {entries.length === 0 && <Empty />}
        {entries.slice(0, 2).map((e) => <EntryRow key={e.id} e={e} lead onClick={() => open(e.id)} />)}
        <Spacer />
        <Label>Add to your record</Label>
        <Button size="mid" icon="round" onClick={() => start("voice")}>Record your voice</Button>
        <Button size="mid" icon="square" onClick={() => start("camera")}>Take a photo or video</Button>
        <Button size="mid" icon="square" onClick={() => start("note")}>Write what happened</Button>
      </Body>
    </>
  );
}

/** Bottom sheet used by Home option B. */
export function AddSheet({ onClose, start, keepNav }: { onClose: () => void; start: (c: Capture) => void; keepNav?: boolean }) {
  // The dimmed layer starts below the top bar and, when the quick exit lives in the nav bar, stops above it,
  // so quick exit stays reachable while the sheet is open.
  return (
    <div className={`absolute inset-x-0 top-[56px] sm:top-[84px] z-30 flex flex-col justify-end ${keepNav ? "bottom-[66px]" : "bottom-0"}`}>
      <button aria-label="Close" onClick={onClose} className="absolute inset-0 bg-[rgba(26,26,26,0.35)]" />
      <div className="relative bg-white border-t-2 border-[#1a1a1a] rounded-t-[24px] flex flex-col gap-[10px] items-center px-[18px] pt-[18px] pb-[18px] w-full max-w-[560px] mx-auto">
        <div className="bg-[#c7c7c7] h-[4px] w-[36px] rounded-[2px]" />
        <p className="f-s text-[16px]">What do you want to add?</p>
        <Button variant="outline" icon="square" onClick={() => start("note")}>Write a note</Button>
        <Button variant="outline" icon="round" onClick={() => start("voice")}>Record your voice</Button>
        <Button variant="outline" icon="square" onClick={() => start("camera")}>Take a photo or video</Button>
      </div>
    </div>
  );
}
