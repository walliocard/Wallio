export type StampStyle = "dot"|"ring"|"plus"|"check"|"heart"|"star"|"text"|"logo";

export interface DrawStampsOptions {
  stampsCurrent: number;
  stampsObjective: number;
  style: StampStyle;
  color: string;
  position: number;
  sizePreset: "s"|"m"|"l";
  thickness: number;
  text?: string;
  textBold?: boolean;
  textItalic?: boolean;
  textSize?: number;
  logoUrl?: string;
  logoOpacity?: number;
}

const HEART_PATH = "M12 20C12 20 4 14 4 8.5 4 5.9 6.2 4 8.5 4c1.5 0 2.9.9 3.5 2.2C12.6 4.9 14 4 15.5 4 17.8 4 20 5.9 20 8.5 20 14 12 20 12 20Z";
const STAR_PATH  = "M12 2.5l2.4 6.9H22l-6 4.3 2.3 6.9-6.3-4.6-6.3 4.6 2.3-6.9-6-4.3h7.6Z";

function rgba(hex: string, alpha: number): string {
  const h = /^#[0-9a-f]{6}$/i.test(hex) ? hex : "#ffffff";
  const r = parseInt(h.slice(1, 3), 16);
  const g = parseInt(h.slice(3, 5), 16);
  const b = parseInt(h.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

export async function drawStampsOnStrip(stripBuf: Buffer, opts: DrawStampsOptions): Promise<Buffer> {
  const { stampsCurrent: filled, stampsObjective: total } = opts;
  if (total <= 0 || !stripBuf.length) return stripBuf;

  const {
    style = "dot", color = "#FFFFFF", position = 50,
    sizePreset = "m", thickness = 2,
    text = "", textBold = false, textItalic = false, textSize = 1,
    logoUrl = "", logoOpacity = 1,
  } = opts;

  const { createCanvas, loadImage, Path2D } = await import("@napi-rs/canvas");

  const bg = await loadImage(stripBuf);
  const W = bg.width;
  const H = bg.height;
  const scale = W / 375;

  const sizeMult   = sizePreset === "s" ? 0.72 : sizePreset === "l" ? 1.28 : 1.0;
  const perRow     = total <= 8 ? total : Math.ceil(total / 2);
  const rows       = Math.ceil(total / perRow);
  const gap1x      = Math.round(Math.max(6, 10 * sizeMult));
  const baseSize1x = Math.min(36, Math.floor((343 - (perRow - 1) * gap1x) / perRow));
  const s1x        = Math.max(14, Math.round(baseSize1x * sizeMult));
  const s          = s1x * scale;
  const gap        = gap1x * scale;
  const thick      = Math.max(0.5, (s * 0.06) * (thickness / 2));

  const gridW  = perRow * s + (perRow - 1) * gap;
  const gridH  = rows   * s + (rows   - 1) * gap;
  const startX = W / 2 - gridW / 2;
  const startY = H * position / 100 - gridH / 2;

  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext("2d");
  ctx.drawImage(bg, 0, 0);

  let logoImg: Awaited<ReturnType<typeof loadImage>> | null = null;
  if (style === "logo" && logoUrl) {
    try { logoImg = await loadImage(logoUrl); } catch { /* skip */ }
  }

  for (let row = 0; row < rows; row++) {
    const rowStart = row * perRow;
    const count    = Math.min(perRow, total - rowStart);
    for (let col = 0; col < count; col++) {
      const idx      = rowStart + col;
      const isFilled = idx < filled;
      const cx = startX + col * (s + gap) + s / 2;
      const cy = startY + row * (s + gap) + s / 2;
      const r  = s / 2 - thick / 2;

      // Cercle extérieur
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      if (isFilled) {
        ctx.fillStyle = rgba(color, 0.133);
        ctx.fill();
      }
      ctx.strokeStyle = rgba(color, isFilled ? 1 : 0.267);
      ctx.lineWidth   = thick;
      ctx.stroke();

      if (!isFilled) continue;

      // Contenu intérieur
      switch (style) {

        case "dot": {
          ctx.beginPath();
          ctx.arc(cx, cy, s * 0.18, 0, Math.PI * 2);
          ctx.fillStyle = color;
          ctx.fill();
          break;
        }

        case "ring": {
          ctx.beginPath();
          ctx.arc(cx, cy, s * 0.25, 0, Math.PI * 2);
          ctx.strokeStyle = color;
          ctx.lineWidth   = thick;
          ctx.stroke();
          break;
        }

        case "plus": {
          const bar = s * 0.36;
          const pt  = Math.max(1.5, thick * 0.8);
          ctx.fillStyle = color;
          ctx.fillRect(cx - bar / 2, cy - pt / 2, bar, pt);
          ctx.fillRect(cx - pt / 2, cy - bar / 2, pt, bar);
          break;
        }

        case "check": {
          const sz  = s * 0.52;
          const scl = sz / 14;
          ctx.save();
          ctx.translate(cx - sz / 2, cy - sz / 2);
          ctx.scale(scl, scl);
          ctx.beginPath();
          ctx.moveTo(2, 7);
          ctx.lineTo(5.5, 10.5);
          ctx.lineTo(12, 3);
          ctx.strokeStyle = color;
          ctx.lineWidth   = Math.max(1, thick * 0.9) / scl;
          ctx.lineCap     = "round";
          ctx.lineJoin    = "round";
          ctx.stroke();
          ctx.restore();
          break;
        }

        case "heart":
        case "star": {
          const sz  = s * 0.52;
          const scl = sz / 24;
          ctx.save();
          ctx.translate(cx - sz / 2, cy - sz / 2);
          ctx.scale(scl, scl);
          const p = new Path2D(style === "heart" ? HEART_PATH : STAR_PATH);
          ctx.strokeStyle = color;
          ctx.lineWidth   = Math.max(1, thick * 0.9) / scl;
          ctx.lineCap     = "round";
          ctx.lineJoin    = "round";
          ctx.stroke(p);
          ctx.restore();
          break;
        }

        case "text": {
          if (!text) break;
          const chars    = text.length;
          const fontSize = Math.min(s * 0.72 / Math.max(1, chars * 0.65), s * 0.38) * textSize;
          ctx.font         = `${textItalic ? "italic " : ""}${textBold ? "bold " : ""}${Math.max(5, fontSize)}px sans-serif`;
          ctx.fillStyle    = color;
          ctx.textAlign    = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(text, cx, cy);
          break;
        }

        case "logo": {
          if (!logoImg) break;
          const imgR = s * 0.36;
          ctx.save();
          ctx.globalAlpha = logoOpacity;
          ctx.beginPath();
          ctx.arc(cx, cy, imgR, 0, Math.PI * 2);
          ctx.clip();
          ctx.drawImage(logoImg, cx - imgR, cy - imgR, imgR * 2, imgR * 2);
          ctx.restore();
          break;
        }
      }
    }
  }

  return canvas.encode("png");
}
