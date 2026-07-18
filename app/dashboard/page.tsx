"use client";

import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";

export default function DashboardPage() {
  const { user, marchand, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!user || !marchand?.actif)) {
      router.push("/auth/connexion");
    }
  }, [user, marchand, loading, router]);

  if (loading || !marchand) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-[#00F5A0] border-t-transparent rounded-full animate-spin" />
      </main>
    );
  }

  return (
    <main className="min-h-screen p-6">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-2xl font-bold">{marchand.nom}</h1>
            <p className="text-white/40 text-sm mt-1">Tableau de bord</p>
          </div>
          <button
            onClick={() => signOut(auth).then(() => router.push("/auth/connexion"))}
            className="text-xs text-white/30 hover:text-white/60 transition"
          >
            Déconnexion
          </button>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center">
          <p className="text-white/40 text-sm">Dashboard en construction — Brique 11</p>
        </div>
      </div>
    </main>
  );
}
