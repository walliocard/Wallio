"use client";

"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { collection, getDocs, doc, updateDoc, deleteDoc, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import WallioLogo from "@/components/WallioLogo";
import { drawPrintCard, PRINT_W, PRINT_H } from "@/lib/print-card-draw";

type Marchand = {
  id: string;
  nom: string;
  email: string;
  actif: boolean;
  date_inscription?: { seconds: number };
  nfc_id?: string;
  logo_url?: string;
  couleur_principale?: string;
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
  const rand = Math.random().toString(36).substring(2, 6);
  return `${base}-${rand}`;
}

function formatDate(ts?: { seconds: number }) {
  if (!ts) return "—";
  return new Date(ts.seconds * 1000).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
}

function drawNfcCard(canvas: HTMLCanvasElement, marchand: Marchand) {
  const W = 1890, H = 1063;
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  const green = "#00F5A0";

  // Background
  ctx.fillStyle = "#0A0A0A";
  ctx.fillRect(0, 0, W, H);

  // Subtle green ambient
  const grad = ctx.createRadialGradient(W * 0.75, H * 0.15, 0, W * 0.75, H * 0.15, 600);
  grad.addColorStop(0, "rgba(0,245,160,0.06)");
  grad.addColorStop(1, "transparent");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // Hole indicator top-center
  ctx.beginPath();
  ctx.arc(W / 2, 52, 22, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(255,255,255,0.12)";
  ctx.lineWidth = 2;
  ctx.stroke();

  // WALLIO top-left
  ctx.font = "bold 56px Inter, Arial, sans-serif";
  ctx.fillStyle = green;
  ctx.textBaseline = "top";
  ctx.textAlign = "left";
  ctx.fillText("WALLIO", 90, 80);

  // Nom marchand top-right
  ctx.font = "500 44px Inter, Arial, sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.7)";
  ctx.textAlign = "right";
  ctx.fillText(marchand.nom || "", W - 90, 90);

  // NFC wave icon — center-left of card
  const ox = W / 2 - 80, oy = H / 2 - 20;
  ctx.lineWidth = 14;
  ctx.lineCap = "round";

  // Dot at origin
  ctx.beginPath();
  ctx.arc(ox, oy, 20, 0, Math.PI * 2);
  ctx.fillStyle = green;
  ctx.fill();

  // 4 arcs radiating right
  for (let i = 0; i < 4; i++) {
    const r = 70 + i * 85;
    const opacity = 1 - i * 0.15;
    ctx.beginPath();
    ctx.arc(ox, oy, r, -Math.PI * 0.38, Math.PI * 0.38);
    ctx.strokeStyle = `rgba(0,245,160,${opacity})`;
    ctx.stroke();
  }

  // Text
  const textX = W / 2 + 80;
  ctx.textAlign = "center";
  ctx.font = "600 42px Inter, Arial, sans-serif";
  ctx.fillStyle = "#FFFFFF";
  ctx.fillText("Posez votre téléphone", textX, oy + 310);
  ctx.font = "400 38px Inter, Arial, sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.5)";
  ctx.fillText("pour gagner vos points", textX, oy + 365);

  // URL bottom
  ctx.font = "400 28px Inter, Arial, sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.25)";
  ctx.textAlign = "center";
  ctx.fillText("app.wallio.ma", W / 2, H - 60);
}

function Row({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) {
  return (
    <div className="flex items-center justify-between py-3" style={{ borderBottom: "1px solid var(--border)" }}>
      <span className="text-[13px]" style={{ color: "var(--fg-tertiary)" }}>{label}</span>
      <span className="text-[14px] font-medium" style={{ color: valueColor || "var(--fg)" }}>{value}</span>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-7">
      <p className="text-[11px] font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--fg-tertiary)" }}>{title}</p>
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

  // Nouveau marchand
  const [showCreate, setShowCreate] = useState(false);
  const [createNom, setCreateNom] = useState("");
  const [createEmail, setCreateEmail] = useState("");
  const [createPassword, setCreatePassword] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  // Onglets
  const [tab, setTab] = useState<"marchands" | "impression">("marchands");

  // Impression
  const [impUrl, setImpUrl] = useState("https://app.wallio.ma/nfc/demo");
  const [impUrls, setImpUrls] = useState("");
  const [impGenerating, setImpGenerating] = useState(false);
  const [impProgress, setImpProgress] = useState(0);
  const previewRef = useRef<HTMLCanvasElement>(null);

  const router = useRouter();

  useEffect(() => {
    async function init() {
      const res = await fetch("/api/admin/check");
      if (!res.ok) { router.push("/admin/login"); return; }
      await chargerMarchands();
      setLoading(false);
    }
    init();
  }, [router]);

  async function chargerMarchands() {
    const q = query(collection(db, "marchands"), orderBy("date_inscription", "desc"));
    const snap = await getDocs(q);
    setMarchands(snap.docs.map(d => ({ id: d.id, nom: "", email: "", actif: false, ...d.data() } as Marchand)));
  }

  async function toggleActif(m: Marchand) {
    setToggling(m.id);
    const newActif = !m.actif;
    await updateDoc(doc(db, "marchands", m.id), { actif: newActif });
    const updated = { ...m, actif: newActif };
    setMarchands(prev => prev.map(x => x.id === m.id ? updated : x));
    if (selected?.id === m.id) setSelected(updated);
    setToggling(null);
  }

  async function supprimerMarchand(id: string) {
    setDeleting(id);
    await deleteDoc(doc(db, "marchands", id));
    setMarchands(prev => prev.filter(m => m.id !== id));
    setConfirmDelete(null);
    setDeleting(null);
    if (selected?.id === id) setSelected(null);
  }

  async function genererNfc(m: Marchand) {
    setGeneratingNfc(true);
    const nfc_id = genNfcId(m.nom);
    await updateDoc(doc(db, "marchands", m.id), { nfc_id });
    const updated = { ...m, nfc_id };
    setMarchands(prev => prev.map(x => x.id === m.id ? updated : x));
    setSelected(updated);
    setGeneratingNfc(false);
  }

  async function toggleAbonnement(m: Marchand) {
    setUpdatingAbo(true);
    const newStatut: Marchand["abonnement_statut"] =
      m.abonnement_statut === "actif" ? "en_attente" : "actif";
    await updateDoc(doc(db, "marchands", m.id), { abonnement_statut: newStatut });
    const updated = { ...m, abonnement_statut: newStatut };
    setMarchands(prev => prev.map(x => x.id === m.id ? updated : x));
    setSelected(updated);
    setUpdatingAbo(false);
  }

  async function telechargerCarte(m: Marchand) {
    if (!m.nfc_id) return;
    setDownloadingCard(true);
    const canvas = document.createElement("canvas");
    await drawPrintCard(canvas, `https://app.wallio.ma/nfc/${m.nfc_id}`, 3);
    const link = document.createElement("a");
    link.download = `wallio-carte-${slugify(m.nom || m.id)}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
    setDownloadingCard(false);
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
    await chargerMarchands();
    setShowCreate(false);
    setCreateNom(""); setCreateEmail(""); setCreatePassword("");
    setCreating(false);
    // Ouvrir le drawer du nouveau marchand
    const nouveau = marchands.find(m => m.id === data.uid);
    if (nouveau) setSelected(nouveau);
  }

  async function copierNfc(nfc_id: string) {
    await navigator.clipboard.writeText(`https://app.wallio.ma/nfc/${nfc_id}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  // Preview impression
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
    <main className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg)" }}>
      <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
        style={{ borderColor: "var(--accent)", borderTopColor: "transparent" }} />
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
    <main className="min-h-screen px-6 py-10" style={{ background: "var(--bg)" }}>
      {/* Ambient */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] right-[10%] w-[600px] h-[500px] rounded-full opacity-20"
          style={{ background: "radial-gradient(circle, rgba(0,122,255,0.15) 0%, transparent 70%)" }} />
      </div>

      {/* Modal nouveau marchand */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-6"
          style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)" }}>
          <div className="w-full max-w-sm rounded-[28px] p-7"
            style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
            <h3 className="text-[18px] font-semibold mb-1" style={{ color: "var(--fg)" }}>Nouveau marchand</h3>
            <p className="text-[13px] mb-5" style={{ color: "var(--fg-secondary)" }}>
              Crée le compte + génère automatiquement le NFC ID
            </p>

            {[
              { label: "Nom du commerce", value: createNom, set: setCreateNom, placeholder: "Café Central", type: "text" },
              { label: "Email", value: createEmail, set: setCreateEmail, placeholder: "contact@cafe.ma", type: "email" },
              { label: "Mot de passe", value: createPassword, set: setCreatePassword, placeholder: "Min. 8 caractères", type: "password" },
            ].map(f => (
              <div key={f.label} className="mb-3">
                <label className="block text-[11px] font-medium mb-1 uppercase tracking-wide"
                  style={{ color: "var(--fg-tertiary)" }}>{f.label}</label>
                <input type={f.type} value={f.value} onChange={e => f.set(e.target.value)}
                  placeholder={f.placeholder}
                  className="w-full px-4 py-3 rounded-2xl text-[14px] outline-none"
                  style={{ background: "var(--glass-bg)", border: "1px solid var(--border)", color: "var(--fg)" }} />
              </div>
            ))}

            {createError && (
              <p className="text-[13px] mb-3" style={{ color: "#FF3B30" }}>{createError}</p>
            )}

            <div className="flex gap-3 mt-5">
              <button onClick={() => { setShowCreate(false); setCreateError(""); }}
                className="flex-1 py-3 rounded-2xl text-[15px] font-medium"
                style={{ background: "var(--glass-bg)", border: "1px solid var(--border)", color: "var(--fg)" }}>
                Annuler
              </button>
              <button onClick={creerMarchand} disabled={creating || !createNom || !createEmail || !createPassword}
                className="flex-1 py-3 rounded-2xl text-[15px] font-semibold text-white"
                style={{ background: creating ? "#888" : "var(--accent)" }}>
                {creating ? "Création…" : "Créer"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal confirmation suppression */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-6"
          style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)" }}>
          <div className="w-full max-w-sm rounded-[28px] p-7"
            style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
            <h3 className="text-[18px] font-semibold mb-2" style={{ color: "var(--fg)" }}>Supprimer ce marchand ?</h3>
            <p className="text-[14px] mb-6" style={{ color: "var(--fg-secondary)" }}>
              Action irréversible. Le compte et toutes les données seront définitivement supprimés.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(null)}
                className="flex-1 py-3 rounded-2xl text-[15px] font-medium"
                style={{ background: "var(--glass-bg)", border: "1px solid var(--border)", color: "var(--fg)" }}>
                Annuler
              </button>
              <button onClick={() => supprimerMarchand(confirmDelete)} disabled={!!deleting}
                className="flex-1 py-3 rounded-2xl text-[15px] font-semibold text-white"
                style={{ background: "#FF3B30" }}>
                {deleting ? "…" : "Supprimer"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Drawer marchand */}
      {selected && (
        <div className="fixed inset-0 z-40 flex" onClick={() => setSelected(null)}>
          <div className="flex-1" style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)" }} />
          <div className="w-full max-w-[420px] h-full overflow-y-auto flex-shrink-0"
            style={{ background: "var(--bg)", borderLeft: "1px solid var(--border)" }}
            onClick={e => e.stopPropagation()}>
            <div className="p-8">
              {/* Header drawer */}
              <div className="flex items-start justify-between mb-8">
                <div>
                  <h2 className="text-[20px] font-semibold" style={{ color: "var(--fg)" }}>{selected.nom || "Marchand"}</h2>
                  <p className="text-[13px] mt-1" style={{ color: "var(--fg-secondary)" }}>{selected.email}</p>
                </div>
                <button onClick={() => setSelected(null)}
                  className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{ background: "var(--glass-bg)", border: "1px solid var(--border)", color: "var(--fg-secondary)" }}>
                  ✕
                </button>
              </div>

              {/* Infos */}
              <Section title="Informations">
                <Row label="Inscription" value={formatDate(selected.date_inscription)} />
                <Row
                  label="Compte"
                  value={selected.actif ? "Activé" : "Désactivé"}
                  valueColor={selected.actif ? "var(--accent)" : "#FF9F0A"}
                />
                <Row
                  label="ID Firebase"
                  value={selected.id}
                />
              </Section>

              {/* Abonnement */}
              <Section title="Abonnement">
                <div className="rounded-2xl p-4 mb-3"
                  style={{ background: "var(--glass-bg)", border: "1px solid var(--border)" }}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[15px] font-semibold"
                        style={{ color: selected.abonnement_statut === "actif" ? "#30D158" : "#FF9F0A" }}>
                        {selected.abonnement_statut === "actif" ? "Payé" : "En attente de paiement"}
                      </p>
                      {selected.abonnement_statut === "actif" && (
                        <p className="text-[12px] mt-0.5" style={{ color: "var(--fg-tertiary)" }}>350 DH / mois</p>
                      )}
                    </div>
                    <button onClick={() => toggleAbonnement(selected)} disabled={updatingAbo}
                      className="text-[12px] font-medium px-3 py-1.5 rounded-xl"
                      style={{ background: "var(--bg)", border: "1px solid var(--border)", color: "var(--fg-secondary)" }}>
                      {updatingAbo ? "…" : selected.abonnement_statut === "actif" ? "Marquer impayé" : "Marquer payé"}
                    </button>
                  </div>
                </div>
              </Section>

              {/* NFC + Carte */}
              <Section title="Tag NFC physique">
                {selected.nfc_id ? (
                  <div className="space-y-3">
                    {/* URL */}
                    <div className="rounded-2xl px-4 py-3 font-mono text-[12px] break-all"
                      style={{ background: "var(--glass-bg)", border: "1px solid var(--border)", color: "var(--fg-secondary)" }}>
                      app.wallio.ma/nfc/<span style={{ color: "var(--fg)", fontWeight: 600 }}>{selected.nfc_id}</span>
                    </div>

                    {/* Copier — grand bouton pour iPhone */}
                    <button onClick={() => copierNfc(selected.nfc_id!)}
                      className="w-full py-3.5 rounded-2xl text-[15px] font-semibold"
                      style={{
                        background: copied ? "rgba(48,209,88,0.12)" : "var(--accent)",
                        color: copied ? "#30D158" : "white",
                        transition: "all 0.2s",
                      }}>
                      {copied ? "✓ URL copiée" : "Copier l'URL NFC"}
                    </button>

                    {/* Steps iPhone */}
                    <div className="rounded-2xl p-4 space-y-2.5"
                      style={{ background: "var(--glass-bg)", border: "1px solid var(--border)" }}>
                      <p className="text-[11px] font-semibold uppercase tracking-wide mb-2"
                        style={{ color: "var(--fg-tertiary)" }}>Programmer le tag — iPhone</p>
                      {[
                        ["1", "Copie l'URL ci-dessus"],
                        ["2", "Ouvre NFC Tools → Write"],
                        ["3", "Add a record → URL"],
                        ["4", "Colle l'URL → OK → Write"],
                        ["5", "Approche le tag → Done ✓"],
                      ].map(([n, t]) => (
                        <div key={n} className="flex items-center gap-3">
                          <span className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0"
                            style={{ background: "var(--accent)", color: "white" }}>{n}</span>
                          <span className="text-[13px]" style={{ color: "var(--fg-secondary)" }}>{t}</span>
                        </div>
                      ))}
                    </div>

                    <button onClick={() => genererNfc(selected)} disabled={generatingNfc}
                      className="w-full py-2.5 rounded-xl text-[12px] font-medium"
                      style={{ background: "rgba(255,159,10,0.08)", border: "1px solid rgba(255,159,10,0.15)", color: "#FF9F0A" }}>
                      {generatingNfc ? "…" : "Régénérer l'ID NFC"}
                    </button>
                  </div>
                ) : (
                  <button onClick={() => genererNfc(selected)} disabled={generatingNfc}
                    className="w-full py-3 rounded-2xl text-[14px] font-semibold"
                    style={{ background: "var(--accent)", color: "white" }}>
                    {generatingNfc ? "Génération…" : "+ Générer l'ID NFC"}
                  </button>
                )}
              </Section>

              {/* Carte comptoir */}
              <Section title="Carte comptoir imprimable">
                <button
                  onClick={() => telechargerCarte(selected)}
                  disabled={!selected.nfc_id || downloadingCard}
                  className="w-full py-3 rounded-2xl text-[14px] font-semibold"
                  style={{
                    background: selected.nfc_id ? "rgba(0,122,255,0.08)" : "var(--glass-bg)",
                    border: `1px solid ${selected.nfc_id ? "var(--accent)" : "var(--border)"}`,
                    color: selected.nfc_id ? "var(--accent)" : "var(--fg-tertiary)",
                    cursor: selected.nfc_id ? "pointer" : "not-allowed",
                  }}>
                  {downloadingCard ? "Génération 4K…" : selected.nfc_id ? "⬇ Télécharger PNG 4K" : "Générer d'abord l'ID NFC"}
                </button>
                <p className="text-[11px] mt-2" style={{ color: "var(--fg-tertiary)" }}>
                  4500×3000px · ratio 3:2 · prêt imprimeur
                </p>
              </Section>

              {/* Actions compte */}
              <Section title="Gestion du compte">
                <div className="space-y-2">
                  <button onClick={() => toggleActif(selected)} disabled={toggling === selected.id}
                    className="w-full py-3 rounded-2xl text-[14px] font-medium"
                    style={{
                      background: selected.actif ? "rgba(255,59,48,0.06)" : "rgba(0,122,255,0.08)",
                      color: selected.actif ? "#FF3B30" : "var(--accent)",
                    }}>
                    {toggling === selected.id ? "…" : selected.actif ? "Désactiver le compte" : "Activer le compte"}
                  </button>
                  <button onClick={() => setConfirmDelete(selected.id)}
                    className="w-full py-3 rounded-2xl text-[14px] font-medium"
                    style={{ background: "rgba(255,59,48,0.04)", color: "#FF3B30" }}>
                    Supprimer le compte
                  </button>
                </div>
              </Section>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto relative">
        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{ background: "linear-gradient(135deg,#EDE8FF 0%,#F0F0FF 100%)" }}>
              <WallioLogo size={36} />
            </div>
            <div>
              <h1 className="text-[32px] font-semibold tracking-[-0.5px]" style={{ color: "var(--fg)" }}>Administration</h1>
              <p className="text-[15px] mt-1" style={{ color: "var(--fg-secondary)" }}>
                {actifs} marchand{actifs !== 1 ? "s" : ""} actif{actifs !== 1 ? "s" : ""} · {marchands.length} au total
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setShowCreate(true)}
              className="text-[13px] px-4 py-2 rounded-xl font-semibold text-white"
              style={{ background: "var(--accent)" }}>
              + Nouveau marchand
            </button>
            <button onClick={logout}
              className="text-[13px] px-4 py-2 rounded-xl"
              style={{ color: "var(--fg-secondary)", background: "var(--glass-bg)", border: "1px solid var(--border)" }}>
              Déconnexion
            </button>
          </div>
        </div>

        {/* Onglets */}
        <div className="flex gap-2 mb-8 p-1 rounded-2xl w-fit"
          style={{ background: "var(--glass-bg)", border: "1px solid var(--border)" }}>
          {([["marchands", "Marchands"], ["impression", "Cartes comptoir"]] as const).map(([key, label]) => (
            <button key={key} onClick={() => setTab(key)}
              className="px-5 py-2 rounded-xl text-[14px] font-medium transition-all"
              style={{
                background: tab === key ? "var(--accent)" : "transparent",
                color: tab === key ? "white" : "var(--fg-secondary)",
              }}>
              {label}
            </button>
          ))}
        </div>

        {tab === "marchands" && <>
        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total marchands", value: String(marchands.length), color: "var(--fg)" },
            { label: "Comptes actifs", value: String(actifs), color: "var(--accent)" },
            { label: "En attente", value: String(marchands.length - actifs), color: "#FF9F0A" },
            { label: "Revenus / mois", value: `${revenus.toLocaleString("fr-FR")} DH`, color: "#30D158" },
          ].map(s => (
            <div key={s.label} className="rounded-[24px] p-6"
              style={{ background: "var(--glass-bg)", border: "1px solid var(--glass-border)", backdropFilter: "blur(20px)", boxShadow: "var(--shadow-sm)" }}>
              <p className="text-[30px] font-semibold tracking-tight leading-none" style={{ color: s.color }}>{s.value}</p>
              <p className="text-[12px] mt-2" style={{ color: "var(--fg-secondary)" }}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* Recherche */}
        <div className="mb-4">
          <input
            type="text"
            placeholder="Rechercher un marchand…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full max-w-xs px-4 py-2.5 rounded-2xl text-[14px] outline-none"
            style={{ background: "var(--glass-bg)", border: "1px solid var(--border)", color: "var(--fg)" }}
            onFocus={e => (e.target.style.borderColor = "var(--accent)")}
            onBlur={e => (e.target.style.borderColor = "var(--border)")}
          />
        </div>

        {/* Table */}
        <div className="rounded-[24px] overflow-hidden"
          style={{ background: "var(--glass-bg)", border: "1px solid var(--glass-border)", backdropFilter: "blur(20px)", boxShadow: "var(--shadow-md)" }}>
          {filtered.length === 0 ? (
            <div className="py-20 text-center" style={{ color: "var(--fg-tertiary)" }}>
              <p className="text-[15px]">{search ? "Aucun résultat." : "Aucun marchand inscrit."}</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)" }}>
                  {["Établissement", "Email", "NFC", "Inscription", "Abonnement", "Compte", ""].map(h => (
                    <th key={h} className="text-left text-[11px] font-medium px-5 py-4 uppercase tracking-wide"
                      style={{ color: "var(--fg-tertiary)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((m, i) => (
                  <tr
                    key={m.id}
                    className="cursor-pointer"
                    onClick={() => setSelected(m)}
                    style={{ borderBottom: i < filtered.length - 1 ? "1px solid var(--border)" : "none" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.02)")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                  >
                    <td className="px-5 py-4 text-[15px] font-medium" style={{ color: "var(--fg)" }}>{m.nom || "—"}</td>
                    <td className="px-5 py-4 text-[13px]" style={{ color: "var(--fg-secondary)" }}>{m.email || "—"}</td>
                    <td className="px-5 py-4">
                      {m.nfc_id ? (
                        <span className="text-[11px] font-medium px-2 py-1 rounded-lg"
                          style={{ background: "rgba(0,245,160,0.08)", color: "#00F5A0" }}>✓ NFC</span>
                      ) : (
                        <span className="text-[11px] px-2 py-1 rounded-lg"
                          style={{ background: "rgba(255,255,255,0.04)", color: "var(--fg-tertiary)" }}>—</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-[13px]" style={{ color: "var(--fg-secondary)" }}>{formatDate(m.date_inscription)}</td>
                    <td className="px-5 py-4">
                      <span className="text-[12px] font-medium px-2.5 py-1 rounded-full"
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
                          background: m.actif ? "rgba(0,122,255,0.1)" : "rgba(142,142,147,0.12)",
                          color: m.actif ? "var(--accent)" : "var(--fg-secondary)",
                        }}>
                        <span className="w-1.5 h-1.5 rounded-full"
                          style={{ background: m.actif ? "var(--accent)" : "var(--fg-tertiary)" }} />
                        {m.actif ? "Actif" : "Inactif"}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <button
                        onClick={e => { e.stopPropagation(); setSelected(m); }}
                        className="text-[13px] font-medium px-4 py-2 rounded-xl"
                        style={{ background: "var(--glass-bg)", border: "1px solid var(--border)", color: "var(--fg)" }}>
                        Voir →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        </>}

        {/* ── Onglet Cartes comptoir ── */}
        {tab === "impression" && (
          <div className="flex gap-6 items-start flex-wrap">

            {/* Contrôles */}
            <div style={{ flex: "0 0 300px", display: "flex", flexDirection: "column", gap: 16 }}>

              {/* URL unique */}
              <div className="rounded-[20px] p-5" style={{ background: "var(--glass-bg)", border: "1px solid var(--border)" }}>
                <p className="text-[11px] font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--fg-tertiary)" }}>
                  URL unique — aperçu
                </p>
                <input type="text" value={impUrl} onChange={e => setImpUrl(e.target.value)}
                  placeholder="https://app.wallio.ma/nfc/xxx"
                  className="w-full px-3 py-2.5 rounded-xl text-[13px] outline-none mb-3"
                  style={{ background: "var(--bg)", border: "1px solid var(--border)", color: "var(--fg)", boxSizing: "border-box" }} />
                <button onClick={impDownloadSingle} disabled={impGenerating}
                  className="w-full py-3 rounded-xl text-[14px] font-semibold text-white"
                  style={{ background: impGenerating ? "#888" : "var(--accent)" }}>
                  {impGenerating ? "Génération…" : "⬇ Télécharger PNG 4K"}
                </button>
              </div>

              {/* Batch */}
              <div className="rounded-[20px] p-5" style={{ background: "var(--glass-bg)", border: "1px solid var(--border)" }}>
                <p className="text-[11px] font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--fg-tertiary)" }}>
                  Batch — une URL par ligne
                </p>
                <textarea value={impUrls} onChange={e => setImpUrls(e.target.value)} rows={8}
                  placeholder={"https://app.wallio.ma/nfc/abc\nhttps://app.wallio.ma/nfc/def\n…"}
                  className="w-full px-3 py-2.5 rounded-xl text-[12px] outline-none resize-none mb-2"
                  style={{ background: "var(--bg)", border: "1px solid var(--border)", color: "var(--fg)", fontFamily: "monospace", boxSizing: "border-box" }} />
                <p className="text-[11px] mb-3" style={{ color: "var(--fg-tertiary)" }}>
                  {impUrls.split("\n").map(l => l.trim()).filter(Boolean).length} carte(s) détectée(s)
                </p>
                {impGenerating && impProgress > 0 && (
                  <div className="mb-3">
                    <div style={{ height: 4, background: "var(--border)", borderRadius: 4, overflow: "hidden" }}>
                      <div style={{ width: `${impProgress}%`, height: "100%", background: "var(--accent)", borderRadius: 4, transition: "width 0.3s" }} />
                    </div>
                    <p className="text-[11px] mt-1" style={{ color: "var(--fg-tertiary)" }}>{impProgress}%</p>
                  </div>
                )}
                <button onClick={impDownloadBatch}
                  disabled={impGenerating || !impUrls.split("\n").some(l => l.trim())}
                  className="w-full py-3 rounded-xl text-[14px] font-semibold text-white"
                  style={{ background: impGenerating ? "#888" : "#6A5AF9" }}>
                  {impGenerating ? `Génération… ${impProgress}%` : `⬇ Télécharger ZIP`}
                </button>
              </div>

              {/* Specs */}
              <div className="rounded-[20px] p-5" style={{ background: "var(--glass-bg)", border: "1px solid var(--border)" }}>
                <p className="text-[11px] font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--fg-tertiary)" }}>Specs imprimeur</p>
                {[
                  ["Canvas", `${PRINT_W}×${PRINT_H}px`],
                  ["Export", "4500×3000px (×3)"],
                  ["Ratio", "3:2"],
                  ["Format", "PNG RVB"],
                  ["Support", "PVC rigide 1mm"],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between mb-1.5">
                    <span className="text-[12px]" style={{ color: "var(--fg-tertiary)" }}>{k}</span>
                    <span className="text-[12px] font-medium" style={{ color: "var(--fg)" }}>{v}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Preview canvas */}
            <div className="flex-1 rounded-[20px] p-5" style={{ background: "var(--glass-bg)", border: "1px solid var(--border)" }}>
              <p className="text-[11px] font-semibold uppercase tracking-wider mb-4" style={{ color: "var(--fg-tertiary)" }}>
                Aperçu — échelle 42%
              </p>
              <div style={{ borderRadius: 8, overflow: "hidden", boxShadow: "0 8px 32px rgba(0,0,0,0.15)", display: "inline-block" }}>
                <canvas ref={previewRef}
                  style={{ display: "block", width: Math.round(PRINT_W * 0.42), height: Math.round(PRINT_H * 0.42) }} />
              </div>
              <p className="text-[11px] mt-3" style={{ color: "var(--fg-tertiary)" }}>
                Le fichier téléchargé est en pleine résolution (4500×3000px).
              </p>
            </div>
          </div>
        )}

      </div>
    </main>
  );
}
