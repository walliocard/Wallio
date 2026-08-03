"use client";

import { useAuth } from "@/lib/auth-context";
import { useEffect, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Link from "next/link";
import { Icons } from "@/components/dashboard/icons";

type Stats = {
  total: number;
  aujourd_hui: number;
  tampons_total: number;
  ce_mois: number;
  semaine: number[];
  recompenses: number;
};

const JOURS = ["L", "M", "M", "J", "V", "S", "D"];

export default function AccueilPage() {
  const { user, marchand } = useAuth();
  const [stats, setStats] = useState<Stats>({
    total: 0, aujourd_hui: 0, tampons_total: 0, ce_mois: 0, semaine: [0,0,0,0,0,0,0], recompenses: 0,
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
      snap.docs.forEach(d => {
        const data = d.data();
        tampons_total += data.tampons || 0;
        if (data.recompense_en_attente) recompenses++;
        const dv = (data.derniere_visite?.seconds || 0) * 1000;
        if (dv >= today.getTime()) aujourd_hui++;
        if (dv >= moisDebut.getTime()) ce_mois++;
        for (let i = 0; i < 7; i++) {
          const j = new Date(today); j.setDate(j.getDate() - (6 - i));
          const jf = new Date(j); jf.setDate(jf.getDate() + 1);
          if (dv >= j.getTime() && dv < jf.getTime()) semaine[i]++;
        }
      });
      setStats({ total: snap.size, aujourd_hui, tampons_total, ce_mois, semaine, recompenses });
    }
    charger();
  }, [user]);

  if (!marchand || !user) return null;

  const maxSemaine = Math.max(...stats.semaine, 1);

  const STAT_CARDS = [
    { label: "Aujourd'hui",    value: stats.aujourd_hui,  color: "var(--accent)" },
    { label: "Ce mois",        value: stats.ce_mois,      color: "#34C759" },
    { label: "Total clients",  value: stats.total,        color: "var(--fg)" },
    { label: "Récompenses",    value: stats.recompenses,  color: stats.recompenses > 0 ? "#FF9F0A" : "var(--fg-tertiary)" },
  ];

  return (
    <div className="px-5 md:px-8 lg:px-10 pt-8 lg:pt-10 pb-28 md:pb-10 max-w-5xl">

      {/* Header */}
      <div className="mb-8">
        <p className="text-[12px] font-semibold uppercase tracking-widest mb-1" style={{ color: "var(--fg-tertiary)" }}>
          Tableau de bord
        </p>
        <h1 className="text-[28px] lg:text-[32px] font-semibold tracking-[-0.5px]" style={{ color: "var(--fg)" }}>
          {marchand.nom}
        </h1>
      </div>

      {/* Stats grid — 2 col mobile, 4 col desktop */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        {STAT_CARDS.map(s => (
          <div
            key={s.label}
            className="rounded-2xl p-4 lg:p-5"
            style={{ background: "var(--glass-bg)", border: "1px solid var(--border)", backdropFilter: "blur(20px)" }}
          >
            <p className="text-[32px] lg:text-[38px] font-semibold tracking-tight leading-none mb-1.5" style={{ color: s.color }}>
              {s.value}
            </p>
            <p className="text-[11px] lg:text-[12px]" style={{ color: "var(--fg-secondary)" }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Main content — chart + actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">

        {/* Graphique semaine */}
        <div
          className="lg:col-span-2 rounded-2xl p-5"
          style={{ background: "var(--glass-bg)", border: "1px solid var(--border)", backdropFilter: "blur(20px)" }}
        >
          <p className="text-[11px] font-semibold uppercase tracking-widest mb-5" style={{ color: "var(--fg-tertiary)" }}>
            Visites — 7 derniers jours
          </p>
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
                  <div
                    className="w-full rounded-md transition-all duration-500"
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
          <Link
            href="/dashboard/scanner"
            className="flex-1 rounded-2xl p-4 lg:p-5 flex flex-col justify-between transition-all duration-150 hover:opacity-90 active:scale-[0.98]"
            style={{ background: "var(--accent)", boxShadow: "0 8px 30px rgba(0,122,255,0.28)" }}
          >
            <span style={{ color: "rgba(255,255,255,0.7)" }}>
              <Icons.Scan size={20} />
            </span>
            <div className="mt-4">
              <p className="text-white font-semibold text-[15px]">Scanner</p>
              <p className="text-white/60 text-[12px] mt-0.5">Carte client</p>
            </div>
          </Link>

          <Link
            href="/dashboard/carte-comptoir"
            className="flex-1 rounded-2xl p-4 lg:p-5 flex flex-col justify-between transition-all duration-150 hover:opacity-90"
            style={{ background: "var(--glass-bg)", border: "1px solid var(--border)", backdropFilter: "blur(20px)" }}
          >
            <span style={{ color: "var(--accent)" }}>
              <Icons.Print size={20} />
            </span>
            <div className="mt-4">
              <p className="text-[15px] font-medium" style={{ color: "var(--fg)" }}>Carte NFC</p>
              <p className="text-[12px] mt-0.5" style={{ color: "var(--fg-tertiary)" }}>
                {marchand.nfc_id ? `…/${marchand.nfc_id}` : "Non configuré"}
              </p>
            </div>
          </Link>
        </div>
      </div>

      {/* Clients récents */}
      <Link
        href="/dashboard/clients"
        className="flex items-center justify-between p-4 rounded-2xl transition-all duration-150 hover:opacity-80"
        style={{ background: "var(--glass-bg)", border: "1px solid var(--border)", backdropFilter: "blur(20px)" }}
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "rgba(0,122,255,0.1)", color: "var(--accent)" }}>
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
  );
}
