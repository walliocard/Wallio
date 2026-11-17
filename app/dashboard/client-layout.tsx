"use client";

import { useAuth } from "@/lib/auth-context";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import DashboardNav from "@/components/dashboard/Nav";
import RecompenseAlert from "@/components/dashboard/RecompenseAlert";
import { useLang } from "@/lib/lang-context";
import { ToastProvider } from "@/components/Toast";
import OfflineBanner from "@/components/OfflineBanner";
import AmbientBackground, { type AmbientVariant } from "@/components/AmbientBackground";

function getAmbientVariant(pathname: string): AmbientVariant | null {
  if (pathname === "/dashboard") return "hero";
  if (pathname === "/dashboard/clients" || pathname.startsWith("/dashboard/clients/")) return "subtle";
  if (pathname === "/dashboard/notifications") return "subtle";
  if (pathname === "/dashboard/plus") return "subtle";
  if (pathname === "/dashboard/equipe") return "subtle";
  return null;
}

// ── Layout principal ───────────────────────────────────────────────────────

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, marchand, loading } = useAuth();
  const { t, setLang } = useLang();
  const router = useRouter();
  const pathname = usePathname();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const splashRef              = useRef<any>(null);
  const splashNativeHiddenRef  = useRef(false);
  const splashDoneRef          = useRef(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pendingFinishRef       = useRef<Record<string, any> | null>(null);

  const wasAuthenticatedRef = useRef(false);

  const [refreshing, setRefreshing] = useState(false);
  const touchStartY = useRef(0);
  const scrollRef   = useRef<HTMLDivElement>(null);

  // ── Failsafe SplashScreen.hide() — débloque coquille App Store (launchAutoHide:false) ──
  // TestFlight (launchAutoHide:true) : splash déjà masqué à 1 200 ms, ces appels sont sans effet.
  useEffect(() => {
    (async () => {
      try {
        const { Capacitor } = await import("@capacitor/core");
        if (!Capacitor.isNativePlatform()) return;
        if (!Capacitor.isPluginAvailable("SplashScreen")) return;
        const { SplashScreen } = await import("@capacitor/splash-screen");
        setTimeout(() => { SplashScreen.hide({ fadeOutDuration: 0 }).catch(() => {}); }, 1500);
        setTimeout(() => { SplashScreen.hide({ fadeOutDuration: 0 }).catch(() => {}); }, 4000);
      } catch {}
    })();
  }, []);

  // ── StatusBar : overlay + dark icons (applique overlaysWebView:true sans rebuild Xcode) ──
  useEffect(() => {
    (async () => {
      try {
        const { StatusBar, Style } = await import("@capacitor/status-bar");
        await StatusBar.setOverlaysWebView({ overlay: true });
        await StatusBar.setStyle({ style: Style.Dark });
      } catch {}
    })();
  }, []);

  // ── Langue ──
  useEffect(() => {
    const saved = (marchand as Record<string, unknown>)?.langue as "fr" | "ro" | "es" | undefined;
    if (saved === "fr" || saved === "ro" || saved === "es") setLang(saved);
  }, [marchand, setLang]);

  // ── Redirect vers auth ──
  useEffect(() => {
    if (user && marchand) wasAuthenticatedRef.current = true;
  }, [user, marchand]);

  useEffect(() => {
    if (loading) return;
    const isNative = typeof window !== "undefined" && "Capacitor" in window;
    if (!user) {
      if (wasAuthenticatedRef.current && isNative) {
        window.location.replace("/dashboard/auth");
      } else {
        router.push("/dashboard/auth");
      }
      return;
    }
    if (!marchand) {
      try { localStorage.removeItem("wallio_pk_gerant"); } catch {}
      router.push("/dashboard/auth");
    }
  }, [user, marchand, loading, router]);

  // ── Class scroll dashboard ──
  useEffect(() => {
    document.documentElement.classList.add("dashboard-scroll");
    document.body.classList.add("dashboard-scroll");
    return () => {
      document.documentElement.classList.remove("dashboard-scroll");
      document.body.classList.remove("dashboard-scroll");
    };
  }, []);

  // ── Scroll vers champ actif quand clavier iOS s'ouvre ──
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const onResize = () => {
      const el = document.activeElement as HTMLElement | null;
      if (el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA")) {
        setTimeout(() => el.scrollIntoView({ behavior: "smooth", block: "center" }), 80);
      }
    };
    vv.addEventListener("resize", onResize);
    return () => vv.removeEventListener("resize", onResize);
  }, []);

  // ── enterKeyHint="next" sur tous les inputs ──
  useEffect(() => {
    const setHints = () => {
      document.querySelectorAll<HTMLInputElement>("input:not([type=submit]):not([type=button]):not([type=checkbox]):not([type=radio])").forEach(inp => {
        if (!inp.hasAttribute("enterkeyhint")) inp.setAttribute("enterkeyhint", "next");
      });
      document.querySelectorAll<HTMLTextAreaElement>("textarea").forEach(ta => {
        if (!ta.hasAttribute("enterkeyhint")) ta.setAttribute("enterkeyhint", "send");
      });
    };
    setHints();
    const obs = new MutationObserver(setHints);
    obs.observe(document.body, { childList: true, subtree: true });
    return () => obs.disconnect();
  }, []);

  // ── Mount wallio-splash + cache splash natif ──
  useEffect(() => {
    const isNative = typeof window !== "undefined" && "Capacitor" in window;
    let gone = false;
    const startTimer = setTimeout(() => {
    (async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mod = await import("@/lib/wallio-splash") as any;
      const WallioSplash = mod.WallioSplash ?? mod.default;
      if (gone) return;
      const splash = WallioSplash.mount({
        iconSrc: "/icon-pro-512.png",
        fallback: "login",
        fallbackTarget: () => document.querySelector("#login-logo"),
      });
      splashRef.current = splash;
      await splash.ready;
      if (gone) return;
      if (!isNative) {
        // PWA web : cacher le splash natif Capacitor manuellement
        try {
          const { SplashScreen: Cap } = await import("@capacitor/splash-screen");
          await Promise.race([
            Cap.hide({ fadeOutDuration: 0 }),
            new Promise<void>(r => setTimeout(r, 1500)),
          ]);
        } catch {}
      }
      // Natif : launchAutoHide:true gère le splash iOS seul — ne pas appeler Cap.hide()
      // trop tôt, sinon le splash natif se cache avant que wallio-splash soit prêt → flash
      splashNativeHiddenRef.current = true;
      if (pendingFinishRef.current) {
        splash.finish(pendingFinishRef.current);
        splashDoneRef.current = true;
        pendingFinishRef.current = null;
      }
    })();
    }, 0);
    return () => { gone = true; clearTimeout(startTimer); };
  }, []);

  // ── Termine le splash dès que la destination est connue et rendue ──
  useEffect(() => {
    if (loading) return;
    if (splashDoneRef.current) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const finish = (opts: Record<string, any>) => {
      if (splashDoneRef.current) return;
      splashDoneRef.current = true;
      if (splashRef.current && splashNativeHiddenRef.current) {
        splashRef.current.finish(opts);
      } else {
        pendingFinishRef.current = opts;
      }
    };

    if (!user && pathname === "/dashboard/auth") {
      requestAnimationFrame(() =>
        finish({ to: "login", target: document.querySelector("#login-logo") })
      );
    } else if (user && marchand) {
      finish({ to: "home" });
    }
  }, [loading, user, marchand, pathname]);

  // ── Page connexion : splash recouvre pendant la transition ──
  if (pathname === "/dashboard/auth") {
    return <>{children}</>;
  }

  // ── Pas connecté, plus de splash ──
  if (!user && !loading) {
    return null;
  }

  // ── Compte en attente d'activation ──
  if (marchand && !marchand.actif) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg)", padding: "0 24px" }}>
        <div style={{ textAlign: "center", maxWidth: 360 }}>
          <div style={{ marginBottom: 20 }}>
            <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="var(--fg-tertiary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
            </svg>
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "var(--fg)", marginBottom: 10 }}>
            {t.dash_pending_title}
          </h1>
          <p style={{ fontSize: 15, color: "var(--fg-sec)", lineHeight: 1.6 }}>
            {t.dash_pending_body}
          </p>
        </div>
      </div>
    );
  }

  // ── Reset scroll au changement de page (sinon le scrollTop persiste entre onglets) ──
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0, behavior: "instant" });
  }, [pathname]);

  // ── Scroll-to-top via tab retap ──
  useEffect(() => {
    const handler = () => scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    window.addEventListener("wallio:scroll-top", handler);
    return () => window.removeEventListener("wallio:scroll-top", handler);
  }, []);

  // ── Dashboard ──
  return (
    <ToastProvider>
      <OfflineBanner />
      {marchand && user && (() => {
        const ambientVariant = getAmbientVariant(pathname);
        return (
        <div style={{ height: "100dvh", background: "var(--bg)" }}>
          {ambientVariant && (
            <div
              className="md:ml-[72px] lg:ml-[240px]"
              style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 0, pointerEvents: "none" }}
            >
              <AmbientBackground variant={ambientVariant} />
            </div>
          )}
          <DashboardNav marchand={marchand} />
          <div
            ref={scrollRef}
            className="md:ml-[72px] lg:ml-[240px]"
            style={{
              position: "fixed",
              top: 0, left: 0, right: 0, bottom: 0,
              overflowY: "auto",
              overflowX: "hidden",
              WebkitOverflowScrolling: "touch",
              background: "transparent",
              animation: "page-in 0.2s ease",
            } as React.CSSProperties}
            onClick={e => {
              const el = e.target as HTMLElement;
              if (el.tagName !== "INPUT" && el.tagName !== "TEXTAREA" && el.tagName !== "SELECT" && el.tagName !== "BUTTON") {
                (document.activeElement as HTMLElement | null)?.blur();
              }
            }}
            onTouchStart={e => { touchStartY.current = e.touches[0].clientY; }}
            onTouchEnd={e => {
              const dy = e.changedTouches[0].clientY - touchStartY.current;
              const atTop = (scrollRef.current?.scrollTop ?? 0) === 0;
              if (dy > 70 && atTop && !refreshing) {
                setRefreshing(true);
                setTimeout(() => window.location.reload(), 300);
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
        );
      })()}
    </ToastProvider>
  );
}
