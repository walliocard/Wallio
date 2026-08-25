export type Format = "chevaleret" | "comptoir";
export type Template = "dark" | "couleur" | "clair" | "gradient";

export const COMPTOIR_TEMPLATES: { id: Template; label: string; desc: string }[] = [
  { id: "dark",     label: "Noir",    desc: "Fond noir, NFC vert Wallio" },
  { id: "couleur",  label: "Couleur", desc: "Fond couleur principale" },
  { id: "clair",    label: "Clair",   desc: "Fond blanc, accents couleur" },
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

export function nfcArcs(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number,
  unit: number,
  color: string,
) {
  ctx.lineWidth = unit * 0.028;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.arc(cx, cy, unit * 0.022, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
  for (let i = 0; i < 4; i++) {
    const r = unit * (0.07 + i * 0.075);
    const opacity = 1 - i * 0.12;
    ctx.beginPath();
    ctx.arc(cx, cy, r, -Math.PI * 0.4, Math.PI * 0.4);
    ctx.strokeStyle = color.startsWith("#")
      ? color + Math.round(opacity * 255).toString(16).padStart(2, "0")
      : color;
    ctx.stroke();
  }
}

async function loadBgImage(
  ctx: CanvasRenderingContext2D,
  bgImageUrl: string,
  W: number,
  H: number,
) {
  const img = new Image();
  img.crossOrigin = "anonymous";
  img.src = bgImageUrl;
  await new Promise<void>(resolve => { img.onload = () => resolve(); img.onerror = () => resolve(); });
  const imgRatio = img.width / (img.height || 1);
  const canvasRatio = W / H;
  let sx = 0, sy = 0, sw = img.width, sh = img.height;
  if (imgRatio > canvasRatio) {
    sw = Math.round(img.height * canvasRatio);
    sx = Math.round((img.width - sw) / 2);
  } else {
    sh = Math.round(img.width / canvasRatio);
    sy = Math.round((img.height - sh) / 2);
  }
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, W, H);
  ctx.fillStyle = "rgba(0,0,0,0.38)";
  ctx.fillRect(0, 0, W, H);
}

export async function drawChevaleret(
  canvas: HTMLCanvasElement,
  couleur_principale: string,
  couleur_secondaire: string,
  nom: string,
  nfc_id: string | undefined,
  template: Template,
  scale = 1,
  showQR = true,
  bgImageUrl?: string,
) {
  const W = 800 * scale, H = 1440 * scale;
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  const green = "#00F5A0";
  let nfcColor: string;
  let textColor: string;

  if (bgImageUrl) {
    await loadBgImage(ctx, bgImageUrl, W, H);
    nfcColor = "#FFFFFF"; textColor = "#FFFFFF";
  } else {
    let bgFill: string | CanvasGradient;
    if (template === "dark") {
      bgFill = "#0A0A0A"; nfcColor = green; textColor = "#FFFFFF";
    } else if (template === "couleur") {
      bgFill = couleur_principale; nfcColor = "#FFFFFF"; textColor = "#FFFFFF";
    } else if (template === "clair") {
      bgFill = "#FFFFFF"; nfcColor = couleur_principale; textColor = "#0A0A0A";
    } else {
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, couleur_principale); g.addColorStop(1, couleur_secondaire);
      bgFill = g; nfcColor = "#FFFFFF"; textColor = "#FFFFFF";
    }
    ctx.fillStyle = bgFill;
    ctx.fillRect(0, 0, W, H);
  }

  ctx.beginPath();
  ctx.arc(W / 2, 52, 26, 0, Math.PI * 2);
  ctx.strokeStyle = `${textColor}18`; ctx.lineWidth = 2; ctx.stroke();

  ctx.font = `bold ${W * 0.065}px Arial, sans-serif`;
  ctx.fillStyle = (!bgImageUrl && template === "dark") ? green : nfcColor;
  ctx.textAlign = "center"; ctx.textBaseline = "top";
  ctx.fillText("WALLIO", W / 2, H * 0.065);

  ctx.beginPath();
  ctx.moveTo(W * 0.1, H * 0.115); ctx.lineTo(W * 0.9, H * 0.115);
  ctx.strokeStyle = `${textColor}1A`; ctx.lineWidth = 1.5; ctx.stroke();

  ctx.font = `${W * 0.028}px Arial, sans-serif`;
  ctx.fillStyle = `${textColor}44`;
  ctx.fillText("LOYALTY · REIMAGINED", W / 2, H * 0.127);

  const ox = W / 2 - W * 0.08;
  const oy = H * 0.38;
  nfcArcs(ctx, ox, oy, W, nfcColor);

  ctx.font = `bold ${W * 0.06}px Arial, sans-serif`;
  ctx.fillStyle = textColor; ctx.textAlign = "center";
  ctx.fillText("TAP. EARN. REPEAT.", W / 2 + W * 0.04, H * 0.575);

  if (nom) {
    ctx.font = `${W * 0.038}px Arial, sans-serif`;
    ctx.fillStyle = `${textColor}70`;
    ctx.fillText(nom, W / 2 + W * 0.04, H * 0.635);
  }

  if (showQR && nfc_id) {
    const qrSize = Math.round(W * 0.22);
    const qrImg = await generateQRImage(`https://app.wallio.ma/nfc/${nfc_id}`, qrSize);
    if (qrImg) {
      const pad = Math.round(W * 0.022);
      const boxW = qrSize + pad * 2;
      const boxH = qrSize + pad * 2 + Math.round(W * 0.04);
      const bx = (W - boxW) / 2;
      const by = H * 0.67;
      ctx.fillStyle = "#FFFFFF";
      ctx.beginPath();
      ctx.roundRect(bx, by, boxW, boxH, Math.round(W * 0.02));
      ctx.fill();
      ctx.drawImage(qrImg, bx + pad, by + pad, qrSize, qrSize);
      ctx.font = `500 ${W * 0.024}px Arial, sans-serif`;
      ctx.fillStyle = "#555555"; ctx.textAlign = "center";
      ctx.fillText("ou scannez ce QR", W / 2, by + qrSize + pad * 2 + W * 0.01);
    }
  }

  ctx.beginPath();
  ctx.moveTo(W * 0.3, H * 0.855); ctx.lineTo(W * 0.7, H * 0.855);
  ctx.strokeStyle = `${textColor}14`; ctx.lineWidth = 1.5; ctx.stroke();

  const url = nfc_id ? `app.wallio.ma/nfc/${nfc_id}` : "app.wallio.ma";
  ctx.font = `${W * 0.025}px Arial, sans-serif`;
  ctx.fillStyle = `${textColor}28`;
  ctx.fillText(url, W / 2, H * 0.93);
}

