"use client";

import React, { useRef } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import CompactHeader from "@/components/dashboard/CompactHeader";

const VERSION = "1.3";

function ChevronRight() {
  return (
    <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="var(--fg-tertiary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6"/>
    </svg>
  );
}

function ItemRow({ href, label, sub, iconBg, icon, last }: {
  href: string; label: string; sub: string;
  iconBg: string; icon: React.ReactNode; last?: boolean;
}) {
  return (
    <Link href={href} style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 16px", textDecoration: "none", borderBottom: last ? "none" : "1px solid var(--border)" }}>
      <div style={{ width: 32, height: 32, borderRadius: 8, background: iconBg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
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
  const { marchand, user } = useAuth();
  const router = useRouter();
  const titleRef = useRef<HTMLHeadingElement>(null);
  const hasEquipe = !!(marchand as Record<string, unknown>)?.equipe_actif;

  async function handleSignOut() {
    await signOut(auth);
    router.push("/dashboard/auth");
  }

  const ITEMS = [
    {
      href: "/dashboard/reglages",
      label: "Réglages",
      sub: "Fidélité, établissement",
      iconBg: "#8E8E93",
      icon: (
        <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3"/>
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
        </svg>
      ),
    },
    {
      href: "/dashboard/carte",
      label: "Ma carte",
      sub: "Personnaliser l'apparence",
      iconBg: "#8B5CF6",
      icon: (
        <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/>
        </svg>
      ),
    },
    ...(hasEquipe ? [{
      href: "/dashboard/equipe",
      label: "Gestion équipe",
      sub: "Membres, code d'accès",
      iconBg: "#2F7BFF",
      icon: (
        <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
          <circle cx="9" cy="7" r="4"/>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
        </svg>
      ),
    }] : []),
    {
      href: "/dashboard/historique",
      label: "Historique",
      sub: "Tous les scans et tampons",
      iconBg: "#5856D6",
      icon: (
        <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="1 4 1 10 7 10"/>
          <path d="M3.51 15a9 9 0 1 0 .49-4.95"/>
          <polyline points="12 7 12 12 15 15"/>
        </svg>
      ),
    },
  ];

  void user; // useAuth needed for signOut path

  return (
    <div>
      <CompactHeader title="Compte" observeRef={titleRef} />
      <div style={{ padding: "calc(env(safe-area-inset-top) + 20px) 20px 120px", maxWidth: 430, margin: "0 auto" }}>

        <h1 ref={titleRef} style={{ fontSize: 34, fontWeight: 700, letterSpacing: "-0.5px", color: "var(--fg)", marginBottom: 28 }}>
          Compte
        </h1>

        {/* Groupe principal */}
        <div style={{ background: "var(--glass-bg)", borderRadius: 16, overflow: "hidden", border: "1px solid var(--border)", marginBottom: 16 }}>
          {ITEMS.map((item, i) => (
            <ItemRow key={item.href} {...item} last={i === ITEMS.length - 1} />
          ))}
        </div>

        {/* Groupe secondaire */}
        <div style={{ background: "var(--glass-bg)", borderRadius: 16, overflow: "hidden", border: "1px solid var(--border)" }}>
          <ItemRow
            href="https://wa.me/212654768191"
            label="Aide et support"
            sub="WhatsApp Wallio"
            iconBg="#34C759"
            icon={
              <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
                <line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
            }
            last={false}
          />
          <button
            onClick={handleSignOut}
            style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 16px", width: "100%", background: "none", border: "none", borderTop: "1px solid var(--border)", cursor: "pointer", textAlign: "left" }}
          >
            <div style={{ width: 32, height: 32, borderRadius: 8, background: "#FF3B30", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
            </div>
            <p style={{ fontSize: 15, fontWeight: 500, color: "#FF3B30", margin: 0 }}>Déconnexion</p>
          </button>
        </div>

        <p style={{ textAlign: "center", fontSize: 12, color: "var(--fg-tertiary)", marginTop: 32 }}>
          Wallio {VERSION}
        </p>
      </div>
    </div>
  );
}
