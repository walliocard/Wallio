// Print-ready counter card — 160×100mm @ 300 DPI = 1890×1181px
// Reproduces the WALLIO reference design exactly.

export const PRINT_W = 1890;
export const PRINT_H = 1181;

async function loadQRImage(url: string, size: number): Promise<HTMLImageElement | null> {
  try {
    const QRCode = (await import("qrcode")).default;
    const dataUrl = await QRCode.toDataURL(url, {
      width: size, margin: 2,
      color: { dark: "#000000", light: "#FFFFFF" },
      errorCorrectionLevel: "H",
    });
    return new Promise(resolve => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = dataUrl;
    });
  } catch { return null; }
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}

function drawNFCIcon(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number) {
  // Outer glow circles (very faint concentric rings = tap zone)
  for (let i = 3; i >= 1; i--) {
    const r = size * (0.42 + i * 0.16);
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(100,120,240,${0.06 - i * 0.012})`;
    ctx.lineWidth = size * 0.025;
    ctx.stroke();
  }

  // Background circle (light gray)
  ctx.beginPath();
  ctx.arc(cx, cy, size * 0.44, 0, Math.PI * 2);
  ctx.fillStyle = "#F0F0F5";
  ctx.fill();

  // Inner faint ring
  ctx.beginPath();
  ctx.arc(cx, cy, size * 0.42, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(180,185,220,0.5)";
  ctx.lineWidth = size * 0.018;
  ctx.stroke();

  // NFC arcs (3 arcs, opens to the right, from -50° to +50°)
  const blue = "#4E7EF6";
  const startAng = -Math.PI * 0.5;
  const endAng = Math.PI * 0.5;

  ctx.lineCap = "round";
  [0.10, 0.19, 0.29].forEach((rFrac, i) => {
    const r = size * rFrac;
    const opacity = 1 - i * 0.15;
    ctx.beginPath();
    ctx.arc(cx - size * 0.04, cy, r, startAng, endAng);
    ctx.strokeStyle = blue + Math.round(opacity * 255).toString(16).padStart(2, "0");
    ctx.lineWidth = size * 0.055;
    ctx.stroke();
  });

  // Center dot
  ctx.beginPath();
  ctx.arc(cx - size * 0.04, cy, size * 0.045, 0, Math.PI * 2);
  ctx.fillStyle = blue;
  ctx.fill();
}

function drawWaves(ctx: CanvasRenderingContext2D, W: number, H: number, waveY: number) {
  const waves = [
    { offset: 0,   opacity: 0.10, color: "100,140,255" },
    { offset: 40,  opacity: 0.09, color: "130,120,250" },
    { offset: -30, opacity: 0.07, color: "170,120,245" },
  ];

  waves.forEach(({ offset, opacity, color }) => {
    const y0 = waveY + offset;
    ctx.beginPath();
    ctx.moveTo(0, y0 + 80);
    ctx.bezierCurveTo(W * 0.15, y0 - 30, W * 0.30, y0 + 60, W * 0.50, y0 + 20);
    ctx.bezierCurveTo(W * 0.68, y0 - 20, W * 0.82, y0 + 50, W, y0 + 30);
    ctx.lineTo(W, H);
    ctx.lineTo(0, H);
    ctx.closePath();
    ctx.fillStyle = `rgba(${color},${opacity})`;
    ctx.fill();
  });
}

function drawWalletBadge(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
  iconColor: string, iconShape: "apple" | "google",
  line1: string, line2: string,
) {
  // Badge background
  roundRect(ctx, x, y, w, h, h * 0.22);
  ctx.fillStyle = "#FFFFFF";
  ctx.fill();
  ctx.strokeStyle = "rgba(0,0,0,0.10)";
  ctx.lineWidth = 2;
  ctx.stroke();

  const iconSize = h * 0.42;
  const iconX = x + h * 0.28;
  const iconY = y + h / 2;

  if (iconShape === "apple") {
    // Apple Wallet icon — simplified wallet shape
    const s = iconSize;
    ctx.fillStyle = "#1C1C1E";
    ctx.beginPath();
    ctx.roundRect(iconX - s * 0.5, iconY - s * 0.45, s, s * 0.9, s * 0.18);
    ctx.fill();
    ctx.fillStyle = "#30D158";
    ctx.beginPath();
    ctx.roundRect(iconX - s * 0.35, iconY - s * 0.05, s * 0.7, s * 0.38, s * 0.08);
    ctx.fill();
    ctx.fillStyle = "#FFFFFF";
    ctx.font = `700 ${s * 0.28}px -apple-system, Helvetica`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("W", iconX, iconY + s * 0.08);
  } else {
    // Google Wallet icon — G in multicolor
    const s = iconSize * 0.9;
    const colors = ["#4285F4", "#EA4335", "#FBBC05", "#34A853"];
    const angles = [0, 90, 180, 270];
    angles.forEach((startDeg, i) => {
      const start = (startDeg * Math.PI) / 180;
      const end = ((startDeg + 90) * Math.PI) / 180;
      ctx.beginPath();
      ctx.moveTo(iconX, iconY);
      ctx.arc(iconX, iconY, s * 0.46, start - Math.PI / 2, end - Math.PI / 2);
      ctx.closePath();
      ctx.fillStyle = colors[i];
      ctx.fill();
    });
    // White center circle
    ctx.beginPath();
    ctx.arc(iconX, iconY, s * 0.22, 0, Math.PI * 2);
    ctx.fillStyle = "#FFFFFF";
    ctx.fill();
  }

  // Text
  const textX = iconX + iconSize * 0.72;
  ctx.fillStyle = "rgba(60,60,67,0.55)";
  ctx.font = `400 ${h * 0.18}px -apple-system, 'Helvetica Neue', sans-serif`;
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText(line1, textX, y + h * 0.35);

  ctx.fillStyle = "#1D1D1F";
  ctx.font = `600 ${h * 0.26}px -apple-system, 'Helvetica Neue', sans-serif`;
  ctx.fillText(line2, textX, y + h * 0.67);
}

export async function drawPrintCard(
  canvas: HTMLCanvasElement,
  qrUrl: string,
  scale = 1,
) {
  const W = PRINT_W * scale;
  const H = PRINT_H * scale;
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  const s = scale; // shorthand

  // ── 1. BACKGROUND ────────────────────────────────────────────────────────
  const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
  bgGrad.addColorStop(0, "#FFFFFF");
  bgGrad.addColorStop(1, "#F3F4F8");
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, W, H);

  // ── 2. TITLE ZONE ─────────────────────────────────────────────────────────
  const titleY = 118 * s;
  const titleSize = 96 * s;
  const font = `-apple-system, 'Helvetica Neue', Arial, sans-serif`;

  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";

  // Measure both parts to build the gradient
  ctx.font = `700 ${titleSize}px ${font}`;
  const part1 = "Votre fidélité. ";
  const part2 = "Simplifiée.";
  const w1 = ctx.measureText(part1).width;
  const w2 = ctx.measureText(part2).width;
  const totalW = w1 + w2;
  const titleX = (W - totalW) / 2;

  // "Votre fidélité." in dark
  ctx.fillStyle = "#1D1D1F";
  ctx.fillText(part1, titleX + w1 / 2, titleY);

  // "Simplifiée." with gradient
  const gx1 = titleX + w1;
  const gradText = ctx.createLinearGradient(gx1, 0, gx1 + w2, 0);
  gradText.addColorStop(0, "#4E7EF6");
  gradText.addColorStop(0.5, "#6A5AF9");
  gradText.addColorStop(1, "#8A5CF6");
  ctx.fillStyle = gradText;
  ctx.fillText(part2, gx1 + w2 / 2, titleY);

  // Subtitle
  ctx.font = `400 ${37 * s}px ${font}`;
  ctx.fillStyle = "#6E6E73";
  ctx.fillText("Ajoutez notre carte à votre portefeuille en quelques secondes.", W / 2, titleY + 70 * s);

  // ── 3. ACTION PANELS ──────────────────────────────────────────────────────
  const PAD = 72 * s;
  const GAP = 68 * s;
  const panelY = 218 * s;
  const panelH = 480 * s;
  const panelW = (W - PAD * 2 - GAP) / 2;
  const panelR = 36 * s;
  const leftX = PAD;
  const rightX = PAD + panelW + GAP;

  // Shadow helper
  function shadow(blur: number, alpha: number) {
    ctx.shadowColor = `rgba(0,0,0,${alpha})`;
    ctx.shadowBlur = blur * s;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 4 * s;
  }
  function noShadow() {
    ctx.shadowColor = "transparent";
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
  }

  // Left panel (NFC)
  shadow(28, 0.07);
  roundRect(ctx, leftX, panelY, panelW, panelH, panelR);
  ctx.fillStyle = "#FFFFFF";
  ctx.fill();
  noShadow();
  ctx.strokeStyle = "rgba(0,0,0,0.07)";
  ctx.lineWidth = 1.5 * s;
  ctx.stroke();

  // Right panel (QR) — with blue border
  shadow(28, 0.07);
  roundRect(ctx, rightX, panelY, panelW, panelH, panelR);
  ctx.fillStyle = "#FFFFFF";
  ctx.fill();
  noShadow();
  ctx.strokeStyle = "rgba(78,126,246,0.5)";
  ctx.lineWidth = 2.5 * s;
  ctx.stroke();

  // ── 4. NFC ICON ───────────────────────────────────────────────────────────
  const nfcCX = leftX + panelW * 0.30;
  const nfcCY = panelY + panelH / 2;
  drawNFCIcon(ctx, nfcCX, nfcCY, 170 * s);

  // "TAPEZ NFC" label
  const labelX = leftX + panelW * 0.56;
  const labelY = nfcCY - 52 * s;
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.font = `700 ${60 * s}px ${font}`;

  ctx.fillStyle = "#1D1D1F";
  ctx.fillText("TAPEZ ", labelX, labelY);
  const tapezW = ctx.measureText("TAPEZ ").width;

  ctx.fillStyle = "#4E7EF6";
  ctx.fillText("NFC", labelX + tapezW, labelY);

  // Subtext multiline
  ctx.font = `400 ${30 * s}px ${font}`;
  ctx.fillStyle = "#8E8E93";
  ctx.fillText("Approchez votre", labelX, labelY + 52 * s);
  ctx.fillText("téléphone ici", labelX, labelY + 90 * s);

  // ── 5. SEPARATOR "OU" ────────────────────────────────────────────────────
  const sepX = PAD + panelW + GAP / 2;
  const sepMidY = panelY + panelH / 2;

  ctx.beginPath();
  ctx.moveTo(sepX, panelY + 55 * s);
  ctx.lineTo(sepX, panelY + panelH - 55 * s);
  ctx.strokeStyle = "rgba(0,0,0,0.10)";
  ctx.lineWidth = 1.5 * s;
  ctx.stroke();

  const orR = 30 * s;
  ctx.beginPath();
  ctx.arc(sepX, sepMidY, orR, 0, Math.PI * 2);
  ctx.fillStyle = "#FFFFFF";
  ctx.fill();
  ctx.strokeStyle = "rgba(0,0,0,0.10)";
  ctx.lineWidth = 1.5 * s;
  ctx.stroke();

  ctx.font = `500 ${22 * s}px ${font}`;
  ctx.fillStyle = "#8E8E93";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("OU", sepX, sepMidY);

  // ── 6. QR CODE ───────────────────────────────────────────────────────────
  const qrSize = Math.round(310 * s);
  const qrImg = await loadQRImage(qrUrl, qrSize);
  const qrPad = 22 * s;
  const qrX = rightX + qrPad + 10 * s;
  const qrY = panelY + (panelH - qrSize) / 2;

  if (qrImg) {
    // White backing with subtle shadow
    shadow(12, 0.06);
    ctx.fillStyle = "#FFFFFF";
    roundRect(ctx, qrX - qrPad * 0.5, qrY - qrPad * 0.5, qrSize + qrPad, qrSize + qrPad, 12 * s);
    ctx.fill();
    noShadow();
    ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);
  } else {
    // Placeholder
    ctx.fillStyle = "#F0F0F0";
    roundRect(ctx, qrX, qrY, qrSize, qrSize, 8 * s);
    ctx.fill();
  }

  // "SCANNEZ LE CODE" text
  const qrTextX = qrX + qrSize + qrPad + 20 * s;
  const qrTextY = panelY + panelH / 2 - 70 * s;
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";

  ctx.font = `700 ${52 * s}px ${font}`;
  ctx.fillStyle = "#1D1D1F";
  ctx.fillText("SCANNEZ", qrTextX, qrTextY);
  ctx.fillText("LE ", qrTextX, qrTextY + 65 * s);

  const leW = ctx.measureText("LE ").width;
  const gradCode = ctx.createLinearGradient(qrTextX + leW, 0, qrTextX + leW + 160 * s, 0);
  gradCode.addColorStop(0, "#4E7EF6");
  gradCode.addColorStop(1, "#8A5CF6");
  ctx.fillStyle = gradCode;
  ctx.fillText("CODE", qrTextX + leW, qrTextY + 65 * s);

  ctx.font = `400 ${27 * s}px ${font}`;
  ctx.fillStyle = "#8E8E93";
  ctx.fillText("Ouvrez l'appareil photo", qrTextX, qrTextY + 120 * s);
  ctx.fillText("de votre téléphone", qrTextX, qrTextY + 153 * s);
  ctx.fillText("et ajoutez la carte", qrTextX, qrTextY + 186 * s);

  // ── 7. WAVES ─────────────────────────────────────────────────────────────
  const waveY = panelY + panelH + 55 * s;
  drawWaves(ctx, W, H, waveY);

  // ── 8. WALLET BADGES ─────────────────────────────────────────────────────
  ctx.font = `400 ${28 * s}px ${font}`;
  ctx.fillStyle = "#8E8E93";
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.fillText("Ajoutez à votre portefeuille", W / 2, waveY + 38 * s);

  const badgeW = 280 * s;
  const badgeH = 72 * s;
  const badgeGap = 20 * s;
  const badgeTotalW = badgeW * 2 + badgeGap;
  const badgeX1 = (W - badgeTotalW) / 2;
  const badgeX2 = badgeX1 + badgeW + badgeGap;
  const badgeY = waveY + 62 * s;

  drawWalletBadge(ctx, badgeX1, badgeY, badgeW, badgeH, "#1C1C1E", "apple", "Ajouter à", "Apple Wallet");
  drawWalletBadge(ctx, badgeX2, badgeY, badgeW, badgeH, "#4285F4", "google", "Ajouter à", "Google Wallet");

  // ── 9. WALLIO BRANDING ───────────────────────────────────────────────────
  ctx.textAlign = "center";
  ctx.font = `500 ${24 * s}px ${font}`;
  ctx.fillStyle = "#C7C7CC";
  ctx.letterSpacing = `${5 * s}px`;
  ctx.fillText("WALLIO", W / 2, badgeY + badgeH + 42 * s);
  ctx.letterSpacing = "0px";

  ctx.font = `400 ${20 * s}px ${font}`;
  ctx.fillStyle = "#D1D1D6";
  ctx.fillText("wallio.app", W / 2, badgeY + badgeH + 68 * s);
}
