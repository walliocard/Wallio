"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import WallioLogo from "@/components/WallioLogo";
import { drawPrintCard, drawPrintCardQROnly } from "@/lib/print-card-draw";

type AboType = "mensuel" | "6mois" | "annuel";
type Paiement = { date: number; type: AboType; montant: number };

type Marchand = {
  id: string; nom: string; email: string; actif: boolean;
  date_inscription?: { seconds: number }; nfc_id?: string;
  logo_url?: string; couleur_principale?: string; couleur_secondaire?: string;
  abonnement_statut?: "actif" | "en_attente" | "suspendu";
  abonnement_type?: AboType;
  abonnement_debut?: number;
  abonnement_fin?: number;
  abonnement_paiements?: Paiement[];
  ville?: string;
  pays?: string;
  telephone?: string;
};

const VILLES_ADMIN: Record<string, string[]> = {
  Maroc: ["Agadir","Béni Mellal","Casablanca","El Jadida","Fès","Kénitra","Khouribga","Laâyoune","Marrakech","Meknès","Mohammedia","Nador","Oujda","Rabat","Safi","Salé","Settat","Tanger","Tétouan"],
  Roumanie: ["Cluj-Napoca"],
};

function slugify(str: string) {
  return str.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}
function genNfcId(nom: string) {
  return `${slugify(nom) || "marchand"}-${Math.random().toString(36).substring(2, 7)}`;
}
function formatDate(ts?: { seconds: number }) {
  if (!ts) return "—";
  return new Date(ts.seconds * 1000).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
}
function formatDateSec(sec?: number) {
  if (!sec) return "—";
  return new Date(sec * 1000).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
}
function calcAbonnementFin(debutSec: number, type: AboType): number {
  const d = new Date(debutSec * 1000);
  if (type === "mensuel") d.setMonth(d.getMonth() + 1);
  else if (type === "6mois") d.setMonth(d.getMonth() + 6);
  else d.setFullYear(d.getFullYear() + 1);
  return Math.floor(d.getTime() / 1000);
}
function getAboStatus(fin?: number): "actif" | "bientot" | "expire" | "aucun" {
  if (!fin) return "aucun";
  const ms = fin * 1000 - Date.now();
  if (ms < 0) return "expire";
  if (ms < 15 * 86400000) return "bientot";
  return "actif";
}
function daysLeft(fin?: number): number {
  if (!fin) return 0;
  return Math.ceil((fin * 1000 - Date.now()) / 86400000);
}
function getMontant(type: AboType): number {
  return type === "6mois" ? 1799 : type === "annuel" ? 2999 : 349;
}
const ABO_LABELS: Record<AboType, string> = { mensuel: "Mensuel", "6mois": "6 mois", annuel: "Annuel" };
const ABO_COLORS = {
  actif:  { bg: "rgba(52,199,89,0.10)",   fg: "#1C7A37",  label: "Actif" },
  bientot:{ bg: "rgba(255,159,10,0.12)",  fg: "#7A4A00",  label: "Expire bientôt" },
  expire: { bg: "rgba(255,59,48,0.10)",   fg: "#C0392B",  label: "Expiré" },
  aucun:  { bg: "rgba(0,0,0,0.05)",       fg: "#6E6E73",  label: "Aucun" },
};

// ── Palette (toujours clair) ─────────────────────────────────────────────────
const DANGER  = "#FF3B30";
const WARNING = "#FF9F0A";

const T = {
  bg: "#F5F5F7", surf: "rgba(255,255,255,0.72)", surfCard: "#FFFFFF", surfForm: "#F5F5F7",
  surfInput: "rgba(255,255,255,0.80)", label: "#111113", sec: "#6E6E73", tert: "#A1A1A6",
  border: "rgba(0,0,0,0.07)", borderInput: "rgba(0,0,0,0.10)",
  blur: "blur(28px) saturate(150%)", shadow: "0 2px 12px rgba(0,0,0,0.05), 0 1px 3px rgba(0,0,0,0.04)",
  shadowModal: "0 8px 40px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)",
  overlay: "rgba(0,0,0,0.18)",
  btnBg: "#111113", btnFg: "#FFFFFF",
  btnSecBg: "rgba(255,255,255,0.72)", btnSecBorder: "rgba(0,0,0,0.10)", btnSecFg: "#6E6E73",
  actifFg: "#1C7A37", actifDot: "#34C759", inactifFg: "#A1A1A6", inactifDot: "rgba(0,0,0,0.15)",
  paidBg: "rgba(52,199,89,0.10)", paidFg: "#1C7A37",
  waitBg: "rgba(255,159,10,0.10)", waitFg: "#7A4A00",
  nfcBg: "rgba(0,190,95,0.10)", nfcFg: "#1C7A37",
  drawerBg: "rgba(245,245,247,0.95)", drawerBlur: "blur(40px) saturate(160%)",
  drawerBorder: "rgba(0,0,0,0.07)", drawerShadow: "-4px 0 24px rgba(0,0,0,0.06)",
  tabsBg: "rgba(0,0,0,0.05)", tabActiveBg: "#FFFFFF", tabActiveFg: "#111113", tabInactiveFg: "#6E6E73",
  rowHover: "rgba(0,0,0,0.015)", sep: "rgba(0,0,0,0.07)",
  closeBtn: "rgba(0,0,0,0.06)", inputFocus: "rgba(0,0,0,0.20)",
};

