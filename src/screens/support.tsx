import { useState } from "react";
import type { ReactNode } from "react";
import { Body, Chevron, Chip, DangerCard, Label, ListItem, Switch, TopBar } from "../ui";

const SOON = "Not part of this test";

export function Resources({ exit, toast }: { exit: ReactNode; toast: (t: string) => void }) {
  const items = [
    { t: "Veilig Thuis", s: "Advice and reporting", c: "Call" },
    { t: "NEST / Lumens", s: "Support in Eindhoven", c: "Open" },
    { t: "Police", s: "Reporting abuse", c: "Open" },
    { t: "Your rights", s: "Plain-language guide", c: "Read" },
  ];
  return (
    <>
      <TopBar title="Resources" right={exit} />
      <Body>
        <DangerCard onCall={() => toast("Prototype: no call is made")} />
        {items.map((i) => <ListItem key={i.t} title={i.t} sub={i.s} trail={<Chip quiet>{i.c}</Chip>} onClick={() => toast(SOON)} />)}
      </Body>
    </>
  );
}

export function Settings({ exit, cover, toast }: { exit: ReactNode; cover: string; toast: (t: string) => void }) {
  const [shake, setShake] = useState(true);
  const [lock, setLock] = useState(true);
  const [notif, setNotif] = useState(false);
  const [backup, setBackup] = useState(false);
  const go = () => toast(SOON);
  return (
    <>
      <TopBar title="Settings" right={exit} />
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
