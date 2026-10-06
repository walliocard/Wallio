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
  secondaryLabel = "Objectif",
  textModules = [],
  links = [],
  previewUid,
  clientPrenom,
  clientNom,
  rewardLabel = "Récompense",
  memberLabel = "Membre",
}: GoogleWalletCardProps) {
  const [qr, setQr] = useState("");

  const bg = /^#[0-9a-f]{6}$/i.test(backgroundColor) ? backgroundColor : "#1A73E8";
  const dark = isDarkBg(bg);
  const headerText = dark ? "#FFFFFF" : "#1A1A1A";
  const headerTextSec = dark ? "rgba(255,255,255,0.65)" : "rgba(0,0,0,0.55)";

  const qrValue = previewUid ? `WALLIO:${previewUid}` : "WALLIO:preview";
  const memberName = clientPrenom && clientNom ? `${clientPrenom} ${clientNom[0]}.` : clientPrenom || "Client fidèle";

  useEffect(() => {
    QRCode.toDataURL(qrValue, {
      width: 400, margin: 1,
      color: { dark: "#1A1A1A", light: "#FFFFFF" },
      errorCorrectionLevel: "M",
    }).then(setQr).catch(() => {});
  }, [qrValue]);

  const validModules = textModules.filter(m => m.header && m.body);
  const validLinks = links.filter(l => l.uri && l.description);
  const pct = Math.min(100, Math.round((stampsCurrent / stampsObjective) * 100));

  return (
    <div style={{
      width: 340,
      borderRadius: 16,
      overflow: "hidden",
      fontFamily: "'Google Sans', Roboto, 'Helvetica Neue', sans-serif",
      boxShadow: "0 4px 24px rgba(0,0,0,0.22), 0 1px 4px rgba(0,0,0,0.10)",
      WebkitFontSmoothing: "antialiased",
      background: "#FFFFFF",
    }}>

      {/* ── Header coloré ── */}
      <div style={{ background: bg, padding: "14px 16px 12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {/* Logo */}
          <div style={{
            width: 40, height: 40, borderRadius: 10, flexShrink: 0,
            background: dark ? "rgba(255,255,255,0.18)" : "rgba(0,0,0,0.08)",
            overflow: "hidden",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            {logoUrl
              ? <img src={logoUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              : <span style={{ fontSize: 18, fontWeight: 700, color: headerText }}>{logoText?.[0]?.toUpperCase() || "W"}</span>
            }
          </div>
          {/* Nom programme */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 15, fontWeight: 700, color: headerText, margin: 0, lineHeight: 1.2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {logoText}
            </p>
            <p style={{ fontSize: 11, color: headerTextSec, margin: 0, marginTop: 1 }}>
              Programme de fidélité
            </p>
          </div>
          {/* Google Wallet badge */}
          <div style={{ flexShrink: 0, opacity: 0.7 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill={dark ? "white" : "#1A1A1A"}>
              <path d="M21 7H3a1 1 0 00-1 1v8a1 1 0 001 1h18a1 1 0 001-1V8a1 1 0 00-1-1z" opacity=".3"/>
              <path d="M21 6H3c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm0 10H3V8h18v8z"/>
            </svg>
          </div>
        </div>
      </div>

      {/* ── Hero image ── */}
      {heroUrl && (
        <div style={{ width: "100%", height: 100, overflow: "hidden" }}>
          <img src={heroUrl} alt="" style={{
            width: "100%", height: "100%", objectFit: "cover", display: "block",
            objectPosition: `50% ${previewCropY}%`,
            transform: previewZoom > 1 ? `scale(${previewZoom})` : "none",
            transformOrigin: `50% ${previewCropY}%`,
          }} />
        </div>
      )}

      {/* ── Compteur tampons ── */}
      <div style={{ padding: "14px 16px 10px", borderBottom: "1px solid rgba(0,0,0,0.07)" }}>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 8 }}>
          <div>
            <p style={{ fontSize: 10, fontWeight: 700, color: "#5F6368", textTransform: "uppercase", letterSpacing: 0.8, margin: "0 0 2px" }}>
              {primaryLabel}
            </p>
            <p style={{ fontSize: 32, fontWeight: 700, color: bg, margin: 0, lineHeight: 1 }}>
              {stampsCurrent}<span style={{ fontSize: 16, fontWeight: 400, color: "#9AA0A6", marginLeft: 2 }}>/{stampsObjective}</span>
            </p>
          </div>
          <div style={{ textAlign: "right" }}>
            <p style={{ fontSize: 10, fontWeight: 700, color: "#5F6368", textTransform: "uppercase", letterSpacing: 0.8, margin: "0 0 2px" }}>
              {secondaryLabel}
            </p>
            <p style={{ fontSize: 13, fontWeight: 600, color: "#3C4043", margin: 0 }}>{stampsObjective}</p>
          </div>
        </div>
        {/* Barre de progression */}
        <div style={{ height: 4, borderRadius: 2, background: "rgba(0,0,0,0.08)", overflow: "hidden" }}>
          <div style={{ height: "100%", borderRadius: 2, background: bg, width: `${pct}%`, transition: "width 0.5s ease" }} />
        </div>
      </div>

      {/* ── Membre + Récompense ── */}
      <div style={{ display: "flex", borderBottom: "1px solid rgba(0,0,0,0.07)" }}>
        <div style={{ flex: 1, padding: "10px 16px" }}>
          <p style={{ fontSize: 10, fontWeight: 700, color: "#5F6368", textTransform: "uppercase", letterSpacing: 0.8, margin: "0 0 2px" }}>
            {memberLabel}
          </p>
          <p style={{ fontSize: 13, fontWeight: 500, color: "#3C4043", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {memberName}
          </p>
        </div>
        {rewardName && (
          <div style={{ flex: 1, padding: "10px 16px", borderLeft: "1px solid rgba(0,0,0,0.07)" }}>
            <p style={{ fontSize: 10, fontWeight: 700, color: "#5F6368", textTransform: "uppercase", letterSpacing: 0.8, margin: "0 0 2px" }}>
              {rewardLabel}
            </p>
            <p style={{ fontSize: 13, fontWeight: 500, color: "#3C4043", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {rewardName}
            </p>
          </div>
        )}
      </div>

      {/* ── Text modules ── */}
      {validModules.map((m, i) => (
        <div key={m.id} style={{
          padding: "10px 16px",
          borderBottom: i < validModules.length - 1 || validLinks.length > 0 ? "1px solid rgba(0,0,0,0.07)" : "none",
        }}>
          <p style={{ fontSize: 10, fontWeight: 700, color: "#5F6368", textTransform: "uppercase", letterSpacing: 0.8, margin: "0 0 2px" }}>
            {m.header}
          </p>
          <p style={{ fontSize: 13, fontWeight: 500, color: "#3C4043", margin: 0 }}>{m.body}</p>
        </div>
      ))}

      {/* ── Liens ── */}
      {validLinks.length > 0 && (
        <div style={{ padding: "10px 16px", display: "flex", flexWrap: "wrap", gap: 6, borderBottom: "1px solid rgba(0,0,0,0.07)" }}>
          {validLinks.map((l, i) => (
            <span key={i} style={{
              display: "inline-flex", alignItems: "center", gap: 4,
              padding: "5px 12px", borderRadius: 20, fontSize: 12, fontWeight: 500,
              background: `${bg}18`, color: bg, border: `1px solid ${bg}30`,
            }}>
              {l.description}
            </span>
          ))}
        </div>
      )}

      {/* ── QR Code ── */}
      <div style={{ padding: "12px 16px 14px", display: "flex", justifyContent: "center", background: "#FAFAFA" }}>
        {qr
          ? <img src={qr} alt="QR" style={{ width: 110, height: 110, display: "block", borderRadius: 4 }} />
          : <div style={{ width: 110, height: 110, background: "#f0f0f0", borderRadius: 4 }} />
        }
      </div>

    </div>
  );
}
