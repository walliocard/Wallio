import { NextResponse } from "next/server";
import { Timestamp, FieldValue, DocumentReference } from "firebase-admin/firestore";
import { randomUUID } from "crypto";
import { adminDb, adminMessaging } from "@/lib/admin";
import { pushPassUpdate } from "@/lib/apple-wallet/apns";

export async function GET(req: Request) {
  if (!process.env.CRON_SECRET || req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const db = adminDb();
  const messaging = adminMessaging();

  const marchandsSnap = await db.collection("marchands")
    .where("actif", "==", true)
    .where("automatisations.relance.actif", "==", true)
    .get();

  let traites = 0;

  for (const marchandDoc of marchandsSnap.docs) {
    const marchand = marchandDoc.data();
    const delaiJours = marchand.automatisations?.relance?.delai_jours ?? 30;
    const message = marchand.automatisations?.relance?.message as string | undefined;
    const logoUrl = marchand.logo_url as string | undefined;
    const seuil = Timestamp.fromMillis(Date.now() - delaiJours * 86400 * 1000);

    const clientsSnap = await db.collection("clients")
      .where("marchand_id", "==", marchandDoc.id)
      .where("derniere_visite", "<", seuil)
      .get();

    const tokens: string[] = [];
    const clientRefs: DocumentReference[] = [];

    for (const clientDoc of clientsSnap.docs) {
      const client = clientDoc.data();
      if (client.relance_pending) continue;

      const notifRecord = {
        id: randomUUID(),
        title: `${marchand.nom} vous attend !`,
        body: message || "",
        marchandNom: (marchand.nom as string) || "",
        marchandId: marchandDoc.id,
        sentAt: new Date().toISOString(),
        read: false,
      };
      await clientDoc.ref.update({
        relance_pending: true,
        notifs: FieldValue.arrayUnion(notifRecord),
      });

      if (client.fcm_token) {
        tokens.push(client.fcm_token);
        clientRefs.push(clientDoc.ref);
      }
      // Apple Wallet — push APNS pour afficher le message de relance au dos de la carte
      if (client.apns_push_token) {
        pushPassUpdate(client.apns_push_token).catch(() => {});
        await clientDoc.ref.update({ apns_last_updated: new Date().toISOString() });
      }
      // Google Wallet — push pour synchroniser la carte
      const BASE = process.env.NEXT_PUBLIC_APP_URL ?? "https://app.walliocard.com";
      if (client.wallet_type === "google" && client.wallet_id) {
        fetch(`${BASE}/api/google-wallet/push-update`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ walletId: client.wallet_id }),
        }).catch(() => {});
      }
      traites++;
    }

    if (tokens.length > 0 && message) {
      const batchRes = await messaging.sendEachForMulticast({
        tokens,
        notification: { title: `${marchand.nom} vous attend !`, body: message },
        webpush: {
          notification: { icon: logoUrl || "/wallio-instagram-profil.png", badge: "/favicon-32.png" },
          fcmOptions: { link: "https://app.walliocard.com" },
        },
      });
      const invalid = ["messaging/registration-token-not-registered", "messaging/invalid-registration-token"];
      const cleanupBatch = db.batch();
      let hasCleanup = false;
      batchRes.responses.forEach((r, i) => {
        if (!r.success && r.error?.code && invalid.includes(r.error.code)) {
          cleanupBatch.update(clientRefs[i], { fcm_token: null });
          hasCleanup = true;
        }
      });
      if (hasCleanup) await cleanupBatch.commit();
    }
  }

  return NextResponse.json({ ok: true, traites });
}
