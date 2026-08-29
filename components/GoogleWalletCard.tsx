"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";

export interface GoogleWalletCardProps {
  logoUrl?: string;
  logoText: string;
  backgroundColor: string;
  heroUrl?: string;
  stampsCurrent: number;
  stampsObjective: number;
  rewardName: string;
  primaryLabel?: string;
  secondaryLabel?: string;
  previewUid?: string;
  // props ignorées (structure imposée par Google)
  stripUrl?: string;
  foregroundColor?: string;
  labelColor?: string;
  clientPrenom?: string;
  clientNom?: string;
  rewardLabel?: string;
  memberLabel?: string;
}

function isDarkBg(hex: string) {
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
  stampsCurrent,
  stampsObjective,
  rewardName,
  primaryLabel = "Tampons",
  previewUid,
}: GoogleWalletCardProps) {
  const [qr, setQr] = useState("");

  const bg = /^#[0-9a-f]{6}$/i.test(backgroundColor) ? backgroundColor : "#007AFF";
  const dark = isDarkBg(bg);
  const text = dark ? "#FFFFFF" : "#000000";
  const textSec = dark ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.45)";
  const progressTrack = dark ? "rgba(255,255,255,0.18)" : "rgba(0,0,0,0.1)";
  const progressFill = dark ? "#FFFFFF" : "#000000";
  const divider = dark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.07)";
  const surfaceTint = dark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.06)";
  const progress = Math.min(1, stampsCurrent / Math.max(1, stampsObjective));

  const qrUrl = previewUid
    ? `https://app.wallio.ma/client/${previewUid}`
    : "https://app.wallio.ma/client/demo";

  useEffect(() => {
    QRCode.toDataURL(qrUrl, {
      width: 400, margin: 1,
      color: { dark: "#000000", light: "#FFFFFF" },
      errorCorrectionLevel: "M",
    }).then(setQr).catch(() => {});
  }, [qrUrl]);

  return (
    <div style={{
      width: 360, borderRadius: 18, overflow: "hidden", background: bg,
      fontFamily: "'Google Sans', Roboto, 'Helvetica Neue', sans-serif",
      boxShadow: "0 8px 40px rgba(0,0,0,0.22), 0 2px 8px rgba(0,0,0,0.12)",
      WebkitFontSmoothing: "antialiased",
    }}>

      {/* Hero image en haut — position officielle Google Wallet */}
      {heroUrl && (
        <div style={{ width: "100%", aspectRatio: "3/1", overflow: "hidden" }}>
          <img src={heroUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
        </div>
      )}

      {/* Header : logo rond + émetteur */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: heroUrl ? "12px 20px 4px" : "16px 20px 6px" }}>
        <div style={{
          width: 32, height: 32, borderRadius: "50%", flexShrink: 0,
          background: surfaceTint, overflow: "hidden",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          {logoUrl
            ? <img src={logoUrl} alt="" style={{ width: 32, height: 32, objectFit: "cover" }} />
            : <span style={{ fontSize: 14, fontWeight: 700, color: text }}>{logoText?.[0]?.toUpperCase() || "W"}</span>
          }
        </div>
        <span style={{ fontSize: 13, fontWeight: 500, color: textSec, letterSpacing: 0.1 }}>Wallio</span>
      </div>

      {/* Nom du programme */}
      <div style={{ padding: heroUrl ? "0 20px 10px" : "0 20px 16px" }}>
        <div style={{ fontSize: heroUrl ? 24 : 28, fontWeight: 700, color: text, letterSpacing: -0.5, lineHeight: 1.1 }}>
          {logoText || "Programme"}
        </div>
      </div>

      {/* Progression tampons */}
      <div style={{ padding: heroUrl ? "0 20px 12px" : "0 20px 16px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: heroUrl ? 8 : 10 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
            <span style={{ fontSize: heroUrl ? 28 : 34, fontWeight: 700, color: text, lineHeight: 1 }}>{stampsCurrent}</span>
            <span style={{ fontSize: heroUrl ? 14 : 16, color: textSec, fontWeight: 500 }}>/ {stampsObjective}</span>
          </div>
          <span style={{ fontSize: 12, color: textSec, letterSpacing: 0.3 }}>{primaryLabel}</span>
        </div>
        {/* Barre de progression */}
        <div style={{ height: 5, background: progressTrack, borderRadius: 3, overflow: "hidden" }}>
          <div style={{
            height: "100%",
            width: `${progress * 100}%`,
            background: progressFill,
            borderRadius: 3,
            minWidth: progress > 0 ? 8 : 0,
          }} />
        </div>
      </div>

      {/* Séparateur */}
      <div style={{ height: 1, background: divider, margin: heroUrl ? "0 20px 10px" : "0 20px 14px" }} />

      {/* Récompense */}
      {rewardName && (
        <div style={{ padding: heroUrl ? "0 20px 10px" : "0 20px 16px" }}>
          <div style={{ fontSize: 10, color: textSec, marginBottom: 3, textTransform: "uppercase", letterSpacing: 0.6, fontWeight: 600 }}>
            Récompense
          </div>
          <div style={{ fontSize: 15, fontWeight: 600, color: text }}>{rewardName}</div>
        </div>
      )}

      {/* QR code */}
      <div style={{ padding: heroUrl ? "2px 20px 16px" : "4px 20px 22px", display: "flex", justifyContent: "center" }}>
        <div style={{
          background: "#FFFFFF", borderRadius: heroUrl ? 12 : 16, padding: heroUrl ? "10px 10px 7px" : "14px 14px 10px",
          boxShadow: dark ? "0 4px 24px rgba(0,0,0,0.35)" : "0 4px 20px rgba(0,0,0,0.13)",
          display: "flex", flexDirection: "column", alignItems: "center", gap: heroUrl ? 6 : 8,
        }}>
          {qr
            ? <img src={qr} alt="QR" style={{ width: heroUrl ? 90 : 110, height: heroUrl ? 90 : 110, display: "block" }} />
            : <div style={{ width: heroUrl ? 90 : 110, height: heroUrl ? 90 : 110, background: "#f0f0f0", borderRadius: 4 }} />
          }
          <div style={{ fontSize: 9, color: "rgba(0,0,0,0.3)", letterSpacing: 1.2, textTransform: "uppercase" }}>
            Scanner en caisse
          </div>
        </div>
      </div>

    </div>
  );
}
