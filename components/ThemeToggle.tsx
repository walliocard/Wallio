"use client";
import { useEffect, useState } from "react";

type Theme = "light" | "dark" | "system";

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("system");

  useEffect(() => {
    const saved = localStorage.getItem("wallio-theme") as Theme | null;
    if (saved) apply(saved);
    setTheme(saved ?? "system");
  }, []);

  function apply(t: Theme) {
    const root = document.documentElement;
    root.classList.remove("light", "dark");
    if (t !== "system") root.classList.add(t);
    localStorage.setItem("wallio-theme", t);
    setTheme(t);
  }

  const options: { value: Theme; label: string }[] = [
    { value: "light",  label: "Clair" },
    { value: "system", label: "Auto" },
    { value: "dark",   label: "Sombre" },
  ];

  return (
    <div style={{
      display: "flex", gap: 2, padding: 3,
      background: "var(--glass-bg)", border: "1px solid var(--border)",
      borderRadius: 12,
    }}>
      {options.map(o => (
        <button key={o.value} onClick={() => apply(o.value)}
          style={{
            padding: "4px 10px", borderRadius: 9, fontSize: 12, fontWeight: 500,
            background: theme === o.value ? "var(--accent)" : "transparent",
            color: theme === o.value ? "white" : "var(--fg-secondary)",
            cursor: "pointer", border: "none", transition: "all 0.15s",
          }}>
          {o.label}
        </button>
      ))}
    </div>
  );
}
