"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { getAuth } from "firebase/auth";
import { haptic } from "@/lib/haptics";

interface Membre { id: string; prenom: string; statut: string; }

async function getIdToken(): Promise<string> {
  const u = getAuth().currentUser;
  return u ? u.getIdToken() : "";
}

const AVATAR_PALETTES = [
  { bg: "rgba(94,140,247,0.18)", text: "#5E8CF7" },
  { bg: "rgba(139,127,212,0.18)", text: "#9B8FE8" },
  { bg: "rgba(52,199,137,0.18)", text: "#34C789" },
  { bg: "rgba(247,133,110,0.18)", text: "#E8785E" },
  { bg: "rgba(240,160,96,0.18)", text: "#E0A060" },
  { bg: "rgba(112,184,232,0.18)", text: "#60B8E8" },
];

function avatarColor(initials: string) {
  const code = (initials.charCodeAt(0) || 0) + (initials.charCodeAt(1) || 0);
  return AVATAR_PALETTES[code % AVATAR_PALETTES.length];
}

function IosCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: "var(--glass-bg)", border: "1px solid var(--border)" }}>
      {children}
    </div>
  );
}

export default function EquipePage() {
  const { marchand, user } = useAuth();
  const router = useRouter();
  const m = marchand as Record<string, unknown>;
  const code = (m?.code_etablissement as string) || "";
  const [membres, setMembres] = useState<Membre[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [newPrenom, setNewPrenom] = useState("");
  const [newPin, setNewPin] = useState("");
  const [adding, setAdding] = useState(false);
  const [copied, setCopied] = useState(false);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [resetTarget, setResetTarget] = useState<string | null>(null);
  const [resetPin, setResetPin] = useState("");

  const loadMembres = useCallback(async () => {
    const token = await getIdToken();
    const res = await fetch("/api/equipe/membres", { headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) { const d = await res.json(); setMembres(d.membres || []); }
  }, []);

  useEffect(() => { if (user) loadMembres(); }, [user, loadMembres]);

  async function handleAddMembre(e: React.FormEvent) {
    e.preventDefault();
    if (!newPrenom || newPin.length !== 4) return;
    setAdding(true);
    const token = await getIdToken();
    await fetch("/api/equipe/membres", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ prenom: newPrenom, pin: newPin }) });
    setNewPrenom(""); setNewPin(""); setShowAdd(false); setAdding(false);
    loadMembres();
  }

  async function toggleStatut(membreId: string, statut: string) {
    const token = await getIdToken();
    await fetch("/api/equipe/membres", { method: "PATCH", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ membreId, action: statut === "actif" ? "desactiver" : "activer" }) });
    loadMembres(); setMenuOpen(null);
  }

  async function handleResetPin(membreId: string) {
    if (resetPin.length !== 4) return;
    const token = await getIdToken();
    await fetch("/api/equipe/membres", { method: "PATCH", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ membreId, action: "reset_pin", pin: resetPin }) });
    setResetTarget(null); setResetPin(""); loadMembres();
  }

  function copyCode() {
    navigator.clipboard.writeText(code).then(() => { setCopied(true); haptic("light"); setTimeout(() => setCopied(false), 1500); });
  }

  return (
    <div className="px-5 md:px-8 lg:px-10 pt-8 lg:pt-10 pb-32 md:pb-10 max-w-xl">
      <button onClick={() => router.back()}
        className="flex items-center gap-2 mb-6"
        style={{ background: "none", border: "none", cursor: "pointer", color: "var(--accent)", padding: 0, fontSize: 16, fontWeight: 500 }}>
        <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6"/>
        </svg>
        Retour
      </button>
      <h1 className="text-[34px] font-bold tracking-[-1px] mb-8" style={{ color: "var(--fg)" }}>Gestion équipe</h1>

      <IosCard>
        {/* Code établissement */}
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
          <div>
            <p className="text-[12px] mb-0.5" style={{ color: "var(--fg-tertiary)" }}>Code établissement</p>
            <p className="text-[28px] font-bold tracking-[0.25em]" style={{ color: "var(--fg)", fontVariantNumeric: "tabular-nums" }}>{code || "—"}</p>
          </div>
          <button onClick={copyCode}
            className="w-10 h-10 rounded-full flex items-center justify-center transition-all"
            style={{ background: copied ? "rgba(52,199,89,0.12)" : "var(--bg)", border: "1px solid var(--border)" }}>
            {copied ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#34C759" strokeWidth="2.5" strokeLinecap="round"><path d="M20 6 9 17l-5-5"/></svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" style={{ color: "var(--fg-secondary)" }}><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
            )}
          </button>
        </div>
        {[
          { label: "Scanner QR clients" },
          { label: "Voir la liste des clients" },
          { label: "Tampon manuel", last: true },
        ].map(({ label, last }) => (
          <div key={label} className="flex items-center justify-between px-5 py-3.5" style={{ borderBottom: last ? "none" : "1px solid var(--border)" }}>
            <span className="text-[14px]" style={{ color: "var(--fg)" }}>{label}</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#34C759" strokeWidth="2.5" strokeLinecap="round"><path d="M20 6 9 17l-5-5"/></svg>
          </div>
        ))}
      </IosCard>

      <div className="mt-4">
        <IosCard>
          {membres.map((mb, i) => {
            const initiales = mb.prenom[0]?.toUpperCase() || "?";
            const aColor = avatarColor(initiales);
            return (
              <div key={mb.id} style={{ borderBottom: i < membres.length - 1 || showAdd ? "1px solid var(--border)" : "none" }}>
                <div className="flex items-center gap-3 px-5 py-3.5">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-[13px] font-bold flex-shrink-0"
                    style={{ background: mb.statut === "actif" ? aColor.bg : "var(--border)", color: mb.statut === "actif" ? aColor.text : "var(--fg-tertiary)" }}>
                    {initiales}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-medium" style={{ color: mb.statut === "actif" ? "var(--fg)" : "var(--fg-tertiary)" }}>
                      {mb.prenom.charAt(0).toUpperCase() + mb.prenom.slice(1).toLowerCase()}
                    </p>
                    <p className="text-[11px]" style={{ color: mb.statut === "actif" ? "#34C759" : "var(--fg-tertiary)" }}>
                      {mb.statut === "actif" ? "Actif" : "Désactivé"}
                    </p>
                  </div>
                  <div className="relative">
                    <button onClick={() => setMenuOpen(menuOpen === mb.id ? null : mb.id)}
                      className="w-8 h-8 rounded-full flex items-center justify-center"
                      style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="none" style={{ color: "var(--fg-tertiary)" }}>
                        <circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/>
                      </svg>
                    </button>
                    {menuOpen === mb.id && (
                      <div className="absolute right-0 top-9 rounded-2xl overflow-hidden z-10 shadow-lg" style={{ background: "var(--bg)", border: "1px solid var(--border)", minWidth: 160 }}>
                        <button onClick={() => { setResetTarget(mb.id); setMenuOpen(null); }}
                          className="w-full px-4 py-3 text-left text-[13px]" style={{ color: "var(--fg)", borderBottom: "1px solid var(--border)" }}>
                          Changer le PIN
                        </button>
                        <button onClick={() => toggleStatut(mb.id, mb.statut)}
                          className="w-full px-4 py-3 text-left text-[13px]"
                          style={{ color: mb.statut === "actif" ? "#FF3B30" : "#34C759" }}>
                          {mb.statut === "actif" ? "Désactiver" : "Activer"}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                {resetTarget === mb.id && (
                  <div className="flex gap-2 px-5 pb-3">
                    <input type="password" inputMode="numeric" placeholder="Nouveau PIN" maxLength={4}
                      value={resetPin} onChange={e => setResetPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                      className="flex-1 px-3 py-2 rounded-xl text-[13px] outline-none"
                      style={{ background: "var(--glass-bg)", border: "1px solid var(--border)", color: "var(--fg)" }} />
                    <button onClick={() => handleResetPin(mb.id)} disabled={resetPin.length !== 4}
                      className="px-4 py-2 rounded-xl text-[13px] font-semibold text-white"
                      style={{ background: "var(--accent)", opacity: resetPin.length !== 4 ? 0.4 : 1 }}>OK</button>
                  </div>
                )}
              </div>
            );
          })}
          {membres.length === 0 && (
            <div className="px-5 py-4">
              <p className="text-[13px]" style={{ color: "var(--fg-tertiary)" }}>Aucun membre pour l&apos;instant</p>
            </div>
          )}
          {!showAdd ? (
            <button onClick={() => setShowAdd(true)}
              className="w-full flex items-center gap-2 px-5 py-4 text-left"
              style={{ borderTop: membres.length > 0 ? "1px solid var(--border)" : "none" }}>
              <span className="text-[15px] font-medium" style={{ color: "var(--accent)" }}>+ Ajouter un membre</span>
            </button>
          ) : (
            <form onSubmit={handleAddMembre} className="px-5 py-4 space-y-3" style={{ borderTop: "1px solid var(--border)" }}>
              <input type="text" placeholder="Prénom" required value={newPrenom} onChange={e => setNewPrenom(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl text-[14px] outline-none"
                style={{ background: "var(--glass-bg)", border: "1px solid var(--border)", color: "var(--fg)" }} />
              <input type="password" inputMode="numeric" placeholder="PIN 4 chiffres" maxLength={4} required
                value={newPin} onChange={e => setNewPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                className="w-full px-3 py-2.5 rounded-xl text-[14px] outline-none"
                style={{ background: "var(--glass-bg)", border: "1px solid var(--border)", color: "var(--fg)" }} />
              <div className="flex gap-2">
                <button type="button" onClick={() => setShowAdd(false)}
                  className="flex-1 py-2.5 rounded-xl text-[14px] font-medium"
                  style={{ background: "var(--glass-bg)", border: "1px solid var(--border)", color: "var(--fg)" }}>
                  Annuler
                </button>
                <button type="submit" disabled={adding || newPin.length !== 4}
                  className="flex-1 py-2.5 rounded-xl text-[14px] font-semibold text-white"
                  style={{ background: "var(--accent)", opacity: adding ? 0.7 : 1 }}>
                  {adding ? "Ajout…" : "Ajouter"}
                </button>
              </div>
            </form>
          )}
        </IosCard>
      </div>
    </div>
  );
}

import React from "react";
