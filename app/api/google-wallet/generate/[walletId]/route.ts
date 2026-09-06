import { NextResponse } from "next/server";
import { adminDb, initAdmin } from "@/lib/admin";
import { getGoogleAccessToken, buildSaveToWalletJwt } from "@/lib/google-wallet/auth";

const ISSUER_ID = process.env.GOOGLE_WALLET_ISSUER_ID!;
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://app.walliocard.com";
const API = "https://walletobjects.googleapis.com/walletobjects/v1";

function classId(marchandId: string) {
  return `${ISSUER_ID}.wallio_${marchandId.replace(/[^a-zA-Z0-9_]/g, "_")}`;
}

function objectId(walletId: string) {
  return `${ISSUER_ID}.${walletId.replace(/[^a-zA-Z0-9_]/g, "_")}`;
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ walletId: string }> }
) {
  const { walletId } = await params;

  initAdmin();
  const db = adminDb();

  const clientSnap = await db.collection("clients")
    .where("wallet_id", "==", walletId).limit(1).get();
  if (clientSnap.empty) return NextResponse.json({ error: "Client introuvable" }, { status: 404 });

  const clientRef = clientSnap.docs[0].ref;
  const client = clientSnap.docs[0].data();

  const marchandDoc = await db.collection("marchands").doc(client.marchand_id).get();
  if (!marchandDoc.exists) return NextResponse.json({ error: "Marchand introuvable" }, { status: 404 });

  const m = marchandDoc.data()!;
  const cid = classId(client.marchand_id);
  const oid = objectId(walletId);

  await clientRef.update({ wallet_type: "google" });

  // Créer ou vérifier la classe de fidélité
  let token: string;
  try {
    token = await getGoogleAccessToken();
  } catch (e) {
    console.error("[Google Wallet] Erreur getGoogleAccessToken:", e);
    return NextResponse.json({ error: "Impossible de s'authentifier auprès de Google" }, { status: 500 });
  }

  const classRes = await fetch(`${API}/loyaltyClass/${encodeURIComponent(cid)}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  // Proxies publics HTTPS — Google ne peut pas fetcher des data URLs base64
  const logoUri = `${BASE_URL}/api/logo/${client.marchand_id}`;
  const bgColor = (m.google_bg_color as string | undefined)
    || (m.apple_bg_color as string | undefined)
    || (m.couleur_principale as string | undefined)
    || "#1C1C1E";
  // Hero via proxy uniquement si une bannière est configurée
  const hasHero = !!(m.google_hero_url || m.strip_url);
  const heroUrl = hasHero ? `${BASE_URL}/api/google-hero/${client.marchand_id}` : undefined;

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

  if (classRes.status === 404) {
    const createRes = await fetch(`${API}/loyaltyClass`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ id: cid, ...classBody }),
    });

    if (!createRes.ok) {
      const err = await createRes.text();
      console.error("[Google Wallet] Erreur création classe:", createRes.status, err);
      return NextResponse.json({ error: "Erreur création classe Google Wallet" }, { status: 500 });
    }
  } else if (classRes.ok) {
    const fields = ["programName", "hexBackgroundColor", "programLogo", "issuerName", "textModulesData"];
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
      console.error("[Google Wallet] PATCH classe échoué:", patchRes.status, await patchRes.text());
    }
  } else {
    const err = await classRes.text();
    console.error("[Google Wallet] Erreur récupération classe:", classRes.status, err);
    return NextResponse.json({ error: "Erreur Google Wallet API" }, { status: 500 });
  }

  const loyaltyObject = {
    id: oid,
    classId: cid,
    state: "ACTIVE",
    loyaltyPoints: {
      balance: { string: `${client.tampons || 0} / ${m.objectif_tampons || 10}` },
      label: (m.google_primary_label as string) || "Tampons",
    },
    barcode: {
      type: "QR_CODE",
      value: `WALLIO:${walletId}`,
      alternateText: " ",
    },
    accountName: `${client.prenom} ${client.nom}`,
  };

  const jwt = buildSaveToWalletJwt([loyaltyObject]);
  return NextResponse.redirect(`https://pay.google.com/gp/v/save/${jwt}`, 302);
}
