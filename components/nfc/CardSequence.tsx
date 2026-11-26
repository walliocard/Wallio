"use client";

import { useEffect, useLayoutEffect, useRef, useState, useCallback } from "react";
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

const REDUCE = typeof window !== "undefined"
  && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

export default function CardSequence({ result, fresh = true, onRetry }: Props) {
  // Si résultat depuis dead flag (back/reload) ou reduced-motion, skip la séquence carte
  const [phase, setPhase] = useState<Phase>(fresh && !REDUCE ? "preload" : "result");
  const stampRootRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<any>(null);
  const slotBuilt = useRef(false);
  const stripRef = useRef<HTMLDivElement>(null);
  const flipRectRef = useRef<DOMRect | null>(null);

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

  // Phase progression (Option B timings)
  useEffect(() => {
    if (phase === "in") {
      const t = setTimeout(() => setPhase("stamp"), 1100);
      return () => clearTimeout(t);
    }
    if (phase === "stamp") {
      const t = setTimeout(() => setPhase("out"), 1150);
      return () => clearTimeout(t);
    }
    if (phase === "out") {
      // Court : juste le temps du fondu de la carte pendant que ResultPage (dessous) fait voler sa bannière
      const t = setTimeout(() => setPhase("result"), 600);
      return () => clearTimeout(t);
    }
  }, [phase]);

  // Capture the banner rect while the card is at rest → FLIP origin for the header
  useLayoutEffect(() => {
    if (phase === "stamp" && stripRef.current) {
      flipRectRef.current = stripRef.current.getBoundingClientRect();
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

  // Preload : logo pulsé plein écran
  if (phase === "preload") {
    const bgColor = blendWithWhite(pass.backgroundColor, 0.05);
    return (
      <div style={{
        position: "fixed", inset: 0, zIndex: 50, background: bgColor,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
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
    );
  }

  const cardPhase: CardPhase = phase === "in" ? "in" : phase === "stamp" ? "stamp" : "out";
  const bgColor = blendWithWhite(pass.backgroundColor, 0.05);
  // ResultPage est monté DÈS "out" (sous la carte) → sa bannière prend le relais sans frame vide.
  // La carte reste montée pendant "out" et se fond en place par-dessus.
  const showResult = phase === "out" || phase === "result";
  const showCard = phase === "in" || phase === "stamp" || phase === "out";
  const exiting = phase === "out";

  return (
    <>
      {showResult && (
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
          flipFrom={flipRectRef.current}
          reduce={REDUCE}
        />
      )}

      {showCard && (
        <div
          onClick={exiting ? undefined : skipToResult}
          style={{
            position: "fixed", inset: 0, zIndex: 50,
            // Transparent pendant "out" pour laisser voir ResultPage dessous
            background: exiting ? "transparent" : bgColor,
            pointerEvents: exiting ? "none" : "auto",
            display: "flex", flexDirection: "column",
            paddingTop: "env(safe-area-inset-top)",
            fontFamily: "-apple-system,'SF Pro Text',sans-serif",
          }}
        >
          <div style={{ flex: 1, position: "relative" }}>
            <CardPreview
              pass={pass}
              phase={cardPhase}
              state={cardState}
              before={before}
              after={after}
              goal={goal}
              reduce={REDUCE}
              stripRef={stripRef}
            />
          </div>

          {/* Skip hint — masqué pendant la sortie */}
          {!exiting && (
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
      )}
    </>
  );
}

// ─── Result page (Option B — bannière en en-tête) ─────────────────────────────

function ResultPage({ pass, result, client, marchand, cardState, before, after, goal, stampRootRef, hasWallet, isAndroid, flipFrom, reduce }: {
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
  flipFrom: DOMRect | null;
  reduce: boolean;
}) {
  const title = cardState === "first" ? `Bienvenue chez ${marchand.nom}`
    : cardState === "reward" ? "Récompense débloquée"
    : cardState === "duplicate" ? "Déjà tamponné"
    : "Tampon ajouté";

  const bannerH = 300;
  const bg = pass.backgroundColor;

  const bannerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [drawn, setDrawn] = useState(0);     // filled ring segments
  const [tileIn, setTileIn] = useState(false);

  // ── FLIP: banner flies from its position on the card to the full-width header
  useLayoutEffect(() => {
    const el = bannerRef.current;
    if (!el || !flipFrom || reduce) return;
    const to = el.getBoundingClientRect();
    if (to.width === 0) return;
    const dx = flipFrom.left - to.left;
    const dy = flipFrom.top - to.top;
    const sx = flipFrom.width / to.width;
    const sy = flipFrom.height / to.height;
    const img = imgRef.current;

    // Start at the card's banner position (no transition)
    el.style.transition = "none";
    el.style.transformOrigin = "top left";
    el.style.transform = `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})`;
    if (img) {
      img.style.transition = "none";
      img.style.transformOrigin = "top left";
      img.style.transform = `scale(${1 / sx}, ${1 / sy})`;
    }
    // Force reflow then animate to natural position
    void el.offsetWidth;
    requestAnimationFrame(() => {
      const ease = "cubic-bezier(.32,.72,0,1)";
      el.style.transition = `transform 0.85s ${ease}`;
      el.style.transform = "none";
      if (img) {
        img.style.transition = `transform 0.85s ${ease}`;
        img.style.transform = "none";
      }
    });
  }, [flipFrom, reduce]);

  // ── Ring segments draw + tile appear — APRÈS la fin du FLIP (850ms) pour éviter la
  //    distorsion : l'anneau/tuile vivent dans la bannière transformée, donc restent
  //    invisibles tant que le scale n'est pas revenu à 1.
  useEffect(() => {
    const filled = Math.min(Math.max(after, 0), goal);
    if (reduce) { setDrawn(filled); setTileIn(true); return; }
    const RING_START = 880; // > durée du FLIP (850ms)
    let i = 0;
    const start = setTimeout(() => {
      const iv = setInterval(() => {
        i += 1;
        setDrawn(i);
        if (i >= filled) { clearInterval(iv); setTimeout(() => setTileIn(true), 120); }
      }, 40);
    }, RING_START);
    // Ensure tile shows even when nothing to fill
    const safety = setTimeout(() => setTileIn(true), RING_START + filled * 40 + 300);
    return () => { clearTimeout(start); clearTimeout(safety); };
  }, [after, goal, reduce]);

  // ── Ring geometry
  const R = 70, STROKE = 4, C = 2 * Math.PI * R;
  const segFull = C / goal;
  const gap = Math.min(3, segFull * 0.3);
  const segLen = Math.max(1, segFull - gap);

  const tileIcon = cardState === "reward"
    ? <svg width={34} height={34} viewBox="0 0 24 24" fill="none" stroke={bg} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 7v14"/><path d="M20 11v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-8"/><path d="M7.5 7a1 1 0 0 1 0-5A4.8 8 0 0 1 12 7a4.8 8 0 0 1 4.5-5 1 1 0 0 1 0 5"/><rect x="3" y="7" width="18" height="4" rx="1"/></svg>
    : cardState === "duplicate"
    ? <svg width={34} height={34} viewBox="0 0 24 24" fill="none" stroke={bg} strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
    : cardState === "first"
    ? <svg width={34} height={34} viewBox="0 0 24 24" fill="none" stroke={bg} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 2l3 6.5 7 .9-5 4.9 1.2 7L12 18l-6.4 3.3L6.8 14.3 1.8 9.4l7-.9L12 2z"/></svg>
    : <span style={{ fontSize: 30, fontWeight: 700, color: bg, letterSpacing: -1 }}>+1</span>;

  return (
    <main style={{
      minHeight: "100dvh", display: "flex", flexDirection: "column",
      fontFamily: "-apple-system,'SF Pro Text',sans-serif",
      WebkitFontSmoothing: "antialiased",
      background: "#F5F5F7",
    }}>
      <style>{`
        @keyframes textUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        @keyframes slotIn{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        @keyframes tilePop{from{opacity:0;transform:scale(.7)}to{opacity:1;transform:scale(1)}}
      `}</style>

      {/* Banner header (FLIP target) */}
      <div ref={bannerRef} style={{
        position: "relative", height: bannerH, overflow: "hidden", flexShrink: 0,
        willChange: "transform",
      }}>
        {/* Strip image */}
        {pass.strip ? (
          <img ref={imgRef} src={pass.strip} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 30%", display: "block", willChange: "transform" }} />
        ) : (
          <div style={{ width: "100%", height: "100%", background: bg }} />
        )}

        {/* Gradient overlay — fades banner into page background */}
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,0.15) 60%, #F5F5F7 100%)",
        }} />

        {/* Ring + tile, centered near top of the photo */}
        <div style={{
          position: "absolute", top: "calc(env(safe-area-inset-top) + 66px)", left: "50%",
          width: 156, height: 156, marginLeft: -78,
        }}>
          <svg width={156} height={156} viewBox="0 0 156 156" style={{ position: "absolute", inset: 0 }} aria-hidden="true">
            <g transform="rotate(-90 78 78)">
              {/* Track */}
              {Array.from({ length: goal }).map((_, i) => (
                <circle
                  key={`t${i}`}
                  cx={78} cy={78} r={R} fill="none"
                  stroke="rgba(255,255,255,0.28)" strokeWidth={STROKE} strokeLinecap="round"
                  strokeDasharray={`${segLen} ${C - segLen}`}
                  strokeDashoffset={-i * segFull}
                />
              ))}
              {/* Filled */}
              {Array.from({ length: goal }).map((_, i) => (
                <circle
                  key={`f${i}`}
                  cx={78} cy={78} r={R} fill="none"
                  stroke="#FFFFFF" strokeWidth={STROKE} strokeLinecap="round"
                  strokeDasharray={`${segLen} ${C - segLen}`}
                  strokeDashoffset={-i * segFull}
                  style={{ opacity: i < drawn ? 1 : 0, transition: "opacity 0.12s ease" }}
                />
              ))}
            </g>
          </svg>

          {/* Center tile */}
          <div style={{
            position: "absolute", top: "50%", left: "50%",
            width: 86, height: 86, marginTop: -43, marginLeft: -43,
            borderRadius: 21, background: "#FFFFFF",
            boxShadow: "0 8px 24px rgba(0,0,0,0.22)",
            display: "flex", alignItems: "center", justifyContent: "center",
            opacity: tileIn ? 1 : 0,
            animation: tileIn && !reduce ? "tilePop 0.4s cubic-bezier(.22,1,.36,1) both" : "none",
          }}>
            {tileIcon}
          </div>
        </div>
      </div>

      {/* Texts below the banner, on grey background */}
      <div style={{ textAlign: "center", padding: "6px 24px 0" }}>
        <p style={{
          fontSize: 12, color: "#8E8E93", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 4px",
          animation: reduce ? "none" : "textUp 0.4s 0.1s both",
        }}>{pass.logoText}</p>
        <p style={{
          fontSize: 23, fontWeight: 700, color: "#1D1D1F", letterSpacing: -0.5, margin: 0,
          animation: reduce ? "none" : "textUp 0.4s 0.2s both",
        }}>{title}</p>
        {client.prenom && (
          <p style={{
            fontSize: 15, color: "#6E6E73", fontWeight: 500, margin: "6px 0 0",
            animation: reduce ? "none" : "textUp 0.4s 0.3s both",
          }}>Bonjour {client.prenom} !</p>
        )}
      </div>

      {/* WallioStamp module (progress section) */}
      <div ref={stampRootRef} style={{
        flex: 1,
        animation: reduce ? "none" : "slotIn 0.5s 0.4s cubic-bezier(.22,1,.36,1) both",
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
