"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { haptic } from "@/lib/haptics";
import AmbientBackground from "@/components/AmbientBackground";
import OfflineBanner from "@/components/OfflineBanner";

interface EquipeSession {
  token: string;
  prenom: string;
  marchandId: string;
  marchandNom: string;
  logo_url?: string | null;
  permissions: { notifs: boolean; clients: boolean };
}

interface Client {
  id: string;
  wallet_id: string;
  prenom: string;
  nom: string;
  telephone: string;
  tampons: number;
  recompense_en_attente?: boolean;
  choix_en_attente?: boolean;
  choix_fait?: "petit" | "grand";
  birthday_bonus?: boolean;
  derniere_visite?: { seconds: number } | null;
}

interface TamponResult {
  type: "ok" | "recompense" | "choix_requis" | "anti_doublon" | "not_found";
  prenom?: string;
  tampons?: number;
  objectif?: number;
  nom_recompense?: string;
  prochain_recompense?: string;
  secondes_restantes?: number;
  clientId?: string;
  walletId?: string;
  mode_recompense?: string;
  palier_index?: number;
  paliers_valides?: boolean[];
  total_paliers?: number;
  palier_intermediaire?: number;
  nom_recompense_petit?: string;
  nom_recompense_grand?: string;
  birthday?: boolean;
  birthday_offre?: string;
}

interface MarchandConfig {
  mode_recompense: string;
  objectif_tampons: number;
  palier_intermediaire: number;
  nom_recompense: string;
  nom_recompense_petit: string;
  nom_recompense_grand: string;
  paliers?: { tampons: number; recompense: string }[];
}

const cap = (s: string) => s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : "";

const AVATAR_PALETTES = [
  { bg: "rgba(94,140,247,0.18)",  text: "#5E8CF7" },
  { bg: "rgba(139,127,212,0.18)", text: "#9B8FE8" },
  { bg: "rgba(52,199,137,0.18)",  text: "#34C789" },
  { bg: "rgba(247,133,110,0.18)", text: "#E8785E" },
  { bg: "rgba(240,160,96,0.18)",  text: "#E0A060" },
  { bg: "rgba(112,184,232,0.18)", text: "#60B8E8" },
];
function avatarColor(initials: string) {
  const code = (initials.charCodeAt(0) || 0) + (initials.charCodeAt(1) || 0);
  return AVATAR_PALETTES[code % AVATAR_PALETTES.length];
}

