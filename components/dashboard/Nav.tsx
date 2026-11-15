"use client";

import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Icons } from "./icons";
import type { Marchand } from "@/lib/loyalty";
import WallioIcon from "@/components/WallioIcon";
import { haptic } from "@/lib/haptics";

// ── Onglets mobiles (hors bouton scanner central) ──────────────────────────────
const LEFT_TABS = [
  { href: "/dashboard",           label: "Accueil",  key: "home"    },
  { href: "/dashboard/clients",   label: "Clients",  key: "clients" },
];
const RIGHT_TABS = [
  { href: "/dashboard/notifications", label: "Notifs", key: "notifs" },
  { href: "/dashboard/plus",          label: "Plus",   key: "plus"   },
];

// Routes qui rendent l'onglet "Plus" actif
const PLUS_ROUTES = [
  "/dashboard/plus",
  "/dashboard/reglages",
  "/dashboard/historique",
  "/dashboard/carte",
  "/dashboard/equipe",
];

// Sidebar desktop — tous les items
const SIDEBAR_NAV = [
  { href: "/dashboard",               label: "Accueil",     Icon: Icons.Home     },
  { href: "/dashboard/scanner",       label: "Scanner",     Icon: Icons.QrViewfinder },
  { href: "/dashboard/clients",       label: "Clients",     Icon: Icons.Users    },
  { href: "/dashboard/notifications", label: "Notifs",      Icon: Icons.Bell     },
  { href: "/dashboard/reglages",      label: "Réglages",    Icon: Icons.Settings },
  { href: "/dashboard/historique",    label: "Historique",  Icon: Icons.History  },
  { href: "/dashboard/carte",         label: "Ma carte",    Icon: Icons.Card     },
];

function isActive(pathname: string, href: string) {
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname === href || pathname.startsWith(href + "/");
}
function isPlusActive(pathname: string) {
  return PLUS_ROUTES.some(r => pathname === r || pathname.startsWith(r + "/"));
}

function useIsNative() {
  const [isNative, setIsNative] = useState(false);
  useEffect(() => {
    const cap = (window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor;
    setIsNative(cap?.isNativePlatform?.() ?? window.matchMedia("(display-mode: standalone)").matches);
  }, []);
  return isNative;
}

// ── Icône active (trait épais + fill 15%) ─────────────────────────────────────
function TabIcon({ href, size }: { href: string; size: number }) {
  if (href === "/dashboard") return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" stroke="none">
      <path d="M12 3L3 12V21H9V15H15V21H21V12L12 3Z"/>
    </svg>
  );
  if (href === "/dashboard/clients") return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" stroke="none">
      <circle cx="9" cy="7" r="4"/>
      <path d="M1 21v-2a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v2z"/>
      <path d="M19 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" opacity="0.55"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" opacity="0.55"/>
    </svg>
  );
  if (href === "/dashboard/notifications") return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" stroke="none">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9z"/>
      <path d="M13.73 21a2 2 0 0 1-3.46 0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );
  if (href === "/dashboard/plus") return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" stroke="none">
      <circle cx="12" cy="12" r="10"/>
      <circle cx="8"  cy="12" r="1.1" fill="white"/>
      <circle cx="12" cy="12" r="1.1" fill="white"/>
      <circle cx="16" cy="12" r="1.1" fill="white"/>
    </svg>
  );
  return null;
}

