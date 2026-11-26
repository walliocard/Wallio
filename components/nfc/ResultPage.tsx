"use client";

import { useEffect, useRef, useState } from "react";
import type { Client, Marchand, TamponResult } from "@/lib/loyalty";
import type { StampResult } from "@/components/StampPage";

const GOOGLE_ENABLED = process.env.NEXT_PUBLIC_GOOGLE_WALLET_ENABLED === "true";

// Icônes Lucide (trait fin) — inner paths
const P: Record<string, string> = {
  gift: '<rect x="3" y="8" width="18" height="4" rx="1"/><path d="M12 8v13"/><path d="M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7"/><path d="M7.5 8a2.5 2.5 0 0 1 0-5C11 3 12 8 12 8s1-5 4.5-5a2.5 2.5 0 0 1 0 5"/>',
  star: '<path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
};

function Ic({ name, s = 20, w = 1.6 }: { name: keyof typeof P | string; s?: number; w?: number }) {
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={w}
      strokeLinecap="round" strokeLinejoin="round"
      dangerouslySetInnerHTML={{ __html: P[name] }} />
  );
}

// Anneau segmenté (1 segment par tampon ; arc continu au-delà de 15)
function Ring({ before, after, goal }: { before: number; after: number; goal: number }) {
  const R = 70, C = 78, n = Math.min(goal, 15), per = goal / n;
  const paths: React.ReactNode[] = [];
  for (let i = 0; i < n; i++) {
    const g = n > 1 ? 0.11 : 0;
    const a0 = -Math.PI / 2 + (i * 2 * Math.PI) / n + g / 2;
    const a1 = a0 + (2 * Math.PI) / n - g;
    const p = (q: number): [number, number] => [C + R * Math.cos(q), C + R * Math.sin(q)];
    const [x0, y0] = p(a0), [x1, y1] = p(a1);
    const lim = (i + 1) * per;
    const cls = lim <= before ? "" : lim <= after ? "rp-new" : "rp-off";
    paths.push(
      <path key={i} className={cls} style={{ ["--i" as string]: i }}
        d={`M${x0.toFixed(2)} ${y0.toFixed(2)}A${R} ${R} 0 0 1 ${x1.toFixed(2)} ${y1.toFixed(2)}`} />
    );
  }
  return <svg className="rp-ring" viewBox="0 0 156 156">{paths}</svg>;
}

function Bar({ before, after, goal }: { before: number; after: number; goal: number }) {
  return (
    <div className="rp-bar">
      {Array.from({ length: goal }, (_, i) => (
        <i key={i} className={i < before ? "rp-f" : i < after ? "rp-f rp-new" : ""} />
      ))}
    </div>
  );
}