function formatDateShort(ts?: { seconds: number } | null): string {
  if (!ts) return "—";
  const date = new Date(ts.seconds * 1000);
  const sec = (Date.now() - ts.seconds * 1000) / 1000;
  if (sec < 86400) {
    const h = Math.floor(sec / 3600);
    if (h < 1) return `il y a ${Math.floor(sec / 60)} min`;
    return `il y a ${h} h`;
  }
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
  const dateDay = new Date(date); dateDay.setHours(0, 0, 0, 0);
  if (dateDay.getTime() === yesterday.getTime()) return "Hier";
  return date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

function formatTemps(sec: number): string {
  if (sec < 3600) return `${Math.ceil(sec / 60)} min`;
  return `${Math.ceil(sec / 3600)} h`;
}

function normalizePhone(raw: string): string {
  return raw.replace(/[\s\-\(\)]/g, "").replace(/^(00212|0212|\+212)/, "").replace(/^0/, "");
}

export default function EquipeClientsPage() {
  const router = useRouter();
  const [session, setSession] = useState<EquipeSession | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [annivCustom, setAnnivCustom] = useState(false);
  const [marchandConfig, setMarchandConfig] = useState<MarchandConfig | null>(null);
  // Sheet state
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [sheetResult, setSheetResult] = useState<TamponResult | null>(null);
  const [sheetStamping, setSheetStamping] = useState(false);
  const [sheetCheck, setSheetCheck] = useState(false);
  const [validatingId, setValidatingId] = useState<string | null>(null);
  // Flex 2-step confirmation
  const [flexPending, setFlexPending] = useState<"petit" | "grand" | null>(null);
  const flexTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Member menu
  const [showMemberSheet, setShowMemberSheet] = useState(false);
  const [showQuitConfirm, setShowQuitConfirm] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem("equipe_session");
    if (!raw) { router.replace("/equipe/auth"); return; }
    try {
      const s: EquipeSession = JSON.parse(raw);
      setSession(s);
      loadClients(s.token);
      fetch("/api/equipe/marchand", { headers: { "x-equipe-token": s.token } })
        .then(r => r.ok ? r.json() : null).then(d => { if (d) setMarchandConfig(d); }).catch(() => {});
      const onVisible = () => { if (document.visibilityState === "visible") loadClients(s.token); };
      document.addEventListener("visibilitychange", onVisible);
      return () => document.removeEventListener("visibilitychange", onVisible);
    } catch { router.replace("/equipe/auth"); }
  }, [router]); // eslint-disable-line

  async function loadClients(token: string) {
    setLoading(true);
    try {
      const res = await fetch("/api/equipe/clients", { headers: { "x-equipe-token": token } });
      if (res.ok) {
        const data = await res.json();
        setClients(data.clients || []);
        setAnnivCustom(data.anniv_custom || false);
      }
    } catch { /* silent */ }
    finally { setLoading(false); }
  }

  async function handleSheetTampon() {
    if (!selectedClient || !session || sheetStamping) return;
    setSheetStamping(true);
    try {
      const res = await fetch("/api/equipe/tampon", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-equipe-token": session.token },
        body: JSON.stringify({ walletId: selectedClient.wallet_id, manual: true }),
      });
      const data = await res.json();
      setSheetResult(data);
      if (data.type === "ok" || data.type === "recompense" || data.type === "choix_requis") {
        const updated = {
          ...selectedClient,
          tampons: data.tampons ?? selectedClient.tampons,
          ...(data.type === "recompense" ? { recompense_en_attente: true } : {}),
          ...(data.type === "choix_requis" ? { choix_en_attente: true } : {}),
        };
        setSelectedClient(updated);
        setClients(prev => prev.map(c => c.id === selectedClient.id ? updated : c));
      }
      if (data.type === "ok") {
        haptic("medium");
        setSheetCheck(true);
        setTimeout(() => { setSheetCheck(false); setSelectedClient(null); setSheetResult(null); }, 1500);
      }
    } catch { /* silent */ }
    finally { setSheetStamping(false); }
  }

  async function handleSheetValiderRecompense() {
    if (!selectedClient || !session || !sheetResult || validatingId) return;
    setValidatingId(selectedClient.id);
    try {
      const isProgressif = sheetResult.mode_recompense === "progressif" && sheetResult.palier_index !== undefined;
      const valRes = await fetch("/api/equipe/valider-recompense", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-equipe-token": session.token },
        body: JSON.stringify({
          clientId: sheetResult.clientId,
          mode: sheetResult.mode_recompense || "cyclique",
          palierIndex: isProgressif ? sheetResult.palier_index : undefined,
          paliersValides: isProgressif ? (sheetResult.paliers_valides || []) : undefined,
          totalPaliers: isProgressif ? sheetResult.total_paliers : undefined,
        }),
      });
      const valData = await valRes.json().catch(() => ({}));
      const nvt = typeof valData.nouveauxTampons === "number" ? valData.nouveauxTampons : 0;
      const updated = { ...selectedClient, tampons: nvt, recompense_en_attente: false, choix_fait: undefined, choix_en_attente: false };
      setSelectedClient(updated);
      setClients(prev => prev.map(c => c.id === selectedClient.id ? updated : c));
      haptic("success");
      setSheetResult(null);
      setTimeout(() => { setSelectedClient(null); }, 1000);
    } catch { /* silent */ }
    finally { setValidatingId(null); }
  }

  function handleFlexChoix(choix: "petit" | "grand") {
    if (flexPending === choix) {
      if (flexTimeoutRef.current) clearTimeout(flexTimeoutRef.current);
      setFlexPending(null);
      enregistrerChoix(choix);
    } else {
      setFlexPending(choix);
      if (flexTimeoutRef.current) clearTimeout(flexTimeoutRef.current);
      flexTimeoutRef.current = setTimeout(() => setFlexPending(null), 3000);
    }
  }

  async function enregistrerChoix(choix: "petit" | "grand") {
    if (!selectedClient || !session) return;
    try {
      const res = await fetch("/api/equipe/enregistrer-choix", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-equipe-token": session.token },
        body: JSON.stringify({ clientId: selectedClient.id, choix }),
      });
      const data = await res.json();
      if (data.ok || data.already_done) {
        const updated = { ...selectedClient, choix_en_attente: false, choix_fait: choix, recompense_en_attente: choix === "petit" };
        setSelectedClient(updated);
        setClients(prev => prev.map(c => c.id === selectedClient.id ? updated : c));
        if (choix === "petit") {
          setSheetResult(prev => prev ? { ...prev, type: "recompense", nom_recompense: prev.nom_recompense_petit || prev.nom_recompense_petit } : prev);
          haptic("success");
        } else {
          setSheetResult(null);
        }
      }
    } catch { /* silent */ }
  }

  async function handleLogout() {
    if (session) fetch("/api/equipe/session", { method: "DELETE", headers: { "x-equipe-token": session.token } }).catch(() => {});
    localStorage.removeItem("equipe_session");
    router.replace("/equipe/auth");
  }

  async function handleChanger() {
    if (session) {
      try {
        const res = await fetch("/api/equipe/session-info", { headers: { "x-equipe-token": session.token } });
        if (res.ok) { const d = await res.json(); localStorage.setItem("equipe_etablissement", JSON.stringify(d)); }
      } catch { /* silent */ }
      fetch("/api/equipe/session", { method: "DELETE", headers: { "x-equipe-token": session.token } }).catch(() => {});
    }
    localStorage.removeItem("equipe_session");
    router.replace("/equipe/auth?changer=1");
  }

  if (!session) return null;

  const objectifDefault = marchandConfig?.objectif_tampons || 10;
  const mode = marchandConfig?.mode_recompense || "cyclique";

  function getObjectif(c: Client): number {
    if (mode === "flex") {
      return c.choix_fait === "grand" ? objectifDefault : (marchandConfig?.palier_intermediaire || Math.ceil(objectifDefault / 2));
    }
    return objectifDefault;
  }

  const filtered = clients
    .filter(c => {
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      const name = `${c.prenom} ${c.nom}`.toLowerCase();
      const phone = normalizePhone(c.telephone);
      const qPhone = normalizePhone(search);
      return name.includes(q) || phone.includes(qPhone) || c.telephone.includes(search);
    })
    .sort((a, b) => ((b.derniere_visite?.seconds || 0) - (a.derniere_visite?.seconds || 0)));

  const hour = new Date().getHours();
  const greeting = hour >= 18 || hour < 5 ? "Bonsoir" : "Bonjour";
  const initiales = session.prenom[0]?.toUpperCase() || "?";
  const aColor = avatarColor(initiales);
  const pendingCount = clients.filter(c => c.recompense_en_attente || c.choix_en_attente).length;

  // Selected client objectif for the sheet
  const sheetObjectif = selectedClient ? getObjectif(selectedClient) : 10;
  const sheetPct = selectedClient ? Math.min(100, (selectedClient.tampons / sheetObjectif) * 100) : 0;

  return (
    <main style={{ height: "100svh", display: "flex", flexDirection: "column", background: "var(--bg)", paddingTop: "env(safe-area-inset-top)", position: "relative" }}>
      <OfflineBanner />

      {/* Fondu fumé */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 280, zIndex: 0, pointerEvents: "none" }}>
        <AmbientBackground variant="subtle" />
      </div>

      {/* Header */}
      <div style={{ position: "relative", zIndex: 1, display: "flex", alignItems: "center", padding: "14px 20px 10px", gap: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 0 }}>
          {session.logo_url && (
            <img src={session.logo_url} alt="" style={{ width: 32, height: 32, borderRadius: 9, objectFit: "cover", flexShrink: 0 }} />
          )}
          <div style={{ minWidth: 0 }}>
            <p style={{ fontSize: 11, color: "var(--fg-tertiary)", letterSpacing: "0.03em" }}>{session.marchandNom}</p>
            <p style={{ fontSize: 17, fontWeight: 700, color: "var(--fg)", letterSpacing: -0.3 }}>{greeting}, {cap(session.prenom)}</p>
          </div>
        </div>
        <button onClick={() => setShowMemberSheet(true)}
          style={{ width: 36, height: 36, borderRadius: "50%", background: aColor.bg, color: aColor.text, border: "none", cursor: "pointer", fontSize: 15, fontWeight: 700, flexShrink: 0 }}>
          {initiales}
        </button>
      </div>

      {/* Title + search */}
      <div style={{ position: "relative", zIndex: 1, padding: "4px 20px 10px" }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: -0.5, color: "var(--fg)", marginBottom: 2 }}>Clients</h1>
        <p style={{ fontSize: 13, color: "var(--fg-tertiary)", marginBottom: 10 }}>{clients.length} client{clients.length > 1 ? "s" : ""}</p>
        <div style={{ position: "relative" }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--fg-tertiary)" strokeWidth="2" strokeLinecap="round" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}>
            <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
          </svg>
          <input
            type="search" placeholder="Nom ou téléphone…" value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ width: "100%", padding: "11px 16px 11px 36px", borderRadius: 14, fontSize: 15, outline: "none", background: "var(--glass-bg)", border: "1px solid var(--border)", color: "var(--fg)", boxSizing: "border-box", WebkitAppearance: "none" }}
          />
        </div>
      </div>

      {/* Liste */}
      <div style={{ flex: 1, overflow: "auto", padding: "0 16px 8px", position: "relative", zIndex: 1 }}>
        {loading ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", paddingTop: 60 }}>
            <div style={{ width: 28, height: 28, borderRadius: "50%", border: "2.5px solid var(--border)", borderTopColor: "var(--accent)", animation: "spin 0.7s linear infinite" }} />
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", paddingTop: 60, gap: 12, textAlign: "center" }}>
            <svg width="56" height="56" viewBox="0 0 80 80" fill="none">
              <circle cx="40" cy="40" r="36" stroke="var(--border)" strokeWidth="2"/>
              <circle cx="34" cy="34" r="12" stroke="url(#eg)" strokeWidth="2"/>
              <path d="M43 43l10 10" stroke="url(#eg)" strokeWidth="2.5" strokeLinecap="round"/>
              <defs><linearGradient id="eg" x1="24" y1="24" x2="56" y2="56" gradientUnits="userSpaceOnUse"><stop stopColor="#2F7BFF"/><stop offset="1" stopColor="#8B5CF6"/></linearGradient></defs>
            </svg>
            <div>
              <p style={{ fontSize: 16, fontWeight: 600, color: "var(--fg)", marginBottom: 4 }}>Aucun client trouvé</p>
              {search && <p style={{ fontSize: 13, color: "var(--fg-tertiary)" }}>Essayez sans espace ni indicatif</p>}
            </div>
          </div>
        ) : (
          <div style={{ background: "var(--glass-bg)", borderRadius: 20, border: "1px solid var(--border)", overflow: "hidden" }}>
            {filtered.map((c, i) => {
              const obj = getObjectif(c);
              const pct = Math.min(100, (c.tampons / obj) * 100);
              const initials = `${c.prenom[0] || ""}${c.nom[0] || ""}`.toUpperCase();
              const aCol = avatarColor(initials);
              const hasPending = c.recompense_en_attente || c.choix_en_attente;
              return (
                <button key={c.id}
                  onClick={() => { setSelectedClient(c); setSheetResult(null); setFlexPending(null); setSheetCheck(false); }}
                  style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", background: "none", border: "none", borderBottom: i < filtered.length - 1 ? "1px solid var(--border)" : "none", cursor: "pointer", textAlign: "left" }}>
                  <div style={{ width: 40, height: 40, borderRadius: "50%", background: hasPending ? "linear-gradient(135deg,#2F7BFF,#8B5CF6)" : aCol.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: hasPending ? "white" : aCol.text }}>{initials}</span>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 15, fontWeight: 500, color: "var(--fg)", marginBottom: 1 }}>{cap(c.prenom)} {cap(c.nom)}</p>
                    <p style={{ fontSize: 12, color: "var(--fg-tertiary)" }}>{formatDateShort(c.derniere_visite)}</p>
                  </div>
                  <div style={{ flexShrink: 0, textAlign: "right" }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: "var(--fg)", marginBottom: 3 }}>{c.tampons}/{obj}</p>
                    <div style={{ width: 48, height: 3, borderRadius: 99, background: "var(--border)", overflow: "hidden" }}>
                      <div style={{ height: "100%", borderRadius: 99, background: "linear-gradient(90deg,#2F7BFF,#8B5CF6)", width: `${pct}%`, transition: "width 0.4s ease" }} />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <EquipeNav active="clients" session={session} clientsBadge={pendingCount} />

      {/* Bottom sheet — fiche client */}
      {selectedClient && (
        <div style={{ position: "fixed", inset: 0, zIndex: 50, background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)" }}
          onClick={() => { setSelectedClient(null); setSheetResult(null); setFlexPending(null); }}>
          <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "var(--bg)", borderRadius: "24px 24px 0 0", paddingBottom: "max(24px, env(safe-area-inset-bottom))", animation: "slide-up 0.3s cubic-bezier(0.34,1.06,0.64,1)", boxShadow: "0 -4px 40px rgba(0,0,0,0.15)" }}
            onClick={e => e.stopPropagation()}>
            <div style={{ width: 36, height: 4, borderRadius: 99, background: "var(--border)", margin: "12px auto 20px" }} />
            <div style={{ padding: "0 20px 20px" }}>

              {/* Client info */}
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
                {(() => {
                  const initials = `${selectedClient.prenom[0] || ""}${selectedClient.nom[0] || ""}`.toUpperCase();
                  const aCol = avatarColor(initials);
                  return (
                    <div style={{ width: 48, height: 48, borderRadius: "50%", background: aCol.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <span style={{ fontSize: 17, fontWeight: 700, color: aCol.text }}>{initials}</span>
                    </div>
                  );
                })()}
                <div>
                  <p style={{ fontSize: 18, fontWeight: 700, color: "var(--fg)", letterSpacing: -0.3 }}>{cap(selectedClient.prenom)} {cap(selectedClient.nom)}</p>
                  <p style={{ fontSize: 13, color: "var(--fg-tertiary)" }}>Dernière visite {formatDateShort(selectedClient.derniere_visite)}</p>
                </div>
              </div>

              {/* Progression */}
              <div style={{ marginBottom: 20 }}>
                {sheetObjectif <= 12 ? (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center" }}>
                    {Array.from({ length: sheetObjectif }).map((_, i) => (
                      <div key={i} style={{
                        width: 32, height: 32, borderRadius: "50%",
                        background: i < selectedClient.tampons ? "linear-gradient(135deg,#2F7BFF,#8B5CF6)" : "transparent",
                        border: i < selectedClient.tampons ? "none" : "1.5px solid var(--border)",
                        boxShadow: i < selectedClient.tampons ? "0 2px 8px rgba(139,92,246,0.35)" : "none",
                        animation: sheetCheck && i === selectedClient.tampons - 1 ? "success-pop 0.4s cubic-bezier(0.34,1.56,0.64,1)" : undefined,
                        transition: "all 0.3s ease",
                      }} />
                    ))}
                  </div>
                ) : (
                  <div>
                    <div style={{ height: 8, borderRadius: 99, background: "var(--border)", overflow: "hidden", marginBottom: 8 }}>
                      <div style={{ height: "100%", borderRadius: 99, background: "linear-gradient(90deg,#2F7BFF,#8B5CF6)", width: `${sheetPct}%`, transition: "width 0.5s ease" }} />
                    </div>
                    <p style={{ fontSize: 13, color: "var(--fg-tertiary)", textAlign: "right" }}>{selectedClient.tampons} / {sheetObjectif}</p>
                  </div>
                )}
              </div>

              {/* Résultat anti-doublon */}
              {sheetResult?.type === "anti_doublon" && (
                <div style={{ padding: "12px 16px", borderRadius: 16, background: "rgba(255,159,10,0.08)", border: "1px solid rgba(255,159,10,0.2)", marginBottom: 16 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FF9F0A" strokeWidth="2" strokeLinecap="round" style={{ flexShrink: 0, marginTop: 1 }}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                    <div>
                      <p style={{ fontSize: 14, fontWeight: 600, color: "#FF9F0A" }}>Tampon déjà ajouté</p>
                      {(sheetResult.secondes_restantes ?? 0) > 0 && (
                        <p style={{ fontSize: 12, color: "var(--fg-tertiary)", marginTop: 2 }}>Prochain dans {formatTemps(sheetResult.secondes_restantes ?? 0)}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Récompense */}
              {(sheetResult?.type === "recompense" || selectedClient.recompense_en_attente) && (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ padding: "12px 16px", borderRadius: 16, background: "rgba(52,199,89,0.08)", border: "1px solid rgba(52,199,89,0.2)", marginBottom: 10 }}>
                    <p style={{ fontSize: 14, fontWeight: 600, color: "#34C759" }}>
                      Récompense a remettre : {cap(sheetResult?.nom_recompense || "")}
                    </p>
                  </div>
                  <button onClick={handleSheetValiderRecompense} disabled={!!validatingId}
                    style={{ width: "100%", padding: "16px", borderRadius: 18, fontSize: 16, fontWeight: 700, background: "#34C759", color: "white", border: "none", cursor: "pointer", opacity: validatingId ? 0.7 : 1 }}>
                    {validatingId ? "Validation…" : "Valider la récompense"}
                  </button>
                </div>
              )}

              {/* Choix Flex */}
              {(sheetResult?.type === "choix_requis" || selectedClient.choix_en_attente) && mode === "flex" && !selectedClient.recompense_en_attente && (
                <div style={{ marginBottom: 16 }}>
                  <p style={{ fontSize: 15, fontWeight: 600, color: "var(--fg)", marginBottom: 4 }}>{cap(selectedClient.prenom)} a {selectedClient.tampons} tampons</p>
                  <p style={{ fontSize: 13, color: "var(--fg-tertiary)", marginBottom: 14 }}>Que choisit-il ?</p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    <button onClick={() => handleFlexChoix("petit")}
                      style={{ padding: "16px", borderRadius: 18, fontSize: 15, fontWeight: 700, background: flexPending === "petit" ? "#FF9F0A" : "linear-gradient(135deg,#2F7BFF,#8B5CF6)", color: "white", border: "none", cursor: "pointer", transition: "background 0.2s" }}>
                      {flexPending === "petit"
                        ? `Confirmer : ${cap(marchandConfig?.nom_recompense_petit || "Petite récompense")}`
                        : cap(marchandConfig?.nom_recompense_petit || "Petite récompense")}
                    </button>
                    <button onClick={() => handleFlexChoix("grand")}
                      style={{ padding: "14px", borderRadius: 18, fontSize: 15, fontWeight: 600, background: flexPending === "grand" ? "#FF9F0A" : "var(--glass-bg)", color: flexPending === "grand" ? "white" : "var(--fg)", border: "1px solid var(--border)", cursor: "pointer", transition: "all 0.2s" }}>
                      {flexPending === "grand"
                        ? `Confirmer : Continuer`
                        : `Continuer vers ${cap(marchandConfig?.nom_recompense_grand || "Grande récompense")}`}
                    </button>
                  </div>
                </div>
              )}

              {/* CTA principal */}
              {!selectedClient.recompense_en_attente && !selectedClient.choix_en_attente && sheetResult?.type !== "recompense" && (
                <button onClick={handleSheetTampon}
                  disabled={sheetStamping || sheetCheck}
                  style={{ width: "100%", padding: "17px", borderRadius: 20, fontSize: 17, fontWeight: 700, background: "linear-gradient(135deg,#2F7BFF,#8B5CF6)", color: "white", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, opacity: sheetStamping || sheetCheck ? 0.85 : 1, boxShadow: "0 6px 20px rgba(47,123,255,0.30)" }}>
                  {sheetStamping ? (
                    <div style={{ width: 20, height: 20, borderRadius: "50%", border: "2.5px solid rgba(255,255,255,0.4)", borderTopColor: "white", animation: "spin 0.7s linear infinite" }} />
                  ) : sheetCheck ? (
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" style={{ animation: "checkmark 0.3s ease" }}><path d="M20 6 9 17l-5-5"/></svg>
                  ) : (
                    "Ajouter un tampon"
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Member sheet */}
      {showMemberSheet && (
        <div style={{ position: "fixed", inset: 0, zIndex: 60, background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)" }}
          onClick={() => { setShowMemberSheet(false); setShowQuitConfirm(false); }}>
          <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "var(--bg)", borderRadius: "24px 24px 0 0", paddingBottom: "max(16px, env(safe-area-inset-bottom))", animation: "slide-up 0.3s cubic-bezier(0.34,1.06,0.64,1)" }}
            onClick={e => e.stopPropagation()}>
            <div style={{ width: 36, height: 4, borderRadius: 99, background: "var(--border)", margin: "12px auto 16px" }} />
            <div style={{ padding: "0 16px 8px" }}>
              <div style={{ borderRadius: 16, overflow: "hidden", border: "1px solid var(--border)" }}>
                <button onClick={handleChanger}
                  style={{ width: "100%", padding: "16px 20px", background: "var(--glass-bg)", border: "none", borderBottom: "1px solid var(--border)", cursor: "pointer", textAlign: "left", fontSize: 15, color: "var(--fg)" }}>
                  Changer de membre
                </button>
                {!showQuitConfirm ? (
                  <button onClick={() => setShowQuitConfirm(true)}
                    style={{ width: "100%", padding: "16px 20px", background: "var(--glass-bg)", border: "none", cursor: "pointer", textAlign: "left", fontSize: 15, color: "#FF3B30" }}>
                    Quitter
                  </button>
                ) : (
                  <div style={{ padding: "14px 20px", background: "rgba(255,59,48,0.06)" }}>
                    <p style={{ fontSize: 13, color: "var(--fg-secondary)", marginBottom: 10 }}>Quitter la session de {cap(session.prenom)} ?</p>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button onClick={() => setShowQuitConfirm(false)} style={{ flex: 1, padding: "10px", borderRadius: 12, background: "var(--glass-bg)", border: "1px solid var(--border)", color: "var(--fg)", fontSize: 14, cursor: "pointer" }}>Annuler</button>
                      <button onClick={handleLogout} style={{ flex: 1, padding: "10px", borderRadius: 12, background: "#FF3B30", color: "white", border: "none", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>Quitter</button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

// ── Tab bar partagée ───────────────────────────────────────────────────────────

export function EquipeNav({ active, session, clientsBadge }: { active: "scanner" | "clients"; session: EquipeSession; clientsBadge?: number }) {
  void session;
  const tabs = [
    {
      key: "scanner" as const, label: "Scanner", path: "/equipe/scanner",
      icon: (active: boolean) => (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? "2" : "1.75"} strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
          <rect x="3" y="14" width="7" height="7" rx="1"/><path d="M14 14h3v3m0 4h4v-4m-4 0h-3v4"/>
          {active && <rect x="3" y="3" width="7" height="7" rx="1" fill="currentColor" fillOpacity="0.15" stroke="none"/>}
          {active && <rect x="14" y="3" width="7" height="7" rx="1" fill="currentColor" fillOpacity="0.15" stroke="none"/>}
          {active && <rect x="3" y="14" width="7" height="7" rx="1" fill="currentColor" fillOpacity="0.15" stroke="none"/>}
        </svg>
      ),
    },
    {
      key: "clients" as const, label: "Clients", path: "/equipe/clients",
      icon: (active: boolean) => (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? "2" : "1.75"} strokeLinecap="round" strokeLinejoin="round">
          {active && <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" fill="currentColor" fillOpacity="0.15" stroke="none"/>}
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
        </svg>
      ),
    },
  ];

  return (
    <nav style={{
      display: "flex", alignItems: "flex-end",
      background: "rgba(255,255,255,0.88)",
      backdropFilter: "blur(40px) saturate(180%)",
      WebkitBackdropFilter: "blur(40px) saturate(180%)",
      borderTop: "0.5px solid rgba(0,0,0,0.10)",
      paddingBottom: "env(safe-area-inset-bottom, 0px)",
      flexShrink: 0,
    }}>
      <div style={{ display: "flex", height: "var(--tab-h, 49px)", width: "100%" }}>
        {tabs.map(tab => {
          const isActive = active === tab.key;
          const badge = tab.key === "clients" && clientsBadge && clientsBadge > 0 ? clientsBadge : 0;
          return (
            <Link key={tab.key} href={tab.path}
              style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 3, color: isActive ? "#2F7BFF" : "#8E8E93", textDecoration: "none" }}>
              <div style={{ position: "relative", display: "inline-flex" }}>
                {tab.icon(isActive)}
                {badge > 0 && (
                  <span style={{ position: "absolute", top: -4, right: -6, minWidth: 16, height: 16, borderRadius: 5, background: "#FF3B30", color: "white", fontSize: 10, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 4px", border: "1.5px solid white" }}>
                    {badge > 9 ? "9+" : badge}
                  </span>
                )}
              </div>
              <span style={{ fontSize: 10, fontWeight: isActive ? 600 : 400, letterSpacing: "0.01em" }}>{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
