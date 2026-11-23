"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { getAuth } from "firebase/auth";
import { formatName } from "@/lib/format";

type FilterType = "tout" | "qr_gerant" | "qr_equipe" | "manuel_equipe" | "nfc_client" | "auto_validation" | "anti_doublon" | "correction_gerant";

interface Entry {
  id: string;
  client_prenom: string;
  client_nom: string;
  tampons_apres: number;
  tampons_avant?: number;
  recompense: boolean;
  type: FilterType;
  added_by: string;
  created_at: string | null;
}

interface GroupedEntry extends Entry {
  group?: Entry[];
}

const PAGE_SIZE = 50;

const FILTERS: { value: FilterType; label: string }[] = [
  { value: "tout",           label: "Tout" },
  { value: "qr_gerant",      label: "Patron" },
  { value: "qr_equipe",      label: "Équipe" },
  { value: "manuel_equipe",  label: "Manuel" },
  { value: "nfc_client",     label: "NFC client" },
  { value: "auto_validation",label: "Auto" },
  { value: "anti_doublon",      label: "Refusé" },
  { value: "correction_gerant", label: "Correction" },
];

const TYPE_COLORS: Record<string, { bg: string; color: string }> = {
  qr_gerant:      { bg: "rgba(139,92,246,0.12)",  color: "#8B5CF6" },
  qr_equipe:      { bg: "rgba(0,122,255,0.10)",   color: "#007AFF" },
  manuel_equipe:  { bg: "rgba(255,159,10,0.12)",  color: "#FF9F0A" },
  nfc_client:     { bg: "rgba(0,199,190,0.10)",   color: "#00C7BE" },
  auto_validation:{ bg: "rgba(52,199,89,0.10)",   color: "#34C759" },
  anti_doublon:      { bg: "rgba(255,59,48,0.10)",   color: "#FF3B30" },
  correction_gerant: { bg: "rgba(255,149,0,0.10)",   color: "#FF9500" },
};

function SourceIcon({ type }: { type: string }) {
  const c = TYPE_COLORS[type]?.color || "#8E8E93";
  if (type === "qr_gerant" || type === "qr_equipe") return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round">
      <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
      <rect x="3" y="14" width="7" height="7"/><path d="M14 14h3v3m0 4h4v-4m-4 0h-3v4"/>
    </svg>
  );
  if (type === "nfc_client") return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round">
      <path d="M6 8.32a7.43 7.43 0 0 1 0 7.36"/><path d="M9.46 6.21a11.76 11.76 0 0 1 0 11.58"/>
      <path d="M12.91 4.1a15.91 15.91 0 0 1 .01 15.8"/><circle cx="17.5" cy="12" r="1.5" fill={c}/>
    </svg>
  );
  if (type === "manuel_equipe") return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
    </svg>
  );
  if (type === "auto_validation") return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round">
      <path d="M20 6 9 17l-5-5"/>
    </svg>
  );
  if (type === "anti_doublon") return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round">
      <circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
    </svg>
  );
  if (type === "correction_gerant") return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
    </svg>
  );
  return null;
}

function groupDuplicates(entries: Entry[]): GroupedEntry[] {
  const result: GroupedEntry[] = [];
  for (const entry of entries) {
    if (entry.type === "anti_doublon" || entry.type === "auto_validation") {
      result.push({ ...entry });
      continue;
    }
    const last = result[result.length - 1];
    if (
      last &&
      last.type !== "anti_doublon" && last.type !== "auto_validation" &&
      last.client_prenom === entry.client_prenom &&
      last.client_nom === entry.client_nom &&
      last.created_at && entry.created_at &&
      Math.abs(new Date(last.created_at).getTime() - new Date(entry.created_at).getTime()) < 60000
    ) {
      if (!last.group) last.group = [{ ...last }];
      last.group.push(entry);
      last.tampons_apres = entry.tampons_apres;
    } else {
      result.push({ ...entry });
    }
  }
  return result;
}

