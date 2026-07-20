"use client";

import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef, useCallback } from "react";
import { signOut } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import {
  collection, getDocs, query, where, orderBy,
  doc, updateDoc, serverTimestamp,
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

// ─── SVG Icons ────────────────────────────────────────────────────────────────

const Icon = {
  Home: () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12L12 3L21 12V21H15V15H9V21H3V12Z"/>
    </svg>
  ),
  Camera: () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
      <circle cx="12" cy="13" r="4"/>
    </svg>
  ),
  Users: () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  ),
  Card: () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="5" width="20" height="14" rx="2"/>
      <line x1="2" y1="10" x2="22" y2="10"/>
    </svg>
  ),
  Settings: () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  ),
  LogOut: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
      <polyline points="16 17 21 12 16 7"/>
      <line x1="21" y1="12" x2="9" y2="12"/>
    </svg>
  ),
  Scan: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2"/>
      <line x1="7" y1="12" x2="17" y2="12"/>
    </svg>
  ),
  Print: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 6 2 18 2 18 9"/>
      <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
      <rect x="6" y="14" width="12" height="8"/>
    </svg>
  ),
  Wifi: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12.55a11 11 0 0 1 14.08 0"/>
      <path d="M1.42 9a16 16 0 0 1 21.16 0"/>
      <path d="M8.53 16.11a6 6 0 0 1 6.95 0"/>
      <circle cx="12" cy="20" r="1" fill="currentColor"/>
    </svg>
  ),
  ChevronRight: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6"/>
    </svg>
  ),
};

// ─── Main ─────────────────────────────────────────────────────────────────────

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
        <div className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin"
          style={{ borderColor: "var(--accent)", borderTopColor: "transparent" }} />
      </main>
    );
  }

  return (
    <main className="min-h-screen pb-24" style={{ background: "var(--bg)" }}>
      {tab === "accueil" && <TabAccueil marchand={marchand} userId={user.uid} onScan={() => setTab("scanner")} />}
      {tab === "scanner" && <TabScanner />}
      {tab === "clients" && <TabClients marchand={marchand} userId={user.uid} />}
      {tab === "carte" && <TabCarte marchand={marchand} userId={user.uid} />}
      {tab === "reglages" && <TabReglages marchand={marchand} userId={user.uid} />}
      <BottomNav tab={tab} onChange={setTab} />
    </main>
  );
}

// ─── Bottom Nav ───────────────────────────────────────────────────────────────

function BottomNav({ tab, onChange }: { tab: Tab; onChange: (t: Tab) => void }) {
  const items: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: "accueil", label: "Accueil", icon: <Icon.Home /> },
    { key: "scanner", label: "Scanner", icon: <Icon.Camera /> },
    { key: "clients", label: "Clients", icon: <Icon.Users /> },
    { key: "carte", label: "Ma carte", icon: <Icon.Card /> },
    { key: "reglages", label: "Réglages", icon: <Icon.Settings /> },
  ];
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex"
      style={{
        background: "var(--glass-bg)",
        backdropFilter: "blur(30px)",
        borderTop: "1px solid var(--border)",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
      }}>
      {items.map(item => (
        <button key={item.key} onClick={() => onChange(item.key)}
          className="flex-1 flex flex-col items-center gap-1 py-3 transition-all duration-200"
          style={{ color: tab === item.key ? "var(--accent)" : "var(--fg-tertiary)" }}>
          {item.icon}
          <span className="text-[10px] font-medium tracking-wide">{item.label}</span>
        </button>
      ))}
    </nav>
  );
}

// ─── Tab Accueil ──────────────────────────────────────────────────────────────

type Stats = { total: number; aujourd_hui: number; tampons_total: number; ce_mois: number; semaine: number[] };

