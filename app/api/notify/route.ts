import { NextResponse } from "next/server";
import { getAuth as getAdminAuth } from "firebase-admin/auth";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb, adminMessaging } from "@/lib/admin";
import { pushPassUpdate } from "@/lib/apple-wallet/apns";
import { randomUUID } from "crypto";

export async function POST(req: Request) {
  try {
    const { title, body, segment, marchandId, idToken, logoUrl, expiresAt } = await req.json();

    if (!title || !body || !marchandId || !idToken) {
      return NextResponse.json({ error: "Champs manquants" }, { status: 400 });
    }

    const db = adminDb();
    const auth = getAdminAuth();

    const decoded = await auth.verifyIdToken(idToken);
    if (decoded.uid !== marchandId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    const marchandSnap = await db.collection("marchands").doc(marchandId).get();
    const marchandNom = (marchandSnap.data()?.nom as string) || "Wallio";
    const notifTitle = marchandNom;
    const notifBody = `${title} · ${body}`;

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://app.walliocard.com";
    const iconUrl = `${appUrl}/api/logo/${marchandId}`;

    // Sauvegarde le message actif sur le marchand (pour le backField Apple Wallet)
    const marchandUpdate: Record<string, unknown> = {
      current_message: notifBody,
      current_message_title: title,
      message_expires_at: expiresAt || FieldValue.delete(),
    };
    await db.collection("marchands").doc(marchandId).set(marchandUpdate, { merge: true });

    // Récupère les clients
    let query = db.collection("clients").where("marchand_id", "==", marchandId);
    if (segment === "actifs") {
      const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - 30);
      query = query.where("derniere_visite", ">=", cutoff) as typeof query;
    } else if (segment === "inactifs") {
      const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - 30);
      query = query.where("derniere_visite", "<", cutoff) as typeof query;
    }

    const snap = await query.get();

    const seen = new Set<string>();
    const tokenDocs: { token: string; ref: FirebaseFirestore.DocumentReference }[] = [];
    const allRefs: FirebaseFirestore.DocumentReference[] = [];
    const apnsDocs: { token: string; ref: FirebaseFirestore.DocumentReference }[] = [];

    snap.forEach(doc => {
      allRefs.push(doc.ref);
      const data = doc.data();
      const fcmToken = data.fcm_token;
      if (fcmToken && !seen.has(fcmToken)) {
        seen.add(fcmToken);
        tokenDocs.push({ token: fcmToken, ref: doc.ref });
      }
      if (data.apns_push_token) {
        apnsDocs.push({ token: data.apns_push_token, ref: doc.ref });
      }
    });

    // Sauvegarde la notif dans chaque doc client (inbox PWA)
    const notifRecord = {
      id: randomUUID(),
      title: notifTitle,
      body: notifBody,
      marchandNom,
      marchandId,
      sentAt: new Date().toISOString(),
      read: false,
      ...(expiresAt ? { expires_at: expiresAt } : {}),
    };
    const firestoreBatch = db.batch();
    for (const ref of allRefs) {
      firestoreBatch.update(ref, { notifs: FieldValue.arrayUnion(notifRecord) });
    }
    await firestoreBatch.commit();

    // APNS et FCM lancés EN PARALLÈLE — ni l'un ni l'autre ne bloque l'autre
    const now = new Date().toISOString();

    const apnsPromise = apnsDocs.length > 0
      ? Promise.all(apnsDocs.map(async ({ token, ref }) => {
          try {
            await ref.update({ apns_last_updated: now });
            await pushPassUpdate(token);
            return 1;
          } catch { return 0; }
        })).then(r => r.reduce((a: number, b: number) => a + b, 0))
      : Promise.resolve(0);

    const fcmPromise = tokenDocs.length > 0
      ? (async () => {
          const messaging = adminMessaging();
          let sent = 0;
          let failed = 0;
          for (let i = 0; i < tokenDocs.length; i += 500) {
            const batch = tokenDocs.slice(i, i + 500);
            const result = await messaging.sendEachForMulticast({
              tokens: batch.map(d => d.token),
              webpush: {
                data: {
                  title: notifTitle,
                  body: notifBody,
                  icon: iconUrl,
                  url: `${appUrl}/mes-cartes`,
                },
                headers: { TTL: "86400" },
                fcmOptions: { link: `${appUrl}/mes-cartes` },
              },
            });
            sent += result.successCount;
            failed += result.failureCount;
            const cleanups: Promise<unknown>[] = [];
            result.responses.forEach((r, idx) => {
              if (!r.success && r.error?.code && (
                r.error.code === "messaging/registration-token-not-registered" ||
                r.error.code === "messaging/invalid-registration-token"
              )) {
                cleanups.push(batch[idx].ref.update({ fcm_token: null }));
              }
            });
            if (cleanups.length > 0) await Promise.all(cleanups);
          }
          return { sent, failed };
        })()
      : Promise.resolve({ sent: 0, failed: 0 });

    const [apnsSent, { sent, failed }] = await Promise.all([apnsPromise, fcmPromise]);

    return NextResponse.json({ sent: sent + apnsSent, failed, total: tokenDocs.length + apnsSent });
  } catch (err) {
    console.error("Notify error:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
