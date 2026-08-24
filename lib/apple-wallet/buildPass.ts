import JSZip from "jszip";
import crypto from "crypto";
import { generatePassJson, type PassInput } from "./generatePass";

// Crée le bundle .pkpass (ZIP contenant pass.json, images, manifest.json, signature)
// TODO (Apple Developer requis) : remplacer signManifest() par une vraie signature PKCS7
// avec le certificat p12 téléchargé depuis developer.apple.com

function sha1(data: Buffer | string): string {
  return crypto.createHash("sha1").update(data).digest("hex");
}

// Signature PKCS7 du manifest — nécessite le certificat Apple Developer
// Retourne un Buffer vide en attendant le certificat (le pass ne sera pas accepté par Apple Wallet sans ça)
function signManifest(_manifestJson: string): Buffer {
  // TODO : implémenter avec node-forge ou openssl
  // 1. Lire APPLE_CERT_P12 (base64) depuis les variables d'environnement
  // 2. Decoder en PKCS12 → extraire clé privée + certificat + Apple WWDR CA
  // 3. Créer signature PKCS7 detached de manifestJson
  // 4. Retourner le DER buffer
  console.warn("[PassKit] Signature manquante — Apple Developer requis pour un .pkpass valide");
  return Buffer.alloc(0);
}

// Icône Wallio 29×29 en base64 PNG (pixel vert #00F5A0 sur fond noir)
// Remplacer par de vrais PNG dans public/apple-wallet/ quand Apple Developer est activé
const ICON_29 = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAB0AAAAdCAYAAABWk2cPAAAAQklEQVRIS2NkYGD4z0A5YJQa" +
  "pQZpgGqUGqQBqlFqkAaoRqlBGqAapQZpgGqUGqQBqlFqkAaoRqlBGqAapQZpgGoAdwAIAAH" +
  "V/AAAAAAElFTkSuQmCC",
  "base64"
);

export async function buildPkpass(input: PassInput): Promise<Buffer> {
  const passJson = JSON.stringify(generatePassJson(input), null, 2);

  const files: Record<string, Buffer> = {
    "pass.json": Buffer.from(passJson, "utf8"),
    "icon.png":  ICON_29,
    "icon@2x.png": ICON_29,
    "icon@3x.png": ICON_29,
  };

  // manifest.json = objet { "fichier": "sha1" } pour tous les fichiers du bundle
  const manifest: Record<string, string> = {};
  for (const [name, data] of Object.entries(files)) {
    manifest[name] = sha1(data);
  }
  const manifestJson = JSON.stringify(manifest);
  files["manifest.json"] = Buffer.from(manifestJson, "utf8");

  // signature PKCS7 du manifest (vide sans cert Apple Developer)
  const signature = signManifest(manifestJson);

  const zip = new JSZip();
  for (const [name, data] of Object.entries(files)) {
    zip.file(name, data);
  }
  zip.file("signature", signature);

  return zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" });
}
