import { useEffect, useState } from "react";
import type { ReactNode } from "react";

export function QuickExit({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} aria-label="Quick exit"
      className="bg-white border-[#1a1a1a] border-[2.5px] flex items-center px-[12px] min-h-[36px] rounded-[12px] shrink-0 f-b text-[13px] text-[#1a1a1a] whitespace-nowrap hover:bg-[#f5f5f5] active:scale-95 transition-transform">
      Quick exit
    </button>
  );
}

export function Chip({ children, quiet, solid, onClick }: { children: ReactNode; quiet?: boolean; solid?: boolean; onClick?: () => void }) {
  const cls = `border-[1.5px] flex items-center px-[10px] py-[2px] rounded-full shrink-0 f-m text-[12px] whitespace-nowrap ${
    solid ? "bg-[#1a1a1a] border-[#1a1a1a] text-white" : quiet ? "border-[#c7c7c7] text-[#666]" : "border-[#1a1a1a] text-[#1a1a1a]"}`;
  return onClick ? <button onClick={onClick} className={`${cls} min-h-[32px] px-[12px]`}>{children}</button> : <span className={cls}>{children}</span>;
}

export function StatusBar({ mic }: { mic?: boolean }) {
  // The wireframes show a fake phone status bar. Hidden on real phones, which have their own.
  return (
    <div className="hidden sm:flex h-[28px] shrink-0 items-center justify-between px-[18px] f-r text-[10px] text-[#666] select-none">
      <span>21:14</span>
      <span>{mic && <span className="f-s text-[#1a1a1a]">● mic dot&nbsp;&nbsp;</span>}wifi · batt</span>
    </div>
  );
}

export function TopBar({ title, onBack, right }: { title: string; onBack?: () => void; right?: ReactNode }) {
  return (
    <header className="w-full shrink-0">
      <div className="flex gap-[10px] items-center min-h-[56px] px-[16px] py-[6px] w-full max-w-[560px] mx-auto">
        {onBack && <button onClick={onBack} aria-label="Back" className="border-[#1a1a1a] border-[1.5px] rounded-[6px] size-[20px] shrink-0 hover:bg-[#ebebeb]" />}
        <p className="flex-1 min-w-0 f-b text-[20px] text-[#1a1a1a] select-none">{title}</p>
        {right}
      </div>
    </header>
  );
}

export function Body({ children, center }: { children: ReactNode; center?: boolean }) {
  return (
    <main className={`flex flex-1 flex-col gap-[12px] min-h-0 overflow-y-auto px-[16px] py-[8px] w-full max-w-[560px] mx-auto ${center ? "items-center" : "items-stretch"}`}>
      {children}
    </main>
  );
}

export function Spacer() {
  return <div className="flex-1" />;
}

export function Heading({ children }: { children: ReactNode }) {
  return <p className="f-b text-[22px] text-[#1a1a1a]">{children}</p>;
}

export function Label({ children }: { children: ReactNode }) {
  return <p className="f-m text-[11px] text-[#666] tracking-[0.66px] uppercase">{children}</p>;
}

export function Foot({ children }: { children: ReactNode }) {
  return <p className="f-r text-[12px] text-[#666] text-center">{children}</p>;
}

type Icon = "square" | "round";

export function Button({ children, onClick, variant = "primary", icon, size = "normal" }: { children: ReactNode; onClick?: () => void; variant?: "primary" | "secondary" | "outline"; icon?: Icon; size?: "tall" | "mid" | "normal" }) {
  const styles = {
    primary: "bg-[#1a1a1a] border-[#1a1a1a] text-white hover:bg-[#333]",
    secondary: "border-[#c7c7c7] text-[#1a1a1a] hover:bg-[#f5f5f5]",
    outline: "border-[#1a1a1a] text-[#1a1a1a] hover:bg-[#f5f5f5]",
  }[variant];
  const h = { tall: "min-h-[64px]", mid: "min-h-[54px]", normal: "min-h-[52px]" }[size];
  return (
    <button onClick={onClick}
      className={`border-2 flex items-center ${icon ? "justify-start gap-[10px]" : "justify-center"} ${h} px-[16px] py-[6px] rounded-[16px] w-full shrink-0 f-s text-[15px] transition-colors active:scale-[0.99] ${styles}`}>
      {icon && <span className={`border-[1.5px] size-[20px] shrink-0 ${variant === "primary" ? "border-white" : "border-[#1a1a1a]"} ${icon === "round" ? "rounded-[10px]" : "rounded-[6px]"}`} />}
      {children}
    </button>
  );
}

export function Placeholder({ children, className = "" }: { children?: ReactNode; className?: string }) {
  return (
    <div className={`bg-[#ebebeb] border-[#c7c7c7] border-[1.5px] border-dashed flex flex-col items-center justify-center p-[6px] rounded-[16px] shrink-0 ${className}`}>
      {children && <p className="f-m text-[11px] text-[#666] text-center max-w-[160px]">{children}</p>}
    </div>
  );
}

