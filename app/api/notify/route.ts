import { NextResponse } from "next/server";
import { getAuth as getAdminAuth } from "firebase-admin/auth";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb, adminMessaging } from "@/lib/admin";
import { randomUUID } from "crypto";

export async function POST(req: Request) {
  try {
    const { title, body, segment, marchandId, idToken } = await req.json();

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
    const notifTitle = `${marchandNom} — ${title}`;

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://app.walliocard.com";
    const iconUrl = `${appUrl}/api/logo/${marchandId}`;

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

    // Déduplique par token FCM
    const seen = new Set<string>();
    const tokenDocs: { token: string; ref: FirebaseFirestore.DocumentReference }[] = [];
    const allRefs: FirebaseFirestore.DocumentReference[] = [];

    snap.forEach(doc => {
      allRefs.push(doc.ref);
      const token = doc.data().fcm_token;
      if (token && !seen.has(token)) {
        seen.add(token);
        tokenDocs.push({ token, ref: doc.ref });
      }
    });

    // Sauvegarde la notif dans chaque doc client (inbox PWA)
    const notifRecord = {
      id: randomUUID(),
      title: notifTitle,
      body,
      marchandNom,
      marchandId,
      sentAt: new Date().toISOString(),
      read: false,
    };
    const firestoreBatch = db.batch();
    for (const ref of allRefs) {
      firestoreBatch.update(ref, { notifs: FieldValue.arrayUnion(notifRecord) });
    }
    await firestoreBatch.commit();

    if (tokenDocs.length === 0) {
      return NextResponse.json({ sent: 0, failed: 0, total: 0 });
    }

    // Envoi FCM — data-only pour contrôle total de l'affichage (icone marchand)
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
            body,
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

    return NextResponse.json({ sent, failed, total: tokenDocs.length });
  } catch (err) {
    console.error("Notify error:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
