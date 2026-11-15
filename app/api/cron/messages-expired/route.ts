import { NextResponse } from "next/server";
import { adminDb, initAdmin } from "@/lib/admin";
import { pushPassUpdate } from "@/lib/apple-wallet/apns";

// GET /api/cron/messages-expired — toutes les heures
// Vide le message actif des marchands dont message_expires_at est passé
// et push APNS pour nettoyer le backField du pass Apple Wallet
export async function GET(req: Request) {
  if (!process.env.CRON_SECRET || req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  initAdmin();
  const db = adminDb();
  const now = new Date().toISOString();

  const snap = await db.collection("marchands")
    .where("actif", "==", true)
    .where("message_expires_at", "<=", now)
    .get();

  if (snap.empty) return NextResponse.json({ cleaned: 0 });

  let cleaned = 0;

  for (const marchandDoc of snap.docs) {
    const marchandId = marchandDoc.id;

    // Vide les champs message sur le marchand
    await marchandDoc.ref.update({
      current_message: null,
      current_message_title: null,
      message_expires_at: null,
    });

    // Tous les clients du marchand : push APNS + nettoyage notifs expirées
    const clientsSnap = await db.collection("clients")
      .where("marchand_id", "==", marchandId)
      .get();

    const nowStr = new Date().toISOString();
    const updates: Promise<unknown>[] = [];

    for (const clientDoc of clientsSnap.docs) {
      const data = clientDoc.data();

      if (data.apns_push_token) {
        updates.push(
          clientDoc.ref.update({ apns_last_updated: nowStr })
            .then(() => pushPassUpdate(data.apns_push_token as string))
            .catch(() => {})
        );
      }

      const notifs = (data.notifs as Array<{ expires_at?: string }>) || [];
      const filtered = notifs.filter(n => !n.expires_at || n.expires_at > now);
      if (filtered.length < notifs.length) {
        updates.push(clientDoc.ref.update({ notifs: filtered }).catch(() => {}));
      }
    }

    await Promise.all(updates);

    cleaned++;
  }

  return NextResponse.json({ cleaned });
}
