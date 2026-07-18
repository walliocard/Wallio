import { NextResponse } from "next/server";
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

function getAdmin() {
  if (!getApps().length) {
    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      }),
    });
  }
  return getFirestore();
}

export async function GET(req: Request) {
  if (req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = getAdmin();
  const today = new Date();
  const mois = String(today.getMonth() + 1).padStart(2, "0");
  const jour = String(today.getDate()).padStart(2, "0");
  const suffix = `${mois}-${jour}`;

  const marchandsSnap = await db.collection("marchands")
    .where("actif", "==", true)
    .where("automatisations.anniversaire.actif", "==", true)
    .get();

  let traites = 0;

  for (const marchandDoc of marchandsSnap.docs) {
    const marchand = marchandDoc.data();
    const joursAvant = marchand.automatisations?.anniversaire?.jours_avant ?? 0;

    const dateRef = new Date(today);
    dateRef.setDate(dateRef.getDate() + joursAvant);
    const moisRef = String(dateRef.getMonth() + 1).padStart(2, "0");
    const jourRef = String(dateRef.getDate()).padStart(2, "0");
    const suffixRef = `${moisRef}-${jourRef}`;

    const clientsSnap = await db.collection("clients")
      .where("marchand_id", "==", marchandDoc.id)
      .get();

    for (const clientDoc of clientsSnap.docs) {
      const client = clientDoc.data();
      if (!client.date_naissance) continue;
      const dnSuffix = client.date_naissance.slice(5, 10);
      if (dnSuffix === suffixRef && !client.birthday_bonus_used) {
        await clientDoc.ref.update({
          birthday_bonus: true,
          birthday_bonus_used: false,
        });
        traites++;
      }
    }
  }

  return NextResponse.json({ ok: true, traites });
}
