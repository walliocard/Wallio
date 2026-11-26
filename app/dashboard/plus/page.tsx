"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { saveMarchandFields } from "@/lib/save-marchand";
import CompactHeader from "@/components/dashboard/CompactHeader";

const VERSION = "1.3";
const CHIP_BG = "#EEF0FF";
const CHIP_FG = "#5B7CFA";
const VIOLET = "#9E8BD6"; // toggle actif — violet fade

function ChevronRight() {
  return (
    <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="var(--fg-tertiary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

function Chip({ children, bg = CHIP_BG }: { children: React.ReactNode; bg?: string }) {
  return (
    <div style={{ width: 27, height: 27, borderRadius: 8, background: bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
      {children}
    </div>
  );
}

function SectionLabel({ title }: { title: string }) {
  return (
    <p style={{ fontSize: 10.5, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--fg-tertiary)", margin: "16px 4px 6px" }}>
      {title}
    </p>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ background: "var(--glass-bg)", borderRadius: 16, overflow: "hidden", border: "1px solid var(--border)" }}>
      {children}
    </div>
  );
}

function LinkRow({ href, label, right, icon, last }: {
  href: string; label: string; right?: React.ReactNode; icon: React.ReactNode; last?: boolean;
}) {
  const external = href.startsWith("http");
  const inner = (
    <>
      <Chip>{icon}</Chip>
      <span style={{ flex: 1, minWidth: 0, fontSize: 14, fontWeight: 500, color: "var(--fg)" }}>{label}</span>
      {right != null && <span style={{ fontSize: 12.5, color: "var(--fg-tertiary)", maxWidth: 150, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{right}</span>}
      <ChevronRight />
    </>
  );
  const style: React.CSSProperties = { display: "flex", alignItems: "center", gap: 11, padding: "8px 14px", textDecoration: "none", borderBottom: last ? "none" : "1px solid var(--border)" };
  return external
    ? <a href={href} style={style}>{inner}</a>
    : <Link href={href} style={style}>{inner}</Link>;
}

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button type="button" onClick={() => onChange(!on)} aria-pressed={on}
      style={{ width: 46, height: 28, borderRadius: 999, background: on ? VIOLET : "rgba(120,120,128,0.32)", border: "none", position: "relative", cursor: "pointer", transition: "background 0.2s", flexShrink: 0 }}>
      <span style={{ position: "absolute", top: 2, left: 2, width: 24, height: 24, borderRadius: "50%", background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.2)", transform: on ? "translateX(18px)" : "none", transition: "transform 0.2s" }} />
    </button>
  );
}

function ToggleRow({ label, sub, icon, on, onChange, last }: {
  label: string; sub?: string; icon: React.ReactNode; on: boolean; onChange: (v: boolean) => void; last?: boolean;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 11, padding: "7px 14px", borderBottom: last ? "none" : "1px solid var(--border)" }}>
      <Chip>{icon}</Chip>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 14, fontWeight: 500, color: "var(--fg)", margin: 0 }}>{label}</p>
        {sub && <p style={{ fontSize: 11.5, color: "var(--fg-tertiary)", margin: "1px 0 0" }}>{sub}</p>}
      </div>
      <Toggle on={on} onChange={onChange} />
    </div>
  );
}

