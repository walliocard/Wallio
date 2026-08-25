export type Template = "dark" | "couleur" | "clair" | "gradient";

export const ENSEIGNE_TEMPLATES: { id: Template; label: string; desc: string }[] = [
  { id: "dark",     label: "Noir",    desc: "Fond noir, NFC vert" },
  { id: "couleur",  label: "Couleur", desc: "Fond couleur principale" },
  { id: "clair",    desc: "Fond blanc, accents couleur", label: "Clair" },
  { id: "gradient", label: "Dégradé", desc: "Transition des deux couleurs" },
];

export async function generateQRImage(url: string, size: number): Promise<HTMLImageElement | null> {
  try {
    const QRCode = (await import("qrcode")).default;
    const dataUrl = await QRCode.toDataURL(url, {
      width: size, margin: 1,
      color: { dark: "#000000", light: "#FFFFFF" },
    });
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = dataUrl;
    });
  } catch { return null; }
}

function drawNFC(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number, color: string) {
  const dot = size * 0.06;
  ctx.beginPath();
  ctx.arc(cx, cy, dot, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();

  for (let i = 0; i < 3; i++) {
    const r = size * (0.14 + i * 0.13);
    const opacity = 1 - i * 0.2;
    const hex = Math.round(opacity * 255).toString(16).padStart(2, "0");
    ctx.beginPath();
    ctx.arc(cx, cy, r, -Math.PI * 0.45, Math.PI * 0.45);
    ctx.strokeStyle = color.startsWith("#") ? color + hex : color;
    ctx.lineWidth = size * 0.055;
    ctx.lineCap = "round";
    ctx.stroke();
  }
}

export async function drawEnseigne(
  canvas: HTMLCanvasElement,
  couleur_principale: string,
  couleur_secondaire: string,
  nom: string,
  texte: string,
  nfc_id: string | undefined,
  template: Template,
  scale = 1,
  showQR = true,
) {
  // 160×100mm at 300 DPI ≈ 1890×1181px — we use 1600×1000 for simplicity
  const W = 1600 * scale;
  const H = 1000 * scale;
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  const green = "#00F5A0";
  let bg: string | CanvasGradient;
  let nfcColor: string;
  let textColor: string;
  let isDark: boolean;

  if (template === "dark") {
    bg = "#0A0A0A"; nfcColor = green; textColor = "#FFFFFF"; isDark = true;
  } else if (template === "couleur") {
    bg = couleur_principale; nfcColor = "#FFFFFF"; textColor = "#FFFFFF"; isDark = true;
  } else if (template === "clair") {
    bg = "#FFFFFF"; nfcColor = couleur_principale; textColor = "#0A0A0A"; isDark = false;
  } else {
    const g = ctx.createLinearGradient(0, 0, W, 0);
    g.addColorStop(0, couleur_principale);
    g.addColorStop(1, couleur_secondaire);
    bg = g; nfcColor = "#FFFFFF"; textColor = "#FFFFFF"; isDark = true;
  }

  // Fond
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // Padding
  const PAD = W * 0.06;

  // --- NFC icon (gauche, centré verticalement) ---
  const nfcCX = PAD + H * 0.2;
  const nfcCY = H / 2;
  drawNFC(ctx, nfcCX, nfcCY, H * 0.28, nfcColor);

  // Séparateur vertical
  const sepX = nfcCX + H * 0.28 + PAD * 0.8;
  ctx.beginPath();
  ctx.moveTo(sepX, H * 0.2);
  ctx.lineTo(sepX, H * 0.8);
  ctx.strokeStyle = `${textColor}18`;
  ctx.lineWidth = 2;
  ctx.stroke();

  // --- Zone texte (centre) ---
  const textX = sepX + PAD;
  const textAreaW = showQR && nfc_id ? W * 0.44 : W - textX - PAD;
  const textCY = H / 2;

  // Nom marchand
  const nomSize = H * 0.11;
  ctx.font = `700 ${nomSize}px Arial, sans-serif`;
  ctx.fillStyle = textColor;
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";

  // Tronquer le nom si trop long
  let nomDisplay = nom || "Nom marchand";
  while (ctx.measureText(nomDisplay).width > textAreaW && nomDisplay.length > 4) {
    nomDisplay = nomDisplay.slice(0, -1);
  }
  if (nomDisplay !== nom) nomDisplay += "…";
  ctx.fillText(nomDisplay, textX, textCY - H * 0.1);

  // Texte
  const texteSize = H * 0.07;
  ctx.font = `400 ${texteSize}px Arial, sans-serif`;
  ctx.fillStyle = `${textColor}90`;
  let texteDisplay = texte || "Posez votre téléphone pour gagner vos points";
  while (ctx.measureText(texteDisplay).width > textAreaW && texteDisplay.length > 4) {
    texteDisplay = texteDisplay.slice(0, -1);
  }
  if (texteDisplay !== (texte || "Posez votre téléphone pour gagner vos points")) texteDisplay += "…";
  ctx.fillText(texteDisplay, textX, textCY + H * 0.06);

  // URL discrète
  const url = nfc_id ? `app.wallio.ma/nfc/${nfc_id}` : "app.wallio.ma";
  ctx.font = `400 ${H * 0.038}px Arial, sans-serif`;
  ctx.fillStyle = `${textColor}30`;
  ctx.fillText(url, textX, textCY + H * 0.2);

  // --- QR code (droite) ---
  if (showQR && nfc_id) {
    const qrSize = Math.round(H * 0.38);
    const qrImg = await generateQRImage(`https://app.wallio.ma/nfc/${nfc_id}`, qrSize);
    if (qrImg) {
      const pad = Math.round(H * 0.025);
      const labelH = Math.round(H * 0.06);
      const boxW = qrSize + pad * 2;
      const boxH = qrSize + pad * 2 + labelH;
      const bx = W - boxW - PAD;
      const by = (H - boxH) / 2;
      ctx.fillStyle = isDark ? "rgba(255,255,255,0.95)" : "rgba(0,0,0,0.07)";
      ctx.beginPath();
      ctx.roundRect(bx, by, boxW, boxH, Math.round(H * 0.025));
      ctx.fill();
      ctx.drawImage(qrImg, bx + pad, by + pad, qrSize, qrSize);
      ctx.font = `500 ${H * 0.038}px Arial, sans-serif`;
      ctx.fillStyle = isDark ? "#555" : `${textColor}60`;
      ctx.textAlign = "center";
      ctx.fillText("Scanner", bx + boxW / 2, by + qrSize + pad + labelH * 0.65);
    }
  }

  // Wallio watermark (discret, coin bas gauche)
  ctx.font = `600 ${H * 0.042}px Arial, sans-serif`;
  ctx.fillStyle = `${textColor}22`;
  ctx.textAlign = "left";
  ctx.textBaseline = "bottom";
  ctx.fillText("WALLIO", PAD, H - H * 0.05);
}

// ── Legacy exports (used by dashboard/carte/page.tsx) ────────────────────────
export type Format = "chevaleret" | "comptoir";
export const COMPTOIR_TEMPLATES = ENSEIGNE_TEMPLATES;

function nfcArcs(ctx: CanvasRenderingContext2D, cx: number, cy: number, unit: number, color: string) {
  ctx.lineWidth = unit * 0.028; ctx.lineCap = "round";
  ctx.beginPath(); ctx.arc(cx, cy, unit * 0.022, 0, Math.PI * 2);
  ctx.fillStyle = color; ctx.fill();
  for (let i = 0; i < 4; i++) {
    const r = unit * (0.07 + i * 0.075);
    const opacity = 1 - i * 0.12;
    ctx.beginPath(); ctx.arc(cx, cy, r, -Math.PI * 0.4, Math.PI * 0.4);
    ctx.strokeStyle = color.startsWith("#") ? color + Math.round(opacity * 255).toString(16).padStart(2, "0") : color;
    ctx.stroke();
  }
}

async function loadBgImage(ctx: CanvasRenderingContext2D, bgImageUrl: string, W: number, H: number) {
  const img = new Image(); img.crossOrigin = "anonymous"; img.src = bgImageUrl;
  await new Promise<void>(resolve => { img.onload = () => resolve(); img.onerror = () => resolve(); });
  const ir = img.width / (img.height || 1), cr = W / H;
  let sx = 0, sy = 0, sw = img.width, sh = img.height;
  if (ir > cr) { sw = Math.round(img.height * cr); sx = Math.round((img.width - sw) / 2); }
  else { sh = Math.round(img.width / cr); sy = Math.round((img.height - sh) / 2); }
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, W, H);
  ctx.fillStyle = "rgba(0,0,0,0.38)"; ctx.fillRect(0, 0, W, H);
}

