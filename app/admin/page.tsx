"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import WallioLogo from "@/components/WallioLogo";
import { drawPrintCard, drawPrintCardQROnly, PRINT_W, PRINT_H } from "@/lib/print-card-draw";

type Marchand = {
  id: string;
  nom: string;
  email: string;
  actif: boolean;
  date_inscription?: { seconds: number };
  nfc_id?: string;
  logo_url?: string;
  couleur_principale?: string;
  couleur_secondaire?: string;
  abonnement_statut?: "actif" | "en_attente" | "suspendu";
};

function slugify(str: string) {
  return str.toLowerCase()
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function genNfcId(nom: string) {
  const base = slugify(nom) || "marchand";
  const rand = Math.random().toString(36).substring(2, 7);
  return `${base}-${rand}`;
}

function formatDate(ts?: { seconds: number }) {
  if (!ts) return "—";
  return new Date(ts.seconds * 1000).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
}

// Palette iOS dark mode réelle
const BG      = "#000000";
const SURFACE = "#1C1C1E";
const SURFACE2= "#2C2C2E";
const SEP     = "rgba(60,60,67,0.36)";
const LABEL   = "#FFFFFF";
const SEC     = "#8E8E93";
const TERT    = "#48484A";
const GREEN   = "#00F5A0";
const RED     = "#FF453A";
const ORANGE  = "#FF9F0A";
const TGREEN  = "#30D158";

function Row({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 0", borderBottom: `1px solid ${SEP}` }}>
      <span style={{ fontSize: 14, color: SEC }}>{label}</span>
      <span style={{ fontSize: 14, fontWeight: 500, color: valueColor || LABEL }}>{value}</span>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ fontSize: 12, fontWeight: 500, color: SEC, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8, marginTop: 24 }}>
      {children}
    </p>
  );
}