// Toutes les classes sont préfixées `rp-` pour éviter toute collision avec les
// utilities Tailwind (ex. `ring` = box-shadow en anneau → carré parasite).
const CSS = `
.rp{--brand-soft:color-mix(in srgb,var(--brand) 12%,#fff);--brand-line:color-mix(in srgb,var(--brand) 16%,#fff);--bg:#F5F6FA;--ink:#141826;--muted:#8A93A6;--card:#fff;--shadow:0 6px 20px rgba(30,30,70,.07);--ease:cubic-bezier(.32,.72,0,1);
  max-width:430px;margin:0 auto;min-height:100dvh;display:flex;flex-direction:column;position:relative;overflow:hidden;background:var(--bg);color:var(--ink);font-family:Inter,-apple-system,system-ui,sans-serif;-webkit-font-smoothing:antialiased}
.rp *{box-sizing:border-box;margin:0;padding:0}
.rp-hero{position:relative;height:300px;flex:none}
.rp-hero-img{position:absolute;inset:0;background:var(--banner) center 30%/cover}
.rp-hero-fade{position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,.30) 0%,rgba(0,0,0,0) 22%,color-mix(in srgb,var(--bg) 0%,transparent) 50%,color-mix(in srgb,var(--bg) 75%,transparent) 78%,var(--bg) 100%)}
.rp-ring{position:absolute;left:50%;top:66px;width:156px;height:156px;margin-left:-78px}
.rp-ring path{fill:none;stroke:#fff;stroke-width:4;stroke-linecap:round}
.rp-ring path.rp-off{opacity:.35}
.rp-tile{position:absolute;left:50%;top:101px;width:86px;height:86px;margin-left:-43px;border-radius:21px;background:var(--brand);color:#fff;display:flex;align-items:center;justify-content:center;box-shadow:0 10px 26px rgba(0,0,0,.28)}
.rp-tile::before{content:"";position:absolute;inset:4px;border-radius:17px;border:.5px solid rgba(255,255,255,.4)}
.rp-tile .rp-num{font-weight:300;font-size:38px;line-height:1;letter-spacing:-1px}
.rp-head{text-align:center;padding:0 28px;margin-top:-4px}
.rp-logo{width:46px;height:46px;margin:0 auto 10px;overflow:hidden;box-shadow:0 4px 14px rgba(0,0,0,.14)}
.rp-logo img{width:100%;height:100%;object-fit:cover;display:block}
.rp-merchant{font-weight:600;font-size:15px}
.rp-title{font-weight:700;font-size:26px;line-height:1.15;letter-spacing:-.7px;margin-top:8px}
.rp-sub{font-size:15px;color:var(--muted);margin-top:8px;line-height:1.35}
.rp-body{padding:0 16px;margin-top:20px;display:flex;flex-direction:column;gap:12px}
.rp-card{background:var(--card);border-radius:24px;box-shadow:var(--shadow);padding:16px 18px}
.rp-big{display:flex;align-items:baseline;gap:4px}
.rp-big b{font-weight:700;font-size:42px;line-height:1;letter-spacing:-1.5px}
.rp-big span{font-weight:600;font-size:20px;color:var(--muted)}
.rp-pill{margin-left:auto;align-self:center;font-weight:600;font-size:13px;padding:6px 10px;border-radius:10px;background:var(--brand-soft);color:var(--brand)}
.rp-bar{display:flex;gap:4px;margin-top:12px;height:8px}
.rp-bar i{flex:1;border-radius:4px;background:var(--brand-line)}
.rp-bar i.rp-f{background:var(--brand)}
.rp-bar i.rp-new{transform-origin:left}
.rp-note{color:var(--muted);font-size:14px;margin-top:10px}
.rp-ms{margin-top:12px;border-top:1px solid #EEF0F4;padding-top:6px}
.rp-msr{display:flex;align-items:center;gap:10px;padding:7px 0;font-size:14px}
.rp-msi{width:22px;height:22px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex:none;background:#EEF0F4;color:var(--muted)}
.rp-msr.rp-done .rp-msi,.rp-msr.rp-now .rp-msi{background:var(--brand);color:#fff}
.rp-msr em{margin-left:auto;font-style:normal;font-size:12.5px;color:var(--muted);font-weight:600}
.rp-msr.rp-now em{color:var(--brand)}
.rp-opts{display:flex;gap:10px}
.rp-opt{flex:1;background:var(--card);border-radius:22px;padding:16px 14px 14px;box-shadow:var(--shadow)}
.rp-opt small{display:block;font-weight:600;font-size:11.5px;letter-spacing:1px;color:var(--muted)}
.rp-opt b{display:block;font-weight:700;font-size:19px;margin-top:4px}
.rp-btn{height:44px;border-radius:13px;display:flex;align-items:center;justify-content:center;font-weight:600;font-size:15px;border:0;width:100%;font-family:inherit;cursor:pointer;text-decoration:none}
.rp-opt .rp-btn{margin-top:12px;height:40px;border-radius:12px}
.rp-btn.rp-primary{background:var(--brand);color:#fff}
.rp-btn.rp-soft{background:var(--brand-soft);color:var(--brand)}
.rp-btn.rp-ghost{background:#fff;border:1px solid #E3E6EE;color:var(--ink);height:48px}
.rp-btn[disabled]{opacity:.55}
.rp-fin{text-align:center;color:var(--muted);font-size:13px}
.rp-foot{margin-top:auto;padding:24px 16px calc(24px + env(safe-area-inset-bottom));display:flex;flex-direction:column;gap:12px}
.rp-wal{display:flex;align-items:center;gap:10px;font-size:13.5px;color:var(--muted);padding:0 2px}
.rp-mini{width:30px;height:40px;border-radius:5px;background:var(--brand);overflow:hidden;position:relative;flex:none;box-shadow:0 2px 6px rgba(0,0,0,.2)}
.rp-mini i{position:absolute;left:0;right:0;top:8px;height:11px;background:var(--banner) center/cover}
.rp-mini u{position:absolute;left:9px;top:23px;width:12px;height:12px;border-radius:2px;overflow:hidden;background:#fff}
.rp-mini u img{width:100%;height:100%;display:block;image-rendering:pixelated}
.rp-inst{background:var(--card);border-radius:22px;box-shadow:var(--shadow);padding:14px;display:flex;align-items:center;gap:12px;border:0;width:100%;text-align:left;font-family:inherit;cursor:pointer}
.rp-inst img{width:46px;height:46px;border-radius:11px}
.rp-inst b{font-size:15px}
.rp-inst small{display:block;color:var(--muted);font-size:12.5px}
.rp-inst .rp-get{margin-left:auto;flex:none;background:#4B4FD6;color:#fff;font-weight:600;font-size:14px;padding:9px 14px;border-radius:11px}
@keyframes rp-pagein{from{opacity:0}to{opacity:1}}
@keyframes rp-up{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
@keyframes rp-fade{from{opacity:0}to{opacity:1}}
@keyframes rp-heroIn{from{opacity:0;transform:scale(1.06)}to{opacity:1;transform:none}}
@keyframes rp-tileIn{from{opacity:0;transform:scale(.85)}to{opacity:1;transform:none}}
@keyframes rp-seg{from{opacity:0}}
@keyframes rp-grow{from{transform:scaleX(0)}to{transform:none}}
.rp.rp-anim{animation:rp-pagein .5s ease both}
.rp.rp-anim .rp-hero-img{animation:rp-heroIn .9s var(--ease) both}
.rp.rp-anim .rp-hero-fade{animation:rp-fade .7s .1s ease both}
.rp.rp-anim .rp-tile{animation:rp-tileIn .55s .35s var(--ease) both}
.rp.rp-anim .rp-ring path{animation:rp-seg .3s var(--ease) both;animation-delay:calc(.45s + var(--i) * 40ms)}
.rp.rp-anim .rp-ring path.rp-new{animation:rp-seg .45s 1.1s var(--ease) both}
.rp.rp-anim .rp-logo{animation:rp-up .55s .5s var(--ease) both}
.rp.rp-anim .rp-merchant{animation:rp-up .55s .55s var(--ease) both}
.rp.rp-anim .rp-title{animation:rp-up .55s .65s var(--ease) both}
.rp.rp-anim .rp-sub{animation:rp-up .55s .75s var(--ease) both}
.rp.rp-anim .rp-body>*:nth-child(1){animation:rp-up .55s .85s var(--ease) both}
.rp.rp-anim .rp-body>*:nth-child(2){animation:rp-up .55s .95s var(--ease) both}
.rp.rp-anim .rp-bar i.rp-new{animation:rp-grow .45s 1.2s var(--ease) both}
.rp.rp-anim .rp-foot>*:nth-child(1){animation:rp-up .55s 1.05s var(--ease) both}
.rp.rp-anim .rp-foot>*:nth-child(2){animation:rp-up .55s 1.15s var(--ease) both}
.rp.rp-anim .rp-foot>*:nth-child(3){animation:rp-up .55s 1.25s var(--ease) both}
@media (prefers-reduced-motion:reduce){.rp.rp-anim,.rp.rp-anim *{animation:none!important}}
`;

