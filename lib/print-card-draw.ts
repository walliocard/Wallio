// Canvas maître : 1500 × 1057 px (A5 paysage — 210 × 148 mm à ~180 DPI)
// Toutes les coordonnées sont exprimées pour ce canvas.
// À l'export : scale = finalWidth / 1500

export const PRINT_W = 1500;
export const PRINT_H = 1057; // A5 paysage

// QR seul : A5 paysage également
export const QR_W = 1500;
export const QR_H = 1057;

// ── Textes traduits ──────────────────────────────────────────────────────────

type CardLang = "fr" | "ro" | "es";

const TEXTS: Record<CardLang, {
  title1: string; title2: string;
  subtitle: string;
  nfc_verb: string; nfc_desc1: string; nfc_desc2: string;
  qr_verb: string; qr_pre: string; qr_grad: string;
  qr_desc1: string; qr_desc2: string; qr_desc3: string;
  add_wallet: string; ou: string;
}> = {
  fr: {
    title1: "Votre fidélité. ", title2: "Simplifiée.",
    subtitle: "Ajoutez notre carte à votre portefeuille en quelques secondes.",
    nfc_verb: "TAPEZ ", nfc_desc1: "Approchez votre", nfc_desc2: "téléphone ici",
    qr_verb: "SCANNEZ", qr_pre: "LE ", qr_grad: "CODE",
    qr_desc1: "Ouvrez l'appareil photo", qr_desc2: "de votre téléphone et", qr_desc3: "ajoutez la carte",
    add_wallet: "Ajoutez à votre portefeuille", ou: "OU",
  },
  ro: {
    title1: "Fidelitatea ta. ", title2: "Simplificată.",
    subtitle: "Adaugă cardul tău la portofel în câteva secunde.",
    nfc_verb: "ATINGE ", nfc_desc1: "Apropie telefonul", nfc_desc2: "de tag",
    qr_verb: "SCANEAZĂ", qr_pre: "", qr_grad: "CODUL",
    qr_desc1: "Deschide camera", qr_desc2: "telefonului și", qr_desc3: "adaugă cardul",
    add_wallet: "Adaugă la portofel", ou: "SAU",
  },
  es: {
    title1: "Tu fidelidad. ", title2: "Simplificada.",
    subtitle: "Añade tu tarjeta al monedero en segundos.",
    nfc_verb: "ACERCA ", nfc_desc1: "Acerca tu teléfono", nfc_desc2: "al tag NFC",
    qr_verb: "ESCANEA", qr_pre: "EL ", qr_grad: "CÓDIGO",
    qr_desc1: "Abre la cámara", qr_desc2: "de tu teléfono y", qr_desc3: "añade la tarjeta",
    add_wallet: "Añadir al monedero", ou: "O",
  },
};

// ── Utilitaires ──────────────────────────────────────────────────────────────

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

function drawBadgeCentered(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement | null,
  cx: number, y: number, w: number, h: number,
  p: (v: number) => number,
) {
  if (!img) return;
  const natR = img.naturalWidth / (img.naturalHeight || 1);
  const boxW = p(w), boxH = p(h);
  const boxR = boxW / boxH;
  let dw: number, dh: number;
  if (natR > boxR) { dw = boxW; dh = boxW / natR; }
  else             { dh = boxH; dw = boxH * natR; }
  ctx.drawImage(img, cx - dw / 2, y + (boxH - dh) / 2, dw, dh);
}

// ── NFC + QR (A5 paysage) ────────────────────────────────────────────────────

