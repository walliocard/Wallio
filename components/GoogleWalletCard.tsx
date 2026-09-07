"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";

export interface GoogleWalletCardProps {
  logoUrl?: string;
  logoText: string;
  backgroundColor: string;
  heroUrl?: string;
  previewCropY?: number;
  previewZoom?: number;
  stampsCurrent: number;
  stampsObjective: number;
  rewardName: string;
  primaryLabel?: string;
  secondaryLabel?: string;
  textModules?: { header: string; body: string; id: string }[];
  links?: { uri: string; description: string }[];
  previewUid?: string;
  stripUrl?: string;
  foregroundColor?: string;
  labelColor?: string;
  clientPrenom?: string;
  clientNom?: string;
  rewardLabel?: string;
  memberLabel?: string;
}

function isDarkBg(hex: string) {
  if (!/^#[0-9a-f]{6}$/i.test(hex)) return true;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return 0.299 * r + 0.587 * g + 0.114 * b < 140;
}

export default function GoogleWalletCard({
  logoUrl,
  logoText,
  backgroundColor,
  heroUrl,
  previewCropY = 50,
  previewZoom = 1,
  stampsCurrent,
  stampsObjective,
  rewardName,
  primaryLabel = "Tampons",
  textModules = [],
  links = [],
  previewUid,
}: GoogleWalletCardProps) {
  const [qr, setQr] = useState("");

  // Google Wallet affiche toujours le fond de la carte sur fond clair
  // Le backgroundColor est utilisé pour le fond du card MAIS Google Wallet
  // utilise un fond gris clair pour la vue détail
  const bg = /^#[0-9a-f]{6}$/i.test(backgroundColor) ? backgroundColor : "#F5F5F5";
  const dark = isDarkBg(bg);
  const text = dark ? "#FFFFFF" : "#1A1A1A";
  const textSec = dark ? "rgba(255,255,255,0.6)" : "#6E6E73";
  const divider = dark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.08)";

  const qrValue = previewUid ? `WALLIO:${previewUid}` : "WALLIO:preview";

  useEffect(() => {
    QRCode.toDataURL(qrValue, {
      width: 600, margin: 1,
      color: { dark: "#000000", light: "#FFFFFF" },
      errorCorrectionLevel: "M",
    }).then(setQr).catch(() => {});
  }, [qrValue]);

  const rewardModule = rewardName ? [{ header: "Récompense", body: rewardName, id: "recompense" }] : [];
  const allModules = [...rewardModule, ...textModules.filter(m => m.header && m.body)];
  const validLinks = links.filter(l => l.uri && l.description);

  return (
    <div style={{
      width: 340,
      borderRadius: 16,
      overflow: "hidden",
      background: bg,
      fontFamily: "'Google Sans', Roboto, 'Helvetica Neue', sans-serif",
      boxShadow: "0 2px 12px rgba(0,0,0,0.18), 0 1px 3px rgba(0,0,0,0.10)",
      WebkitFontSmoothing: "antialiased",
    }}>

      {/* ── Logo + texte logo + issuer + nom programme ── */}
      <div style={{ padding: "24px 20px 12px", textAlign: "center" }}>

        {/* Logo — 64px comme dans la vraie Google Wallet */}
        <div style={{
          width: 64, height: 64, borderRadius: "50%",
          background: dark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.06)",
          overflow: "hidden", margin: "0 auto 8px",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          {logoUrl
            ? <img src={logoUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            : <span style={{ fontSize: 24, fontWeight: 700, color: text }}>{logoText?.[0]?.toUpperCase() || "W"}</span>
          }
        </div>

        {/* Texte sous le logo (nom abrégé, comme Google Wallet l'affiche) */}
        <p style={{ fontSize: 11, color: textSec, margin: "0 0 2px", fontWeight: 500 }}>
          {logoText}
        </p>

        {/* Issuer name */}
        <p style={{ fontSize: 14, color: textSec, margin: "0 0 4px", fontWeight: 400 }}>
          Wallio
        </p>

        {/* Nom du programme — très grand, comme dans la vraie app */}
        <p style={{ fontSize: 34, fontWeight: 700, color: text, margin: 0, letterSpacing: -0.5, lineHeight: 1.1 }}>
          {logoText || "Programme"}
        </p>
      </div>

      {/* ── QR code + tampons dans la même box blanche ── */}
      <div style={{ padding: "0 16px 16px" }}>
        <div style={{
          background: "#FFFFFF",
          borderRadius: 16,
          padding: 16,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          boxShadow: dark ? "0 4px 20px rgba(0,0,0,0.4)" : "0 2px 8px rgba(0,0,0,0.10)",
        }}>
          {qr
            ? <img src={qr} alt="QR" style={{ width: "100%", maxWidth: 260, height: "auto", display: "block" }} />
            : <div style={{ width: 260, height: 260, background: "#f0f0f0", borderRadius: 4 }} />
          }
          {/* Tampons — directement sous le QR dans la box */}
          <div style={{ marginTop: 12, textAlign: "center" }}>
            <p style={{ fontSize: 11, color: "#6E6E73", textTransform: "uppercase", letterSpacing: 0.8, margin: "0 0 2px", fontWeight: 600 }}>
              {primaryLabel}
            </p>
            <p style={{ fontSize: 22, fontWeight: 700, color: "#1A1A1A", margin: 0, lineHeight: 1 }}>
              {stampsCurrent} / {stampsObjective}
            </p>
          </div>
        </div>
      </div>

      {/* ── Séparateur ── */}
      {(allModules.length > 0 || heroUrl) && (
        <div style={{ height: 1, background: divider, margin: "0 20px" }} />
      )}

      {/* ── Text modules ── */}
      {allModules.map((m, i) => (
        <div key={m.id} style={{
          padding: "12px 20px",
          borderBottom: i < allModules.length - 1 ? `1px solid ${divider}` : "none",
        }}>
          <p style={{ fontSize: 11, color: textSec, textTransform: "uppercase", letterSpacing: 0.8, margin: "0 0 2px", fontWeight: 600 }}>
            {m.header}
          </p>
          <p style={{ fontSize: 15, fontWeight: 600, color: text, margin: 0 }}>{m.body}</p>
        </div>
      ))}

      {/* ── Liens ── */}
      {validLinks.length > 0 && (
        <div style={{ padding: "12px 20px", display: "flex", flexWrap: "wrap", gap: 6 }}>
          {validLinks.map((l, i) => (
            <a key={i} href={l.uri} target="_blank" rel="noopener noreferrer" style={{
              display: "inline-flex", alignItems: "center", gap: 4,
              padding: "5px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600,
              background: dark ? "rgba(255,255,255,0.14)" : "rgba(0,0,0,0.07)",
              color: text, textDecoration: "none",
            }}>
              {l.uri.startsWith("tel:") ? "!" : l.uri.startsWith("mailto:") ? "@" : "→"} {l.description}
            </a>
          ))}
        </div>
      )}

      {/* ── Hero image EN BAS — position réelle dans Google Wallet ── */}
      {heroUrl && (
        <div style={{ width: "100%", marginTop: allModules.length > 0 || validLinks.length > 0 ? 0 : 8 }}>
          <div style={{ height: 1, background: divider }} />
          <div style={{ width: "100%", height: 140, overflow: "hidden" }}>
            <img src={heroUrl} alt="" style={{
              width: "100%", height: "100%", objectFit: "cover", display: "block",
              objectPosition: `50% ${previewCropY}%`,
              transform: previewZoom > 1 ? `scale(${previewZoom})` : "none",
              transformOrigin: `50% ${previewCropY}%`,
            }} />
          </div>
        </div>
      )}

      <div style={{ height: 12 }} />

    </div>
  );
}
