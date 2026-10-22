"use client";

import { useAuth } from "@/lib/auth-context";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { collection, onSnapshot, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Link from "next/link";
import { Icons } from "@/components/dashboard/icons";
import { useLang } from "@/lib/lang-context";

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
  top_client: TopClient | null;
  taux_fidelite: number;
  nouvelles_semaine: number;
  proches_recompense: number;
  anniversaires_today: number;
  inactifs_30j: number;
};

function HeroRing({ value, ratio }: { value: number; ratio: number }) {
  const animated = useCountUp(value);
  const [filled, setFilled] = useState(0);
  useEffect(() => {
    const id = setTimeout(() => setFilled(ratio), 120);
    return () => clearTimeout(id);
  }, [ratio]);
  const r = 52, circ = 2 * Math.PI * r;
  return (
    <div style={{ position: "relative", width: 140, height: 140, flexShrink: 0 }}>
      <svg width="140" height="140" style={{ transform: "rotate(-90deg)", position: "absolute", inset: 0 }}>
        <circle cx="70" cy="70" r={r} fill="none" stroke="rgba(0,122,255,0.12)" strokeWidth="8" />
        <circle cx="70" cy="70" r={r} fill="none" stroke="#007AFF" strokeWidth="8"
          strokeDasharray={circ} strokeDashoffset={circ * (1 - filled)}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.9s cubic-bezier(0.34,1.05,0.64,1)" }} />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontSize: 40, fontWeight: 800, color: "#007AFF", lineHeight: 1, letterSpacing: -1 }}>{fmt(animated)}</span>
        <span style={{ fontSize: 10, fontWeight: 600, color: "rgba(0,122,255,0.6)", textTransform: "uppercase", letterSpacing: "0.12em", marginTop: 3 }}>
          Aujourd&apos;hui
        </span>
      </div>
    </div>
  );
}

function MiniStat({ value, label, color, trend }: { value: number; label: string; color: string; trend?: string }) {
  const animated = useCountUp(value);
  return (
    <div style={{ background: "var(--glass-bg)", border: "1px solid var(--border)", borderRadius: 20, padding: "16px 18px" }}>
      <p style={{ fontSize: 28, fontWeight: 800, color, lineHeight: 1, letterSpacing: -0.5 }}>{fmt(animated)}</p>
      <p style={{ fontSize: 10, fontWeight: 600, color: "var(--fg-tertiary)", textTransform: "uppercase", letterSpacing: "0.08em", marginTop: 6 }}>{label}</p>
      {trend && <p style={{ fontSize: 11, color: "var(--fg-tertiary)", marginTop: 3 }}>{trend}</p>}
    </div>
  );
}

