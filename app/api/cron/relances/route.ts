import { NextResponse } from "next/server";
import { Timestamp } from "firebase-admin/firestore";
import { adminDb } from "@/lib/admin";

export async function GET(req: Request) {
  if (req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = adminDb();

  const marchandsSnap = await db.collection("marchands")
    .where("actif", "==", true)
    .where("automatisations.relance.actif", "==", true)
    .get();

  let traites = 0;

  for (const marchandDoc of marchandsSnap.docs) {
    const marchand = marchandDoc.data();
    const delaiJours = marchand.automatisations?.relance?.delai_jours ?? 30;
    const seuil = Timestamp.fromMillis(Date.now() - delaiJours * 86400 * 1000);

    const clientsSnap = await db.collection("clients")
      .where("marchand_id", "==", marchandDoc.id)
      .where("derniere_visite", "<", seuil)
      .get();

    for (const clientDoc of clientsSnap.docs) {
      if (!clientDoc.data().relance_pending) {
        await clientDoc.ref.update({ relance_pending: true });
        traites++;
      }
    }
  }

  return NextResponse.json({ ok: true, traites });
}