export default function DashboardNav({ marchand }: { marchand: Marchand }) {
  const pathname = usePathname();
  const router = useRouter();
  const isNative = useIsNative();
  const [bounce, setBounce] = useState<string | null>(null);
  const [scannerPressed, setScannerPressed] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<Event & { prompt: () => void } | null>(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => { e.preventDefault(); setInstallPrompt(e as Event & { prompt: () => void }); };
    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", () => setInstalled(true));
    if (window.matchMedia("(display-mode: standalone)").matches) setInstalled(true);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  function handleTabTap(href: string) {
    // Remonter en haut si déjà sur cet onglet
    if (pathname === href || (href === "/dashboard/plus" && isPlusActive(pathname) && pathname !== "/dashboard/plus")) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
    setBounce(href);
    setTimeout(() => setBounce(null), 380);
    haptic("light");
  }

  function handleScannerTap() {
    setScannerPressed(true);
    setTimeout(() => setScannerPressed(false), 150);
    haptic("medium");
    router.push("/dashboard/scanner");
  }

  // ── Icône outline (inactif) ───────────────────────────────────────────────
  function OutlineIcon({ href, size }: { href: string; size: number }) {
    if (href === "/dashboard") return <Icons.Home size={size} />;
    if (href === "/dashboard/clients") return <Icons.Users size={size} />;
    if (href === "/dashboard/notifications") return <Icons.Bell size={size} />;
    if (href === "/dashboard/plus") return <Icons.MoreCircle size={size} />;
    return null;
  }

  const ALL_TABS = [...LEFT_TABS, ...RIGHT_TABS];

  return (
    <>
      {/* ── Sidebar desktop/tablet ─────────────────────────────────────────── */}
      <aside
        className="fixed left-0 top-0 bottom-0 z-40 hidden md:flex flex-col md:w-[72px] lg:w-[240px]"
        style={{ background: "var(--glass-bg)", backdropFilter: "blur(30px)", borderRight: "1px solid var(--border)" }}
      >
        <div className="flex items-center h-16 px-4 lg:px-5 flex-shrink-0 gap-3" style={{ borderBottom: "1px solid var(--border)" }}>
          <WallioIcon size={32} />
          <span className="hidden lg:block font-semibold text-[15px] tracking-tight" style={{ color: "var(--fg)" }}>Wallio</span>
        </div>
        <div className="hidden lg:flex items-center gap-2.5 px-4 py-3 flex-shrink-0" style={{ borderBottom: "1px solid var(--border)" }}>
          <div className="w-7 h-7 rounded-lg flex-shrink-0 overflow-hidden flex items-center justify-center"
            style={{ background: (marchand as Record<string,unknown>).couleur_principale as string || "var(--accent)" }}>
            {(marchand as Record<string,unknown>).logo_url
              ? <img src={(marchand as Record<string,unknown>).logo_url as string} className="w-full h-full object-cover" alt="" />
              : <span className="text-white font-bold text-[11px]">{marchand.nom[0]?.toUpperCase()}</span>}
          </div>
          <p className="text-[13px] font-semibold truncate" style={{ color: "var(--fg)" }}>{marchand.nom}</p>
        </div>
        <nav className="flex-1 py-3 px-2 lg:px-3 space-y-0.5 overflow-y-auto">
          {SIDEBAR_NAV.map(({ href, label, Icon }) => {
            const active = isActive(pathname, href);
            return (
              <Link key={href} href={href}
                className="relative flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-150 group"
                style={{ background: active ? "var(--wallio-gradient)" : "transparent", color: active ? "white" : "var(--fg-secondary)", boxShadow: active ? "0 2px 12px rgba(139,92,246,0.25)" : "none" }}>
                <span className="flex-shrink-0"><Icon size={18} /></span>
                <span className="hidden lg:block text-[13.5px] font-medium">{label}</span>
                <span className="lg:hidden absolute left-[calc(100%+8px)] px-2.5 py-1.5 rounded-lg text-[12px] font-medium opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 shadow-lg"
                  style={{ background: "var(--fg)", color: "var(--bg)" }}>{label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="flex-shrink-0 px-2 lg:px-3 py-3 space-y-2" style={{ borderTop: "1px solid var(--border)" }}>
          {!installed && installPrompt && (
            <button onClick={() => installPrompt.prompt()}
              className="relative flex items-center gap-3 w-full rounded-xl px-3 py-2.5 transition-all duration-150"
              style={{ color: "var(--accent)", background: "rgba(47,123,255,0.08)" }}>
              <span className="flex-shrink-0">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2v13M7 10l5 5 5-5"/><rect x="3" y="17" width="18" height="4" rx="2"/>
                </svg>
              </span>
              <span className="hidden lg:block text-[13.5px] font-medium">Installer l&apos;app</span>
            </button>
          )}
          <button onClick={() => signOut(auth)}
            className="relative flex items-center gap-3 w-full rounded-xl px-3 py-2.5 transition-all duration-150 group"
            style={{ color: "var(--fg-tertiary)" }}>
            <span className="flex-shrink-0"><Icons.LogOut size={18} /></span>
            <span className="hidden lg:block text-[13.5px] font-medium">Déconnexion</span>
            <span className="lg:hidden absolute left-[calc(100%+8px)] px-2.5 py-1.5 rounded-lg text-[12px] font-medium opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 shadow-lg"
              style={{ background: "var(--fg)", color: "var(--bg)" }}>Déconnexion</span>
          </button>
        </div>
      </aside>

      {/* ── Tab bar mobile ─────────────────────────────────────────────────── */}
      <nav
        className="md:hidden fixed z-40 left-0 right-0 bottom-0"
        style={{
          background: "rgba(255,255,255,0.88)",
          backdropFilter: "blur(40px) saturate(180%)",
          WebkitBackdropFilter: "blur(40px) saturate(180%)",
          borderTop: "0.5px solid rgba(0,0,0,0.10)",
          paddingBottom: isNative ? "env(safe-area-inset-bottom, 0px)" : "0px",
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-end", height: "var(--tab-h, 49px)" }}>

          {/* Onglets gauche */}
          {LEFT_TABS.map(({ href, label }) => {
            const active = isActive(pathname, href);
            const isBouncing = bounce === href;
            return (
              <Link key={href} href={href}
                onClick={() => handleTabTap(href)}
                style={{ flex: 1, height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 3, color: active ? "var(--accent)" : "#8E8E93", textDecoration: "none" }}>
                <span style={{ animation: isBouncing ? "tab-bounce 0.38s cubic-bezier(.34,1.56,.64,1)" : undefined, display: "flex" }}>
                  {active
                    ? <TabIcon href={href} size={24} />
                    : <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                        {href === "/dashboard" && <><path d="M3 12L12 3L21 12V21H15V15H9V21H3V12Z"/></>}
                        {href === "/dashboard/clients" && <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></>}
                      </svg>
                  }
                </span>
                <span style={{ fontSize: 10, fontWeight: active ? 600 : 400, letterSpacing: "0.01em", lineHeight: 1 }}>{label}</span>
              </Link>
            );
          })}

          {/* Bouton Scanner central */}
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>
            <button
              onPointerDown={() => { setScannerPressed(true); }}
              onPointerUp={() => { setScannerPressed(false); handleScannerTap(); }}
              onPointerLeave={() => setScannerPressed(false)}
              style={{
                width: 54, height: 54,
                borderRadius: "50%",
                background: "linear-gradient(135deg, #2F7BFF 0%, #8B5CF6 100%)",
                border: "none",
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "0 4px 16px rgba(47,123,255,0.40), 0 1px 4px rgba(0,0,0,0.12)",
                transform: `translateY(-10px) scale(${scannerPressed ? 0.92 : 1})`,
                transition: "transform 0.15s cubic-bezier(.34,1.56,.64,1), box-shadow 0.15s ease",
                cursor: "pointer",
                WebkitTapHighlightColor: "transparent",
              } as React.CSSProperties}
            >
              <svg width={26} height={26} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 7V5a2 2 0 0 1 2-2h2"/>
                <path d="M17 3h2a2 2 0 0 1 2 2v2"/>
                <path d="M21 17v2a2 2 0 0 1-2 2h-2"/>
                <path d="M7 21H5a2 2 0 0 1-2-2v-2"/>
                <rect x="7" y="7" width="3.5" height="3.5" rx="0.5"/>
                <rect x="13.5" y="7" width="3.5" height="3.5" rx="0.5"/>
                <rect x="7" y="13.5" width="3.5" height="3.5" rx="0.5"/>
                <circle cx="15.25" cy="15.25" r="1.25" fill="white" stroke="none"/>
                <line x1="13.5" y1="17.5" x2="17" y2="17.5"/>
                <line x1="17" y1="13.5" x2="17" y2="17.5"/>
              </svg>
            </button>
          </div>

          {/* Onglets droite */}
          {RIGHT_TABS.map(({ href, label }) => {
            const active = href === "/dashboard/plus" ? isPlusActive(pathname) : isActive(pathname, href);
            const isBouncing = bounce === href;
            return (
              <Link key={href} href={href}
                onClick={() => handleTabTap(href)}
                style={{ flex: 1, height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 3, color: active ? "var(--accent)" : "#8E8E93", textDecoration: "none" }}>
                <span style={{ animation: isBouncing ? "tab-bounce 0.38s cubic-bezier(.34,1.56,.64,1)" : undefined, display: "flex" }}>
                  {active
                    ? <TabIcon href={href} size={24} />
                    : <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                        {href === "/dashboard/notifications" && <><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></>}
                        {href === "/dashboard/plus" && <><circle cx="12" cy="12" r="10"/><circle cx="8" cy="12" r="1" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1" fill="currentColor" stroke="none"/><circle cx="16" cy="12" r="1" fill="currentColor" stroke="none"/></>}
                      </svg>
                  }
                </span>
                <span style={{ fontSize: 10, fontWeight: active ? 600 : 400, letterSpacing: "0.01em", lineHeight: 1 }}>{label}</span>
              </Link>
            );
          })}

        </div>
      </nav>
    </>
  );
}
