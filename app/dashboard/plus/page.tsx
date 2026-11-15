"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth-context";

const VERSION = "1.0.0";

const ITEMS = [
  {
    href: "/dashboard/reglages",
    label: "Réglages",
    sub: "Fidélité, établissement, équipe",
    icon: (
      <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="var(--lavande-fg)" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3"/>
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
      </svg>
    ),
  },
  {
    href: "/dashboard/carte",
    label: "Ma carte",
    sub: "Personnaliser l'apparence",
    icon: (
      <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="var(--lavande-fg)" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="5" width="20" height="14" rx="2"/>
        <line x1="2" y1="10" x2="22" y2="10"/>
      </svg>
    ),
  },
  {
    href: "/dashboard/historique",
    label: "Historique",
    sub: "Tous les scans et tampons",
    icon: (
      <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="var(--lavande-fg)" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="1 4 1 10 7 10"/>
        <path d="M3.51 15a9 9 0 1 0 .49-4.95"/>
        <polyline points="12 7 12 12 15 15"/>
      </svg>
    ),
  },
];

const SECONDARY = [
  {
    href: "https://wa.me/212654768191",
    label: "Aide et support",
    sub: "WhatsApp Wallio",
    icon: (
      <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="var(--lavande-fg)" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
        <line x1="12" y1="17" x2="12.01" y2="17"/>
      </svg>
    ),
  },
];

function ChevronRight() {
  return (
    <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="var(--fg-tertiary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6"/>
    </svg>
  );
}

function ItemRow({ href, label, sub, icon, last }: { href: string; label: string; sub: string; icon: React.ReactNode; last?: boolean }) {
  return (
    <Link href={href} style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 16px", textDecoration: "none", borderBottom: last ? "none" : "1px solid var(--border)" }}>
      <div style={{ width: 34, height: 34, borderRadius: 9, background: "var(--lavande)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        {icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 15, fontWeight: 500, color: "var(--fg)", margin: 0 }}>{label}</p>
        <p style={{ fontSize: 12, color: "var(--fg-tertiary)", margin: 0, marginTop: 1 }}>{sub}</p>
      </div>
      <ChevronRight />
    </Link>
  );
}

export default function PlusPage() {
  const { marchand } = useAuth();

  return (
    <div style={{ position: "relative" }}>
      <AmbientBackground variant="subtle" />
      <div style={{ padding: "28px 20px 120px", maxWidth: 430, margin: "0 auto", position: "relative", zIndex: 1 }}>
      <h1 style={{ fontSize: 34, fontWeight: 700, letterSpacing: "-0.5px", color: "var(--fg)", marginBottom: 28 }}>
        {marchand?.nom || "Plus"}
      </h1>

      {/* Groupe principal */}
      <div style={{ background: "var(--glass-bg)", borderRadius: 16, overflow: "hidden", border: "1px solid var(--border)" }}>
        {ITEMS.map((item, i) => (
          <ItemRow key={item.href} {...item} last={i === ITEMS.length - 1} />
        ))}
      </div>

      {/* Groupe secondaire */}
      <div style={{ background: "var(--glass-bg)", borderRadius: 16, overflow: "hidden", border: "1px solid var(--border)", marginTop: 20 }}>
        {SECONDARY.map((item, i) => (
          <ItemRow key={item.href} {...item} last={i === SECONDARY.length - 1} />
        ))}
      </div>

      <p style={{ textAlign: "center", fontSize: 12, color: "var(--fg-tertiary)", marginTop: 36 }}>
        Wallio {VERSION}
      </p>
      </div>
    </div>
  );
}

import React from "react";
import AmbientBackground from "@/components/AmbientBackground";
