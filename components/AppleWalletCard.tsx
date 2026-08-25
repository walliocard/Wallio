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
  stripStampStyle?: "dot"|"plus"|"ring"|"stamp"|"heart"|"star"|"bolt"|"crown"|"flower"|"diamond"|"text"|"bar";
  stampText?: string;
  stampTextBold?: boolean;
  stampTextItalic?: boolean;
  stampTextSize?: number;
  stampColor?: string;
  stampPosition?: "top"|"center"|"bottom";
  stampSizePreset?: "s"|"m"|"l";
  stampSubText?: string;
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
  stampPosition = "center",
  stampSizePreset = "m",
  stampSubText = "",
}: AppleWalletCardProps) {
  const [qr, setQr] = useState("");

  const bg = /^#[0-9a-f]{6}$/i.test(backgroundColor) ? backgroundColor : "#1C1C1E";
  const dark = relativeLuminance(bg) < 0.35;
  const fg = foregroundColor ?? (dark ? "#FFFFFF" : "#000000");
  const labelClr = labelColor ?? (dark ? "rgba(255,255,255,0.55)" : "rgba(0,0,0,0.42)");
  const sep = dark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)";

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
    backFields.push({ label: "Contact", value: "support@wallio.ma" });
    backFields.push({
      label: "Données personnelles",
      value: "Vos données sont traitées conformément au RGPD. Vous pouvez demander leur suppression à tout moment via support@wallio.ma.",
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
          <span style={{ fontSize: 11, color: backLabel }}>wallio.ma</span>
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
        {/* Champ en-tête haut droite — officiel Apple Wallet */}
        {headerField?.value && (
          <div style={{ flexShrink: 0, textAlign: "right" }}>
            <div style={{ fontSize: 9, color: labelClr, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 2 }}>
              {headerField.label}
            </div>
            <div style={{ fontSize: 13, fontWeight: 600, color: fg }}>
              {headerField.value}
            </div>
          </div>
        )}
      </div>

      {/* ── Strip zone — toujours visible (375 × 144 pt) ── */}
      <div style={{ width: 375, height: 144, overflow: "hidden", position: "relative", flexShrink: 0 }}>
        {stripUrl ? (
          <img src={stripUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
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
            color={stampColor} position={stampPosition} sizePreset={stampSizePreset} subText={stampSubText}
          />
        )}
      </div>

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
          {primaryLabel}
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
          <span style={{ fontSize: 24, fontWeight: 400, opacity: 0.55, marginLeft: 6 }}>
            / {stampsObjective}
          </span>
        </div>
      </div>

      {/* ── Secondary fields ── */}
      <div style={{ display: "flex", padding: "12px 16px 14px", borderBottom: `1px solid ${sep}` }}>
        <div style={{ flex: 1, paddingRight: 8 }}>
          <div style={{ fontSize: 10, color: labelClr, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 3 }}>
            {rewardLabel}
          </div>
          <div style={{ fontSize: 15, fontWeight: 500, color: fg, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {rewardName || "—"}
          </div>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 10, color: labelClr, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 3 }}>
            {memberLabel}
          </div>
          <div style={{ fontSize: 15, fontWeight: 500, color: fg, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {clientName}
          </div>
        </div>
      </div>

      {/* ── Auxiliary fields (entre secondary et barcode — officiel Apple Wallet) ── */}
      {auxiliaryFields.filter(f => f.value).length > 0 && (
        <div style={{ display: "flex", padding: "10px 16px 12px", borderBottom: `1px solid ${sep}`, gap: 8 }}>
          {auxiliaryFields.filter(f => f.value).slice(0, 4).map((f, i) => (
            <div key={i} style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 10, color: labelClr, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 3 }}>
                {f.label}
              </div>
              <div style={{ fontSize: 14, fontWeight: 500, color: fg, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {f.value}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Barcode (Apple Wallet impose cette zone en bas, centrée) ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "24px 16px 24px" }}>
        <div style={{ background: "#FFFFFF", borderRadius: 10, padding: 8, border: "1px solid rgba(0,0,0,0.08)" }}>
          {qr ? (
            <img src={qr} alt="QR Code" style={{ width: 100, height: 100, display: "block" }} />
          ) : (
            <div style={{ width: 100, height: 100, background: "#f0f0f0", borderRadius: 4 }} />
          )}
        </div>
      </div>
    </div>
  );
}

// Icônes SVG style tampon encreur (contours blancs, viewBox 24×24)
const STAMP_ICONS: Record<string, string> = {
  heart:   "M12 21C12 21 3 14 3 8.5 3 5.4 5.4 3 8.5 3c1.7 0 3.3.9 4.3 2.3C13.8 3.9 15.4 3 17.5 3 20.6 3 23 5.4 23 8.5 23 14 14 21 12 21Z",
  star:    "M12 2 14.9 9H22l-5.8 4.2 2.2 7L12 16.2 5.6 20.2l2.2-7L2 9h7.1Z",
  bolt:    "M13 2 5 14h7l-1 8 9-12h-7Z",
  crown:   "M3 18V9l3.5 5L12 2l5.5 12L21 9v9H3Z",
  flower:  "M12 12m-2 0a2 2 0 1 0 4 0a2 2 0 1 0-4 0M12 5a3 3 0 0 1 0 6M12 13a3 3 0 0 1 0 6M5 12a3 3 0 0 1 6 0M13 12a3 3 0 0 1 6 0",
  diamond: "M12 2 22 12 12 22 2 12Z",
};

function StampCircles({
  total, filled, style = "dot",
  text = "", textBold = false, textItalic = false, textSize = 1,
  color = "#FFFFFF", position = "center", sizePreset = "m", subText = "",
}: {
  total: number; filled: number;
  style?: "dot"|"plus"|"ring"|"stamp"|"heart"|"star"|"bolt"|"crown"|"flower"|"diamond"|"text"|"bar";
  text?: string; textBold?: boolean; textItalic?: boolean; textSize?: number;
  color?: string; position?: "top"|"center"|"bottom"; sizePreset?: "s"|"m"|"l"; subText?: string;
}) {
  const sizeMult = sizePreset === "s" ? 0.72 : sizePreset === "l" ? 1.28 : 1.0;
  const perRow = total <= 8 ? total : Math.ceil(total / 2);
  const rows = Math.ceil(total / perRow);
  const gap = Math.round(Math.max(6, 10 * sizeMult));
  const baseSize = Math.min(36, Math.floor((343 - (perRow - 1) * gap) / perRow));
  const s = Math.max(14, Math.round(baseSize * sizeMult));

  // Position verticale
  const justifyContent = position === "top" ? "flex-start" : position === "bottom" ? "flex-end" : "center";
  const paddingV = position === "top" ? `${Math.round(s * 0.35)}px 16px 0` : position === "bottom" ? `0 16px ${Math.round(s * 0.35)}px` : "0 16px";

  // Couleurs dérivées de `color`
  const filledBorder = color;
  const filledBg = color + "30"; // 18% opacity
  const emptyBorder = color + "55"; // 33% opacity

  const iconPath = STAMP_ICONS[style];

  // ── Style Barre de progression ──────────────────────────────────────────────
  if (style === "bar") {
    const pct = total > 0 ? Math.round((filled / total) * 100) : 0;
    const barH = Math.max(6, Math.round(s * 0.32));
    return (
      <div style={{
        position: "absolute", inset: 0,
        display: "flex", flexDirection: "column", alignItems: "center",
        justifyContent, padding: paddingV, pointerEvents: "none", gap: 5,
      }}>
        <div style={{ width: "100%", height: barH, borderRadius: barH, overflow: "hidden", background: emptyBorder }}>
          {pct > 0 && (
            <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: barH, minWidth: barH }} />
          )}
        </div>
        {filled > 0 && (
          <span style={{ fontSize: Math.max(8, s * 0.28), fontWeight: 600, color, letterSpacing: "0.04em" }}>
            {filled} / {total}
          </span>
        )}
      </div>
    );
  }

  const Inner = ({ isFilled }: { isFilled: boolean }) => {
    if (!isFilled) return null;

    // Style texte — auto-fit dans le cercle
    if (style === "text" && text) {
      const chars = text.length;
      // Taille de base : adapte au nombre de caractères et à la taille du cercle
      const innerW = s * 0.72;
      const baseFontSize = innerW / Math.max(1, chars * 0.65);
      const fontSize = Math.min(baseFontSize, s * 0.38) * textSize;
      return (
        <div style={{
          width: s * 0.78, maxHeight: s * 0.78,
          display: "flex", alignItems: "center", justifyContent: "center",
          overflow: "hidden",
        }}>
          <span style={{
            fontSize: Math.max(5, fontSize),
            fontWeight: textBold ? 700 : 500,
            fontStyle: textItalic ? "italic" : "normal",
            color,
            textAlign: "center",
            lineHeight: 1.1,
            letterSpacing: chars <= 3 ? "0.04em" : "0",
            wordBreak: "break-all",
            userSelect: "none",
          }}>
            {text}
          </span>
        </div>
      );
    }

    // Formes SVG — avec sous-texte combo optionnel
    if (iconPath) {
      const sw = Math.max(1.2, s * 0.09);
      const iconH = subText ? s * 0.42 : s * 0.58;
      return (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }}>
          <svg width={iconH} height={iconH} viewBox="0 0 24 24" fill="none"
            stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
            <path d={iconPath} />
          </svg>
          {subText && (
            <span style={{
              fontSize: Math.max(5, s * 0.16), fontWeight: 700, color,
              letterSpacing: "0.03em", lineHeight: 1, textTransform: "uppercase",
            }}>
              {subText.slice(0, 6)}
            </span>
          )}
        </div>
      );
    }
    if (style === "dot") {
      return <div style={{ width: s * 0.38, height: s * 0.38, borderRadius: "50%", background: color }} />;
    }
    if (style === "plus") {
      const bar = s * 0.38, thick = s * 0.1;
      return (
        <div style={{ position: "relative", width: bar, height: bar }}>
          <div style={{ position: "absolute", top: "50%", left: 0, width: bar, height: thick, marginTop: -thick/2, background: color, borderRadius: 2 }} />
          <div style={{ position: "absolute", left: "50%", top: 0, width: thick, height: bar, marginLeft: -thick/2, background: color, borderRadius: 2 }} />
        </div>
      );
    }
    if (style === "ring") {
      return <div style={{ width: s * 0.42, height: s * 0.42, borderRadius: "50%", border: `${Math.max(1.5, s * 0.07)}px solid ${color}` }} />;
    }
    return null;
  };

  return (
    <div style={{
      position: "absolute", inset: 0,
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent,
      gap, padding: paddingV, pointerEvents: "none",
    }}>
      {Array.from({ length: rows }).map((_, row) => {
        const start = row * perRow;
        const count = Math.min(perRow, total - start);
        return (
          <div key={row} style={{ display: "flex", gap }}>
            {Array.from({ length: count }).map((_, col) => {
              const idx = start + col;
              const isFilled = idx < filled;
              const bw = Math.max(1.5, s * 0.07);

              // Style tampon encre
              if (style === "stamp") {
                return (
                  <div key={col} style={{
                    width: s, height: s, borderRadius: "50%", flexShrink: 0, position: "relative",
                    border: `${Math.max(2, s * 0.07)}px ${isFilled ? "solid" : "dashed"} ${isFilled ? filledBorder : emptyBorder}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    {isFilled && (
                      <>
                        <div style={{ width: s * 0.54, height: s * 0.54, borderRadius: "50%", background: color + "E0" }} />
                        <div style={{ position: "absolute", width: s * 0.76, height: s * 0.76, borderRadius: "50%", border: `${Math.max(1, s * 0.04)}px solid ${color + "88"}` }} />
                      </>
                    )}
                  </div>
                );
              }

              return (
                <div key={col} style={{
                  width: s, height: s, borderRadius: "50%", flexShrink: 0,
                  background: isFilled ? filledBg : "transparent",
                  border: `${bw}px solid ${isFilled ? filledBorder : emptyBorder}`,
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
  );
}