export default function AccueilPage() {
  const { user, marchand, loading } = useAuth();
  const { t } = useLang();
  const router = useRouter();
  const [tooltipBar, setTooltipBar] = useState<number | null>(null);
  const [stats, setStats] = useState<Stats>({
    total: 0, aujourd_hui: 0, tampons_total: 0, ce_mois: 0,
    semaine: [0,0,0,0,0,0,0], semaine_precedente: [0,0,0,0,0,0,0],
    recompenses: 0, top_client: null,
    taux_fidelite: 0, nouvelles_semaine: 0, proches_recompense: 0,
    anniversaires_today: 0, inactifs_30j: 0,
  });
  const [membres, setMembres] = useState<MembreEquipe[]>([]);

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

      let aujourd_hui = 0, tampons_total = 0, ce_mois = 0, recompenses = 0;
      let fideles = 0, nouvelles_semaine = 0, proches_recompense = 0;
      let anniversaires_today = 0, inactifs_30j = 0;
      const semaine = [0,0,0,0,0,0,0];
      const semaine_precedente = [0,0,0,0,0,0,0];
      let top_client: TopClient | null = null;

      snap.docs.forEach(d => {
        const data = d.data();
        const tp = data.tampons || 0;
        tampons_total += tp;
        if (data.recompense_en_attente) recompenses++;
        if (tp >= 2) fideles++;
        const pv = data.paliers_valides as boolean[] | undefined;
        const paliersDef = marchandPaliersRef.current;
        const enProgressif = marchandModeRef.current === "progressif" && paliersDef.length > 0;
        const prochainObjectif = enProgressif
          ? (paliersDef.find((p, i) => !(pv?.[i])) ?? paliersDef[paliersDef.length - 1]).tampons
          : objectif;
        if (tp >= prochainObjectif - 2 && tp < prochainObjectif) proches_recompense++;
        if (!top_client || tp > top_client.tampons) {
          top_client = { prenom: data.prenom || "", nom: data.nom || "", tampons: tp, id: d.id };
        }
        const dv = (data.derniere_visite?.seconds || 0) * 1000;
        const di = (data.date_inscription?.seconds || 0) * 1000;
        if (dv >= today.getTime()) aujourd_hui++;
        if (dv >= moisDebut.getTime()) ce_mois++;
        if (di >= semaineDebut.getTime()) nouvelles_semaine++;
        if (dv > 0 && dv < trenteJoursAgo.getTime()) inactifs_30j++;
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
      setStats({ total, aujourd_hui, tampons_total, ce_mois, semaine, semaine_precedente, recompenses, top_client, taux_fidelite, nouvelles_semaine, proches_recompense, anniversaires_today, inactifs_30j });
    }, err => console.error("[dashboard] Firestore error:", err.code, err.message));
    return unsub;
  }, [user]);

  if (!user || !marchand) { if (!loading) router.replace("/choisir"); }

  if (loading || !marchand) return (
    <div className="px-5 md:px-8 pt-8 pb-44 max-w-5xl">
      <div className="shimmer h-5 w-28 rounded-xl mb-2" />
      <div className="shimmer h-8 w-40 rounded-xl mb-8" />
      <div className="shimmer rounded-2xl mb-3" style={{ height: 56 }} />
      <div className="shimmer rounded-2xl mb-4" style={{ height: 180 }} />
      <div className="grid grid-cols-2 gap-3 mb-3">
        {[...Array(4)].map((_, i) => <div key={i} className="shimmer rounded-2xl" style={{ height: 90 }} />)}
      </div>
      <div className="shimmer rounded-2xl" style={{ height: 160 }} />
    </div>
  );

  const maxSemaine = Math.max(...stats.semaine, 1);
  const totalSemaine = stats.semaine.reduce((a, b) => a + b, 0);
  const totalPrecedente = stats.semaine_precedente.reduce((a, b) => a + b, 0);
  const tendance = totalPrecedente > 0
    ? Math.round(((totalSemaine - totalPrecedente) / totalPrecedente) * 100)
    : null;

  const m = marchand as Record<string, unknown>;
  const doubleFin = m.double_tampons_fin as string | undefined;
  const doubleActif = doubleFin ? new Date(doubleFin) > new Date() : false;
  const heroRatio = Math.min(stats.aujourd_hui / Math.max(maxSemaine, 1), 1);

  const getBarDate = (i: number) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "short" });
  };

  const rewardName = (() => {
    const paliers = (m?.paliers as { tampons: number; recompense: string }[]) || [];
    if (m?.mode_recompense === "progressif" && paliers.length > 0) return paliers[0].recompense || t.dash_rewards;
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
      text: `${stats.inactifs_30j} client${stats.inactifs_30j > 1 ? "s inactifs" : " inactif"} depuis +30 jours`,
      sub: "Envoyer une relance",
      color: "#FF3B30",
      href: "/dashboard/notifications",
    });
  }

  return (
    <div className="px-5 md:px-8 lg:px-10 pt-8 lg:pt-10 pb-28 md:pb-10 max-w-5xl">

      {/* Header */}
      <div className="mb-5 flex items-center gap-4">
        <div className="w-14 h-14 rounded-[18px] flex-shrink-0 overflow-hidden flex items-center justify-center"
          style={{ background: "var(--glass-bg)", boxShadow: "var(--shadow-sm)", border: "1px solid var(--border)" }}>
          {m.logo_url
            // eslint-disable-next-line @next/next/no-img-element
            ? <img src={m.logo_url as string} alt="" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
            : <span className="text-[24px] font-bold" style={{ color: "var(--accent)" }}>{(marchand.nom?.[0] || "?").toUpperCase()}</span>
          }
        </div>
        <div>
          <p className="text-[13px] font-medium" style={{ color: "var(--fg-tertiary)" }}>
            {new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}
          </p>
          <h1 className="text-[22px] lg:text-[26px] font-bold tracking-[-0.6px] leading-tight" style={{ color: "var(--fg)" }}>
            Bonjour, {marchand.nom}
          </h1>
          {stats.anniversaires_today > 0 && (
            <p className="text-[12px] mt-0.5 font-medium" style={{ color: "#FF9F0A" }}>
              {`${stats.anniversaires_today} anniversaire${stats.anniversaires_today > 1 ? "s" : ""} aujourd'hui`}
            </p>
          )}
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

      {/* Scanner CTA — pleine largeur */}
      <Link href="/dashboard/scanner"
        className="flex items-center justify-between rounded-2xl p-5 mb-5 transition-all hover:opacity-90 active:scale-[0.98]"
        style={{ background: "linear-gradient(135deg,#007AFF,#8B5CF6)", boxShadow: "0 8px 30px rgba(0,122,255,0.35)" }}>
        <div>
          <p className="text-[17px] font-bold tracking-[-0.3px]" style={{ color: "white" }}>Scanner une carte</p>
          <p className="text-[13px] mt-0.5" style={{ color: "rgba(255,255,255,0.6)" }}>Ajouter un tampon client</p>
        </div>
        <div className="w-11 h-11 rounded-xl flex items-center justify-center"
          style={{ background: "rgba(255,255,255,0.18)", color: "white" }}>
          <Icons.Scan size={20} />
        </div>
      </Link>

      {/* Hero Aujourd'hui + stats 2×2 */}
      <div className="flex flex-col lg:flex-row gap-4 mb-4">

        <div className="rounded-2xl p-5 flex items-center gap-5"
          style={{ background: "var(--glass-bg)", border: "1px solid var(--border)" }}>
          <HeroRing value={stats.aujourd_hui} ratio={heroRatio} />
          <div>
            {stats.aujourd_hui === 0 ? (
              <>
                <p className="text-[15px] font-semibold" style={{ color: "var(--fg)" }}>Premier scan du jour ?</p>
                <p className="text-[12px] mt-1.5" style={{ color: "var(--fg-tertiary)" }}>Appuyez sur Scanner ci-dessus</p>
              </>
            ) : (
              <>
                <p className="text-[13px] font-medium" style={{ color: "var(--fg-secondary)" }}>
                  client{stats.aujourd_hui > 1 ? "s" : ""} visité{stats.aujourd_hui > 1 ? "s" : ""}
                </p>
                {tendance !== null && (
                  <span className="inline-block text-[12px] font-semibold px-2.5 py-0.5 rounded-full mt-2"
                    style={{
                      background: tendance >= 0 ? "rgba(0,122,255,0.10)" : "rgba(255,59,48,0.10)",
                      color: tendance >= 0 ? "#007AFF" : "#FF3B30",
                    }}>
                    {tendance >= 0 ? "+" : ""}{tendance}% {t.dash_vs_prev}
                  </span>
                )}
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 flex-1">
          <MiniStat value={stats.ce_mois} label={t.dash_this_month} color="#8B5CF6" />
          <MiniStat value={stats.total} label={t.dash_total_clients} color="#34C759"
            trend={stats.nouvelles_semaine > 0 ? `+${stats.nouvelles_semaine} cette semaine` : undefined} />
          <MiniStat value={stats.tampons_total} label={t.dash_stamps} color="#FF9F0A"
            trend={totalSemaine > 0 ? `${totalSemaine} cette semaine` : undefined} />
          <MiniStat value={stats.recompenses} label={t.dash_rewards}
            color={stats.recompenses > 0 ? "#FFD60A" : "var(--fg-tertiary)"}
            trend={stats.recompenses > 0 ? "en attente" : undefined} />
        </div>
      </div>

      {/* Chart 7 jours */}
      <div className="rounded-2xl p-5 mb-4" style={{ background: "var(--glass-bg)", boxShadow: "var(--shadow-sm)" }}>
        <div className="flex items-center justify-between mb-4">
          <p className="text-[13px] font-semibold" style={{ color: "var(--fg)" }}>{t.dash_activity}</p>
          {tendance !== null && (
            <span className="text-[12px] font-semibold px-2.5 py-1 rounded-full"
              style={{
                background: tendance >= 0 ? "rgba(0,122,255,0.10)" : "rgba(255,59,48,0.10)",
                color: tendance >= 0 ? "#007AFF" : "#FF3B30",
              }}>
              {tendance >= 0 ? "+" : ""}{tendance}% {t.dash_vs_prev}
            </span>
          )}
        </div>

        {tooltipBar !== null && (
          <div className="mb-3 px-3 py-2 rounded-xl" style={{ background: "var(--border)" }}>
            <span className="text-[12px] font-semibold" style={{ color: "var(--fg)" }}>
              {getBarDate(tooltipBar)}
            </span>
            <span className="text-[12px]" style={{ color: "var(--fg-secondary)" }}>
              {" — "}{stats.semaine[tooltipBar]} visite{stats.semaine[tooltipBar] !== 1 ? "s" : ""}
              {stats.semaine_precedente[tooltipBar] > 0 && ` · sem. préc. : ${stats.semaine_precedente[tooltipBar]}`}
            </span>
          </div>
        )}

        <div className="flex items-end gap-2" style={{ height: 80 }}>
          {stats.semaine.map((val, i) => {
            const isToday = i === 6;
            const prevVal = stats.semaine_precedente[i];
            const prevH = Math.max((prevVal / maxSemaine) * 60, prevVal > 0 ? 5 : 0);
            const curH = Math.max((val / maxSemaine) * 60, val > 0 ? 6 : 2);
            const sel = tooltipBar === i;
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-1.5"
                onClick={() => setTooltipBar(sel ? null : i)}
                style={{ cursor: "pointer", userSelect: "none" }}>
                {val > 0 && (
                  <span className="text-[10px] font-semibold"
                    style={{ color: isToday ? "#007AFF" : "var(--fg-tertiary)" }}>{val}</span>
                )}
                <div className="w-full relative" style={{ height: 60 }}>
                  {prevH > 0 && (
                    <div className="absolute bottom-0 w-full rounded-t"
                      style={{ height: prevH, background: "var(--border)" }} />
                  )}
                  <div className="absolute bottom-0 w-full rounded-t transition-all duration-500"
                    style={{
                      height: curH,
                      background: isToday
                        ? "linear-gradient(to top, rgba(0,122,255,0.45), #007AFF)"
                        : "linear-gradient(to top, rgba(0,122,255,0.15), rgba(0,122,255,0.5))",
                      outline: sel ? "2px solid rgba(0,122,255,0.45)" : "none",
                      outlineOffset: 1,
                    }} />
                </div>
                <span className="text-[10px] font-medium" style={{ color: isToday ? "#007AFF" : "var(--fg-tertiary)" }}>
                  {t.dash_days[i]}
                </span>
              </div>
            );
          })}
        </div>

        {totalPrecedente > 0 && (
          <div className="flex items-center gap-4 mt-4">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-2.5 rounded-sm" style={{ background: "linear-gradient(to top, rgba(0,122,255,0.45), #007AFF)" }} />
              <span className="text-[11px]" style={{ color: "var(--fg-tertiary)" }}>Cette semaine</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-2.5 rounded-sm" style={{ background: "var(--border)" }} />
              <span className="text-[11px]" style={{ color: "var(--fg-tertiary)" }}>Semaine préc.</span>
            </div>
          </div>
        )}
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
                  style={{ background: `${todo.color}22`, color: todo.color }}>
                  {todo.type === "birthday" && (
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                    </svg>
                  )}
                  {todo.type === "reward" && (
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/>
                    </svg>
                  )}
                  {todo.type === "inactive" && (
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
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

      {/* Analytique — Taux de retour + Nouvelles inscriptions */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="rounded-2xl p-4" style={{ background: "var(--glass-bg)", boxShadow: "var(--shadow-sm)" }}>
          <p className="text-[11px] font-semibold uppercase tracking-widest mb-2" style={{ color: "var(--fg-tertiary)" }}>
            Taux de retour
          </p>
          <p className="text-[28px] font-bold tracking-tight leading-none"
            style={{ color: stats.taux_fidelite > 0 ? "#34C759" : "var(--fg-tertiary)" }}>
            {stats.taux_fidelite}<span className="text-[16px] font-normal">%</span>
          </p>
          <div className="h-1.5 rounded-full overflow-hidden mt-2" style={{ background: "var(--border)" }}>
            <div className="h-full rounded-full transition-all duration-700"
              style={{ width: `${stats.taux_fidelite}%`, background: "#34C759" }} />
          </div>
          <p className="text-[11px] mt-1.5" style={{ color: "var(--fg-tertiary)" }}>{t.dash_returned}</p>
        </div>

        <div className="rounded-2xl p-4" style={{ background: "var(--glass-bg)", boxShadow: "var(--shadow-sm)" }}>
          <div className="flex items-center justify-between mb-2">
            <p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: "var(--fg-tertiary)" }}>
              {t.dash_new_label}
            </p>
            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full"
              style={{ background: "rgba(0,122,255,0.10)", color: "#007AFF" }}>7j</span>
          </div>
          <p className="text-[28px] font-bold tracking-tight leading-none"
            style={{ color: stats.nouvelles_semaine > 0 ? "#007AFF" : "var(--fg-tertiary)" }}>
            {stats.nouvelles_semaine > 0 ? `+${stats.nouvelles_semaine}` : "0"}
          </p>
          <p className="text-[11px] mt-2.5" style={{ color: "var(--fg-tertiary)" }}>{t.dash_today} — 7j</p>
        </div>
      </div>

      {/* Bottom row — top client + voir tous */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {stats.top_client && stats.top_client.tampons > 0 ? (
          <Link href="/dashboard/clients"
            className="flex items-center gap-4 p-4 rounded-2xl transition-all hover:opacity-80"
            style={{ background: "var(--glass-bg)", boxShadow: "var(--shadow-sm)" }}>
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-[15px] flex-shrink-0 text-white"
              style={{ background: "linear-gradient(135deg,#FFD700,#FF9F0A)" }}>
              {(stats.top_client.prenom[0] || "?").toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1 mb-0.5">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="#FF9F0A">
                  <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/>
                </svg>
                <p className="text-[11px] font-semibold" style={{ color: "#FF9F0A" }}>{t.dash_best_clients}</p>
              </div>
              <p className="text-[14px] font-medium truncate" style={{ color: "var(--fg)" }}>
                {stats.top_client.prenom} {stats.top_client.nom}
              </p>
              <p className="text-[12px]" style={{ color: "var(--fg-tertiary)" }}>
                {stats.top_client.tampons} tampon{stats.top_client.tampons > 1 ? "s" : ""}
              </p>
            </div>
            <Icons.ChevronRight />
          </Link>
        ) : (
          <div className="p-4 rounded-2xl" style={{ background: "var(--glass-bg)", boxShadow: "var(--shadow-sm)" }}>
            <p className="text-[13px]" style={{ color: "var(--fg-tertiary)" }}>{t.clients_empty}</p>
          </div>
        )}

        <Link href="/dashboard/clients"
          className="flex items-center justify-between p-4 rounded-2xl transition-all hover:opacity-80"
          style={{ background: "var(--glass-bg)", boxShadow: "var(--shadow-sm)" }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: "rgba(0,122,255,0.1)", color: "var(--accent)" }}>
              <Icons.Users size={16} />
            </div>
            <div>
              <p className="text-[14px] font-medium" style={{ color: "var(--fg)" }}>{t.clients_title}</p>
              <p className="text-[12px]" style={{ color: "var(--fg-tertiary)" }}>{stats.total}</p>
            </div>
          </div>
          <Icons.ChevronRight />
        </Link>
      </div>

      {/* Carte Équipe */}
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
  );
}
