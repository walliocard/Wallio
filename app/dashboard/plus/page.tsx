"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";
import CompactHeader from "@/components/dashboard/CompactHeader";
import { SmokeCard } from "@/components/dashboard/SmokeCard";

const VERSION = "1.3";

const ICO = "#4B4FD6";
const ICO_BG = "#EEF0FF";

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
      <div style={{ width: 36, height: 36, borderRadius: 10, background: ICO_BG, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
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

// ── Miniature carte Wallet ────────────────────────────────────────────────────

function WalletThumb({ marchand }: { marchand: Record<string, unknown> }) {
  const bg = (marchand.couleur_principale as string) || "#2F7BFF";
  const fg = (marchand.couleur_secondaire as string) || "#FFFFFF";
  const logo = marchand.logo_url as string | undefined;
  const nom = marchand.nom as string || "";

  return (
    <Link href="/dashboard/carte" style={{ textDecoration: "none", flexShrink: 0 }}>
      <div style={{
        width: 100, height: 60,
        borderRadius: 10,
        background: bg,
        boxShadow: "0 6px 18px rgba(0,0,0,0.18)",
        transform: "rotate(-4deg)",
        display: "flex", flexDirection: "column",
        justifyContent: "space-between",
        padding: "8px 10px",
        overflow: "hidden",
        position: "relative",
      }}>
        {/* Halo discret */}
        <div style={{ position: "absolute", top: -20, right: -20, width: 70, height: 70, borderRadius: "50%", background: "rgba(255,255,255,0.12)", pointerEvents: "none" }} />
        {/* Logo */}
        <div style={{ width: 20, height: 20, borderRadius: 5, overflow: "hidden", background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          {logo
            // eslint-disable-next-line @next/next/no-img-element
            ? <img src={logo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            : <span style={{ fontSize: 9, fontWeight: 700, color: "white" }}>{nom[0]?.toUpperCase()}</span>
          }
        </div>
        {/* Nom */}
        <p style={{ fontSize: 8, fontWeight: 600, color: fg, opacity: 0.9, margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {nom}
        </p>
      </div>
    </Link>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function PlusPage() {
  const { user, marchand } = useAuth();
  const router = useRouter();
  const titleRef = useRef<HTMLHeadingElement>(null);
  const [clientCount, setClientCount] = useState<number | null>(null);

  const hasEquipe = !!(marchand as Record<string, unknown>)?.equipe_actif;

  useEffect(() => {
    if (!user) return;
    getDocs(query(collection(db, "clients"), where("marchand_id", "==", user.uid)))
      .then(snap => setClientCount(snap.size))
      .catch(() => {});
  }, [user?.uid]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSignOut() {
    await signOut(auth);
    router.push("/dashboard/auth");
  }

  const m = marchand as Record<string, unknown> | undefined;
  const progLabel = (() => {
    const mode = m?.mode_recompense as string | undefined;
    if (mode === "flex") return "Programme Flex";
    if (mode === "progressif") return "Programme progressif";
    return "Programme fidélité";
  })();

  const metaLine = [
    clientCount !== null ? `${clientCount} client${clientCount > 1 ? "s" : ""}` : null,
    progLabel,
  ].filter(Boolean).join(" · ");

  const ITEMS = [
    {
      href: "/dashboard/reglages",
      label: "Réglages",
      sub: "Fidélité, établissement",
      icon: (
        <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={ICO} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
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
        <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={ICO} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/>
        </svg>
      ),
    },
    ...(hasEquipe ? [{
      href: "/dashboard/equipe",
      label: "Gestion équipe",
      sub: "Membres, code d'accès",
      icon: (
        <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={ICO} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
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
      icon: (
        <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={ICO} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="1 4 1 10 7 10"/>
          <path d="M3.51 15a9 9 0 1 0 .49-4.95"/>
          <polyline points="12 7 12 12 15 15"/>
        </svg>
      ),
    },
  ];

  return (
    <div>
      <CompactHeader title={marchand?.nom || "Plus"} observeRef={titleRef} />
      <div style={{ padding: "calc(env(safe-area-inset-top) + 20px) 20px 120px", maxWidth: 430, margin: "0 auto" }}>

        {/* Carte identité commerçant */}
        {marchand && (
          <SmokeCard style={{ marginBottom: 24, padding: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16, justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14, minWidth: 0 }}>
                {/* Logo */}
                <div style={{ width: 56, height: 56, borderRadius: 16, overflow: "hidden", background: "#EEF0FF", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, border: "1px solid rgba(75,79,214,0.12)" }}>
                  {m?.logo_url
                    // eslint-disable-next-line @next/next/no-img-element
                    ? <img src={m.logo_url as string} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    : <span style={{ fontSize: 24, fontWeight: 700, color: ICO }}>{(marchand.nom?.[0] || "W").toUpperCase()}</span>
                  }
                </div>
                {/* Infos */}
                <div style={{ minWidth: 0 }}>
                  <h1 ref={titleRef} style={{ fontSize: 22, fontWeight: 700, color: "var(--fg)", letterSpacing: -0.4, margin: 0, lineHeight: 1.2 }}>
                    {marchand.nom}
                  </h1>
                  <p style={{ fontSize: 13, color: "#8E8E93", marginTop: 4 }}>{metaLine}</p>
                </div>
              </div>
              {/* Miniature carte */}
              {m && <WalletThumb marchand={m} />}
            </div>
          </SmokeCard>
        )}

        {/* Groupe principal */}
        <div style={{ background: "var(--glass-bg)", borderRadius: 16, overflow: "hidden", border: "1px solid var(--border)" }}>
          {ITEMS.map((item, i) => (
            <ItemRow key={item.href} {...item} last={i === ITEMS.length - 1} />
          ))}
        </div>

        {/* Groupe secondaire */}
        <div style={{ background: "var(--glass-bg)", borderRadius: 16, overflow: "hidden", border: "1px solid var(--border)", marginTop: 16 }}>
          <ItemRow
            href="https://wa.me/212654768191"
            label="Aide et support"
            sub="WhatsApp Wallio"
            icon={
              <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={ICO} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
                <line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
            }
          />
          <button
            onClick={handleSignOut}
            style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 16px", width: "100%", background: "none", border: "none", borderTop: "1px solid var(--border)", cursor: "pointer", textAlign: "left" }}
          >
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(255,59,48,0.10)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#FF3B30" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
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