// ─── Icônes (trait lavande) ───────────────────────────────────────────────────
const S = { width: 15, height: 15, viewBox: "0 0 24 24", fill: "none" as const, stroke: CHIP_FG, strokeWidth: 1.75, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
const IconTarget = <svg {...S}><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1.5" fill={CHIP_FG} stroke="none" /></svg>;
const IconCard = <svg {...S}><rect x="2" y="5" width="20" height="14" rx="2" /><line x1="2" y1="10" x2="22" y2="10" /></svg>;
const IconStore = <svg {...S}><path d="M3 9l1.5-5h15L21 9" /><path d="M4 9v10a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V9" /><path d="M9 20v-6h6v6" /></svg>;
const IconCake = <svg {...S}><path d="M20 21v-8a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8" /><path d="M4 16s.5-1 2-1 2.5 1.5 4 1.5 2.5-1.5 4-1.5 2.5 1.5 4 1.5 2-1 2-1" /><path d="M2 21h20" /><path d="M7 8v3M12 8v3M17 8v3" /><path d="M7 4v.5M12 4v.5M17 4v.5" /></svg>;
const IconBell = <svg {...S}><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg>;
const IconGift = <svg {...S}><rect x="3" y="8" width="18" height="4" rx="1" /><path d="M12 8v13" /><path d="M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7" /><path d="M7.5 8a2.5 2.5 0 0 1 0-5C11 3 12 8 12 8s1-5 4.5-5a2.5 2.5 0 0 1 0 5" /></svg>;
const IconSliders = <svg {...S}><line x1="4" y1="6" x2="20" y2="6" /><circle cx="9" cy="6" r="2" /><line x1="4" y1="12" x2="20" y2="12" /><circle cx="15" cy="12" r="2" /><line x1="4" y1="18" x2="20" y2="18" /><circle cx="8" cy="18" r="2" /></svg>;
const IconTeam = <svg {...S}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></svg>;
const IconHistory = <svg {...S}><polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 1 0 .49-4.95" /><polyline points="12 7 12 12 15 15" /></svg>;
const IconHelp = <svg {...S}><circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>;
const IconLogout = <svg {...S} stroke="#FF3B30"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>;

export default function PlusPage() {
  const { marchand, user } = useAuth();
  const router = useRouter();
  const titleRef = useRef<HTMLHeadingElement>(null);
  const mn = (marchand || {}) as Record<string, unknown>;
  const hasEquipe = !!mn.equipe_actif;

  const modeLabel = mn.mode_recompense === "progressif" ? "Progressif"
    : mn.mode_recompense === "flex" ? "Flex" : "Cyclique";
  const objectif = (mn.objectif_tampons as number) || 10;
  const nomEtab = (mn.nom as string) || "";

  // ── Engagement clients — toggles synchronisés avec Réglages (mêmes champs Firestore)
  const auto = (mn.automatisations as Record<string, { actif?: boolean } & Record<string, unknown>> | undefined) || {};
  const [anniv, setAnniv] = useState(!!auto.anniversaire?.actif);
  const [relance, setRelance] = useState(!!auto.relance?.actif);
  const [parrain, setParrain] = useState(!!mn.parrainage_actif);
  useEffect(() => {
    setAnniv(!!auto.anniversaire?.actif);
    setRelance(!!auto.relance?.actif);
    setParrain(!!mn.parrainage_actif);
  }, [auto.anniversaire?.actif, auto.relance?.actif, mn.parrainage_actif]);

  async function toggleAuto(key: "anniversaire" | "relance", next: boolean) {
    if (!user) return;
    if (key === "anniversaire") setAnniv(next); else setRelance(next);
    const cur = (mn.automatisations as Record<string, Record<string, unknown>> | undefined) || {};
    const updated = {
      anniversaire: { actif: false, jours_avant: 0, message: "", type: "double", offre: "", ...cur.anniversaire },
      relance: { actif: false, delai_jours: 30, message: "", ...cur.relance },
    };
    updated[key].actif = next;
    try {
      await saveMarchandFields(user, { automatisations: updated });
    } catch {
      if (key === "anniversaire") setAnniv(!next); else setRelance(!next);
    }
  }

  async function toggleParrain(next: boolean) {
    if (!user) return;
    setParrain(next);
    try { await saveMarchandFields(user, { parrainage_actif: next }); }
    catch { setParrain(!next); }
  }

  // Nombre de membres
  const [membreCount, setMembreCount] = useState<number | null>(null);
  useEffect(() => {
    if (!hasEquipe || !user) return;
    let alive = true;
    (async () => {
      try {
        const token = await user.getIdToken();
        const res = await fetch("/api/equipe/membres", { headers: { Authorization: `Bearer ${token}` } });
        if (res.ok && alive) { const d = await res.json(); setMembreCount((d.membres || []).length); }
      } catch {}
    })();
    return () => { alive = false; };
  }, [hasEquipe, user]);

  async function handleSignOut() {
    await signOut(auth);
    router.push("/dashboard/auth");
  }

  const relanceJours = (auto.relance?.delai_jours as number | undefined) ?? 30;

  return (
    <div>
      <CompactHeader title="Compte" observeRef={titleRef} />
      <div style={{ padding: "calc(env(safe-area-inset-top) + 20px) 20px 120px", maxWidth: 430, margin: "0 auto" }}>

        <h1 ref={titleRef} style={{ fontSize: 34, fontWeight: 700, letterSpacing: "-0.5px", color: "var(--fg)", marginBottom: 2 }}>
          Compte
        </h1>

        <SectionLabel title="Configuration" />
        <Card>
          <LinkRow href="/dashboard/reglages?section=programme" label="Programme de fidélité" right={`${modeLabel} · ${objectif}`} icon={IconTarget} />
          <LinkRow href="/dashboard/carte" label="Ma carte" right="Personnaliser" icon={IconCard} />
          <LinkRow href="/dashboard/reglages?section=etablissement" label="Établissement" right={nomEtab || "Nom, langue"} icon={IconStore} last />
        </Card>

        <SectionLabel title="Engagement clients" />
        <Card>
          <ToggleRow label="Anniversaire" sub="Offre le jour de l'anniversaire" icon={IconCake}
            on={anniv} onChange={v => toggleAuto("anniversaire", v)} />
          <ToggleRow label={`Relance ${relanceJours} jours`} sub="Rappel aux clients inactifs" icon={IconBell}
            on={relance} onChange={v => toggleAuto("relance", v)} />
          <ToggleRow label="Parrainage" sub="Les clients invitent leurs amis" icon={IconGift}
            on={parrain} onChange={toggleParrain} />
          <LinkRow href="/dashboard/reglages?section=engagement" label="Personnaliser les messages" icon={IconSliders} last />
        </Card>

        {hasEquipe && (
          <>
            <SectionLabel title="Équipe" />
            <Card>
              <LinkRow href="/dashboard/equipe" label="Gestion équipe"
                right={membreCount != null ? `${membreCount} membre${membreCount > 1 ? "s" : ""}` : undefined}
                icon={IconTeam} last />
            </Card>
          </>
        )}

        <SectionLabel title="Activité" />
        <Card>
          <LinkRow href="/dashboard/historique" label="Historique" right="Scans & tampons" icon={IconHistory} last />
        </Card>

        <SectionLabel title="Support" />
        <Card>
          <LinkRow href="https://wa.me/212654768191" label="Aide et support" right="WhatsApp" icon={IconHelp} last />
        </Card>

        <div style={{ marginTop: 14 }}>
          <Card>
            <button onClick={handleSignOut}
              style={{ display: "flex", alignItems: "center", gap: 11, padding: "8px 14px", width: "100%", background: "none", border: "none", cursor: "pointer", textAlign: "left" }}>
              <Chip bg="rgba(255,59,48,0.1)">{IconLogout}</Chip>
              <span style={{ fontSize: 14, fontWeight: 500, color: "#FF3B30" }}>Déconnexion</span>
            </button>
          </Card>
        </div>

        <p style={{ textAlign: "center", fontSize: 12, color: "var(--fg-tertiary)", marginTop: 28 }}>
          Wallio {VERSION}
        </p>
      </div>
    </div>
  );
}
