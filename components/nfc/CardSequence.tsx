"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import type { TamponResult, Client, Marchand } from "@/lib/loyalty";
import type { StampResult } from "@/components/StampPage";
import { buildPassData, type PassData } from "@/lib/pass-data";
import CardPreview, { type CardPhase, type CardState } from "./CardPreview";

const GOOGLE_ENABLED = process.env.NEXT_PUBLIC_GOOGLE_WALLET_ENABLED === "true";

type Phase = "preload" | "in" | "stamp" | "out" | "result";

interface Props {
  result: StampResult;
  fresh?: boolean;      // false = résultat depuis cache → skip direct vers result
  onRetry: () => void;
}

export default function CardSequence({ result, fresh = true, onRetry }: Props) {
  // Si résultat depuis dead flag (back/reload), skip la séquence carte
  const [phase, setPhase] = useState<Phase>(fresh ? "preload" : "result");
  const stampRootRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<any>(null);
  const slotBuilt = useRef(false);
  const bannerRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);

  const { result: res, client, marchand } = result;
  const pass = buildPassData(marchand, client);
  const mn = marchand as Record<string, unknown>;

  // Map TamponResult to card state
  const cardState: CardState =
    res.type === "recompense" ? "reward"
    : res.type === "anti_doublon" ? "duplicate"
    : client.tampons === 0 && (res as any).tampons === 1 ? "first"
    : "stamp";

  const before = res.type === "ok" ? Math.max(0, res.tampons - ((res as any).double ? 2 : 1))
    : res.type === "recompense" ? Math.max(0, res.tampons - 1)
    : res.type === "anti_doublon" ? res.tampons
    : res.type === "choix_requis" ? client.tampons
    : client.tampons;

  const after = "tampons" in res ? res.tampons : client.tampons;

  const mode: "cyclic" | "progressive" | "flex" =
    mn.mode_recompense === "progressif" ? "progressive"
    : mn.mode_recompense === "flex" ? "flex"
    : "cyclic";

  const goal = (mn.objectif_tampons as number) || 10;

  // Skip to result immediately (tap or cached result)
  const skipToResult = useCallback(() => setPhase("result"), []);

  // Preload images then start card-in
  useEffect(() => {
    if (phase !== "preload") return;
    const imgs = [pass.strip, pass.logo].filter(Boolean) as string[];
    const loads = imgs.map(src => {
      const img = new Image();
      img.src = src;
      return img.decode().catch(() => {});
    });
    Promise.race([
      Promise.all(loads),
      new Promise<void>(r => setTimeout(r, 1500)),
    ]).then(() => setPhase("in"));
  }, [phase, pass.strip, pass.logo]);

  // Phase progression
  useEffect(() => {
    if (phase === "in") {
      const t = setTimeout(() => setPhase("stamp"), 700);
      return () => clearTimeout(t);
    }
    if (phase === "stamp") {
      const t = setTimeout(() => setPhase("out"), 950);
      return () => clearTimeout(t);
    }
    if (phase === "out") {
      const t = setTimeout(() => setPhase("result"), 500);
      return () => clearTimeout(t);
    }
  }, [phase]);

  // Mount WallioStamp module when result page appears
  useEffect(() => {
    if (phase !== "result" || !stampRootRef.current || slotBuilt.current) return;
    slotBuilt.current = true;

    import("@/lib/wallio-stamp.js").then((m: any) => {
      if (!stampRootRef.current) return;

      const mc = pass.backgroundColor;
      const rgb = hexRgb(mc);

      // Inject CSS after module (wins cascade)
      const styleEl = document.createElement("style");
      styleEl.setAttribute("data-wallio-seq", "");
      styleEl.textContent = [
        `.ws-main{padding-bottom:0;justify-content:flex-start;padding-top:16px}`,
        `.ws-slot{margin-top:12px}`,
        `.ws-left{display:none}`,
        `.ws-of{color:#AEAEB2;font-weight:400;font-size:18px}`,
        `.ws-note{color:#1D1D1F;font-weight:600;font-size:15px;margin-top:10px}`,
        `.ws-bar{height:3px;gap:2px;margin-top:14px;align-items:center}`,
        `.ws-bar i{flex:1;height:3px;border-radius:2px;overflow:hidden}`,
        `.ws-bar i b{border-radius:2px}`,
        `.ws-prog{background:rgba(${rgb},0.05)!important;border:1px solid rgba(${rgb},0.18)!important;box-shadow:none!important}`,
        `.ws-big .ws-roll{color:${mc}}`,
        `.ws-bar i{background:rgba(${rgb},0.12)!important}`,
        `.ws-bar i b{background:${mc}!important}`,
        // Hide the head section — banner header replaces it
        `.ws-head{display:none!important}`,
        `.ws-title{font-size:0!important;margin:0!important}`,
        `.ws-sub{font-size:0!important;margin:0!important}`,
        `.ws-bg{display:none!important}`,
      ].join("");
      document.head.appendChild(styleEl);

      wsRef.current = m.WallioStamp.mount(stampRootRef.current, {
        merchant: { name: marchand.nom, logo: pass.logo, color: pass.backgroundColor },
        bgStyle: "flat",
        onRetry,
        onChoose: async (choice: "small" | "big") => {
          try {
            const r = await fetch("/api/nfc/enregistrer-choix", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ walletId: client.wallet_id, marchandId: marchand.id, choix: choice === "small" ? "petit" : "grand" }),
            });
            const data = await r.json();
            return !!(data.ok || data.already_done);
          } catch { return false; }
        },
      });

      // Build slot
      buildSlot(wsRef.current.slot, client, mn, pass);

      // Map params and play
      const params = mapParams(res, client, marchand);
      wsRef.current.play(params);

      // Inject prenom subtitle
      if (client.prenom && stampRootRef.current) {
        const subEl = stampRootRef.current.querySelector(".ws-sub") as HTMLElement | null;
        if (subEl) { subEl.textContent = `Bonjour ${client.prenom} !`; subEl.style.display = ""; }
      }
    });

    return () => {
      wsRef.current?.destroy();
      wsRef.current = null;
      document.querySelector("style[data-wallio-seq]")?.remove();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  // ── Banner header background color (for seamless Dynamic Island)
  useEffect(() => {
    const topBg = blendWithWhite(pass.backgroundColor, 0.08);
    const prevHtml = document.documentElement.style.backgroundColor;
    const prevBody = document.body.style.backgroundColor;
    document.documentElement.style.backgroundColor = topBg;
    document.body.style.backgroundColor = topBg;
    return () => {
      document.documentElement.style.backgroundColor = prevHtml;
      document.body.style.backgroundColor = prevBody;
    };
  }, [pass.backgroundColor]);

  const hasWallet = !!((client as any).wallet_type || (client as any).apns_push_token);
  const isAndroid = typeof navigator !== "undefined" && /android/i.test(navigator.userAgent);

  // ── Render ────────────────────────────────────────────────────────────────

  if (phase === "result") return (
    <ResultPage
      pass={pass}
      result={res}
      client={client}
      marchand={marchand}
      cardState={cardState}
      before={before}
      after={after}
      goal={goal}
      stampRootRef={stampRootRef}
      hasWallet={hasWallet}
      isAndroid={isAndroid}
    />
  );

  // Card sequence overlay
  const cardPhase: CardPhase = phase === "in" ? "in" : phase === "stamp" ? "stamp" : "out";
  const bgColor = blendWithWhite(pass.backgroundColor, 0.05);

  return (
    <div
      onClick={skipToResult}
      style={{
        position: "fixed", inset: 0, zIndex: 50,
        background: bgColor,
        display: "flex", flexDirection: "column",
        paddingTop: "env(safe-area-inset-top)",
        fontFamily: "-apple-system,'SF Pro Text',sans-serif",
      }}
    >
      {/* Card */}
      <div style={{ flex: 1, position: "relative" }}>
        {phase !== "preload" && (
          <CardPreview
            pass={pass}
            phase={cardPhase}
            state={cardState}
            before={before}
            after={after}
            goal={goal}
          />
        )}
        {phase === "preload" && (
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <style>{`@keyframes wpulse{0%,100%{opacity:.3;transform:scale(.88)}50%{opacity:1;transform:scale(1)}}`}</style>
            {pass.logo ? (
              <img src={pass.logo} alt="" style={{
                width: 72, height: 72, borderRadius: pass.logoShape === "round" ? "50%" : 18,
                objectFit: "cover", animation: "wpulse 1.6s ease-in-out infinite",
              }} />
            ) : (
              <div style={{
                width: 72, height: 72, borderRadius: 18,
                background: pass.backgroundColor, opacity: 0.6,
                animation: "wpulse 1.6s ease-in-out infinite",
              }} />
            )}
          </div>
        )}
      </div>

      {/* Skip hint */}
      {phase !== "preload" && (
        <div style={{
          textAlign: "center", fontSize: 12, color: "rgba(0,0,0,0.3)",
          paddingBottom: "max(16px, env(safe-area-inset-bottom))",
          animation: "fadeIn .4s .8s both",
        }}>
          <style>{`@keyframes fadeIn{from{opacity:0}to{opacity:1}}`}</style>
          Touchez pour passer
        </div>
      )}
    </div>
  );
}

