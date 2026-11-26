"use client";

import { useEffect, useRef } from "react";
import type { TamponResult, Client, Marchand } from "@/lib/loyalty";

const GOOGLE_ENABLED = process.env.NEXT_PUBLIC_GOOGLE_WALLET_ENABLED === "true";

export interface StampMerchant { name: string; logo?: string; color: string; }
export interface StampResult { result: TamponResult; client: Client; marchand: Marchand; }

interface Props {
  merchant: StampMerchant;
  result: StampResult | null;
  onRetry: () => void;
}

export default function StampPage({ merchant, result, onRetry }: Props) {
  const root      = useRef<HTMLDivElement>(null);
  const ws        = useRef<any>(null);
  const resultRef = useRef<StampResult | null>(null);
  const slotBuilt = useRef(false);
  const pending   = useRef(false);       // play demandé avant que ws soit prêt
  const choixDone = useRef(false);       // choix Flex confirmé → bloquer le 2ème play() du polling
  const onRetryRef = useRef(onRetry);
  useEffect(() => { onRetryRef.current = onRetry; }, [onRetry]);
  useEffect(() => { resultRef.current = result; }, [result]);

  // ── Mount module once ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!root.current) return;
    let alive = true;

    // Fond derrière Dynamic Island — même fix que client-layout.tsx natif
    const prevHtmlBg = document.documentElement.style.backgroundColor;
    const prevBodyBg = document.body.style.backgroundColor;
    document.documentElement.style.backgroundColor = "#F5F6FA";
    document.body.style.backgroundColor = "#F5F6FA";

    // theme-color Safari status bar
    const prevTheme = document.querySelector('meta[name="theme-color"]')?.getAttribute("content") ?? "";
    setMeta("theme-color", "#F5F6FA");

    import("@/lib/wallio-stamp.js").then((m: any) => {
      if (!alive || !root.current) return;

      ws.current = m.WallioStamp.mount(root.current, {
        merchant,
        bgStyle: "mist",
        onRetry: () => onRetryRef.current(),
        onChoose: async (choice: "small" | "big") => {
          const r = resultRef.current;
          if (!r) return false;
          try {
            const res = await fetch("/api/nfc/enregistrer-choix", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                walletId: r.client.wallet_id,
                marchandId: r.marchand.id,
                choix: choice === "small" ? "petit" : "grand",
              }),
            });
            const data = await res.json();
            const ok = !!(data.ok || data.already_done);
            if (ok) choixDone.current = true;
            return ok;
          } catch { return false; }
        },
      });

      // Overrides layout injectés APRÈS le mount (après le CSS du module → gagne la cascade)
      const styleEl = document.createElement("style");
      styleEl.setAttribute("data-wallio-overrides", "");
      styleEl.textContent = [
        `.ws-main{padding-bottom:28px}`,
        `.ws-slot{margin-top:12px}`,
        // Badge "Encore N" supprimé (redondant avec le texte)
        `.ws-left{display:none}`,
        // "/" et objectif discrets
        `.ws-of{color:#AEAEB2;font-weight:400;font-size:18px}`,
        // Texte récompense lisible
        `.ws-note{color:#1D1D1F;font-weight:600;font-size:15px;margin-top:10px}`,
        // Barre fine continue iOS (3px)
        `.ws-bar{height:3px;gap:2px;margin-top:14px;align-items:center}`,
        `.ws-bar i{flex:1;height:3px;border-radius:2px;overflow:hidden}`,
        `.ws-bar i b{border-radius:2px}`,
      ].join("");
      document.head.appendChild(styleEl);

      // Si un play() a été demandé avant que l'import resolve
      if (pending.current && resultRef.current) {
        pending.current = false;
        const r = resultRef.current;
        if (!slotBuilt.current) { slotBuilt.current = true; buildSlot(ws.current.slot, r); }
        ws.current.play(mapParams(r.result, r.client, r.marchand));
        injectMerchantStyles(r.marchand);
      }
    });

    return () => {
      alive = false;
      ws.current?.destroy();
      ws.current = null;
      slotBuilt.current = false;
      pending.current = false;
      setMeta("theme-color", prevTheme);
      document.documentElement.style.backgroundColor = prevHtmlBg;
      document.body.style.backgroundColor = prevBodyBg;
      document.querySelector("style[data-wallio-overrides]")?.remove();
      document.querySelector("style[data-wallio-mc]")?.remove();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Play quand le résultat arrive ──────────────────────────────────────────
  useEffect(() => {
    if (!result) return;
    if (!ws.current) { pending.current = true; return; }
    if (choixDone.current && result.result.type !== "choix_requis") return;
    if (!slotBuilt.current) { slotBuilt.current = true; buildSlot(ws.current.slot, result); }
    ws.current.play(mapParams(result.result, result.client, result.marchand));
    // Couleurs marchand (injectées après play() → carte tintée Option 2)
    injectMerchantStyles(result.marchand);
    // Prénom — patch DOM direct (texts fixés au mount)
    const prenom = result.client.prenom;
    if (prenom && root.current) {
      const subEl = root.current.querySelector(".ws-sub") as HTMLElement | null;
      if (subEl) { subEl.textContent = `Bonjour ${prenom} !`; subEl.style.display = ""; }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result]);

  return <div ref={root} />;
}

// ─── Slot content (vanilla DOM — doit exister avant play()) ───────────────────

function buildSlot(slot: HTMLElement, { result, client, marchand }: StampResult) {
  const isAndroid  = /android/i.test(navigator.userAgent);
  const hasWallet  = !!((client as any).wallet_type || (client as any).apns_push_token);
  const hasFcmToken = !!((client as any).fcm_token);
  const walletId   = client.wallet_id;

  // 1. Install banner
  const installEl = document.createElement("div");
  slot.appendChild(installEl);
  import("@/lib/wallio-install.js").then((m: any) =>
    m.WallioInstall.mount(installEl, {
      icon: "/wallio-instagram-profil.png",
      theme: { brand: "#007AFF", brandSoft: "rgba(0,122,255,0.08)" },
      texts: { perks: [], get: "Obtenir" },
    })
  );

  // 2. Bouton Wallet — uniquement si pas encore dans Wallet
  if (!hasWallet) {
    if (!isAndroid) {
      const a = el<HTMLAnchorElement>("a");
      a.href = `/api/apple-wallet/generate/${walletId}`;
      a.style.cssText = btnStyle("#000");
      a.innerHTML = walletSvg("white") + "Ajouter à Apple Wallet";
      slot.appendChild(a);
    } else if (GOOGLE_ENABLED) {
      const a = el<HTMLAnchorElement>("a");
      a.href = `/api/google-wallet/generate/${walletId}`;
      a.style.cssText = btnStyle("#1a73e8");
      a.innerHTML = walletSvg("white") + "Ajouter à Google Wallet";
      slot.appendChild(a);
    }
  }

  // 3. Voir toutes mes cartes — toujours affiché, prominent
  const cardsBtn = el<HTMLAnchorElement>("a");
  cardsBtn.href = "/mes-cartes";
  cardsBtn.style.cssText = btnStyle("linear-gradient(135deg,#007AFF,#8B5CF6)");
  cardsBtn.innerHTML = cardsSvg() + "Voir toutes mes cartes";
  slot.appendChild(cardsBtn);

  // 4. Notifications button
  if (!hasFcmToken && "Notification" in window && Notification.permission !== "denied") {
    const btn = el<HTMLButtonElement>("button");
    btn.type = "button";
    btn.style.cssText = "display:flex;align-items:center;justify-content:center;gap:8px;margin:4px 16px 0;padding:12px;border-radius:13px;border:1.5px solid rgba(91,124,250,0.3);background:rgba(91,124,250,0.06);color:#5B7CFA;font-size:14px;font-weight:600;font-family:inherit;cursor:pointer;width:calc(100% - 32px);box-sizing:border-box";
    btn.innerHTML = bellSvg() + "Activer les notifications";
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
        const ok = el<HTMLDivElement>("div");
        ok.style.cssText = "display:flex;align-items:center;justify-content:center;gap:8px;margin:0 16px;padding:10px;border-radius:13px;background:rgba(52,199,89,0.08);border:1px solid rgba(52,199,89,0.2);font-size:13px;font-weight:600;color:#34C759";
        ok.innerHTML = checkSvg() + "Notifications activées";
        btn.parentNode?.insertBefore(ok, btn.nextSibling);
      } catch { btn.disabled = false; }
    };
    slot.appendChild(btn);
  }

  // 5. Lien "Gérer mes notifications"
  const lnk = el<HTMLAnchorElement>("a");
  lnk.href = `/preferences/${walletId}`;
  lnk.textContent = "Gérer mes notifications";
  lnk.style.cssText = "display:block;text-align:center;font-size:11px;color:#C7C7CC;text-decoration:none;padding:6px 0 2px";
  slot.appendChild(lnk);
}

