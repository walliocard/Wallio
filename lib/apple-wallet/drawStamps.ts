import sharp from "sharp";

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

export async function drawStampsOnStrip(stripBuf: Buffer, opts: DrawStampsOptions): Promise<Buffer> {
  const { stampsCurrent: filled, stampsObjective: total } = opts;
  if (total <= 0 || !stripBuf.length) return stripBuf;

  const meta = await sharp(stripBuf).metadata();
  const W = meta.width  || 750;
  const H = meta.height || 288;
  const scale = W / 375;

  const {
    style = "dot", color = "#FFFFFF", position = 50,
    sizePreset = "m", thickness = 2,
    text = "", textBold = false, textItalic = false, textSize = 1,
    logoUrl = "", logoOpacity = 1,
  } = opts;

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

  // Fetch logo once for "logo" style
  let logoDataUri = "";
  if (style === "logo" && logoUrl) {
    try {
      const res = await fetch(logoUrl);
      if (res.ok) {
        const buf  = Buffer.from(await res.arrayBuffer());
        const mime = res.headers.get("content-type") || "image/png";
        logoDataUri = `data:${mime};base64,${buf.toString("base64")}`;
      }
    } catch { /* logo optionnel */ }
  }

  let defs = "";
  let body = "";

  for (let row = 0; row < rows; row++) {
    const rowStart = row * perRow;
    const count    = Math.min(perRow, total - rowStart);
    for (let col = 0; col < count; col++) {
      const idx      = rowStart + col;
      const isFilled = idx < filled;
      const cx = startX + col * (s + gap) + s / 2;
      const cy = startY + row * (s + gap) + s / 2;
      const r  = s / 2 - thick / 2;

      // Outer circle
      body += `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(r)}"
        fill="${color}" fill-opacity="${isFilled ? 0.133 : 0}"
        stroke="${color}" stroke-opacity="${isFilled ? 1 : 0.267}"
        stroke-width="${f(thick)}" />\n`;

      if (!isFilled) continue;

      // Inner shape
      switch (style) {

        case "dot":
          body += `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(s * 0.18)}" fill="${color}" />\n`;
          break;

        case "ring":
          body += `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(s * 0.25)}"
            fill="none" stroke="${color}" stroke-width="${f(thick)}" />\n`;
          break;

        case "plus": {
          const bar = s * 0.36;
          const pt  = Math.max(1.5, thick * 0.8);
          body += `<rect x="${f(cx - bar/2)}" y="${f(cy - pt/2)}" width="${f(bar)}" height="${f(pt)}" rx="${f(pt)}" fill="${color}" />\n`;
          body += `<rect x="${f(cx - pt/2)}" y="${f(cy - bar/2)}" width="${f(pt)}" height="${f(bar)}" rx="${f(pt)}" fill="${color}" />\n`;
          break;
        }

        case "check": {
          const sz   = s * 0.52;
          const scl  = sz / 14;
          const sw   = Math.max(1, thick * 0.9) / scl;
          body += `<g transform="translate(${f(cx - sz/2)},${f(cy - sz/2)}) scale(${f(scl)})">
            <polyline points="2,7 5.5,10.5 12,3"
              stroke="${color}" stroke-width="${f(sw)}"
              stroke-linecap="round" stroke-linejoin="round" fill="none" />
          </g>\n`;
          break;
        }

        case "heart":
        case "star": {
          const sz  = s * 0.52;
          const scl = sz / 24;
          const sw  = Math.max(1, thick * 0.9) / scl;
          const d   = style === "heart" ? HEART_PATH : STAR_PATH;
          body += `<g transform="translate(${f(cx - sz/2)},${f(cy - sz/2)}) scale(${f(scl)})">
            <path d="${d}" stroke="${color}" stroke-width="${f(sw)}"
              stroke-linecap="round" stroke-linejoin="round" fill="none" />
          </g>\n`;
          break;
        }

        case "text": {
          if (!text) break;
          const chars    = text.length;
          const fontSize = Math.min(s * 0.72 / Math.max(1, chars * 0.65), s * 0.38) * textSize;
          body += `<text x="${f(cx)}" y="${f(cy)}"
            text-anchor="middle" dominant-baseline="central"
            font-size="${f(Math.max(5, fontSize))}"
            font-weight="${textBold ? 700 : 500}"
            font-style="${textItalic ? "italic" : "normal"}"
            fill="${color}">${escapeXml(text)}</text>\n`;
          break;
        }

        case "logo": {
          if (!logoDataUri) break;
          const imgR = s * 0.36;
          const clipId = `lc${idx}`;
          defs += `<clipPath id="${clipId}"><circle cx="${f(cx)}" cy="${f(cy)}" r="${f(imgR)}" /></clipPath>\n`;
          body += `<image href="${logoDataUri}"
            x="${f(cx - imgR)}" y="${f(cy - imgR)}"
            width="${f(imgR * 2)}" height="${f(imgR * 2)}"
            clip-path="url(#${clipId})"
            opacity="${logoOpacity}"
            preserveAspectRatio="xMidYMid slice" />\n`;
          break;
        }
      }
    }
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"
    width="${W}" height="${H}">
  <defs>${defs}</defs>
  ${body}
</svg>`;

  return sharp(stripBuf)
    .composite([{ input: Buffer.from(svg), top: 0, left: 0 }])
    .png()
    .toBuffer();
}

function f(n: number): string { return n.toFixed(2); }
function escapeXml(s: string): string {
  return s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
}
