"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import WallioLogo from "@/components/WallioLogo";
import { drawPrintCard, drawPrintCardQROnly, PRINT_W, PRINT_H } from "@/lib/print-card-draw";

type Marchand = {
  id: string; nom: string; email: string; actif: boolean;
  date_inscription?: { seconds: number }; nfc_id?: string;
  logo_url?: string; couleur_principale?: string; couleur_secondaire?: string;
  abonnement_statut?: "actif" | "en_attente" | "suspendu";
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
  btnBg: "#FFFFFF", btnFg: "#111113",
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
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const [tab, setTab] = useState<"marchands" | "impression">("marchands");
  const [impUrl, setImpUrl] = useState("https://app.walliocard.com/nfc/demo");
  const [impUrls, setImpUrls] = useState("");
  const [impGenerating, setImpGenerating] = useState(false);
  const [impProgress, setImpProgress] = useState(0);
  const previewRef = useRef<HTMLCanvasElement>(null);
  const router = useRouter();

  useEffect(() => {
    let unsub: (() => void) | null = null;
    async function init() {
      const res = await fetch("/api/admin/check");
      if (!res.ok) { router.push("/admin/login"); return; }
      unsub = onSnapshot(collection(db, "marchands"), snap => {
        const all = snap.docs.map(d => ({ id: d.id, nom: "", email: "", actif: false, ...d.data() } as Marchand));
        all.sort((a, b) => (b.date_inscription?.seconds ?? 0) - (a.date_inscription?.seconds ?? 0));
        setMarchands(all);
        setLoading(false);
      });
    }
    init();
    return () => { unsub?.(); };
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
    if (!createNom || !createEmail || !createPassword) return;
    setCreating(true); setCreateError("");
    const res = await fetch("/api/admin/create-marchand", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ nom: createNom, email: createEmail, password: createPassword }) });
    const data = await res.json();
    if (!res.ok) { setCreateError(data.error || "Erreur"); setCreating(false); return; }
    setShowCreate(false); setCreateNom(""); setCreateEmail(""); setCreatePassword(""); setCreating(false);
    const { getDoc, doc } = await import("firebase/firestore");
    const snap = await getDoc(doc((await import("@/lib/firebase")).db, "marchands", data.uid));
    if (snap.exists()) setSelected({ id: snap.id, nom: "", email: "", actif: false, ...snap.data() } as Marchand);
  }
  async function copierNfc(nfc_id: string) {
    await navigator.clipboard.writeText(`https://app.walliocard.com/nfc/${nfc_id}`);
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  }
  useEffect(() => {
    const canvas = previewRef.current;
    if (!canvas) return;
    drawPrintCard(canvas, impUrl, 0.42).catch(() => {});
  }, [impUrl]);
  async function impDownloadSingle() {
    setImpGenerating(true);
    const canvas = document.createElement("canvas");
    await drawPrintCard(canvas, impUrl, 3);
    const a = document.createElement("a");
    a.download = "wallio-carte-comptoir.png"; a.href = canvas.toDataURL("image/png"); a.click();
    setImpGenerating(false);
  }
  async function impDownloadBatch() {
    const list = impUrls.split("\n").map(l => l.trim()).filter(Boolean);
    if (!list.length) return;
    setImpGenerating(true); setImpProgress(0);
    const JSZip = (await import("jszip")).default;
    const zip = new JSZip();
    for (let i = 0; i < list.length; i++) {
      const canvas = document.createElement("canvas");
      await drawPrintCard(canvas, list[i], 3);
      const blob = await new Promise<Blob>(r => canvas.toBlob(b => r(b!), "image/png"));
      zip.file(`wallio-carte-${String(i + 1).padStart(2, "0")}.png`, blob);
      setImpProgress(Math.round(((i + 1) / list.length) * 100));
    }
    const content = await zip.generateAsync({ type: "blob" });
    const a = document.createElement("a");
    a.download = `wallio-cartes-${list.length}.zip`; a.href = URL.createObjectURL(content); a.click();
    setImpGenerating(false); setImpProgress(0);
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
      <div style={{ width: 22, height: 22, borderRadius: "50%", border: `2px solid ${T.border}`, borderTopColor: T.btnBg, animation: "spin 0.8s linear infinite" }} />
    </main>
  );

  const actifs = marchands.filter(m => m.actif).length;
  const aboActifs = marchands.filter(m => m.abonnement_statut === "actif").length;
  const revenus = aboActifs * 350;
  const filtered = marchands.filter(m =>
    !search || m.nom?.toLowerCase().includes(search.toLowerCase()) || m.email?.toLowerCase().includes(search.toLowerCase())
  );

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
              ].map((f, i, arr) => (
                <div key={f.label}>
                  <input type={f.type} value={f.value} onChange={e => f.set(e.target.value)} placeholder={f.placeholder}
                    style={{ ...inputStyle, background: "transparent", borderRadius: 0, border: "none", padding: "13px 16px", fontSize: 15 }} />
                  {i < arr.length - 1 && <div style={{ height: 1, background: T.sep, marginLeft: 16 }} />}
                </div>
              ))}
            </div>
            {createError && <p style={{ fontSize: 13, color: DANGER, marginBottom: 10 }}>{createError}</p>}
            <div style={{ display: "flex", gap: 10, marginTop: 6 }}>
              <button onClick={() => { setShowCreate(false); setCreateError(""); }}
                style={{ flex: 1, padding: "13px 0", borderRadius: 12, background: T.surfForm, color: T.label, fontSize: 15, fontWeight: 500, border: `1px solid ${T.border}`, cursor: "pointer" }}>
                Annuler
              </button>
              <button onClick={creerMarchand} disabled={creating || !createNom || !createEmail || !createPassword}
                style={{ flex: 1, padding: "13px 0", borderRadius: 12, background: T.btnBg, color: T.btnFg, fontSize: 15, fontWeight: 600, border: "none", cursor: "pointer", opacity: (!createNom || !createEmail || !createPassword) ? 0.45 : 1 }}>
                {creating ? "Création…" : "Créer"}
              </button>
            </div>
          </div>
        </div>
      )}

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
              <div style={{ background: T.surfCard, borderRadius: 14, padding: "14px 16px", border: `1px solid ${T.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 600, color: selected.abonnement_statut === "actif" ? T.paidFg : WARNING }}>
                    {selected.abonnement_statut === "actif" ? "Payé" : "En attente"}
                  </p>
                  {selected.abonnement_statut === "actif" && <p style={{ fontSize: 12, color: T.tert, marginTop: 2 }}>350 DH / mois</p>}
                </div>
                <button onClick={() => toggleAbonnement(selected)} disabled={updatingAbo}
                  style={{ fontSize: 12, fontWeight: 500, padding: "7px 12px", borderRadius: 8, background: T.surfForm, color: T.sec, border: `1px solid ${T.border}`, cursor: "pointer" }}>
                  {updatingAbo ? "…" : selected.abonnement_statut === "actif" ? "Marquer impayé" : "Marquer payé"}
                </button>
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
          {([["marchands", "Marchands"], ["impression", "Cartes comptoir"]] as const).map(([key, label]) => (
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
            <input type="text" placeholder="Rechercher…" value={search} onChange={e => setSearch(e.target.value)}
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
              {filtered.map((m, i) => (
                <button key={m.id} onClick={() => setSelected(m)}
                  style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", background: "transparent", border: "none", borderBottom: i < filtered.length - 1 ? `1px solid ${T.sep}` : "none", cursor: "pointer", textAlign: "left" }}>
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
                  {filtered.map((m, i) => (
                    <tr key={m.id} style={{ borderBottom: i < filtered.length - 1 ? `1px solid ${T.sep}` : "none", cursor: "pointer" }}
                      onMouseEnter={e => (e.currentTarget.style.background = T.rowHover)}
                      onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                      onClick={() => setSelected(m)}>
                      <td style={{ padding: "13px 20px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div style={{ width: 32, height: 32, borderRadius: "50%", background: T.surfForm, border: `1px solid ${T.border}`, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 600, fontSize: 12, color: T.label, flexShrink: 0 }}>
                            {m.logo_url
                              ? <img src={m.logo_url} alt={m.nom} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                              : (m.nom?.[0] || "?").toUpperCase()}
                          </div>
                          <span style={{ fontSize: 15, fontWeight: 500, color: T.label }}>{m.nom || "—"}</span>
                        </div>
                      </td>
                      <td style={{ padding: "13px 20px", fontSize: 13, color: T.sec }}>{m.email || "—"}</td>
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
                        <button onClick={e => { e.stopPropagation(); setSelected(m); }}
                          style={{ fontSize: 13, fontWeight: 500, padding: "7px 14px", borderRadius: 8, background: T.surfCard, color: T.sec, border: `1px solid ${T.border}`, cursor: "pointer" }}>
                          Voir →
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>)}
        </>}

        {/* ── Cartes comptoir ── */}
        {tab === "impression" && (
          <div style={{ display: "flex", gap: 20, alignItems: "flex-start", flexWrap: "wrap" }}>
            <div style={{ flex: "0 0 280px", display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ ...G, borderRadius: 18, padding: 20 }}>
                <p style={{ fontSize: 11, fontWeight: 600, color: T.tert, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 12 }}>URL unique</p>
                <input type="text" value={impUrl} onChange={e => setImpUrl(e.target.value)}
                  placeholder="https://app.walliocard.com/nfc/xxx"
                  style={{ ...inputStyle, fontSize: 13, marginBottom: 10 }} />
                <button onClick={impDownloadSingle} disabled={impGenerating}
                  style={{ width: "100%", padding: "12px 0", borderRadius: 10, background: impGenerating ? T.surfForm : T.btnBg, color: impGenerating ? T.sec : T.btnFg, fontSize: 14, fontWeight: 600, border: "none", cursor: "pointer" }}>
                  {impGenerating ? "Génération…" : "Télécharger PNG 4K"}
                </button>
              </div>
              <div style={{ ...G, borderRadius: 18, padding: 20 }}>
                <p style={{ fontSize: 11, fontWeight: 600, color: T.tert, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 12 }}>Batch — une URL par ligne</p>
                <textarea value={impUrls} onChange={e => setImpUrls(e.target.value)} rows={7}
                  placeholder={"https://app.walliocard.com/nfc/abc\nhttps://app.walliocard.com/nfc/def"}
                  style={{ ...inputStyle, fontSize: 12, fontFamily: "monospace", resize: "none", marginBottom: 8 }} />
                <p style={{ fontSize: 11, color: T.tert, marginBottom: 10 }}>{impUrls.split("\n").map(l => l.trim()).filter(Boolean).length} carte(s)</p>
                {impGenerating && impProgress > 0 && (
                  <div style={{ marginBottom: 10 }}>
                    <div style={{ height: 3, background: T.border, borderRadius: 2, overflow: "hidden" }}>
                      <div style={{ width: `${impProgress}%`, height: "100%", background: T.btnBg, transition: "width 0.3s" }} />
                    </div>
                    <p style={{ fontSize: 11, color: T.sec, marginTop: 4 }}>{impProgress}%</p>
                  </div>
                )}
                <button onClick={impDownloadBatch} disabled={impGenerating || !impUrls.split("\n").some(l => l.trim())}
                  style={{ width: "100%", padding: "12px 0", borderRadius: 10, background: T.btnBg, color: T.btnFg, fontSize: 14, fontWeight: 600, border: "none", cursor: "pointer", opacity: !impUrls.split("\n").some(l => l.trim()) ? 0.4 : 1 }}>
                  {impGenerating ? `Génération… ${impProgress}%` : "Télécharger ZIP"}
                </button>
              </div>
              <div style={{ ...G, borderRadius: 18, padding: 20 }}>
                <p style={{ fontSize: 11, fontWeight: 600, color: T.tert, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 12 }}>Specs imprimeur</p>
                {[["Canvas", `${PRINT_W}×${PRINT_H}px`], ["Export", "4500×3000px"], ["Ratio", "3:2"], ["Format", "PNG RVB"], ["Support", "PVC 1mm"]].map(([k, v]) => (
                  <div key={k} style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <span style={{ fontSize: 13, color: T.sec }}>{k}</span>
                    <span style={{ fontSize: 13, fontWeight: 500, color: T.label }}>{v}</span>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ flex: 1, ...G, borderRadius: 18, padding: 20 }}>
              <p style={{ fontSize: 11, fontWeight: 600, color: T.tert, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 16 }}>Aperçu — 42%</p>
              <div style={{ borderRadius: 8, overflow: "hidden", display: "inline-block", boxShadow: "0 4px 16px rgba(0,0,0,0.08)" }}>
                <canvas ref={previewRef} style={{ display: "block", width: Math.round(PRINT_W * 0.42), height: Math.round(PRINT_H * 0.42) }} />
              </div>
              <p style={{ fontSize: 11, color: T.tert, marginTop: 10 }}>Fichier téléchargé : 4500×3000px</p>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
