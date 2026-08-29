import { NextResponse } from "next/server";
import { adminDb, initAdmin } from "@/lib/admin";
import { getGoogleAccessToken, buildSaveToWalletJwt } from "@/lib/google-wallet/auth";

const ISSUER_ID = process.env.GOOGLE_WALLET_ISSUER_ID!;
const BASE_URL = "https://app.wallio.ma";
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

  if (classRes.status === 404) {
    const logoUri = (m.logo_url as string | undefined) || "https://wallio-seven.vercel.app/icon-192.png";
    const createRes = await fetch(`${API}/loyaltyClass`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        id: cid,
        issuerName: "Wallio",
        reviewStatus: "DRAFT",
        programName: m.nom,
        programLogo: {
          sourceUri: { uri: logoUri },
          contentDescription: { defaultValue: { language: "fr-FR", value: m.nom } },
        },
        hexBackgroundColor: m.couleur_principale || "#1C1C1E",
        countryCode: "MA",
      }),
    });

    if (!createRes.ok) {
      const err = await createRes.text();
      console.error("[Google Wallet] Erreur création classe:", createRes.status, err);
      return NextResponse.json({ error: "Erreur création classe Google Wallet" }, { status: 500 });
    }
  } else if (!classRes.ok) {
    const err = await classRes.text();
    console.error("[Google Wallet] Erreur récupération classe:", classRes.status, err);
    return NextResponse.json({ error: "Erreur Google Wallet API" }, { status: 500 });
  }

  const loyaltyObject = {
    id: oid,
    classId: cid,
    state: "ACTIVE",
    loyaltyPoints: {
      balance: { int: client.tampons || 0 },
      label: "Tampons",
    },
    secondaryLoyaltyPoints: {
      balance: { int: m.objectif_tampons || 10 },
      label: "Objectif",
    },
    barcode: {
      type: "QR_CODE",
      value: `${BASE_URL}/client/${walletId}`,
    },
    accountName: `${client.prenom} ${client.nom}`,
    accountId: walletId,
    textModulesData: [
      { header: "Recompense", body: m.nom_recompense || "Recompense", id: "recompense" },
    ],
  };

  const jwt = buildSaveToWalletJwt([loyaltyObject]);
  return NextResponse.redirect(`https://pay.google.com/gp/v/save/${jwt}`, 302);
}