type Kind = "stamp" | "flexstamp" | "progressif" | "choice" | "reward" | "dup";

export default function ResultPage({ result }: { result: StampResult; onRetry?: () => void }) {
  const { result: res, client, marchand } = result;
  const mn = marchand as Record<string, unknown>;

  const brand = (mn.apple_bg_color as string) || marchand.couleur_principale || "#283F22";
  const banner = (mn.strip_url as string) || "";
  const logo = (mn.logo_shape === "round" && mn.logo_circle_url)
    ? (mn.logo_circle_url as string) : (mn.logo_url as string | undefined);
  const logoRound = mn.logo_shape === "round";
  const firstName = client.prenom || "";
  const hasWallet = !!((client as Record<string, unknown>).wallet_type || (client as Record<string, unknown>).apns_push_token);
  const isAndroid = typeof navigator !== "undefined" && /android/i.test(navigator.userAgent);
  const walletId = client.wallet_id;

  const mode = mn.mode_recompense === "progressif" ? "progressif"
    : mn.mode_recompense === "flex" ? "flex" : "cyclique";
  const paliers = ((mn.paliers as { tampons: number; recompense: string }[] | undefined) || []);
  const milestones = paliers.map(p => ({ at: p.tampons, label: p.recompense }));
  const objectif = (mn.objectif_tampons as number) || 10;
  const interm = (mn.palier_intermediaire as number) || Math.ceil(objectif / 2);

  // before / after
  const r = res as TamponResult & Record<string, unknown>;
  let before: number, after: number;
  switch (res.type) {
    case "ok": after = res.tampons; before = Math.max(0, after - (r.double ? 2 : 1)); break;
    case "recompense": after = res.tampons; before = Math.max(0, after - 1); break;
    case "anti_doublon": after = before = (r.tampons as number) ?? client.tampons; break;
    case "choix_requis": after = res.tampons; before = client.tampons; break;
    default: after = before = client.tampons;
  }

  // Objectif affiché : flex → on vise d'abord le palier de choix, puis le grand objectif
  const goal = mode === "progressif" && paliers.length
    ? Math.max(...paliers.map(p => p.tampons))
    : mode === "flex" ? (after < interm ? interm : objectif)
    : objectif;

  const kind: Kind =
    res.type === "recompense" ? "reward"
    : res.type === "anti_doublon" ? "dup"
    : res.type === "choix_requis" ? "choice"
    : mode === "progressif" && milestones.length ? "progressif"
    : mode === "flex" ? "flexstamp"
    : "stamp";

  const left = Math.max(0, goal - after);
  // Récompense telle qu'entrée dans les réglages du marchand
  const reward = res.type === "recompense"
    ? res.nom_recompense
    : (mn.nom_recompense as string) || "votre récompense";
  const flexNow = (res.type === "choix_requis" ? res.nom_recompense_petit : (mn.nom_recompense_petit as string)) || "";
  const flexLater = (res.type === "choix_requis" ? res.nom_recompense_grand : (mn.nom_recompense_grand as string)) || "";

  // ── Choix flex
  const [choosing, setChoosing] = useState(false);
  async function choose(c: "petit" | "grand") {
    if (choosing) return;
    setChoosing(true);
    try {
      await fetch("/api/nfc/enregistrer-choix", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ walletId, marchandId: marchand.id, choix: c }),
      });
      // La page NFC poll Firestore (choix_en_attente) et bascule l'écran sur le résultat.
    } catch { setChoosing(false); }
  }

  // ── Mini QR réaliste (pointe vers app.walliocard.com — personne ne le scanne)
  const [qr, setQr] = useState<string>("");
  useEffect(() => {
    let alive = true;
    import("qrcode").then(m =>
      m.toDataURL("https://app.walliocard.com", { margin: 0, width: 48, color: { dark: "#141826", light: "#ffffff" } })
        .then(url => { if (alive) setQr(url); }).catch(() => {})
    );
    return () => { alive = false; };
  }, []);

  // ── Installation Wallio : carte visuelle (maquette) + feuille slide-up du vrai
  //    module WallioInstall. On monte le module dans un conteneur CACHÉ uniquement
  //    pour récupérer openSheet() ; la carte visible reste celle de la maquette.
  const installHiddenRef = useRef<HTMLDivElement>(null);
  const installApi = useRef<{ kind?: string; openSheet?: (k: string) => void } | null>(null);
  useEffect(() => {
    const el = installHiddenRef.current;
    if (!el) return;
    import("@/lib/wallio-install.js").then((m: any) => {
      installApi.current = m.WallioInstall.mount(el, {
        icon: "/wallio-instagram-profil.png",
        texts: { get: "Obtenir", perks: [] },
      });
    });
    return () => { if (el) el.innerHTML = ""; };
  }, []);
  const onInstall = () => {
    const api = installApi.current;
    if (api?.openSheet) api.openSheet(api.kind === "android" ? "android" : "ios");
  };

  // ── Fond derrière la Dynamic Island
  useEffect(() => {
    const prevHtml = document.documentElement.style.backgroundColor;
    const prevBody = document.body.style.backgroundColor;
    document.documentElement.style.backgroundColor = "#F5F6FA";
    document.body.style.backgroundColor = "#F5F6FA";
    return () => {
      document.documentElement.style.backgroundColor = prevHtml;
      document.body.style.backgroundColor = prevBody;
    };
  }, []);

  // ── Contenu par mode
  let tile: React.ReactNode, title: string, sub: string, body: React.ReactNode;

  if (kind === "stamp") {
    tile = <span className="rp-num">{after}</span>;
    title = "Tampon ajouté";
    sub = `Bonjour ${firstName}, merci pour votre visite.`;
    body = (
      <div className="rp-card">
        <div className="rp-big"><b>{after}</b><span>/ {goal}</span><em className="rp-pill">Encore {left}</em></div>
        <Bar before={before} after={after} goal={goal} />
        <div className="rp-note">Plus que {left} visite{left > 1 ? "s" : ""} avant {reward}.</div>
      </div>
    );
  } else if (kind === "flexstamp") {
    const preChoice = after < interm;
    const fleft = Math.max(0, goal - after);
    tile = <span className="rp-num">{after}</span>;
    title = "Tampon ajouté";
    sub = `Bonjour ${firstName}, merci pour votre visite.`;
    body = (
      <div className="rp-card">
        <div className="rp-big"><b>{after}</b><span>/ {goal}</span><em className="rp-pill">Encore {fleft}</em></div>
        <Bar before={before} after={after} goal={goal} />
        <div className="rp-note">{preChoice
          ? `Plus que ${fleft} visite${fleft > 1 ? "s" : ""} avant de choisir : ${flexNow} ou ${flexLater}.`
          : `Plus que ${fleft} visite${fleft > 1 ? "s" : ""} avant ${flexLater}.`}</div>
      </div>
    );
  } else if (kind === "progressif") {
    const next = milestones.find(m => m.at > after);
    tile = <span className="rp-num">{after}</span>;
    title = "Tampon ajouté";
    sub = next ? `Prochain palier : ${next.label.toLowerCase()} à ${next.at} tampons.` : "Tous les paliers sont débloqués.";
    body = (
      <div className="rp-card">
        <div className="rp-big"><b>{after}</b><span>/ {goal}</span>{next && <em className="rp-pill">Encore {next.at - after}</em>}</div>
        <Bar before={before} after={after} goal={goal} />
        <div className="rp-ms">
          {milestones.map((m, i) => {
            const st = m.at <= before ? "rp-done" : m.at <= after ? "rp-now" : "";
            const rem = m.at - after;
            const lab = st === "rp-done" ? "Validé" : st === "rp-now" ? "Débloqué" : `${rem} restant${rem > 1 ? "s" : ""}`;
            return (
              <div key={i} className={`rp-msr ${st}`}>
                <span className="rp-msi">{st ? <Ic name="check" s={13} w={2.4} /> : <Ic name="lock" s={12} w={2} />}</span>
                {m.label}<small style={{ color: "var(--muted)", fontSize: "12.5px" }}>&nbsp;· {m.at}</small><em>{lab}</em>
              </div>
            );
          })}
        </div>
      </div>
    );
  } else if (kind === "choice") {
    tile = <Ic name="star" s={36} w={1.5} />;
    title = "À vous de choisir";
    sub = `Vous avez ${after} tampons. Profitez maintenant ou continuez.`;
    body = (
      <>
        <div className="rp-opts">
          <div className="rp-opt"><small>MAINTENANT</small><b>{flexNow}</b>
            <button className="rp-btn rp-primary" disabled={choosing} onClick={() => choose("petit")}>Prendre</button></div>
          <div className="rp-opt"><small>À {goal} TAMPONS</small><b>{flexLater}</b>
            <button className="rp-btn rp-soft" disabled={choosing} onClick={() => choose("grand")}>Continuer</button></div>
        </div>
        <div className="rp-fin">Ce choix est définitif.</div>
      </>
    );
  } else if (kind === "reward") {
    tile = <Ic name="gift" s={38} w={1.5} />;
    title = "Récompense débloquée";
    sub = `${reward} ! Montrez cet écran au comptoir.`;
    body = (
      <div className="rp-card">
        <div className="rp-big"><b>{after}</b><span>/ {goal}</span><em className="rp-pill">Complet</em></div>
        <Bar before={before} after={after} goal={goal} />
        <div className="rp-note">Votre carte repart à zéro après la récompense.</div>
      </div>
    );
  } else { // dup
    tile = <Ic name="clock" s={36} w={1.5} />;
    title = "Déjà tamponné aujourd’hui";
    sub = "Un tampon par jour. Revenez demain pour continuer.";
    body = (
      <div className="rp-card">
        <div className="rp-big"><b>{after}</b><span>/ {goal}</span><em className="rp-pill">Encore {left}</em></div>
        <Bar before={after} after={after} goal={goal} />
      </div>
    );
  }

  const walletName = isAndroid ? "Google Wallet" : "Apple Wallet";
  const walletHref = isAndroid
    ? (GOOGLE_ENABLED ? `/api/google-wallet/generate/${walletId}` : "")
    : `/api/apple-wallet/generate/${walletId}`;
  const showWalletBtn = !hasWallet && !!walletHref;

  const rootStyle = { ["--brand" as string]: brand, ["--banner" as string]: banner ? `url(${banner})` : "none" } as React.CSSProperties;

  return (
    <div className="rp rp-anim" style={rootStyle}>
      <style>{CSS}</style>

      <header className="rp-hero">
        <div className="rp-hero-img" style={banner ? undefined : { background: brand }} />
        <div className="rp-hero-fade" />
        <Ring before={before} after={after} goal={goal} />
        <div className="rp-tile">{tile}</div>
      </header>

      <div className="rp-head">
        {logo && (
          <div className="rp-logo" style={{ borderRadius: logoRound ? "50%" : 13 }}>
            <img src={logo} alt="" />
          </div>
        )}
        <div className="rp-merchant">{marchand.nom}</div>
        <h1 className="rp-title">{title}</h1>
        <p className="rp-sub">{sub}</p>
      </div>

      <div className="rp-body">{body}</div>

      {kind !== "choice" && (
        <div className="rp-foot">
          {hasWallet ? (
            <div className="rp-wal"><div className="rp-mini"><i /><u>{qr && <img src={qr} alt="" />}</u></div>Carte à jour dans {walletName}</div>
          ) : showWalletBtn ? (
            <a className="rp-btn rp-primary" style={{ height: 48 }} href={walletHref}>Ajouter à {walletName}</a>
          ) : null}
          <button type="button" className="rp-inst" onClick={onInstall}>
            <img src="/wallio-instagram-profil.png" alt="" />
            <div><b>Wallio</b><small>Toutes vos cartes au même endroit</small></div>
            <span className="rp-get">Obtenir</span>
          </button>
          <a className="rp-btn rp-ghost" href="/mes-cartes">Voir toutes mes cartes</a>
        </div>
      )}

      {/* Montage caché : fournit la feuille slide-up à la carte « Obtenir » ci-dessus */}
      <div ref={installHiddenRef} style={{ display: "none" }} />
    </div>
  );
}
