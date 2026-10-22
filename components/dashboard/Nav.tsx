"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Icons } from "./icons";
import type { Marchand } from "@/lib/loyalty";
import WallioIcon from "@/components/WallioIcon";
import ThemeToggle from "@/components/ThemeToggle";

const NAV = [
  { href: "/dashboard",                   label: "Accueil",       Icon: Icons.Home,     mobile: true  },
  { href: "/dashboard/scanner",           label: "Scanner",       Icon: Icons.Camera,   mobile: true  },
  { href: "/dashboard/clients",           label: "Clients",       Icon: Icons.Users,    mobile: true  },
  { href: "/dashboard/notifications",     label: "Notifs",        Icon: Icons.Bell,     mobile: true  },
  { href: "/dashboard/carte",             label: "Ma carte",      Icon: Icons.Card,     mobile: false },
  { href: "/dashboard/reglages",          label: "Réglages",      Icon: Icons.Settings, mobile: true  },
  { href: "/dashboard/historique",        label: "Historique",    Icon: Icons.History,  mobile: true  },
];

function active(pathname: string, href: string) {
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname === href || pathname.startsWith(href + "/");
}

function useIsDark() {
  const [isDark, setIsDark] = useState(true);
  useEffect(() => {
    function check() {
      const root = document.documentElement;
      if (root.classList.contains("dark")) { setIsDark(true); return; }
      if (root.classList.contains("light")) { setIsDark(false); return; }
      setIsDark(window.matchMedia("(prefers-color-scheme: dark)").matches);
    }
    check();
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    mq.addEventListener("change", check);
    const obs = new MutationObserver(check);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => { mq.removeEventListener("change", check); obs.disconnect(); };
  }, []);
  return isDark;
}

// Icônes remplies pour l'état actif de la nav mobile
const FilledNav: Record<string, (size: number) => React.ReactNode> = {
  "/dashboard": (s) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor" stroke="none">
      <path d="M12 3L3 12V21H9V15H15V21H21V12L12 3Z"/>
    </svg>
  ),
  "/dashboard/scanner": (s) => (
    <svg width={s} height={s} viewBox="0 0 24 24">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" fill="currentColor" stroke="none"/>
      <circle cx="12" cy="13" r="3" fill="white" stroke="none"/>
      <circle cx="12" cy="13" r="1.4" fill="currentColor" stroke="none"/>
    </svg>
  ),
  "/dashboard/clients": (s) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor" stroke="none">
      <circle cx="9" cy="7" r="4"/>
      <path d="M1 21v-2a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v2z"/>
      <path d="M19 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" opacity="0.65"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.65"/>
    </svg>
  ),
  "/dashboard/notifications": (s) => (
    <svg width={s} height={s} viewBox="0 0 24 24">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9z" fill="currentColor" stroke="none"/>
      <path d="M13.73 21a2 2 0 0 1-3.46 0" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/>
    </svg>
  ),
  "/dashboard/reglages": (s) => (
    <svg width={s} height={s} viewBox="0 0 24 24">
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" fill="currentColor" stroke="none"/>
      <circle cx="12" cy="12" r="3" fill="white" stroke="none"/>
      <circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none"/>
    </svg>
  ),
  "/dashboard/historique": (s) => (
    <svg width={s} height={s} viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="9" fill="currentColor" stroke="none"/>
      <polyline points="12 7 12 12 15 15" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
};

