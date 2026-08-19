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

export interface AppleWalletCardProps {
  logoUrl?: string;
  logoText: string;
  stripContent?: React.ReactNode;
  stripUrl?: string;
  backgroundColor: string;
  /** foregroundColor Apple Wallet — auto si non fourni */
  foregroundColor?: string;
  /** labelColor Apple Wallet — auto si non fourni */
  labelColor?: string;
  stampsCurrent: number;
  stampsObjective: number;
  rewardName: string;
  clientPrenom?: string;
  clientNom?: string;
}

export default function AppleWalletCard({
  logoUrl,
  logoText,
  stripContent,
  stripUrl,
  backgroundColor,
  foregroundColor,
  labelColor,
  stampsCurrent,
  stampsObjective,
  rewardName,
  clientPrenom = "Prénom",
  clientNom = "Nom",
}: AppleWalletCardProps) {
  const [qr, setQr] = useState("");

  const bg = /^#[0-9a-f]{6}$/i.test(backgroundColor) ? backgroundColor : "#1C1C1E";
  const dark = relativeLuminance(bg) < 0.35;
  const fg = foregroundColor ?? (dark ? "#FFFFFF" : "#000000");
  const labelClr = labelColor ?? (dark ? "rgba(255,255,255,0.55)" : "rgba(0,0,0,0.42)");
  const sep = dark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)";

  useEffect(() => {
    QRCode.toDataURL("https://app.wallio.ma/client/demo", {
      width: 300,
      margin: 0,
      color: { dark: "#000000", light: "#FFFFFF" },
      errorCorrectionLevel: "M",
    })
      .then(setQr)
      .catch(() => {});
  }, []);

  const clientName = `${clientPrenom} ${clientNom}`.trim();

  return (
    <div
      style={{
        width: 375,
        background: bg,
        borderRadius: 20,
        overflow: "hidden",
        fontFamily: "-apple-system, 'SF Pro Display', 'Helvetica Neue', sans-serif",
        boxShadow: "0 24px 80px rgba(0,0,0,0.45)",
        WebkitFontSmoothing: "antialiased",
      }}
    >
      {/* ── Header ── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "16px 16px 14px",
        }}
      >
        {/* Logo + nom marchand */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            overflow: "hidden",
            flex: 1,
          }}
        >
          {logoUrl && (
            <img
              src={logoUrl}
              alt=""
              style={{
                height: 38,
                maxWidth: 110,
                objectFit: "contain",
                borderRadius: 6,
                flexShrink: 0,
              }}
            />
          )}
          <span
            style={{
              fontSize: 15,
              fontWeight: 600,
              color: fg,
              letterSpacing: -0.2,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {logoText || "Établissement"}
          </span>
        </div>

      </div>

      {/* ── Strip zone (375 × 144 pt — Apple spec) ── */}
      {(stripContent || stripUrl) && (
        <div style={{ width: 375, height: 144, overflow: "hidden", position: "relative", flexShrink: 0 }}>
          {stripContent ? (
            /* Template en mode strip natif 375×144 */
            <div style={{ width: 375, height: 144, flexShrink: 0 }}>
              {stripContent}
            </div>
          ) : (
            <img src={stripUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }}/>
          )}
        </div>
      )}

      {/* ── Primary field ── */}
      <div
        style={{
          padding: "14px 16px 12px",
          borderBottom: `1px solid ${sep}`,
        }}
      >
        <div
          style={{
            fontSize: 10,
            color: labelClr,
            textTransform: "uppercase",
            letterSpacing: "0.07em",
            marginBottom: 5,
          }}
        >
          Tampons
        </div>
        <div
          style={{
            fontSize: 40,
            fontWeight: 700,
            color: fg,
            letterSpacing: -1.5,
            lineHeight: 1,
          }}
        >
          {stampsCurrent}
          <span style={{ fontSize: 24, fontWeight: 400, opacity: 0.55 }}>
            /{stampsObjective}
          </span>
        </div>
      </div>

      {/* ── Secondary fields ── */}
      <div
        style={{
          display: "flex",
          padding: "12px 16px 14px",
          borderBottom: `1px solid ${sep}`,
        }}
      >
        <div style={{ flex: 1, paddingRight: 8 }}>
          <div
            style={{
              fontSize: 10,
              color: labelClr,
              textTransform: "uppercase",
              letterSpacing: "0.07em",
              marginBottom: 3,
            }}
          >
            Récompense
          </div>
          <div
            style={{
              fontSize: 15,
              fontWeight: 500,
              color: fg,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {rewardName || "—"}
          </div>
        </div>
        <div style={{ flex: 1 }}>
          <div
            style={{
              fontSize: 10,
              color: labelClr,
              textTransform: "uppercase",
              letterSpacing: "0.07em",
              marginBottom: 3,
            }}
          >
            Membre
          </div>
          <div
            style={{
              fontSize: 15,
              fontWeight: 500,
              color: fg,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {clientName}
          </div>
        </div>
      </div>

      {/* ── Barcode zone (QR toujours blanc — Apple impose) ── */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: "20px 0 26px",
        }}
      >
        <div
          style={{
            background: "#FFFFFF",
            borderRadius: 10,
            padding: 8,
            boxShadow: "0 2px 16px rgba(0,0,0,0.18)",
          }}
        >
          {qr ? (
            <img
              src={qr}
              alt="QR Code"
              style={{ width: 100, height: 100, display: "block" }}
            />
          ) : (
            <div
              style={{ width: 100, height: 100, background: "#f0f0f0" }}
            />
          )}
        </div>
        <div
          style={{
            fontSize: 10,
            color: labelClr,
            marginTop: 10,
            letterSpacing: "0.04em",
          }}
        >
          app.wallio.ma
        </div>
      </div>
    </div>
  );
}