export function ListItem({ title, sub, lead, trail, selected, onClick }: { title: string; sub?: string; lead?: Icon | "image"; trail?: ReactNode; selected?: boolean; onClick?: () => void }) {
  const cls = `border-[1.5px] flex gap-[12px] items-center min-h-[58px] px-[14px] py-[8px] rounded-[14px] w-full shrink-0 text-left ${selected ? "border-[#1a1a1a]" : "border-[#c7c7c7]"} ${onClick ? "hover:bg-[#f7f7f7] transition-colors cursor-pointer" : ""}`;
  const inner = (
    <>
      {lead === "round" && <span className={`border-[#1a1a1a] border-[1.5px] rounded-[10px] size-[20px] shrink-0 ${selected ? "bg-[#1a1a1a] shadow-[inset_0_0_0_3px_#fff]" : ""}`} />}
      {lead === "square" && <span className="border-[#1a1a1a] border-[1.5px] rounded-[6px] size-[20px] shrink-0" />}
      {lead === "image" && <Placeholder className="size-[40px]" />}
      <span className="flex flex-1 flex-col gap-[2px] min-w-0">
        <span className="f-s text-[14px] text-[#1a1a1a]">{title}</span>
        {sub && <span className="f-r text-[12px] text-[#666]">{sub}</span>}
      </span>
      {trail}
    </>
  );
  return onClick ? <div role="button" tabIndex={0} onClick={onClick} onKeyDown={(e) => e.key === "Enter" && onClick()} className={cls}>{inner}</div> : <div className={cls}>{inner}</div>;
}

export function Chevron() {
  return <span className="f-r text-[20px] leading-none text-[#1a1a1a] shrink-0">›</span>;
}

export function Switch({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button role="switch" aria-checked={on} onClick={(e) => { e.stopPropagation(); onChange(!on); }}
      className={`border-[#1a1a1a] border-[1.5px] relative rounded-[13px] w-[44px] h-[26px] shrink-0 transition-colors ${on ? "bg-[#1a1a1a]" : "bg-white"}`}>
      <span className={`absolute top-[3.5px] rounded-full size-[16px] transition-all ${on ? "left-[21.5px] bg-white" : "left-[3.5px] bg-[#1a1a1a]"}`} />
    </button>
  );
}

export function Card({ children, strong }: { children: ReactNode; strong?: boolean }) {
  return <div className={`border-[1.5px] flex flex-col gap-[6px] items-start p-[12px] rounded-[16px] w-full shrink-0 ${strong ? "border-[#1a1a1a]" : "border-[#c7c7c7]"}`}>{children}</div>;
}

/** Emergency block shared by the setup screen and Resources. Deliberately not a tel: link, so testers on a real phone never dial 112. */
export function DangerCard({ onCall }: { onCall: () => void }) {
  return (
    <div className="border-[#1a1a1a] border-[1.5px] flex flex-col gap-[10px] p-[12px] rounded-[16px] shrink-0">
      <p className="f-s text-[15px]">In danger now?</p>
      <Button onClick={onCall}>Call 112</Button>
    </div>
  );
}

export function TextLine({ w }: { w: number }) {
  return <div className="bg-[#ebebeb] h-[8px] rounded-[4px] max-w-full" style={{ width: w }} />;
}

export function CheckMark({ size = 84 }: { size?: number }) {
  return (
    <div className="border-[#1a1a1a] border-[2.5px] flex items-center justify-center rounded-full shrink-0" style={{ width: size, height: size }}>
      <svg width={size * 0.45} height={size * 0.45} viewBox="0 0 24 24" fill="none" stroke="#1a1a1a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
    </div>
  );
}

export const NAV_HEIGHT = 66;

/** Bottom tab bar. When `onHide` is given a black "Hide" tab (quick exit) is added at the right. */
export function BottomNav({ tabs, active, onSelect, onHide }: { tabs: string[]; active: string; onSelect: (t: string) => void; onHide?: () => void }) {
  return (
    <nav className="w-full shrink-0 bg-white">
      <div className="bg-[#c7c7c7] h-[1.5px] w-full" />
      <div className="flex px-[4px] py-[6px] w-full max-w-[560px] mx-auto">
        {tabs.map((t) => {
          const on = t === active;
          return (
            <button key={t} onClick={() => onSelect(t)} className="flex flex-1 flex-col gap-[3px] items-center justify-center min-h-[52px] min-w-0">
              <span className={`border-[#1a1a1a] border-[1.5px] rounded-[6px] size-[22px] ${on ? "bg-[#1a1a1a]" : ""}`} />
              <span className={`text-[11px] whitespace-nowrap ${on ? "f-s text-[#1a1a1a]" : "f-r text-[#666]"}`}>{t}</span>
            </button>
          );
        })}
        {onHide && (
          <button onClick={onHide} aria-label="Hide (quick exit)" className="flex flex-1 flex-col gap-[3px] items-center justify-center min-h-[52px] min-w-0 bg-[#1a1a1a] rounded-[16px] active:scale-95 transition-transform">
            <span className="border-white border-[1.5px] rounded-[6px] size-[22px]" />
            <span className="f-s text-[11px] text-white whitespace-nowrap">Hide</span>
          </button>
        )}
      </div>
    </nav>
  );
}

export function Toast({ text }: { text: string | null }) {
  if (!text) return null;
  return (
    <div className="absolute inset-x-[16px] top-[64px] sm:top-[92px] z-50 flex justify-center pointer-events-none">
      <div className="bg-[#1a1a1a] text-white f-m text-[12px] rounded-full px-[14px] py-[8px] shadow-lg">{text}</div>
    </div>
  );
}

export function useToast(): [string | null, (t: string) => void] {
  const [text, setText] = useState<string | null>(null);
  useEffect(() => {
    if (!text) return;
    const t = window.setTimeout(() => setText(null), 1800);
    return () => window.clearTimeout(t);
  }, [text]);
  return [text, setText];
}

/** Counts up while `running`, for visual timers only. */
export function useTimer(running: boolean) {
  const [sec, setSec] = useState(0);
  useEffect(() => {
    if (!running) return;
    const t = window.setInterval(() => setSec((s) => s + 1), 1000);
    return () => window.clearInterval(t);
  }, [running]);
  return sec;
}

export const fmtTime = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
