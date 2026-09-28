"use client";
import { useState } from "react";

interface Props {
  date: string;
  time: string;
  onDateChange: (d: string) => void;
  onTimeChange: (t: string) => void;
  min?: string;
}

const MONTHS = ["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"];
const DAYS   = ["L","M","M","J","V","S","D"];
const HOURS  = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
const MINS   = ["00","15","30","45"];

export default function DateTimePicker({ date, time, onDateChange, onTimeChange, min }: Props) {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const minDate = min ? (() => { const d = new Date(min + "T00:00:00"); d.setHours(0,0,0,0); return d; })() : today;
  const sel = date ? new Date(date + "T00:00:00") : null;

  const [vy, setVy] = useState(sel?.getFullYear() ?? today.getFullYear());
  const [vm, setVm] = useState(sel?.getMonth()    ?? today.getMonth());

  const [hh, mm] = time.split(":");

  function cells() {
    const first = new Date(vy, vm, 1);
    let dow = first.getDay(); dow = dow === 0 ? 6 : dow - 1;
    const inMonth = new Date(vy, vm + 1, 0).getDate();
    const inPrev  = new Date(vy, vm, 0).getDate();
    const out: { d: number; type: "prev"|"cur"|"next" }[] = [];
    for (let i = dow - 1; i >= 0; i--) out.push({ d: inPrev - i, type: "prev" });
    for (let d = 1; d <= inMonth; d++)  out.push({ d, type: "cur" });
    while (out.length < 42)             out.push({ d: out.length - dow - inMonth + 1, type: "next" });
    return out;
  }

  function pick(d: number, type: "prev"|"cur"|"next") {
    let y = vy, m = vm;
    if (type === "prev") { m--; if (m < 0)  { m = 11; y--; } }
    if (type === "next") { m++; if (m > 11) { m = 0;  y++; } }
    const dt = new Date(y, m, d); dt.setHours(0,0,0,0);
    if (dt < minDate) return;
    onDateChange(`${y}-${String(m+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`);
    if (type !== "cur") { setVy(y); setVm(m); }
  }

  function prev() { if (vm === 0) { setVm(11); setVy(v => v-1); } else setVm(v => v-1); }
  function next() { if (vm === 11){ setVm(0);  setVy(v => v+1); } else setVm(v => v+1); }

  return (
    <div>
      {/* Calendar */}
      <div className="rounded-2xl overflow-hidden" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>

        {/* Month nav */}
        <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: "1px solid var(--border)" }}>
          <button onClick={prev}
            className="w-8 h-8 rounded-xl flex items-center justify-center transition-all hover:opacity-60"
            style={{ background: "var(--glass-bg)", color: "var(--fg-secondary)" }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <p className="text-[14px] font-semibold" style={{ color: "var(--fg)" }}>
            {MONTHS[vm]} {vy}
          </p>
          <button onClick={next}
            className="w-8 h-8 rounded-xl flex items-center justify-center transition-all hover:opacity-60"
            style={{ background: "var(--glass-bg)", color: "var(--fg-secondary)" }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 px-3 pt-3">
          {DAYS.map((d, i) => (
            <div key={i} className="text-center text-[11px] font-semibold pb-2" style={{ color: "var(--fg-tertiary)" }}>{d}</div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7 px-3 pb-3 gap-y-0.5">
          {cells().map((cell, i) => {
            const y2 = cell.type === "prev" ? (vm === 0  ? vy-1 : vy) : cell.type === "next" ? (vm === 11 ? vy+1 : vy) : vy;
            const m2 = cell.type === "prev" ? (vm === 0  ? 11 : vm-1) : cell.type === "next" ? (vm === 11 ? 0    : vm+1): vm;
            const dt = new Date(y2, m2, cell.d); dt.setHours(0,0,0,0);
            const isToday    = dt.getTime() === today.getTime();
            const isSel      = sel && dt.getTime() === sel.getTime();
            const isPast     = dt < minDate;
            const isOther    = cell.type !== "cur";
            return (
              <button key={i} onClick={() => pick(cell.d, cell.type)} disabled={isPast}
                className="flex items-center justify-center text-[13px] transition-all active:scale-90"
                style={{
                  height: 36,
                  borderRadius: 10,
                  fontWeight: isSel || isToday ? 700 : 450,
                  background: isSel ? "var(--accent)" : isToday && !isSel ? "rgba(0,122,255,0.08)" : "transparent",
                  color: isSel ? "white" : isPast ? "var(--border)" : isOther ? "var(--fg-tertiary)" : isToday ? "var(--accent)" : "var(--fg)",
                  cursor: isPast ? "default" : "pointer",
                }}>
                {cell.d}
              </button>
            );
          })}
        </div>
      </div>

      {/* Time selects */}
      <div className="flex gap-3 mt-3">
        {[
          { label: "Heure", value: hh, opts: HOURS, fmt: (v: string) => `${v}h`, onChange: (v: string) => onTimeChange(`${v}:${mm}`) },
          { label: "Minutes", value: mm, opts: MINS,  fmt: (v: string) => `:${v}`,  onChange: (v: string) => onTimeChange(`${hh}:${v}`) },
        ].map(sel2 => (
          <div key={sel2.label} className="flex-1">
            <p className="text-[11px] font-semibold mb-1.5" style={{ color: "var(--fg-tertiary)" }}>{sel2.label}</p>
            <div className="relative">
              <select value={sel2.value} onChange={e => sel2.onChange(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl text-[14px] outline-none pr-9"
                style={{ background: "var(--glass-bg)", border: "1px solid var(--border)", color: "var(--fg)", appearance: "none", WebkitAppearance: "none" }}>
                {sel2.opts.map(o => <option key={o} value={o}>{sel2.fmt(o)}</option>)}
              </select>
              <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2" style={{ color: "var(--fg-tertiary)" }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="6 9 12 15 18 9"/></svg>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
