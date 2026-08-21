"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";

function relativeLuminance(hex: string): number {
  const h = /^#[0-9a-f]{6}$/i.test(hex) ? hex : "#1C1C1E";
  const r = parseInt(h.slice(1, 3), 16) / 255;
  const g = parseInt(h.slice(3, 5), 16) / 255;
  const b = parseInt(h.slice(5, 7), 16) / 255;
  const lin = (c: number) => c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

export interface GoogleWalletCardProps {
  logoUrl?: string;
  logoText: string;
  stripUrl?: string;
  backgroundColor: string;
  foregroundColor?: string;
  labelColor?: string;
  stampsCurrent: number;
  stampsObjective: number;
  rewardName: string;
  clientPrenom?: string;
  clientNom?: string;
  primaryLabel?: string;
  rewardLabel?: string;
  memberLabel?: string;
  previewUid?: string;
}

export default function GoogleWalletCard({
  logoUrl,
  logoText,
  stripUrl,
  backgroundColor,
  foregroundColor,
  stampsCurrent,
  stampsObjective,
  rewardName,
  clientPrenom = "Prénom",
  clientNom = "Nom",
  primaryLabel = "Points",
  rewardLabel = "Récompense",
  memberLabel = "Membre",
  previewUid,
}: GoogleWalletCardProps) {
  const [qr, setQr] = useState("");

  const bg = /^#[0-9a-f]{6}$/i.test(backgroundColor) ? backgroundColor : "#1C1C1E";
  const dark = relativeLuminance(bg) < 0.35;
  const headerFg = foregroundColor ?? (dark ? "#FFFFFF" : "#000000");

  // Zone blanche/claire en dessous
  const bodyBg = "#FFFFFF";
  const bodyFg = "#1C1C1E";
  const bodyLabel = "rgba(60,60,67,0.55)";
  const bodySep = "rgba(0,0,0,0.08)";

  const qrUrl = previewUid
    ? `https://app.wallio.ma/client/${previewUid}`
    : "https://app.wallio.ma/client/demo";

  useEffect(() => {
    QRCode.toDataURL(qrUrl, {
      width: 300,
      margin: 0,
      color: { dark: "#000000", light: "#FFFFFF" },
      errorCorrectionLevel: "M",
    })
      .then(setQr)
      .catch(() => {});
  }, [qrUrl]);

  const clientName = `${clientPrenom} ${clientNom}`.trim();

  return (
    <div
      style={{
        width: 430,
        borderRadius: 16,
        overflow: "hidden",
        fontFamily: "'Google Sans', Roboto, 'Helvetica Neue', sans-serif",
        boxShadow: "0 8px 40px rgba(0,0,0,0.22), 0 2px 8px rgba(0,0,0,0.12)",
        WebkitFontSmoothing: "antialiased",
      }}
    >
      {/* ── Header (fond coloré) ── */}
      <div
        style={{
          background: bg,
          padding: "16px 20px",
          display: "flex",
          alignItems: "center",
          gap: 14,
          minHeight: 64,
        }}
      >
        {/* Logo */}
        <div style={{
          width: 48, height: 48, flexShrink: 0,
          borderRadius: 10,
          border: logoUrl ? "none" : `1.5px dashed ${dark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.15)"}`,
          overflow: "hidden",
          display: "flex", alignItems: "center", justifyContent: "center",
          background: logoUrl ? "transparent" : (dark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)"),
        }}>
          {logoUrl
            ? <img src={logoUrl} alt="" style={{ width: 48, height: 48, objectFit: "contain", display: "block" }} />
            : <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={dark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.2)"} strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="3" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>
          }
        </div>

        {/* Noms */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 16, fontWeight: 600, color: headerFg,
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            letterSpacing: -0.2,
          }}>
            {logoText || "Programme fidélité"}
          </div>
          <div style={{
            fontSize: 13, color: dark ? "rgba(255,255,255,0.65)" : "rgba(0,0,0,0.5)",
            marginTop: 2,
          }}>
            {clientName}
          </div>
        </div>
      </div>

      {/* ── Hero image / strip ── */}
      <div style={{ width: 430, height: 172, background: bg, position: "relative", overflow: "hidden" }}>
        {stripUrl ? (
          <img src={stripUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <div style={{
            width: "100%", height: "100%",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            flexDirection: "column",
          }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={dark ? "rgba(255,255,255,0.18)" : "rgba(0,0,0,0.12)"} strokeWidth="1.5">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            <span style={{ fontSize: 12, color: dark ? "rgba(255,255,255,0.18)" : "rgba(0,0,0,0.12)" }}>Bannière</span>
          </div>
        )}
      </div>

      {/* ── Points ── */}
      <div style={{
        background: bodyBg,
        padding: "16px 20px",
        borderBottom: `1px solid ${bodySep}`,
      }}>
        <div style={{
          fontSize: 11, fontWeight: 600, color: bodyLabel,
          textTransform: "uppercase", letterSpacing: "0.09em", marginBottom: 4,
        }}>
          {primaryLabel}
        </div>
        <div style={{ fontSize: 36, fontWeight: 700, color: bodyFg, lineHeight: 1, letterSpacing: -1 }}>
          {stampsCurrent}
          <span style={{ fontSize: 20, fontWeight: 400, opacity: 0.45 }}>/{stampsObjective}</span>
        </div>
      </div>

      {/* ── Secondary fields ── */}
      <div style={{
        background: bodyBg,
        display: "flex",
        borderBottom: `1px solid ${bodySep}`,
      }}>
        <div style={{ flex: 1, padding: "14px 20px", borderRight: `1px solid ${bodySep}` }}>
          <div style={{
            fontSize: 11, fontWeight: 600, color: bodyLabel,
            textTransform: "uppercase", letterSpacing: "0.09em", marginBottom: 4,
          }}>
            {rewardLabel}
          </div>
          <div style={{
            fontSize: 14, fontWeight: 500, color: bodyFg,
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>
            {rewardName || "—"}
          </div>
        </div>
        <div style={{ flex: 1, padding: "14px 20px" }}>
          <div style={{
            fontSize: 11, fontWeight: 600, color: bodyLabel,
            textTransform: "uppercase", letterSpacing: "0.09em", marginBottom: 4,
          }}>
            {memberLabel}
          </div>
          <div style={{
            fontSize: 14, fontWeight: 500, color: bodyFg,
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>
            {clientName}
          </div>
        </div>
      </div>

      {/* ── QR Code ── */}
      <div style={{
        background: bodyBg,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "20px 0 24px",
      }}>
        <div style={{
          background: "#FFFFFF",
          borderRadius: 12,
          padding: 10,
          boxShadow: "0 2px 12px rgba(0,0,0,0.12)",
          border: "1px solid rgba(0,0,0,0.06)",
        }}>
          {qr ? (
            <img src={qr} alt="QR Code" style={{ width: 100, height: 100, display: "block" }} />
          ) : (
            <div style={{ width: 100, height: 100, background: "#f5f5f5", borderRadius: 4 }} />
          )}
        </div>
        <div style={{
          fontSize: 11, color: bodyLabel, marginTop: 10, letterSpacing: "0.04em",
        }}>
          wallio.ma
        </div>
      </div>
    </div>
  );
}
