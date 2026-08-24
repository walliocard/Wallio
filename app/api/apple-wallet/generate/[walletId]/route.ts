import { NextResponse } from "next/server";
import { adminDb } from "@/lib/admin";
import { buildPkpass } from "@/lib/apple-wallet/buildPass";
import crypto from "crypto";

// GET /api/apple-wallet/generate/[walletId]
// Retourne le fichier .pkpass à télécharger dans Apple Wallet
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ walletId: string }> }
) {
  const { walletId } = await params;
  const db = adminDb();

  const clientsSnap = await db
    .collection("clients")
    .where("wallet_id", "==", walletId)
    .limit(1)
    .get();

  if (clientsSnap.empty) {
    return NextResponse.json({ error: "Client introuvable" }, { status: 404 });
  }

  const clientDoc = clientsSnap.docs[0];
  const client = clientDoc.data();

  const marchandDoc = await db.collection("marchands").doc(client.marchand_id).get();
  if (!marchandDoc.exists) {
    return NextResponse.json({ error: "Marchand introuvable" }, { status: 404 });
  }
  const marchand = marchandDoc.data()!;

  let authToken: string = client.apns_auth_token;
  if (!authToken) {
    authToken = crypto.randomBytes(20).toString("hex");
    await clientDoc.ref.update({ apns_auth_token: authToken });
  }

  const pkpass = await buildPkpass({
    walletId,
    authToken,
    merchantName: marchand.nom,
    backgroundColor: marchand.couleur_principale || "#007AFF",
    stampsCurrent: client.tampons || 0,
    stampsObjective: marchand.objectif_tampons || 10,
    rewardName: marchand.nom_recompense || "Récompense",
    clientPrenom: client.prenom || "",
    clientNom: client.nom || "",
  });

  return new Response(new Uint8Array(pkpass), {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.apple.pkpass",
      "Content-Disposition": `attachment; filename="wallio-${walletId}.pkpass"`,
      "Content-Length": String(pkpass.length),
    },
  });
}
