"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";

export interface GoogleWalletCardProps {
  logoUrl?: string;
  logoText: string;
  backgroundColor: string;
  stampsCurrent: number;
  stampsObjective: number;
  rewardName: string;
  clientPrenom?: string;
  clientNom?: string;
  primaryLabel?: string;
  rewardLabel?: string;
  memberLabel?: string;
  previewUid?: string;
  // Props ignorées (structure imposée par Google)
  stripUrl?: string;
  foregroundColor?: string;
  labelColor?: string;
}

export default function GoogleWalletCard({
  logoUrl,
  logoText,
  backgroundColor,
  stampsCurrent,
  stampsObjective,
  clientPrenom = "Prénom",
  clientNom = "Nom",
  primaryLabel = "Tampons",
  previewUid,
}: GoogleWalletCardProps) {
  const [qr, setQr] = useState("");

  const bg = /^#[0-9a-f]{6}$/i.test(backgroundColor) ? backgroundColor : "#007AFF";

  const qrUrl = previewUid
    ? `https://app.wallio.ma/client/${previewUid}`
    : "https://app.wallio.ma/client/demo";

  useEffect(() => {
    QRCode.toDataURL(qrUrl, {
      width: 400,
      margin: 1,
      color: { dark: "#000000", light: "#FFFFFF" },
      errorCorrectionLevel: "M",
    }).then(setQr).catch(() => {});
  }, [qrUrl]);

  return (
    <div style={{
      width: 360,
      borderRadius: 18,
      overflow: "hidden",
      background: bg,
      fontFamily: "'Google Sans', Roboto, 'Helvetica Neue', sans-serif",
      boxShadow: "0 8px 40px rgba(0,0,0,0.22), 0 2px 8px rgba(0,0,0,0.12)",
      WebkitFontSmoothing: "antialiased",
    }}>

      {/* Header : logo rond + nom émetteur */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "16px 18px 8px" }}>
        <div style={{
          width: 36, height: 36, borderRadius: "50%", flexShrink: 0,
          background: "rgba(255,255,255,0.9)",
          overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          {logoUrl
            ? <img src={logoUrl} alt="" style={{ width: 36, height: 36, objectFit: "cover" }} />
            : <span style={{ fontSize: 16, fontWeight: 700, color: bg }}>W</span>
          }
        </div>
        <span style={{ fontSize: 14, fontWeight: 500, color: "rgba(255,255,255,0.9)", letterSpacing: 0.1 }}>
          Wallio
        </span>
      </div>

      {/* Nom du programme (marchand) */}
      <div style={{ padding: "4px 18px 16px" }}>
        <div style={{ fontSize: 30, fontWeight: 700, color: "#FFFFFF", letterSpacing: -0.5 }}>
          {logoText}
        </div>
      </div>

      {/* Champs points */}
      <div style={{ display: "flex", padding: "0 18px 18px", gap: 24 }}>
        <div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", marginBottom: 2 }}>{primaryLabel}</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: "#FFFFFF" }}>{stampsCurrent}</div>
        </div>
        <div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", marginBottom: 2 }}>Objectif</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: "#FFFFFF" }}>{stampsObjective}</div>
        </div>
      </div>

      {/* QR code */}
      <div style={{ display: "flex", justifyContent: "center", padding: "18px 18px 22px" }}>
        <div style={{
          background: "#FFFFFF",
          borderRadius: 14,
          padding: 12,
          boxShadow: "0 2px 12px rgba(0,0,0,0.15)",
        }}>
          {qr
            ? <img src={qr} alt="QR" style={{ width: 130, height: 130, display: "block" }} />
            : <div style={{ width: 130, height: 130, background: "#f0f0f0", borderRadius: 4 }} />
          }
        </div>
      </div>
    </div>
  );
}