// ─── Result page (Option B — bannière en en-tête) ─────────────────────────────

function ResultPage({ pass, result, client, marchand, cardState, before, after, goal, stampRootRef, hasWallet, isAndroid }: {
  pass: PassData;
  result: TamponResult;
  client: Client;
  marchand: Marchand;
  cardState: CardState;
  before: number;
  after: number;
  goal: number;
  stampRootRef: React.RefObject<HTMLDivElement | null>;
  hasWallet: boolean;
  isAndroid: boolean;
}) {
  const mn = marchand as Record<string, unknown>;
  const title = cardState === "first" ? `Bienvenue chez ${marchand.nom}`
    : cardState === "reward" ? "Récompense débloquée"
    : cardState === "duplicate" ? "Déjà tamponné"
    : "Tampon ajouté";

  const bannerH = 220;
  const fg = pass.foregroundColor;
  const bg = pass.backgroundColor;

  return (
    <main style={{
      minHeight: "100dvh", display: "flex", flexDirection: "column",
      fontFamily: "-apple-system,'SF Pro Text',sans-serif",
      WebkitFontSmoothing: "antialiased",
      background: "#F5F6FA",
    }}>
      {/* Banner header */}
      <div style={{
        position: "relative", height: bannerH, overflow: "hidden", flexShrink: 0,
        animation: "bannerIn 0.5s cubic-bezier(.22,1,.36,1) both",
      }}>
        <style>{`
          @keyframes bannerIn{from{opacity:0;transform:scale(1.04)}to{opacity:1;transform:scale(1)}}
          @keyframes contentIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
          @keyframes slotIn{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        `}</style>

        {/* Strip image */}
        {pass.strip ? (
          <img src={pass.strip} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
        ) : (
          <div style={{ width: "100%", height: "100%", background: bg }} />
        )}

        {/* Gradient overlay — fades banner into page background */}
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(to bottom, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0) 40%, #F5F6FA 100%)",
        }} />

        {/* Content overlaid on banner */}
        <div style={{
          position: "absolute", inset: 0,
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "flex-end",
          paddingTop: "calc(env(safe-area-inset-top) + 12px)",
          paddingBottom: 20,
          animation: "contentIn 0.5s 0.1s cubic-bezier(.22,1,.36,1) both",
        }}>
          {/* Logo */}
          {pass.logo && (
            <div style={{
              width: 52, height: 52, borderRadius: pass.logoShape === "round" ? "50%" : 14,
              overflow: "hidden", marginBottom: 10,
              boxShadow: "0 4px 16px rgba(0,0,0,0.3)",
            }}>
              <img src={pass.logo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
          )}

          {/* +1 badge */}
          <div style={{
            width: 42, height: 42, borderRadius: "50%",
            background: bg,
            boxShadow: `0 6px 20px rgba(0,0,0,0.25)`,
            display: "flex", alignItems: "center", justifyContent: "center",
            marginBottom: 8,
          }}>
            {cardState === "reward"
              ? <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={fg} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 7v14"/><path d="M20 11v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-8"/><path d="M7.5 7a1 1 0 0 1 0-5A4.8 8 0 0 1 12 7a4.8 8 0 0 1 4.5-5 1 1 0 0 1 0 5"/><rect x="3" y="7" width="18" height="4" rx="1"/></svg>
              : cardState === "duplicate"
              ? <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={fg} strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
              : <span style={{ fontSize: 18, fontWeight: 700, color: fg }}>+1</span>}
          </div>

          {/* Merchant name + title */}
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.75)", fontWeight: 500, marginBottom: 2 }}>{pass.logoText}</p>
          <p style={{ fontSize: 20, fontWeight: 700, color: "#FFFFFF", letterSpacing: -0.4, textShadow: "0 1px 6px rgba(0,0,0,0.3)" }}>{title}</p>
        </div>
      </div>

      {/* WallioStamp module (progress section) */}
      <div ref={stampRootRef} style={{
        flex: 1,
        animation: "slotIn 0.5s 0.2s cubic-bezier(.22,1,.36,1) both",
      }} />
    </main>
  );
}

