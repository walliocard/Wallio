import { NextResponse } from "next/server";
import { getAuth as getAdminAuth } from "firebase-admin/auth";
import { adminDb, adminMessaging, initAdmin } from "@/lib/admin";

// POST /api/notify
// Body : { title, body, segment: "tous" | "actifs" | "inactifs", marchandId, idToken }
export async function POST(req: Request) {
  try {
    const { title, body, segment, marchandId, idToken, logoUrl } = await req.json();

    if (!title || !body || !marchandId || !idToken) {
      return NextResponse.json({ error: "Champs manquants" }, { status: 400 });
    }

    const db = adminDb();
    const auth = getAdminAuth();

    // Vérifie l'identité du marchand
    const decoded = await auth.verifyIdToken(idToken);
    if (decoded.uid !== marchandId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    // Récupère les clients avec un token FCM
    let query = db.collection("clients").where("marchand_id", "==", marchandId);

    // Filtre par segment si besoin
    if (segment === "actifs") {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - 30);
      query = query.where("derniere_visite", ">=", cutoff) as typeof query;
    } else if (segment === "inactifs") {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - 30);
      query = query.where("derniere_visite", "<", cutoff) as typeof query;
    }

    const snap = await query.get();
    const tokenDocs: { token: string; ref: FirebaseFirestore.DocumentReference }[] = [];
    snap.forEach(doc => {
      const token = doc.data().fcm_token;
      if (token) tokenDocs.push({ token, ref: doc.ref });
    });

    if (tokenDocs.length === 0) {
      return NextResponse.json({ sent: 0, message: "Aucun client avec notifications activées" });
    }

    // Envoi en batch (max 500 par appel FCM) + nettoyage tokens expirés
    const messaging = adminMessaging();
    let sent = 0;
    let failed = 0;

    for (let i = 0; i < tokenDocs.length; i += 500) {
      const batch = tokenDocs.slice(i, i + 500);
      const result = await messaging.sendEachForMulticast({
        tokens: batch.map(d => d.token),
        notification: { title, body },
        webpush: {
          notification: { icon: (logoUrl as string | null) || "/icon-192.png", badge: "/favicon-32.png" },
          fcmOptions: { link: `${process.env.NEXT_PUBLIC_APP_URL ?? "https://app.walliocard.com"}` },
        },
      });
      sent += result.successCount;
      failed += result.failureCount;

      // Supprimer les tokens invalides/expirés de Firestore
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
