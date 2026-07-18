"use client";

import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef, useCallback } from "react";
import { signOut } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import {
  collection, getDocs, query, where, orderBy,
  doc, updateDoc, serverTimestamp, getDoc,
} from "firebase/firestore";
import { genererNfcId, type Client, type Marchand } from "@/lib/loyalty";
import jsQR from "jsqr";

type Tab = "accueil" | "scanner" | "clients" | "carte" | "reglages";

const ICONES = ["☕", "🌸", "✂️", "🍕", "🍣", "💇", "💪", "🛒", "🌿", "⭐", "🎯", "🏆", "🎁", "💈", "🧁"];
const ANTI_DOUBLON_OPTIONS = [
  { label: "15 minutes", value: 900 },
  { label: "1 heure", value: 3600 },
  { label: "4 heures", value: 14400 },
  { label: "8 heures", value: 28800 },
  { label: "1 jour", value: 86400 },
];

export default function DashboardPage() {
  const { user, marchand, loading } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("accueil");

  useEffect(() => {
    if (!loading && (!user || !marchand?.actif)) router.push("/auth/connexion");
  }, [user, marchand, loading, router]);

  if (loading || !marchand || !user) {
    return (
      <main className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg)" }}>
        <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
          style={{ borderColor: "var(--accent)", borderTopColor: "transparent" }} />
      </main>
    );
  }

  return (
    <main className="min-h-screen pb-24" style={{ background: "var(--bg)" }}>
      {tab === "accueil" && <TabAccueil marchand={marchand} userId={user.uid} onScan={() => setTab("scanner")} />}
      {tab === "scanner" && <TabScanner marchand={marchand} />}
      {tab === "clients" && <TabClients marchand={marchand} userId={user.uid} />}
      {tab === "carte" && <TabCarte marchand={marchand} userId={user.uid} />}
      {tab === "reglages" && <TabReglages marchand={marchand} userId={user.uid} />}
      <BottomNav tab={tab} onChange={setTab} />
    </main>
  );
}

// ─── Bottom Nav ───────────────────────────────────────────────────────────────

