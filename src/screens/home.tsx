import { Body, Button, CheckMark, Chip, Label, ListItem, Spacer, TopBar } from "../ui";
import { entrySub } from "../data";
import type { Entry } from "../data";

type Capture = "note" | "voice" | "camera";

export function EntryRow({ e, sub, lead, onClick }: { e: Entry; sub?: string; lead?: boolean; onClick: () => void }) {
  return <ListItem lead={lead ? "square" : undefined} title={e.kind} sub={sub ?? entrySub(e)} trail={<Chip>Saved</Chip>} onClick={onClick} />;
}

function Empty() {
  return <p className="f-r text-[13px] text-[#666] py-[8px]">Nothing yet.</p>;
}

/** Status first, capture buttons in the lower half where the thumb reaches. */
export function Home({ entries, open, start }: { entries: Entry[]; open: (id: number) => void; start: (c: Capture) => void }) {
  const last = entries[0];
  return (
    <>
      <TopBar title="Home" />
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
        <Button size="mid" symbol="mic" onClick={() => start("voice")}>Record your voice</Button>
        <Button size="mid" symbol="photo_camera" onClick={() => start("camera")}>Take a photo or video</Button>
        <Button size="mid" symbol="edit_note" onClick={() => start("note")}>Write what happened</Button>
      </Body>
    </>
  );
}
