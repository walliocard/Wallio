import { NextResponse } from "next/server";
import crypto from "crypto";

// Image statique Apple Maps (Web Snapshots), signée côté serveur avec la clé MapKit.
// Usage : <img src="/api/public/map-snapshot?lat=31.6&lng=-7.9&color=5B7CFA" />
const b64url = (buf: Buffer) =>
  buf.toString("base64").replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const lat = searchParams.get("lat");
  const lng = searchParams.get("lng");
  const color = (searchParams.get("color") || "5B7CFA").replace("#", "");

  const keyId = process.env.APPLE_MAPKIT_KEY_ID;
  const teamId = process.env.APPLE_MAPKIT_TEAM_ID || process.env.APPLE_TEAM_ID;
  const privateKey = process.env.APPLE_MAPKIT_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!lat || !lng || !keyId || !teamId || !privateKey) {
    return new NextResponse(null, { status: 501 });
  }

  const annotations = encodeURIComponent(JSON.stringify([{ point: `${lat},${lng}`, color, markerStyle: "balloon" }]));
  const path = `/api/v1/snapshot?center=${lat},${lng}&z=15&size=600x240&scale=2&colorScheme=light&poi=1&annotations=${annotations}&teamId=${teamId}&keyId=${keyId}`;

  try {
    const signature = b64url(crypto.sign("SHA256", Buffer.from(path), { key: privateKey, dsaEncoding: "ieee-p1363" }));
    const url = `https://snapshot.apple-mapkit.com${path}&signature=${signature}`;
    return NextResponse.redirect(url, 302);
  } catch {
    return new NextResponse(null, { status: 500 });
  }
}
