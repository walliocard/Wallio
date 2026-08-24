import { adminDb } from "@/lib/admin";
import { buildPkpass } from "@/lib/apple-wallet/buildPass";

// GET : Apple appelle cet endpoint après avoir reçu le push APNS pour télécharger le pass mis à jour
export async function GET(
  req: Request,
  { params }: { params: Promise<{ passTypeIdentifier: string; serialNumber: string }> }
) {
  const { serialNumber } = await params;

  const authHeader = req.headers.get("Authorization") ?? "";
  const authToken = authHeader.replace("ApplePass ", "").trim();
  const ifModifiedSince = req.headers.get("If-Modified-Since");

  const db = adminDb();

  const snap = await db
    .collection("clients")
    .where("wallet_id", "==", serialNumber)
    .where("apns_auth_token", "==", authToken)
    .limit(1)
    .get();

  if (snap.empty) return new Response(null, { status: 401 });

  const client = snap.docs[0].data();

  if (ifModifiedSince && client.apns_last_updated) {
    const sinceMs = new Date(ifModifiedSince).getTime();
    const updatedMs = new Date(client.apns_last_updated).getTime();
    if (updatedMs <= sinceMs) return new Response(null, { status: 304 });
  }

  const marchandDoc = await db.collection("marchands").doc(client.marchand_id).get();
  if (!marchandDoc.exists) return new Response(null, { status: 404 });
  const marchand = marchandDoc.data()!;

  const pkpass = await buildPkpass({
    walletId: serialNumber,
    authToken: client.apns_auth_token,
    merchantName: marchand.nom,
    backgroundColor: marchand.couleur_principale || "#007AFF",
    stampsCurrent: client.tampons || 0,
    stampsObjective: marchand.objectif_tampons || 10,
    rewardName: marchand.nom_recompense || "Récompense",
    clientPrenom: client.prenom || "",
    clientNom: client.nom || "",
  });

  const lastModified = client.apns_last_updated
    ? new Date(client.apns_last_updated).toUTCString()
    : new Date().toUTCString();

  return new Response(new Uint8Array(pkpass), {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.apple.pkpass",
      "Last-Modified": lastModified,
      "Content-Length": String(pkpass.length),
    },
  });
}
