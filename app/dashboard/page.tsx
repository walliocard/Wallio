"use client";

import { useAuth } from "@/lib/auth-context";
import { useEffect, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Link from "next/link";
import { Icons } from "@/components/dashboard/icons";
import WallioLogo from "@/components/WallioLogo";

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
    async function charger() {
      const snap = await getDocs(query(collection(db, "clients"), where("marchand_id", "==", user!.uid)));
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

        // Top client par tampons
        if (!top_client || t > top_client.tampons) {
          top_client = { prenom: data.prenom || "", nom: data.nom || "", tampons: t, id: d.id };
        }

        const dv = (data.derniere_visite?.seconds || 0) * 1000;
        if (dv >= today.getTime()) aujourd_hui++;
        if (dv >= moisDebut.getTime()) ce_mois++;

        // Semaine actuelle (j-6 à aujourd'hui)
        for (let i = 0; i < 7; i++) {
          const debut = new Date(today); debut.setDate(debut.getDate() - (6 - i));
          const fin = new Date(debut); fin.setDate(fin.getDate() + 1);
          if (dv >= debut.getTime() && dv < fin.getTime()) semaine[i]++;
        }

        // Semaine précédente (j-13 à j-7)
        for (let i = 0; i < 7; i++) {
          const debut = new Date(today); debut.setDate(debut.getDate() - (13 - i));
          const fin = new Date(debut); fin.setDate(fin.getDate() + 1);
          if (dv >= debut.getTime() && dv < fin.getTime()) semaine_precedente[i]++;
        }
      });

      setStats({ total: snap.size, aujourd_hui, tampons_total, ce_mois, semaine, semaine_precedente, recompenses, top_client });
    }
    charger();
  }, [user]);

  if (!marchand || !user) return null;

  const maxSemaine = Math.max(...stats.semaine, 1);
  const totalSemaine = stats.semaine.reduce((a, b) => a + b, 0);
  const totalPrecedente = stats.semaine_precedente.reduce((a, b) => a + b, 0);
  const tendance = totalPrecedente > 0
    ? Math.round(((totalSemaine - totalPrecedente) / totalPrecedente) * 100)
    : null;

  const m = marchand as Record<string, unknown>;

  const STAT_CARDS = [
    { label: "Aujourd'hui",   value: stats.aujourd_hui,  color: "var(--accent)" },
    { label: "Ce mois",       value: stats.ce_mois,      color: "#34C759" },
    { label: "Total clients", value: stats.total,        color: "var(--fg)" },
    { label: "Tampons",       value: stats.tampons_total, color: "var(--fg)" },
    { label: "Récompenses",   value: stats.recompenses,  color: stats.recompenses > 0 ? "#FF9F0A" : "var(--fg-tertiary)" },
  ];

  return (
    <div className="px-5 md:px-8 lg:px-10 pt-8 lg:pt-10 pb-28 md:pb-10 max-w-5xl">

      {/* Header */}
      <div className="mb-8 flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl flex-shrink-0 overflow-hidden flex items-center justify-center"
          style={{ background: "var(--glass-bg)", border: "1px solid var(--border)" }}>
          {m.logo_url
            ? <img src={m.logo_url as string} alt="" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
            : <span className="text-[22px] font-bold" style={{ color: "var(--accent)" }}>
                {(marchand.nom?.[0] || "?").toUpperCase()}
              </span>
          }
        </div>
        <div>
          <div className="flex items-center gap-1.5 mb-0.5">
            <WallioLogo size={14} />
            <p className="text-[12px] font-semibold uppercase tracking-widest" style={{ color: "var(--fg-tertiary)" }}>
              Wallio · Tableau de bord
            </p>
          </div>
          <h1 className="text-[28px] lg:text-[32px] font-semibold tracking-[-0.5px]" style={{ color: "var(--fg)" }}>
            {marchand.nom}
          </h1>
        </div>
      </div>

      {/* Alerte récompenses en attente */}
      {stats.recompenses > 0 && (
        <Link href="/dashboard/clients" className="flex items-center gap-3 rounded-2xl p-4 mb-4 transition-all hover:opacity-90"
          style={{ background: "rgba(255,159,10,0.10)", border: "1px solid rgba(255,159,10,0.30)" }}>
          <span className="text-[20px]">🎁</span>
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

      {/* Stats grid — 2 col mobile, 5 col desktop */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-4">
        {STAT_CARDS.map(s => (
          <div key={s.label} className="rounded-2xl p-4 lg:p-5"
            style={{ background: "var(--glass-bg)", border: "1px solid var(--border)", backdropFilter: "blur(20px)" }}>
            <p className="text-[28px] lg:text-[34px] font-semibold tracking-tight leading-none mb-1.5" style={{ color: s.color }}>
              {s.value}
            </p>
            <p className="text-[11px] lg:text-[12px]" style={{ color: "var(--fg-secondary)" }}>{s.label}</p>
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

        {/* Actions rapides */}
        <div className="flex flex-col gap-3">
          <Link href="/dashboard/scanner"
            className="flex-1 rounded-2xl p-4 flex flex-col justify-between transition-all hover:opacity-90 active:scale-[0.98]"
            style={{ background: "var(--accent)", boxShadow: "0 8px 30px rgba(0,122,255,0.28)" }}>
            <span style={{ color: "rgba(255,255,255,0.7)" }}><Icons.Scan size={18} /></span>
            <div className="mt-3">
              <p className="text-white font-semibold text-[14px]">Scanner</p>
              <p className="text-white/60 text-[11px] mt-0.5">Carte client</p>
            </div>
          </Link>

          <Link href="/dashboard/notifications"
            className="flex-1 rounded-2xl p-4 flex flex-col justify-between transition-all hover:opacity-90"
            style={{ background: "var(--glass-bg)", border: "1px solid var(--border)", backdropFilter: "blur(20px)" }}>
            <span style={{ color: "#FF9F0A" }}><Icons.Bell size={18} /></span>
            <div className="mt-3">
              <p className="text-[14px] font-medium" style={{ color: "var(--fg)" }}>Notification</p>
              <p className="text-[11px] mt-0.5" style={{ color: "var(--fg-tertiary)" }}>Envoyer à vos clients</p>
            </div>
          </Link>

          <Link href="/dashboard/carte-comptoir"
            className="flex-1 rounded-2xl p-4 flex flex-col justify-between transition-all hover:opacity-90"
            style={{ background: "var(--glass-bg)", border: "1px solid var(--border)", backdropFilter: "blur(20px)" }}>
            <span style={{ color: "var(--accent)" }}><Icons.Print size={18} /></span>
            <div className="mt-3">
              <p className="text-[14px] font-medium" style={{ color: "var(--fg)" }}>Carte NFC</p>
              <p className="text-[11px] mt-0.5" style={{ color: "var(--fg-tertiary)" }}>
                {marchand.nfc_id ? `…/${marchand.nfc_id}` : "Non configuré"}
              </p>
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
              <p className="text-[11px] font-semibold uppercase tracking-widest mb-0.5" style={{ color: "#FF9F0A" }}>
                ⭐ Meilleur client
              </p>
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