export async function drawPrintCard(
  canvas: HTMLCanvasElement,
  qrUrl: string,
  scale = 1,
  lang: CardLang = "fr",
) {
  const W = PRINT_W * scale;
  const H = PRINT_H * scale;
  canvas.width  = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  const p = (v: number) => v * scale;

  const T    = TEXTS[lang] ?? TEXTS.fr;
  const font  = `-apple-system, 'Helvetica Neue', Arial, sans-serif`;
  const blue  = "#4472F5";
  const indigo = "#6A5AF9";
  const violet = "#8A5CF6";

  // 1. Background
  ctx.fillStyle = "#F0F0F5";
  ctx.fillRect(0, 0, W, H);

  // 2. Card (A5 paysage — 50px margins all sides)
  const CARD_H = PRINT_H - 100; // 957
  ctx.shadowColor = "rgba(0,0,0,0.10)";
  ctx.shadowBlur = p(40); ctx.shadowOffsetY = p(8);
  rr(ctx, p(50), p(50), p(1400), p(CARD_H), p(55));
  ctx.fillStyle = "#F8F8FA"; ctx.fill();
  ctx.shadowColor = "transparent"; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;

  ctx.save();
  rr(ctx, p(50), p(50), p(1400), p(CARD_H), p(55));
  ctx.clip();

  // Vagues (fond bas de carte)
  const CARD_BOTTOM = 50 + CARD_H; // 1007
  const waves = [
    { dy: 0,   opa: 0.10, c: "100,140,255" },
    { dy: 30,  opa: 0.08, c: "130,110,250" },
    { dy: -20, opa: 0.06, c: "165,110,245" },
  ];
  waves.forEach(({ dy, opa, c }) => {
    const y0 = p(700 + dy);
    ctx.beginPath();
    ctx.moveTo(p(50),   y0 + p(60));
    ctx.bezierCurveTo(p(350),  y0 - p(30), p(600),  y0 + p(70), p(750),  y0 + p(20));
    ctx.bezierCurveTo(p(900),  y0 - p(20), p(1150), y0 + p(50), p(1450), y0 + p(30));
    ctx.lineTo(p(1450), p(CARD_BOTTOM));
    ctx.lineTo(p(50),   p(CARD_BOTTOM));
    ctx.closePath();
    ctx.fillStyle = `rgba(${c},${opa})`; ctx.fill();
  });

  // Titre
  ctx.font = `600 ${p(64)}px ${font}`;
  ctx.textBaseline = "top"; ctx.textAlign = "left";
  const w1 = ctx.measureText(T.title1).width;
  const w2 = ctx.measureText(T.title2).width;
  const titleStartX = p(750) - (w1 + w2) / 2;
  ctx.fillStyle = "#15171A";
  ctx.fillText(T.title1, titleStartX, p(120));
  const gTitle = ctx.createLinearGradient(titleStartX + w1, 0, titleStartX + w1 + w2, 0);
  gTitle.addColorStop(0, blue); gTitle.addColorStop(0.5, indigo); gTitle.addColorStop(1, violet);
  ctx.fillStyle = gTitle;
  ctx.fillText(T.title2, titleStartX + w1, p(120));

  // Sous-titre
  ctx.font = `400 ${p(24)}px ${font}`;
  ctx.fillStyle = "#596170"; ctx.textAlign = "center";
  ctx.fillText(T.subtitle, p(750), p(220));

  // Bloc NFC (gauche)
  ctx.shadowColor = "rgba(0,0,0,0.06)"; ctx.shadowBlur = p(20); ctx.shadowOffsetY = p(4);
  rr(ctx, p(120), p(315), p(570), p(300), p(36));
  ctx.fillStyle = "#FFFFFF"; ctx.fill();
  ctx.shadowColor = "transparent"; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
  ctx.strokeStyle = "rgba(68,114,245,0.45)"; ctx.lineWidth = p(1.5); ctx.stroke();

  // Cercle NFC (Liquid Glass)
  const ncx = p(290), ncy = p(465);
  ctx.save();
  ctx.beginPath(); ctx.arc(ncx, ncy, p(90), 0, Math.PI * 2); ctx.clip();
  const glassBase = ctx.createRadialGradient(ncx, ncy - p(20), 0, ncx, ncy, p(90));
  glassBase.addColorStop(0,   "rgba(255,255,255,0.92)");
  glassBase.addColorStop(0.5, "rgba(252,252,255,0.78)");
  glassBase.addColorStop(1,   "rgba(245,245,250,0.60)");
  ctx.fillStyle = glassBase; ctx.fillRect(ncx - p(90), ncy - p(90), p(180), p(180));
  const specGrad = ctx.createLinearGradient(ncx - p(90), ncy - p(90), ncx + p(20), ncy + p(10));
  specGrad.addColorStop(0,    "rgba(255,255,255,0.65)");
  specGrad.addColorStop(0.30, "rgba(255,255,255,0.18)");
  specGrad.addColorStop(1,    "rgba(255,255,255,0.00)");
  ctx.fillStyle = specGrad; ctx.fillRect(ncx - p(90), ncy - p(90), p(180), p(180));
  ctx.restore();
  const rimGrad = ctx.createLinearGradient(ncx, ncy - p(90), ncx, ncy + p(90));
  rimGrad.addColorStop(0,   "rgba(255,255,255,0.90)");
  rimGrad.addColorStop(0.5, "rgba(210,215,230,0.30)");
  rimGrad.addColorStop(1,   "rgba(190,200,220,0.15)");
  ctx.beginPath(); ctx.arc(ncx, ncy, p(90), 0, Math.PI * 2);
  ctx.strokeStyle = rimGrad; ctx.lineWidth = p(1.5); ctx.stroke();

  const nfcImg = await loadImg("/nfc-icon.svg");
  if (nfcImg) ctx.drawImage(nfcImg, p(235), p(410), p(110), p(110));

  // Texte NFC
  ctx.textAlign = "left"; ctx.textBaseline = "top";
  ctx.font = `600 ${p(30)}px ${font}`;
  const verbW = ctx.measureText(T.nfc_verb).width;
  ctx.fillStyle = "#15171A"; ctx.fillText(T.nfc_verb, p(420), p(405));
  ctx.fillStyle = blue;      ctx.fillText("NFC", p(420) + verbW, p(405));
  ctx.font = `400 ${p(20)}px ${font}`; ctx.fillStyle = "#596170";
  ctx.fillText(T.nfc_desc1, p(420), p(405 + 36 + 18));
  ctx.fillText(T.nfc_desc2, p(420), p(405 + 36 + 18 + 28));

  // Bloc QR (droite)
  ctx.shadowColor = "rgba(0,0,0,0.06)"; ctx.shadowBlur = p(20); ctx.shadowOffsetY = p(4);
  rr(ctx, p(810), p(315), p(570), p(300), p(36));
  ctx.fillStyle = "#FFFFFF"; ctx.fill();
  ctx.shadowColor = "transparent"; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
  ctx.strokeStyle = "rgba(68,114,245,0.45)"; ctx.lineWidth = p(1.5); ctx.stroke();

  const qrSize = Math.round(p(210));
  const qrImg  = await loadQRImage(qrUrl, qrSize);
  if (qrImg) {
    ctx.drawImage(qrImg, p(850), p(360), p(210), p(210));
  } else {
    ctx.fillStyle = "#F0F0F0"; rr(ctx, p(850), p(360), p(210), p(210), p(8)); ctx.fill();
  }

  // Texte QR
  ctx.textAlign = "left"; ctx.textBaseline = "top";
  ctx.font = `600 ${p(30)}px ${font}`;
  ctx.fillStyle = "#15171A"; ctx.fillText(T.qr_verb, p(1100), p(375));
  if (T.qr_pre) {
    const preW = ctx.measureText(T.qr_pre).width;
    ctx.fillStyle = "#15171A"; ctx.fillText(T.qr_pre, p(1100), p(375 + 34));
    const gCode = ctx.createLinearGradient(p(1100) + preW, 0, p(1100) + preW + ctx.measureText(T.qr_grad).width, 0);
    gCode.addColorStop(0, blue); gCode.addColorStop(1, violet);
    ctx.fillStyle = gCode; ctx.fillText(T.qr_grad, p(1100) + preW, p(375 + 34));
  } else {
    const gCode = ctx.createLinearGradient(p(1100), 0, p(1100) + ctx.measureText(T.qr_grad).width, 0);
    gCode.addColorStop(0, blue); gCode.addColorStop(1, violet);
    ctx.fillStyle = gCode; ctx.fillText(T.qr_grad, p(1100), p(375 + 34));
  }
  ctx.font = `400 ${p(17)}px ${font}`; ctx.fillStyle = "#596170";
  const descY = p(375 + 34 + 34 + 18);
  ctx.fillText(T.qr_desc1, p(1100), descY);
  ctx.fillText(T.qr_desc2, p(1100), descY + p(24));
  ctx.fillText(T.qr_desc3, p(1100), descY + p(48));

  // Séparateur "OU"
  ctx.strokeStyle = "rgba(0,0,0,0.10)"; ctx.lineWidth = p(1);
  ctx.beginPath(); ctx.moveTo(p(750), p(330)); ctx.lineTo(p(750), p(430)); ctx.stroke();
  ctx.beginPath(); ctx.arc(p(750), p(465), p(35), 0, Math.PI * 2);
  ctx.fillStyle = "#F8F8FA"; ctx.fill(); ctx.stroke();
  ctx.font = `500 ${p(20)}px ${font}`; ctx.fillStyle = "#8E8E93";
  ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.fillText(T.ou, p(750), p(465));
  ctx.beginPath(); ctx.moveTo(p(750), p(500)); ctx.lineTo(p(750), p(615));
  ctx.strokeStyle = "rgba(0,0,0,0.10)"; ctx.lineWidth = p(1); ctx.stroke();

  // "Ajoutez à votre portefeuille"
  ctx.font = `400 ${p(18)}px ${font}`; ctx.fillStyle = "#596170";
  ctx.textAlign = "center"; ctx.textBaseline = "top";
  ctx.fillText(T.add_wallet, p(750), p(710));

  // Badges Wallet
  const appleImg  = await loadImg("/apple-wallet-badge.svg");
  const googleImg = await loadImg("/google-wallet-badge.svg");
  drawBadgeCentered(ctx, appleImg,  p(435), p(755), 300, 78, p);
  drawBadgeCentered(ctx, googleImg, p(1065), p(755), 300, 78, p);

  // WALLIO
  ctx.font = `500 ${p(24)}px ${font}`; ctx.textAlign = "center"; ctx.textBaseline = "top";
  ctx.fillStyle = indigo;
  ctx.letterSpacing = `${p(8)}px`;
  ctx.fillText("WALLIO", p(750), p(900));
  ctx.letterSpacing = "0px";

  ctx.restore();
}

