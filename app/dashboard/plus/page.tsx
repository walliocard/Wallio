"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";

const ITEMS = [
  {
    section: null,
    rows: [
      { href: "/dashboard/reglages",  label: "Réglages",   sub: "Fidélité, établissement, équipe", icon: SettingsIcon },
      { href: "/dashboard/historique",label: "Historique", sub: "Tous les scans et tampons",        icon: HistoryIcon  },
      { href: "/dashboard/carte",     label: "Ma carte",   sub: "Personnaliser l'apparence",        icon: CardIcon     },
    ],
  },
];

export default function PlusPage() {
  const { marchand } = useAuth();

  return (
    <div style={{ padding: "24px 20px 120px", maxWidth: 430, margin: "0 auto" }}>
      <p style={{ fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--fg-tertiary)", marginBottom: 6 }}>
        Plus
      </p>
      <h1 style={{ fontSize: 34, fontWeight: 700, letterSpacing: "-0.5px", color: "var(--fg)", marginBottom: 32 }}>
        {marchand?.nom || "Menu"}
      </h1>

      <div style={{ background: "var(--bg-secondary)", borderRadius: 16, overflow: "hidden", border: "1px solid var(--separator)" }}>
        {ITEMS[0].rows.map(({ href, label, sub, icon: Icon }, i, arr) => (
          <Link key={href} href={href} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", textDecoration: "none", borderBottom: i < arr.length - 1 ? `1px solid var(--separator)` : "none" }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: "var(--lavande)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Icon />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 15, fontWeight: 500, color: "var(--fg)", margin: 0 }}>{label}</p>
              <p style={{ fontSize: 13, color: "var(--fg-tertiary)", margin: 0, marginTop: 1 }}>{sub}</p>
            </div>
            <ChevronIcon />
          </Link>
        ))}
      </div>

      <div style={{ background: "var(--bg-secondary)", borderRadius: 16, overflow: "hidden", border: "1px solid var(--separator)", marginTop: 24 }}>
        <button
          onClick={() => signOut(auth)}
          style={{ width: "100%", display: "flex", alignItems: "center", padding: "14px 16px", background: "none", border: "none", cursor: "pointer", textAlign: "left", gap: 14 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(255,59,48,0.10)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <LogOutIcon />
          </div>
          <p style={{ fontSize: 15, fontWeight: 500, color: "#FF3B30", margin: 0 }}>Se déconnecter</p>
        </button>
      </div>

      <p style={{ textAlign: "center", fontSize: 12, color: "var(--fg-tertiary)", marginTop: 32 }}>
        Wallio Pro
      </p>
    </div>
  );
}

function SettingsIcon() {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="var(--lavande-fg)" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  );
}
function HistoryIcon() {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="var(--lavande-fg)" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="1 4 1 10 7 10"/>
      <path d="M3.51 15a9 9 0 1 0 .49-4.95"/>
      <polyline points="12 7 12 12 15 15"/>
    </svg>
  );
}
function CardIcon() {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="var(--lavande-fg)" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="5" width="20" height="14" rx="2"/>
      <line x1="2" y1="10" x2="22" y2="10"/>
    </svg>
  );
}
function LogOutIcon() {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#FF3B30" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
      <polyline points="16 17 21 12 16 7"/>
      <line x1="21" y1="12" x2="9" y2="12"/>
    </svg>
  );
}
function ChevronIcon() {
  return (
    <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="var(--fg-tertiary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6"/>
    </svg>
  );
}
