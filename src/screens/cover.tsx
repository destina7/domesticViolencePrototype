import { useState } from "react";
import { BottomNav, Body, Label, TopBar } from "../ui";

// The cover app: what anyone sees after quick exit, or when they open the app without the way in.
// It must never say "Nura".

type Habit = { name: string; done: boolean };

const HABITS: Habit[] = [
  { name: "Morning meditation", done: true },
  { name: "Drink 8 glasses of water", done: true },
  { name: "30 min walk", done: true },
  { name: "Read 20 pages", done: true },
  { name: "Evening journal", done: false },
  { name: "Stretch routine", done: false },
];

const TABS = ["Home", "Insights", "Journal", "Settings"];

// Circular progress: radius 28 in a 72 px box, so its length is 2πr.
const RING_R = 28;
const RING_LEN = 2 * Math.PI * RING_R;

/** M3 circular progress indicator: a light track with the done part drawn over it, the count in the middle. */
function ProgressRing({ done, total }: { done: number; total: number }) {
  return (
    <span className="relative size-[72px] shrink-0 flex items-center justify-center" role="img" aria-label={`${done} of ${total} habits done`}>
      <svg aria-hidden viewBox="0 0 72 72" className="absolute inset-0 size-full -rotate-90">
        <circle cx="36" cy="36" r={RING_R} fill="none" stroke="currentColor" strokeWidth="6" className="text-[#ebebeb]" />
        <circle cx="36" cy="36" r={RING_R} fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round"
          strokeDasharray={RING_LEN} strokeDashoffset={RING_LEN * (1 - done / total)}
          className="text-[#1a1a1a] transition-[stroke-dashoffset] duration-300 ease-out motion-reduce:transition-none" />
      </svg>
      <span className="f-b text-[17px] text-[#1a1a1a] tabular-nums">{done}/{total}</span>
    </span>
  );
}

/** One habit: a checkbox, the name, and a "Done" chip once it is ticked. Tapping anywhere on the row ticks it. */
function HabitRow({ habit, onToggle }: { habit: Habit; onToggle: () => void }) {
  return (
    // data-filled: an M3 filled card instead of the outlined rows used elsewhere (index.css).
    <div data-t="row" data-filled role="checkbox" aria-checked={habit.done} tabIndex={0} onClick={onToggle}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), onToggle())}
      className="bg-[#f5f5f5] border-[1.5px] border-transparent flex gap-[12px] items-center min-h-[58px] px-[14px] py-[8px] rounded-[14px] w-full shrink-0 text-left cursor-pointer hover:bg-[#ebebeb] transition-colors">
      <span data-t="checkbox" data-on={habit.done || undefined} aria-hidden
        className={`border-2 border-[#1a1a1a] rounded-[4px] size-[20px] shrink-0 flex items-center justify-center ${habit.done ? "bg-[#1a1a1a]" : "bg-white"}`}>
        {habit.done && (
          <svg viewBox="0 0 24 24" className="size-[16px]" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12.5l4.5 4.5L19 7.5" />
          </svg>
        )}
      </span>
      <span className="flex-1 min-w-0 f-r text-[15px] text-[#1a1a1a]">{habit.name}</span>
      {habit.done && (
        <span data-t="chip-solid" className="bg-[#ebebeb] border-[1.5px] border-[#ebebeb] rounded-[8px] px-[12px] py-[4px] shrink-0 f-m text-[12px] text-[#666]">Done</span>
      )}
    </div>
  );
}

/** Bloom, the habit tracker cover app. A working habit list, so it holds up when someone pokes around in it.
 *  Titled with the cover picked in setup, so it matches the lock screen; only the habit tracker is designed so far. */
function Bloom({ name, toast }: { name: string; toast: (t: string) => void }) {
  const [habits, setHabits] = useState(HABITS);
  const done = habits.filter((h) => h.done).length;
  const left = habits.length - done;
  const toggle = (i: number) => setHabits((hs) => hs.map((h, j) => (j === i ? { ...h, done: !h.done } : h)));

  return (
    <>
      <TopBar title={name} />
      <Body fade>
        {/* Outlined card, so the filled habit rows below carry the weight. */}
        <div data-t="card" className="border-[#c7c7c7] border-[1.5px] flex gap-[16px] items-center p-[14px] rounded-[16px] shrink-0">
          <ProgressRing done={done} total={habits.length} />
          <div className="flex flex-col gap-[2px] min-w-0">
            <p className="f-s text-[15px] text-[#1a1a1a]">{done} of {habits.length} habits done</p>
            <p className="f-r text-[12px] text-[#666]">{left === 0 ? "All done for today" : `${left} remaining today`}</p>
            <p className="f-r text-[12px] text-[#1a1a1a]">12-day streak · keep it up!</p>
          </div>
        </div>
        <Label>Today's habits</Label>
        {habits.map((h, i) => <HabitRow key={h.name} habit={h} onToggle={() => toggle(i)} />)}
      </Body>
      {/* Bloom's own tabs, with no Hide tab: this is the cover app. Only Home is built. */}
      <BottomNav tabs={TABS} active="Home" icons={false} onSelect={(t) => t !== "Home" && toast("Not part of this test")} />
    </>
  );
}

/** Where quick exit, a wrong PIN and the finished loading screen all lead. */
export function CoverApp({ cover, toast }: { cover: string; toast: (t: string) => void }) {
  return <Bloom name={cover} toast={toast} />;
}
