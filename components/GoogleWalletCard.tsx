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

  const bg = /^#[0-9a-f]{6}$/i.test(backgroundColor) ? backgroundColor : "#007AFF";
  const dark = isDarkBg(bg);
  const text = dark ? "#FFFFFF" : "#000000";
  const textSec = dark ? "rgba(255,255,255,0.65)" : "rgba(0,0,0,0.5)";
  const divider = dark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.08)";

  const qrValue = previewUid ? `WALLIO:${previewUid}` : "WALLIO:preview";

  useEffect(() => {
    QRCode.toDataURL(qrValue, {
      width: 480, margin: 1,
      color: { dark: "#000000", light: "#FFFFFF" },
      errorCorrectionLevel: "M",
    }).then(setQr).catch(() => {});
  }, [qrValue]);

  // Modules texte affichables (récompense incluse si présente)
  const rewardModule = rewardName ? [{ header: "Récompense", body: rewardName, id: "recompense" }] : [];
  const allModules = [...rewardModule, ...textModules.filter(m => m.header && m.body)];
  const validLinks = links.filter(l => l.uri && l.description);

  return (
    <div style={{
      width: 360,
      borderRadius: 20,
      overflow: "hidden",
      background: bg,
      fontFamily: "'Google Sans', Roboto, 'Helvetica Neue', sans-serif",
      boxShadow: "0 8px 40px rgba(0,0,0,0.22), 0 2px 8px rgba(0,0,0,0.12)",
      WebkitFontSmoothing: "antialiased",
    }}>

      {/* ── Hero image — position officielle Google Wallet ── */}
      {heroUrl && (
        <div style={{ width: "100%", height: 100, overflow: "hidden", flexShrink: 0 }}>
          <img src={heroUrl} alt="" style={{
            width: "100%", height: "100%", objectFit: "cover", display: "block",
            objectPosition: `50% ${previewCropY}%`,
            transform: previewZoom > 1 ? `scale(${previewZoom})` : "none",
            transformOrigin: `50% ${previewCropY}%`,
          }} />
        </div>
      )}

      {/* ── Logo + émetteur + nom programme ── */}
      <div style={{ padding: heroUrl ? "10px 20px 6px" : "16px 20px 6px", textAlign: "center" }}>
        <div style={{
          width: 42, height: 42, borderRadius: "50%",
          background: "rgba(255,255,255,0.18)",
          overflow: "hidden", margin: "0 auto 5px",
          display: "flex", alignItems: "center", justifyContent: "center",
          border: "1.5px solid rgba(255,255,255,0.25)",
        }}>
          {logoUrl
            ? <img src={logoUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            : <span style={{ fontSize: 17, fontWeight: 700, color: text }}>{logoText?.[0]?.toUpperCase() || "W"}</span>
          }
        </div>
        <p style={{ fontSize: 10, color: textSec, margin: "0 0 3px", letterSpacing: 0.2 }}>Wallio</p>
        <p style={{ fontSize: heroUrl ? 18 : 22, fontWeight: 700, color: text, margin: 0, letterSpacing: -0.5, lineHeight: 1.1 }}>
          {logoText || "Programme"}
        </p>
      </div>

      {/* ── QR code — élément central de Google Wallet ── */}
      <div style={{ padding: "6px 20px 10px", display: "flex", justifyContent: "center" }}>
        <div style={{
          background: "#FFFFFF",
          borderRadius: 12,
          padding: 10,
          boxShadow: dark ? "0 4px 18px rgba(0,0,0,0.4)" : "0 4px 14px rgba(0,0,0,0.13)",
        }}>
          {qr
            ? <img src={qr} alt="QR" style={{ width: 120, height: 120, display: "block" }} />
            : <div style={{ width: 120, height: 120, background: "#f0f0f0", borderRadius: 4 }} />
          }
        </div>
      </div>

      {/* ── Tampons ── */}
      <div style={{ padding: "0 20px 10px" }}>
        <p style={{ fontSize: 10, color: textSec, textTransform: "uppercase", letterSpacing: 0.8, margin: "0 0 2px", fontWeight: 600 }}>
          {primaryLabel}
        </p>
        <p style={{ fontSize: 18, fontWeight: 700, color: text, margin: 0, lineHeight: 1 }}>
          {stampsCurrent} / {stampsObjective}
        </p>
      </div>

      {/* ── Séparateur ── */}
      {allModules.length > 0 && (
        <div style={{ height: 1, background: divider, margin: "0 20px" }} />
      )}

      {/* ── Text modules (récompense + modules custom) ── */}
      {allModules.map((m, i) => (
        <div key={m.id} style={{
          padding: "10px 20px",
          borderBottom: i < allModules.length - 1 ? `1px solid ${divider}` : "none",
        }}>
          <p style={{ fontSize: 10, color: textSec, textTransform: "uppercase", letterSpacing: 0.8, margin: "0 0 2px", fontWeight: 600 }}>
            {m.header}
          </p>
          <p style={{ fontSize: 14, fontWeight: 600, color: text, margin: 0 }}>{m.body}</p>
        </div>
      ))}

      {/* ── Liens ── */}
      {validLinks.length > 0 && (
        <div style={{ padding: "10px 20px 16px", display: "flex", flexWrap: "wrap", gap: 6 }}>
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

      {/* Padding bas */}
      <div style={{ height: allModules.length === 0 && validLinks.length === 0 ? 8 : 4 }} />

    </div>
  );
}