export async function drawChevaleret(canvas: HTMLCanvasElement, couleur_principale: string, couleur_secondaire: string, nom: string, nfc_id: string | undefined, template: Template, scale = 1, showQR = true, bgImageUrl?: string) {
  const W = 800 * scale, H = 1440 * scale;
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  const green = "#00F5A0";
  let nfcColor: string, textColor: string;
  if (bgImageUrl) { await loadBgImage(ctx, bgImageUrl, W, H); nfcColor = "#FFFFFF"; textColor = "#FFFFFF"; }
  else {
    let bgFill: string | CanvasGradient;
    if (template === "dark") { bgFill = "#0A0A0A"; nfcColor = green; textColor = "#FFFFFF"; }
    else if (template === "couleur") { bgFill = couleur_principale; nfcColor = "#FFFFFF"; textColor = "#FFFFFF"; }
    else if (template === "clair") { bgFill = "#FFFFFF"; nfcColor = couleur_principale; textColor = "#0A0A0A"; }
    else { const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, couleur_principale); g.addColorStop(1, couleur_secondaire); bgFill = g; nfcColor = "#FFFFFF"; textColor = "#FFFFFF"; }
    ctx.fillStyle = bgFill; ctx.fillRect(0, 0, W, H);
  }
  ctx.font = `bold ${W * 0.065}px Arial, sans-serif`; ctx.fillStyle = (!bgImageUrl && template === "dark") ? green : nfcColor;
  ctx.textAlign = "center"; ctx.textBaseline = "top"; ctx.fillText("WALLIO", W / 2, H * 0.065);
  nfcArcs(ctx, W / 2 - W * 0.08, H * 0.38, W, nfcColor);
  ctx.font = `bold ${W * 0.06}px Arial, sans-serif`; ctx.fillStyle = textColor; ctx.textAlign = "center";
  ctx.fillText("TAP. EARN. REPEAT.", W / 2 + W * 0.04, H * 0.575);
  if (nom) { ctx.font = `${W * 0.038}px Arial, sans-serif`; ctx.fillStyle = `${textColor}70`; ctx.fillText(nom, W / 2 + W * 0.04, H * 0.635); }
  if (showQR && nfc_id) {
    const qrSize = Math.round(W * 0.22);
    const qrImg = await generateQRImage(`https://app.wallio.ma/nfc/${nfc_id}`, qrSize);
    if (qrImg) {
      const pad = Math.round(W * 0.022), boxW = qrSize + pad * 2, boxH = qrSize + pad * 2 + Math.round(W * 0.04);
      const bx = (W - boxW) / 2, by = H * 0.67;
      ctx.fillStyle = "#FFFFFF"; ctx.beginPath(); ctx.roundRect(bx, by, boxW, boxH, Math.round(W * 0.02)); ctx.fill();
      ctx.drawImage(qrImg, bx + pad, by + pad, qrSize, qrSize);
    }
  }
  const url = nfc_id ? `app.wallio.ma/nfc/${nfc_id}` : "app.wallio.ma";
  ctx.font = `${W * 0.025}px Arial, sans-serif`; ctx.fillStyle = `${textColor}28`; ctx.textAlign = "center"; ctx.fillText(url, W / 2, H * 0.93);
}