// ─── Mapping TamponResult → paramètres WallioStamp ────────────────────────────

function mapParams(result: TamponResult, client: Client, marchand: Marchand) {
  const mn = marchand as Record<string, unknown>;
  const c  = client  as Record<string, unknown>;

  const mode: "cyclic" | "progressive" | "flex" =
    mn.mode_recompense === "progressif" ? "progressive"
    : mn.mode_recompense === "flex" ? "flex"
    : "cyclic";

  const goal     = (mn.objectif_tampons as number) || 10;
  const reward   = (mn.nom_recompense as string) || "";
  const milestones = ((mn.paliers as { tampons: number; recompense: string }[] | undefined) || [])
    .map(p => ({ at: p.tampons, reward: p.recompense }));

  const flex = mode === "flex" ? {
    at:     (mn.palier_intermediaire as number) || 5,
    small:  (mn.nom_recompense_petit as string) || "",
    big:    (mn.nom_recompense_grand as string) || "",
    choice: c.choix_fait === "petit" ? "small" as const
          : c.choix_fait === "grand" ? "big"   as const
          : null,
  } : null;

  let state: "stamp" | "reward" | "choice" | "duplicate" | "error";
  let before: number, after: number, delay = "";

  switch (result.type) {
    case "ok":
      state  = "stamp";
      after  = result.tampons;
      before = Math.max(0, after - ((result as any).double ? 2 : 1));
      break;
    case "recompense":
      state  = "reward";
      after  = result.tampons;
      before = Math.max(0, after - 1);
      break;
    case "anti_doublon": {
      state  = "duplicate";
      before = after = result.tampons;
      const s = result.secondes_restantes;
      delay  = s >= 86400 ? "demain" : s >= 3600 ? `dans ${Math.ceil(s / 3600)} h` : `dans ${Math.ceil(s / 60)} min`;
      break;
    }
    case "choix_requis":
      state  = "choice";
      before = client.tampons;
      after  = result.tampons;
      break;
    default:
      state  = "error";
      before = after = client.tampons;
  }

  const rawReward = result.type === "recompense" ? result.nom_recompense : reward;

  return { mode, state, before, after, goal, reward, rawReward, delay, milestones, flex };
}