export default function AdminPage() {
  const [marchands, setMarchands] = useState<Marchand[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Marchand | null>(null);
  const [toggling, setToggling] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [generatingNfc, setGeneratingNfc] = useState(false);
  const [updatingAbo, setUpdatingAbo] = useState(false);
  const [copied, setCopied] = useState(false);
  const [downloadingCard, setDownloadingCard] = useState(false);
  const [downloadingQR, setDownloadingQR] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [createNom, setCreateNom] = useState("");
  const [createEmail, setCreateEmail] = useState("");
  const [createPassword, setCreatePassword] = useState("");
  const [createTel, setCreateTel] = useState("");
  const [createPays, setCreatePays] = useState("Maroc");
  const [createVille, setCreateVille] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const [tab, setTab] = useState<"marchands" | "comptabilite">("marchands");
  const [showPaiement, setShowPaiement] = useState<Marchand | null>(null);
  const [paiementType, setPaiementType] = useState<AboType>("mensuel");
  const [paiementDebut, setPaiementDebut] = useState("");
  const [savingPaiement, setSavingPaiement] = useState(false);
  const [page, setPage] = useState(0);
  const [locPays, setLocPays] = useState("Maroc");
  const [locVille, setLocVille] = useState("");
  const [locTel, setLocTel] = useState("");
  const [savingLoc, setSavingLoc] = useState(false);
  const router = useRouter();

  useEffect(() => {
    let unsub: (() => void) | null = null;
    let timeout: ReturnType<typeof setTimeout>;
    async function init() {
      const res = await fetch("/api/admin/check");
      if (!res.ok) { router.push("/admin/login"); return; }
      timeout = setTimeout(() => setLoadError(true), 8000);
      unsub = onSnapshot(collection(db, "marchands"), snap => {
        clearTimeout(timeout);
        const all = snap.docs.map(d => ({ id: d.id, nom: "", email: "", actif: false, ...d.data() } as Marchand));
        all.sort((a, b) => (b.date_inscription?.seconds ?? 0) - (a.date_inscription?.seconds ?? 0));
        setMarchands(all);
        setLoading(false);
      });
    }
    init();
    return () => { unsub?.(); clearTimeout(timeout); };
  }, [router]);

  async function adminPatch(marchandId: string, fields: Record<string, unknown>) {
    const res = await fetch("/api/admin/update-marchand", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ marchandId, fields }) });
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || `HTTP ${res.status}`);
  }
  async function adminDelete(marchandId: string) {
    const res = await fetch("/api/admin/update-marchand", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ marchandId }) });
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || `HTTP ${res.status}`);
  }
  async function toggleActif(m: Marchand) {
    const newActif = !m.actif;
    const updated = { ...m, actif: newActif };
    setMarchands(prev => prev.map(x => x.id === m.id ? updated : x));
    if (selected?.id === m.id) setSelected(updated);
    setToggling(m.id);
    try { await adminPatch(m.id, { actif: newActif }); }
    catch { setMarchands(prev => prev.map(x => x.id === m.id ? m : x)); if (selected?.id === m.id) setSelected(m); }
    setToggling(null);
  }
  async function supprimerMarchand(id: string) {
    setDeleting(id);
    setMarchands(prev => prev.filter(m => m.id !== id));
    if (selected?.id === id) setSelected(null);
    setConfirmDelete(null);
    try { await adminDelete(id); }
    catch (e) { alert(`Erreur : ${e instanceof Error ? e.message : e}`); }
    setDeleting(null);
  }
  async function genererNfc(m: Marchand) {
    setGeneratingNfc(true);
    const nfc_id = genNfcId(m.nom);
    const updated = { ...m, nfc_id };
    setMarchands(prev => prev.map(x => x.id === m.id ? updated : x));
    setSelected(updated);
    try { await adminPatch(m.id, { nfc_id }); }
    catch { setMarchands(prev => prev.map(x => x.id === m.id ? m : x)); setSelected(m); }
    setGeneratingNfc(false);
  }
  function openDrawer(m: Marchand) {
    setSelected(m);
    setLocPays(m.pays || "Maroc");
    setLocVille(m.ville || "");
    setLocTel(m.telephone || "");
  }
  async function saveLocalisation() {
    if (!selected || !locVille) return;
    setSavingLoc(true);
    const updated = { ...selected, pays: locPays, ville: locVille, telephone: locTel || undefined };
    setMarchands(prev => prev.map(x => x.id === selected.id ? updated : x));
    setSelected(updated);
    try { await adminPatch(selected.id, { pays: locPays, ville: locVille, telephone: locTel || null }); }
    catch { setMarchands(prev => prev.map(x => x.id === selected.id ? selected : x)); setSelected(selected); }
    setSavingLoc(false);
  }
  function openPaiementModal(m: Marchand) {
    let debutDefault = new Date();
    if (m.abonnement_fin && m.abonnement_fin * 1000 > Date.now()) {
      debutDefault = new Date(m.abonnement_fin * 1000);
    }
    setPaiementDebut(debutDefault.toISOString().slice(0, 10));
    setPaiementType(m.abonnement_type || "mensuel");
    setShowPaiement(m);
  }
  async function confirmerPaiement() {
    if (!showPaiement || !paiementDebut) return;
    setSavingPaiement(true);
    const debutSec = Math.floor(new Date(paiementDebut + "T00:00:00").getTime() / 1000);
    const finSec = calcAbonnementFin(debutSec, paiementType);
    const newPaiement: Paiement = { date: Math.floor(Date.now() / 1000), type: paiementType, montant: getMontant(paiementType) };
    const paiements = [...(showPaiement.abonnement_paiements || []), newPaiement];
    const updated = { ...showPaiement, abonnement_type: paiementType, abonnement_debut: debutSec, abonnement_fin: finSec, abonnement_paiements: paiements };
    setMarchands(prev => prev.map(x => x.id === showPaiement.id ? updated : x));
    if (selected?.id === showPaiement.id) setSelected(updated);
    try {
      await adminPatch(showPaiement.id, { abonnement_type: paiementType, abonnement_debut: debutSec, abonnement_fin: finSec, abonnement_paiements: paiements });
    } catch {
      setMarchands(prev => prev.map(x => x.id === showPaiement.id ? showPaiement : x));
      if (selected?.id === showPaiement.id) setSelected(showPaiement);
    }
    setShowPaiement(null);
    setSavingPaiement(false);
  }
  async function toggleAbonnement(m: Marchand) {
    setUpdatingAbo(true);
    const newStatut: Marchand["abonnement_statut"] = m.abonnement_statut === "actif" ? "en_attente" : "actif";
    const updated = { ...m, abonnement_statut: newStatut };
    setMarchands(prev => prev.map(x => x.id === m.id ? updated : x));
    setSelected(updated);
    try { await adminPatch(m.id, { abonnement_statut: newStatut }); }
    catch { setMarchands(prev => prev.map(x => x.id === m.id ? m : x)); setSelected(m); }
    setUpdatingAbo(false);
  }
  async function telechargerCarte(m: Marchand) {
    if (!m.nfc_id) return;
    setDownloadingCard(true);
    const canvas = document.createElement("canvas");
    await drawPrintCard(canvas, `https://app.walliocard.com/nfc/${m.nfc_id}`, 3);
    const a = document.createElement("a");
    a.download = `wallio-carte-${slugify(m.nom || m.id)}.png`;
    a.href = canvas.toDataURL("image/png"); a.click();
    setDownloadingCard(false);
  }
  async function telechargerCarteQR(m: Marchand) {
    setDownloadingQR(true);
    const canvas = document.createElement("canvas");
    const url = m.nfc_id ? `https://app.walliocard.com/nfc/${m.nfc_id}` : "https://app.walliocard.com";
    await drawPrintCardQROnly(canvas, url, 3);
    const a = document.createElement("a");
    a.download = `wallio-qr-${slugify(m.nom || m.id)}.png`;
    a.href = canvas.toDataURL("image/png"); a.click();
    setDownloadingQR(false);
  }
  async function creerMarchand() {
    if (!createNom || !createEmail || !createPassword || !createVille) return;
    setCreating(true); setCreateError("");
    const res = await fetch("/api/admin/create-marchand", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ nom: createNom, email: createEmail, password: createPassword, telephone: createTel || null, pays: createPays, ville: createVille }) });
    const data = await res.json();
    if (!res.ok) { setCreateError(data.error || "Erreur"); setCreating(false); return; }
    setShowCreate(false); setCreateNom(""); setCreateEmail(""); setCreatePassword(""); setCreateTel(""); setCreatePays("Maroc"); setCreateVille(""); setCreating(false);
    const { getDoc, doc } = await import("firebase/firestore");
    const snap = await getDoc(doc((await import("@/lib/firebase")).db, "marchands", data.uid));
    if (snap.exists()) setSelected({ id: snap.id, nom: "", email: "", actif: false, ...snap.data() } as Marchand);
  }
  async function copierNfc(nfc_id: string) {
    await navigator.clipboard.writeText(`https://app.walliocard.com/nfc/${nfc_id}`);
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  }
  async function logout() { await fetch("/api/admin/logout", { method: "POST" }); router.push("/admin/login"); }

  // ── Palette active ──────────────────────────────────────────────────────────

  const G: React.CSSProperties = {
    background: T.surf,
    backdropFilter: T.blur,
    WebkitBackdropFilter: T.blur,
    border: `1px solid ${T.border}`,
    boxShadow: T.shadow,
  };
  const inputStyle: React.CSSProperties = {
    background: T.surfInput, border: `1px solid ${T.borderInput}`, color: T.label,
    borderRadius: 10, padding: "11px 14px", fontSize: 15, outline: "none", width: "100%", boxSizing: "border-box",
  };

  // Composants locaux (closure sur T)
  const Row = ({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) => (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "11px 0", borderBottom: `1px solid ${T.sep}` }}>
      <span style={{ fontSize: 14, color: T.sec }}>{label}</span>
      <span style={{ fontSize: 14, fontWeight: 500, color: valueColor || T.label }}>{value}</span>
    </div>
  );
  const SLabel = ({ children }: { children: React.ReactNode }) => (
    <p style={{ fontSize: 11, fontWeight: 600, color: T.tert, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6, marginTop: 22 }}>{children}</p>
  );
  const Badge = ({ statut }: { statut?: string }) => {
    const paid = statut === "actif";
    return <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 8px", borderRadius: 6, background: paid ? T.paidBg : T.waitBg, color: paid ? T.paidFg : T.waitFg }}>{paid ? "Payé" : "Attente"}</span>;
  };

  if (loading) return (
    <main style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: T.bg }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      {loadError ? (
        <div style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
          <p style={{ fontSize: 15, color: T.sec }}>Connexion lente ou indisponible.</p>
          <button onClick={() => window.location.reload()}
            style={{ padding: "11px 28px", borderRadius: 12, background: T.btnBg, color: T.btnFg, fontSize: 14, fontWeight: 600, border: "none", cursor: "pointer" }}>
            Recharger la page
          </button>
        </div>
      ) : (
        <div style={{ width: 22, height: 22, borderRadius: "50%", border: `2px solid ${T.border}`, borderTopColor: T.btnBg, animation: "spin 0.8s linear infinite" }} />
      )}
    </main>
  );

  const actifs = marchands.filter(m => m.actif).length;
  const aboActifs = marchands.filter(m => m.abonnement_statut === "actif").length;
  const revenus = aboActifs * 349;
  const filtered = marchands.filter(m =>
    !search || m.nom?.toLowerCase().includes(search.toLowerCase()) || m.email?.toLowerCase().includes(search.toLowerCase())
  );
  const PAGE_SIZE = 20;
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  return (
    <main style={{ minHeight: "100vh", background: T.bg, color: T.label }}>

      {/* ── Modal nouveau marchand ── */}
      {showCreate && (
        <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "flex-end", justifyContent: "center", background: T.overlay, backdropFilter: "blur(8px)" }}
          onClick={() => { setShowCreate(false); setCreateError(""); }}>
          <div style={{ width: "100%", maxWidth: 480, background: "#FFFFFF", borderRadius: "24px 24px 0 0", padding: "28px 24px 40px", boxShadow: T.shadowModal }}
            onClick={e => e.stopPropagation()}>
            <div style={{ width: 32, height: 4, background: T.border, borderRadius: 2, margin: "0 auto 22px" }} />
            <h3 style={{ fontSize: 18, fontWeight: 600, color: T.label, marginBottom: 3 }}>Nouveau marchand</h3>
            <p style={{ fontSize: 13, color: T.sec, marginBottom: 18 }}>Crée le compte + génère le NFC ID automatiquement</p>
            <div style={{ background: T.surfForm, borderRadius: 12, overflow: "hidden", marginBottom: 10 }}>
              {[
                { label: "Nom du commerce", value: createNom, set: setCreateNom, placeholder: "Café Central", type: "text" },
                { label: "Email", value: createEmail, set: setCreateEmail, placeholder: "contact@cafe.ma", type: "email" },
                { label: "Mot de passe", value: createPassword, set: setCreatePassword, placeholder: "Min. 8 caractères", type: "password" },
                { label: "Téléphone", value: createTel, set: setCreateTel, placeholder: "Téléphone (optionnel)", type: "tel" },
              ].map((f, i, arr) => (
                <div key={f.label}>
                  <input type={f.type} value={f.value} onChange={e => f.set(e.target.value)} placeholder={f.placeholder}
                    style={{ ...inputStyle, background: "transparent", borderRadius: 0, border: "none", padding: "13px 16px", fontSize: 15 }} />
                  {i < arr.length - 1 && <div style={{ height: 1, background: T.sep, marginLeft: 16 }} />}
                </div>
              ))}
            </div>
            <div style={{ background: T.surfForm, borderRadius: 12, overflow: "hidden", marginBottom: 10 }}>
              <select value={createPays} onChange={e => { setCreatePays(e.target.value); setCreateVille(""); }}
                style={{ ...inputStyle, background: "transparent", borderRadius: 0, border: "none", borderBottom: `1px solid ${T.sep}`, padding: "13px 16px", fontSize: 15, appearance: "none" }}>
                {Object.keys(VILLES_ADMIN).map(p => <option key={p} value={p}>{p}</option>)}
              </select>
              <select value={createVille} onChange={e => setCreateVille(e.target.value)} required
                style={{ ...inputStyle, background: "transparent", borderRadius: 0, border: "none", padding: "13px 16px", fontSize: 15, appearance: "none", color: createVille ? T.label : T.tert }}>
                <option value="">Sélectionner une ville *</option>
                {(VILLES_ADMIN[createPays] ?? []).map(v => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>
            {createError && <p style={{ fontSize: 13, color: DANGER, marginBottom: 10 }}>{createError}</p>}
            <div style={{ display: "flex", gap: 10, marginTop: 6 }}>
              <button onClick={() => { setShowCreate(false); setCreateError(""); }}
                style={{ flex: 1, padding: "13px 0", borderRadius: 12, background: T.surfForm, color: T.label, fontSize: 15, fontWeight: 500, border: `1px solid ${T.border}`, cursor: "pointer" }}>
                Annuler
              </button>
              <button onClick={creerMarchand} disabled={creating || !createNom || !createEmail || !createPassword || !createVille}
                style={{ flex: 1, padding: "13px 0", borderRadius: 12, background: T.btnBg, color: T.btnFg, fontSize: 15, fontWeight: 600, border: "none", cursor: "pointer", opacity: (!createNom || !createEmail || !createPassword || !createVille) ? 0.45 : 1 }}>
                {creating ? "Création…" : "Créer"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal paiement ── */}
      {showPaiement && (() => {
        const debutSec = paiementDebut ? Math.floor(new Date(paiementDebut + "T00:00:00").getTime() / 1000) : 0;
        const finSec = debutSec ? calcAbonnementFin(debutSec, paiementType) : 0;
        const montant = getMontant(paiementType);
        return (
          <div style={{ position: "fixed", inset: 0, zIndex: 55, display: "flex", alignItems: "flex-end", justifyContent: "center", background: T.overlay, backdropFilter: "blur(8px)" }}
            onClick={() => setShowPaiement(null)}>
            <div style={{ width: "100%", maxWidth: 480, background: "#FFFFFF", borderRadius: "24px 24px 0 0", padding: "28px 24px 44px", boxShadow: T.shadowModal }}
              onClick={e => e.stopPropagation()}>
              <div style={{ width: 32, height: 4, background: T.border, borderRadius: 2, margin: "0 auto 22px" }} />
              <p style={{ fontSize: 11, fontWeight: 600, color: T.tert, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 4 }}>Nouveau paiement</p>
              <h3 style={{ fontSize: 18, fontWeight: 600, color: T.label, marginBottom: 20 }}>{showPaiement.nom}</h3>

              <p style={{ fontSize: 11, fontWeight: 600, color: T.tert, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 8 }}>Type</p>
              <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
                {(["mensuel", "6mois", "annuel"] as AboType[]).map(t => (
                  <button key={t} onClick={() => setPaiementType(t)}
                    style={{ flex: 1, padding: "10px 8px", borderRadius: 10, fontSize: 13, fontWeight: 500, border: `1.5px solid ${paiementType === t ? "#007AFF" : T.border}`, background: paiementType === t ? "rgba(0,122,255,0.08)" : T.surfCard, color: paiementType === t ? "#007AFF" : T.sec, cursor: "pointer", transition: "all 0.15s" }}>
                    <span style={{ display: "block", fontWeight: 600 }}>{ABO_LABELS[t]}</span>
                    <span style={{ fontSize: 12, color: paiementType === t ? "#007AFF" : T.tert }}>{getMontant(t).toLocaleString("fr-FR")} DH</span>
                  </button>
                ))}
              </div>

              <p style={{ fontSize: 11, fontWeight: 600, color: T.tert, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 8 }}>Date de début</p>
              <input type="date" value={paiementDebut} onChange={e => setPaiementDebut(e.target.value)}
                style={{ ...inputStyle, marginBottom: 14 }} />

              {finSec > 0 && (
                <div style={{ background: T.surfForm, borderRadius: 10, padding: "10px 14px", marginBottom: 18, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 13, color: T.sec }}>Fin calculée</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: T.label }}>{formatDateSec(finSec)}</span>
                </div>
              )}

              <div style={{ background: "rgba(0,122,255,0.08)", borderRadius: 10, padding: "10px 14px", marginBottom: 20, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 13, color: "#007AFF" }}>Montant reçu</span>
                <span style={{ fontSize: 15, fontWeight: 700, color: "#007AFF" }}>{montant.toLocaleString("fr-FR")} DH</span>
              </div>

              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={() => setShowPaiement(null)}
                  style={{ flex: 1, padding: "13px 0", borderRadius: 12, background: T.surfForm, color: T.label, fontSize: 15, fontWeight: 500, border: `1px solid ${T.border}`, cursor: "pointer" }}>
                  Annuler
                </button>
                <button onClick={confirmerPaiement} disabled={savingPaiement || !paiementDebut}
                  style={{ flex: 1, padding: "13px 0", borderRadius: 12, background: T.btnBg, color: T.btnFg, fontSize: 15, fontWeight: 600, border: "none", cursor: "pointer", opacity: !paiementDebut ? 0.45 : 1 }}>
                  {savingPaiement ? "Enregistrement…" : "Confirmer"}
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── Modal suppression ── */}
      {confirmDelete && (
        <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 32px", background: T.overlay, backdropFilter: "blur(8px)" }}>
          <div style={{ width: "100%", maxWidth: 290, background: "#FFFFFF", borderRadius: 20, overflow: "hidden", boxShadow: T.shadowModal, textAlign: "center" }}>
            <div style={{ padding: "22px 24px 0" }}>
              <p style={{ fontSize: 16, fontWeight: 600, color: T.label, marginBottom: 6 }}>Supprimer ce marchand ?</p>
              <p style={{ fontSize: 13, color: T.sec, lineHeight: 1.5 }}>Action irréversible. Compte et données supprimés définitivement.</p>
            </div>
            <div style={{ display: "flex", borderTop: `1px solid ${T.sep}`, marginTop: 20 }}>
              <button onClick={() => setConfirmDelete(null)}
                style={{ flex: 1, padding: "14px 0", background: "transparent", color: T.label, fontSize: 16, border: "none", borderRight: `1px solid ${T.sep}`, cursor: "pointer" }}>
                Annuler
              </button>
              <button onClick={() => supprimerMarchand(confirmDelete)} disabled={!!deleting}
                style={{ flex: 1, padding: "14px 0", background: "transparent", color: DANGER, fontSize: 16, fontWeight: 600, border: "none", cursor: "pointer" }}>
                {deleting ? "…" : "Supprimer"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Drawer marchand ── */}
      {selected && (
        <div style={{ position: "fixed", inset: 0, zIndex: 40, display: "flex" }} onClick={() => setSelected(null)}>
          <div style={{ flex: 1, background: T.overlay, backdropFilter: "blur(4px)" }} />
          <div style={{ width: "100%", maxWidth: 400, height: "100%", overflowY: "auto", background: T.drawerBg, backdropFilter: T.drawerBlur, WebkitBackdropFilter: T.drawerBlur, borderLeft: `1px solid ${T.drawerBorder}`, boxShadow: T.drawerShadow }}
            onClick={e => e.stopPropagation()}>
            <div style={{ padding: "28px 22px 48px" }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: T.surfForm, border: `1px solid ${T.border}`, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 18, color: T.label, flexShrink: 0 }}>
                    {selected.logo_url
                      ? <img src={selected.logo_url} alt={selected.nom} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      : (selected.nom?.[0] || "?").toUpperCase()}
                  </div>
                  <div>
                    <p style={{ fontSize: 19, fontWeight: 600, color: T.label }}>{selected.nom || "Marchand"}</p>
                    <p style={{ fontSize: 13, color: T.sec, marginTop: 2 }}>{selected.email}</p>
                  </div>
                </div>
                <button onClick={() => setSelected(null)}
                  style={{ width: 28, height: 28, borderRadius: "50%", background: T.closeBtn, border: `1px solid ${T.border}`, color: T.sec, fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>✕</button>
              </div>

              <SLabel>Informations</SLabel>
              <div style={{ background: T.surfCard, borderRadius: 14, padding: "0 16px", border: `1px solid ${T.border}` }}>
                <Row label="Inscription" value={formatDate(selected.date_inscription)} />
                <Row label="Compte" value={selected.actif ? "Activé" : "Désactivé"} valueColor={selected.actif ? T.actifFg : WARNING} />
                <Row label="ID Firebase" value={selected.id.slice(0, 16) + "…"} />
              </div>

              <SLabel>Abonnement</SLabel>
              {(() => {
                const status = getAboStatus(selected.abonnement_fin);
                const col = ABO_COLORS[status];
                const days = daysLeft(selected.abonnement_fin);
                return (
                  <div style={{ background: T.surfCard, borderRadius: 14, border: `1px solid ${T.border}`, overflow: "hidden" }}>
                    <div style={{ padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: `1px solid ${T.sep}` }}>
                      <span style={{ fontSize: 12, fontWeight: 700, padding: "3px 9px", borderRadius: 6, background: col.bg, color: col.fg }}>{col.label}</span>
                      {selected.abonnement_type && <span style={{ fontSize: 13, color: T.sec }}>{ABO_LABELS[selected.abonnement_type]}</span>}
                    </div>
                    {selected.abonnement_fin ? (
                      <div style={{ padding: "10px 16px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                          <span style={{ fontSize: 13, color: T.sec }}>Début</span>
                          <span style={{ fontSize: 13, fontWeight: 500, color: T.label }}>{formatDateSec(selected.abonnement_debut)}</span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                          <span style={{ fontSize: 13, color: T.sec }}>Fin</span>
                          <span style={{ fontSize: 13, fontWeight: 500, color: status === "expire" ? "#C0392B" : T.label }}>{formatDateSec(selected.abonnement_fin)}</span>
                        </div>
                        {status !== "expire" && (
                          <div style={{ display: "flex", justifyContent: "space-between" }}>
                            <span style={{ fontSize: 13, color: T.sec }}>Jours restants</span>
                            <span style={{ fontSize: 13, fontWeight: 600, color: col.fg }}>{days}j</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p style={{ padding: "12px 16px", fontSize: 13, color: T.tert }}>Aucune période enregistrée.</p>
                    )}
                    {(selected.abonnement_paiements?.length ?? 0) > 0 && (
                      <div style={{ borderTop: `1px solid ${T.sep}`, padding: "10px 16px" }}>
                        <p style={{ fontSize: 11, fontWeight: 600, color: T.tert, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 8 }}>Derniers paiements</p>
                        {[...(selected.abonnement_paiements || [])].reverse().slice(0, 3).map((p, i) => (
                          <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
                            <span style={{ fontSize: 12, color: T.sec }}>{formatDateSec(p.date)} · {ABO_LABELS[p.type]}</span>
                            <span style={{ fontSize: 12, fontWeight: 600, color: T.paidFg }}>{p.montant.toLocaleString("fr-FR")} DH</span>
                          </div>
                        ))}
                      </div>
                    )}
                    <div style={{ padding: "10px 16px", borderTop: `1px solid ${T.sep}` }}>
                      <button onClick={() => openPaiementModal(selected)}
                        style={{ width: "100%", padding: "11px 0", borderRadius: 10, background: T.btnBg, color: T.btnFg, fontSize: 13, fontWeight: 600, border: "none", cursor: "pointer" }}>
                        Confirmer paiement reçu
                      </button>
                    </div>
                  </div>
                );
              })()}

              <SLabel>Localisation & Contact</SLabel>
              <div style={{ background: T.surfCard, borderRadius: 14, padding: "14px 16px", border: `1px solid ${T.border}`, display: "flex", flexDirection: "column", gap: 10 }}>
                <select value={locPays} onChange={e => { setLocPays(e.target.value); setLocVille(""); }}
                  style={{ ...inputStyle }}>
                  {Object.keys(VILLES_ADMIN).map(p => <option key={p} value={p}>{p}</option>)}
                </select>
                <select value={locVille} onChange={e => setLocVille(e.target.value)}
                  style={{ ...inputStyle, color: locVille ? T.label : T.tert }}>
                  <option value="">Sélectionner une ville</option>
                  {(VILLES_ADMIN[locPays] ?? []).map(v => <option key={v} value={v}>{v}</option>)}
                </select>
                <input type="tel" placeholder="Téléphone" value={locTel} onChange={e => setLocTel(e.target.value)}
                  style={{ ...inputStyle }} />
                <button onClick={saveLocalisation} disabled={savingLoc || !locVille}
                  style={{ padding: "11px 0", borderRadius: 10, background: T.btnBg, color: T.btnFg, fontSize: 13, fontWeight: 600, border: "none", cursor: "pointer", opacity: !locVille ? 0.45 : 1 }}>
                  {savingLoc ? "Enregistrement…" : "Enregistrer"}
                </button>
                {selected.ville && <p style={{ fontSize: 12, color: T.tert, textAlign: "center" }}>Actuellement : {selected.ville}</p>}
              </div>

              <SLabel>Tag NFC physique</SLabel>
              {selected.nfc_id ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <div style={{ background: T.surfCard, borderRadius: 12, padding: "11px 14px", fontFamily: "monospace", fontSize: 12, color: T.sec, wordBreak: "break-all", border: `1px solid ${T.border}` }}>
                    app.walliocard.com/nfc/<span style={{ color: T.label, fontWeight: 600 }}>{selected.nfc_id}</span>
                  </div>
                  <button onClick={() => copierNfc(selected.nfc_id!)}
                    style={{ padding: "13px 0", borderRadius: 12, background: copied ? T.paidBg : T.btnBg, color: copied ? T.paidFg : T.btnFg, fontSize: 14, fontWeight: 600, border: "none", cursor: "pointer", transition: "all 0.15s" }}>
                    {copied ? "URL copiée" : "Copier l'URL NFC"}
                  </button>
                  <div style={{ background: T.surfCard, borderRadius: 12, padding: "14px 16px", border: `1px solid ${T.border}` }}>
                    <p style={{ fontSize: 11, fontWeight: 600, color: T.tert, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 10 }}>Programmer le tag — iPhone</p>
                    {["Copier l'URL ci-dessus", "NFC Tools → Write → Add a record → URL", "Coller l'URL → OK → Write", "Approcher le tag → Done"].map((t, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 7 }}>
                        <span style={{ width: 20, height: 20, borderRadius: "50%", background: T.surfForm, color: T.sec, fontSize: 11, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, border: `1px solid ${T.border}` }}>{i + 1}</span>
                        <span style={{ fontSize: 13, color: T.sec }}>{t}</span>
                      </div>
                    ))}
                  </div>
                  <button onClick={() => genererNfc(selected)} disabled={generatingNfc}
                    style={{ padding: "11px 0", borderRadius: 10, background: "transparent", color: WARNING, fontSize: 13, border: `1px solid rgba(255,159,10,0.25)`, cursor: "pointer" }}>
                    {generatingNfc ? "…" : "Régénérer l'ID NFC"}
                  </button>
                </div>
              ) : (
                <button onClick={() => genererNfc(selected)} disabled={generatingNfc}
                  style={{ width: "100%", padding: "13px 0", borderRadius: 12, background: T.btnBg, color: T.btnFg, fontSize: 14, fontWeight: 600, border: "none", cursor: "pointer" }}>
                  {generatingNfc ? "Génération…" : "Générer l'ID NFC"}
                </button>
              )}

              <SLabel>Carte comptoir imprimable</SLabel>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => telechargerCarte(selected)} disabled={!selected.nfc_id || downloadingCard || downloadingQR}
                  style={{ flex: 1, padding: "12px 0", borderRadius: 12, background: T.surfCard, color: selected.nfc_id ? T.label : T.tert, fontSize: 13, fontWeight: 500, border: `1px solid ${T.border}`, cursor: selected.nfc_id ? "pointer" : "not-allowed" }}>
                  {downloadingCard ? "…" : "NFC + QR"}
                </button>
                <button onClick={() => telechargerCarteQR(selected)} disabled={downloadingCard || downloadingQR}
                  style={{ flex: 1, padding: "12px 0", borderRadius: 12, background: T.surfCard, color: T.label, fontSize: 13, fontWeight: 500, border: `1px solid ${T.border}`, cursor: "pointer" }}>
                  {downloadingQR ? "…" : "QR seul"}
                </button>
              </div>
              <p style={{ fontSize: 11, color: T.tert, marginTop: 5 }}>4K · prêt imprimeur</p>

              <SLabel>Gestion du compte</SLabel>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <button onClick={() => toggleActif(selected)} disabled={toggling === selected.id}
                  style={{ padding: "13px 0", borderRadius: 12, background: T.surfCard, color: selected.actif ? DANGER : T.actifFg, fontSize: 14, fontWeight: 500, border: `1px solid ${T.border}`, cursor: "pointer" }}>
                  {toggling === selected.id ? "…" : selected.actif ? "Désactiver le compte" : "Activer le compte"}
                </button>
                <button onClick={() => setConfirmDelete(selected.id)}
                  style={{ padding: "13px 0", borderRadius: 12, background: T.surfCard, color: DANGER, fontSize: 14, fontWeight: 500, border: `1px solid ${T.border}`, cursor: "pointer" }}>
                  Supprimer le compte
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Contenu principal ── */}
      <div style={{ maxWidth: 960, margin: "0 auto", padding: "52px 20px 48px" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 32 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 44, height: 44, borderRadius: 13, background: T.surfCard, border: `1px solid ${T.border}`, boxShadow: T.shadow, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <WallioLogo size={26} />
            </div>
            <div>
              <h1 style={{ fontSize: 21, fontWeight: 600, color: T.label, letterSpacing: "-0.3px", lineHeight: 1 }}>Administration</h1>
              <p style={{ fontSize: 13, color: T.sec, marginTop: 4 }}>
                <span style={{ color: T.actifFg, fontWeight: 500 }}>{actifs}</span> actif{actifs !== 1 ? "s" : ""} · {marchands.length} au total
              </p>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button onClick={() => setShowCreate(true)}
              style={{ padding: "9px 16px", borderRadius: 12, background: T.btnBg, color: T.btnFg, fontSize: 14, fontWeight: 600, border: `1px solid ${T.border}`, boxShadow: T.shadow, cursor: "pointer" }}>
              + Nouveau
            </button>
<button onClick={logout}
              style={{ padding: "9px 14px", borderRadius: 12, background: T.btnSecBg, border: `1px solid ${T.btnSecBorder}`, color: T.btnSecFg, fontSize: 14, fontWeight: 500, cursor: "pointer" }}>
              Sortir
            </button>
          </div>
        </div>

        {/* Onglets */}
        <div style={{ display: "flex", marginBottom: 28, background: T.tabsBg, borderRadius: 10, padding: 3, width: "fit-content" }}>
          {([["marchands", "Marchands"], ["comptabilite", "Comptabilité"]] as const).map(([key, label]) => (
            <button key={key} onClick={() => setTab(key)}
              style={{ padding: "7px 18px", borderRadius: 8, fontSize: 14, fontWeight: tab === key ? 600 : 400, background: tab === key ? T.tabActiveBg : "transparent", color: tab === key ? T.tabActiveFg : T.tabInactiveFg, border: "none", cursor: "pointer", boxShadow: tab === key ? T.shadow : "none", transition: "all 0.15s" }}>
              {label}
            </button>
          ))}
        </div>

        {tab === "marchands" && <>
          {/* Stats */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12, marginBottom: 20 }} className="md:grid-cols-4">
            {[
              { label: "Total",          value: String(marchands.length),              color: T.label },
              { label: "Actifs",         value: String(actifs),                        color: T.actifFg },
              { label: "En attente",     value: String(marchands.length - actifs),     color: "#7A4A00" },
              { label: "Revenus / mois", value: `${revenus.toLocaleString("fr-FR")} DH`, color: T.label },
            ].map(s => (
              <div key={s.label} style={{ ...G, borderRadius: 18, padding: "18px 20px" }}>
                <p style={{ fontSize: 26, fontWeight: 600, color: s.color, letterSpacing: "-0.5px", lineHeight: 1 }}>{s.value}</p>
                <p style={{ fontSize: 12, color: T.sec, marginTop: 6, fontWeight: 400 }}>{s.label}</p>
              </div>
            ))}
          </div>

          {/* Recherche */}
          <div style={{ position: "relative", marginBottom: 14, maxWidth: 280 }}>
            <input type="text" placeholder="Rechercher…" value={search} onChange={e => { setSearch(e.target.value); setPage(0); }}
              style={{ ...inputStyle, borderRadius: 10 }}
              onFocus={e => { e.target.style.borderColor = T.inputFocus; }}
              onBlur={e => { e.target.style.borderColor = T.borderInput; }} />
          </div>

          {filtered.length === 0 ? (
            <div style={{ ...G, borderRadius: 18, padding: "56px 0", textAlign: "center" }}>
              <p style={{ color: T.tert, fontSize: 15 }}>{search ? "Aucun résultat." : "Aucun marchand inscrit."}</p>
            </div>
          ) : (<>
            {/* Cards mobile */}
            <div className="md:hidden" style={{ ...G, borderRadius: 18, overflow: "hidden" }}>
              {paginated.map((m, i) => (
                <button key={m.id} onClick={() => openDrawer(m)}
                  style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", background: "transparent", border: "none", borderBottom: i < paginated.length - 1 ? `1px solid ${T.sep}` : "none", cursor: "pointer", textAlign: "left" }}>
                  <div style={{ width: 38, height: 38, borderRadius: "50%", background: T.surfForm, border: `1px solid ${T.border}`, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 600, fontSize: 14, color: T.label, flexShrink: 0 }}>
                    {m.logo_url
                      ? <img src={m.logo_url} alt={m.nom} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      : (m.nom?.[0] || "?").toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 15, fontWeight: 500, color: T.label, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{m.nom || "—"}</p>
                    <p style={{ fontSize: 12, color: T.sec, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{m.email || "—"}</p>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4, flexShrink: 0 }}>
                    <Badge statut={m.abonnement_statut} />
                    <span style={{ fontSize: 11, color: m.actif ? T.actifFg : T.inactifFg, fontWeight: 500 }}>{m.actif ? "● Actif" : "● Inactif"}</span>
                  </div>
                  <span style={{ color: T.tert, fontSize: 18, marginLeft: 2 }}>›</span>
                </button>
              ))}
            </div>

            {/* Table desktop */}
            <div className="hidden md:block" style={{ ...G, borderRadius: 18, overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${T.sep}` }}>
                    {["Établissement", "Email", "NFC", "Inscription", "Abonnement", "Compte", "Carte", ""].map(h => (
                      <th key={h} style={{ textAlign: "left", fontSize: 11, fontWeight: 600, color: T.tert, padding: "12px 20px", textTransform: "uppercase", letterSpacing: "0.06em" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((m, i) => (
                    <tr key={m.id} style={{ borderBottom: i < paginated.length - 1 ? `1px solid ${T.sep}` : "none", cursor: "pointer" }}
                      onMouseEnter={e => (e.currentTarget.style.background = T.rowHover)}
                      onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                      onClick={() => openDrawer(m)}>
                      <td style={{ padding: "13px 20px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div style={{ width: 32, height: 32, borderRadius: "50%", background: T.surfForm, border: `1px solid ${T.border}`, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 600, fontSize: 12, color: T.label, flexShrink: 0 }}>
                            {m.logo_url
                              ? <img src={m.logo_url} alt={m.nom} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                              : (m.nom?.[0] || "?").toUpperCase()}
                          </div>
                          <span style={{ fontSize: 15, fontWeight: 500, color: T.label, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 160 }}>{m.nom || "—"}</span>
                        </div>
                      </td>
                      <td style={{ padding: "13px 20px", maxWidth: 180 }}>
                        <span style={{ fontSize: 13, color: T.sec, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", display: "block" }}>{m.email || "—"}</span>
                      </td>
                      <td style={{ padding: "13px 20px" }}>
                        {m.nfc_id
                          ? <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 8px", borderRadius: 6, background: T.nfcBg, color: T.nfcFg }}>NFC</span>
                          : <span style={{ color: T.tert }}>—</span>}
                      </td>
                      <td style={{ padding: "13px 20px", fontSize: 13, color: T.sec }}>{formatDate(m.date_inscription)}</td>
                      <td style={{ padding: "13px 20px" }}><Badge statut={m.abonnement_statut} /></td>
                      <td style={{ padding: "13px 20px" }}>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 500, color: m.actif ? T.actifFg : T.inactifFg }}>
                          <span style={{ width: 6, height: 6, borderRadius: "50%", background: m.actif ? T.actifDot : T.inactifDot }} />
                          {m.actif ? "Actif" : "Inactif"}
                        </span>
                      </td>
                      <td style={{ padding: "13px 12px" }}>
                        <div style={{ display: "flex", gap: 6 }}>
                          <button onClick={async e => { e.stopPropagation(); if (!m.nfc_id) return; const b = e.currentTarget; b.textContent = "…"; b.setAttribute("disabled","true"); await telechargerCarte(m); b.textContent = "NFC+QR"; b.removeAttribute("disabled"); }}
                            disabled={!m.nfc_id}
                            style={{ fontSize: 12, fontWeight: 500, padding: "6px 10px", borderRadius: 8, background: T.surfCard, color: m.nfc_id ? T.label : T.tert, border: `1px solid ${T.border}`, cursor: m.nfc_id ? "pointer" : "not-allowed", opacity: m.nfc_id ? 1 : 0.45 }}>
                            NFC+QR
                          </button>
                          <button onClick={async e => { e.stopPropagation(); const b = e.currentTarget; b.textContent = "…"; b.setAttribute("disabled","true"); await telechargerCarteQR(m); b.textContent = "QR"; b.removeAttribute("disabled"); }}
                            style={{ fontSize: 12, fontWeight: 500, padding: "6px 10px", borderRadius: 8, background: T.surfCard, color: T.label, border: `1px solid ${T.border}`, cursor: "pointer" }}>
                            QR
                          </button>
                        </div>
                      </td>
                      <td style={{ padding: "13px 12px" }}>
                        <button onClick={e => { e.stopPropagation(); openDrawer(m); }}
                          style={{ fontSize: 13, fontWeight: 500, padding: "7px 14px", borderRadius: 8, background: T.surfCard, color: T.sec, border: `1px solid ${T.border}`, cursor: "pointer" }}>
                          Voir →
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, marginTop: 16 }}>
              <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
                style={{ padding: "8px 16px", borderRadius: 10, background: T.surfCard, border: `1px solid ${T.border}`, color: page === 0 ? T.tert : T.label, fontSize: 14, cursor: page === 0 ? "default" : "pointer" }}>
                ←
              </button>
              <span style={{ fontSize: 13, color: T.sec }}>
                {page + 1} / {totalPages} · {filtered.length} marchands
              </span>
              <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
                style={{ padding: "8px 16px", borderRadius: 10, background: T.surfCard, border: `1px solid ${T.border}`, color: page >= totalPages - 1 ? T.tert : T.label, fontSize: 14, cursor: page >= totalPages - 1 ? "default" : "pointer" }}>
                →
              </button>
            </div>
          )}
          </>)}
        </>}

        {/* ── Comptabilité ── */}
        {tab === "comptabilite" && (() => {
          const now = Date.now();
          const aboActifList = marchands.filter(m => getAboStatus(m.abonnement_fin) === "actif");
          const aboBientotList = marchands.filter(m => getAboStatus(m.abonnement_fin) === "bientot");
          const aboExpireList = marchands.filter(m => getAboStatus(m.abonnement_fin) === "expire");
          const mrrTotal = (aboActifList.length + aboBientotList.length) * 349;
          const comptaList = [...marchands].sort((a, b) => {
            if (!a.abonnement_fin && !b.abonnement_fin) return 0;
            if (!a.abonnement_fin) return 1;
            if (!b.abonnement_fin) return -1;
            return a.abonnement_fin - b.abonnement_fin;
          });
          return (
            <div>
              {/* Stats */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12, marginBottom: 24 }}>
                {[
                  { label: "MRR estimé",    value: `${mrrTotal.toLocaleString("fr-FR")} DH`, color: T.label },
                  { label: "Abonnements actifs", value: String(aboActifList.length + aboBientotList.length), color: T.actifFg },
                  { label: "Expire < 15j",  value: String(aboBientotList.length), color: "#7A4A00" },
                  { label: "Expirés",       value: String(aboExpireList.length), color: DANGER },
                ].map(s => (
                  <div key={s.label} style={{ ...G, borderRadius: 18, padding: "18px 20px" }}>
                    <p style={{ fontSize: 26, fontWeight: 600, color: s.color, letterSpacing: "-0.5px", lineHeight: 1 }}>{s.value}</p>
                    <p style={{ fontSize: 12, color: T.sec, marginTop: 6 }}>{s.label}</p>
                  </div>
                ))}
              </div>

              {/* Cards mobile */}
              <div className="md:hidden" style={{ ...G, borderRadius: 18, overflow: "hidden" }}>
                {comptaList.map((m, i) => {
                  const status = getAboStatus(m.abonnement_fin);
                  const col = ABO_COLORS[status];
                  const days = daysLeft(m.abonnement_fin);
                  return (
                    <div key={m.id} style={{ padding: "14px 16px", borderBottom: i < comptaList.length - 1 ? `1px solid ${T.sep}` : "none" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                        <div style={{ width: 36, height: 36, borderRadius: "50%", background: T.surfForm, border: `1px solid ${T.border}`, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 600, fontSize: 13, color: T.label, flexShrink: 0 }}>
                          {m.logo_url ? <img src={m.logo_url} alt={m.nom} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : (m.nom?.[0] || "?").toUpperCase()}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: 15, fontWeight: 600, color: T.label, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.nom || "—"}</p>
                          <p style={{ fontSize: 12, color: T.sec }}>{m.abonnement_type ? ABO_LABELS[m.abonnement_type] : "Pas d'abonnement"}</p>
                        </div>
                        <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 8px", borderRadius: 6, background: col.bg, color: col.fg, whiteSpace: "nowrap", flexShrink: 0 }}>
                          {col.label}{status === "bientot" || status === "actif" ? ` (${days}j)` : ""}
                        </span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12, color: T.sec, marginBottom: 10 }}>
                        <span>{formatDateSec(m.abonnement_debut)} → <span style={{ color: status === "expire" ? "#C0392B" : T.sec }}>{formatDateSec(m.abonnement_fin)}</span></span>
                        <span>{m.abonnement_paiements?.length ? `${m.abonnement_paiements.length} paiement${m.abonnement_paiements.length > 1 ? "s" : ""}` : "—"}</span>
                      </div>
                      <button onClick={() => openPaiementModal(m)}
                        style={{ width: "100%", padding: "10px 0", borderRadius: 10, background: T.btnBg, color: T.btnFg, fontSize: 13, fontWeight: 600, border: "none", cursor: "pointer" }}>
                        + Paiement
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Table desktop */}
              <div className="hidden md:block" style={{ ...G, borderRadius: 18, overflow: "hidden" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${T.sep}` }}>
                      {["Établissement", "Type", "Début", "Fin", "Statut", "Paiements"].map(h => (
                        <th key={h} style={{ textAlign: "left", fontSize: 11, fontWeight: 600, color: T.tert, padding: "12px 16px", textTransform: "uppercase", letterSpacing: "0.06em" }}>{h}</th>
                      ))}
                      <th style={{ padding: "12px 16px" }} />
                    </tr>
                  </thead>
                  <tbody>
                    {comptaList.map((m, i) => {
                      const status = getAboStatus(m.abonnement_fin);
                      const col = ABO_COLORS[status];
                      const days = daysLeft(m.abonnement_fin);
                      return (
                        <tr key={m.id} style={{ borderBottom: i < comptaList.length - 1 ? `1px solid ${T.sep}` : "none", cursor: "pointer" }}
                          onMouseEnter={e => (e.currentTarget.style.background = T.rowHover)}
                          onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                          onClick={() => openDrawer(m)}>
                          <td style={{ padding: "12px 16px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                              <div style={{ width: 30, height: 30, borderRadius: "50%", background: T.surfForm, border: `1px solid ${T.border}`, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 600, fontSize: 12, color: T.label, flexShrink: 0 }}>
                                {m.logo_url ? <img src={m.logo_url} alt={m.nom} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : (m.nom?.[0] || "?").toUpperCase()}
                              </div>
                              <span style={{ fontSize: 14, fontWeight: 500, color: T.label }}>{m.nom || "—"}</span>
                            </div>
                          </td>
                          <td style={{ padding: "12px 16px", fontSize: 13, color: T.sec }}>{m.abonnement_type ? ABO_LABELS[m.abonnement_type] : "—"}</td>
                          <td style={{ padding: "12px 16px", fontSize: 13, color: T.sec }}>{formatDateSec(m.abonnement_debut)}</td>
                          <td style={{ padding: "12px 16px", fontSize: 13, color: status === "expire" ? "#C0392B" : T.sec }}>{formatDateSec(m.abonnement_fin)}</td>
                          <td style={{ padding: "12px 16px" }}>
                            <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 8px", borderRadius: 6, background: col.bg, color: col.fg, whiteSpace: "nowrap" }}>
                              {col.label}{status === "bientot" ? ` (${days}j)` : status === "actif" ? ` (${days}j)` : ""}
                            </span>
                          </td>
                          <td style={{ padding: "12px 16px", fontSize: 13, color: T.sec }}>
                            {m.abonnement_paiements?.length ? `${m.abonnement_paiements.length} paiement${m.abonnement_paiements.length > 1 ? "s" : ""}` : "—"}
                          </td>
                          <td style={{ padding: "12px 12px", textAlign: "right" }}>
                            <button onClick={e => { e.stopPropagation(); openPaiementModal(m); }}
                              style={{ fontSize: 12, fontWeight: 600, padding: "7px 12px", borderRadius: 8, background: T.btnBg, color: T.btnFg, border: "none", cursor: "pointer", whiteSpace: "nowrap" }}>
                              + Paiement
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })()}


      </div>
    </main>
  );
}
