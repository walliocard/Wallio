"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { collection, getDocs, doc, updateDoc, orderBy, query } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

const ADMIN_EMAIL = "wallio.card@gmail.com";

type Marchand = {
  id: string;
  nom: string;
  email: string;
  actif: boolean;
  date_inscription?: { seconds: number };
};

export default function AdminPage() {
  const [marchands, setMarchands] = useState<Marchand[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user || user.email !== ADMIN_EMAIL) {
        router.push("/admin/login");
        return;
      }
      await chargerMarchands();
      setLoading(false);
    });
    return unsub;
  }, [router]);

  async function chargerMarchands() {
    const q = query(collection(db, "marchands"), orderBy("date_inscription", "desc"));
    const snap = await getDocs(q);
    setMarchands(snap.docs.map(d => ({ id: d.id, nom: "", email: "", actif: false, ...d.data() } as Marchand)));
  }

  async function toggleActif(marchand: Marchand) {
    setToggling(marchand.id);
    await updateDoc(doc(db, "marchands", marchand.id), { actif: !marchand.actif });
    setMarchands(prev => prev.map(m => m.id === marchand.id ? { ...m, actif: !m.actif } : m));
    setToggling(null);
  }

  function formatDate(ts?: { seconds: number }) {
    if (!ts) return "—";
    return new Date(ts.seconds * 1000).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg)" }}>
        <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "var(--accent)", borderTopColor: "transparent" }} />
      </main>
    );
  }

  const actifs = marchands.filter(m => m.actif).length;

  return (
    <main className="min-h-screen px-6 py-10" style={{ background: "var(--bg)" }}>

      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] right-[10%] w-[600px] h-[500px] rounded-full opacity-20"
          style={{ background: "radial-gradient(circle, rgba(0,122,255,0.15) 0%, transparent 70%)" }} />
      </div>

      <div className="max-w-5xl mx-auto relative">

        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-[32px] font-semibold tracking-[-0.5px]" style={{ color: "var(--fg)" }}>
              Administration
            </h1>
            <p className="text-[15px] mt-1" style={{ color: "var(--fg-secondary)" }}>
              {actifs} marchand{actifs > 1 ? "s" : ""} actif{actifs > 1 ? "s" : ""} · {marchands.length} au total
            </p>
          </div>
          <button
            onClick={() => signOut(auth).then(() => router.push("/admin/login"))}
            className="text-[13px] px-4 py-2 rounded-xl transition-all duration-200"
            style={{ color: "var(--fg-secondary)", background: "var(--glass-bg)", border: "1px solid var(--border)" }}
          >
            Déconnexion
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: "Total", value: marchands.length, color: "var(--fg)" },
            { label: "Actifs", value: actifs, color: "var(--accent)" },
            { label: "En attente", value: marchands.length - actifs, color: "#FF9F0A" },
          ].map(stat => (
            <div key={stat.label} className="rounded-[24px] p-6 transition-all duration-200"
              style={{
                background: "var(--glass-bg)",
                border: "1px solid var(--glass-border)",
                backdropFilter: "blur(20px)",
                boxShadow: "var(--shadow-sm)",
              }}>
              <p className="text-[36px] font-semibold tracking-tight" style={{ color: stat.color }}>{stat.value}</p>
              <p className="text-[13px] mt-1" style={{ color: "var(--fg-secondary)" }}>{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Table */}
        <div className="rounded-[24px] overflow-hidden"
          style={{
            background: "var(--glass-bg)",
            border: "1px solid var(--glass-border)",
            backdropFilter: "blur(20px)",
            boxShadow: "var(--shadow-md)",
          }}>

          {marchands.length === 0 ? (
            <div className="py-20 text-center" style={{ color: "var(--fg-tertiary)" }}>
              <p className="text-[15px]">Aucun marchand inscrit pour le moment.</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)" }}>
                  {["Établissement", "Email", "Inscription", "Statut", ""].map(h => (
                    <th key={h} className="text-left text-[12px] font-medium px-6 py-4"
                      style={{ color: "var(--fg-tertiary)" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {marchands.map((m, i) => (
                  <tr key={m.id}
                    style={{ borderBottom: i < marchands.length - 1 ? "1px solid var(--border)" : "none" }}>
                    <td className="px-6 py-4 text-[15px] font-medium" style={{ color: "var(--fg)" }}>
                      {m.nom || "—"}
                    </td>
                    <td className="px-6 py-4 text-[14px]" style={{ color: "var(--fg-secondary)" }}>
                      {m.email || "—"}
                    </td>
                    <td className="px-6 py-4 text-[14px]" style={{ color: "var(--fg-secondary)" }}>
                      {formatDate(m.date_inscription)}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 text-[12px] font-medium px-3 py-1.5 rounded-full"
                        style={{
                          background: m.actif ? "rgba(0,122,255,0.1)" : "rgba(142,142,147,0.12)",
                          color: m.actif ? "var(--accent)" : "var(--fg-secondary)",
                        }}>
                        <span className="w-1.5 h-1.5 rounded-full" style={{ background: m.actif ? "var(--accent)" : "var(--fg-tertiary)" }} />
                        {m.actif ? "Actif" : "En attente"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => toggleActif(m)}
                        disabled={toggling === m.id}
                        className="text-[13px] font-medium px-4 py-2 rounded-xl transition-all duration-200"
                        style={{
                          background: m.actif ? "rgba(255,59,48,0.08)" : "rgba(0,122,255,0.08)",
                          color: m.actif ? "#FF3B30" : "var(--accent)",
                        }}
                        onMouseEnter={e => { (e.target as HTMLElement).style.transform = "translateY(-1px)"; }}
                        onMouseLeave={e => { (e.target as HTMLElement).style.transform = "translateY(0)"; }}
                      >
                        {toggling === m.id ? "…" : m.actif ? "Désactiver" : "Activer"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </main>
  );
}
