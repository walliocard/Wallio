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
    return new Date(ts.seconds * 1000).toLocaleDateString("fr-FR");
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-[#00F5A0] border-t-transparent rounded-full animate-spin" />
      </main>
    );
  }

  const actifs = marchands.filter(m => m.actif).length;

  return (
    <main className="min-h-screen p-6">
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-2xl font-bold">Wallio Admin</h1>
            <p className="text-white/40 text-sm mt-1">{actifs} marchand{actifs > 1 ? "s" : ""} actif{actifs > 1 ? "s" : ""} · {marchands.length} au total</p>
          </div>
          <button
            onClick={() => signOut(auth).then(() => router.push("/admin/login"))}
            className="text-xs text-white/30 hover:text-white/60 transition"
          >
            Déconnexion
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: "Total marchands", value: marchands.length },
            { label: "Actifs", value: actifs },
            { label: "En attente", value: marchands.length - actifs },
          ].map(stat => (
            <div key={stat.label} className="bg-white/5 border border-white/10 rounded-2xl p-5">
              <p className="text-3xl font-bold">{stat.value}</p>
              <p className="text-white/40 text-xs mt-1">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Liste marchands */}
        <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
          {marchands.length === 0 ? (
            <div className="p-10 text-center text-white/30 text-sm">
              Aucun marchand inscrit pour le moment.
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left text-xs text-white/40 font-normal px-5 py-3">Établissement</th>
                  <th className="text-left text-xs text-white/40 font-normal px-5 py-3">Email</th>
                  <th className="text-left text-xs text-white/40 font-normal px-5 py-3">Inscription</th>
                  <th className="text-left text-xs text-white/40 font-normal px-5 py-3">Statut</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody>
                {marchands.map((m, i) => (
                  <tr key={m.id} className={i < marchands.length - 1 ? "border-b border-white/5" : ""}>
                    <td className="px-5 py-4 text-sm font-medium">{m.nom || "—"}</td>
                    <td className="px-5 py-4 text-sm text-white/50">{m.email || "—"}</td>
                    <td className="px-5 py-4 text-sm text-white/50">{formatDate(m.date_inscription)}</td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium ${
                        m.actif
                          ? "bg-[#00F5A0]/10 text-[#00F5A0]"
                          : "bg-white/5 text-white/40"
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${m.actif ? "bg-[#00F5A0]" : "bg-white/30"}`} />
                        {m.actif ? "Actif" : "En attente"}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button
                        onClick={() => toggleActif(m)}
                        disabled={toggling === m.id}
                        className={`text-xs font-medium px-3 py-1.5 rounded-lg transition disabled:opacity-50 ${
                          m.actif
                            ? "bg-red-500/10 text-red-400 hover:bg-red-500/20"
                            : "bg-[#00F5A0]/10 text-[#00F5A0] hover:bg-[#00F5A0]/20"
                        }`}
                      >
                        {toggling === m.id ? "..." : m.actif ? "Désactiver" : "Activer"}
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