export async function drawComptoir(canvas: HTMLCanvasElement, couleur_principale: string, couleur_secondaire: string, nom: string, nfc_id: string | undefined, template: Template, scale = 1, showQR = true, bgImageUrl?: string) {
  const W = 1600 * scale, H = 900 * scale;
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  const green = "#00F5A0";
  let nfcColor: string, textColor: string;
  if (bgImageUrl) { await loadBgImage(ctx, bgImageUrl, W, H); nfcColor = "#FFFFFF"; textColor = "#FFFFFF"; }
  else {
    let bgFill: string | CanvasGradient;
    if (template === "dark") { bgFill = "#0A0A0A"; nfcColor = green; textColor = "#FFFFFF"; }
    else if (template === "couleur") { bgFill = couleur_principale; nfcColor = "#FFFFFF"; textColor = "#FFFFFF"; }
    else if (template === "clair") { bgFill = "#FFFFFF"; nfcColor = couleur_principale; textColor = "#0A0A0A"; }
    else { const g = ctx.createLinearGradient(0, 0, W, 0); g.addColorStop(0, couleur_principale); g.addColorStop(1, couleur_secondaire); bgFill = g; nfcColor = "#FFFFFF"; textColor = "#FFFFFF"; }
    ctx.fillStyle = bgFill; ctx.fillRect(0, 0, W, H);
  }
  ctx.font = `bold ${H * 0.07}px Arial, sans-serif`; ctx.fillStyle = (!bgImageUrl && template === "dark") ? green : nfcColor;
  ctx.textBaseline = "top"; ctx.textAlign = "left"; ctx.fillText("WALLIO", 80, 75);
  if (nom) { ctx.font = `500 ${H * 0.055}px Arial, sans-serif`; ctx.fillStyle = `${textColor}80`; ctx.textAlign = "right"; ctx.fillText(nom, W - 80, 88); }
  nfcArcs(ctx, W / 2 - W * 0.06, H / 2 - 10, H, nfcColor);
  const tx = W / 2 + W * 0.07; ctx.textAlign = "center";
  ctx.font = `600 ${H * 0.052}px Arial, sans-serif`; ctx.fillStyle = textColor; ctx.fillText("Posez votre téléphone", tx, H / 2 - 10 + H * 0.34);
  ctx.font = `400 ${H * 0.045}px Arial, sans-serif`; ctx.fillStyle = `${textColor}60`; ctx.fillText("pour gagner vos points", tx, H / 2 - 10 + H * 0.41);
  if (showQR && nfc_id) {
    const qrSize = Math.round(H * 0.22);
    const qrImg = await generateQRImage(`https://app.wallio.ma/nfc/${nfc_id}`, qrSize);
    if (qrImg) {
      const pad = Math.round(H * 0.022), labelH = Math.round(H * 0.045);
      const boxW = qrSize + pad * 2, boxH = qrSize + pad * 2 + labelH;
      const bx = W - boxW - Math.round(W * 0.05), by = H - boxH - Math.round(H * 0.08);
      ctx.fillStyle = "#FFFFFF"; ctx.beginPath(); ctx.roundRect(bx, by, boxW, boxH, Math.round(H * 0.018)); ctx.fill();
      ctx.drawImage(qrImg, bx + pad, by + pad, qrSize, qrSize);
    }
  }
  const url = nfc_id ? `app.wallio.ma/nfc/${nfc_id}` : "app.wallio.ma";
  ctx.font = `${H * 0.032}px Arial, sans-serif`; ctx.fillStyle = `${textColor}25`; ctx.textAlign = "center"; ctx.fillText(url, W / 2, H - 60);
}
