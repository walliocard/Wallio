// Canvas maître : 1500 × 1000 px (ratio 3:2)
// Toutes les coordonnées sont exprimées pour ce canvas.
// À l'export : scale = finalWidth / 1500

export const PRINT_W = 1500;
export const PRINT_H = 1000;

async function loadImg(src: string): Promise<HTMLImageElement | null> {
  return new Promise(resolve => {
    const img = new Image();
    img.onload  = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

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
      img.onload  = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = dataUrl;
    });
  } catch { return null; }
}

function rr(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y,     x + w, y + r,     r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x,     y + h, x,     y + h - r, r);
  ctx.lineTo(x,     y + r);
  ctx.arcTo(x,     y,     x + r, y,         r);
  ctx.closePath();
}

export async function drawPrintCard(
  canvas: HTMLCanvasElement,
  qrUrl: string,
  scale = 1,
) {
  // scale = finalWidth / 1500
  const W = PRINT_W * scale;
  const H = PRINT_H * scale;
  canvas.width  = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  const p = (v: number) => v * scale; // proportional helper

  const font = `-apple-system, 'Helvetica Neue', Arial, sans-serif`;
  const blue  = "#4472F5";
  const indigo = "#6A5AF9";
  const violet = "#8A5CF6";

  // ── 1. CANVAS BACKGROUND ─────────────────────────────────────────────────
  ctx.fillStyle = "#F0F0F5";
  ctx.fillRect(0, 0, W, H);

  // ── 1b. CARTE (X:50 Y:50 W:1400 H:900 R:55) ──────────────────────────────
  ctx.shadowColor   = "rgba(0,0,0,0.10)";
  ctx.shadowBlur    = p(40);
  ctx.shadowOffsetY = p(8);
  rr(ctx, p(50), p(50), p(1400), p(900), p(55));
  ctx.fillStyle = "#F8F8FA";
  ctx.fill();
  ctx.shadowColor = "transparent"; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;

  // Clip everything inside the card
  ctx.save();
  rr(ctx, p(50), p(50), p(1400), p(900), p(55));
  ctx.clip();

  // ── 14. VAGUES (derrière tout le reste du bas) ────────────────────────────
  // Début Y ≈ 660, descend jusqu'à Y ≈ 950 (bord bas carte = Y:50+900=950)
  const waves = [
    { dy: 0,   opa: 0.10, c: "100,140,255" },
    { dy: 30,  opa: 0.08, c: "130,110,250" },
    { dy: -20, opa: 0.06, c: "165,110,245" },
  ];
  waves.forEach(({ dy, opa, c }) => {
    const y0 = p(660 + dy);
    ctx.beginPath();
    ctx.moveTo(p(50),   y0 + p(60));
    ctx.bezierCurveTo(p(350),  y0 - p(30), p(600),  y0 + p(70), p(750),  y0 + p(20));
    ctx.bezierCurveTo(p(900),  y0 - p(20), p(1150), y0 + p(50), p(1450), y0 + p(30));
    ctx.lineTo(p(1450), p(950));
    ctx.lineTo(p(50),   p(950));
    ctx.closePath();
    ctx.fillStyle = `rgba(${c},${opa})`;
    ctx.fill();
  });

  // ── 2. TITRE (X:180 Y:120 W:1140 font:64px) ──────────────────────────────
  ctx.font = `600 ${p(64)}px ${font}`;
  ctx.textBaseline = "top";
  ctx.textAlign    = "left";

  const p1 = "Votre fidélité. ";
  const p2 = "Simplifiée.";
  const w1 = ctx.measureText(p1).width;
  const w2 = ctx.measureText(p2).width;
  const titleTotalW = w1 + w2;
  const titleStartX = p(750) - titleTotalW / 2; // centré sur 750

  ctx.fillStyle = "#15171A";
  ctx.fillText(p1, titleStartX, p(120));

  const gTitle = ctx.createLinearGradient(titleStartX + w1, 0, titleStartX + w1 + w2, 0);
  gTitle.addColorStop(0, blue);
  gTitle.addColorStop(0.5, indigo);
  gTitle.addColorStop(1, violet);
  ctx.fillStyle = gTitle;
  ctx.fillText(p2, titleStartX + w1, p(120));

  // ── 3. SOUS-TITRE (X:250 Y:220 font:24px) ────────────────────────────────
  ctx.font      = `400 ${p(24)}px ${font}`;
  ctx.fillStyle = "#596170";
  ctx.textAlign = "center";
  ctx.fillText("Ajoutez notre carte à votre portefeuille en quelques secondes.", p(750), p(220));

  // ── 5. BLOC NFC (X:120 Y:315 W:570 H:300 R:36) ───────────────────────────
  ctx.shadowColor   = "rgba(0,0,0,0.06)";
  ctx.shadowBlur    = p(20);
  ctx.shadowOffsetY = p(4);
  rr(ctx, p(120), p(315), p(570), p(300), p(36));
  ctx.fillStyle = "#FFFFFF";
  ctx.fill();
  ctx.shadowColor = "transparent"; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
  ctx.strokeStyle = "rgba(68,114,245,0.45)";
  ctx.lineWidth   = p(1.5);
  ctx.stroke();

  // NFC : grand cercle gris rempli (le fond du "tap zone")
  const ncx = p(290), ncy = p(465);
  ctx.beginPath();
  ctx.arc(ncx, ncy, p(90), 0, Math.PI * 2);
  ctx.fillStyle = "#EAECF3";
  ctx.fill();

  // Anneaux concentriques subtils (180 → 105)
  [180, 155, 130, 105].forEach((d, i) => {
    ctx.beginPath();
    ctx.arc(ncx, ncy, p(d / 2), 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(170,178,218,${0.30 - i * 0.06})`;
    ctx.lineWidth   = p(1.2);
    ctx.stroke();
  });

  // Logo NFC SVG — centré dans le cercle gris (agrandi à 110×110)
  const nfcImg = await loadImg("/nfc-icon.svg");
  if (nfcImg) {
    ctx.drawImage(nfcImg, p(235), p(410), p(110), p(110));
  }

  // ── 6. TEXTE NFC (X:420 Y:405) ───────────────────────────────────────────
  ctx.textAlign    = "left";
  ctx.textBaseline = "top";

  ctx.font      = `600 ${p(30)}px ${font}`;
  const tapW    = ctx.measureText("TAPEZ ").width;
  ctx.fillStyle = "#15171A";
  ctx.fillText("TAPEZ ", p(420), p(405));
  ctx.fillStyle = blue;
  ctx.fillText("NFC", p(420) + tapW, p(405));

  ctx.font      = `400 ${p(20)}px ${font}`;
  ctx.fillStyle = "#596170";
  ctx.fillText("Approchez votre", p(420), p(405 + 36 + 18));
  ctx.fillText("téléphone ici",   p(420), p(405 + 36 + 18 + 28));

  // ── 8. BLOC QR (X:810 Y:315 W:570 H:300 R:36) ────────────────────────────
  ctx.shadowColor   = "rgba(0,0,0,0.06)";
  ctx.shadowBlur    = p(20);
  ctx.shadowOffsetY = p(4);
  rr(ctx, p(810), p(315), p(570), p(300), p(36));
  ctx.fillStyle = "#FFFFFF";
  ctx.fill();
  ctx.shadowColor = "transparent"; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
  ctx.strokeStyle = `rgba(68,114,245,0.45)`;
  ctx.lineWidth   = p(1.5);
  ctx.stroke();

  // ── 9. QR CODE (X:850 Y:360 W:210 H:210) ────────────────────────────────
  const qrSize = Math.round(p(210));
  const qrImg  = await loadQRImage(qrUrl, qrSize);
  if (qrImg) {
    ctx.drawImage(qrImg, p(850), p(360), p(210), p(210));
  } else {
    ctx.fillStyle = "#F0F0F0";
    rr(ctx, p(850), p(360), p(210), p(210), p(8));
    ctx.fill();
  }

  // ── 10. TEXTE QR (X:1100 Y:375) ──────────────────────────────────────────
  ctx.textAlign    = "left";
  ctx.textBaseline = "top";
  ctx.font         = `600 ${p(30)}px ${font}`;

  // "SCANNEZ" ligne 1
  ctx.fillStyle = "#15171A";
  ctx.fillText("SCANNEZ", p(1100), p(375));

  // "LE " + "CODE" gradient ligne 2
  const leW = ctx.measureText("LE ").width;
  ctx.fillStyle = "#15171A";
  ctx.fillText("LE ", p(1100), p(375 + 34));

  const gCode = ctx.createLinearGradient(p(1100) + leW, 0, p(1100) + leW + ctx.measureText("CODE").width, 0);
  gCode.addColorStop(0, blue);
  gCode.addColorStop(1, violet);
  ctx.fillStyle = gCode;
  ctx.fillText("CODE", p(1100) + leW, p(375 + 34));

  // Description
  ctx.font      = `400 ${p(17)}px ${font}`;
  ctx.fillStyle = "#596170";
  const descY   = p(375 + 34 + 34 + 18);
  ctx.fillText("Ouvrez l'appareil photo",     p(1100), descY);
  ctx.fillText("de votre téléphone et",       p(1100), descY + p(24));
  ctx.fillText("ajoutez la carte",            p(1100), descY + p(48));

  // ── 7. SÉPARATEUR CENTRAL (X=750) ────────────────────────────────────────
  ctx.strokeStyle = "rgba(0,0,0,0.10)";
  ctx.lineWidth   = p(1);

  // Ligne sup : (749, 330) → (749, 430)
  ctx.beginPath();
  ctx.moveTo(p(750), p(330));
  ctx.lineTo(p(750), p(430));
  ctx.stroke();

  // Cercle "OU" : centre (750, 465) r=35
  ctx.beginPath();
  ctx.arc(p(750), p(465), p(35), 0, Math.PI * 2);
  ctx.fillStyle = "#F8F8FA";
  ctx.fill();
  ctx.stroke();

  ctx.font      = `500 ${p(20)}px ${font}`;
  ctx.fillStyle = "#8E8E93";
  ctx.textAlign    = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("OU", p(750), p(465));

  // Ligne inf : (749, 500) → (749, 615)
  ctx.beginPath();
  ctx.moveTo(p(750), p(500));
  ctx.lineTo(p(750), p(615));
  ctx.strokeStyle = "rgba(0,0,0,0.10)";
  ctx.lineWidth   = p(1);
  ctx.stroke();

  // ── 11. "Ajoutez à votre portefeuille" (X:500 Y:680) ─────────────────────
  ctx.font      = `400 ${p(18)}px ${font}`;
  ctx.fillStyle = "#596170";
  ctx.textAlign    = "center";
  ctx.textBaseline = "top";
  ctx.fillText("Ajoutez à votre portefeuille", p(750), p(680));

  // Badges helper : image SVG directe, letterbox, pas de fond ajouté
  function drawBadge(img: HTMLImageElement | null, x: number, y: number, w: number, h: number) {
    if (!img) return;
    const natR = img.naturalWidth / (img.naturalHeight || 1);
    const boxW = p(w), boxH = p(h);
    const boxR = boxW / boxH;
    let dw: number, dh: number;
    if (natR > boxR) { dw = boxW; dh = boxW / natR; }
    else             { dh = boxH; dw = boxH * natR; }
    const dx = p(x) + (boxW - dw) / 2;
    const dy = p(y) + (boxH - dh) / 2;
    ctx.drawImage(img, dx, dy, dw, dh);
  }

  // ── 12. BADGE APPLE (X:435 Y:725 W:300 H:78) ─────────────────────────────
  const appleImg = await loadImg("/apple-wallet-badge.svg");
  drawBadge(appleImg, 435, 725, 300, 78);

  // ── 13. BADGE GOOGLE (X:765 Y:725 W:300 H:78) ────────────────────────────
  const googleImg = await loadImg("/google-wallet-badge.svg");
  drawBadge(googleImg, 765, 725, 300, 78);

  // ── 15. WALLIO (X:625 Y:855 W:250 letter-spacing:8px) ────────────────────
  ctx.font         = `500 ${p(24)}px ${font}`;
  ctx.textAlign    = "center";
  ctx.textBaseline = "top";
  ctx.fillStyle    = indigo;
  ctx.letterSpacing = `${p(8)}px`;
  ctx.fillText("WALLIO", p(750), p(855));
  ctx.letterSpacing = "0px";

  ctx.restore(); // end card clip
}
