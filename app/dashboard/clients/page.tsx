"use client";

import { useAuth } from "@/lib/auth-context";
import { useEffect, useState } from "react";
import { collection, getDocs, query, where, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Client } from "@/lib/loyalty";
import { Icons } from "@/components/dashboard/icons";
import Link from "next/link";

export default function ClientsPage() {
  const { user, marchand } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    async function charger() {
      const snap = await getDocs(query(
        collection(db, "clients"),
        where("marchand_id", "==", user!.uid),
        orderBy("date_inscription", "desc"),
      ));
      setClients(snap.docs.map(d => ({ id: d.id, ...d.data() } as Client)));
      setLoading(false);
    }
    charger();
  }, [user]);

  if (!marchand) return null;

  const filtered = clients.filter(c =>
    `${c.prenom} ${c.nom} ${c.telephone}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="px-5 md:px-8 lg:px-10 pt-8 lg:pt-10 pb-28 md:pb-10">

      {/* Header */}
      <div className="flex items-end justify-between mb-6">
        <div>
          <p className="text-[12px] font-semibold uppercase tracking-widest mb-1" style={{ color: "var(--fg-tertiary)" }}>
            {loading ? "—" : `${clients.length} client${clients.length > 1 ? "s" : ""}`}
          </p>
          <h1 className="text-[28px] font-semibold tracking-[-0.5px]" style={{ color: "var(--fg)" }}>Clients</h1>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-5">
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: "var(--fg-tertiary)" }}>
          <Icons.Search size={16} />
        </span>
        <input
          type="text"
          placeholder="Rechercher…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-3 rounded-2xl text-[14px] outline-none transition-all"
          style={{ background: "var(--glass-bg)", border: "1px solid var(--border)", color: "var(--fg)" }}
          onFocus={e => (e.target.style.borderColor = "var(--accent)")}
          onBlur={e => (e.target.style.borderColor = "var(--border)")}
        />
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-5 h-5 rounded-full border-2 animate-spin"
            style={{ borderColor: "var(--border)", borderTopColor: "var(--accent)" }} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-[15px]" style={{ color: "var(--fg-tertiary)" }}>
            {search ? "Aucun résultat" : "Aucun client pour l'instant"}
          </p>
        </div>
      ) : (
        <div className="space-y-2 lg:grid lg:grid-cols-2 lg:gap-3 lg:space-y-0">
          {filtered.map(client => {
            const initiales = `${client.prenom?.[0] || ""}${client.nom?.[0] || ""}`;
            const pct = Math.round((client.tampons / marchand.objectif_tampons) * 100);
            return (
              <Link
                key={client.id}
                href={`/client/${client.wallet_id}`}
                className="flex items-center gap-3.5 p-4 rounded-2xl transition-all duration-150 hover:opacity-80 block"
                style={{ background: "var(--glass-bg)", border: "1px solid var(--border)", backdropFilter: "blur(20px)" }}
              >
                {/* Avatar */}
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white text-[13px] font-semibold flex-shrink-0"
                  style={{ background: "var(--accent)" }}
                >
                  {initiales}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-medium truncate" style={{ color: "var(--fg)" }}>
                    {client.prenom} {client.nom}
                  </p>
                  <p className="text-[12px] truncate" style={{ color: "var(--fg-tertiary)" }}>
                    {client.telephone}
                  </p>
                  {/* Progress bar */}
                  <div className="mt-1.5 h-1 rounded-full overflow-hidden" style={{ background: "var(--border)" }}>
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${Math.min(pct, 100)}%`, background: "var(--accent)" }}
                    />
                  </div>
                </div>

                {/* Tampons */}
                <div className="text-right flex-shrink-0">
                  <p className="text-[15px] font-semibold" style={{ color: "var(--accent)" }}>
                    {client.tampons}
                    <span className="text-[11px] font-normal" style={{ color: "var(--fg-tertiary)" }}>
                      /{marchand.objectif_tampons}
                    </span>
                  </p>
                  {client.recompense_en_attente && (
                    <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full"
                      style={{ background: "rgba(52,199,89,0.12)", color: "#34C759" }}>
                      Récompense
                    </span>
                  )}
                </div>

                <Icons.ChevronRight />
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
