import { NextResponse } from "next/server";
import { adminDb } from "@/lib/admin";
import { buildPkpass } from "@/lib/apple-wallet/buildPass";
import crypto from "crypto";

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
  const m = marchandDoc.data()!;

  let authToken: string = client.apns_auth_token;
  if (!authToken) {
    authToken = crypto.randomBytes(20).toString("hex");
    await clientDoc.ref.update({ apns_auth_token: authToken });
  }

  let pkpass: Buffer;
  try {
    pkpass = await buildPkpass({
    walletId,
    authToken,
    merchantName: m.nom,
    logoUrl: (m.logo_url as string | undefined) || undefined,
    stripUrl: (m.strip_url as string | undefined) || undefined,
    backgroundColor: m.apple_bg_color || m.couleur_principale || "#1C1C1E",
    foregroundColor: m.apple_fg_color || undefined,
    labelColorHex: m.apple_label_color || undefined,
    stampsCurrent: client.tampons || 0,
    stampsObjective: m.objectif_tampons || 10,
    rewardName: m.nom_recompense || "Récompense",
    clientPrenom: client.prenom || "",
    clientNom: client.nom || "",
    primaryLabel: m.apple_primary_label || "Tampons",
    rewardLabel: m.apple_reward_label || "Récompense",
    memberLabel: m.apple_member_label || "Membre",
    auxiliaryFields: [
      m.apple_aux1_value ? { label: m.apple_aux1_label || "INFO", value: m.apple_aux1_value } : null,
      m.apple_aux2_value ? { label: m.apple_aux2_label || "INFO", value: m.apple_aux2_value } : null,
    ].filter(Boolean) as { label: string; value: string }[],
    backInfo: m.apple_back_info || undefined,
    description: m.apple_description || undefined,
    });
  } catch (e) {
    console.error("[Apple Wallet] buildPkpass error:", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }

  return new Response(new Uint8Array(pkpass), {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.apple.pkpass",
      "Content-Disposition": `inline; filename="wallio-${walletId}.pkpass"`,
      "Content-Length": String(pkpass.length),
    },
  });
}
