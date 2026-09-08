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

// ── Styles glass réutilisables ──────────────────────────────────────────────
const G: React.CSSProperties = {
  background: "rgba(255,255,255,0.03)",
  backdropFilter: "blur(48px) saturate(180%)",
  WebkitBackdropFilter: "blur(48px) saturate(180%)",
  border: "1px solid rgba(255,255,255,0.08)",
  boxShadow: "0 8px 40px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)",
};

const FG = "#FFFFFF";
const FG2 = "rgba(255,255,255,0.45)";
const FG3 = "rgba(255,255,255,0.25)";
const GREEN = "#00F5A0";
const BORDER = "rgba(255,255,255,0.07)";

function Row({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) {
  return (
    <div className="flex items-center justify-between py-3" style={{ borderBottom: `1px solid ${BORDER}` }}>
      <span className="text-[13px]" style={{ color: FG3 }}>{label}</span>
      <span className="text-[14px] font-medium" style={{ color: valueColor || FG }}>{value}</span>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-7">
      <p className="text-[10px] font-bold uppercase tracking-[0.14em] mb-3" style={{ color: "rgba(0,245,160,0.55)" }}>{title}</p>
      {children}
    </div>
  );
}

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
    <main className="min-h-screen flex items-center justify-center" style={{ background: "#0A0A0A" }}>
      <div className="w-7 h-7 rounded-full border-2 animate-spin"
        style={{ borderColor: "rgba(0,245,160,0.3)", borderTopColor: GREEN }} />
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

  const inputStyle: React.CSSProperties = {
    background: "rgba(255,255,255,0.04)",
    border: `1px solid ${BORDER}`,
    color: FG,
    borderRadius: 14,
    padding: "10px 14px",
    fontSize: 14,
    outline: "none",
    width: "100%",
    boxSizing: "border-box",
  };

  return (
    <main className="min-h-screen" style={{ background: "#0A0A0A" }}>

      {/* ── Ambient background ── */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", overflow: "hidden", zIndex: 0 }}>
        <div style={{ position: "absolute", top: "-20%", right: "-8%", width: 800, height: 700, borderRadius: "50%", background: "radial-gradient(circle, rgba(0,245,160,0.06) 0%, transparent 65%)" }} />
        <div style={{ position: "absolute", bottom: "-15%", left: "-12%", width: 600, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(0,245,160,0.04) 0%, transparent 65%)" }} />
        <div style={{ position: "absolute", top: "45%", left: "35%", width: 500, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,255,255,0.012) 0%, transparent 65%)" }} />
      </div>

      {/* ── Modal nouveau marchand ── */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-6"
          style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(12px)" }}>
          <div className="w-full max-w-sm rounded-[28px] p-7" style={{ ...G, borderRadius: 28 }}>
            <h3 className="text-[18px] font-semibold mb-1" style={{ color: FG }}>Nouveau marchand</h3>
            <p className="text-[13px] mb-5" style={{ color: FG2 }}>
              Crée le compte + génère automatiquement le NFC ID
            </p>
            {[
              { label: "Nom du commerce", value: createNom, set: setCreateNom, placeholder: "Café Central", type: "text" },
              { label: "Email", value: createEmail, set: setCreateEmail, placeholder: "contact@cafe.ma", type: "email" },
              { label: "Mot de passe", value: createPassword, set: setCreatePassword, placeholder: "Min. 8 caractères", type: "password" },
            ].map(f => (
              <div key={f.label} className="mb-3">
                <label className="block text-[10px] font-bold mb-1.5 uppercase tracking-[0.12em]"
                  style={{ color: "rgba(0,245,160,0.55)" }}>{f.label}</label>
                <input type={f.type} value={f.value} onChange={e => f.set(e.target.value)}
                  placeholder={f.placeholder} style={inputStyle} />
              </div>
            ))}
            {createError && (
              <p className="text-[13px] mb-3" style={{ color: "#FF3B30" }}>{createError}</p>
            )}
            <div className="flex gap-3 mt-5">
              <button onClick={() => { setShowCreate(false); setCreateError(""); }}
                className="flex-1 py-3 rounded-2xl text-[14px] font-medium"
                style={{ background: "rgba(255,255,255,0.05)", border: `1px solid ${BORDER}`, color: FG2 }}>
                Annuler
              </button>
              <button onClick={creerMarchand} disabled={creating || !createNom || !createEmail || !createPassword}
                className="flex-1 py-3 rounded-2xl text-[14px] font-bold"
                style={{ background: creating ? "rgba(0,245,160,0.3)" : GREEN, color: "#0A0A0A", opacity: (!createNom || !createEmail || !createPassword) ? 0.5 : 1 }}>
                {creating ? "Création…" : "Créer"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal confirmation suppression ── */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-6"
          style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(12px)" }}>
          <div className="w-full max-w-sm rounded-[28px] p-7" style={{ ...G, borderRadius: 28 }}>
            <h3 className="text-[18px] font-semibold mb-2" style={{ color: FG }}>Supprimer ce marchand ?</h3>
            <p className="text-[14px] mb-6" style={{ color: FG2 }}>
              Action irréversible. Le compte et toutes les données seront définitivement supprimés.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(null)}
                className="flex-1 py-3 rounded-2xl text-[14px] font-medium"
                style={{ background: "rgba(255,255,255,0.05)", border: `1px solid ${BORDER}`, color: FG2 }}>
                Annuler
              </button>
              <button onClick={() => supprimerMarchand(confirmDelete)} disabled={!!deleting}
                className="flex-1 py-3 rounded-2xl text-[14px] font-bold text-white"
                style={{ background: "#FF3B30" }}>
                {deleting ? "…" : "Supprimer"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Drawer marchand ── */}
      {selected && (
        <div className="fixed inset-0 z-40 flex" onClick={() => setSelected(null)}>
          <div className="flex-1" style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(6px)" }} />
          <div className="w-full max-w-[420px] h-full overflow-y-auto flex-shrink-0"
            style={{
              background: "rgba(12,12,14,0.92)",
              backdropFilter: "blur(60px) saturate(200%)",
              WebkitBackdropFilter: "blur(60px) saturate(200%)",
              borderLeft: "1px solid rgba(0,245,160,0.1)",
            }}
            onClick={e => e.stopPropagation()}>
            <div className="p-8">
              {/* Header drawer */}
              <div className="flex items-start justify-between mb-8">
                <div>
                  <h2 className="text-[20px] font-semibold" style={{ color: FG }}>{selected.nom || "Marchand"}</h2>
                  <p className="text-[13px] mt-1" style={{ color: FG2 }}>{selected.email}</p>
                </div>
                <button onClick={() => setSelected(null)}
                  className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 text-[14px]"
                  style={{ background: "rgba(255,255,255,0.06)", border: `1px solid ${BORDER}`, color: FG3 }}>
                  ✕
                </button>
              </div>

              <Section title="Informations">
                <Row label="Inscription" value={formatDate(selected.date_inscription)} />
                <Row label="Compte" value={selected.actif ? "Activé" : "Désactivé"}
                  valueColor={selected.actif ? GREEN : "#FF9F0A"} />
                <Row label="ID Firebase" value={selected.id} />
              </Section>

              <Section title="Abonnement">
                <div className="rounded-2xl p-4 mb-3"
                  style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${BORDER}` }}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[15px] font-semibold"
                        style={{ color: selected.abonnement_statut === "actif" ? "#30D158" : "#FF9F0A" }}>
                        {selected.abonnement_statut === "actif" ? "Payé" : "En attente de paiement"}
                      </p>
                      {selected.abonnement_statut === "actif" && (
                        <p className="text-[12px] mt-0.5" style={{ color: FG3 }}>350 DH / mois</p>
                      )}
                    </div>
                    <button onClick={() => toggleAbonnement(selected)} disabled={updatingAbo}
                      className="text-[12px] font-medium px-3 py-1.5 rounded-xl"
                      style={{ background: "rgba(255,255,255,0.05)", border: `1px solid ${BORDER}`, color: FG2 }}>
                      {updatingAbo ? "…" : selected.abonnement_statut === "actif" ? "Marquer impayé" : "Marquer payé"}
                    </button>
                  </div>
                </div>
              </Section>

              <Section title="Tag NFC physique">
                {selected.nfc_id ? (
                  <div className="space-y-3">
                    <div className="rounded-2xl px-4 py-3 font-mono text-[12px] break-all"
                      style={{ background: "rgba(0,245,160,0.04)", border: "1px solid rgba(0,245,160,0.12)", color: FG2 }}>
                      app.walliocard.com/nfc/<span style={{ color: GREEN, fontWeight: 600 }}>{selected.nfc_id}</span>
                    </div>
                    <button onClick={() => copierNfc(selected.nfc_id!)}
                      className="w-full py-3.5 rounded-2xl text-[15px] font-bold"
                      style={{
                        background: copied ? "rgba(48,209,88,0.12)" : GREEN,
                        color: copied ? "#30D158" : "#0A0A0A",
                        transition: "all 0.2s",
                      }}>
                      {copied ? "✓ URL copiée" : "Copier l'URL NFC"}
                    </button>
                    <div className="rounded-2xl p-4 space-y-2.5"
                      style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${BORDER}` }}>
                      <p className="text-[10px] font-bold uppercase tracking-[0.12em] mb-2"
                        style={{ color: "rgba(0,245,160,0.55)" }}>Programmer le tag — iPhone</p>
                      {[
                        ["1", "Copie l'URL ci-dessus"],
                        ["2", "Ouvre NFC Tools → Write"],
                        ["3", "Add a record → URL"],
                        ["4", "Colle l'URL → OK → Write"],
                        ["5", "Approche le tag → Done ✓"],
                      ].map(([n, t]) => (
                        <div key={n} className="flex items-center gap-3">
                          <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0"
                            style={{ background: "rgba(0,245,160,0.15)", color: GREEN }}>{n}</span>
                          <span className="text-[13px]" style={{ color: FG2 }}>{t}</span>
                        </div>
                      ))}
                    </div>
                    <button onClick={() => genererNfc(selected)} disabled={generatingNfc}
                      className="w-full py-2.5 rounded-xl text-[12px] font-medium"
                      style={{ background: "rgba(255,159,10,0.07)", border: "1px solid rgba(255,159,10,0.15)", color: "#FF9F0A" }}>
                      {generatingNfc ? "…" : "Régénérer l'ID NFC"}
                    </button>
                  </div>
                ) : (
                  <button onClick={() => genererNfc(selected)} disabled={generatingNfc}
                    className="w-full py-3 rounded-2xl text-[14px] font-bold"
                    style={{ background: GREEN, color: "#0A0A0A" }}>
                    {generatingNfc ? "Génération…" : "+ Générer l'ID NFC"}
                  </button>
                )}
              </Section>

              <Section title="Carte comptoir imprimable">
                <div className="flex gap-2">
                  <button onClick={() => telechargerCarte(selected)}
                    disabled={!selected.nfc_id || downloadingCard || downloadingQR}
                    className="flex-1 py-3 rounded-2xl text-[13px] font-semibold"
                    style={{
                      background: selected.nfc_id ? "rgba(0,245,160,0.07)" : "rgba(255,255,255,0.03)",
                      border: `1px solid ${selected.nfc_id ? "rgba(0,245,160,0.2)" : BORDER}`,
                      color: selected.nfc_id ? GREEN : FG3,
                      cursor: selected.nfc_id ? "pointer" : "not-allowed",
                    }}>
                    {downloadingCard ? "…" : "NFC + QR"}
                  </button>
                  <button onClick={() => telechargerCarteQR(selected)}
                    disabled={downloadingCard || downloadingQR}
                    className="flex-1 py-3 rounded-2xl text-[13px] font-semibold"
                    style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${BORDER}`, color: FG, cursor: "pointer" }}>
                    {downloadingQR ? "…" : "QR seul"}
                  </button>
                </div>
                <p className="text-[11px] mt-2" style={{ color: FG3 }}>
                  4K · prêt imprimeur · {selected.nfc_id ? "NFC + QR ou QR uniquement" : "QR uniquement disponible sans ID NFC"}
                </p>
              </Section>

              <Section title="Gestion du compte">
                <div className="space-y-2">
                  <button onClick={() => toggleActif(selected)} disabled={toggling === selected.id}
                    className="w-full py-3 rounded-2xl text-[14px] font-medium"
                    style={{
                      background: selected.actif ? "rgba(255,59,48,0.07)" : "rgba(0,245,160,0.07)",
                      border: `1px solid ${selected.actif ? "rgba(255,59,48,0.15)" : "rgba(0,245,160,0.15)"}`,
                      color: selected.actif ? "#FF3B30" : GREEN,
                    }}>
                    {toggling === selected.id ? "…" : selected.actif ? "Désactiver le compte" : "Activer le compte"}
                  </button>
                  <button onClick={() => setConfirmDelete(selected.id)}
                    className="w-full py-3 rounded-2xl text-[14px] font-medium"
                    style={{ background: "rgba(255,59,48,0.05)", color: "#FF3B30" }}>
                    Supprimer le compte
                  </button>
                </div>
              </Section>
            </div>
          </div>
        </div>
      )}

      {/* ── Contenu principal ── */}
      <div className="max-w-6xl mx-auto px-6 md:px-8 py-10 md:py-14" style={{ position: "relative", zIndex: 1 }}>

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-[18px] flex items-center justify-center flex-shrink-0"
              style={{
                background: "rgba(0,245,160,0.08)",
                border: "1px solid rgba(0,245,160,0.2)",
                boxShadow: "0 0 28px rgba(0,245,160,0.12)",
              }}>
              <WallioLogo size={28} color={GREEN} />
            </div>
            <div>
              <p className="text-[10px] font-bold tracking-[0.18em] uppercase mb-0.5" style={{ color: GREEN }}>WALLIO</p>
              <h1 className="text-[24px] md:text-[28px] font-semibold tracking-[-0.5px] leading-none" style={{ color: FG }}>Administration</h1>
              <p className="text-[12px] mt-1.5" style={{ color: FG3 }}>
                {actifs} actif{actifs !== 1 ? "s" : ""} · {marchands.length} au total
              </p>
            </div>
          </div>
          <div className="flex gap-2 items-center">
            <button onClick={() => setShowCreate(true)}
              className="text-[13px] px-4 py-2.5 rounded-xl font-bold"
              style={{ background: GREEN, color: "#0A0A0A" }}>
              + Nouveau
            </button>
            <button onClick={logout}
              className="text-[13px] px-4 py-2.5 rounded-xl"
              style={{ background: "rgba(255,255,255,0.05)", border: `1px solid ${BORDER}`, color: FG3 }}>
              Sortir
            </button>
          </div>
        </div>

        {/* Onglets */}
        <div className="flex gap-1.5 mb-8 p-1 rounded-2xl w-full md:w-fit"
          style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${BORDER}` }}>
          {([["marchands", "Marchands"], ["impression", "Cartes comptoir"]] as const).map(([key, label]) => (
            <button key={key} onClick={() => setTab(key)}
              className="px-5 py-2 rounded-[14px] text-[14px] font-medium transition-all"
              style={{
                background: tab === key ? GREEN : "transparent",
                color: tab === key ? "#0A0A0A" : FG2,
                fontWeight: tab === key ? 700 : 500,
              }}>
              {label}
            </button>
          ))}
        </div>

        {tab === "marchands" && <>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
            {[
              { label: "Total",          value: String(marchands.length),             color: FG },
              { label: "Actifs",         value: String(actifs),                       color: GREEN },
              { label: "En attente",     value: String(marchands.length - actifs),    color: "#FF9F0A" },
              { label: "Revenus / mois", value: `${revenus.toLocaleString("fr-FR")} DH`, color: "#30D158" },
            ].map(s => (
              <div key={s.label} className="rounded-[22px] p-5 md:p-6" style={G}>
                <p className="text-[26px] md:text-[32px] font-bold tracking-tight leading-none" style={{ color: s.color }}>{s.value}</p>
                <p className="text-[11px] mt-2" style={{ color: FG3 }}>{s.label}</p>
              </div>
            ))}
          </div>

          {/* Recherche */}
          <div className="mb-5">
            <input
              type="text"
              placeholder="Rechercher un marchand…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full md:max-w-xs text-[14px] outline-none"
              style={{ ...inputStyle, borderRadius: 16, padding: "10px 16px" }}
              onFocus={e => (e.target.style.borderColor = "rgba(0,245,160,0.3)")}
              onBlur={e => (e.target.style.borderColor = BORDER)}
            />
          </div>

          {filtered.length === 0 ? (
            <div className="py-20 text-center rounded-[24px]" style={G}>
              <p className="text-[15px]" style={{ color: FG3 }}>{search ? "Aucun résultat." : "Aucun marchand inscrit."}</p>
            </div>
          ) : (<>

            {/* ── Cards mobile ── */}
            <div className="md:hidden space-y-2">
              {filtered.map(m => (
                <button key={m.id} onClick={() => setSelected(m)}
                  className="w-full text-left rounded-2xl p-4 flex items-center gap-3 active:opacity-70 transition-opacity"
                  style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${BORDER}` }}>
                  <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-[13px] flex-shrink-0"
                    style={{ background: m.actif ? "rgba(0,245,160,0.15)" : "rgba(255,255,255,0.06)", color: m.actif ? GREEN : FG3 }}>
                    {(m.nom?.[0] || "?").toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-semibold truncate" style={{ color: FG }}>{m.nom || "—"}</p>
                    <p className="text-[11px] truncate" style={{ color: FG3 }}>{m.email || "—"}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                      style={{
                        background: m.abonnement_statut === "actif" ? "rgba(48,209,88,0.1)" : "rgba(255,159,10,0.1)",
                        color: m.abonnement_statut === "actif" ? "#30D158" : "#FF9F0A",
                      }}>
                      {m.abonnement_statut === "actif" ? "Payé" : "Attente"}
                    </span>
                    <span className="text-[10px] font-medium" style={{ color: m.actif ? GREEN : FG3 }}>
                      {m.actif ? "● Actif" : "● Inactif"}
                    </span>
                  </div>
                  <span style={{ color: FG3, fontSize: 16 }}>›</span>
                </button>
              ))}
            </div>

            {/* ── Table desktop ── */}
            <div className="hidden md:block rounded-[26px] overflow-hidden" style={G}>
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
                    {["Établissement", "Email", "NFC", "Inscription", "Abonnement", "Compte", "Carte", ""].map(h => (
                      <th key={h} className="text-left text-[10px] font-bold px-5 py-4 uppercase tracking-[0.1em]"
                        style={{ color: "rgba(0,245,160,0.45)" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((m, i) => (
                    <tr key={m.id} className="cursor-pointer transition-colors"
                      style={{ borderBottom: i < filtered.length - 1 ? `1px solid ${BORDER}` : "none" }}
                      onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.02)")}
                      onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                      onClick={() => setSelected(m)}>
                      <td className="px-5 py-4 text-[15px] font-semibold" style={{ color: FG }}>{m.nom || "—"}</td>
                      <td className="px-5 py-4 text-[13px]" style={{ color: FG2 }}>{m.email || "—"}</td>
                      <td className="px-5 py-4">
                        {m.nfc_id
                          ? <span className="text-[11px] font-semibold px-2 py-1 rounded-lg"
                              style={{ background: "rgba(0,245,160,0.08)", color: GREEN }}>NFC</span>
                          : <span className="text-[11px] px-2 py-1 rounded-lg" style={{ color: FG3 }}>—</span>
                        }
                      </td>
                      <td className="px-5 py-4 text-[13px]" style={{ color: FG2 }}>{formatDate(m.date_inscription)}</td>
                      <td className="px-5 py-4">
                        <span className="text-[12px] font-semibold px-2.5 py-1 rounded-full"
                          style={{
                            background: m.abonnement_statut === "actif" ? "rgba(48,209,88,0.1)" : "rgba(255,159,10,0.1)",
                            color: m.abonnement_statut === "actif" ? "#30D158" : "#FF9F0A",
                          }}>
                          {m.abonnement_statut === "actif" ? "Payé" : "En attente"}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className="inline-flex items-center gap-1.5 text-[12px] font-medium px-3 py-1.5 rounded-full"
                          style={{
                            background: m.actif ? "rgba(0,245,160,0.08)" : "rgba(255,255,255,0.05)",
                            color: m.actif ? GREEN : FG3,
                          }}>
                          <span className="w-1.5 h-1.5 rounded-full" style={{ background: m.actif ? GREEN : FG3 }} />
                          {m.actif ? "Actif" : "Inactif"}
                        </span>
                      </td>
                      <td className="px-3 py-4">
                        <div className="flex gap-1.5">
                          <button
                            onClick={async e => { e.stopPropagation(); if (!m.nfc_id) return; const btn = e.currentTarget; btn.textContent = "…"; btn.setAttribute("disabled","true"); await telechargerCarte(m); btn.textContent = "NFC+QR"; btn.removeAttribute("disabled"); }}
                            disabled={!m.nfc_id}
                            className="text-[11px] font-semibold px-2.5 py-1.5 rounded-lg whitespace-nowrap"
                            style={{
                              background: m.nfc_id ? "rgba(0,245,160,0.07)" : "rgba(255,255,255,0.03)",
                              border: `1px solid ${m.nfc_id ? "rgba(0,245,160,0.2)" : BORDER}`,
                              color: m.nfc_id ? GREEN : FG3,
                              cursor: m.nfc_id ? "pointer" : "not-allowed",
                              opacity: m.nfc_id ? 1 : 0.4,
                            }}>
                            NFC+QR
                          </button>
                          <button
                            onClick={async e => { e.stopPropagation(); const btn = e.currentTarget; btn.textContent = "…"; btn.setAttribute("disabled","true"); await telechargerCarteQR(m); btn.textContent = "QR"; btn.removeAttribute("disabled"); }}
                            className="text-[11px] font-semibold px-2.5 py-1.5 rounded-lg whitespace-nowrap"
                            style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${BORDER}`, color: FG, cursor: "pointer" }}>
                            QR
                          </button>
                        </div>
                      </td>
                      <td className="px-3 py-4">
                        <button onClick={e => { e.stopPropagation(); setSelected(m); }}
                          className="text-[13px] font-medium px-4 py-2 rounded-xl"
                          style={{ background: "rgba(255,255,255,0.05)", border: `1px solid ${BORDER}`, color: FG2 }}>
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
          <div className="flex gap-6 items-start flex-wrap">

            {/* Contrôles */}
            <div style={{ flex: "0 0 300px", display: "flex", flexDirection: "column", gap: 16 }}>

              <div className="rounded-[20px] p-5" style={G}>
                <p className="text-[10px] font-bold uppercase tracking-[0.12em] mb-3" style={{ color: "rgba(0,245,160,0.55)" }}>
                  URL unique — aperçu
                </p>
                <input type="text" value={impUrl} onChange={e => setImpUrl(e.target.value)}
                  placeholder="https://app.walliocard.com/nfc/xxx"
                  style={{ ...inputStyle, fontSize: 13, marginBottom: 12 }} />
                <button onClick={impDownloadSingle} disabled={impGenerating}
                  className="w-full py-3 rounded-xl text-[14px] font-bold"
                  style={{ background: impGenerating ? "rgba(0,245,160,0.3)" : GREEN, color: "#0A0A0A" }}>
                  {impGenerating ? "Génération…" : "Télécharger PNG 4K"}
                </button>
              </div>

              <div className="rounded-[20px] p-5" style={G}>
                <p className="text-[10px] font-bold uppercase tracking-[0.12em] mb-3" style={{ color: "rgba(0,245,160,0.55)" }}>
                  Batch — une URL par ligne
                </p>
                <textarea value={impUrls} onChange={e => setImpUrls(e.target.value)} rows={8}
                  placeholder={"https://app.walliocard.com/nfc/abc\nhttps://app.walliocard.com/nfc/def\n…"}
                  style={{ ...inputStyle, fontSize: 12, fontFamily: "monospace", resize: "none", marginBottom: 8 }} />
                <p className="text-[11px] mb-3" style={{ color: FG3 }}>
                  {impUrls.split("\n").map(l => l.trim()).filter(Boolean).length} carte(s) détectée(s)
                </p>
                {impGenerating && impProgress > 0 && (
                  <div className="mb-3">
                    <div style={{ height: 3, background: "rgba(255,255,255,0.08)", borderRadius: 4, overflow: "hidden" }}>
                      <div style={{ width: `${impProgress}%`, height: "100%", background: GREEN, borderRadius: 4, transition: "width 0.3s" }} />
                    </div>
                    <p className="text-[11px] mt-1" style={{ color: FG3 }}>{impProgress}%</p>
                  </div>
                )}
                <button onClick={impDownloadBatch}
                  disabled={impGenerating || !impUrls.split("\n").some(l => l.trim())}
                  className="w-full py-3 rounded-xl text-[14px] font-bold"
                  style={{ background: impGenerating ? "rgba(0,245,160,0.3)" : GREEN, color: "#0A0A0A", opacity: !impUrls.split("\n").some(l => l.trim()) ? 0.4 : 1 }}>
                  {impGenerating ? `Génération… ${impProgress}%` : "Télécharger ZIP"}
                </button>
              </div>

              <div className="rounded-[20px] p-5" style={G}>
                <p className="text-[10px] font-bold uppercase tracking-[0.12em] mb-3" style={{ color: "rgba(0,245,160,0.55)" }}>Specs imprimeur</p>
                {[
                  ["Canvas", `${PRINT_W}×${PRINT_H}px`],
                  ["Export", "4500×3000px (×3)"],
                  ["Ratio", "3:2"],
                  ["Format", "PNG RVB"],
                  ["Support", "PVC rigide 1mm"],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between mb-1.5">
                    <span className="text-[12px]" style={{ color: FG3 }}>{k}</span>
                    <span className="text-[12px] font-medium" style={{ color: FG }}>{v}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Preview canvas */}
            <div className="flex-1 rounded-[20px] p-5" style={G}>
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] mb-4" style={{ color: "rgba(0,245,160,0.55)" }}>
                Aperçu — échelle 42%
              </p>
              <div style={{ borderRadius: 8, overflow: "hidden", boxShadow: "0 8px 40px rgba(0,0,0,0.5)", display: "inline-block" }}>
                <canvas ref={previewRef}
                  style={{ display: "block", width: Math.round(PRINT_W * 0.42), height: Math.round(PRINT_H * 0.42) }} />
              </div>
              <p className="text-[11px] mt-3" style={{ color: FG3 }}>
                Le fichier téléchargé est en pleine résolution (4500×3000px).
              </p>
            </div>
          </div>
        )}

      </div>
    </main>
  );
}
