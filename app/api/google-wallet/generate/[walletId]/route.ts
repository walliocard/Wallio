import { NextResponse } from "next/server";
import { adminDb } from "@/lib/admin";
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

  // Marquer ce client comme utilisateur Google Wallet
  await clientRef.update({ wallet_type: "google" });

  try {
    const token = await getGoogleAccessToken();

    // Créer la classe si elle n'existe pas encore
    const classRes = await fetch(`${API}/loyaltyClass/${encodeURIComponent(cid)}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (classRes.status === 404) {
      await fetch(`${API}/loyaltyClass`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          id: cid,
          issuerName: "Wallio",
          reviewStatus: "UNDER_REVIEW",
          programName: m.nom,
          ...(m.logo_url && {
            programLogo: {
              sourceUri: { uri: m.logo_url },
              contentDescription: { defaultValue: { language: "fr-FR", value: m.nom } },
            },
          }),
          hexBackgroundColor: m.couleur_principale || "#1C1C1E",
          countryCode: "MA",
        }),
      });
    }
  } catch {
    // Si l'API échoue, on continue avec le JWT seul
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
      { header: "Récompense", body: m.nom_recompense || "Récompense", id: "recompense" },
    ],
  };

  const jwt = buildSaveToWalletJwt([loyaltyObject]);
  return NextResponse.redirect(`https://pay.google.com/gp/v/save/${jwt}`, 302);
}
