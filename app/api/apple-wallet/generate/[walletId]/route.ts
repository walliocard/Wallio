import { NextResponse } from "next/server";
import { adminDb } from "@/lib/admin";
import { buildPkpass } from "@/lib/apple-wallet/buildPass";
import crypto from "crypto";

function prochainPalierInfo(m: Record<string, unknown>, client: Record<string, unknown>) {
  const paliers = (m.paliers as { tampons: number; recompense: string }[] | undefined) || [];
  if (m.mode_recompense === "progressif" && paliers.length > 0) {
    const pv = (client.paliers_valides as boolean[]) || [];
    const enrolled = client.paliers_valides !== undefined;
    const tampons = (client.tampons as number) || 0;
    const p = enrolled
      ? (paliers.find((x, i) => !pv[i]) ?? paliers[paliers.length - 1])
      : (paliers.find(x => x.tampons > tampons) ?? paliers[paliers.length - 1]);
    return { objectif: p.tampons, recompense: p.recompense };
  }
  return { objectif: (m.objectif_tampons as number) || 10, recompense: (m.nom_recompense as string) || "" };
}

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

  const langDefaults: Record<string, { stamps: string; reward: string; member: string }> = {
    fr: { stamps: "Tampons",  reward: "Récompense", member: "Membre"  },
    ro: { stamps: "Ștampile", reward: "Recompensă", member: "Membru"  },
    es: { stamps: "Sellos",   reward: "Recompensa", member: "Miembro" },
  };
  const ld = langDefaults[(m.langue as string) || "fr"] ?? langDefaults.fr;

  let authToken: string = client.apns_auth_token;
  if (!authToken) {
    authToken = crypto.randomBytes(20).toString("hex");
    await clientDoc.ref.update({ apns_auth_token: authToken });
  }

  const palierInfo = prochainPalierInfo(m as Record<string, unknown>, client as Record<string, unknown>);

  let pkpass: Buffer;
  try {
    pkpass = await buildPkpass({
    walletId,
    authToken,
    merchantName: m.nom,
    logoUrl: (m.logo_url as string | undefined) || undefined,
    notifIconUrl: (m.apple_icon_url as string | undefined) || undefined,
    stripUrl: (m.strip_url as string | undefined) || undefined,
    backgroundColor: m.apple_bg_color || m.couleur_principale || "#1C1C1E",
    foregroundColor: m.apple_fg_color || undefined,
    labelColorHex: m.apple_label_color || undefined,
    stampsCurrent: client.tampons || 0,
    stampsObjective: palierInfo.objectif,
    rewardName: palierInfo.recompense || ld.reward,
    clientPrenom: client.prenom || "",
    clientNom: client.nom || "",
    primaryLabel: m.apple_primary_label || ld.stamps,
    rewardLabel: m.apple_reward_label || ld.reward,
    memberLabel: m.apple_member_label || ld.member,
    auxiliaryFields: [
      m.apple_aux1_value ? { label: m.apple_aux1_label || "INFO", value: m.apple_aux1_value } : null,
      m.apple_aux2_value ? { label: m.apple_aux2_label || "INFO", value: m.apple_aux2_value } : null,
      m.apple_aux3_value ? { label: m.apple_aux3_label || "INFO", value: m.apple_aux3_value } : null,
    ].filter(Boolean) as { label: string; value: string }[],
    backInfo: m.apple_back_info || undefined,
    description: m.apple_description || undefined,
    locations: m.apple_location ? [m.apple_location as { latitude: number; longitude: number; relevantText?: string }] : undefined,
    // Tampons visuels sur la bannière
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