const inputStyle: React.CSSProperties = {
  background: SURFACE,
  border: "none",
  color: LABEL,
  borderRadius: 10,
  padding: "12px 14px",
  fontSize: 15,
  outline: "none",
  width: "100%",
  boxSizing: "border-box",
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
    let unsubSnap: (() => void) | null = null;
    async function init() {
      const res = await fetch("/api/admin/check");
      if (!res.ok) { router.push("/admin/login"); return; }
      unsubSnap = onSnapshot(collection(db, "marchands"), snap => {
        const all = snap.docs.map(d => ({ id: d.id, nom: "", email: "", actif: false, ...d.data() } as Marchand));
        all.sort((a, b) => (b.date_inscription?.seconds ?? 0) - (a.date_inscription?.seconds ?? 0));
        setMarchands(all);
        setLoading(false);
      });
    }
    init();
    return () => { unsubSnap?.(); };
  }, [router]);

  async function adminPatch(marchandId: string, fields: Record<string, unknown>) {
    const res = await fetch("/api/admin/update-marchand", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ marchandId, fields }),
    });
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || `HTTP ${res.status}`);
  }

  async function adminDelete(marchandId: string) {
    const res = await fetch("/api/admin/update-marchand", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ marchandId }),
    });
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || `HTTP ${res.status}`);
  }

  async function toggleActif(m: Marchand) {
    const newActif = !m.actif;
    const updated = { ...m, actif: newActif };
    setMarchands(prev => prev.map(x => x.id === m.id ? updated : x));
    if (selected?.id === m.id) setSelected(updated);
    setToggling(m.id);
    try { await adminPatch(m.id, { actif: newActif }); }
    catch {
      setMarchands(prev => prev.map(x => x.id === m.id ? m : x));
      if (selected?.id === m.id) setSelected(m);
    }
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
    catch {
      setMarchands(prev => prev.map(x => x.id === m.id ? m : x));
      setSelected(m);
    }
    setGeneratingNfc(false);
  }

  async function toggleAbonnement(m: Marchand) {
    setUpdatingAbo(true);
    const newStatut: Marchand["abonnement_statut"] =
      m.abonnement_statut === "actif" ? "en_attente" : "actif";
    const updated = { ...m, abonnement_statut: newStatut };
    setMarchands(prev => prev.map(x => x.id === m.id ? updated : x));
    setSelected(updated);
    try { await adminPatch(m.id, { abonnement_statut: newStatut }); }
    catch {
      setMarchands(prev => prev.map(x => x.id === m.id ? m : x));
      setSelected(m);
    }
    setUpdatingAbo(false);
  }

  async function telechargerCarte(m: Marchand) {
    if (!m.nfc_id) return;
    setDownloadingCard(true);
    const canvas = document.createElement("canvas");
    await drawPrintCard(canvas, `https://app.walliocard.com/nfc/${m.nfc_id}`, 3);
    const link = document.createElement("a");
    link.download = `wallio-carte-${slugify(m.nom || m.id)}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
    setDownloadingCard(false);
  }

  async function telechargerCarteQR(m: Marchand) {
    setDownloadingQR(true);
    const canvas = document.createElement("canvas");
    const url = m.nfc_id ? `https://app.walliocard.com/nfc/${m.nfc_id}` : "https://app.walliocard.com";
    await drawPrintCardQROnly(canvas, url, 3);
    const link = document.createElement("a");
    link.download = `wallio-qr-${slugify(m.nom || m.id)}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
    setDownloadingQR(false);
  }

  async function creerMarchand() {
    if (!createNom || !createEmail || !createPassword) return;
    setCreating(true); setCreateError("");
    const res = await fetch("/api/admin/create-marchand", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nom: createNom, email: createEmail, password: createPassword }),
    });
    const data = await res.json();
    if (!res.ok) { setCreateError(data.error || "Erreur"); setCreating(false); return; }
    setShowCreate(false);
    setCreateNom(""); setCreateEmail(""); setCreatePassword("");
    setCreating(false);
    const { getDoc, doc } = await import("firebase/firestore");
    const snap = await getDoc(doc((await import("@/lib/firebase")).db, "marchands", data.uid));
    if (snap.exists()) setSelected({ id: snap.id, nom: "", email: "", actif: false, ...snap.data() } as Marchand);
  }

  async function copierNfc(nfc_id: string) {
    await navigator.clipboard.writeText(`https://app.walliocard.com/nfc/${nfc_id}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
    const link = document.createElement("a");
    link.download = "wallio-carte-comptoir.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
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
    const link = document.createElement("a");
    link.download = `wallio-cartes-${list.length}.zip`;
    link.href = URL.createObjectURL(content);
    link.click();
    setImpGenerating(false); setImpProgress(0);
  }

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
  }

  if (loading) return (
    <main style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: BG }}>
      <div style={{ width: 24, height: 24, borderRadius: "50%", border: `2px solid ${TERT}`, borderTopColor: GREEN, animation: "spin 0.8s linear infinite" }} />
    </main>
  );

  const actifs = marchands.filter(m => m.actif).length;
  const aboActifs = marchands.filter(m => m.abonnement_statut === "actif").length;
  const revenus = aboActifs * 350;
  const filtered = marchands.filter(m =>
    !search ||
    m.nom?.toLowerCase().includes(search.toLowerCase()) ||
    m.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <main style={{ minHeight: "100vh", background: BG, color: LABEL }}>

      {/* ── Modal nouveau marchand ── */}
      {showCreate && (
        <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "flex-end", justifyContent: "center", background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)" }}
          onClick={() => { setShowCreate(false); setCreateError(""); }}>
          <div style={{ width: "100%", maxWidth: 480, background: SURFACE, borderRadius: "20px 20px 0 0", padding: "32px 24px 40px" }}
            onClick={e => e.stopPropagation()}>
            <div style={{ width: 36, height: 4, background: TERT, borderRadius: 2, margin: "0 auto 24px" }} />
            <h3 style={{ fontSize: 20, fontWeight: 600, color: LABEL, marginBottom: 4 }}>Nouveau marchand</h3>
            <p style={{ fontSize: 14, color: SEC, marginBottom: 20 }}>Crée le compte + génère le NFC ID automatiquement</p>
            <div style={{ background: SURFACE2, borderRadius: 12, overflow: "hidden", marginBottom: 12 }}>
              {[
                { label: "Nom du commerce", value: createNom, set: setCreateNom, placeholder: "Café Central", type: "text" },
                { label: "Email", value: createEmail, set: setCreateEmail, placeholder: "contact@cafe.ma", type: "email" },
                { label: "Mot de passe", value: createPassword, set: setCreatePassword, placeholder: "Min. 8 caractères", type: "password" },
              ].map((f, i, arr) => (
                <div key={f.label}>
                  <input type={f.type} value={f.value} onChange={e => f.set(e.target.value)}
                    placeholder={f.placeholder}
                    style={{ ...inputStyle, background: "transparent", borderRadius: 0, padding: "14px 16px", fontSize: 16 }} />
                  {i < arr.length - 1 && <div style={{ height: 1, background: SEP, marginLeft: 16 }} />}
                </div>
              ))}
            </div>
            {createError && <p style={{ fontSize: 13, color: RED, marginBottom: 12 }}>{createError}</p>}
            <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
              <button onClick={() => { setShowCreate(false); setCreateError(""); }}
                style={{ flex: 1, padding: "14px 0", borderRadius: 12, background: SURFACE2, color: LABEL, fontSize: 15, fontWeight: 500, border: "none", cursor: "pointer" }}>
                Annuler
              </button>
              <button onClick={creerMarchand} disabled={creating || !createNom || !createEmail || !createPassword}
                style={{ flex: 1, padding: "14px 0", borderRadius: 12, background: GREEN, color: "#000", fontSize: 15, fontWeight: 700, border: "none", cursor: "pointer", opacity: (!createNom || !createEmail || !createPassword) ? 0.4 : 1 }}>
                {creating ? "Création…" : "Créer"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal confirmation suppression ── */}
      {confirmDelete && (
        <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 24px", background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)" }}>
          <div style={{ width: "100%", maxWidth: 300, background: SURFACE, borderRadius: 16, overflow: "hidden", textAlign: "center" }}>
            <div style={{ padding: "20px 24px 0" }}>
              <p style={{ fontSize: 17, fontWeight: 600, color: LABEL, marginBottom: 4 }}>Supprimer ce marchand ?</p>
              <p style={{ fontSize: 13, color: SEC, lineHeight: 1.5 }}>Action irréversible. Compte et données supprimés définitivement.</p>
            </div>
            <div style={{ display: "flex", borderTop: `1px solid ${SEP}`, marginTop: 20 }}>
              <button onClick={() => setConfirmDelete(null)}
                style={{ flex: 1, padding: "14px 0", background: "transparent", color: LABEL, fontSize: 17, border: "none", borderRight: `1px solid ${SEP}`, cursor: "pointer" }}>
                Annuler
              </button>
              <button onClick={() => supprimerMarchand(confirmDelete)} disabled={!!deleting}
                style={{ flex: 1, padding: "14px 0", background: "transparent", color: RED, fontSize: 17, fontWeight: 600, border: "none", cursor: "pointer" }}>
                {deleting ? "…" : "Supprimer"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Drawer marchand ── */}
      {selected && (
        <div style={{ position: "fixed", inset: 0, zIndex: 40, display: "flex" }} onClick={() => setSelected(null)}>
          <div style={{ flex: 1, background: "rgba(0,0,0,0.5)" }} />
          <div style={{ width: "100%", maxWidth: 400, height: "100%", overflowY: "auto", background: "#111111", borderLeft: `1px solid ${SURFACE2}` }}
            onClick={e => e.stopPropagation()}>
            <div style={{ padding: "24px 20px 40px" }}>
              {/* Header */}
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24 }}>
                <div>
                  <p style={{ fontSize: 20, fontWeight: 600, color: LABEL }}>{selected.nom || "Marchand"}</p>
                  <p style={{ fontSize: 13, color: SEC, marginTop: 2 }}>{selected.email}</p>
                </div>
                <button onClick={() => setSelected(null)}
                  style={{ width: 30, height: 30, borderRadius: "50%", background: SURFACE2, border: "none", color: SEC, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  ✕
                </button>
              </div>

              <SectionTitle>Informations</SectionTitle>
              <div style={{ background: SURFACE, borderRadius: 12, padding: "0 16px" }}>
                <Row label="Inscription" value={formatDate(selected.date_inscription)} />
                <Row label="Compte" value={selected.actif ? "Activé" : "Désactivé"} valueColor={selected.actif ? GREEN : ORANGE} />
                <Row label="ID Firebase" value={selected.id.slice(0, 18) + "…"} />
              </div>

              <SectionTitle>Abonnement</SectionTitle>
              <div style={{ background: SURFACE, borderRadius: 12, padding: "14px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <p style={{ fontSize: 15, fontWeight: 600, color: selected.abonnement_statut === "actif" ? TGREEN : ORANGE }}>
                    {selected.abonnement_statut === "actif" ? "Payé" : "En attente"}
                  </p>
                  {selected.abonnement_statut === "actif" && (
                    <p style={{ fontSize: 12, color: SEC, marginTop: 2 }}>350 DH / mois</p>
                  )}
                </div>
                <button onClick={() => toggleAbonnement(selected)} disabled={updatingAbo}
                  style={{ fontSize: 13, padding: "7px 12px", borderRadius: 8, background: SURFACE2, color: SEC, border: "none", cursor: "pointer" }}>
                  {updatingAbo ? "…" : selected.abonnement_statut === "actif" ? "Marquer impayé" : "Marquer payé"}
                </button>
              </div>

              <SectionTitle>Tag NFC physique</SectionTitle>
              {selected.nfc_id ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <div style={{ background: SURFACE, borderRadius: 12, padding: "12px 14px", fontFamily: "monospace", fontSize: 12, color: SEC, wordBreak: "break-all" }}>
                    app.walliocard.com/nfc/<span style={{ color: GREEN, fontWeight: 600 }}>{selected.nfc_id}</span>
                  </div>
                  <button onClick={() => copierNfc(selected.nfc_id!)}
                    style={{ padding: "14px 0", borderRadius: 12, background: copied ? SURFACE2 : GREEN, color: copied ? TGREEN : "#000", fontSize: 15, fontWeight: 700, border: "none", cursor: "pointer", transition: "all 0.15s" }}>
                    {copied ? "URL copiée" : "Copier l'URL NFC"}
                  </button>
                  <div style={{ background: SURFACE, borderRadius: 12, padding: "14px 16px" }}>
                    <p style={{ fontSize: 11, fontWeight: 600, color: SEC, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>Programmer le tag — iPhone</p>
                    {[
                      "Copier l'URL ci-dessus",
                      "NFC Tools → Write → Add a record → URL",
                      "Coller l'URL → OK → Write",
                      "Approcher le tag → Done",
                    ].map((t, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                        <span style={{ width: 20, height: 20, borderRadius: "50%", background: SURFACE2, color: SEC, fontSize: 11, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{i + 1}</span>
                        <span style={{ fontSize: 13, color: SEC }}>{t}</span>
                      </div>
                    ))}
                  </div>
                  <button onClick={() => genererNfc(selected)} disabled={generatingNfc}
                    style={{ padding: "12px 0", borderRadius: 12, background: "transparent", color: ORANGE, fontSize: 14, border: `1px solid rgba(255,159,10,0.2)`, cursor: "pointer" }}>
                    {generatingNfc ? "…" : "Régénérer l'ID NFC"}
                  </button>
                </div>
              ) : (
                <button onClick={() => genererNfc(selected)} disabled={generatingNfc}
                  style={{ width: "100%", padding: "14px 0", borderRadius: 12, background: GREEN, color: "#000", fontSize: 15, fontWeight: 700, border: "none", cursor: "pointer" }}>
                  {generatingNfc ? "Génération…" : "Générer l'ID NFC"}
                </button>
              )}

              <SectionTitle>Carte comptoir imprimable</SectionTitle>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => telechargerCarte(selected)} disabled={!selected.nfc_id || downloadingCard || downloadingQR}
                  style={{ flex: 1, padding: "13px 0", borderRadius: 12, background: SURFACE, color: selected.nfc_id ? LABEL : TERT, fontSize: 14, fontWeight: 500, border: "none", cursor: selected.nfc_id ? "pointer" : "not-allowed" }}>
                  {downloadingCard ? "…" : "NFC + QR"}
                </button>
                <button onClick={() => telechargerCarteQR(selected)} disabled={downloadingCard || downloadingQR}
                  style={{ flex: 1, padding: "13px 0", borderRadius: 12, background: SURFACE, color: LABEL, fontSize: 14, fontWeight: 500, border: "none", cursor: "pointer" }}>
                  {downloadingQR ? "…" : "QR seul"}
                </button>
              </div>
              <p style={{ fontSize: 11, color: TERT, marginTop: 6 }}>
                4K · prêt imprimeur
              </p>

              <SectionTitle>Gestion du compte</SectionTitle>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <button onClick={() => toggleActif(selected)} disabled={toggling === selected.id}
                  style={{ padding: "14px 0", borderRadius: 12, background: SURFACE, color: selected.actif ? RED : GREEN, fontSize: 15, fontWeight: 500, border: "none", cursor: "pointer" }}>
                  {toggling === selected.id ? "…" : selected.actif ? "Désactiver le compte" : "Activer le compte"}
                </button>
                <button onClick={() => setConfirmDelete(selected.id)}
                  style={{ padding: "14px 0", borderRadius: 12, background: SURFACE, color: RED, fontSize: 15, fontWeight: 500, border: "none", cursor: "pointer" }}>
                  Supprimer le compte
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Contenu principal ── */}
      <div style={{ maxWidth: 960, margin: "0 auto", padding: "52px 20px 40px" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 32 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: SURFACE, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <WallioLogo size={26} color={LABEL} />
            </div>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 700, color: LABEL, letterSpacing: "-0.4px", lineHeight: 1 }}>Administration</h1>
              <p style={{ fontSize: 13, color: SEC, marginTop: 4 }}>
                <span style={{ color: GREEN }}>{actifs}</span> actif{actifs !== 1 ? "s" : ""} · {marchands.length} au total
              </p>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => setShowCreate(true)}
              style={{ padding: "9px 16px", borderRadius: 10, background: GREEN, color: "#000", fontSize: 14, fontWeight: 700, border: "none", cursor: "pointer" }}>
              + Nouveau
            </button>
            <button onClick={logout}
              style={{ padding: "9px 14px", borderRadius: 10, background: SURFACE, color: SEC, fontSize: 14, border: "none", cursor: "pointer" }}>
              Sortir
            </button>
          </div>
        </div>

        {/* Onglets */}
        <div style={{ display: "flex", gap: 0, marginBottom: 28, background: SURFACE, borderRadius: 10, padding: 3, width: "fit-content" }}>
          {([["marchands", "Marchands"], ["impression", "Cartes comptoir"]] as const).map(([key, label]) => (
            <button key={key} onClick={() => setTab(key)}
              style={{
                padding: "7px 18px",
                borderRadius: 8,
                fontSize: 14,
                fontWeight: tab === key ? 600 : 400,
                background: tab === key ? SURFACE2 : "transparent",
                color: tab === key ? LABEL : SEC,
                border: "none",
                cursor: "pointer",
                transition: "all 0.15s",
              }}>
              {label}
            </button>
          ))}
        </div>

        {tab === "marchands" && <>

          {/* Stats */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12, marginBottom: 24 }}
            className="md:grid-cols-4">
            {[
              { label: "Total",          value: String(marchands.length),                       color: LABEL },
              { label: "Actifs",         value: String(actifs),                                 color: GREEN },
              { label: "En attente",     value: String(marchands.length - actifs),              color: ORANGE },
              { label: "Revenus / mois", value: `${revenus.toLocaleString("fr-FR")} DH`,       color: TGREEN },
            ].map(s => (
              <div key={s.label} style={{ background: SURFACE, borderRadius: 16, padding: "18px 20px" }}>
                <p style={{ fontSize: 28, fontWeight: 700, color: s.color, letterSpacing: "-0.5px", lineHeight: 1 }}>{s.value}</p>
                <p style={{ fontSize: 12, color: SEC, marginTop: 6 }}>{s.label}</p>
              </div>
            ))}
          </div>

          {/* Recherche */}
          <div style={{ position: "relative", marginBottom: 16, maxWidth: 320 }}>
            <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: TERT, fontSize: 15 }}>⌕</span>
            <input type="text" placeholder="Rechercher…" value={search} onChange={e => setSearch(e.target.value)}
              style={{ ...inputStyle, paddingLeft: 34, borderRadius: 10 }}
              onFocus={e => (e.target.style.outline = `2px solid ${GREEN}`, e.target.style.outlineOffset = "-2px")}
              onBlur={e => (e.target.style.outline = "none")} />
          </div>

          {filtered.length === 0 ? (
            <div style={{ padding: "60px 0", textAlign: "center", background: SURFACE, borderRadius: 16 }}>
              <p style={{ color: TERT, fontSize: 15 }}>{search ? "Aucun résultat." : "Aucun marchand inscrit."}</p>
            </div>
          ) : (<>

            {/* ── Cards mobile ── */}
            <div className="md:hidden" style={{ background: SURFACE, borderRadius: 16, overflow: "hidden" }}>
              {filtered.map((m, i) => (
                <button key={m.id} onClick={() => setSelected(m)}
                  style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", background: "transparent", border: "none", borderBottom: i < filtered.length - 1 ? `1px solid ${SEP}` : "none", cursor: "pointer", textAlign: "left" }}>
                  <div style={{ width: 38, height: 38, borderRadius: "50%", background: SURFACE2, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 14, color: LABEL, flexShrink: 0 }}>
                    {(m.nom?.[0] || "?").toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 15, fontWeight: 600, color: LABEL, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{m.nom || "—"}</p>
                    <p style={{ fontSize: 12, color: SEC, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{m.email || "—"}</p>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4, flexShrink: 0 }}>
                    <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 8px", borderRadius: 6, background: m.abonnement_statut === "actif" ? "rgba(48,209,88,0.12)" : "rgba(255,159,10,0.12)", color: m.abonnement_statut === "actif" ? TGREEN : ORANGE }}>
                      {m.abonnement_statut === "actif" ? "Payé" : "Attente"}
                    </span>
                    <span style={{ fontSize: 11, color: m.actif ? GREEN : TERT, fontWeight: 500 }}>
                      {m.actif ? "● Actif" : "● Inactif"}
                    </span>
                  </div>
                  <span style={{ color: TERT, fontSize: 18, marginLeft: 4 }}>›</span>
                </button>
              ))}
            </div>

            {/* ── Table desktop ── */}
            <div className="hidden md:block" style={{ background: SURFACE, borderRadius: 16, overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${SEP}` }}>
                    {["Établissement", "Email", "NFC", "Inscription", "Abonnement", "Compte", "Carte", ""].map(h => (
                      <th key={h} style={{ textAlign: "left", fontSize: 11, fontWeight: 500, color: SEC, padding: "12px 20px", textTransform: "uppercase", letterSpacing: "0.06em" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((m, i) => (
                    <tr key={m.id} style={{ borderBottom: i < filtered.length - 1 ? `1px solid ${SEP}` : "none", cursor: "pointer" }}
                      onMouseEnter={e => (e.currentTarget.style.background = SURFACE2)}
                      onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                      onClick={() => setSelected(m)}>
                      <td style={{ padding: "14px 20px", fontSize: 15, fontWeight: 600, color: LABEL }}>{m.nom || "—"}</td>
                      <td style={{ padding: "14px 20px", fontSize: 13, color: SEC }}>{m.email || "—"}</td>
                      <td style={{ padding: "14px 20px" }}>
                        {m.nfc_id
                          ? <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 8px", borderRadius: 6, background: "rgba(0,245,160,0.1)", color: GREEN }}>NFC</span>
                          : <span style={{ color: TERT }}>—</span>}
                      </td>
                      <td style={{ padding: "14px 20px", fontSize: 13, color: SEC }}>{formatDate(m.date_inscription)}</td>
                      <td style={{ padding: "14px 20px" }}>
                        <span style={{ fontSize: 12, fontWeight: 600, padding: "3px 8px", borderRadius: 6, background: m.abonnement_statut === "actif" ? "rgba(48,209,88,0.1)" : "rgba(255,159,10,0.1)", color: m.abonnement_statut === "actif" ? TGREEN : ORANGE }}>
                          {m.abonnement_statut === "actif" ? "Payé" : "En attente"}
                        </span>
                      </td>
                      <td style={{ padding: "14px 20px" }}>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, color: m.actif ? GREEN : TERT }}>
                          <span style={{ width: 6, height: 6, borderRadius: "50%", background: m.actif ? GREEN : TERT }} />
                          {m.actif ? "Actif" : "Inactif"}
                        </span>
                      </td>
                      <td style={{ padding: "14px 12px" }}>
                        <div style={{ display: "flex", gap: 6 }}>
                          <button
                            onClick={async e => { e.stopPropagation(); if (!m.nfc_id) return; const btn = e.currentTarget; btn.textContent = "…"; btn.setAttribute("disabled","true"); await telechargerCarte(m); btn.textContent = "NFC+QR"; btn.removeAttribute("disabled"); }}
                            disabled={!m.nfc_id}
                            style={{ fontSize: 12, padding: "6px 10px", borderRadius: 8, background: SURFACE2, color: m.nfc_id ? LABEL : TERT, border: "none", cursor: m.nfc_id ? "pointer" : "not-allowed", opacity: m.nfc_id ? 1 : 0.4 }}>
                            NFC+QR
                          </button>
                          <button
                            onClick={async e => { e.stopPropagation(); const btn = e.currentTarget; btn.textContent = "…"; btn.setAttribute("disabled","true"); await telechargerCarteQR(m); btn.textContent = "QR"; btn.removeAttribute("disabled"); }}
                            style={{ fontSize: 12, padding: "6px 10px", borderRadius: 8, background: SURFACE2, color: LABEL, border: "none", cursor: "pointer" }}>
                            QR
                          </button>
                        </div>
                      </td>
                      <td style={{ padding: "14px 12px" }}>
                        <button onClick={e => { e.stopPropagation(); setSelected(m); }}
                          style={{ fontSize: 13, padding: "7px 14px", borderRadius: 8, background: SURFACE2, color: SEC, border: "none", cursor: "pointer" }}>
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

        {/* ── Onglet Cartes comptoir ── */}
        {tab === "impression" && (
          <div style={{ display: "flex", gap: 20, alignItems: "flex-start", flexWrap: "wrap" }}>
            <div style={{ flex: "0 0 280px", display: "flex", flexDirection: "column", gap: 12 }}>

              <div style={{ background: SURFACE, borderRadius: 16, padding: 20 }}>
                <p style={{ fontSize: 11, fontWeight: 500, color: SEC, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 12 }}>URL unique</p>
                <input type="text" value={impUrl} onChange={e => setImpUrl(e.target.value)}
                  placeholder="https://app.walliocard.com/nfc/xxx"
                  style={{ ...inputStyle, background: SURFACE2, fontSize: 13, borderRadius: 10, marginBottom: 10 }} />
                <button onClick={impDownloadSingle} disabled={impGenerating}
                  style={{ width: "100%", padding: "13px 0", borderRadius: 10, background: impGenerating ? TERT : GREEN, color: "#000", fontSize: 14, fontWeight: 700, border: "none", cursor: "pointer" }}>
                  {impGenerating ? "Génération…" : "Télécharger PNG 4K"}
                </button>
              </div>

              <div style={{ background: SURFACE, borderRadius: 16, padding: 20 }}>
                <p style={{ fontSize: 11, fontWeight: 500, color: SEC, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 12 }}>Batch — une URL par ligne</p>
                <textarea value={impUrls} onChange={e => setImpUrls(e.target.value)} rows={7}
                  placeholder={"https://app.walliocard.com/nfc/abc\nhttps://app.walliocard.com/nfc/def"}
                  style={{ ...inputStyle, background: SURFACE2, fontSize: 12, fontFamily: "monospace", resize: "none", borderRadius: 10, marginBottom: 8 }} />
                <p style={{ fontSize: 11, color: TERT, marginBottom: 10 }}>
                  {impUrls.split("\n").map(l => l.trim()).filter(Boolean).length} carte(s)
                </p>
                {impGenerating && impProgress > 0 && (
                  <div style={{ marginBottom: 10 }}>
                    <div style={{ height: 3, background: SURFACE2, borderRadius: 2, overflow: "hidden" }}>
                      <div style={{ width: `${impProgress}%`, height: "100%", background: GREEN, transition: "width 0.3s" }} />
                    </div>
                    <p style={{ fontSize: 11, color: SEC, marginTop: 4 }}>{impProgress}%</p>
                  </div>
                )}
                <button onClick={impDownloadBatch}
                  disabled={impGenerating || !impUrls.split("\n").some(l => l.trim())}
                  style={{ width: "100%", padding: "13px 0", borderRadius: 10, background: GREEN, color: "#000", fontSize: 14, fontWeight: 700, border: "none", cursor: "pointer", opacity: !impUrls.split("\n").some(l => l.trim()) ? 0.4 : 1 }}>
                  {impGenerating ? `Génération… ${impProgress}%` : "Télécharger ZIP"}
                </button>
              </div>

              <div style={{ background: SURFACE, borderRadius: 16, padding: 20 }}>
                <p style={{ fontSize: 11, fontWeight: 500, color: SEC, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 12 }}>Specs imprimeur</p>
                {[["Canvas", `${PRINT_W}×${PRINT_H}px`], ["Export", "4500×3000px"], ["Ratio", "3:2"], ["Format", "PNG RVB"], ["Support", "PVC 1mm"]].map(([k, v]) => (
                  <div key={k} style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <span style={{ fontSize: 13, color: SEC }}>{k}</span>
                    <span style={{ fontSize: 13, fontWeight: 500, color: LABEL }}>{v}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ flex: 1, background: SURFACE, borderRadius: 16, padding: 20 }}>
              <p style={{ fontSize: 11, fontWeight: 500, color: SEC, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 16 }}>Aperçu — 42%</p>
              <div style={{ borderRadius: 8, overflow: "hidden", display: "inline-block" }}>
                <canvas ref={previewRef} style={{ display: "block", width: Math.round(PRINT_W * 0.42), height: Math.round(PRINT_H * 0.42) }} />
              </div>
              <p style={{ fontSize: 11, color: TERT, marginTop: 10 }}>Fichier téléchargé : 4500×3000px</p>
            </div>
          </div>
        )}

      </div>
    </main>
  );
}
