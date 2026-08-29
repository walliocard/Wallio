import { NextResponse } from "next/server";
import { adminDb, adminMessaging, initAdmin } from "@/lib/admin";

export async function GET(req: Request) {
  if (req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  initAdmin();
  const db = adminDb();
  const messaging = adminMessaging();

  const today = new Date();
  const marchandsSnap = await db.collection("marchands")
    .where("actif", "==", true)
    .where("automatisations.anniversaire.actif", "==", true)
    .get();

  let traites = 0;

  for (const marchandDoc of marchandsSnap.docs) {
    const marchand = marchandDoc.data();
    const joursAvant = marchand.automatisations?.anniversaire?.jours_avant ?? 0;
    const message = marchand.automatisations?.anniversaire?.message as string | undefined;
    const logoUrl = marchand.logo_url as string | undefined;

    const dateRef = new Date(today);
    dateRef.setDate(dateRef.getDate() + joursAvant);
    const suffixRef = `${String(dateRef.getMonth() + 1).padStart(2, "0")}-${String(dateRef.getDate()).padStart(2, "0")}`;

    const clientsSnap = await db.collection("clients")
      .where("marchand_id", "==", marchandDoc.id)
      .get();

    const tokens: string[] = [];
    const clientIds: string[] = [];

    for (const clientDoc of clientsSnap.docs) {
      const client = clientDoc.data();
      if (!client.date_naissance || client.birthday_bonus_used) continue;
      const dnSuffix = client.date_naissance.slice(5, 10);
      if (dnSuffix !== suffixRef) continue;

      await clientDoc.ref.update({ birthday_bonus: true, birthday_bonus_used: true });

      if (client.fcm_token) {
        tokens.push(client.fcm_token);
        clientIds.push(clientDoc.id);
      }
      traites++;
    }

    if (tokens.length > 0 && message) {
      await messaging.sendEachForMulticast({
        tokens,
        notification: { title: `Joyeux anniversaire ! 🎂`, body: message },
        webpush: {
          notification: { icon: logoUrl || "/icon-192.png", badge: "/favicon-32.png" },
          fcmOptions: { link: "https://app.wallio.ma" },
        },
      });
    }
  }

  return NextResponse.json({ ok: true, traites });
}
