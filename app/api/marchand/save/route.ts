import { NextResponse } from "next/server";
import { adminDb, adminAuth } from "@/lib/admin";
import { FieldValue } from "firebase-admin/firestore";
import { getGoogleAccessToken } from "@/lib/google-wallet/auth";

const ISSUER_ID = process.env.GOOGLE_WALLET_ISSUER_ID;
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://app.walliocard.com";
const API = "https://walletobjects.googleapis.com/walletobjects/v1";

async function patchGoogleWalletClass(uid: string) {
  if (!ISSUER_ID || !process.env.GOOGLE_WALLET_KEY_JSON) return;
  const snap = await adminDb().collection("marchands").doc(uid).get();
  if (!snap.exists) return;
  const m = snap.data()!;

  const cid = `${ISSUER_ID}.wallio_${uid.replace(/[^a-zA-Z0-9_]/g, "_")}`;
  const token = await getGoogleAccessToken();

  const logoUri = `${BASE_URL}/api/logo/${uid}`;
  const bgColor = (m.google_bg_color as string) || (m.apple_bg_color as string) || (m.couleur_principale as string) || "#1C1C1E";
  const heroUrl = (m.google_hero_url as string) || (m.strip_url as string) || undefined;
  const textModules = (m.google_text_modules as { header: string; body: string; id: string }[] | undefined) || [];
  const links = (m.google_links as { uri: string; description: string }[] | undefined) || [];

  // Modules texte au niveau classe (identiques pour tous les clients)
  const classTextModules = [
    { header: "Récompense", body: (m.nom_recompense as string) || "Récompense", id: "recompense" },
    ...textModules.filter(mod => mod.header && mod.body),
  ];

  const validLinks = links.filter(l => l.uri && l.description);

  const classBody: Record<string, unknown> = {
    issuerName: "Wallio",
    reviewStatus: "UNDER_REVIEW",
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
    await fetch(`${API}/loyaltyClass`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ id: cid, ...classBody }),
    });
  } else if (checkRes.ok) {
    const fields = ["programName", "hexBackgroundColor", "programLogo", "issuerName", "textModulesData"];
    if (heroUrl) fields.push("heroImage");
    if (validLinks.length > 0) fields.push("linksModuleData");
    await fetch(`${API}/loyaltyClass/${encodeURIComponent(cid)}?updateMask=${fields.join(",")}`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(classBody),
    });
  }
}

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

  // Sync Google Wallet class si des champs visuels ont changé
  const triggerGW = ["google_bg_color", "google_hero_url", "logo_url", "google_primary_label", "nom"].some(f => f in body);
  if (triggerGW) {
    patchGoogleWalletClass(uid).catch(e => console.error("[save] GW class patch failed:", e));
  }

  return NextResponse.json({ ok: true });
}