// ── QR seul (A5 paysage) ────────────────────────────────────────────────────

export async function drawPrintCardQROnly(
  canvas: HTMLCanvasElement,
  qrUrl: string,
  scale = 1,
  lang: CardLang = "fr",
) {
  const W = QR_W * scale;
  const H = QR_H * scale;
  canvas.width  = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  const p = (v: number) => v * scale;

  const T     = TEXTS[lang] ?? TEXTS.fr;
  const font  = `-apple-system, 'Helvetica Neue', Arial, sans-serif`;
  const blue  = "#4472F5";
  const indigo = "#6A5AF9";
  const violet = "#8A5CF6";

  const CARD_H = QR_H - 100; // 957

  // Background
  ctx.fillStyle = "#F0F0F5";
  ctx.fillRect(0, 0, W, H);

  // Card
  ctx.shadowColor = "rgba(0,0,0,0.10)"; ctx.shadowBlur = p(40); ctx.shadowOffsetY = p(8);
  rr(ctx, p(50), p(50), p(1400), p(CARD_H), p(55));
  ctx.fillStyle = "#F8F8FA"; ctx.fill();
  ctx.shadowColor = "transparent"; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;

  ctx.save();
  rr(ctx, p(50), p(50), p(1400), p(CARD_H), p(55));
  ctx.clip();

  const CARD_BOTTOM = 50 + CARD_H;

  // Vagues
  const waves = [
    { dy: 0,   opa: 0.10, c: "100,140,255" },
    { dy: 35,  opa: 0.08, c: "130,110,250" },
    { dy: -25, opa: 0.06, c: "165,110,245" },
  ];
  waves.forEach(({ dy, opa, c }) => {
    const y0 = p(700 + dy);
    ctx.beginPath();
    ctx.moveTo(p(50),   y0 + p(60));
    ctx.bezierCurveTo(p(350), y0 - p(30), p(600), y0 + p(70), p(750), y0 + p(20));
    ctx.bezierCurveTo(p(900), y0 - p(20), p(1150), y0 + p(50), p(1450), y0 + p(30));
    ctx.lineTo(p(1450), p(CARD_BOTTOM)); ctx.lineTo(p(50), p(CARD_BOTTOM)); ctx.closePath();
    ctx.fillStyle = `rgba(${c},${opa})`; ctx.fill();
  });

  // Titre
  ctx.font = `600 ${p(62)}px ${font}`;
  ctx.textBaseline = "top"; ctx.textAlign = "center";
  ctx.fillStyle = "#15171A";
  ctx.fillText(T.title1 + T.title2, p(750), p(90));
  // Gradient sur title2
  const fullW = ctx.measureText(T.title1 + T.title2).width;
  const t1W   = ctx.measureText(T.title1).width;
  const t2W   = ctx.measureText(T.title2).width;
  const startX = p(750) - fullW / 2;
  ctx.fillStyle = "#15171A";
  ctx.fillText(T.title1, startX, p(90));
  const gTitle = ctx.createLinearGradient(startX + t1W, 0, startX + t1W + t2W, 0);
  gTitle.addColorStop(0, blue); gTitle.addColorStop(0.5, indigo); gTitle.addColorStop(1, violet);
  ctx.fillStyle = gTitle;
  ctx.textAlign = "left";
  ctx.fillText(T.title2, startX + t1W, p(90));

  // Sous-titre
  ctx.font = `400 ${p(22)}px ${font}`; ctx.fillStyle = "#596170";
  ctx.textAlign = "center";
  ctx.fillText(T.subtitle, p(750), p(185));

  // Bloc QR
  const blockY  = p(270);
  const qrSz    = p(310);
  const qrPad   = p(44);
  const blockH  = qrSz + qrPad * 2;
  const qrSize  = Math.round(qrSz);
  const qrImg   = await loadQRImage(qrUrl, qrSize);

  ctx.shadowColor = "rgba(0,0,0,0.06)"; ctx.shadowBlur = p(20); ctx.shadowOffsetY = p(4);
  rr(ctx, p(100), blockY, p(1300), blockH, p(36));
  ctx.fillStyle = "#FFFFFF"; ctx.fill();
  ctx.shadowColor = "transparent"; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
  ctx.strokeStyle = "rgba(68,114,245,0.45)"; ctx.lineWidth = p(1.5); ctx.stroke();

  if (qrImg) ctx.drawImage(qrImg, p(150), blockY + qrPad, qrSz, qrSz);

  // Texte SCANNEZ LE CODE
  const titleF  = p(56);
  const descF   = p(24);
  const lineGap = p(10);
  const sectGap = p(24);
  const groupH  = titleF + lineGap + titleF + sectGap + descF + lineGap + descF + lineGap + descF;
  const textX   = p(150) + qrSz + p(60);
  const textY   = blockY + (blockH - groupH) / 2;

  ctx.textAlign = "left"; ctx.textBaseline = "top";
  ctx.font = `700 ${titleF}px ${font}`; ctx.fillStyle = "#15171A";
  ctx.fillText(T.qr_verb, textX, textY);

  if (T.qr_pre) {
    const preW = ctx.measureText(T.qr_pre).width;
    ctx.fillStyle = "#15171A"; ctx.fillText(T.qr_pre, textX, textY + titleF + lineGap);
    const gCode = ctx.createLinearGradient(textX + preW, 0, textX + preW + ctx.measureText(T.qr_grad).width, 0);
    gCode.addColorStop(0, blue); gCode.addColorStop(1, violet);
    ctx.fillStyle = gCode; ctx.fillText(T.qr_grad, textX + preW, textY + titleF + lineGap);
  } else {
    const gCode = ctx.createLinearGradient(textX, 0, textX + ctx.measureText(T.qr_grad).width, 0);
    gCode.addColorStop(0, blue); gCode.addColorStop(1, violet);
    ctx.fillStyle = gCode; ctx.fillText(T.qr_grad, textX, textY + titleF + lineGap);
  }

  ctx.font = `400 ${descF}px ${font}`; ctx.fillStyle = "#596170";
  const dY = textY + titleF + lineGap + titleF + sectGap;
  ctx.fillText(T.qr_desc1, textX, dY);
  ctx.fillText(T.qr_desc2, textX, dY + descF + lineGap);
  ctx.fillText(T.qr_desc3, textX, dY + (descF + lineGap) * 2);

  // "Ajoutez à votre portefeuille"
  const afterBlock = blockY + blockH + p(44);
  ctx.font = `400 ${p(19)}px ${font}`; ctx.fillStyle = "#596170";
  ctx.textAlign = "center"; ctx.textBaseline = "top";
  ctx.fillText(T.add_wallet, p(750), afterBlock);

  // Badges
  const appleImg  = await loadImg("/apple-wallet-badge.svg");
  const googleImg = await loadImg("/google-wallet-badge.svg");
  const badgeY = afterBlock + p(52);
  drawBadgeCentered(ctx, appleImg,  p(435),  badgeY, 300, 78, p);
  drawBadgeCentered(ctx, googleImg, p(1065), badgeY, 300, 78, p);

  // WALLIO
  ctx.font = `500 ${p(22)}px ${font}`; ctx.textAlign = "center"; ctx.textBaseline = "top";
  ctx.fillStyle = indigo;
  ctx.letterSpacing = `${p(8)}px`;
  ctx.fillText("WALLIO", p(750), badgeY + p(110));
  ctx.letterSpacing = "0px";

  ctx.restore();
}
