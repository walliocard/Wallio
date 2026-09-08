import JSZip from "jszip";
import crypto from "crypto";
import fs from "fs";
import path from "path";
import forge from "node-forge";
import { generatePassJson, type PassInput } from "./generatePass";
import { drawStampsOnStrip, type StampStyle } from "./drawStamps";


export interface StampOverlayInput {
  stampsOnStrip?: boolean;
  stripStampStyle?: StampStyle;
  stampColor?: string;
  stampPosition?: number;
  stampSizePreset?: "s"|"m"|"l";
  stampThickness?: number;
  stampText?: string;
  stampTextBold?: boolean;
  stampTextItalic?: boolean;
  stampTextSize?: number;
  stampLogoOpacity?: number;
}

function sha1(data: Buffer | string): string {
  return crypto.createHash("sha1").update(data).digest("hex");
}

// WWDR G4 bundlé dans public/ — plus de fetch réseau à chaque cold start
function getWwdrCert(): forge.pki.Certificate {
  const cerPath = path.join(process.cwd(), "public", "AppleWWDRCAG4.cer");
  const der = fs.readFileSync(cerPath);
  const asn1 = forge.asn1.fromDer(forge.util.binary.raw.encode(der));
  return forge.pki.certificateFromAsn1(asn1);
}

async function signManifest(manifestJson: string): Promise<Buffer> {
  const p12B64 = process.env.APPLE_PASS_CERT_P12;
  const p12Pwd = process.env.APPLE_PASS_CERT_PASSWORD || "";

  if (!p12B64) {
    throw new Error("[PassKit] APPLE_PASS_CERT_P12 manquant — impossible de signer le pass");
  }

  const p12Der  = forge.util.decode64(p12B64);
  const p12Asn1 = forge.asn1.fromDer(p12Der);
  const p12     = forge.pkcs12.pkcs12FromAsn1(p12Asn1, p12Pwd);

  const keyBags  = p12.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag });
  const certBags = p12.getBags({ bagType: forge.pki.oids.certBag });
  const privateKey = keyBags[forge.pki.oids.pkcs8ShroudedKeyBag]?.[0]?.key;
  const cert       = certBags[forge.pki.oids.certBag]?.[0]?.cert;

  if (!privateKey || !cert) throw new Error("[PassKit] Impossible d'extraire clé/cert du p12");

  const wwdr = getWwdrCert();

  const p7 = forge.pkcs7.createSignedData();
  p7.content = forge.util.createBuffer(manifestJson, "utf8");
  p7.addCertificate(cert);
  p7.addCertificate(wwdr);
  p7.addSigner({
    key: privateKey,
    certificate: cert,
    digestAlgorithm: forge.pki.oids.sha256,
    authenticatedAttributes: [
      { type: forge.pki.oids.contentType, value: forge.pki.oids.data },
      { type: forge.pki.oids.messageDigest },
      { type: forge.pki.oids.signingTime, value: new Date().toISOString() },
    ],
  });
  p7.sign({ detached: true });

  const der = forge.asn1.toDer(p7.toAsn1());
  return Buffer.from(forge.util.binary.raw.decode(der.getBytes()));
}

const ICON_29 = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAB0AAAAdCAYAAABWk2cPAAAAQklEQVRIS2NkYGD4z0A5YJQa" +
  "pQZpgGqUGqQBqlFqkAaoRqlBGqAapQZpgGqUGqQBqlFqkAaoRqlBGqAapQZpgGoAdwAIAAH" +
  "V/AAAAAAElFTkSuQmCC",
  "base64"
);