export default function DashboardNav({ marchand }: { marchand: Marchand }) {
  const pathname = usePathname();
  const isDark = useIsDark();
  const [springTab, setSpringTab] = useState<string | null>(null);
  const [installPrompt, setInstallPrompt] = useState<Event & { prompt: () => void } | null>(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as Event & { prompt: () => void });
    };
    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", () => setInstalled(true));
    // Déjà installée ?
    if (window.matchMedia("(display-mode: standalone)").matches) setInstalled(true);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  return (
    <>
      {/* ── Sidebar tablet/desktop ── */}
      <aside
        className="fixed left-0 top-0 bottom-0 z-40 hidden md:flex flex-col md:w-[72px] lg:w-[240px]"
        style={{
          background: "var(--glass-bg)",
          backdropFilter: "blur(30px)",
          borderRight: "1px solid var(--border)",
        }}
      >
        {/* Logo */}
        <div
          className="flex items-center h-16 px-4 lg:px-5 flex-shrink-0 gap-3"
          style={{ borderBottom: "1px solid var(--border)" }}
        >
          <WallioIcon size={32} />
          <span className="hidden lg:block font-semibold text-[15px] tracking-tight" style={{ color: "var(--fg)" }}>
            Wallio
          </span>
        </div>

        {/* Merchant info */}
        <div
          className="hidden lg:flex items-center gap-2.5 px-4 py-3 flex-shrink-0"
          style={{ borderBottom: "1px solid var(--border)" }}
        >
          <div className="w-7 h-7 rounded-lg flex-shrink-0 overflow-hidden flex items-center justify-center"
            style={{ background: (marchand as Record<string,unknown>).couleur_principale as string || "var(--accent)" }}>
            {(marchand as Record<string,unknown>).logo_url
              ? <img src={(marchand as Record<string,unknown>).logo_url as string} className="w-full h-full object-cover" alt="" />
              : <span className="text-white font-bold text-[11px]">{marchand.nom[0]?.toUpperCase()}</span>
            }
          </div>
          <p className="text-[13px] font-semibold truncate" style={{ color: "var(--fg)" }}>
            {marchand.nom}
          </p>
        </div>

        {/* Nav items */}
        <nav className="flex-1 py-3 px-2 lg:px-3 space-y-0.5 overflow-y-auto">
          {NAV.map(({ href, label, Icon }) => {
            const isActive = active(pathname, href);
            return (
              <Link
                key={href}
                href={href}
                className="relative flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-150 group"
                style={{
                  background: isActive ? "var(--wallio-gradient)" : "transparent",
                  color: isActive ? "white" : "var(--fg-secondary)",
                  boxShadow: isActive ? "0 2px 12px rgba(139,92,246,0.25)" : "none",
                }}
              >
                <span className="flex-shrink-0">
                  <Icon size={18} />
                </span>
                <span className="hidden lg:block text-[13.5px] font-medium">
                  {label}
                </span>
                {/* Tooltip tablet only */}
                <span
                  className="lg:hidden absolute left-[calc(100%+8px)] px-2.5 py-1.5 rounded-lg text-[12px] font-medium
                    opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 shadow-lg"
                  style={{ background: "var(--fg)", color: "var(--bg)" }}
                >
                  {label}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* Theme + Install + Logout */}
        <div className="flex-shrink-0 px-2 lg:px-3 py-3 space-y-2" style={{ borderTop: "1px solid var(--border)" }}>
          <div className="hidden lg:flex justify-center">
            <ThemeToggle />
          </div>

          {/* Bouton installer — visible si pas encore installée */}
          {!installed && installPrompt && (
            <button
              onClick={() => installPrompt.prompt()}
              className="relative flex items-center gap-3 w-full rounded-xl px-3 py-2.5 transition-all duration-150"
              style={{ color: "var(--accent)", background: "rgba(0,122,255,0.08)" }}
            >
              <span className="flex-shrink-0">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2v13M7 10l5 5 5-5"/><rect x="3" y="17" width="18" height="4" rx="2"/>
                </svg>
              </span>
              <span className="hidden lg:block text-[13.5px] font-medium">Installer l&apos;app</span>
            </button>
          )}

          <button
            onClick={() => signOut(auth)}
            className="relative flex items-center gap-3 w-full rounded-xl px-3 py-2.5 transition-all duration-150 group"
            style={{ color: "var(--fg-tertiary)" }}
          >
            <span className="flex-shrink-0"><Icons.LogOut size={18} /></span>
            <span className="hidden lg:block text-[13.5px] font-medium">Déconnexion</span>
            <span className="lg:hidden absolute left-[calc(100%+8px)] px-2.5 py-1.5 rounded-lg text-[12px] font-medium opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 shadow-lg"
              style={{ background: "var(--fg)", color: "var(--bg)" }}>
              Déconnexion
            </span>
          </button>
        </div>
      </aside>

      {/* ── Bottom nav mobile ── */}
      {(() => {
        const mobileNav = NAV.filter(n => n.mobile);
        const activeIdx = mobileNav.findIndex(n => active(pathname, n.href));
        const TAB_H = 60;
        const n = mobileNav.length;
        return (
          <>
          <nav
            className="md:hidden fixed z-40 flex items-stretch"
            style={{
              bottom: 0,
              left: 0,
              right: 0,
              background: isDark ? "rgba(22,22,24,0.96)" : "rgba(255,255,255,0.92)",
              backdropFilter: "blur(48px) saturate(180%)",
              WebkitBackdropFilter: "blur(48px) saturate(180%)",
              borderTop: isDark ? "0.5px solid rgba(255,255,255,0.10)" : "0.5px solid rgba(0,0,0,0.08)",
              paddingBottom: "env(safe-area-inset-bottom, 0px)",
              position: "fixed",
            }}
          >
            {/* Indicateur slide — bloc pleine hauteur, légèrement arrondi, gradient Wallio subtil */}
            {activeIdx >= 0 && (
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  height: TAB_H,
                  width: `${100 / n}%`,
                  left: `${(activeIdx / n) * 100}%`,
                  background: isDark
                    ? "linear-gradient(135deg, rgba(0,122,255,0.13), rgba(139,92,246,0.08))"
                    : "linear-gradient(135deg, rgba(0,122,255,0.09), rgba(139,92,246,0.05))",
                  transition: "left 0.28s cubic-bezier(.4,0,.2,1)",
                  pointerEvents: "none",
                  borderRadius: 10,
                }}
              />
            )}
            {mobileNav.map(({ href, Icon, label }) => {
              const isActive = active(pathname, href);
              const isSpring = springTab === href;
              const FilledIconFn = FilledNav[href];
              return (
                <Link
                  key={href}
                  href={href}
                  className="flex flex-col items-center justify-center gap-0.5"
                  style={{
                    flex: 1,
                    height: TAB_H,
                    color: isActive
                      ? (isDark ? "white" : "#007AFF")
                      : (isDark ? "rgba(255,255,255,0.38)" : "rgba(0,0,0,0.30)"),
                    transition: "color 0.22s cubic-bezier(.4,0,.2,1)",
                    position: "relative",
                    zIndex: 1,
                  }}
                  onClick={() => { setSpringTab(href); setTimeout(() => setSpringTab(null), 380); }}
                >
                  <span style={{ animation: isSpring ? "tab-bounce 0.38s cubic-bezier(.34,1.56,.64,1)" : undefined, display: "flex" }}>
                    {isActive && FilledIconFn ? FilledIconFn(22) : <Icon size={22} />}
                  </span>
                  <span style={{
                    fontSize: isActive ? 10 : 9,
                    fontWeight: isActive ? 700 : 500,
                    letterSpacing: "0.02em",
                    lineHeight: 1,
                    transition: "font-size 0.2s ease",
                  }}>
                    {label}
                  </span>
                </Link>
              );
            })}
          </nav>
          {/* Couvre la safe area en bas dans l'app native Capacitor */}
          <div
            className="md:hidden fixed z-40"
            style={{
              bottom: 0,
              left: 0,
              right: 0,
              height: "env(safe-area-inset-bottom, 0px)",
              background: isDark ? "rgba(22,22,24,0.96)" : "rgba(255,255,255,0.92)",
            }}
          />
          </>
        );
      })()}
    </>
  );
}
