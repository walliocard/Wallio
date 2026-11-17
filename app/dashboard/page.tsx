"use client";

import { useAuth } from "@/lib/auth-context";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { getDocs } from "firebase/firestore";
import Link from "next/link";
import { Icons } from "@/components/dashboard/icons";
import { useLang } from "@/lib/lang-context";
import CompactHeader from "@/components/dashboard/CompactHeader";

function useCountUp(target: number, duration = 700) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (target === 0) { setVal(0); return; }
    let cur = 0;
    const step = Math.max(1, Math.floor(target / (duration / 16)));
    const timer = setInterval(() => {
      cur = Math.min(cur + step, target);
      setVal(cur);
      if (cur >= target) clearInterval(timer);
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration]);
  return val;
}

function fmt(n: number) { return n.toLocaleString("fr-FR"); }

type TopClient = { prenom: string; nom: string; tampons: number; id: string };
type MembreEquipe = {
  id: string; prenom: string; statut: string;
  scans_today?: number; scans_total?: number;
  scans_today_date?: string; scans_manual_today?: number;
};

type Stats = {
  total: number;
  aujourd_hui: number;
  tampons_total: number;
  ce_mois: number;
  semaine: number[];
  semaine_precedente: number[];
  recompenses: number;
  choix_en_attente: number;
  top_client: TopClient | null;
  taux_fidelite: number;
  nouvelles_semaine: number;
  proches_recompense: number;
  anniversaires_today: number;
  inactifs_30j: number;
  lastScanBeforeToday: Date | null;
};

// ── Carte héros ────────────────────────────────────────────────────────────────

