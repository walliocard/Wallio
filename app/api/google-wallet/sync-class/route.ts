import { NextResponse } from "next/server";
import { adminDb, adminAuth, initAdmin } from "@/lib/admin";
import { getGoogleAccessToken } from "@/lib/google-wallet/auth";

const ISSUER_ID = process.env.GOOGLE_WALLET_ISSUER_ID!;
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://app.walliocard.com";
const API = "https://walletobjects.googleapis.com/walletobjects/v1";

export async function POST(req: Request) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }
  const idToken = authHeader.slice(7);

  initAdmin();
  let uid: string;
  try {
    const decoded = await adminAuth().verifyIdToken(idToken);
    uid = decoded.uid;
  } catch {
    return NextResponse.json({ error: "Token invalide" }, { status: 401 });
  }

  if (!ISSUER_ID || !process.env.GOOGLE_WALLET_KEY_JSON) {
    return NextResponse.json({ error: "Google Wallet non configuré" }, { status: 500 });
  }

  const snap = await adminDb().collection("marchands").doc(uid).get();
  if (!snap.exists) return NextResponse.json({ error: "Marchand introuvable" }, { status: 404 });
  const m = snap.data()!;

  const cid = `${ISSUER_ID}.wallio_${uid.replace(/[^a-zA-Z0-9_]/g, "_")}`;
  const token = await getGoogleAccessToken();

  const logoUri = `${BASE_URL}/api/logo/${uid}`;
  const bgColor = (m.google_bg_color as string) || (m.apple_bg_color as string) || (m.couleur_principale as string) || "#1C1C1E";
  const hasHero = !!(m.google_hero_url || m.strip_url);
  const heroUrl = hasHero ? `${BASE_URL}/api/google-hero/${uid}` : undefined;
  const textModules = (m.google_text_modules as { header: string; body: string; id: string }[] | undefined) || [];
  const links = (m.google_links as { uri: string; description: string }[] | undefined) || [];
  const validLinks = links.filter(l => l.uri && l.description);
  const classTextModules = [
    { header: "Récompense", body: (m.nom_recompense as string) || "Récompense", id: "recompense" },
    ...textModules.filter(mod => mod.header && mod.body),
  ];

  const classBody: Record<string, unknown> = {
    issuerName: "Wallio",
    reviewStatus: "APPROVED",
    programName: m.nom,
    programLogo: {
      sourceUri: { uri: logoUri },
      contentDescription: { defaultValue: { language: "fr-FR", value: m.nom } },
    },
    hexBackgroundColor: bgColor,
    countryCode: "MA",
    textModulesData: classTextModules,
    ...(heroUrl ? { heroImage: { sourceUri: { uri: heroUrl }, contentDescription: { defaultValue: { language: "fr-FR", value: m.nom } } } } : {}),
    ...(validLinks.length > 0 ? { linksModuleData: { uris: validLinks.map(l => ({ uri: l.uri, description: l.description })) } } : {}),
  };

  const checkRes = await fetch(`${API}/loyaltyClass/${encodeURIComponent(cid)}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (checkRes.status === 404) {
    const createRes = await fetch(`${API}/loyaltyClass`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ id: cid, ...classBody }),
    });
    if (!createRes.ok) {
      return NextResponse.json({ error: "Erreur création classe" }, { status: 500 });
    }
    return NextResponse.json({ ok: true, action: "created" });
  } else if (checkRes.ok) {
    const fields = ["programName", "hexBackgroundColor", "programLogo", "issuerName", "textModulesData", "reviewStatus"];
    if (heroUrl) fields.push("heroImage");
    if (validLinks.length > 0) fields.push("linksModuleData");
    const patchRes = await fetch(
      `${API}/loyaltyClass/${encodeURIComponent(cid)}?updateMask=${fields.join(",")}`,
      {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(classBody),
      }
    );
    if (!patchRes.ok) {
      const err = await patchRes.text();
      return NextResponse.json({ error: err }, { status: 500 });
    }
    return NextResponse.json({ ok: true, action: "patched" });
  }

  return NextResponse.json({ error: "Erreur API Google" }, { status: 500 });
}