// ─── Styles couleur marchand (Option 2 — carte tintée) ───────────────────────

function hexRgb(hex: string): string {
  const h = hex.replace("#", "").padEnd(6, "0");
  return [0, 2, 4].map(i => parseInt(h.substring(i, i + 2), 16)).join(",");
}

function injectMerchantStyles(marchand: Marchand) {
  const mn = marchand as Record<string, unknown>;
  const mc = (mn.apple_bg_color as string) || marchand.couleur_principale || "#007AFF";
  const rgb = hexRgb(mc);

  let el = document.querySelector("style[data-wallio-mc]") as HTMLStyleElement | null;
  if (!el) {
    el = document.createElement("style");
    el.setAttribute("data-wallio-mc", "");
    document.head.appendChild(el);
  }
  el.textContent = [
    // Carte tintée : fond + bordure couleur marchand, zéro ombre
    `.ws-prog{background:rgba(${rgb},0.05)!important;border:1px solid rgba(${rgb},0.18)!important;box-shadow:none!important}`,
    // Compteur dans la couleur du marchand
    `.ws-big .ws-roll{color:${mc}}`,
    // Barre fine : fond vide + remplissage marchand
    `.ws-bar i{background:rgba(${rgb},0.12)!important}`,
    `.ws-bar i b{background:${mc}!important}`,
  ].join("");
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function el<T extends HTMLElement>(tag: string) { return document.createElement(tag) as T; }

function setMeta(name: string, content: string) {
  let m = document.querySelector(`meta[name="${name}"]`);
  if (!m) { m = document.createElement("meta"); (m as HTMLMetaElement).name = name; document.head.appendChild(m); }
  m.setAttribute("content", content);
}

const btnStyle = (bg: string) =>
  `display:flex;align-items:center;justify-content:center;gap:8px;margin:0 16px;padding:14px;border-radius:13px;background:${bg};color:#fff;text-decoration:none;font-weight:600;font-size:15px;-webkit-font-smoothing:antialiased;font-family:inherit`;

const walletSvg = (c: string) =>
  `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="1.5" stroke-linecap="round" aria-hidden="true"><rect x="2" y="5" width="20" height="14" rx="3"/><path d="M2 10h20"/><circle cx="7" cy="14.5" r="1.5" fill="${c}" stroke="none"/></svg>`;

const bellSvg = () =>
  `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>`;

const cardsSvg = () =>
  `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2" y="5" width="20" height="14" rx="3"/><path d="M2 10h20"/></svg>`;

const checkSvg = () =>
  `<svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M3 8l3.5 3.5L13 4" stroke="#34C759" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