function TabAccueil({ marchand, userId, onScan }: { marchand: Marchand; userId: string; onScan: () => void }) {
  const [stats, setStats] = useState<Stats>({ total: 0, aujourd_hui: 0, tampons_total: 0, ce_mois: 0, semaine: [0,0,0,0,0,0,0] });

  useEffect(() => {
    async function charger() {
      const snap = await getDocs(query(collection(db, "clients"), where("marchand_id", "==", userId)));
      const now = new Date();
      const today = new Date(now); today.setHours(0,0,0,0);
      const moisDebut = new Date(now.getFullYear(), now.getMonth(), 1);
      let aujourd_hui = 0, tampons_total = 0, ce_mois = 0;
      const semaine = [0,0,0,0,0,0,0];
      snap.docs.forEach(d => {
        const data = d.data();
        tampons_total += data.tampons || 0;
        const dv = data.derniere_visite?.seconds * 1000;
        if (dv >= today.getTime()) aujourd_hui++;
        if (dv >= moisDebut.getTime()) ce_mois++;
        for (let i = 0; i < 7; i++) {
          const j = new Date(today); j.setDate(j.getDate() - (6 - i));
          const jf = new Date(j); jf.setDate(jf.getDate() + 1);
          if (dv >= j.getTime() && dv < jf.getTime()) semaine[i]++;
        }
      });
      setStats({ total: snap.size, aujourd_hui, tampons_total, ce_mois, semaine });
    }
    charger();
  }, [userId]);

  const maxSemaine = Math.max(...stats.semaine, 1);
  const jours = ["L", "M", "M", "J", "V", "S", "D"];

  return (
    <div className="px-5 pt-14">

      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <p className="text-[13px] font-medium mb-0.5" style={{ color: "var(--fg-tertiary)" }}>Tableau de bord</p>
          <h1 className="text-[26px] font-semibold tracking-[-0.5px]" style={{ color: "var(--fg)" }}>{marchand.nom}</h1>
        </div>
        <button onClick={() => signOut(auth)}
          className="w-9 h-9 rounded-2xl flex items-center justify-center transition-all mt-1"
          style={{ color: "var(--fg-tertiary)", background: "var(--glass-bg)", border: "1px solid var(--border)" }}>
          <Icon.LogOut />
        </button>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {[
          { label: "Aujourd'hui", value: stats.aujourd_hui, color: "var(--accent)" },
          { label: "Ce mois", value: stats.ce_mois, color: "#34C759" },
          { label: "Total clients", value: stats.total, color: "var(--fg)" },
          { label: "Tampons donnés", value: stats.tampons_total, color: "var(--fg-secondary)" },
        ].map(s => (
          <div key={s.label} className="rounded-[20px] p-4"
            style={{ background: "var(--glass-bg)", border: "1px solid var(--glass-border)", backdropFilter: "blur(20px)" }}>
            <p className="text-[32px] font-semibold tracking-tight leading-none mb-1.5" style={{ color: s.color }}>{s.value}</p>
            <p className="text-[12px]" style={{ color: "var(--fg-secondary)" }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Graphique */}
      <div className="rounded-[20px] p-5 mb-4"
        style={{ background: "var(--glass-bg)", border: "1px solid var(--glass-border)", backdropFilter: "blur(20px)" }}>
        <p className="text-[12px] font-semibold mb-4 uppercase tracking-wider" style={{ color: "var(--fg-tertiary)" }}>
          Visites — 7 derniers jours
        </p>
        <div className="flex items-end gap-2 h-16">
          {stats.semaine.map((val, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
              <div className="w-full rounded-md transition-all duration-500"
                style={{
                  height: `${Math.max((val / maxSemaine) * 52, val > 0 ? 6 : 2)}px`,
                  background: i === 6 ? "var(--accent)" : "var(--border)",
                }} />
              <span className="text-[10px] font-medium" style={{ color: "var(--fg-tertiary)" }}>{jours[i]}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <button onClick={onScan}
        className="w-full py-4 rounded-[22px] flex items-center justify-center gap-2.5 text-white text-[15px] font-semibold mb-3 transition-all duration-200"
        style={{ background: "var(--accent)", boxShadow: "0 8px 30px rgba(0,122,255,0.28)" }}
        onMouseEnter={e => (e.currentTarget.style.transform = "translateY(-1px)")}
        onMouseLeave={e => (e.currentTarget.style.transform = "translateY(0)")}>
        <Icon.Scan />
        Scanner la carte d&apos;un client
      </button>

      <div className="grid grid-cols-2 gap-3">
        <a href="/dashboard/carte-comptoir"
          className="rounded-[20px] p-4 flex items-center justify-between transition-all"
          style={{ background: "var(--glass-bg)", border: "1px solid var(--glass-border)" }}>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: "rgba(0,122,255,0.1)", color: "var(--accent)" }}>
              <Icon.Print />
            </div>
            <span className="text-[13px] font-medium" style={{ color: "var(--fg)" }}>Carte NFC</span>
          </div>
          <Icon.ChevronRight />
        </a>

        <div className="rounded-[20px] p-4"
          style={{ background: "var(--glass-bg)", border: "1px solid var(--glass-border)" }}>
          <div className="flex items-center gap-1.5 mb-1" style={{ color: "var(--fg-tertiary)" }}>
            <Icon.Wifi />
            <span className="text-[11px] font-medium uppercase tracking-wider">NFC</span>
          </div>
          {marchand.nfc_id ? (
            <p className="text-[12px] font-mono truncate" style={{ color: "var(--accent)" }}>
              .../{marchand.nfc_id}
            </p>
          ) : (
            <p className="text-[12px]" style={{ color: "#FF9F0A" }}>Non configuré</p>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Tab Scanner ──────────────────────────────────────────────────────────────

function TabScanner() {
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
      if (match) { setDetected(match[1]); stopCamera(); return; }
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

  if (detected) return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center" style={{ background: "var(--bg)" }}>
      <div className="w-16 h-16 rounded-full flex items-center justify-center mb-6"
        style={{ background: "rgba(52,199,89,0.12)" }}>
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#34C759" strokeWidth="2" strokeLinecap="round">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
      </div>
      <h2 className="text-[22px] font-semibold mb-1" style={{ color: "var(--fg)" }}>Client identifié</h2>
      <p className="text-[14px] mb-8" style={{ color: "var(--fg-secondary)" }}>QR code scanné avec succès</p>
      <a href={`/client/${detected}`}
        className="w-full max-w-xs py-4 rounded-2xl text-center text-white font-semibold text-[16px] block"
        style={{ background: "var(--accent)", boxShadow: "0 4px 16px rgba(0,122,255,0.3)" }}>
        Voir le profil
      </a>
      <button onClick={() => setDetected(null)} className="mt-4 text-[14px]" style={{ color: "var(--fg-tertiary)" }}>
        Scanner à nouveau
      </button>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--bg)" }}>
      <div className="px-5 pt-14 mb-6">
        <p className="text-[13px] font-medium mb-0.5" style={{ color: "var(--fg-tertiary)" }}>Lecture</p>
        <h1 className="text-[26px] font-semibold tracking-[-0.5px]" style={{ color: "var(--fg)" }}>Scanner</h1>
      </div>

      <div className="flex-1 px-5 flex flex-col">
        {scanning ? (
          <div className="relative rounded-[28px] overflow-hidden" style={{ aspectRatio: "1" }}>
            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
            <canvas ref={canvasRef} className="hidden" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-52 h-52 rounded-3xl border-2" style={{ borderColor: "var(--accent)" }} />
            </div>
            <button onClick={stopCamera}
              className="absolute bottom-4 left-1/2 -translate-x-1/2 px-6 py-2.5 rounded-full text-[14px] font-medium"
              style={{ background: "rgba(0,0,0,0.55)", color: "white", backdropFilter: "blur(10px)" }}>
              Arrêter
            </button>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            <div className="w-20 h-20 rounded-3xl flex items-center justify-center mb-6"
              style={{ background: "rgba(0,122,255,0.08)", color: "var(--accent)" }}>
              <Icon.Camera />
            </div>
            <p className="text-[17px] font-semibold mb-2" style={{ color: "var(--fg)" }}>Scanner une carte client</p>
            <p className="text-[14px] mb-8 max-w-xs" style={{ color: "var(--fg-secondary)" }}>
              Pointez la caméra vers le QR code sur la carte Wallet du client
            </p>
            <button onClick={startCamera}
              className="px-8 py-4 rounded-2xl text-white font-semibold text-[16px] transition-all"
              style={{ background: "var(--accent)", boxShadow: "0 8px 24px rgba(0,122,255,0.28)" }}>
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
        collection(db, "clients"), where("marchand_id", "==", userId), orderBy("date_inscription", "desc")
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
    <div className="px-5 pt-14">
      <div className="mb-6">
        <p className="text-[13px] font-medium mb-0.5" style={{ color: "var(--fg-tertiary)" }}>
          {clients.length} client{clients.length > 1 ? "s" : ""}
        </p>
        <h1 className="text-[26px] font-semibold tracking-[-0.5px]" style={{ color: "var(--fg)" }}>Clients</h1>
      </div>

      <div className="relative mb-4">
        <svg className="absolute left-3.5 top-1/2 -translate-y-1/2" width="16" height="16" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ color: "var(--fg-tertiary)" }}>
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input type="text" placeholder="Rechercher un client…" value={search} onChange={e => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-3 rounded-2xl text-[15px] outline-none transition-all"
          style={{ background: "var(--glass-bg)", border: "1px solid var(--border)", color: "var(--fg)" }}
          onFocus={e => e.target.style.borderColor = "var(--accent)"}
          onBlur={e => e.target.style.borderColor = "var(--border)"}
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin"
            style={{ borderColor: "var(--accent)", borderTopColor: "transparent" }} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-[15px]" style={{ color: "var(--fg-tertiary)" }}>
            {search ? "Aucun résultat" : "Aucun client pour l'instant"}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(client => (
            <a key={client.id} href={`/client/${client.wallet_id}`}
              className="flex items-center gap-3.5 p-4 rounded-[20px] transition-all"
              style={{ background: "var(--glass-bg)", border: "1px solid var(--glass-border)", backdropFilter: "blur(20px)" }}>
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-[13px] font-semibold flex-shrink-0"
                style={{ background: "var(--accent)" }}>
                {client.prenom?.[0]}{client.nom?.[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[15px] font-medium" style={{ color: "var(--fg)" }}>{client.prenom} {client.nom}</p>
                <p className="text-[12px]" style={{ color: "var(--fg-secondary)" }}>{client.telephone}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-[15px] font-semibold" style={{ color: "var(--accent)" }}>
                  {client.tampons}<span className="text-[12px] font-normal" style={{ color: "var(--fg-tertiary)" }}>/{marchand.objectif_tampons}</span>
                </p>
              </div>
              <Icon.ChevronRight />
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Tab Carte ────────────────────────────────────────────────────────────────

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
    setSaving(false); setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="px-5 pt-14 pb-6">
      <div className="mb-6">
        <p className="text-[13px] font-medium mb-0.5" style={{ color: "var(--fg-tertiary)" }}>Personnalisation</p>
        <h1 className="text-[26px] font-semibold tracking-[-0.5px]" style={{ color: "var(--fg)" }}>Ma carte</h1>
      </div>

      {/* Aperçu */}
      <div className="rounded-[28px] p-6 mb-7"
        style={{ background: `linear-gradient(135deg, ${config.couleur_principale}, ${config.couleur_secondaire})`, boxShadow: "0 16px 48px rgba(0,0,0,0.18)" }}>
        <div className="flex items-start justify-between mb-7">
          <div>
            <p className="text-white/50 text-[11px] font-medium uppercase tracking-widest mb-1">Fidélité</p>
            <p className="text-white text-[18px] font-semibold tracking-tight">{config.nom || "Nom de l'établissement"}</p>
          </div>
          <span className="text-2xl">{config.icone_tampons}</span>
        </div>
        <div className="flex gap-2 flex-wrap mb-7">
          {Array.from({ length: Math.min(config.objectif_tampons, 12) }).map((_, i) => (
            <div key={i} className="w-7 h-7 rounded-full flex items-center justify-center text-sm transition-all"
              style={{ background: i < 3 ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.18)" }}>
              {i < 3 ? config.icone_tampons : ""}
            </div>
          ))}
          {config.objectif_tampons > 12 && <span className="text-white/40 text-xs self-center">+{config.objectif_tampons - 12}</span>}
        </div>
        <div>
          <p className="text-white/50 text-[10px] uppercase tracking-widest">Récompense</p>
          <p className="text-white text-[13px] font-medium mt-0.5">{config.nom_recompense}</p>
        </div>
      </div>

      {/* Éditeur */}
      <div className="space-y-5">

        <div>
          <label className="block text-[12px] font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--fg-tertiary)" }}>Nom</label>
          <input type="text" value={config.nom} onChange={e => setConfig({ ...config, nom: e.target.value })}
            placeholder="Nom de l'établissement"
            className="w-full px-4 py-3.5 rounded-2xl text-[15px] outline-none transition-all"
            style={{ background: "var(--glass-bg)", border: "1px solid var(--border)", color: "var(--fg)" }}
            onFocus={e => e.target.style.borderColor = "var(--accent)"}
            onBlur={e => e.target.style.borderColor = "var(--border)"}
          />
        </div>

        <div>
          <label className="block text-[12px] font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--fg-tertiary)" }}>Récompense</label>
          <input type="text" value={config.nom_recompense} onChange={e => setConfig({ ...config, nom_recompense: e.target.value })}
            className="w-full px-4 py-3.5 rounded-2xl text-[15px] outline-none transition-all"
            style={{ background: "var(--glass-bg)", border: "1px solid var(--border)", color: "var(--fg)" }}
            onFocus={e => e.target.style.borderColor = "var(--accent)"}
            onBlur={e => e.target.style.borderColor = "var(--border)"}
          />
        </div>

        <div>
          <label className="block text-[12px] font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--fg-tertiary)" }}>
            Tampons — <span style={{ color: "var(--accent)" }}>{config.objectif_tampons}</span>
          </label>
          <input type="range" min={3} max={20} value={config.objectif_tampons}
            onChange={e => setConfig({ ...config, objectif_tampons: Number(e.target.value) })}
            className="w-full" style={{ accentColor: "var(--accent)" }} />
          <div className="flex justify-between mt-1">
            <span className="text-[11px]" style={{ color: "var(--fg-tertiary)" }}>3</span>
            <span className="text-[11px]" style={{ color: "var(--fg-tertiary)" }}>20</span>
          </div>
        </div>

        <div>
          <label className="block text-[12px] font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--fg-tertiary)" }}>Couleurs</label>
          <div className="grid grid-cols-2 gap-3">
            {[
              { key: "couleur_principale", label: "Principale" },
              { key: "couleur_secondaire", label: "Secondaire" },
            ].map(c => (
              <div key={c.key} className="rounded-2xl p-3.5 flex items-center gap-3"
                style={{ background: "var(--glass-bg)", border: "1px solid var(--border)" }}>
                <div className="relative flex-shrink-0">
                  <div className="w-9 h-9 rounded-xl" style={{ background: config[c.key as keyof typeof config] as string }} />
                  <input type="color" value={config[c.key as keyof typeof config] as string}
                    onChange={e => setConfig({ ...config, [c.key]: e.target.value })}
                    className="absolute inset-0 opacity-0 w-full h-full cursor-pointer rounded-xl" />
                </div>
                <div>
                  <p className="text-[11px]" style={{ color: "var(--fg-tertiary)" }}>{c.label}</p>
                  <p className="text-[12px] font-mono" style={{ color: "var(--fg)" }}>{config[c.key as keyof typeof config] as string}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-[12px] font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--fg-tertiary)" }}>Icône tampons</label>
          <div className="flex flex-wrap gap-2">
            {ICONES.map(ic => (
              <button key={ic} onClick={() => setConfig({ ...config, icone_tampons: ic })}
                className="w-11 h-11 rounded-2xl text-xl flex items-center justify-center transition-all duration-150"
                style={{
                  background: config.icone_tampons === ic ? "var(--accent)" : "var(--glass-bg)",
                  border: `1px solid ${config.icone_tampons === ic ? "var(--accent)" : "var(--border)"}`,
                  transform: config.icone_tampons === ic ? "scale(1.08)" : "scale(1)",
                }}>
                {ic}
              </button>
            ))}
          </div>
        </div>

        <button onClick={sauvegarder} disabled={saving}
          className="w-full py-4 rounded-2xl text-[16px] font-semibold text-white transition-all duration-300"
          style={{ background: saved ? "#34C759" : "var(--accent)", boxShadow: "0 4px 16px rgba(0,122,255,0.25)" }}>
          {saving ? "Sauvegarde…" : saved ? "Sauvegardé" : "Sauvegarder"}
        </button>
      </div>
    </div>
  );
}

// ─── Tab Réglages ─────────────────────────────────────────────────────────────

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button onClick={() => onChange(!value)}
      className="relative w-11 h-6 rounded-full transition-all duration-200 flex-shrink-0"
      style={{ background: value ? "var(--accent)" : "var(--border)" }}>
      <div className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-all duration-200"
        style={{ left: value ? "calc(100% - 22px)" : "2px" }} />
    </button>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-[20px] p-5" style={{ background: "var(--glass-bg)", border: "1px solid var(--glass-border)" }}>
      <p className="text-[12px] font-semibold uppercase tracking-wider mb-4" style={{ color: "var(--fg-tertiary)" }}>{title}</p>
      {children}
    </div>
  );
}

function TabReglages({ marchand, userId }: { marchand: Marchand; userId: string }) {
  const marchandAny = marchand as Record<string, unknown>;
  const autoConfig = (marchandAny.automatisations as Record<string, unknown>) || {};
  const anniConfig = (autoConfig.anniversaire as Record<string, unknown>) || {};
  const relanceConfig = (autoConfig.relance as Record<string, unknown>) || {};

  const [config, setConfig] = useState({
    mode_recompense: marchand.mode_recompense || "cyclique",
    anti_doublon_delai: marchand.anti_doublon_delai || 86400,
    fuseau_horaire: marchand.fuseau_horaire || Intl.DateTimeFormat().resolvedOptions().timeZone,
  });
  const [auto, setAuto] = useState({
    anniversaire_actif: Boolean(anniConfig.actif),
    anniversaire_jours_avant: Number(anniConfig.jours_avant ?? 0),
    relance_actif: Boolean(relanceConfig.actif),
    relance_delai_jours: Number(relanceConfig.delai_jours ?? 30),
  });
  const [nfcId, setNfcId] = useState(marchand.nfc_id || "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [generatingNfc, setGeneratingNfc] = useState(false);

  async function sauvegarder() {
    setSaving(true);
    await updateDoc(doc(db, "marchands", userId), {
      ...config,
      automatisations: {
        anniversaire: { actif: auto.anniversaire_actif, jours_avant: auto.anniversaire_jours_avant },
        relance: { actif: auto.relance_actif, delai_jours: auto.relance_delai_jours },
      },
      updated_at: serverTimestamp(),
    });
    setSaving(false); setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function genererNfc() {
    setGeneratingNfc(true);
    const id = await genererNfcId(userId);
    setNfcId(id);
    setGeneratingNfc(false);
  }

  return (
    <div className="px-5 pt-14 pb-6">
      <div className="mb-6">
        <p className="text-[13px] font-medium mb-0.5" style={{ color: "var(--fg-tertiary)" }}>Configuration</p>
        <h1 className="text-[26px] font-semibold tracking-[-0.5px]" style={{ color: "var(--fg)" }}>Réglages</h1>
      </div>

      <div className="space-y-4">

        <Section title="Récompense">
          <div className="grid grid-cols-2 gap-2">
            {(["cyclique", "progressif"] as const).map(mode => (
              <button key={mode} onClick={() => setConfig({ ...config, mode_recompense: mode })}
                className="py-3 rounded-2xl text-[14px] font-medium transition-all duration-150"
                style={{
                  background: config.mode_recompense === mode ? "var(--accent)" : "var(--bg)",
                  color: config.mode_recompense === mode ? "white" : "var(--fg-secondary)",
                  border: `1px solid ${config.mode_recompense === mode ? "var(--accent)" : "var(--border)"}`,
                }}>
                {mode === "cyclique" ? "Cyclique" : "Progressif"}
              </button>
            ))}
          </div>
          <p className="text-[12px] mt-3" style={{ color: "var(--fg-tertiary)" }}>
            {config.mode_recompense === "cyclique" ? "Repart à zéro après chaque récompense" : "Paliers cumulatifs, jamais remis à zéro"}
          </p>
        </Section>

        <Section title="Anti-doublon">
          <select value={config.anti_doublon_delai}
            onChange={e => setConfig({ ...config, anti_doublon_delai: Number(e.target.value) })}
            className="w-full px-4 py-3 rounded-2xl text-[15px] outline-none"
            style={{ background: "var(--bg)", border: "1px solid var(--border)", color: "var(--fg)" }}>
            {ANTI_DOUBLON_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <p className="text-[12px] mt-2" style={{ color: "var(--fg-tertiary)" }}>Délai minimum entre deux tampons pour un même client</p>
        </Section>

        <Section title="Automatisations">
          <div className="space-y-5">
            <div>
              <div className="flex items-center justify-between mb-1">
                <div>
                  <p className="text-[14px] font-medium" style={{ color: "var(--fg)" }}>Anniversaire client</p>
                  <p className="text-[12px]" style={{ color: "var(--fg-tertiary)" }}>Bonus tampon pour les anniversaires</p>
                </div>
                <Toggle value={auto.anniversaire_actif} onChange={v => setAuto({ ...auto, anniversaire_actif: v })} />
              </div>
              {auto.anniversaire_actif && (
                <div className="mt-3 pt-3" style={{ borderTop: "1px solid var(--border)" }}>
                  <p className="text-[12px] mb-2" style={{ color: "var(--fg-secondary)" }}>
                    {auto.anniversaire_jours_avant === 0 ? "Le jour J" : `${auto.anniversaire_jours_avant} jour(s) avant`}
                  </p>
                  <input type="range" min={0} max={7} value={auto.anniversaire_jours_avant}
                    onChange={e => setAuto({ ...auto, anniversaire_jours_avant: Number(e.target.value) })}
                    className="w-full" style={{ accentColor: "var(--accent)" }} />
                </div>
              )}
            </div>

            <div style={{ borderTop: "1px solid var(--border)", paddingTop: "20px" }}>
              <div className="flex items-center justify-between mb-1">
                <div>
                  <p className="text-[14px] font-medium" style={{ color: "var(--fg)" }}>Relance inactifs</p>
                  <p className="text-[12px]" style={{ color: "var(--fg-tertiary)" }}>Clients sans visite depuis X jours</p>
                </div>
                <Toggle value={auto.relance_actif} onChange={v => setAuto({ ...auto, relance_actif: v })} />
              </div>
              {auto.relance_actif && (
                <div className="mt-3 pt-3" style={{ borderTop: "1px solid var(--border)" }}>
                  <p className="text-[12px] mb-2" style={{ color: "var(--fg-secondary)" }}>
                    Après {auto.relance_delai_jours} jours d&apos;inactivité
                  </p>
                  <input type="range" min={7} max={90} step={7} value={auto.relance_delai_jours}
                    onChange={e => setAuto({ ...auto, relance_delai_jours: Number(e.target.value) })}
                    className="w-full" style={{ accentColor: "var(--accent)" }} />
                </div>
              )}
            </div>
          </div>
        </Section>

        <Section title="Fuseau horaire">
          <select value={config.fuseau_horaire}
            onChange={e => setConfig({ ...config, fuseau_horaire: e.target.value })}
            className="w-full px-4 py-3 rounded-2xl text-[15px] outline-none"
            style={{ background: "var(--bg)", border: "1px solid var(--border)", color: "var(--fg)" }}>
            {["Africa/Casablanca", "Europe/Paris", "Europe/London", "America/New_York", "Asia/Dubai"].map(tz => (
              <option key={tz} value={tz}>{tz}</option>
            ))}
          </select>
        </Section>

        <Section title="Tag NFC">
          {nfcId ? (
            <>
              <div className="rounded-2xl p-3.5 mb-3" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
                <p className="text-[11px] uppercase tracking-wider mb-1" style={{ color: "var(--fg-tertiary)" }}>URL à encoder sur le tag</p>
                <p className="text-[13px] font-mono" style={{ color: "var(--accent)" }}>app.wallio.ma/nfc/{nfcId}</p>
              </div>
              <button onClick={genererNfc} disabled={generatingNfc}
                className="text-[13px] font-medium px-4 py-2 rounded-xl"
                style={{ background: "rgba(255,59,48,0.08)", color: "#FF3B30" }}>
                {generatingNfc ? "Génération…" : "Régénérer (désactive l'ancien)"}
              </button>
            </>
          ) : (
            <button onClick={genererNfc} disabled={generatingNfc}
              className="w-full py-3.5 rounded-2xl text-[15px] font-medium text-white"
              style={{ background: "var(--accent)" }}>
              {generatingNfc ? "Génération…" : "Générer mon identifiant NFC"}
            </button>
          )}
        </Section>

        <button onClick={sauvegarder} disabled={saving}
          className="w-full py-4 rounded-2xl text-[16px] font-semibold text-white transition-all duration-300"
          style={{ background: saved ? "#34C759" : "var(--accent)" }}>
          {saving ? "Sauvegarde…" : saved ? "Sauvegardé" : "Sauvegarder"}
        </button>
      </div>
    </div>
  );
}
