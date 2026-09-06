import { NextResponse } from "next/server";
import { adminDb, adminAuth } from "@/lib/admin";
import { FieldValue } from "firebase-admin/firestore";

export async function POST(req: Request) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }
  const idToken = authHeader.slice(7);

  let uid: string;
  try {
    const decoded = await adminAuth().verifyIdToken(idToken);
    uid = decoded.uid;
  } catch {
    return NextResponse.json({ error: "Token invalide" }, { status: 401 });
  }

  const body = await req.json();

  // Whitelist stricte — jamais actif, nfc_id, abonnement_statut (champs admin uniquement)
  const allowed = [
    // Carte Apple Wallet
    "logo_url", "strip_url", "strip_raw_url",
    "apple_bg_color", "apple_fg_color", "apple_label_color",
    "apple_primary_label", "apple_reward_label", "apple_member_label",
    "apple_description", "apple_back_info",
    "apple_header_label", "apple_header_value",
    "apple_aux1_label", "apple_aux1_value",
    "apple_aux2_label", "apple_aux2_value",
    "apple_aux3_label", "apple_aux3_value",
    "apple_icon_url",
    "apple_stamps_on_strip", "apple_strip_stamp_style",
    "apple_stamp_text", "apple_stamp_text_bold", "apple_stamp_text_italic",
    "apple_stamp_text_size", "apple_stamp_color", "apple_stamp_position",
    "apple_stamp_size", "apple_stamp_thickness", "apple_stamp_logo_opacity",
    "apple_strip_text_y", "apple_strip_crop_y", "apple_location",
    // Carte Google Wallet
    "google_bg_color", "google_hero_url",
    "google_primary_label", "google_secondary_label",
    "google_text_modules", "google_links",
    // Carte comptoir
    "comptoir_bg_url",
    // Réglages marchand
    "nom", "email",
    "objectif_tampons", "nom_recompense", "mode_recompense", "paliers",
    "icone_tampons", "couleur_principale", "couleur_secondaire",
    "anti_doublon_delai", "fuseau_horaire",
    "notif_actif", "notif_message",
    "double_tampons_fin",
    "automatisations",
    "milestone_rewards",
  ];

  const data: Record<string, unknown> = { updated_at: FieldValue.serverTimestamp() };
  for (const key of allowed) {
    if (key in body) data[key] = body[key] ?? null;
  }

  // set(merge) fonctionne pour création (inscription) ET mise à jour
  await adminDb().collection("marchands").doc(uid).set(data, { merge: true });

  return NextResponse.json({ ok: true });
}
