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

  // Logo marchand (coin supérieur gauche de la carte)
  if (input.logoUrl) {
    try {
      const res = await fetch(input.logoUrl);
      if (res.ok) {
        const buf = Buffer.from(await res.arrayBuffer());
        files["logo.png"]    = buf;
        files["logo@2x.png"] = buf;
        files["logo@3x.png"] = buf;
      }
    } catch { /* logo optionnel */ }
  }

  // Bannière strip (avec tampons dessinés si activé)
  if (input.stripUrl) {
    try {
      const res = await fetch(input.stripUrl);
      if (res.ok) {
        let buf = Buffer.from(await res.arrayBuffer());
        if (input.stampsOnStrip && input.stampsObjective > 0) {
          buf = Buffer.from(await drawStampsOnStrip(buf, {
            stampsCurrent:  input.stampsCurrent,
            stampsObjective: input.stampsObjective,
            style:           input.stripStampStyle   ?? "dot",
            color:           input.stampColor        ?? "#FFFFFF",
            position:        input.stampPosition     ?? 50,
            sizePreset:      input.stampSizePreset   ?? "m",
            thickness:       input.stampThickness    ?? 2,
            text:            input.stampText         ?? "",
            textBold:        input.stampTextBold     ?? false,
            textItalic:      input.stampTextItalic   ?? false,
            textSize:        input.stampTextSize      ?? 1,
            logoUrl:         input.logoUrl,
            logoOpacity:     input.stampLogoOpacity  ?? 1,
          }));
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
