"use client";

import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import DashboardNav from "@/components/dashboard/Nav";
import RecompenseAlert from "@/components/dashboard/RecompenseAlert";
import { useLang } from "@/lib/lang-context";
import WallioLogo from "@/components/WallioLogo";
import { ToastProvider } from "@/components/Toast";
import { useRef } from "react";

function SplashScreen({ exiting }: { exiting: boolean }) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        background: "#FFFFFF",
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
  const [refreshing, setRefreshing] = useState(false);
  const touchStartY = useRef(0);
  const scrollRef = useRef<HTMLDivElement>(null);

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
    <ToastProvider>
      {showSplash && <SplashScreen exiting={splashExiting} />}
      {marchand && user && (
        <div style={{ height: "100dvh", overflow: "hidden", background: "var(--bg)" }}>
          <DashboardNav marchand={marchand} />
          <div
            ref={scrollRef}
            className="md:ml-[72px] lg:ml-[240px]"
            style={{
              height: "100dvh",
              overflowY: "auto",
              overflowX: "hidden",
              WebkitOverflowScrolling: "touch",
              background: "var(--bg)",
              animation: "page-in 0.2s ease",
            } as React.CSSProperties}
            onTouchStart={e => { touchStartY.current = e.touches[0].clientY; }}
            onTouchEnd={e => {
              const dy = e.changedTouches[0].clientY - touchStartY.current;
              const atTop = (scrollRef.current?.scrollTop ?? 0) === 0;
              if (dy > 70 && atTop && !refreshing) {
                setRefreshing(true);
                setTimeout(() => { window.location.reload(); }, 300);
              }
            }}
          >
            {refreshing && (
              <div style={{ display: "flex", justifyContent: "center", paddingTop: 16, paddingBottom: 4 }}>
                <div style={{ width: 22, height: 22, borderRadius: "50%", border: "2px solid var(--border)", borderTopColor: "var(--accent)", animation: "spin 0.7s linear infinite" }} />
                <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
              </div>
            )}
            {children}
          </div>
          <RecompenseAlert marchand={marchand} marchandId={user.uid} />
        </div>
      )}
    </ToastProvider>
  );
}