function HeroCard({
  aujourd_hui, semaine, maxSemaine, hierDiff, lastScanBeforeToday, days,
}: {
  aujourd_hui: number; semaine: number[]; maxSemaine: number;
  hierDiff: number; lastScanBeforeToday: Date | null; days: string[];
}) {
  const animated = useCountUp(aujourd_hui);
  return (
    <div style={{
      borderRadius: 24, padding: "22px 22px 18px", marginBottom: 16,
      background: "linear-gradient(135deg, #2F7BFF 0%, #8B5CF6 100%)",
      boxShadow: "0 12px 30px rgba(91,92,240,0.28)",
      position: "relative", overflow: "hidden", minHeight: 220,
    }}>
      {/* Halo haut-droite */}
      <div style={{
        position: "absolute", top: -60, right: -40,
        width: 200, height: 200, borderRadius: "50%",
        background: "rgba(255,255,255,0.15)", pointerEvents: "none",
      }} />

      <p style={{ color: "rgba(255,255,255,0.80)", fontSize: 15, marginBottom: 10, position: "relative" }}>
        Aujourd&apos;hui
      </p>

      <div style={{ position: "relative", marginBottom: 24 }}>
        {aujourd_hui === 0 && lastScanBeforeToday ? (
          <p style={{ color: "rgba(255,255,255,0.80)", fontSize: 15, fontWeight: 500 }}>
            Dernier scan{" "}
            {lastScanBeforeToday.toLocaleDateString("fr-FR", { weekday: "long" })}{" "}
            à{" "}
            {lastScanBeforeToday.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
          </p>
        ) : (
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <p style={{ color: "white", fontSize: 56, fontWeight: 800, lineHeight: 1, letterSpacing: -2, fontVariantNumeric: "tabular-nums", margin: 0 }}>
              {animated}
            </p>
            {aujourd_hui > 0 && (
              <span style={{ background: "rgba(255,255,255,0.20)", color: "white", padding: "4px 10px", borderRadius: 20, fontSize: 13, fontWeight: 600, flexShrink: 0 }}>
                {hierDiff >= 0 ? "+" : ""}{hierDiff} vs hier
              </span>
            )}
          </div>
        )}
      </div>

      {/* Graphique intégré */}
      <div style={{ display: "flex", alignItems: "flex-end", gap: 3, position: "relative" }}>
        {semaine.map((val, i) => {
          const isToday = i === 6;
          const h = Math.max((val / maxSemaine) * 36, val > 0 ? 4 : 2);
          return (
            <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <div style={{ width: "100%", height: 36, display: "flex", alignItems: "flex-end" }}>
                <div style={{
                  width: "100%", height: h, borderRadius: 3,
                  background: isToday ? "rgba(255,255,255,1)" : "rgba(255,255,255,0.35)",
                  transition: `height 0.4s cubic-bezier(0.34,1.06,0.64,1) ${i * 0.04}s`,
                }} />
              </div>
              <span style={{ color: "rgba(255,255,255,0.70)", fontSize: 10, fontWeight: 500 }}>
                {days[i]}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Tuile statistique compacte ─────────────────────────────────────────────────

function StatTile({ value, label, trend, icon }: { value: number; label: string; trend?: string; icon: React.ReactNode }) {
  const animated = useCountUp(value);
  return (
    <div style={{
      background: "var(--glass-bg)", border: "1px solid var(--border)",
      borderRadius: 20, padding: "14px 14px",
      display: "flex", alignItems: "center", gap: 12,
      boxShadow: "var(--shadow-sm)",
    }}>
      <div style={{
        width: 36, height: 36, borderRadius: 10,
        background: "linear-gradient(135deg, #2F7BFF, #8B5CF6)",
        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
      }}>
        {icon}
      </div>
      <div style={{ minWidth: 0 }}>
        <p style={{ fontSize: 24, fontWeight: 700, color: "var(--fg)", lineHeight: 1, letterSpacing: -0.5, fontVariantNumeric: "tabular-nums", margin: 0 }}>
          {fmt(animated)}
        </p>
        <p style={{ fontSize: 13, color: "var(--fg-secondary)", margin: "3px 0 0" }}>{label}</p>
        {trend && (
          <span style={{ display: "inline-block", background: "var(--lavande)", color: "var(--lavande-fg)", padding: "2px 8px", borderRadius: 10, fontSize: 11, fontWeight: 500, marginTop: 4 }}>
            {trend}
          </span>
        )}
      </div>
    </div>
  );
}

// ── Icônes blanches pour tuiles ────────────────────────────────────────────────

const IcoCalendar = () => (
  <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
);
const IcoUsers = () => (
  <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);
const IcoStamp = () => (
  <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 22h14"/><path d="M9.7 17H5l-1-5h16l-1 5h-4.7"/><path d="M12 17v-6"/>
    <rect x="9" y="7" width="6" height="6" rx="1"/><path d="M9 7V5a3 3 0 0 1 6 0v2"/>
  </svg>
);
const IcoGift = () => (
  <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 12v10H4V12"/><path d="M22 7H2v5h20V7z"/><path d="M12 22V7"/>
    <path d="M12 7H7.5a2.5 2.5 0 010-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 000-5C13 2 12 7 12 7z"/>
  </svg>
);

// ── Page principale ────────────────────────────────────────────────────────────

export default function AccueilPage() {
  const { user, marchand, loading } = useAuth();
  const { t } = useLang();
  const router = useRouter();
  const titleRef = useRef<HTMLHeadingElement>(null);
  const [stats, setStats] = useState<Stats>({
    total: 0, aujourd_hui: 0, tampons_total: 0, ce_mois: 0,
    semaine: [0,0,0,0,0,0,0], semaine_precedente: [0,0,0,0,0,0,0],
    recompenses: 0, choix_en_attente: 0, top_client: null,
    taux_fidelite: 0, nouvelles_semaine: 0, proches_recompense: 0,
    anniversaires_today: 0, inactifs_30j: 0, lastScanBeforeToday: null,
  });
  const [membres, setMembres] = useState<MembreEquipe[]>([]);
  const [flexStats, setFlexStats] = useState<{ petit: number; grand: number; total: number } | null>(null);

  const objectifRef = useRef<number>(marchand?.objectif_tampons || 10);
  const marchandModeRef = useRef<string>("cyclique");
  const marchandPaliersRef = useRef<{ tampons: number; recompense: string }[]>([]);

  useEffect(() => {
    const mc = marchand as Record<string, unknown>;
    objectifRef.current = marchand?.objectif_tampons || 10;
    marchandModeRef.current = (mc?.mode_recompense as string) || "cyclique";
    marchandPaliersRef.current = (mc?.paliers as { tampons: number; recompense: string }[]) || [];
  }, [marchand]);

  useEffect(() => {
    if (!user) return;
    const mc = marchand as Record<string, unknown>;
    if (mc?.mode_recompense !== "flex") return;
    import("firebase/auth").then(({ getAuth }) => {
      getAuth().currentUser?.getIdToken().then(token => {
        fetch("/api/dashboard/flex-stats", { headers: { Authorization: `Bearer ${token}` } })
          .then(r => r.json())
          .then(d => { if (d.total !== undefined) setFlexStats(d); })
          .catch(() => {});
      });
    });
  }, [user, marchand]);

  useEffect(() => {
    if (!user || !(marchand as Record<string, unknown>)?.equipe_actif) return;
    getDocs(collection(db, "marchands", user.uid, "membres")).then(snap => {
      setMembres(snap.docs.map(d => {
        const data = d.data();
        return {
          id: d.id, prenom: data.prenom, statut: data.statut,
          scans_today: data.scans_today, scans_total: data.scans_total,
          scans_today_date: data.scans_today_date, scans_manual_today: data.scans_manual_today,
        };
      }));
    }).catch(() => {});
  }, [user, marchand]);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "clients"), where("marchand_id", "==", user.uid));
    const unsub = onSnapshot(q, snap => {
      const now = new Date();
      const today = new Date(now); today.setHours(0, 0, 0, 0);
      const moisDebut = new Date(now.getFullYear(), now.getMonth(), 1);
      const semaineDebut = new Date(today); semaineDebut.setDate(semaineDebut.getDate() - 7);
      const trenteJoursAgo = new Date(today); trenteJoursAgo.setDate(trenteJoursAgo.getDate() - 30);
      const objectif = objectifRef.current;
      const todayMonth = today.getMonth() + 1;
      const todayDay = today.getDate();

      let aujourd_hui = 0, tampons_total = 0, ce_mois = 0, recompenses = 0, choix_en_attente = 0;
      let fideles = 0, nouvelles_semaine = 0, proches_recompense = 0;
      let anniversaires_today = 0, inactifs_30j = 0;
      const semaine = [0,0,0,0,0,0,0];
      const semaine_precedente = [0,0,0,0,0,0,0];
      let top_client: TopClient | null = null;
      let lastScanBeforeToday: Date | null = null;

      snap.docs.forEach(d => {
        const data = d.data();
        const tp = data.tampons || 0;
        tampons_total += tp;
        if (data.recompense_en_attente) recompenses++;
        if (data.choix_en_attente) choix_en_attente++;
        if (tp >= 2) fideles++;
        const pv = data.paliers_valides as boolean[] | undefined;
        const paliersDef = marchandPaliersRef.current;
        const enProgressif = marchandModeRef.current === "progressif" && paliersDef.length > 0;
        const prochainObjectif = enProgressif
          ? (paliersDef.find((p, i) => !(pv?.[i])) ?? paliersDef[paliersDef.length - 1]).tampons
          : objectif;
        if (tp === prochainObjectif - 1) proches_recompense++;
        if (!top_client || tp > top_client.tampons) {
          top_client = { prenom: data.prenom || "", nom: data.nom || "", tampons: tp, id: d.id };
        }
        const dv = (data.derniere_visite?.seconds || 0) * 1000;
        const di = (data.date_inscription?.seconds || 0) * 1000;
        if (dv >= today.getTime()) aujourd_hui++;
        if (dv >= moisDebut.getTime()) ce_mois++;
        if (di >= semaineDebut.getTime()) nouvelles_semaine++;
        if (dv > 0 && dv < today.getTime()) {
          if (!lastScanBeforeToday || dv > lastScanBeforeToday.getTime()) {
            lastScanBeforeToday = new Date(dv);
          }
        }
        if (dv > 0 && dv < trenteJoursAgo.getTime() && !data.relance_pending) inactifs_30j++;
        if (data.date_naissance) {
          const parts = (data.date_naissance as string).split("-");
          if (parts.length === 3 && parseInt(parts[1]) === todayMonth && parseInt(parts[2]) === todayDay) {
            anniversaires_today++;
          }
        }
        for (let i = 0; i < 7; i++) {
          const debut = new Date(today); debut.setDate(debut.getDate() - (6 - i));
          const fin = new Date(debut); fin.setDate(fin.getDate() + 1);
          if (dv >= debut.getTime() && dv < fin.getTime()) semaine[i]++;
        }
        for (let i = 0; i < 7; i++) {
          const debut = new Date(today); debut.setDate(debut.getDate() - (13 - i));
          const fin = new Date(debut); fin.setDate(fin.getDate() + 1);
          if (dv >= debut.getTime() && dv < fin.getTime()) semaine_precedente[i]++;
        }
      });

      const total = snap.size;
      const taux_fidelite = total > 0 ? Math.round((fideles / total) * 100) : 0;
      setStats({ total, aujourd_hui, tampons_total, ce_mois, semaine, semaine_precedente, recompenses, choix_en_attente, top_client, taux_fidelite, nouvelles_semaine, proches_recompense, anniversaires_today, inactifs_30j, lastScanBeforeToday });
    }, err => console.error("[dashboard] Firestore error:", err.code, err.message));
    return unsub;
  }, [user]);

  useEffect(() => {
    if (!loading && !user) router.replace("/choisir");
  }, [loading, user, router]);

  if (loading || !marchand) return (
    <div className="px-5 md:px-8 pt-8 pb-44 max-w-5xl">
      <div className="shimmer h-5 w-28 rounded-xl mb-2" />
      <div className="shimmer h-8 w-40 rounded-xl mb-8" />
      <div className="shimmer rounded-2xl mb-3" style={{ height: 56 }} />
      <div className="shimmer rounded-2xl mb-4" style={{ height: 220 }} />
      <div className="grid grid-cols-2 gap-3 mb-3">
        {[...Array(4)].map((_, i) => <div key={i} className="shimmer rounded-2xl" style={{ height: 90 }} />)}
      </div>
    </div>
  );

  const maxSemaine = Math.max(...stats.semaine, 1);
  const totalSemaine = stats.semaine.reduce((a, b) => a + b, 0);
  const totalPrecedente = stats.semaine_precedente.reduce((a, b) => a + b, 0);
  const tendance = totalPrecedente > 0
    ? Math.round(((totalSemaine - totalPrecedente) / totalPrecedente) * 100)
    : null;
  const hierDiff = stats.semaine[6] - stats.semaine[5];

  const m = marchand as Record<string, unknown>;
  const doubleFin = m.double_tampons_fin as string | undefined;
  const doubleActif = doubleFin ? new Date(doubleFin) > new Date() : false;

  const rewardName = (() => {
    const paliers = (m?.paliers as { tampons: number; recompense: string }[]) || [];
    if (m?.mode_recompense === "progressif" && paliers.length > 0) return paliers[0].recompense || t.dash_rewards;
    if (m?.mode_recompense === "flex") return (m?.nom_recompense_petit as string) || t.dash_rewards;
    return marchand?.nom_recompense || t.dash_rewards;
  })();

  type TodoType = "birthday" | "reward" | "inactive";
  const todos: { type: TodoType; text: string; sub?: string; color: string; href: string }[] = [];
  if (stats.anniversaires_today > 0) {
    todos.push({
      type: "birthday",
      text: stats.anniversaires_today > 1
        ? `${stats.anniversaires_today} clients fêtent leur anniversaire aujourd'hui`
        : `1 client fête son anniversaire aujourd'hui`,
      color: "#FF9F0A",
      href: "/dashboard/clients",
    });
  }
  if (stats.proches_recompense > 0) {
    todos.push({
      type: "reward",
      text: `${stats.proches_recompense} client${stats.proches_recompense > 1 ? "s proches" : " proche"} d'une récompense`,
      sub: rewardName,
      color: "#8B5CF6",
      href: "/dashboard/clients",
    });
  }
  if (stats.inactifs_30j > 0) {
    todos.push({
      type: "inactive",
      text: `${stats.inactifs_30j} client${stats.inactifs_30j > 1 ? "s à relancer" : " à relancer"}`,
      sub: "Envoyer un message de relance",
      color: "var(--lavande-fg)",
      href: "/dashboard/notifications",
    });
  }

  const encouragement = (() => {
    if (tendance !== null && tendance > 0)
      return { text: `+${tendance}% cette semaine, beau travail !`, color: "#007AFF" };
    if (stats.aujourd_hui > 0)
      return { text: `${stats.aujourd_hui} client${stats.aujourd_hui > 1 ? "s" : ""} visité${stats.aujourd_hui > 1 ? "s" : ""} aujourd'hui`, color: "#34C759" };
    if (stats.nouvelles_semaine > 0)
      return { text: `+${stats.nouvelles_semaine} nouveau${stats.nouvelles_semaine > 1 ? "x" : ""} client${stats.nouvelles_semaine > 1 ? "s" : ""} cette semaine`, color: "#34C759" };
    if (stats.total > 0)
      return { text: `${stats.total} client${stats.total > 1 ? "s" : ""} vous font confiance`, color: "#8B5CF6" };
    return null;
  })();

  const heure = new Date().getHours();
  const salut = heure < 18 ? "Bonjour" : "Bonsoir";

  return (
    <div>
      <CompactHeader title="Accueil" observeRef={titleRef} />
      <div className="relative px-5 md:px-8 lg:px-10 pb-36 md:pb-10 max-w-5xl" style={{ paddingTop: "calc(env(safe-area-inset-top) + 24px)" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 28 }}>
        <div style={{ width: 48, height: 48, borderRadius: 14, background: "var(--glass-bg)", border: "1px solid var(--border)", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          {m.logo_url
            // eslint-disable-next-line @next/next/no-img-element
            ? <img src={m.logo_url as string} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            : <span style={{ fontSize: 20, fontWeight: 700, color: "var(--accent)" }}>{(marchand.nom?.[0] || "?").toUpperCase()}</span>
          }
        </div>
        <div>
          <p style={{ fontSize: 13, color: "var(--fg-tertiary)", marginBottom: 2 }}>
            {salut} · {new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}
          </p>
          <h1 ref={titleRef} style={{ fontSize: 28, fontWeight: 700, color: "var(--fg)", letterSpacing: -0.5, lineHeight: 1.15, margin: 0 }}>
            {marchand.nom}
          </h1>
        </div>
      </div>

      {/* Alerte récompenses en attente */}
      {stats.recompenses > 0 && (
        <Link href="/dashboard/clients" className="flex items-center gap-3 rounded-2xl p-4 mb-3 transition-all hover:opacity-90"
          style={{ background: "rgba(255,159,10,0.10)", border: "1px solid rgba(255,159,10,0.30)" }}>
          <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "rgba(255,159,10,0.18)" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FF9F0A" strokeWidth="1.8" strokeLinecap="round">
              <path d="M20 12v10H4V12"/><path d="M22 7H2v5h20V7z"/><path d="M12 22V7"/>
              <path d="M12 7H7.5a2.5 2.5 0 010-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 000-5C13 2 12 7 12 7z"/>
            </svg>
          </div>
          <div className="flex-1">
            <p className="text-[14px] font-semibold" style={{ color: "#FF9F0A" }}>
              {stats.recompenses} {t.dash_pending_rewards}
            </p>
            <p className="text-[12px]" style={{ color: "var(--fg-secondary)" }}>{t.dash_clients_reached}</p>
          </div>
          <Icons.ChevronRight />
        </Link>
      )}

      {/* Alerte choix en attente (mode Flex) */}
      {stats.choix_en_attente > 0 && (
        <Link href="/dashboard/clients" className="flex items-center gap-3 rounded-2xl p-4 mb-3 transition-all hover:opacity-90"
          style={{ background: "rgba(0,122,255,0.08)", border: "1px solid rgba(0,122,255,0.22)" }}>
          <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "rgba(0,122,255,0.15)" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" stroke="#007AFF">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
          </div>
          <div className="flex-1">
            <p className="text-[14px] font-semibold" style={{ color: "var(--accent)" }}>
              {stats.choix_en_attente} choix en attente
            </p>
            <p className="text-[12px]" style={{ color: "var(--fg-secondary)" }}>Des clients doivent encore choisir leur récompense</p>
          </div>
          <Icons.ChevronRight />
        </Link>
      )}

      {/* Bandeau double tampons */}
      {doubleActif && (
        <div className="flex items-center gap-3 rounded-2xl p-4 mb-3"
          style={{ background: "linear-gradient(135deg,rgba(0,122,255,0.10),rgba(139,92,246,0.10))", border: "1px solid rgba(139,92,246,0.25)" }}>
          <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "var(--wallio-gradient)" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
            </svg>
          </div>
          <div className="flex-1">
            <p className="text-[14px] font-semibold" style={{ background: "var(--wallio-gradient)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              {t.dash_double_stamps}
            </p>
            <p className="text-[12px]" style={{ color: "var(--fg-secondary)" }}>{new Date(doubleFin!).toLocaleDateString()}</p>
          </div>
        </div>
      )}

      {/* Carte héros Aujourd'hui */}
      <HeroCard
        aujourd_hui={stats.aujourd_hui}
        semaine={stats.semaine}
        maxSemaine={maxSemaine}
        hierDiff={hierDiff}
        lastScanBeforeToday={stats.lastScanBeforeToday}
        days={t.dash_days}
      />

      {/* Stats 2×2 compactes */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
        <StatTile value={stats.ce_mois} label="Visites ce mois" icon={<IcoCalendar />} />
        <StatTile
          value={stats.total}
          label="Clients"
          trend={stats.nouvelles_semaine > 0 ? `+${stats.nouvelles_semaine} cette semaine` : undefined}
          icon={<IcoUsers />}
        />
        <StatTile
          value={stats.tampons_total}
          label="Tampons"
          trend={totalSemaine > 0 ? `${totalSemaine} cette semaine` : undefined}
          icon={<IcoStamp />}
        />
        <StatTile
          value={stats.recompenses}
          label="Récompenses"
          trend={stats.recompenses > 0 ? "en attente" : undefined}
          icon={<IcoGift />}
        />
      </div>

      {/* Section À faire */}
      {todos.length > 0 && (
        <div className="rounded-2xl p-4 mb-4" style={{ background: "var(--glass-bg)", boxShadow: "var(--shadow-sm)" }}>
          <p className="text-[11px] font-semibold uppercase tracking-widest mb-3" style={{ color: "var(--fg-tertiary)" }}>
            À faire
          </p>
          <div className="space-y-2">
            {todos.map((todo, i) => (
              <Link key={i} href={todo.href}
                className="flex items-center gap-3 p-3 rounded-xl transition-all hover:opacity-90 active:scale-[0.98]"
                style={{ background: `${todo.color}12`, border: `1px solid ${todo.color}28` }}>
                <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{
                    background: todo.type === "birthday"
                      ? "#FF9F0A"
                      : "linear-gradient(135deg, #2F7BFF, #8B5CF6)",
                    flexShrink: 0,
                  }}>
                  {todo.type === "birthday" && (
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 12v10H4V12"/><path d="M22 7H2v5h20V7z"/><path d="M12 22V7"/>
                      <path d="M12 7H7.5a2.5 2.5 0 010-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 000-5C13 2 12 7 12 7z"/>
                    </svg>
                  )}
                  {todo.type === "reward" && (
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                    </svg>
                  )}
                  {todo.type === "inactive" && (
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                    </svg>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium leading-tight" style={{ color: "var(--fg)" }}>{todo.text}</p>
                  {todo.sub && <p className="text-[11px] mt-0.5" style={{ color: todo.color }}>{todo.sub}</p>}
                </div>
                <Icons.ChevronRight />
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Taux de retour */}
      {stats.total >= 5 ? (
        <div className="rounded-2xl p-4 mb-4" style={{ background: "var(--glass-bg)", boxShadow: "var(--shadow-sm)" }}>
          <p style={{ fontSize: 13, color: "var(--fg)", fontWeight: 500, marginBottom: 4 }}>
            {stats.taux_fidelite}% de tes clients ({Math.round(stats.total * stats.taux_fidelite / 100)}/{stats.total}) sont revenus au moins 2 fois
          </p>
          <div style={{ height: 6, borderRadius: 3, background: "var(--border)", overflow: "hidden", marginTop: 8 }}>
            <div style={{ height: "100%", borderRadius: 3, background: "linear-gradient(90deg, #2F7BFF, #8B5CF6)", width: `${stats.taux_fidelite}%`, transition: "width 0.7s ease" }} />
          </div>
        </div>
      ) : stats.total > 0 ? (
        <div className="rounded-2xl p-4 mb-4" style={{ background: "var(--glass-bg)", boxShadow: "var(--shadow-sm)" }}>
          <p style={{ fontSize: 13, color: "var(--fg-tertiary)" }}>
            Taux de fidélité disponible dès 5 clients — encore {5 - stats.total} à inviter
          </p>
        </div>
      ) : null}

      {/* Stats mode Flex */}
      {(m?.mode_recompense === "flex") && flexStats && flexStats.total > 0 && (
        <div className="rounded-2xl p-4 mb-4" style={{ background: "var(--glass-bg)", boxShadow: "var(--shadow-sm)" }}>
          <p className="text-[11px] font-semibold uppercase tracking-widest mb-3" style={{ color: "var(--fg-tertiary)" }}>
            Récompense Flex — Choix clients
          </p>
          <div className="flex items-end gap-4 mb-3">
            <div>
              <p className="text-[28px] font-bold tracking-tight leading-none" style={{ color: "var(--accent)" }}>
                {Math.round((flexStats.petit / flexStats.total) * 100)}<span className="text-[16px] font-normal">%</span>
              </p>
              <p className="text-[11px] mt-1" style={{ color: "var(--fg-tertiary)" }}>
                Petite récompense ({flexStats.petit})
              </p>
            </div>
            <div style={{ width: 1, height: 40, background: "var(--border)" }} />
            <div>
              <p className="text-[28px] font-bold tracking-tight leading-none" style={{ color: "#8B5CF6" }}>
                {Math.round((flexStats.grand / flexStats.total) * 100)}<span className="text-[16px] font-normal">%</span>
              </p>
              <p className="text-[11px] mt-1" style={{ color: "var(--fg-tertiary)" }}>
                Grande récompense ({flexStats.grand})
              </p>
            </div>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--border)" }}>
            <div className="h-full rounded-full"
              style={{ width: `${Math.round((flexStats.petit / flexStats.total) * 100)}%`, background: "linear-gradient(90deg,var(--accent),#8B5CF6)", transition: "width 0.7s ease" }} />
          </div>
          <p className="text-[11px] mt-1.5" style={{ color: "var(--fg-tertiary)" }}>{flexStats.total} choix enregistrés</p>
        </div>
      )}

      {/* Meilleur client */}
      {stats.top_client && stats.top_client.tampons > 0 && (
        <Link href="/dashboard/clients"
          className="flex items-center gap-4 p-4 rounded-2xl mb-4 transition-all hover:opacity-80"
          style={{ background: "var(--glass-bg)", boxShadow: "var(--shadow-sm)" }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: "var(--lavande)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 15, color: "var(--lavande-fg)", flexShrink: 0 }}>
            {(stats.top_client.prenom[0] || "?").toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p style={{ fontSize: 11, fontWeight: 600, color: "var(--fg-tertiary)", marginBottom: 2 }}>Meilleur client</p>
            <p style={{ fontSize: 14, fontWeight: 600, color: "var(--fg)" }}>
              {stats.top_client.prenom} {stats.top_client.nom}
            </p>
            <p style={{ fontSize: 12, color: "var(--fg-tertiary)" }}>
              {stats.top_client.tampons} tampon{stats.top_client.tampons > 1 ? "s" : ""}
            </p>
          </div>
          <Icons.ChevronRight />
        </Link>
      )}

      {/* Équipe */}
      {!!(marchand as Record<string, unknown>)?.equipe_actif && membres.length > 0 && (() => {
        const todayStr = new Date().toISOString().slice(0, 10);
        const actifs = membres.filter(mb => mb.statut === "actif");
        const totalAujourdhui = actifs.reduce((sum, mb) => sum + (mb.scans_today_date === todayStr ? (mb.scans_today ?? 0) : 0), 0);
        const maxScans = Math.max(...actifs.map(mb => mb.scans_today_date === todayStr ? (mb.scans_today ?? 0) : 0), 1);
        return (
          <div className="rounded-2xl p-5 mt-4" style={{ background: "var(--glass-bg)", boxShadow: "var(--shadow-sm)" }}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: "var(--fg-tertiary)" }}>Équipe — aujourd&apos;hui</p>
                <p className="text-[13px] mt-0.5" style={{ color: "var(--fg-secondary)" }}>
                  {totalAujourdhui} tampon{totalAujourdhui > 1 ? "s" : ""} ajouté{totalAujourdhui > 1 ? "s" : ""} au total
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Link href="/dashboard/historique" className="text-[12px] font-medium" style={{ color: "var(--fg-tertiary)" }}>Historique</Link>
                <Link href="/dashboard/reglages" className="text-[12px] font-medium" style={{ color: "var(--accent)" }}>Gérer →</Link>
              </div>
            </div>
            <div className="space-y-3">
              {actifs.map(mb => {
                const scans = mb.scans_today_date === todayStr ? (mb.scans_today ?? 0) : 0;
                const pct = maxScans > 0 ? (scans / maxScans) * 100 : 0;
                return (
                  <div key={mb.id} className="flex items-center gap-3">
                    <p className="text-[14px] font-medium w-20 flex-shrink-0 truncate" style={{ color: "var(--fg)" }}>{mb.prenom}</p>
                    <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "var(--border)" }}>
                      <div className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${pct}%`, background: "linear-gradient(90deg,#007AFF,#8B5CF6)" }} />
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <p className="text-[13px] font-semibold" style={{ color: scans > 0 ? "var(--fg)" : "var(--fg-tertiary)" }}>{scans}</p>
                      {(mb.scans_manual_today ?? 0) > 0 && mb.scans_today_date === todayStr && (
                        <p className="text-[10px]" style={{ color: "#FF9F0A" }}>{mb.scans_manual_today} manuel{(mb.scans_manual_today ?? 0) > 1 ? "s" : ""}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            {membres.some(mb => mb.statut !== "actif") && (
              <p className="text-[11px] mt-3" style={{ color: "var(--fg-tertiary)" }}>
                {membres.filter(mb => mb.statut !== "actif").map(mb => mb.prenom).join(", ")} — désactivé{membres.filter(mb => mb.statut !== "actif").length > 1 ? "s" : ""}
              </p>
            )}
          </div>
        );
      })()}
      </div>
    </div>
  );
}
