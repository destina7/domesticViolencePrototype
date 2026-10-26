import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { CUES_PER_BLOCK, POSITIONS, POSITION_LABEL, downloadText, loadData, mean, median, secs, stamp, trialsCsv, unpromptedCsv } from "./testing";
import type { Participant, TestData, Trial } from "./testing";

/** Opened in its own tab from the facilitator menu (#analytics). Reads what the test saved in this browser. */
export default function Analytics() {
  const [data, setData] = useState<TestData>(loadData);
  const [practice, setPractice] = useState(false);
  const [who, setWho] = useState<"all" | number>("all");

  useEffect(() => {
    document.title = "Nura · quick exit test analytics";
    let last = JSON.stringify(data);
    const refresh = () => {
      const d = loadData();
      const s = JSON.stringify(d);
      if (s !== last) { last = s; setData(d); }
    };
    window.addEventListener("storage", refresh);
    const id = window.setInterval(refresh, 1500);
    return () => { window.removeEventListener("storage", refresh); window.clearInterval(id); };
  }, []);

  const ps = who === "all" ? data.participants : data.participants.filter((p) => p.id === who);
  const rows = ps.flatMap((p) => p.trials.map((t) => ({ p, t }))).filter(({ t }) => practice || !t.practice);
  const times = (list: Trial[]) => list.map((t) => t.exitMs).filter((x): x is number => x !== null);

  const stats = POSITIONS.map((pos) => {
    const ts = rows.filter((r) => r.t.position === pos).map((r) => r.t);
    const exit = times(ts);
    const first = ts.map((t) => t.firstTouchMs).filter((x): x is number => x !== null);
    return {
      pos, n: ts.length, med: median(exit), avg: mean(exit),
      min: exit.length ? Math.min(...exit) : null, max: exit.length ? Math.max(...exit) : null,
      firstMed: median(first),
      hit: ts.length ? ts.filter((t) => t.firstTapHit).length / ts.length : null,
      missPer: ts.length ? ts.reduce((n, t) => n + t.missTaps.length, 0) / ts.length : null,
      unprompted: ps.flatMap((p) => p.unprompted).filter((u) => u.position === pos).length,
      ts,
    };
  });
  const measured = stats.filter((s) => s.med !== null);
  const fastest = measured.length ? measured.reduce((a, b) => ((a.med as number) <= (b.med as number) ? a : b)) : null;
  const slowest = measured.length ? measured.reduce((a, b) => ((a.med as number) >= (b.med as number) ? a : b)) : null;
  const maxMed = Math.max(1, ...measured.map((s) => s.med as number));
  const totalTrials = rows.length;
  const allUnprompted = ps.flatMap((p) => p.unprompted.map((u) => ({ p, u })));

  return (
    <div className="min-h-[100dvh] bg-white text-[#1a1a1a]">
      <div className="max-w-[980px] mx-auto px-[20px] py-[28px] flex flex-col gap-[24px]">
        <header className="flex flex-wrap items-end justify-between gap-[12px]">
          <div>
            <p className="f-m text-[11px] text-[#666] tracking-[0.66px] uppercase">Nura prototype</p>
            <h1 className="f-b text-[26px]">Quick exit test analytics</h1>
            <p className="f-r text-[13px] text-[#666]">Time from the red-edge cue appearing to the first touch on the quick exit button. Updates live while a test is running.</p>
          </div>
          <div className="flex flex-wrap gap-[8px]">
            <Btn disabled={!data.participants.length} onClick={() => downloadText(`nura-exit-test-${stamp()}.csv`, trialsCsv(ps))}>Download trials CSV</Btn>
            <Btn disabled={!allUnprompted.length} onClick={() => downloadText(`nura-exit-test-unprompted-${stamp()}.csv`, unpromptedCsv(ps))}>Download unprompted presses CSV</Btn>
          </div>
        </header>

        {!data.participants.length ? (
          <div className="border-[1.5px] border-dashed border-[#c7c7c7] rounded-[16px] p-[28px] text-center">
            <p className="f-s text-[16px]">No test data yet</p>
            <p className="f-r text-[13px] text-[#666] mt-[6px]">Open the prototype, press P (or tap the top-left corner three times), then choose Start testing. Data from this browser shows up here.</p>
          </div>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-[16px]">
              <label className="flex items-center gap-[8px] f-m text-[13px]">
                Participant
                <select value={String(who)} onChange={(e) => setWho(e.target.value === "all" ? "all" : Number(e.target.value))}
                  className="border-[1.5px] border-[#c7c7c7] rounded-[10px] px-[10px] py-[4px] f-r text-[13px] bg-white">
                  <option value="all">All ({data.participants.length})</option>
                  {data.participants.map((p) => <option key={p.id} value={p.id}>{p.id}</option>)}
                </select>
              </label>
              <label className="flex items-center gap-[8px] f-m text-[13px] cursor-pointer">
                <input type="checkbox" checked={practice} onChange={(e) => setPractice(e.target.checked)} />
                Include practice cues
              </label>
              <span className="f-r text-[12px] text-[#666]">{totalTrials} cues counted</span>
            </div>

            {ps.map((p) => <ParticipantBar key={p.id} p={p} />)}

            {/* ---------- headline ---------- */}
            <section className="flex flex-col gap-[10px]">
              <h2 className="f-b text-[18px]">Time to exit by position</h2>
              {fastest && slowest ? (
                <p className="f-r text-[14px]">
                  Fastest median: <b className="f-s">{POSITION_LABEL[fastest.pos]}</b> at {secs(fastest.med)}.
                  {" "}Slowest: <b className="f-s">{POSITION_LABEL[slowest.pos]}</b> at {secs(slowest.med)}.
                </p>
              ) : <p className="f-r text-[14px] text-[#666]">No completed cues yet.</p>}
              <div className="flex flex-col gap-[8px]">
                {stats.map((s) => (
                  <div key={s.pos} className="flex items-center gap-[12px]">
                    <p className="w-[180px] shrink-0 f-m text-[13px]">{POSITION_LABEL[s.pos]}</p>
                    <div className="flex-1 bg-[#f2f2f2] rounded-full h-[18px] overflow-hidden">
                      {s.med !== null && <div className="bg-[#1a1a1a] h-full rounded-full" style={{ width: `${Math.max(2, ((s.med as number) / maxMed) * 100)}%` }} />}
                    </div>
                    <p className="w-[70px] shrink-0 text-right f-s text-[13px] tabular-nums">{secs(s.med)}</p>
                  </div>
                ))}
              </div>
              <p className="f-r text-[12px] text-[#666]">
                Bars show the median. With {CUES_PER_BLOCK - 1} counted cues per position per person, read single-participant numbers as indicative. Pool several participants (export the CSVs before each reset) before drawing conclusions.
              </p>
            </section>

            {/* ---------- table ---------- */}
            <section className="flex flex-col gap-[10px]">
              <h2 className="f-b text-[18px]">Summary</h2>
              <Table head={["Position", "Cues", "Median", "Mean", "Fastest", "Slowest", "First touch (median)", "First touch on button", "Missed taps / cue", "Unprompted presses"]}>
                {stats.map((s) => (
                  <tr key={s.pos} className="border-t border-[#e3e3e3]">
                    <Td strong>{POSITION_LABEL[s.pos]}</Td>
                    <Td>{s.n}</Td>
                    <Td strong>{secs(s.med)}</Td>
                    <Td>{secs(s.avg)}</Td>
                    <Td>{secs(s.min)}</Td>
                    <Td>{secs(s.max)}</Td>
                    <Td>{secs(s.firstMed)}</Td>
                    <Td>{s.hit === null ? "–" : `${Math.round(s.hit * 100)}%`}</Td>
                    <Td>{s.missPer === null ? "–" : s.missPer.toFixed(1)}</Td>
                    <Td>{s.unprompted}</Td>
                  </tr>
                ))}
              </Table>
              <p className="f-r text-[12px] text-[#666]">
                “First touch” is the first tap anywhere after the cue (recognising it and starting to move). “Unprompted presses” are exit presses while no cue was showing: accidents, or the participant exploring.
              </p>
            </section>

            {/* ---------- tap maps ---------- */}
            <section className="flex flex-col gap-[10px]">
              <h2 className="f-b text-[18px]">Where the thumb went</h2>
              <p className="f-r text-[12px] text-[#666]">Outlined boxes are where the quick exit button was. Filled dots are the touch that hit it. Red dots are touches elsewhere before it.</p>
              <div className="flex flex-wrap gap-[20px]">
                {stats.map((s) => <PhoneMap key={s.pos} title={POSITION_LABEL[s.pos]} trials={s.ts} />)}
              </div>
            </section>

            {/* ---------- every cue ---------- */}
            <section className="flex flex-col gap-[10px]">
              <h2 className="f-b text-[18px]">Every cue</h2>
              <Table head={["Participant", "Part", "Cue", "Position", "Screen", "Waited", "First touch", "Exit time", "Hit on first touch", "Missed taps"]}>
                {[...rows].reverse().map(({ p, t }) => (
                  <tr key={`${p.id}-${t.id}`} className="border-t border-[#e3e3e3]">
                    <Td>{p.id}</Td>
                    <Td>{t.block}</Td>
                    <Td>{t.cueIndex}{t.practice ? " (practice)" : ""}</Td>
                    <Td>{POSITION_LABEL[t.position]}</Td>
                    <Td>{t.screen}</Td>
                    <Td>{t.gapMs ? secs(t.gapMs, 0) : "manual"}</Td>
                    <Td>{secs(t.firstTouchMs)}</Td>
                    <Td strong>{secs(t.exitMs)}</Td>
                    <Td>{t.firstTapHit === null ? "–" : t.firstTapHit ? "Yes" : "No"}</Td>
                    <Td>{t.missTaps.length}</Td>
                  </tr>
                ))}
              </Table>
            </section>

            {allUnprompted.length > 0 && (
              <section className="flex flex-col gap-[10px]">
                <h2 className="f-b text-[18px]">Unprompted exit presses</h2>
                <Table head={["Participant", "Part", "Position", "Screen", "Time"]}>
                  {allUnprompted.map(({ p, u }, i) => (
                    <tr key={i} className="border-t border-[#e3e3e3]">
                      <Td>{p.id}</Td><Td>{u.block}</Td><Td>{POSITION_LABEL[u.position]}</Td><Td>{u.screen}</Td>
                      <Td>{new Date(u.at).toLocaleTimeString()}</Td>
                    </tr>
                  ))}
                </Table>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function ParticipantBar({ p }: { p: Participant }) {
  const done = p.trials.length;
  const status = p.status === "completed" ? "Completed" : p.status === "stopped" ? "Stopped early" : "Running";
  return (
    <div className="border-[1.5px] border-[#c7c7c7] rounded-[14px] px-[14px] py-[10px] flex flex-wrap gap-x-[24px] gap-y-[4px] f-r text-[12px] text-[#444]">
      <span><b className="f-s text-[#1a1a1a]">Participant {p.id}</b> · {status} · {done}/{CUES_PER_BLOCK * 4} cues</span>
      <span>Thumb: {p.hand === "unknown" ? "not noted" : p.hand}</span>
      <span>Order: {p.order.map((o) => POSITION_LABEL[o]).join(" → ")}</span>
      <span>Home {p.homeLayout} · capture {p.captureDesign}{p.voiceDesign ? ` · voice ${p.voiceDesign}` : ""}</span>
      <span>{p.touch ? "Touch device" : "No touch input (mouse?)"} · {p.viewport.w}×{p.viewport.h}</span>
      <span>{new Date(p.startedAt).toLocaleString()}</span>
    </div>
  );
}

function PhoneMap({ title, trials }: { title: string; trials: Trial[] }) {
  const W = trials.find((t) => t.frameW)?.frameW || 360;
  const H = trials.find((t) => t.frameH)?.frameH || 800;
  const scale = 150 / W;
  return (
    <figure className="flex flex-col gap-[6px] items-start">
      <figcaption className="f-m text-[12px]">{title} · {trials.length} {trials.length === 1 ? "cue" : "cues"}</figcaption>
      <svg width={W * scale} height={H * scale} viewBox={`0 0 ${W} ${H}`} className="border-[1.5px] border-[#1a1a1a] rounded-[12px] bg-white">
        {trials.map((t) => t.exitRect && (
          <rect key={`r${t.id}`} x={t.exitRect.x} y={t.exitRect.y} width={t.exitRect.w} height={t.exitRect.h} rx={10}
            fill="rgba(26,26,26,0.08)" stroke="#1a1a1a" strokeWidth={2} />
        ))}
        {trials.flatMap((t) => t.missTaps.map((m, i) => (
          <circle key={`m${t.id}-${i}`} cx={m.fx} cy={m.fy} r={7} fill="#e5221b" fillOpacity={0.55} />
        )))}
        {trials.map((t) => t.exitTap && <circle key={`h${t.id}`} cx={t.exitTap.fx} cy={t.exitTap.fy} r={7} fill="#1a1a1a" />)}
      </svg>
    </figure>
  );
}

function Btn({ children, onClick, disabled }: { children: ReactNode; onClick: () => void; disabled?: boolean }) {
  return (
    <button onClick={onClick} disabled={disabled}
      className="border-[1.5px] border-[#1a1a1a] rounded-[12px] px-[14px] py-[8px] f-s text-[13px] hover:bg-[#f5f5f5] disabled:opacity-40 disabled:hover:bg-transparent">{children}</button>
  );
}

function Table({ head, children }: { head: string[]; children: ReactNode }) {
  return (
    <div className="overflow-x-auto border-[1.5px] border-[#c7c7c7] rounded-[14px]">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr>{head.map((h) => <th key={h} className="px-[12px] py-[8px] f-m text-[11px] text-[#666] tracking-[0.4px] uppercase whitespace-nowrap">{h}</th>)}</tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

function Td({ children, strong }: { children: ReactNode; strong?: boolean }) {
  return <td className={`px-[12px] py-[8px] text-[13px] tabular-nums whitespace-nowrap ${strong ? "f-s" : "f-r"}`}>{children}</td>;
}
