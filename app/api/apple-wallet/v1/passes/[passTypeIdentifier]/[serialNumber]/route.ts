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

  const m = marchand;
  const pkpass = await buildPkpass({
    walletId: serialNumber,
    authToken: client.apns_auth_token,
    merchantName: m.nom,
    logoUrl: m.logo_url || undefined,
    stripUrl: m.strip_url || undefined,
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
    stampsOnStrip:    m.apple_stamps_on_strip === true,
    stripStampStyle:  m.apple_strip_stamp_style || "dot",
    stampColor:       m.apple_stamp_color       || "#FFFFFF",
    stampPosition:    typeof m.apple_stamp_position === "number" ? m.apple_stamp_position : 50,
    stampSizePreset:  m.apple_stamp_size        || "m",
    stampThickness:   m.apple_stamp_thickness   ?? 2,
    stampText:        m.apple_stamp_text        || "",
    stampTextBold:    m.apple_stamp_text_bold   === true,
    stampTextItalic:  m.apple_stamp_text_italic === true,
    stampTextSize:    m.apple_stamp_text_size   ?? 1,
    stampLogoOpacity: m.apple_stamp_logo_opacity ?? 1,
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
