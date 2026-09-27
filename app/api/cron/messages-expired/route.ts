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

    // Push APNS à tous les clients Apple Wallet du marchand pour nettoyer le backField
    const clientsSnap = await db.collection("clients")
      .where("marchand_id", "==", marchandId)
      .where("apns_push_token", "!=", null)
      .get();

    const nowStr = new Date().toISOString();
    for (const clientDoc of clientsSnap.docs) {
      const token = clientDoc.data().apns_push_token as string;
      try {
        await clientDoc.ref.update({ apns_last_updated: nowStr });
        await pushPassUpdate(token);
      } catch { /* fire-and-forget */ }
    }

    cleaned++;
  }

  return NextResponse.json({ cleaned });
}
