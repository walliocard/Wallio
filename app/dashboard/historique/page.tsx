"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { getAuth } from "firebase/auth";

interface Entry {
  id: string;
  client_prenom: string;
  client_nom: string;
  tampons_apres: number;
  recompense: boolean;
  type: "qr_equipe" | "manuel_equipe" | "patron";
  added_by: string;
  created_at: string | null;
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" }) + " · " +
    d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

function TypeBadge({ type, manual }: { type: string; manual?: boolean }) {
  if (type === "manuel_equipe") return <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 8px", borderRadius: 6, background: "rgba(255,159,10,0.12)", color: "#FF9F0A" }}>Manuel</span>;
  if (type === "qr_equipe") return <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 8px", borderRadius: 6, background: "rgba(0,122,255,0.10)", color: "#007AFF" }}>QR Équipe</span>;
  return <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 8px", borderRadius: 6, background: "rgba(52,199,89,0.10)", color: "#34C759" }}>Patron</span>;
}

export default function HistoriquePage() {
  const { user, marchand } = useAuth();
  const router = useRouter();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"tout" | "manuel_equipe" | "qr_equipe">("tout");
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;
    getAuth().currentUser?.getIdToken().then(token =>
      fetch("/api/dashboard/historique", { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.json())
        .then(d => { setEntries(d.entries || []); setLoading(false); })
        .catch(() => setLoading(false))
    );
  }, [user]);

  const filtered = filter === "tout" ? entries : entries.filter(e => e.type === filter);

  function handlePrint() {
    window.print();
  }

  return (
    <div className="px-5 md:px-8 pt-6 pb-40 md:pb-10 max-w-3xl">
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #historique-print, #historique-print * { visibility: visible; }
          #historique-print { position: fixed; top: 0; left: 0; width: 100%; }
          .no-print { display: none !important; }
        }
      `}</style>

      {/* Header */}
      <div className="flex items-center gap-4 mb-6 no-print">
        <button onClick={() => router.back()}
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: "var(--glass-bg)", border: "1px solid var(--border)" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--fg-secondary)" strokeWidth="2" strokeLinecap="round"><path d="M15 18l-6-6 6-6"/></svg>
        </button>
        <div className="flex-1">
          <h1 className="text-[22px] font-bold tracking-tight" style={{ color: "var(--fg)" }}>Historique</h1>
          <p className="text-[13px]" style={{ color: "var(--fg-tertiary)" }}>{marchand?.nom}</p>
        </div>
        <button onClick={handlePrint}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-semibold no-print"
          style={{ background: "var(--glass-bg)", border: "1px solid var(--border)", color: "var(--fg)" }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
          Exporter PDF
        </button>
      </div>

      {/* Filtres */}
      <div className="flex gap-2 mb-5 no-print">
        {([["tout", "Tout"], ["qr_equipe", "QR Équipe"], ["manuel_equipe", "Manuels"]] as const).map(([val, label]) => (
          <button key={val} onClick={() => setFilter(val)}
            className="px-3 py-1.5 rounded-xl text-[13px] font-semibold transition-all"
            style={{ background: filter === val ? "var(--accent)" : "var(--glass-bg)", color: filter === val ? "white" : "var(--fg-secondary)", border: `1px solid ${filter === val ? "var(--accent)" : "var(--border)"}` }}>
            {label}
          </button>
        ))}
      </div>

      {/* Table — visible à l'écran ET à l'impression */}
      <div id="historique-print" ref={printRef}>

        {/* En-tête impression */}
        <div style={{ display: "none" }} className="print-only">
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>Historique — {marchand?.nom}</h2>
          <p style={{ fontSize: 12, color: "#6E6E73", marginBottom: 16 }}>Exporté le {new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}</p>
        </div>
        <style>{`.print-only { display: block !important; }`}</style>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "var(--accent)", borderTopColor: "transparent" }} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl p-8 text-center" style={{ background: "var(--glass-bg)", border: "1px solid var(--border)" }}>
            <p className="text-[14px]" style={{ color: "var(--fg-tertiary)" }}>Aucun historique pour le moment</p>
          </div>
        ) : (
          <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
            {/* Header */}
            <div className="grid gap-0 px-4 py-2.5" style={{ gridTemplateColumns: "1fr auto auto auto", background: "var(--glass-bg)", borderBottom: "1px solid var(--border)" }}>
              {["Client", "Tampons", "Ajouté par", "Type"].map(h => (
                <p key={h} className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: "var(--fg-tertiary)" }}>{h}</p>
              ))}
            </div>
            {filtered.map((e, i) => (
              <div key={e.id} className="grid gap-0 px-4 py-3 items-center" style={{ gridTemplateColumns: "1fr auto auto auto", borderBottom: i < filtered.length - 1 ? "1px solid var(--border)" : "none" }}>
                <div>
                  <p className="text-[14px] font-medium" style={{ color: "var(--fg)" }}>{e.client_prenom} {e.client_nom}</p>
                  <p className="text-[11px]" style={{ color: "var(--fg-tertiary)" }}>{formatDate(e.created_at)}</p>
                </div>
                <div className="flex items-center gap-1.5 px-4">
                  <p className="text-[14px] font-semibold" style={{ color: "var(--fg)" }}>{e.tampons_apres}</p>
                  {e.recompense && <span className="text-[11px] font-bold" style={{ color: "#34C759" }}>🎁</span>}
                </div>
                <p className="text-[13px] px-4" style={{ color: "var(--fg-secondary)" }}>{e.added_by}</p>
                <TypeBadge type={e.type} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