function BottomNav({ tab, onChange }: { tab: Tab; onChange: (t: Tab) => void }) {
  const items: { key: Tab; label: string; icon: string }[] = [
    { key: "accueil", label: "Accueil", icon: "🏠" },
    { key: "scanner", label: "Scanner", icon: "📷" },
    { key: "clients", label: "Clients", icon: "👥" },
    { key: "carte", label: "Ma carte", icon: "🎨" },
    { key: "reglages", label: "Réglages", icon: "⚙️" },
  ];
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex"
      style={{
        background: "var(--glass-bg)",
        backdropFilter: "blur(30px)",
        borderTop: "1px solid var(--border)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}>
      {items.map(item => (
        <button key={item.key} onClick={() => onChange(item.key)}
          className="flex-1 flex flex-col items-center gap-1 py-3 transition-all"
          style={{ color: tab === item.key ? "var(--accent)" : "var(--fg-tertiary)" }}>
          <span className="text-xl">{item.icon}</span>
          <span className="text-[10px] font-medium">{item.label}</span>
        </button>
      ))}
    </nav>
  );
}

// ─── Tab Accueil ──────────────────────────────────────────────────────────────

function TabAccueil({ marchand, userId, onScan }: { marchand: Marchand; userId: string; onScan: () => void }) {
  const [stats, setStats] = useState({ total: 0, aujourd_hui: 0, tampons_total: 0 });

  useEffect(() => {
    async function charger() {
      const snap = await getDocs(query(collection(db, "clients"), where("marchand_id", "==", userId)));
      const today = new Date(); today.setHours(0, 0, 0, 0);
      let aujourd_hui = 0, tampons_total = 0;
      snap.docs.forEach(d => {
        const data = d.data();
        tampons_total += data.tampons || 0;
        if (data.derniere_visite?.seconds * 1000 >= today.getTime()) aujourd_hui++;
      });
      setStats({ total: snap.size, aujourd_hui, tampons_total });
    }
    charger();
  }, [userId]);

  return (
    <div className="px-5 pt-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-[26px] font-semibold tracking-tight" style={{ color: "var(--fg)" }}>{marchand.nom}</h1>
          <p className="text-[14px] mt-0.5" style={{ color: "var(--fg-secondary)" }}>Tableau de bord</p>
        </div>
        <button onClick={() => signOut(auth)} className="text-[13px] px-3 py-1.5 rounded-xl"
          style={{ color: "var(--fg-tertiary)", background: "var(--glass-bg)", border: "1px solid var(--border)" }}>
          Sortir
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: "Aujourd'hui", value: stats.aujourd_hui, color: "var(--accent)" },
          { label: "Clients", value: stats.total, color: "var(--fg)" },
          { label: "Tampons", value: stats.tampons_total, color: "#34C759" },
        ].map(s => (
          <div key={s.label} className="rounded-[20px] p-4"
            style={{ background: "var(--glass-bg)", border: "1px solid var(--glass-border)", backdropFilter: "blur(20px)" }}>
            <p className="text-[28px] font-semibold" style={{ color: s.color }}>{s.value}</p>
            <p className="text-[11px] mt-0.5" style={{ color: "var(--fg-secondary)" }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Bouton scanner */}
      <button onClick={onScan}
        className="w-full py-5 rounded-[24px] flex items-center justify-center gap-3 text-white text-[17px] font-semibold"
        style={{ background: "var(--accent)", boxShadow: "0 8px 30px rgba(0,122,255,0.35)" }}>
        <span className="text-2xl">📷</span>
        Scanner la carte d&apos;un client
      </button>

      {/* NFC URL */}
      {marchand.nfc_id && (
        <div className="mt-4 rounded-[20px] p-4"
          style={{ background: "var(--glass-bg)", border: "1px solid var(--glass-border)" }}>
          <p className="text-[12px] font-medium mb-1" style={{ color: "var(--fg-secondary)" }}>URL de votre tag NFC</p>
          <p className="text-[13px] font-mono" style={{ color: "var(--accent)" }}>
            app.wallio.ma/nfc/{marchand.nfc_id}
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Tab Scanner ──────────────────────────────────────────────────────────────

function TabScanner({ marchand }: { marchand: Marchand }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [scanning, setScanning] = useState(false);
  const [detected, setDetected] = useState<string | null>(null);
  const animRef = useRef<number>(0);

  const scan = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState !== video.HAVE_ENOUGH_DATA) {
      animRef.current = requestAnimationFrame(scan);
      return;
    }
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    canvas.height = video.videoHeight;
    canvas.width = video.videoWidth;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(imageData.data, imageData.width, imageData.height);
    if (code?.data) {
      const match = code.data.match(/\/client\/([a-f0-9-]+)/);
      if (match) {
        setDetected(match[1]);
        stopCamera();
        return;
      }
    }
    animRef.current = requestAnimationFrame(scan);
  }, []);

  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      if (videoRef.current) videoRef.current.srcObject = stream;
      setScanning(true);
      animRef.current = requestAnimationFrame(scan);
    } catch { setScanning(false); }
  }

  function stopCamera() {
    cancelAnimationFrame(animRef.current);
    const video = videoRef.current;
    if (video?.srcObject) {
      (video.srcObject as MediaStream).getTracks().forEach(t => t.stop());
      video.srcObject = null;
    }
    setScanning(false);
  }

  useEffect(() => () => { cancelAnimationFrame(animRef.current); stopCamera(); }, []);

  if (detected) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6" style={{ background: "var(--bg)" }}>
        <div className="text-5xl mb-4">✅</div>
        <h2 className="text-[22px] font-semibold mb-2" style={{ color: "var(--fg)" }}>QR code détecté</h2>
        <p className="text-[14px] mb-8" style={{ color: "var(--fg-secondary)" }}>Client identifié</p>
        <a href={`/client/${detected}`}
          className="w-full max-w-xs py-4 rounded-2xl text-center text-white font-semibold text-[16px] block"
          style={{ background: "var(--accent)" }}>
          Voir le profil client
        </a>
        <button onClick={() => setDetected(null)} className="mt-4 text-[14px]" style={{ color: "var(--fg-secondary)" }}>
          Scanner à nouveau
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--bg)" }}>
      <div className="px-5 pt-12 mb-6">
        <h1 className="text-[26px] font-semibold tracking-tight" style={{ color: "var(--fg)" }}>Scanner</h1>
        <p className="text-[14px] mt-0.5" style={{ color: "var(--fg-secondary)" }}>
          Scannez la carte Wallet d&apos;un client
        </p>
      </div>

      <div className="flex-1 px-5">
        {scanning ? (
          <div className="relative rounded-[28px] overflow-hidden" style={{ aspectRatio: "1" }}>
            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
            <canvas ref={canvasRef} className="hidden" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-48 h-48 rounded-2xl border-2" style={{ borderColor: "var(--accent)" }} />
            </div>
            <button onClick={stopCamera}
              className="absolute bottom-4 left-1/2 -translate-x-1/2 px-6 py-2.5 rounded-full text-[14px] font-medium"
              style={{ background: "rgba(0,0,0,0.6)", color: "white" }}>
              Arrêter
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="text-6xl mb-6">📷</div>
            <button onClick={startCamera}
              className="px-8 py-4 rounded-2xl text-white font-semibold text-[16px]"
              style={{ background: "var(--accent)", boxShadow: "0 8px 24px rgba(0,122,255,0.3)" }}>
              Activer la caméra
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Tab Clients ──────────────────────────────────────────────────────────────

function TabClients({ marchand, userId }: { marchand: Marchand; userId: string }) {
  const [clients, setClients] = useState<Client[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function charger() {
      const snap = await getDocs(query(
        collection(db, "clients"),
        where("marchand_id", "==", userId),
        orderBy("date_inscription", "desc")
      ));
      setClients(snap.docs.map(d => ({ id: d.id, ...d.data() } as Client)));
      setLoading(false);
    }
    charger();
  }, [userId]);

  const filtered = clients.filter(c =>
    `${c.prenom} ${c.nom} ${c.telephone}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="px-5 pt-12">
      <div className="mb-6">
        <h1 className="text-[26px] font-semibold tracking-tight mb-1" style={{ color: "var(--fg)" }}>Clients</h1>
        <p className="text-[14px]" style={{ color: "var(--fg-secondary)" }}>{clients.length} client{clients.length > 1 ? "s" : ""}</p>
      </div>

      <input type="text" placeholder="Rechercher…" value={search} onChange={e => setSearch(e.target.value)}
        className="w-full px-4 py-3 rounded-2xl text-[15px] outline-none mb-4 transition-all"
        style={{ background: "var(--glass-bg)", border: "1px solid var(--border)", color: "var(--fg)" }}
        onFocus={e => e.target.style.borderColor = "var(--accent)"}
        onBlur={e => e.target.style.borderColor = "var(--border)"}
      />

      {loading ? (
        <div className="flex justify-center py-10">
          <div className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin"
            style={{ borderColor: "var(--accent)", borderTopColor: "transparent" }} />
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(client => (
            <a key={client.id} href={`/client/${client.wallet_id}`}
              className="flex items-center gap-4 p-4 rounded-[20px] transition-all block"
              style={{ background: "var(--glass-bg)", border: "1px solid var(--glass-border)", backdropFilter: "blur(20px)" }}>
              <div className="w-11 h-11 rounded-full flex items-center justify-center text-white font-semibold text-[16px] flex-shrink-0"
                style={{ background: "var(--accent)" }}>
                {client.prenom[0]}{client.nom[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[15px] font-medium" style={{ color: "var(--fg)" }}>{client.prenom} {client.nom}</p>
                <p className="text-[13px]" style={{ color: "var(--fg-secondary)" }}>{client.telephone}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-[15px] font-semibold" style={{ color: "var(--accent)" }}>
                  {client.tampons}/{marchand.objectif_tampons}
                </p>
                <p className="text-[11px]" style={{ color: "var(--fg-tertiary)" }}>tampons</p>
              </div>
            </a>
          ))}
          {filtered.length === 0 && (
            <p className="text-center py-10 text-[15px]" style={{ color: "var(--fg-tertiary)" }}>Aucun client trouvé</p>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Tab Carte (éditeur) ──────────────────────────────────────────────────────

function TabCarte({ marchand, userId }: { marchand: Marchand; userId: string }) {
  const [config, setConfig] = useState({
    nom: marchand.nom || "",
    icone_tampons: marchand.icone_tampons || "⭐",
    couleur_principale: marchand.couleur_principale || "#007AFF",
    couleur_secondaire: marchand.couleur_secondaire || "#005EC4",
    objectif_tampons: marchand.objectif_tampons || 10,
    nom_recompense: marchand.nom_recompense || "Récompense offerte",
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function sauvegarder() {
    setSaving(true);
    await updateDoc(doc(db, "marchands", userId), { ...config, updated_at: serverTimestamp() });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  const gradient = `linear-gradient(135deg, ${config.couleur_principale}, ${config.couleur_secondaire})`;

  return (
    <div className="px-5 pt-12 pb-6">
      <h1 className="text-[26px] font-semibold tracking-tight mb-1" style={{ color: "var(--fg)" }}>Ma carte</h1>
      <p className="text-[14px] mb-6" style={{ color: "var(--fg-secondary)" }}>Personnalisez votre carte de fidélité</p>

      {/* Aperçu live */}
      <div className="rounded-[28px] p-6 mb-7" style={{ background: gradient, boxShadow: "0 16px 48px rgba(0,0,0,0.2)" }}>
        <div className="flex items-start justify-between mb-7">
          <div>
            <p className="text-white/60 text-[11px] font-medium uppercase tracking-wider mb-1">Carte de fidélité</p>
            <p className="text-white text-[19px] font-semibold">{config.nom}</p>
          </div>
          <span className="text-3xl">{config.icone_tampons}</span>
        </div>
        <div className="flex gap-2 flex-wrap mb-7">
          {Array.from({ length: Math.min(config.objectif_tampons, 12) }).map((_, i) => (
            <div key={i} className="w-8 h-8 rounded-full flex items-center justify-center text-sm"
              style={{ background: i < 3 ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.2)" }}>
              {i < 3 ? config.icone_tampons : ""}
            </div>
          ))}
          {config.objectif_tampons > 12 && <span className="text-white/60 text-sm self-center">+{config.objectif_tampons - 12}</span>}
        </div>
        <div>
          <p className="text-white/60 text-[11px] uppercase tracking-wider">Récompense</p>
          <p className="text-white text-[14px] font-medium">{config.nom_recompense}</p>
        </div>
      </div>

      {/* Éditeur */}
      <div className="space-y-4">
        {/* Nom */}
        <div>
          <label className="block text-[12px] font-medium mb-1.5" style={{ color: "var(--fg-secondary)" }}>Nom de l&apos;établissement</label>
          <input type="text" value={config.nom} onChange={e => setConfig({ ...config, nom: e.target.value })}
            className="w-full px-4 py-3 rounded-2xl text-[15px] outline-none transition-all"
            style={{ background: "var(--glass-bg)", border: "1px solid var(--border)", color: "var(--fg)" }}
            onFocus={e => e.target.style.borderColor = "var(--accent)"}
            onBlur={e => e.target.style.borderColor = "var(--border)"}
          />
        </div>

        {/* Récompense */}
        <div>
          <label className="block text-[12px] font-medium mb-1.5" style={{ color: "var(--fg-secondary)" }}>Nom de la récompense</label>
          <input type="text" value={config.nom_recompense} onChange={e => setConfig({ ...config, nom_recompense: e.target.value })}
            className="w-full px-4 py-3 rounded-2xl text-[15px] outline-none transition-all"
            style={{ background: "var(--glass-bg)", border: "1px solid var(--border)", color: "var(--fg)" }}
            onFocus={e => e.target.style.borderColor = "var(--accent)"}
            onBlur={e => e.target.style.borderColor = "var(--border)"}
          />
        </div>

        {/* Objectif */}
        <div>
          <label className="block text-[12px] font-medium mb-1.5" style={{ color: "var(--fg-secondary)" }}>
            Nombre de tampons pour la récompense : <strong>{config.objectif_tampons}</strong>
          </label>
          <input type="range" min={3} max={20} value={config.objectif_tampons}
            onChange={e => setConfig({ ...config, objectif_tampons: Number(e.target.value) })}
            className="w-full" style={{ accentColor: "var(--accent)" }}
          />
        </div>

        {/* Couleurs */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[12px] font-medium mb-1.5" style={{ color: "var(--fg-secondary)" }}>Couleur principale</label>
            <div className="flex items-center gap-3 p-3 rounded-2xl" style={{ background: "var(--glass-bg)", border: "1px solid var(--border)" }}>
              <input type="color" value={config.couleur_principale}
                onChange={e => setConfig({ ...config, couleur_principale: e.target.value })}
                className="w-8 h-8 rounded-lg cursor-pointer border-0 bg-transparent" />
              <span className="text-[13px] font-mono" style={{ color: "var(--fg-secondary)" }}>{config.couleur_principale}</span>
            </div>
          </div>
          <div>
            <label className="block text-[12px] font-medium mb-1.5" style={{ color: "var(--fg-secondary)" }}>Couleur secondaire</label>
            <div className="flex items-center gap-3 p-3 rounded-2xl" style={{ background: "var(--glass-bg)", border: "1px solid var(--border)" }}>
              <input type="color" value={config.couleur_secondaire}
                onChange={e => setConfig({ ...config, couleur_secondaire: e.target.value })}
                className="w-8 h-8 rounded-lg cursor-pointer border-0 bg-transparent" />
              <span className="text-[13px] font-mono" style={{ color: "var(--fg-secondary)" }}>{config.couleur_secondaire}</span>
            </div>
          </div>
        </div>

        {/* Icône */}
        <div>
          <label className="block text-[12px] font-medium mb-2" style={{ color: "var(--fg-secondary)" }}>Icône tampons</label>
          <div className="flex flex-wrap gap-2">
            {ICONES.map(ic => (
              <button key={ic} onClick={() => setConfig({ ...config, icone_tampons: ic })}
                className="w-11 h-11 rounded-2xl text-2xl flex items-center justify-center transition-all"
                style={{
                  background: config.icone_tampons === ic ? "var(--accent)" : "var(--glass-bg)",
                  border: `1px solid ${config.icone_tampons === ic ? "var(--accent)" : "var(--border)"}`,
                  transform: config.icone_tampons === ic ? "scale(1.1)" : "scale(1)",
                }}>
                {ic}
              </button>
            ))}
          </div>
        </div>

        {/* Bouton sauvegarder */}
        <button onClick={sauvegarder} disabled={saving}
          className="w-full py-4 rounded-2xl text-[16px] font-semibold text-white mt-2 transition-all"
          style={{ background: saved ? "#34C759" : "var(--accent)", boxShadow: `0 4px 16px rgba(0,122,255,0.3)` }}>
          {saving ? "Sauvegarde…" : saved ? "✅ Sauvegardé !" : "Sauvegarder"}
        </button>
      </div>
    </div>
  );
}

// ─── Tab Réglages ─────────────────────────────────────────────────────────────

function TabReglages({ marchand, userId }: { marchand: Marchand; userId: string }) {
  const [config, setConfig] = useState({
    mode_recompense: marchand.mode_recompense || "cyclique",
    anti_doublon_delai: marchand.anti_doublon_delai || 86400,
    fuseau_horaire: marchand.fuseau_horaire || Intl.DateTimeFormat().resolvedOptions().timeZone,
  });
  const [nfcId, setNfcId] = useState(marchand.nfc_id || "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [generatingNfc, setGeneratingNfc] = useState(false);

  async function sauvegarder() {
    setSaving(true);
    await updateDoc(doc(db, "marchands", userId), { ...config, updated_at: serverTimestamp() });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function genererNfc() {
    setGeneratingNfc(true);
    const id = await genererNfcId(userId);
    setNfcId(id);
    setGeneratingNfc(false);
  }

  return (
    <div className="px-5 pt-12 pb-6">
      <h1 className="text-[26px] font-semibold tracking-tight mb-1" style={{ color: "var(--fg)" }}>Réglages</h1>
      <p className="text-[14px] mb-6" style={{ color: "var(--fg-secondary)" }}>Configuration de la fidélité</p>

      <div className="space-y-4">

        {/* Mode récompense */}
        <div className="rounded-[20px] p-5" style={{ background: "var(--glass-bg)", border: "1px solid var(--glass-border)" }}>
          <p className="text-[14px] font-semibold mb-3" style={{ color: "var(--fg)" }}>Mode de récompense</p>
          <div className="grid grid-cols-2 gap-2">
            {(["cyclique", "progressif"] as const).map(mode => (
              <button key={mode} onClick={() => setConfig({ ...config, mode_recompense: mode })}
                className="py-3 rounded-2xl text-[14px] font-medium transition-all capitalize"
                style={{
                  background: config.mode_recompense === mode ? "var(--accent)" : "var(--bg)",
                  color: config.mode_recompense === mode ? "white" : "var(--fg-secondary)",
                  border: `1px solid ${config.mode_recompense === mode ? "var(--accent)" : "var(--border)"}`,
                }}>
                {mode === "cyclique" ? "🔄 Cyclique" : "📈 Progressif"}
              </button>
            ))}
          </div>
          <p className="text-[12px] mt-2" style={{ color: "var(--fg-tertiary)" }}>
            {config.mode_recompense === "cyclique"
              ? "Repart à zéro après chaque récompense"
              : "Tampons cumulatifs, paliers progressifs"}
          </p>
        </div>

        {/* Anti-doublon */}
        <div className="rounded-[20px] p-5" style={{ background: "var(--glass-bg)", border: "1px solid var(--glass-border)" }}>
          <p className="text-[14px] font-semibold mb-3" style={{ color: "var(--fg)" }}>Anti-doublon</p>
          <select value={config.anti_doublon_delai}
            onChange={e => setConfig({ ...config, anti_doublon_delai: Number(e.target.value) })}
            className="w-full px-4 py-3 rounded-2xl text-[15px] outline-none"
            style={{ background: "var(--bg)", border: "1px solid var(--border)", color: "var(--fg)" }}>
            {ANTI_DOUBLON_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <p className="text-[12px] mt-2" style={{ color: "var(--fg-tertiary)" }}>
            Délai minimum entre deux tampons pour un même client
          </p>
        </div>

        {/* Fuseau horaire */}
        <div className="rounded-[20px] p-5" style={{ background: "var(--glass-bg)", border: "1px solid var(--glass-border)" }}>
          <p className="text-[14px] font-semibold mb-3" style={{ color: "var(--fg)" }}>Fuseau horaire</p>
          <select value={config.fuseau_horaire}
            onChange={e => setConfig({ ...config, fuseau_horaire: e.target.value })}
            className="w-full px-4 py-3 rounded-2xl text-[15px] outline-none"
            style={{ background: "var(--bg)", border: "1px solid var(--border)", color: "var(--fg)" }}>
            {["Africa/Casablanca", "Europe/Paris", "Europe/London", "America/New_York", "Asia/Dubai"].map(tz => (
              <option key={tz} value={tz}>{tz}</option>
            ))}
          </select>
        </div>

        {/* NFC */}
        <div className="rounded-[20px] p-5" style={{ background: "var(--glass-bg)", border: "1px solid var(--glass-border)" }}>
          <p className="text-[14px] font-semibold mb-3" style={{ color: "var(--fg)" }}>Tag NFC</p>
          {nfcId ? (
            <>
              <div className="rounded-2xl p-3 mb-3" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
                <p className="text-[12px] mb-0.5" style={{ color: "var(--fg-tertiary)" }}>URL à encoder sur le tag</p>
                <p className="text-[13px] font-mono" style={{ color: "var(--accent)" }}>
                  app.wallio.ma/nfc/{nfcId}
                </p>
              </div>
              <button onClick={genererNfc} disabled={generatingNfc}
                className="text-[13px] px-4 py-2 rounded-xl"
                style={{ background: "rgba(255,59,48,0.08)", color: "#FF3B30" }}>
                {generatingNfc ? "Génération…" : "Régénérer (désactive l'ancien)"}
              </button>
            </>
          ) : (
            <button onClick={genererNfc} disabled={generatingNfc}
              className="w-full py-3 rounded-2xl text-[15px] font-medium"
              style={{ background: "var(--accent)", color: "white" }}>
              {generatingNfc ? "Génération…" : "Générer mon identifiant NFC"}
            </button>
          )}
        </div>

        <button onClick={sauvegarder} disabled={saving}
          className="w-full py-4 rounded-2xl text-[16px] font-semibold text-white transition-all"
          style={{ background: saved ? "#34C759" : "var(--accent)" }}>
          {saving ? "Sauvegarde…" : saved ? "✅ Sauvegardé !" : "Sauvegarder les réglages"}
        </button>
      </div>
    </div>
  );
}