export async function drawComptoir(
  canvas: HTMLCanvasElement,
  couleur_principale: string,
  couleur_secondaire: string,
  nom: string,
  nfc_id: string | undefined,
  template: Template,
  scale = 1,
  showQR = true,
  bgImageUrl?: string,
) {
  const W = 1600 * scale, H = 900 * scale;
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  const green = "#00F5A0";
  let nfcColor: string;
  let textColor: string;

  if (bgImageUrl) {
    await loadBgImage(ctx, bgImageUrl, W, H);
    nfcColor = "#FFFFFF"; textColor = "#FFFFFF";
  } else {
    let bgFill: string | CanvasGradient;
    if (template === "dark") {
      bgFill = "#0A0A0A"; nfcColor = green; textColor = "#FFFFFF";
    } else if (template === "couleur") {
      bgFill = couleur_principale; nfcColor = "#FFFFFF"; textColor = "#FFFFFF";
    } else if (template === "clair") {
      bgFill = "#FFFFFF"; nfcColor = couleur_principale; textColor = "#0A0A0A";
    } else {
      const g = ctx.createLinearGradient(0, 0, W, 0);
      g.addColorStop(0, couleur_principale); g.addColorStop(1, couleur_secondaire);
      bgFill = g; nfcColor = "#FFFFFF"; textColor = "#FFFFFF";
    }
    ctx.fillStyle = bgFill;
    ctx.fillRect(0, 0, W, H);

    if (template === "dark") {
      const g = ctx.createRadialGradient(W * 0.75, H * 0.15, 0, W * 0.75, H * 0.15, 500);
      g.addColorStop(0, "rgba(0,245,160,0.06)"); g.addColorStop(1, "transparent");
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    }
  }

  ctx.beginPath();
  ctx.arc(W / 2, 52, 24, 0, Math.PI * 2);
  ctx.strokeStyle = `${textColor}15`; ctx.lineWidth = 2; ctx.stroke();

  ctx.font = `bold ${H * 0.07}px Arial, sans-serif`;
  ctx.fillStyle = (!bgImageUrl && template === "dark") ? green : nfcColor;
  ctx.textBaseline = "top"; ctx.textAlign = "left";
  ctx.fillText("WALLIO", 80, 75);

  if (nom) {
    ctx.font = `500 ${H * 0.055}px Arial, sans-serif`;
    ctx.fillStyle = `${textColor}80`;
    ctx.textAlign = "right";
    ctx.fillText(nom, W - 80, 88);
  }

  const ox = W / 2 - W * 0.06;
  const oy = H / 2 - 10;
  nfcArcs(ctx, ox, oy, H, nfcColor);

  const tx = W / 2 + W * 0.07;
  ctx.textAlign = "center";
  ctx.font = `600 ${H * 0.052}px Arial, sans-serif`;
  ctx.fillStyle = textColor;
  ctx.fillText("Posez votre téléphone", tx, oy + H * 0.34);

  ctx.font = `400 ${H * 0.045}px Arial, sans-serif`;
  ctx.fillStyle = `${textColor}60`;
  ctx.fillText("pour gagner vos points", tx, oy + H * 0.41);

  if (showQR && nfc_id) {
    const qrSize = Math.round(H * 0.22);
    const qrImg = await generateQRImage(`https://app.wallio.ma/nfc/${nfc_id}`, qrSize);
    if (qrImg) {
      const pad = Math.round(H * 0.022);
      const labelH = Math.round(H * 0.045);
      const boxW = qrSize + pad * 2;
      const boxH = qrSize + pad * 2 + labelH;
      const bx = W - boxW - Math.round(W * 0.05);
      const by = H - boxH - Math.round(H * 0.08);
      ctx.fillStyle = "#FFFFFF";
      ctx.beginPath();
      ctx.roundRect(bx, by, boxW, boxH, Math.round(H * 0.018));
      ctx.fill();
      ctx.drawImage(qrImg, bx + pad, by + pad, qrSize, qrSize);
      ctx.font = `500 ${H * 0.028}px Arial, sans-serif`;
      ctx.fillStyle = "#444444"; ctx.textAlign = "center";
      ctx.fillText("ou scannez", bx + boxW / 2, by + qrSize + pad * 2 + H * 0.012);
    }
  }

  const url = nfc_id ? `app.wallio.ma/nfc/${nfc_id}` : "app.wallio.ma";
  ctx.font = `${H * 0.032}px Arial, sans-serif`;
  ctx.fillStyle = `${textColor}25`;
  ctx.textAlign = "center";
  ctx.fillText(url, W / 2, H - 60);
}
