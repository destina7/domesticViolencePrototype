import { useState } from "react";
import { Body, Button, Card, Chevron, Chip, Label, ListItem, Placeholder, Spacer, TextLine, TopBar } from "../ui";
import { entrySub } from "../data";
import type { CaseEmptyDesign, Entry } from "../data";
import { CaptureButtons, EntryRow } from "./home";
import type { Capture } from "./home";

/** Case tab before anything is added. Three versions to compare, picked in the facilitator menu (Case, empty screen). */
function CaseEmpty({ design, onAdd, start }: { design: CaseEmptyDesign; onAdd: () => void; start: (c: Capture) => void }) {
  // B · Preview: the summary card and faint empty rows show where entries will go, so the tab explains itself.
  if (design === "preview") {
    return (
      <>
        <TopBar title="Your case" />
        <Body>
          <div data-t="card-strong" className="border-[#1a1a1a] border-[1.5px] flex flex-col gap-[4px] p-[12px] rounded-[16px] shrink-0">
            <Label>Your case</Label>
            <p className="f-b text-[16px]">0 entries</p>
            <p className="f-r text-[11px] text-[#666]">All will be locked and private.</p>
          </div>
          <Label>Whenever you're ready, what you save will show up here, newest first.</Label>
          {[1, 0.6, 0.3].map((o) => (
            // The outline of an entry row (square, title, date), so it reads as "entries go here".
            <div key={o} aria-hidden style={{ opacity: o }}
              className="border-[1.5px] border-dashed border-[#c7c7c7] rounded-[14px] h-[58px] shrink-0 flex items-center gap-[12px] px-[14px]">
              <span className="border-[1.5px] border-dashed border-[#c7c7c7] rounded-[6px] size-[20px] shrink-0" />
              <span className="flex flex-col gap-[6px]"><TextLine w={110} /><TextLine w={70} /></span>
            </div>
          ))}
          <Spacer />
          <Button onClick={onAdd}>Add the first entry</Button>
        </Body>
      </>
    );
  }
  // C · Add right here: why the record matters, then the same three buttons as Home, in the same low spot.
  if (design === "add") {
    return (
      <>
        <TopBar title="Case" />
        <Body>
          <Spacer />
          <p className="f-b text-[22px]">Start your record</p>
          <p className="f-r text-[13px] text-[#666] max-w-[280px]">Each entry gets a date and time and can't be changed later. Small things count too.</p>
          <Spacer />
          <CaptureButtons start={start} />
        </Body>
      </>
    );
  }
  // A · Current: illustration and one button that goes to Home.
  return (
    <>
      <TopBar title="Case" />
      <Body center>
        <Spacer />
        <Placeholder className="w-[140px] h-[110px]">soft illustration, no people</Placeholder>
        <p className="f-b text-[22px]">Your space is ready</p>
        <p className="f-r text-[13px] text-[#666] text-center w-[230px]">Whenever you're ready, what you save will show up here, newest first.</p>
        <Button onClick={onAdd}>Add the first entry</Button>
        <Spacer />
      </Body>
    </>
  );
}

export function Case({ entries, open, onAdd, start, empty }: {
  entries: Entry[]; open: (id: number) => void; onAdd: () => void; start: (c: Capture) => void; empty: CaseEmptyDesign;
}) {
  if (entries.length === 0) return <CaseEmpty design={empty} onAdd={onAdd} start={start} />;
  // Grouped by incident in order of first appearance; entries without an incident go last.
  const groups: [string | null, Entry[]][] = [];
  entries.forEach((e) => {
    const g = groups.find(([n]) => n === e.incident);
    if (g) g[1].push(e); else groups.push([e.incident, [e]]);
  });
  groups.sort((a, b) => Number(a[0] === null) - Number(b[0] === null));
  const incidents = new Set(entries.map((e) => e.incident).filter(Boolean)).size;
  return (
    <>
      <TopBar title="Your case" />
      <Body>
        <div data-t="card-strong" className="border-[#1a1a1a] border-[1.5px] flex flex-col gap-[4px] p-[12px] rounded-[16px] shrink-0">
          <Label>Your case</Label>
          <p className="f-b text-[16px]">{entries.length} entries · {incidents} incidents</p>
          <p className="f-r text-[11px] text-[#666]">Since 1 Oct · all locked and private</p>
        </div>
        {groups.map(([name, list]) => (
          <div key={name ?? "none"} className="flex flex-col gap-[10px]">
            <div className="flex items-baseline justify-between">
              <p className="f-s text-[12px]">{name ?? "Not linked yet"}</p>
              <p className="f-r text-[11px] text-[#666]">{list.length} {list.length === 1 ? "entry" : "entries"}</p>
            </div>
            {list.map((e) => <EntryRow key={e.id} e={e} lead onClick={() => open(e.id)} />)}
          </div>
        ))}
      </Body>
    </>
  );
}

export function EntryDetail({ entry, onBack }: { entry: Entry; onBack: () => void }) {
  const [proof, setProof] = useState(false);
  return (
    <>
      <TopBar title="Your case" onBack={onBack} />
      <Body>
        <div className="flex gap-[8px] items-center flex-wrap">
          <Chip>Saved</Chip>
          <p className="f-r text-[12px] text-[#666]">{entry.incident ?? "Not linked yet"} · {entrySub(entry)}</p>
        </div>
        {entry.kind === "Voice note" && (
          <>
            <div data-t="card" className="border-[#1a1a1a] border-[1.5px] flex items-center gap-[12px] p-[12px] rounded-[16px] shrink-0">
              <span className="border-[#1a1a1a] border-[1.5px] rounded-full size-[36px] flex items-center justify-center f-s text-[12px]">▶</span>
              <div className="bg-[#ebebeb] h-[5px] rounded-full flex-1" />
              <span className="f-r text-[11px] text-[#666]">3:12</span>
            </div>
            <Card>
              <Label>What was said</Label>
              <TextLine w={290} /><TextLine w={290} /><TextLine w={150} />
              <p className="f-r text-[12px] text-[#666]">Written automatically, so it may not be perfect.</p>
            </Card>
          </>
        )}
        {entry.kind === "Photo, 2 items" && <Placeholder className="h-[140px] w-full">Photo · 2 items</Placeholder>}
        {entry.kind === "Written note" && (
          <Card><Label>Your note</Label><TextLine w={290} /><TextLine w={260} /><TextLine w={180} /></Card>
        )}
        {proof ? (
          <>
            <Label>How this entry is protected</Label>
            <ListItem title="Recorded" sub={`${entry.day}, ${entry.time}:07`} />
            <ListItem title="Time confirmed by" sub="a trusted timestamp" />
            <ListItem title="Stored" sub="Encrypted, not changed since saving" />
          </>
        ) : (
          <ListItem lead="square" title="How this entry is protected" sub="Time, encryption, not changed since saving" trail={<Chevron />} onClick={() => setProof(true)} />
        )}
      </Body>
    </>
  );
}
