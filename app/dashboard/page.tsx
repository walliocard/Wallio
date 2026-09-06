"use client";

import { useAuth } from "@/lib/auth-context";
import { useEffect, useState } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Link from "next/link";
import { Icons } from "@/components/dashboard/icons";
import WallioIcon from "@/components/WallioIcon";

type TopClient = { prenom: string; nom: string; tampons: number; id: string };

type Stats = {
  total: number;
  aujourd_hui: number;
  tampons_total: number;
  ce_mois: number;
  semaine: number[];
  semaine_precedente: number[];
  recompenses: number;
  top_client: TopClient | null;
};

const JOURS = ["L", "M", "M", "J", "V", "S", "D"];

export default function AccueilPage() {
  const { user, marchand } = useAuth();
  const [stats, setStats] = useState<Stats>({
    total: 0, aujourd_hui: 0, tampons_total: 0, ce_mois: 0,
    semaine: [0,0,0,0,0,0,0], semaine_precedente: [0,0,0,0,0,0,0],
    recompenses: 0, top_client: null,
  });

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "clients"), where("marchand_id", "==", user.uid));
    const unsub = onSnapshot(q, snap => {
      const now = new Date();
      const today = new Date(now); today.setHours(0, 0, 0, 0);
      const moisDebut = new Date(now.getFullYear(), now.getMonth(), 1);
      let aujourd_hui = 0, tampons_total = 0, ce_mois = 0, recompenses = 0;
      const semaine = [0, 0, 0, 0, 0, 0, 0];
      const semaine_precedente = [0, 0, 0, 0, 0, 0, 0];
      let top_client: TopClient | null = null;

      snap.docs.forEach(d => {
        const data = d.data();
        const t = data.tampons || 0;
        tampons_total += t;
        if (data.recompense_en_attente) recompenses++;
        if (!top_client || t > top_client.tampons) {
          top_client = { prenom: data.prenom || "", nom: data.nom || "", tampons: t, id: d.id };
        }
        const dv = (data.derniere_visite?.seconds || 0) * 1000;
        if (dv >= today.getTime()) aujourd_hui++;
        if (dv >= moisDebut.getTime()) ce_mois++;
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
      setStats({ total: snap.size, aujourd_hui, tampons_total, ce_mois, semaine, semaine_precedente, recompenses, top_client });
    });
    return unsub;
  }, [user]);

  if (!marchand || !user) return null;

  const maxSemaine = Math.max(...stats.semaine, 1);
  const totalSemaine = stats.semaine.reduce((a, b) => a + b, 0);
  const totalPrecedente = stats.semaine_precedente.reduce((a, b) => a + b, 0);
  const tendance = totalPrecedente > 0
    ? Math.round(((totalSemaine - totalPrecedente) / totalPrecedente) * 100)
    : null;

  const m = marchand as Record<string, unknown>;

  const doubleFin = m.double_tampons_fin as string | undefined;
  const doubleActif = doubleFin ? new Date(doubleFin) > new Date() : false;

  const STAT_CARDS = [
    { label: "Aujourd'hui",   value: stats.aujourd_hui,  gradient: true },
    { label: "Ce mois",       value: stats.ce_mois,      color: "#34C759" },
    { label: "Total clients", value: stats.total,        color: "var(--fg)" },
    { label: "Tampons",       value: stats.tampons_total, color: "var(--fg)" },
    { label: "Récompenses",   value: stats.recompenses,  color: stats.recompenses > 0 ? "#FF9F0A" : "var(--fg-tertiary)" },
  ];

  return (
    <div className="px-5 md:px-8 lg:px-10 pt-8 lg:pt-10 pb-28 md:pb-10 max-w-5xl">

      {/* Header */}
      <div className="mb-8 flex items-center gap-4">
        <div className="w-14 h-14 rounded-[18px] flex-shrink-0 overflow-hidden flex items-center justify-center"
          style={{ background: "var(--glass-bg)", border: "1px solid var(--border)", boxShadow: "0 4px 16px rgba(0,0,0,0.07)" }}>
          {m.logo_url
            ? <img src={m.logo_url as string} alt="" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
            : <span className="text-[24px] font-bold" style={{ color: "var(--accent)" }}>
                {(marchand.nom?.[0] || "?").toUpperCase()}
              </span>
          }
        </div>
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <WallioIcon size={14} />
            <p className="text-[11px] font-bold uppercase tracking-[0.18em]" style={{ color: "var(--fg-tertiary)" }}>
              Wallio
            </p>
          </div>
          <h1 className="text-[22px] lg:text-[34px] font-bold tracking-[-0.8px] leading-none" style={{ color: "var(--fg)" }}>
            {marchand.nom}
          </h1>
        </div>
      </div>

      {/* Alerte récompenses en attente */}
      {stats.recompenses > 0 && (
        <Link href="/dashboard/clients" className="flex items-center gap-3 rounded-2xl p-4 mb-4 transition-all hover:opacity-90"
          style={{ background: "rgba(255,159,10,0.10)", border: "1px solid rgba(255,159,10,0.30)" }}>
          <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "rgba(255,159,10,0.18)" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FF9F0A" strokeWidth="1.8" strokeLinecap="round">
              <path d="M20 12v10H4V12"/><path d="M22 7H2v5h20V7z"/><path d="M12 22V7"/><path d="M12 7H7.5a2.5 2.5 0 010-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 000-5C13 2 12 7 12 7z"/>
            </svg>
          </div>
          <div className="flex-1">
            <p className="text-[14px] font-semibold" style={{ color: "#FF9F0A" }}>
              {stats.recompenses} récompense{stats.recompenses > 1 ? "s" : ""} en attente
            </p>
            <p className="text-[12px]" style={{ color: "var(--fg-secondary)" }}>
              Des clients ont atteint leur objectif — validez leurs récompenses
            </p>
          </div>
          <Icons.ChevronRight />
        </Link>
      )}

      {/* Bandeau double tampons */}
      {doubleActif && (
        <div className="flex items-center gap-3 rounded-2xl p-4 mb-4"
          style={{ background: "linear-gradient(135deg,rgba(0,122,255,0.10),rgba(139,92,246,0.10))", border: "1px solid rgba(139,92,246,0.25)" }}>
          <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: "var(--wallio-gradient)" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
            </svg>
          </div>
          <div className="flex-1">
            <p className="text-[14px] font-semibold" style={{ background: "var(--wallio-gradient)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              Double tampons actif
            </p>
            <p className="text-[12px]" style={{ color: "var(--fg-secondary)" }}>
              Jusqu'au {new Date(doubleFin!).toLocaleDateString("fr-FR")} — chaque visite vaut 2 tampons
            </p>
          </div>
        </div>
      )}

      {/* Stats grid — 2 col mobile, 5 col desktop */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-4">
        {STAT_CARDS.map((s, i) => (
          <div key={s.label}
            className={`rounded-[20px] p-4 lg:p-5${i === STAT_CARDS.length - 1 && STAT_CARDS.length % 2 !== 0 ? " col-span-2 lg:col-span-1" : ""}`}
            style={{
              background: s.gradient ? "var(--wallio-gradient)" : "var(--glass-bg)",
              border: s.gradient ? "none" : "1px solid var(--border)",
              backdropFilter: "blur(20px)",
              boxShadow: s.gradient ? "0 4px 20px rgba(139,92,246,0.25)" : "none",
            }}>
            <p className="text-[26px] lg:text-[38px] font-bold tracking-tight leading-none mb-1.5"
              style={{ color: s.gradient ? "white" : s.color }}>
              {s.value}
            </p>
            <p className="text-[10px] font-semibold uppercase tracking-wider"
              style={{ color: s.gradient ? "rgba(255,255,255,0.75)" : "var(--fg-tertiary)" }}>
              {s.label}
            </p>
          </div>
        ))}
      </div>

      {/* Chart + actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">

        {/* Graphique semaine */}
        <div className="lg:col-span-2 rounded-2xl p-5"
          style={{ background: "var(--glass-bg)", border: "1px solid var(--border)", backdropFilter: "blur(20px)" }}>
          <div className="flex items-center justify-between mb-5">
            <p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: "var(--fg-tertiary)" }}>
              Visites — 7 derniers jours
            </p>
            {tendance !== null && (
              <span className="text-[12px] font-semibold px-2 py-0.5 rounded-full"
                style={{
                  background: tendance >= 0 ? "rgba(52,199,89,0.12)" : "rgba(255,59,48,0.10)",
                  color: tendance >= 0 ? "#34C759" : "#FF3B30",
                }}>
                {tendance >= 0 ? "+" : ""}{tendance}% vs sem. préc.
              </span>
            )}
          </div>
          <div className="flex items-end gap-2 h-20">
            {stats.semaine.map((val, i) => {
              const isToday = i === 6;
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-2">
                  {val > 0 && (
                    <span className="text-[10px] font-medium" style={{ color: isToday ? "var(--accent)" : "var(--fg-tertiary)" }}>
                      {val}
                    </span>
                  )}
                  <div className="w-full rounded-md transition-all duration-500"
                    style={{
                      height: `${Math.max((val / maxSemaine) * 56, val > 0 ? 8 : 3)}px`,
                      background: isToday ? "var(--accent)" : "var(--border)",
                    }}
                  />
                  <span className="text-[10px] font-medium" style={{ color: "var(--fg-tertiary)" }}>
                    {JOURS[i]}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Actions rapides — ligne sur mobile, colonne sur desktop */}
        <div className="grid grid-cols-2 lg:grid-cols-1 lg:flex lg:flex-col gap-3">
          <Link href="/dashboard/scanner"
            className="rounded-2xl p-3 lg:p-4 flex flex-col justify-between transition-all hover:opacity-90 active:scale-[0.98]"
            style={{ background: "var(--accent)", boxShadow: "0 8px 30px rgba(0,122,255,0.28)", minHeight: 80 }}>
            <span style={{ color: "rgba(255,255,255,0.7)" }}><Icons.Scan size={16} /></span>
            <div className="mt-2">
              <p className="text-white font-semibold text-[13px]">Scanner</p>
              <p className="text-white/60 text-[10px] hidden lg:block mt-0.5">Carte client</p>
            </div>
          </Link>

          <Link href="/dashboard/notifications"
            className="rounded-2xl p-3 lg:p-4 flex flex-col justify-between transition-all hover:opacity-90"
            style={{ background: "var(--glass-bg)", border: "1px solid var(--border)", backdropFilter: "blur(20px)", minHeight: 80 }}>
            <span style={{ color: "#FF9F0A" }}><Icons.Bell size={16} /></span>
            <div className="mt-2">
              <p className="text-[13px] font-medium" style={{ color: "var(--fg)" }}>Notifs</p>
              <p className="text-[10px] mt-0.5 hidden lg:block" style={{ color: "var(--fg-tertiary)" }}>Envoyer à vos clients</p>
            </div>
          </Link>
        </div>
      </div>

      {/* Bottom row — top client + voir tous */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Meilleur client */}
        {stats.top_client && stats.top_client.tampons > 0 ? (
          <Link href={`/dashboard/clients`}
            className="flex items-center gap-4 p-4 rounded-2xl transition-all hover:opacity-80"
            style={{ background: "var(--glass-bg)", border: "1px solid var(--border)", backdropFilter: "blur(20px)" }}>
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-[15px] flex-shrink-0 text-white"
              style={{ background: "linear-gradient(135deg, #FFD700, #FF9F0A)" }}>
              {(stats.top_client.prenom[0] || "?").toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1 mb-0.5">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="#FF9F0A">
                  <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/>
                </svg>
                <p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: "#FF9F0A" }}>
                  Meilleur client
                </p>
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
          <div className="p-4 rounded-2xl" style={{ background: "var(--glass-bg)", border: "1px solid var(--border)" }}>
            <p className="text-[13px]" style={{ color: "var(--fg-tertiary)" }}>Aucun client encore — partagez votre lien NFC !</p>
          </div>
        )}

        {/* Voir tous les clients */}
        <Link href="/dashboard/clients"
          className="flex items-center justify-between p-4 rounded-2xl transition-all hover:opacity-80"
          style={{ background: "var(--glass-bg)", border: "1px solid var(--border)", backdropFilter: "blur(20px)" }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: "rgba(0,122,255,0.1)", color: "var(--accent)" }}>
              <Icons.Users size={16} />
            </div>
            <div>
              <p className="text-[14px] font-medium" style={{ color: "var(--fg)" }}>Voir tous les clients</p>
              <p className="text-[12px]" style={{ color: "var(--fg-tertiary)" }}>{stats.total} inscrits</p>
            </div>
          </div>
          <Icons.ChevronRight />
        </Link>
      </div>
    </div>
  );
}
