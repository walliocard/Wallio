"use client";

import { useEffect, useState } from "react";
import { collection, query, where, getDocs, doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

const PHONE_KEY    = "wallio_client_phone";
const VERIFIED_KEY = "wallio_client_verified";
const PRENOM_KEY   = "wallio_client_prenom";
const NOM_KEY      = "wallio_client_nom";
const DOB_KEY      = "wallio_client_dob";

const FG = "#1C2333", SEC = "#8E9BB5", LAV = "#EDE9FB", LAV_FG = "#6D4FC0", LINE = "rgba(142,155,181,0.14)";

type Compte = { clientId: string; walletId: string; marchandId: string; marchandNom: string; logoUrl?: string; notifOn: boolean };

function maskPhone(p: string) {
  if (!p) return "";
  const cc = p.startsWith("+") ? p.slice(0, 4) : "";
  const first = p.slice(cc.length, cc.length + 1);
  return `${cc} ${first}•• ••• ${p.slice(-3)}`.trim();
}

// ── Petits composants ────────────────────────────────────────────────────────
function Card({ children }: { children: React.ReactNode }) {
  return <div style={{ background: "white", borderRadius: 18, overflow: "hidden", border: "1px solid " + LINE, boxShadow: "0 2px 12px rgba(100,120,160,0.06)" }}>{children}</div>;
}
function Label({ children }: { children: React.ReactNode }) {
  return <p style={{ fontSize: 12, fontWeight: 600, color: SEC, textTransform: "uppercase", letterSpacing: 0.4, margin: "22px 4px 8px" }}>{children}</p>;
}
function Row({ label, right, onClick, href, last, danger }: { label: React.ReactNode; right?: React.ReactNode; onClick?: () => void; href?: string; last?: boolean; danger?: boolean }) {
  const inner = (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", borderBottom: last ? "none" : "1px solid " + LINE }}>
      <span style={{ fontSize: 15, color: danger ? "#FF3B30" : FG }}>{label}</span>
      {right != null && <span style={{ display: "flex", alignItems: "center", gap: 6, color: SEC, fontSize: 14 }}>{right}</span>}
    </div>
  );
  if (href) return <a href={href} style={{ textDecoration: "none", display: "block" }}>{inner}</a>;
  return <button onClick={onClick} style={{ width: "100%", background: "transparent", border: "none", textAlign: "left", cursor: onClick ? "pointer" : "default", padding: 0 }}>{inner}</button>;
}
function Chevron() {
  return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={SEC} strokeWidth="2" strokeLinecap="round"><path d="M9 18l6-6-6-6" /></svg>;
}
function Toggle({ on, onChange }: { on: boolean; onChange: () => void }) {
  return (
    <button onClick={onChange} style={{ position: "relative", width: 44, height: 26, borderRadius: 100, border: "none", cursor: "pointer", background: on ? "#9E8BD6" : "rgba(142,155,181,0.35)", transition: "background .2s" }}>
      <span style={{ position: "absolute", top: 2, left: on ? 20 : 2, width: 22, height: 22, borderRadius: "50%", background: "white", boxShadow: "0 1px 3px rgba(0,0,0,0.2)", transition: "left .2s" }} />
    </button>
  );
}

// Cache mémoire du profil : survit aux allers-retours (affichage instantané, pas de flip du toggle).
let profilCache: { phone: string; prenom: string; nom: string; dob: string; comptes: Compte[] } | null = null;

export default function ProfilPage() {
  const [phone, setPhone] = useState(() => profilCache?.phone ?? "");
  const [prenom, setPrenom] = useState(() => profilCache?.prenom ?? "");
  const [nom, setNom] = useState(() => profilCache?.nom ?? "");
  const [dob, setDob] = useState(() => profilCache?.dob ?? "");
  const [comptes, setComptes] = useState<Compte[]>(() => profilCache?.comptes ?? []);
  const [comptesReady, setComptesReady] = useState(!!profilCache);
  const [editPrenom, setEditPrenom] = useState(false);
  const [prenomDraft, setPrenomDraft] = useState("");
  const [editDob, setEditDob] = useState(false);
  const [showCommerces, setShowCommerces] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const p = localStorage.getItem(PHONE_KEY) || "";
    if (!p) { window.location.href = "/mes-cartes"; return; }
    setPhone(p);
    if (!profilCache) {
      setPrenom(localStorage.getItem(PRENOM_KEY) || "");
      setNom(localStorage.getItem(NOM_KEY) || "");
      setDob(localStorage.getItem(DOB_KEY) || "");
    }
    (async () => {
      try {
        const snap = await getDocs(query(collection(db, "clients"), where("telephone", "==", p)));
        if (!snap.empty) {
          const d0 = snap.docs[0].data();
          const fp = (d0.prenom as string) || localStorage.getItem(PRENOM_KEY) || "";
          const fn = (d0.nom as string) || localStorage.getItem(NOM_KEY) || "";
          const fd = (d0.date_naissance as string) || localStorage.getItem(DOB_KEY) || "";
          setPrenom(fp); setNom(fn); setDob(fd);
          const list = await Promise.all(snap.docs.map(async d => {
            const c = d.data();
            let marchandNom = "Établissement", logoUrl: string | undefined;
            try {
              const ms = await getDoc(doc(db, "marchands", c.marchand_id as string));
              if (ms.exists()) { const m = ms.data(); marchandNom = (m.nom as string) || marchandNom; logoUrl = (m.logo_url as string) || undefined; }
            } catch { /* skip */ }
            return { clientId: d.id, walletId: c.wallet_id as string, marchandId: c.marchand_id as string, marchandNom, logoUrl, notifOn: !!c.fcm_token } as Compte;
          }));
          setComptes(list);
          profilCache = { phone: p, prenom: fp, nom: fn, dob: fd, comptes: list };
        }
      } catch { /* silent */ }
      setComptesReady(true);
    })();
  }, []);

  // Rebond iOS natif (même sensation que Mes cartes)
  useEffect(() => {
    document.body.style.overscrollBehavior = "auto";
    document.documentElement.style.overscrollBehavior = "auto";
    return () => { document.body.style.overscrollBehavior = ""; document.documentElement.style.overscrollBehavior = ""; };
  }, []);

  const notifGlobalOn = comptes.some(c => c.notifOn);

  async function saveField(fields: Record<string, unknown>) {
    await Promise.all(comptes.map(c => updateDoc(doc(db, "clients", c.clientId), fields).catch(() => {})));
  }
  async function savePrenom() {
    const v = prenomDraft.trim();
    if (v) { setPrenom(v); localStorage.setItem(PRENOM_KEY, v); await saveField({ prenom: v }); }
    setEditPrenom(false);
  }
  async function saveDob(v: string) {
    setDob(v); localStorage.setItem(DOB_KEY, v); setEditDob(false);
    await saveField({ date_naissance: v });
  }
  async function disableAllNotifs() {
    setComptes(prev => prev.map(c => ({ ...c, notifOn: false })));
    await Promise.all(comptes.map(c => fetch("/api/client-notif", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ walletId: c.walletId, fcm_token: null }) }).catch(() => {})));
  }
  function logout() {
    [PHONE_KEY, VERIFIED_KEY, PRENOM_KEY, NOM_KEY, DOB_KEY, "wallio_client_email", "wallio_client_pin"].forEach(k => localStorage.removeItem(k));
    window.location.href = "/mes-cartes";
  }
  async function supprimer() {
    if (!phone) return;
    setDeleting(true);
    const walletId = comptes[0]?.walletId;
    try {
      if (walletId) await fetch("/api/delete-account", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ telephone: phone, walletId }) });
    } catch { /* on nettoie quand même */ }
    Object.keys(localStorage).filter(k => k.startsWith("wallio_")).forEach(k => localStorage.removeItem(k));
    localStorage.removeItem(VERIFIED_KEY);
    document.cookie = "wallio_p=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Lax";
    window.location.href = "/mes-cartes";
  }

  return (
    <main className="page-enter" style={{ minHeight: "100dvh", background: "#F7F7FA", color: FG, fontFamily: "-apple-system, 'SF Pro Display', system-ui, sans-serif" }}>
      <div style={{ maxWidth: 430, margin: "0 auto", padding: "max(16px, env(safe-area-inset-top, 16px)) 20px 48px" }}>

        {/* Barre : retour */}
        <div style={{ display: "flex", alignItems: "center", height: 44 }}>
          <a href="/mes-cartes" aria-label="Retour" style={{ display: "inline-flex", alignItems: "center", gap: 4, textDecoration: "none", color: LAV_FG, fontSize: 15 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M15 18l-6-6 6-6" /></svg>
            Mes cartes
          </a>
        </div>

        {/* Identité */}
        <div style={{ textAlign: "center", margin: "12px 0 8px" }}>
          <div style={{ width: 76, height: 76, borderRadius: "50%", background: LAV, border: "1px solid rgba(123,97,214,0.18)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
            <span style={{ fontSize: 30, fontWeight: 600, color: LAV_FG }}>{(prenom?.[0] || "?").toUpperCase()}</span>
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: -0.4, margin: 0 }}>{prenom || "Profil"}</h1>
          <p style={{ fontSize: 14, color: SEC, marginTop: 2 }}>{maskPhone(phone)}</p>
        </div>

        {(<>
          {/* Mon compte */}
          <Label>Mon compte</Label>
          <Card>
            {editPrenom ? (
              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 16px", borderBottom: "1px solid " + LINE }}>
                <input autoFocus value={prenomDraft} onChange={e => setPrenomDraft(e.target.value)} placeholder="Prénom"
                  style={{ flex: 1, fontSize: 15, border: "none", outline: "none", background: "transparent", color: FG }} />
                <button onClick={savePrenom} style={{ background: "transparent", border: "none", color: LAV_FG, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>OK</button>
              </div>
            ) : (
              <Row label="Prénom" right={<>{prenom || "—"} <Chevron /></>} onClick={() => { setPrenomDraft(prenom); setEditPrenom(true); }} />
            )}
            <Row label="Téléphone" right={maskPhone(phone)} />
            {editDob ? (
              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 16px" }}>
                <span style={{ fontSize: 15 }}>Anniversaire</span>
                <input type="date" autoFocus defaultValue={dob} onChange={e => saveDob(e.target.value)}
                  style={{ marginLeft: "auto", fontSize: 14, border: "1px solid " + LINE, borderRadius: 8, padding: "4px 8px", color: FG }} />
              </div>
            ) : (
              <Row label="Anniversaire" last right={<>{dob || "Ajouter"} <Chevron /></>} onClick={() => setEditDob(true)} />
            )}
          </Card>

          {/* Notifications */}
          <Label>Notifications</Label>
          <Card>
            <Row label="Recevoir les notifications" right={comptesReady
              ? <Toggle on={notifGlobalOn} onChange={() => { if (notifGlobalOn) disableAllNotifs(); else setShowCommerces(true); }} />
              : <span style={{ width: 44, height: 26, borderRadius: 100, background: "rgba(142,155,181,0.2)", display: "inline-block" }} />} />
            <Row label="Par commerce" last={!showCommerces} right={<Chevron />} onClick={() => setShowCommerces(v => !v)} />
            {showCommerces && comptes.map((c, i) => (
              <Row key={c.walletId} last={i === comptes.length - 1}
                label={<span style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
                  {c.logoUrl ? <img src={c.logoUrl} alt="" style={{ width: 26, height: 26, borderRadius: 7, objectFit: "contain", background: "rgba(142,155,181,0.1)" }} /> : <span style={{ width: 26, height: 26, borderRadius: 7, background: LAV }} />}
                  {c.marchandNom}
                </span>}
                right={<>{c.notifOn ? "Activées" : "Désactivées"} <Chevron /></>} href={`/preferences/${c.walletId}`} />
            ))}
          </Card>

          {/* Préférences */}
          <Label>Préférences</Label>
          <Card>
            <Row label="Langue" last right="Français" />
          </Card>

          {/* Informations */}
          <Label>Informations</Label>
          <Card>
            <Row label="Confidentialité" href="/privacy" right={<Chevron />} />
            <Row label="Conditions d'utilisation" href="/terms" right={<Chevron />} />
            <Row label="Mentions légales" href="/legal" last right={<Chevron />} />
          </Card>

          {/* Déconnexion */}
          <div style={{ height: 22 }} />
          <Card><Row label="Se déconnecter" last onClick={logout} /></Card>

          {/* Suppression */}
          <div style={{ height: 22 }} />
          <Card><Row label="Supprimer mon compte" last danger onClick={() => setDeleteConfirm(true)} /></Card>
        </>)}
      </div>

      {/* Modal suppression */}
      {deleteConfirm && (
        <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "flex-end", justifyContent: "center", background: "rgba(0,0,0,0.35)", backdropFilter: "blur(6px)" }}>
          <div style={{ width: "100%", maxWidth: 430, background: "#FFFFFF", borderRadius: "24px 24px 0 0", padding: "28px 24px 48px" }}>
            <div style={{ width: 36, height: 4, background: "rgba(0,0,0,0.1)", borderRadius: 2, margin: "0 auto 24px" }} />
            <p style={{ fontSize: 18, fontWeight: 700, marginBottom: 8, textAlign: "center" }}>Supprimer votre compte ?</p>
            <p style={{ fontSize: 14, color: SEC, lineHeight: 1.6, textAlign: "center", marginBottom: 28 }}>Toutes vos cartes et vos tampons seront définitivement supprimés. Cette action est irréversible.</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <button onClick={supprimer} disabled={deleting} style={{ width: "100%", padding: "15px 0", borderRadius: 14, background: "#FF3B30", color: "white", fontSize: 16, fontWeight: 700, border: "none", cursor: deleting ? "default" : "pointer", opacity: deleting ? 0.6 : 1 }}>
                {deleting ? "Suppression…" : "Supprimer définitivement"}
              </button>
              <button onClick={() => setDeleteConfirm(false)} style={{ width: "100%", padding: "15px 0", borderRadius: 14, background: "rgba(0,0,0,0.05)", color: FG, fontSize: 16, fontWeight: 500, border: "none", cursor: "pointer" }}>Annuler</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
