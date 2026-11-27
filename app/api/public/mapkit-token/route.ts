import { NextResponse } from "next/server";
import crypto from "crypto";

// Jeton MapKit JS, signé côté serveur (ES256). La clé privée n'est JAMAIS exposée.
// Variables d'env requises :
//   APPLE_MAPKIT_KEY_ID      — Key ID de la clé MapKit JS
//   APPLE_MAPKIT_TEAM_ID     — Team ID Apple (sinon APPLE_TEAM_ID)
//   APPLE_MAPKIT_PRIVATE_KEY — contenu du fichier .p8
//   APPLE_MAPKIT_ORIGIN      — (optionnel) origine autorisée, ex: https://walliocard.com

const b64url = (buf: Buffer | string) =>
  Buffer.from(buf).toString("base64").replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");

export async function GET() {
  const keyId = process.env.APPLE_MAPKIT_KEY_ID;
  const teamId = process.env.APPLE_MAPKIT_TEAM_ID || process.env.APPLE_TEAM_ID;
  const privateKey = process.env.APPLE_MAPKIT_PRIVATE_KEY?.replace(/\\n/g, "\n");
  const origin = process.env.APPLE_MAPKIT_ORIGIN;

  if (!keyId || !teamId || !privateKey) {
    return NextResponse.json({ error: "MapKit non configuré" }, { status: 501 });
  }

  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "ES256", kid: keyId, typ: "JWT" };
  const payload: Record<string, unknown> = { iss: teamId, iat: now, exp: now + 60 * 30 };
  if (origin) payload.origin = origin;

  const signingInput = `${b64url(JSON.stringify(header))}.${b64url(JSON.stringify(payload))}`;
  try {
    const signature = crypto.sign("SHA256", Buffer.from(signingInput), { key: privateKey, dsaEncoding: "ieee-p1363" });
    const token = `${signingInput}.${b64url(signature)}`;
    return NextResponse.json({ token }, { headers: { "Cache-Control": "public, max-age=600" } });
  } catch {
    return NextResponse.json({ error: "Signature impossible" }, { status: 500 });
  }
}
