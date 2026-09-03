import { NextResponse } from "next/server";
import { Timestamp } from "firebase-admin/firestore";
import { adminDb, adminMessaging, initAdmin } from "@/lib/admin";

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

    for (const clientDoc of clientsSnap.docs) {
      const client = clientDoc.data();
      if (client.relance_pending) continue;

      await clientDoc.ref.update({ relance_pending: true });

      if (client.fcm_token) tokens.push(client.fcm_token);
      traites++;
    }

    if (tokens.length > 0 && message) {
      await messaging.sendEachForMulticast({
        tokens,
        notification: { title: `${marchand.nom} vous attend !`, body: message },
        webpush: {
          notification: { icon: logoUrl || "/icon-192.png", badge: "/favicon-32.png" },
          fcmOptions: { link: "https://app.walliocard.com" },
        },
      });
    }
  }

  return NextResponse.json({ ok: true, traites });
}