// ─── Slot content ─────────────────────────────────────────────────────────────

function buildSlot(slot: HTMLElement, client: Client, mn: Record<string, unknown>, pass: PassData) {
  const isAndroid = /android/i.test(navigator.userAgent);
  const hasWallet = !!((client as any).wallet_type || (client as any).apns_push_token);
  const hasFcmToken = !!((client as any).fcm_token);
  const walletId = client.wallet_id;

  const mk = <T extends HTMLElement>(tag: string) => document.createElement(tag) as T;

  // Install banner
  const installEl = mk<HTMLDivElement>("div");
  slot.appendChild(installEl);
  import("@/lib/wallio-install.js").then((m: any) =>
    m.WallioInstall.mount(installEl, {
      icon: "/wallio-instagram-profil.png",
      theme: { brand: "#007AFF", brandSoft: "rgba(0,122,255,0.08)" },
      texts: { perks: [] },
    })
  );

  // Wallet button (only if not yet in Wallet)
  if (!hasWallet) {
    const a = mk<HTMLAnchorElement>("a");
    if (!isAndroid) {
      a.href = `/api/apple-wallet/generate/${walletId}`;
      a.style.cssText = btnStyle("#000");
      a.innerHTML = walletSvg("white") + "Ajouter à Apple Wallet";
    } else if (GOOGLE_ENABLED) {
      a.href = `/api/google-wallet/generate/${walletId}`;
      a.style.cssText = btnStyle("#1a73e8");
      a.innerHTML = walletSvg("white") + "Ajouter à Google Wallet";
    }
    if (a.href) slot.appendChild(a);
  }

  // "Voir toutes mes cartes" — prominent gradient button
  const cardsA = mk<HTMLAnchorElement>("a");
  cardsA.href = "/mes-cartes";
  cardsA.style.cssText = btnStyle("linear-gradient(135deg,#007AFF,#8B5CF6)");
  cardsA.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2" y="5" width="20" height="14" rx="3"/><path d="M2 10h20"/></svg>Voir toutes mes cartes`;
  slot.appendChild(cardsA);

  // Notifications
  if (!hasFcmToken && "Notification" in window && Notification.permission !== "denied") {
    const btn = mk<HTMLButtonElement>("button");
    btn.type = "button";
    btn.style.cssText = "display:flex;align-items:center;justify-content:center;gap:8px;margin:4px 16px 0;padding:12px;border-radius:13px;border:1.5px solid rgba(91,124,250,0.3);background:rgba(91,124,250,0.06);color:#5B7CFA;font-size:14px;font-weight:600;font-family:inherit;cursor:pointer;width:calc(100% - 32px);box-sizing:border-box";
    btn.innerHTML = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>Activer les notifications`;
    btn.onclick = async () => {
      btn.disabled = true;
      try {
        const perm = await Notification.requestPermission();
        if (perm !== "granted") { btn.style.display = "none"; return; }
        const { registerFcmToken } = await import("@/lib/fcm");
        const token = await registerFcmToken();
        if (!token) { btn.disabled = false; return; }
        const { doc, updateDoc } = await import("firebase/firestore");
        const { db } = await import("@/lib/firebase");
        await updateDoc(doc(db, "clients", client.id), { fcm_token: token });
        btn.style.display = "none";
      } catch { btn.disabled = false; }
    };
    slot.appendChild(btn);
  }

  // Notifications management link
  const lnk = mk<HTMLAnchorElement>("a");
  lnk.href = `/preferences/${walletId}`;
  lnk.textContent = "Gérer mes notifications";
  lnk.style.cssText = "display:block;text-align:center;font-size:11px;color:#C7C7CC;text-decoration:none;padding:6px 0 2px";
  slot.appendChild(lnk);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function mapParams(result: TamponResult, client: Client, marchand: Marchand) {
  const mn = marchand as Record<string, unknown>;
  const c = client as Record<string, unknown>;
  const mode: "cyclic" | "progressive" | "flex" =
    mn.mode_recompense === "progressif" ? "progressive"
    : mn.mode_recompense === "flex" ? "flex"
    : "cyclic";
  const goal = (mn.objectif_tampons as number) || 10;
  const reward = (mn.nom_recompense as string) || "";
  const milestones = ((mn.paliers as { tampons: number; recompense: string }[] | undefined) || [])
    .map(p => ({ at: p.tampons, reward: p.recompense }));
  const flex = mode === "flex" ? {
    at: (mn.palier_intermediaire as number) || 5,
    small: (mn.nom_recompense_petit as string) || "",
    big: (mn.nom_recompense_grand as string) || "",
    choice: c.choix_fait === "petit" ? "small" as const : c.choix_fait === "grand" ? "big" as const : null,
  } : null;

  let state: "stamp" | "reward" | "choice" | "duplicate" | "error";
  let before: number, after: number, delay = "";
  switch (result.type) {
    case "ok": state = "stamp"; after = result.tampons; before = Math.max(0, after - ((result as any).double ? 2 : 1)); break;
    case "recompense": state = "reward"; after = result.tampons; before = Math.max(0, after - 1); break;
    case "anti_doublon": {
      state = "duplicate"; before = after = result.tampons;
      const s = result.secondes_restantes;
      delay = s >= 86400 ? "demain" : s >= 3600 ? `dans ${Math.ceil(s / 3600)} h` : `dans ${Math.ceil(s / 60)} min`;
      break;
    }
    case "choix_requis": state = "choice"; before = client.tampons; after = result.tampons; break;
    default: state = "error"; before = after = client.tampons;
  }
  return { mode, state, before, after, goal, reward, rawReward: result.type === "recompense" ? result.nom_recompense : reward, delay, milestones, flex };
}

function hexRgb(hex: string): string {
  const h = hex.replace("#", "").padEnd(6, "0");
  return [0, 2, 4].map(i => parseInt(h.substring(i, i + 2), 16)).join(",");
}

function blendWithWhite(hex: string, alpha: number): string {
  const [r, g, b] = hexRgb(hex).split(",").map(Number);
  const mix = (c: number) => Math.round(255 * (1 - alpha) + c * alpha);
  return `rgb(${mix(r)},${mix(g)},${mix(b)})`;
}

const btnStyle = (bg: string) =>
  `display:flex;align-items:center;justify-content:center;gap:8px;margin:0 16px;padding:14px;border-radius:13px;background:${bg};color:#fff;text-decoration:none;font-weight:600;font-size:15px;-webkit-font-smoothing:antialiased;font-family:inherit`;

const walletSvg = (c: string) =>
  `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="1.5" stroke-linecap="round" aria-hidden="true"><rect x="2" y="5" width="20" height="14" rx="3"/><path d="M2 10h20"/><circle cx="7" cy="14.5" r="1.5" fill="${c}" stroke="none"/></svg>`;
