"use client";

import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import DashboardNav from "@/components/dashboard/Nav";
import RecompenseAlert from "@/components/dashboard/RecompenseAlert";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, marchand, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.push("/auth/connexion");
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg)" }}>
        <div
          className="w-6 h-6 rounded-full border-2 animate-spin"
          style={{ borderColor: "var(--border)", borderTopColor: "var(--accent)" }}
        />
      </div>
    );
  }

  if (!user) return null;

  // Compte en attente d'activation
  if (marchand && !marchand.actif) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg)", padding: "0 24px" }}>
        <div style={{ textAlign: "center", maxWidth: 360 }}>
          <div style={{ fontSize: 40, marginBottom: 20 }}>⏳</div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "var(--fg)", marginBottom: 10 }}>
            Compte en attente d&apos;activation
          </h1>
          <p style={{ fontSize: 15, color: "var(--fg-sec)", lineHeight: 1.6 }}>
            Ton compte a bien été créé. Notre équipe va l&apos;activer sous peu — tu recevras un email dès que c&apos;est fait.
          </p>
        </div>
      </div>
    );
  }

  if (!marchand) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg)" }}>
      <div className="w-6 h-6 rounded-full border-2 animate-spin"
        style={{ borderColor: "var(--border)", borderTopColor: "var(--accent)" }} />
    </div>
  );

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      <DashboardNav marchand={marchand} />
      <div className="md:ml-[72px] lg:ml-[240px] min-h-screen">
        {children}
      </div>
      <RecompenseAlert marchand={marchand} marchandId={user.uid} />
    </div>
  );
}
