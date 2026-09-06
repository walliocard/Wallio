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

export type StampStyle = "dot"|"ring"|"plus"|"check"|"heart"|"star"|"text"|"logo";

export interface AppleWalletCardProps {
  logoUrl?: string;
  logoText: string;
  stripContent?: React.ReactNode;
  stripUrl?: string;
  previewCropY?: number;
  previewZoom?: number;
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
  mode?: "full" | "compact" | "back";
  backInfo?: string;
  description?: string;
  headerField?: { label: string; value: string };
  auxiliaryFields?: { label: string; value: string }[];
  stampsOnStrip?: boolean;
  stripStampStyle?: StampStyle;
  stampText?: string;
  stampTextBold?: boolean;
  stampTextItalic?: boolean;
  stampTextSize?: number;
  stampColor?: string;
  stampPosition?: number;
  stampSizePreset?: "s"|"m"|"l";
  stampThickness?: number;
  stampLogoOpacity?: number;
}

export default function AppleWalletCard({
  logoUrl,
  logoText,
  stripContent,
  stripUrl,
  previewCropY = 50,
  previewZoom = 1,
  backgroundColor,
  foregroundColor,
  labelColor,
  stampsCurrent,
  stampsObjective,
  rewardName,
  clientPrenom = "Prénom",
  clientNom = "Nom",
  primaryLabel = "Tampons",
  rewardLabel = "Récompense",
  memberLabel = "Membre",
  previewUid,
  mode = "full",
  backInfo,
  description,
  headerField,
  auxiliaryFields = [],
  stampsOnStrip = false,
  stripStampStyle = "dot",
  stampText = "",
  stampTextBold = false,
  stampTextItalic = false,
  stampTextSize = 1,
  stampColor = "#FFFFFF",
  stampPosition = 50,
  stampSizePreset = "m",
  stampThickness = 2,
  stampLogoOpacity = 1,
}: AppleWalletCardProps) {
  const [qr, setQr] = useState("");

  const bg = /^#[0-9a-f]{6}$/i.test(backgroundColor) ? backgroundColor : "#1C1C1E";
  const dark = relativeLuminance(bg) < 0.35;
  const fg = foregroundColor ?? (dark ? "#FFFFFF" : "#000000");
  const labelClr = labelColor ?? (dark ? "rgba(255,255,255,0.55)" : "rgba(0,0,0,0.42)");
  const sep = dark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)";

  const qrUrl = previewUid ? `WALLIO:${previewUid}` : "WALLIO:demo";

  useEffect(() => {
    QRCode.toDataURL(qrUrl, {
      width: 400,
      margin: 0,
      color: { dark: "#000000", light: "#FFFFFF" },
      errorCorrectionLevel: "M",
    })
      .then(setQr)
      .catch(() => {});
  }, [qrUrl]);

  const clientName = `${clientPrenom} ${clientNom}`.trim();

  // ── Mode compact (aperçu liste Wallet) ──────────────────────────────────────
  if (mode === "compact") {
    return (
      <div
        style={{
          width: 375,
          height: 70,
          background: bg,
          borderRadius: 14,
          overflow: "hidden",
          display: "flex",
          alignItems: "center",
          padding: "0 14px",
          gap: 10,
          fontFamily: "-apple-system, 'SF Pro Display', 'Helvetica Neue', sans-serif",
          boxShadow: "0 4px 20px rgba(0,0,0,0.25)",
          WebkitFontSmoothing: "antialiased",
          boxSizing: "border-box",
        }}
      >
        {/* Logo */}
        <div style={{
          height: 24, width: 24, flexShrink: 0,
          borderRadius: 5,
          border: logoUrl ? "none" : `1px dashed ${dark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.15)"}`,
          overflow: "hidden",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          {logoUrl
            ? <img src={logoUrl} alt="" style={{ height: 24, width: 24, objectFit: "contain", display: "block" }} />
            : <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={dark ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.2)"} strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="3" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>
          }
        </div>

        {/* Nom */}
        <span style={{
          flex: 1,
          fontSize: 15, fontWeight: 600, color: fg,
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        }}>
          {logoText || "Ma carte"}
        </span>

        {/* Tampons */}
        <span style={{ fontSize: 14, fontWeight: 500, color: fg, flexShrink: 0 }}>
          {stampsCurrent}/{stampsObjective}
        </span>

        {/* Chevron */}
        <svg width="8" height="13" viewBox="0 0 8 13" fill="none" style={{ flexShrink: 0 }}>
          <path d="M1 1l6 5.5L1 12" stroke={fg} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    );
  }

  // ── Mode back (dos de carte) ──────────────────────────────────────────────
  if (mode === "back") {
    const backBg = dark ? "#F2F2F7" : bg;
    const backFg = "#1C1C1E";
    const backLabel = "rgba(60,60,67,0.6)";
    const backSep = "rgba(60,60,67,0.12)";

    const backFields: Array<{ label: string; value: string }> = [];
    if (backInfo) backFields.push({ label: "Informations", value: backInfo });
    backFields.push({ label: "Contact", value: "support@walliocard.com" });
    backFields.push({
      label: "Données personnelles",
      value: "Vos données sont traitées conformément au RGPD. Vous pouvez demander leur suppression à tout moment via support@walliocard.com.",
    });
    if (description) backFields.push({ label: "Programme", value: description });

    return (
      <div
        style={{
          width: 375,
          background: backBg,
          borderRadius: 20,
          overflow: "hidden",
          fontFamily: "-apple-system, 'SF Pro Display', 'Helvetica Neue', sans-serif",
          boxShadow: "0 24px 80px rgba(0,0,0,0.45)",
          WebkitFontSmoothing: "antialiased",
        }}
      >
        {/* Header dos */}
        <div style={{
          padding: "16px 16px 14px",
          borderBottom: `1px solid ${backSep}`,
          display: "flex", alignItems: "center", gap: 10,
        }}>
          {logoUrl && (
            <img src={logoUrl} alt="" style={{ height: 30, maxWidth: 80, objectFit: "contain" }} />
          )}
          <span style={{ fontSize: 15, fontWeight: 600, color: backFg }}>{logoText || "Ma carte"}</span>
        </div>

        {/* Champs */}
        {backFields.map((field, i) => (
          <div
            key={i}
            style={{
              padding: "12px 16px",
              borderBottom: i < backFields.length - 1 ? `1px solid ${backSep}` : "none",
            }}
          >
            <div style={{
              fontSize: 10, color: backLabel,
              textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 3,
            }}>
              {field.label}
            </div>
            <div style={{ fontSize: 13, color: backFg, lineHeight: 1.5 }}>
              {field.value}
            </div>
          </div>
        ))}

        {/* Pied */}
        <div style={{
          padding: "14px 16px",
          borderTop: `1px solid ${backSep}`,
          display: "flex", justifyContent: "center",
        }}>
          <span style={{ fontSize: 11, color: backLabel }}>walliocard.com</span>
        </div>
      </div>
    );
  }

  // ── Mode full (défaut) ────────────────────────────────────────────────────
  return (
    <div
      style={{
        width: 375,
        flexShrink: 0,
        background: bg,
        borderRadius: 20,
        overflow: "hidden",
        fontFamily: "-apple-system, 'SF Pro Display', 'Helvetica Neue', sans-serif",
        boxShadow: "0 24px 80px rgba(0,0,0,0.45)",
        WebkitFontSmoothing: "antialiased",
      }}
    >
      {/* ── Header ── */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 16px 12px" }}>
        {/* Logo */}
        <div style={{
          height: 38, minWidth: 38, maxWidth: 110, flexShrink: 0,
          borderRadius: 8,
          border: logoUrl ? "none" : `1.5px dashed ${dark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.15)"}`,
          overflow: "hidden",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          {logoUrl
            ? <img src={logoUrl} alt="" style={{ height: 38, maxWidth: 110, objectFit: "contain", display: "block" }} />
            : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={dark ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.2)"} strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="3" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>
          }
        </div>
        {logoText && (
          <span style={{
            flex: 1, fontSize: 15, fontWeight: 600, color: fg,
            letterSpacing: -0.2, overflow: "hidden",
            textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>
            {logoText}
          </span>
        )}
        {/* Tampons en header — reproduit fidèlement le layout Apple Wallet réel */}
        <div style={{ flexShrink: 0, textAlign: "right" }}>
          <div style={{ fontSize: 9, color: labelClr, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 2 }}>
            {headerField?.value ? headerField.label : primaryLabel}
          </div>
          <div style={{ fontSize: 13, fontWeight: 600, color: fg }}>
            {headerField?.value ? headerField.value : `${stampsCurrent}/${stampsObjective}`}
          </div>
        </div>
      </div>

      {/* ── Strip zone — toujours visible (375 × 144 pt) ── */}
      <div style={{ width: 375, height: 144, overflow: "hidden", position: "relative", flexShrink: 0 }}>
        {stripUrl ? (
          <img src={stripUrl} alt="" style={{
            width: "100%", height: "100%", objectFit: "cover",
            objectPosition: `50% ${previewCropY}%`,
            transform: previewZoom > 1 ? `scale(${previewZoom})` : "none",
            transformOrigin: `50% ${previewCropY}%`,
          }} />
        ) : stripContent ? (
          <div style={{ width: 375, height: 144, flexShrink: 0 }}>{stripContent}</div>
        ) : (
          <div style={{
            width: "100%", height: "100%",
            border: `1.5px dashed ${dark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.1)"}`,
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            gap: 8,
          }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={dark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.15)"} strokeWidth="1.5">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            <span style={{ fontSize: 11, color: dark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.15)", letterSpacing: "0.04em" }}>
              Bannière
            </span>
          </div>
        )}

        {/* Overlay tampons sur bannière */}
        {stampsOnStrip && stampsObjective > 0 && (
          <StampCircles
            total={stampsObjective} filled={stampsCurrent} style={stripStampStyle}
            text={stampText} textBold={stampTextBold} textItalic={stampTextItalic} textSize={stampTextSize}
            color={stampColor} position={stampPosition} sizePreset={stampSizePreset}
            thickness={stampThickness} logoUrl={logoUrl} logoOpacity={stampLogoOpacity}
          />
        )}
      </div>

      {/* ── Secondary fields (ligne 1 — toujours 2 champs) ── */}
      <div style={{ display: "flex", padding: "12px 16px 8px", gap: 8 }}>
        {[
          { label: rewardLabel, value: rewardName || "—" },
          { label: memberLabel, value: clientName },
        ].map((f, i) => (
          <div key={i} style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 9, color: labelClr, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 2 }}>
              {f.label}
            </div>
            <div style={{ fontSize: 15, fontWeight: 500, color: fg, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {f.value}
            </div>
          </div>
        ))}
      </div>

      {/* ── Auxiliary fields (ligne 2 — jusqu'à 3 champs marchand) ── */}
      {(() => {
        const frontAux = auxiliaryFields.filter(f => f.value).slice(0, 3);
        if (!frontAux.length) return null;
        return (
          <div style={{ display: "flex", padding: "0 16px 12px", gap: 6 }}>
            {frontAux.map((f, i) => (
              <div key={i} style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 9, color: labelClr, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 2 }}>
                  {f.label || "INFO"}
                </div>
                <div style={{ fontSize: 12, fontWeight: 500, color: fg, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {f.value}
                </div>
              </div>
            ))}
          </div>
        );
      })()}

      {/* ── Séparateur ── */}
      <div style={{ height: 1, background: sep, margin: "0 16px" }} />

      {/* ── Barcode — centré, 200×200 comme Apple Wallet réel ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "20px 16px 24px" }}>
        <div style={{ background: "#FFFFFF", borderRadius: 12, padding: 10, boxShadow: "0 1px 6px rgba(0,0,0,0.10)" }}>
          {qr ? (
            <img src={qr} alt="QR Code" style={{ width: 200, height: 200, display: "block" }} />
          ) : (
            <div style={{ width: 200, height: 200, background: "#f0f0f0", borderRadius: 4 }} />
          )}
        </div>
      </div>
    </div>
  );
}

const STAMP_ICONS: Record<string, string> = {
  heart: "M12 20C12 20 4 14 4 8.5 4 5.9 6.2 4 8.5 4c1.5 0 2.9.9 3.5 2.2C12.6 4.9 14 4 15.5 4 17.8 4 20 5.9 20 8.5 20 14 12 20 12 20Z",
  star:  "M12 2.5l2.4 6.9H22l-6 4.3 2.3 6.9-6.3-4.6-6.3 4.6 2.3-6.9-6-4.3h7.6Z",
};

function StampCircles({
  total, filled, style = "dot",
  text = "", textBold = false, textItalic = false, textSize = 1,
  color = "#FFFFFF", position = 50, sizePreset = "m",
  thickness = 2, logoUrl = "", logoOpacity = 1,
}: {
  total: number; filled: number;
  style?: StampStyle;
  text?: string; textBold?: boolean; textItalic?: boolean; textSize?: number;
  color?: string; position?: number; sizePreset?: "s"|"m"|"l";
  thickness?: number; logoUrl?: string; logoOpacity?: number;
}) {
  const sizeMult = sizePreset === "s" ? 0.72 : sizePreset === "l" ? 1.28 : 1.0;
  const perRow = total <= 8 ? total : Math.ceil(total / 2);
  const rows = Math.ceil(total / perRow);
  const gap = Math.round(Math.max(6, 10 * sizeMult));
  const baseSize = Math.min(36, Math.floor((343 - (perRow - 1) * gap) / perRow));
  const s = Math.max(14, Math.round(baseSize * sizeMult));

  const stampY = typeof position === "number" ? position : position === "top" ? 20 : position === "bottom" ? 80 : 50;

  const filledBorder = color;
  const filledBg = color + "22";
  const emptyBorder = color + "44";

  const thicknessPx = Math.max(0.5, (s * 0.06) * (thickness / 2));

  const Inner = ({ isFilled }: { isFilled: boolean }) => {
    if (!isFilled) return null;

    if (style === "text" && text) {
      const chars = text.length;
      const fontSize = Math.min(s * 0.72 / Math.max(1, chars * 0.65), s * 0.38) * textSize;
      return (
        <span style={{
          fontSize: Math.max(5, fontSize), fontWeight: textBold ? 700 : 500,
          fontStyle: textItalic ? "italic" : "normal", color,
          textAlign: "center", lineHeight: 1.1, letterSpacing: chars <= 3 ? "0.04em" : "0",
          wordBreak: "break-all", userSelect: "none", maxWidth: s * 0.78,
        }}>
          {text}
        </span>
      );
    }

    if (style === "logo" && logoUrl) {
      return (
        <div style={{
          width: s * 0.72, height: s * 0.72, borderRadius: "50%",
          overflow: "hidden", opacity: logoOpacity, flexShrink: 0,
        }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logoUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        </div>
      );
    }

    if (style === "dot") {
      return <div style={{ width: s * 0.36, height: s * 0.36, borderRadius: "50%", background: color }} />;
    }

    if (style === "plus") {
      const bar = s * 0.36, thick = Math.max(1.5, thicknessPx * 0.8);
      return (
        <div style={{ position: "relative", width: bar, height: bar }}>
          <div style={{ position: "absolute", top: "50%", left: 0, width: bar, height: thick, marginTop: -thick / 2, background: color, borderRadius: thick }} />
          <div style={{ position: "absolute", left: "50%", top: 0, width: thick, height: bar, marginLeft: -thick / 2, background: color, borderRadius: thick }} />
        </div>
      );
    }

    if (style === "check") {
      return (
        <svg width={s * 0.52} height={s * 0.52} viewBox="0 0 14 14" fill="none">
          <polyline points="2,7 5.5,10.5 12,3" stroke={color} strokeWidth={Math.max(1, thicknessPx * 0.9)} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    }

    if (style === "ring") {
      return <div style={{ width: s * 0.5, height: s * 0.5, borderRadius: "50%", border: `${thicknessPx}px solid ${color}` }} />;
    }

    const iconPath = STAMP_ICONS[style];
    if (iconPath) {
      return (
        <svg width={s * 0.52} height={s * 0.52} viewBox="0 0 24 24" fill="none"
          stroke={color} strokeWidth={Math.max(1, thicknessPx * 0.9)} strokeLinecap="round" strokeLinejoin="round">
          <path d={iconPath} />
        </svg>
      );
    }
    return null;
  };

  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
    <div style={{
      position: "absolute", left: "50%", top: `${stampY}%`,
      transform: "translate(-50%, -50%)",
      display: "flex", flexDirection: "column",
      alignItems: "center", gap,
    }}>
      {Array.from({ length: rows }).map((_, row) => {
        const start = row * perRow;
        const count = Math.min(perRow, total - start);
        return (
          <div key={row} style={{ display: "flex", gap }}>
            {Array.from({ length: count }).map((_, col) => {
              const idx = start + col;
              const isFilled = idx < filled;
              return (
                <div key={col} style={{
                  width: s, height: s, borderRadius: "50%", flexShrink: 0,
                  background: isFilled ? filledBg : "transparent",
                  border: `${thicknessPx}px solid ${isFilled ? filledBorder : emptyBorder}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <Inner isFilled={isFilled} />
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
    </div>
  );
}