export async function buildPkpass(input: PassInput & { stripUrl?: string; logoUrl?: string } & StampOverlayInput): Promise<Buffer> {
  const passJson = JSON.stringify(generatePassJson(input), null, 2);

  const files: Record<string, Buffer> = {
    "pass.json":    Buffer.from(passJson, "utf8"),
    "icon.png":     ICON_29,
    "icon@2x.png":  ICON_29,
    "icon@3x.png":  ICON_29,
  };

  // Logo marchand = coin supérieur gauche + icône de notification
  if (input.logoUrl) {
    // Logo avec coins arrondis (Apple Wallet n'arrondit pas nativement)
    try {
      const { createCanvas, loadImage } = await import("@napi-rs/canvas");
      const logo = await loadImage(input.logoUrl);

      // Pas de contrainte de hauteur — Apple adapte le header à la taille naturelle du logo.
      // On contraint uniquement la largeur max pour éviter les logos trop larges.
      const mkLogo = async (maxW: number) => {
        const natW = logo.width || maxW;
        const natH = logo.height || maxW;
        const ratio = natW > maxW ? maxW / natW : 1;
        const logoW = Math.round(natW * ratio);
        const logoH = Math.round(natH * ratio);
        const canvas = createCanvas(logoW, logoH);
        const ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, logoW, logoH);
        // Coins arrondis ~20% du plus petit côté
        const r = Math.round(Math.min(logoW, logoH) * 0.20);
        ctx.beginPath();
        ctx.moveTo(r, 0);
        ctx.lineTo(logoW - r, 0);
        ctx.quadraticCurveTo(logoW, 0, logoW, r);
        ctx.lineTo(logoW, logoH - r);
        ctx.quadraticCurveTo(logoW, logoH, logoW - r, logoH);
        ctx.lineTo(r, logoH);
        ctx.quadraticCurveTo(0, logoH, 0, logoH - r);
        ctx.lineTo(0, r);
        ctx.quadraticCurveTo(0, 0, r, 0);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(logo, 0, 0, logoW, logoH);
        return canvas.encode("png");
      };

      const logo1x = await mkLogo(160);
      const logo2x = await mkLogo(320);
      const logo3x = await mkLogo(480);
      files["logo.png"]    = logo1x;
      files["logo@2x.png"] = logo2x;
      files["logo@3x.png"] = logo3x;
    } catch (e) {
      // Fallback : logo brut sans arrondi
      console.error("[logo] rounded corners failed, using raw:", e);
      try {
        const res = await fetch(input.logoUrl);
        if (res.ok) {
          const buf = Buffer.from(await res.arrayBuffer());
          files["logo.png"]    = buf;
          files["logo@2x.png"] = buf;
          files["logo@3x.png"] = buf;
        }
      } catch (e2) { console.error("[logo] fetch failed:", e2); }
    }

    // icon.png — iOS 18 exige fond solide (transparent = blanc sur blanc)
    // Tailles exactes Apple : 29×29 / 58×58 / 87×87 px
    try {
      const { createCanvas, loadImage } = await import("@napi-rs/canvas");
      const logo = await loadImage(input.logoUrl);

      // Couleur de fond : couleur principale du marchand, sinon bleu Wallio
      const bg = /^#[0-9a-f]{6}$/i.test(input.backgroundColor)
        ? input.backgroundColor
        : "#007AFF";

      console.log("[icon] logo dimensions:", logo.width, "x", logo.height);

      const mkIcon = async (size: number) => {
        // Si SVG ou format sans dimensions → utilise size comme fallback
        const natW = logo.width  || size;
        const natH = logo.height || size;
        const canvas = createCanvas(size, size);
        const ctx    = canvas.getContext("2d");
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, size, size);
        const ratio = Math.min((size * 0.76) / natW, (size * 0.76) / natH);
        const w = natW * ratio;
        const h = natH * ratio;
        ctx.drawImage(logo, (size - w) / 2, (size - h) / 2, w, h);
        return canvas.encode("png");
      };

      files["icon.png"]    = await mkIcon(29);
      files["icon@2x.png"] = await mkIcon(58);
      files["icon@3x.png"] = await mkIcon(87);
    } catch (e) { console.error("[icon] canvas failed:", e); }
  }

  // Bannière strip (avec tampons dessinés si activé)
  if (input.stripUrl) {
    try {
      const res = await fetch(input.stripUrl);
      if (res.ok) {
        let buf = Buffer.from(await res.arrayBuffer());
        if (input.stampsOnStrip && input.stampsObjective > 0) {
          try {
            buf = Buffer.from(await drawStampsOnStrip(buf, {
              stampsCurrent:   input.stampsCurrent,
              stampsObjective: input.stampsObjective,
              style:           input.stripStampStyle  ?? "dot",
              color:           input.stampColor       ?? "#FFFFFF",
              position:        input.stampPosition    ?? 50,
              sizePreset:      input.stampSizePreset  ?? "m",
              thickness:       input.stampThickness   ?? 2,
              text:            input.stampText        ?? "",
              textBold:        input.stampTextBold    ?? false,
              textItalic:      input.stampTextItalic  ?? false,
              textSize:        input.stampTextSize    ?? 1,
              logoUrl:         input.logoUrl,
              logoOpacity:     input.stampLogoOpacity ?? 1,
            }));
          } catch { /* dessin optionnel — strip original conservé */ }
        }
        files["strip.png"]    = buf;
        files["strip@2x.png"] = buf;
        files["strip@3x.png"] = buf;
      }
    } catch { /* bannière optionnelle */ }
  }

  const manifest: Record<string, string> = {};
  for (const [name, data] of Object.entries(files)) {
    manifest[name] = sha1(data);
  }
  const manifestJson = JSON.stringify(manifest);
  files["manifest.json"] = Buffer.from(manifestJson, "utf8");

  const signature = await signManifest(manifestJson);

  const zip = new JSZip();
  for (const [name, data] of Object.entries(files)) {
    zip.file(name, data);
  }
  zip.file("signature", signature);

  return zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" });
}
