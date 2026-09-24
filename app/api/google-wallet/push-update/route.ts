import { NextResponse } from "next/server";
import { adminDb, initAdmin, adminMessaging } from "@/lib/admin";
import { getGoogleAccessToken } from "@/lib/google-wallet/auth";
import { getWalletLang } from "@/lib/wallet-lang";

const ISSUER_ID = process.env.GOOGLE_WALLET_ISSUER_ID!;
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://app.walliocard.com";
const API = "https://walletobjects.googleapis.com/walletobjects/v1";

function objectId(walletId: string) {
  return `${ISSUER_ID}.${walletId.replace(/[^a-zA-Z0-9_]/g, "_")}`;
}

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

export async function POST(req: Request) {
  const { walletId } = await req.json().catch(() => ({})) as { walletId?: string };
  if (!walletId || !ISSUER_ID || !process.env.GOOGLE_WALLET_KEY_JSON) {
    return NextResponse.json({ pushed: false });
  }

  initAdmin();
  const db = adminDb();

  const snap = await db.collection("clients")
    .where("wallet_id", "==", walletId).limit(1).get();
  if (snap.empty) return NextResponse.json({ pushed: false });

  const client = snap.docs[0].data();
  if (client.wallet_type !== "google") {
    return NextResponse.json({ pushed: false, reason: "not_google" });
  }

  const marchandSnap = await db.collection("marchands").doc(client.marchand_id).get();
  const m = marchandSnap.exists ? marchandSnap.data()! : {};
  const ld = getWalletLang((m as Record<string, unknown>).langue as string | undefined);

  const tampons = client.tampons || 0;
  const palierInfo = prochainPalierInfo(m as Record<string, unknown>, client as Record<string, unknown>);
  const { objectif, recompense } = palierInfo;
  const isProgressif = (m as Record<string, unknown>).mode_recompense === "progressif"
    && !!((m as Record<string, unknown>).paliers as unknown[] | undefined)?.length;
  const marchandNom = (m.nom as string) || "Wallio";
  const logoUrl = `${BASE_URL}/api/logo/${client.marchand_id}`;
  const isRecompense = client.recompense_en_attente === true;

  // 1 — PATCH loyaltyObject : tampons + nom récompense per-client en progressif
  try {
    const token = await getGoogleAccessToken();
    const patchBody: Record<string, unknown> = {
      loyaltyPoints: {
        balance: { string: `${tampons} / ${objectif}` },
        label: (m.google_primary_label as string) || ld.stamps,
      },
    };
    if (isProgressif) {
      patchBody.textModulesData = [{ header: ld.reward, body: recompense || ld.reward, id: "recompense_client" }];
    }
    const updateMask = isProgressif ? "loyaltyPoints,textModulesData" : "loyaltyPoints";
    const res = await fetch(
      `${API}/loyaltyObject/${encodeURIComponent(objectId(walletId))}?updateMask=${updateMask}`,
      {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(patchBody),
      }
    );
    if (!res.ok) {
      console.error("[GW push-update] PATCH failed:", res.status, await res.text());
    }
  } catch (e) {
    console.error("[GW push-update] PATCH error:", e);
  }

  // 2 — Notif FCM
  const fcmToken = client.fcm_token as string | undefined;
  if (fcmToken) {
    try {
      const notifBody = isRecompense
        ? `${recompense} débloquée !`
        : `${tampons} / ${objectif} tampons`;

      await adminMessaging().send({
        token: fcmToken,
        webpush: {
          data: {
            title: marchandNom,
            body: notifBody,
            icon: logoUrl,
            url: `${BASE_URL}/mes-cartes`,
          },
          headers: { TTL: "3600" },
          fcmOptions: { link: `${BASE_URL}/mes-cartes` },
        },
      });
    } catch (e) {
      console.error("[GW push-update] FCM error:", e);
      if (String(e).includes("registration-token-not-registered") || String(e).includes("invalid-registration-token")) {
        await snap.docs[0].ref.update({ fcm_token: null });
      }
    }
  }

  return NextResponse.json({ pushed: true });
}
