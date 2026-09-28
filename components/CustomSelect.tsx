"use client";

interface Option { label: string; value: string | number }

interface Props {
  value: string | number;
  onChange: (v: string) => void;
  options: Option[];
  className?: string;
}

export default function CustomSelect({ value, onChange, options, className = "" }: Props) {
  return (
    <div className={`relative ${className}`}>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full px-4 py-3 rounded-2xl text-[14px] outline-none pr-10 cursor-pointer"
        style={{
          background: "var(--glass-bg)",
          border: "1px solid var(--border)",
          color: "var(--fg)",
          appearance: "none",
          WebkitAppearance: "none",
        }}
      >
        {options.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      <div
        className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2"
        style={{ color: "var(--fg-tertiary)" }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </div>
    </div>
  );
}