function formatTime(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

function exportCSV(entries: Entry[], nom: string) {
  const rows = [
    ["Date", "Heure", "Client", "Tampons", "Type", "Membre"].join(";"),
    ...entries.map(e => [
      e.created_at ? new Date(e.created_at).toLocaleDateString("fr-FR") : "",
      formatTime(e.created_at),
      `${e.client_prenom} ${e.client_nom}`,
      e.tampons_apres,
      e.type,
      e.added_by,
    ].join(";")),
  ].join("\n");
  const blob = new Blob(["﻿" + rows], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `historique-${nom}-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function HistoriquePage() {
  const { user, marchand } = useAuth();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>("tout");
  const [showFilterSheet, setShowFilterSheet] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [displayCount, setDisplayCount] = useState(PAGE_SIZE);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;
    getAuth().currentUser?.getIdToken().then(token =>
      fetch("/api/dashboard/historique", { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.json())
        .then(d => { setEntries(d.entries || []); setLoading(false); })
        .catch(() => setLoading(false))
    );
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  const filtered = filter === "tout" ? entries : entries.filter(e => e.type === filter);
  const grouped = groupDuplicates(filtered);

  // Group by day
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
  const dayMap = new Map<string, GroupedEntry[]>();
  grouped.slice(0, displayCount).forEach(e => {
    if (!e.created_at) { const k = "Sans date"; if (!dayMap.has(k)) dayMap.set(k, []); dayMap.get(k)!.push(e); return; }
    const d = new Date(e.created_at); d.setHours(0, 0, 0, 0);
    let label: string;
    if (d.getTime() === today.getTime()) label = "Aujourd'hui";
    else if (d.getTime() === yesterday.getTime()) label = "Hier";
    else label = new Date(e.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long" });
    if (!dayMap.has(label)) dayMap.set(label, []);
    dayMap.get(label)!.push(e);
  });

  const filterLabel = FILTERS.find(f => f.value === filter)?.label ?? "Tout";

  function toggleExpand(id: string) {
    setExpanded(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }

  return (
    <div className="px-5 md:px-8 pb-36 md:pb-10 max-w-3xl" style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 16px)" }}>
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #historique-print, #historique-print * { visibility: visible; }
          #historique-print { position: fixed; top: 0; left: 0; width: 100%; }
          .no-print { display: none !important; }
        }
        @media print { .print-only { display: block !important; } }
      `}</style>

      {/* Header */}
      <div className="flex items-center gap-3 mb-5 no-print">
        <Link href="/dashboard/plus" className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: "var(--glass-bg)", border: "1px solid var(--border)" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--fg-secondary)" strokeWidth="2" strokeLinecap="round"><path d="M15 18l-6-6 6-6"/></svg>
        </Link>
        <h1 className="flex-1 text-[32px] font-bold tracking-[-1px]" style={{ color: "var(--fg)" }}>Historique</h1>
        {/* Filtre */}
        <button onClick={() => setShowFilterSheet(true)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[13px] font-semibold"
          style={{ background: filter !== "tout" ? "rgba(47,123,255,0.08)" : "var(--glass-bg)", border: `1px solid ${filter !== "tout" ? "rgba(47,123,255,0.3)" : "var(--border)"}`, color: filter !== "tout" ? "var(--accent)" : "var(--fg-secondary)" }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
          {filterLabel}
        </button>
        {/* Export */}
        <div className="relative">
          <button onClick={() => setShowExportMenu(v => !v)}
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: "var(--glass-bg)", border: "1px solid var(--border)" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--fg-secondary)" strokeWidth="2" strokeLinecap="round">
              <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
              <polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/>
            </svg>
          </button>
          {showExportMenu && (
            <div className="absolute right-0 top-10 rounded-2xl overflow-hidden z-20 shadow-lg"
              style={{ background: "var(--bg)", border: "1px solid var(--border)", minWidth: 150 }}>
              <button onClick={() => { window.print(); setShowExportMenu(false); }}
                className="w-full px-4 py-3 text-left text-[13px] font-medium"
                style={{ color: "var(--fg)", borderBottom: "1px solid var(--border)" }}>
                Exporter PDF
              </button>
              <button onClick={() => { exportCSV(filtered, marchand?.nom || "wallio"); setShowExportMenu(false); }}
                className="w-full px-4 py-3 text-left text-[13px] font-medium"
                style={{ color: "var(--fg)" }}>
                Exporter CSV
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Liste */}
      <div id="historique-print" ref={printRef}>
        {/* En-tête impression */}
        <div style={{ display: "none" }} className="print-only">
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>Historique — {marchand?.nom}</h2>
          <p style={{ fontSize: 12, color: "#6E6E73", marginBottom: 16 }}>
            Exporté le {new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
              style={{ borderColor: "var(--accent)", borderTopColor: "transparent" }} />
          </div>
        ) : grouped.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
            <svg width="64" height="64" viewBox="0 0 80 80" fill="none">
              <circle cx="40" cy="40" r="36" stroke="var(--border)" strokeWidth="2"/>
              <path d="M28 40h24M40 28v24" stroke="url(#hg)" strokeWidth="2.5" strokeLinecap="round"/>
              <circle cx="40" cy="40" r="6" stroke="url(#hg)" strokeWidth="2"/>
              <defs><linearGradient id="hg" x1="28" y1="28" x2="52" y2="52" gradientUnits="userSpaceOnUse"><stop stopColor="#2F7BFF"/><stop offset="1" stopColor="#8B5CF6"/></linearGradient></defs>
            </svg>
            <div>
              <p className="text-[16px] font-semibold mb-1" style={{ color: "var(--fg)" }}>
                {filter !== "tout" ? "Aucun résultat pour ce filtre" : "Aucun historique"}
              </p>
              <p className="text-[13px]" style={{ color: "var(--fg-tertiary)" }}>
                {filter !== "tout" ? "Essayez un autre filtre" : "Les scans apparaissent ici après chaque visite"}
              </p>
            </div>
            {filter !== "tout" && (
              <button onClick={() => setFilter("tout")} className="text-[13px] font-semibold" style={{ color: "var(--accent)" }}>
                Effacer le filtre
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-5">
            {Array.from(dayMap.entries()).map(([dayLabel, dayEntries]) => (
              <div key={dayLabel}>
                {/* En-tête collant */}
                <div className="sticky z-10 no-print" style={{ top: 0, background: "var(--bg)", paddingTop: 4, paddingBottom: 8, marginBottom: 2 }}>
                  <p className="text-[12px] font-semibold" style={{ color: "var(--fg-tertiary)" }}>{dayLabel}</p>
                </div>
                <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
                  {dayEntries.map((e, i) => {
                    const isExpanded = expanded.has(e.id);
                    const hasGroup = e.group && e.group.length > 1;
                    const tc = TYPE_COLORS[e.type] || { bg: "rgba(142,142,147,0.10)", color: "#8E8E93" };
                    return (
                      <div key={e.id} style={{ borderBottom: i < dayEntries.length - 1 ? "1px solid var(--border)" : "none", background: "var(--glass-bg)" }}>
                        <button
                          onClick={hasGroup ? () => toggleExpand(e.id) : undefined}
                          className={`w-full flex items-center gap-3 px-4 py-3 text-left ${hasGroup ? "active:opacity-70" : ""}`}
                          style={{ background: "none", border: "none", cursor: hasGroup ? "pointer" : "default" }}>
                          {/* Source icon */}
                          <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                            style={{ background: tc.bg }}>
                            <SourceIcon type={e.type} />
                          </div>
                          {/* Info */}
                          <div className="flex-1 min-w-0 text-left">
                            <div className="flex items-center gap-1.5">
                              <p className="text-[14px] font-medium truncate" style={{ color: "var(--fg)" }}>
                                {formatName(e.client_prenom)} {e.client_nom?.[0] ? (e.client_nom[0].toUpperCase() + ".") : ""}
                                {hasGroup && <span className="text-[12px] font-normal ml-1" style={{ color: "var(--fg-tertiary)" }}>×{e.group!.length}</span>}
                              </p>
                              {e.recompense && (
                                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full flex-shrink-0"
                                  style={{ background: "rgba(52,199,89,0.12)", color: "#34C759" }}>
                                  Récompense
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] mt-0.5" style={{ color: "var(--fg-tertiary)" }}>
                              {formatTime(e.created_at)}
                              {e.added_by && e.added_by !== "Client" && ` · ${e.added_by}`}
                            </p>
                          </div>
                          {/* Tampons */}
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            <span className="text-[15px] font-bold tabular-nums" style={{ color: "var(--fg)" }}>
                              {e.type === "correction_gerant" && e.tampons_avant !== undefined
                                ? `${e.tampons_avant} → ${e.tampons_apres}`
                                : e.tampons_apres}
                            </span>
                            {hasGroup && (
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--fg-tertiary)" strokeWidth="2" strokeLinecap="round"
                                style={{ transform: isExpanded ? "rotate(180deg)" : undefined, transition: "transform 0.2s" }}>
                                <polyline points="6 9 12 15 18 9"/>
                              </svg>
                            )}
                          </div>
                        </button>
                        {/* Lignes dépliées */}
                        {hasGroup && isExpanded && e.group!.map((sub, si) => (
                          <div key={sub.id} className="flex items-center gap-3 px-4 py-2.5"
                            style={{ borderTop: "1px solid var(--border)", background: "rgba(0,0,0,0.02)", paddingLeft: 56 }}>
                            <div className="flex-1 min-w-0">
                              <p className="text-[12px]" style={{ color: "var(--fg-secondary)" }}>
                                {formatTime(sub.created_at)}
                                {sub.added_by && sub.added_by !== "Client" && ` · ${sub.added_by}`}
                              </p>
                            </div>
                            <span className="text-[13px] font-semibold tabular-nums" style={{ color: "var(--fg-secondary)" }}>{sub.tampons_apres}</span>
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
            {/* Charger plus */}
            {displayCount < grouped.length && (
              <button onClick={() => setDisplayCount(n => n + PAGE_SIZE)}
                className="w-full py-4 rounded-2xl text-[14px] font-semibold"
                style={{ background: "var(--glass-bg)", border: "1px solid var(--border)", color: "var(--accent)" }}>
                Charger plus ({grouped.length - displayCount} restants)
              </button>
            )}
          </div>
        )}
      </div>

      {/* Bottom sheet filtres */}
      {showFilterSheet && (
        <div className="fixed inset-0 z-50 flex items-end"
          style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)" }}
          onClick={() => setShowFilterSheet(false)}>
          <div className="w-full rounded-t-3xl overflow-hidden"
            style={{ background: "var(--bg)", animation: "slide-up 0.3s cubic-bezier(0.34,1.06,0.64,1)", paddingBottom: "max(16px, env(safe-area-inset-bottom))" }}
            onClick={e => e.stopPropagation()}>
            <div className="w-10 h-1 rounded-full mx-auto mt-3 mb-4" style={{ background: "var(--border)" }} />
            <p className="text-[13px] font-semibold px-5 mb-2" style={{ color: "var(--fg-tertiary)" }}>Filtrer par source</p>
            <div className="rounded-2xl overflow-hidden mx-5">
              {FILTERS.map((f, i) => (
                <button key={f.value} onClick={() => { setFilter(f.value); setShowFilterSheet(false); setDisplayCount(PAGE_SIZE); }}
                  className="w-full flex items-center justify-between px-5 py-4"
                  style={{ background: "var(--glass-bg)", borderBottom: i < FILTERS.length - 1 ? "1px solid var(--border)" : "none", textAlign: "left" }}>
                  <span className="text-[15px]" style={{ color: "var(--fg)" }}>{f.label}</span>
                  {filter === f.value && (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round"><path d="M20 6 9 17l-5-5"/></svg>
                  )}
                </button>
              ))}
            </div>
            <div className="pb-2" />
          </div>
        </div>
      )}

      {/* Click outside export menu */}
      {showExportMenu && (
        <div className="fixed inset-0 z-10" onClick={() => setShowExportMenu(false)} />
      )}
    </div>
  );
}
