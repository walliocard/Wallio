"use client";

import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import DashboardNav from "@/components/dashboard/Nav";
import RecompenseAlert from "@/components/dashboard/RecompenseAlert";
import { useLang } from "@/lib/lang-context";
import WallioLogo from "@/components/WallioLogo";

function SplashScreen({ exiting }: { exiting: boolean }) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        background: "var(--bg)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 20,
        animation: exiting
          ? "splash-out 0.5s cubic-bezier(.4,0,.2,1) forwards"
          : "splash-in 0.4s cubic-bezier(.4,0,.2,1) forwards",
      }}
    >
      <WallioLogo size={72} />
      <span style={{
        fontSize: 13,
        fontWeight: 700,
        letterSpacing: "0.22em",
        color: "var(--fg-tertiary)",
      }}>
        WALLIO
      </span>
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, marchand, loading } = useAuth();
  const { t, setLang } = useLang();
  const router = useRouter();

  const [showSplash, setShowSplash] = useState(true);
  const [splashExiting, setSplashExiting] = useState(false);

  useEffect(() => {
    const saved = (marchand as Record<string, unknown>)?.langue as "fr" | "ro" | "es" | undefined;
    if (saved === "fr" || saved === "ro" || saved === "es") setLang(saved);
  }, [marchand, setLang]);

  useEffect(() => {
    if (!loading && !user) router.push("/auth/connexion");
  }, [user, loading, router]);

  useEffect(() => {
    document.documentElement.classList.add("dashboard-scroll");
    document.body.classList.add("dashboard-scroll");
    return () => {
      document.documentElement.classList.remove("dashboard-scroll");
      document.body.classList.remove("dashboard-scroll");
    };
  }, []);

  // Splash exit quand loading terminé
  useEffect(() => {
    if (!loading) {
      setSplashExiting(true);
      const t = setTimeout(() => setShowSplash(false), 500);
      return () => clearTimeout(t);
    }
  }, [loading]);

  if (!user && !loading) return null;

  // Compte en attente d'activation
  if (marchand && !marchand.actif) {
    return (
      <>
        {showSplash && <SplashScreen exiting={splashExiting} />}
        <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg)", padding: "0 24px" }}>
          <div style={{ textAlign: "center", maxWidth: 360 }}>
            <div style={{ fontSize: 40, marginBottom: 20 }}>⏳</div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: "var(--fg)", marginBottom: 10 }}>
              {t.dash_pending_title}
            </h1>
            <p style={{ fontSize: 15, color: "var(--fg-sec)", lineHeight: 1.6 }}>
              {t.dash_pending_body}
            </p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      {showSplash && <SplashScreen exiting={splashExiting} />}
      {marchand && user && (
        <div style={{ height: "100dvh", overflow: "hidden", background: "var(--bg)" }}>
          <DashboardNav marchand={marchand} />
          <div
            className="md:ml-[72px] lg:ml-[240px]"
            style={{
              height: "100dvh",
              overflowY: "auto",
              WebkitOverflowScrolling: "touch",
              background: "var(--bg)",
            } as React.CSSProperties}
          >
            {children}
          </div>
          <RecompenseAlert marchand={marchand} marchandId={user.uid} />
        </div>
      )}
    </>
  );
}
