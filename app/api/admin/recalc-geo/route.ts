import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { adminDb, initAdmin } from "@/lib/admin";
import { extractLatLng } from "@/lib/geo";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "wallio.card@gmail.com";
const SECRET = process.env.ADMIN_SECRET ?? process.env.CRON_SECRET ?? "";

async function checkAdmin() {
  const store = await cookies();
  const token = store.get("wallio_admin")?.value;
  const expected = Buffer.from(`${ADMIN_EMAIL}:${SECRET}`).toString("base64");
  return token === expected;
}

// Réapplique l'extraction GPS à tous les marchands ayant un lien Google Maps.
export async function POST() {
  if (!await checkAdmin()) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }
  initAdmin();
  const snap = await adminDb().collection("marchands").get();

  let updated = 0;
  const failed: { id: string; nom: string; maps_url: string }[] = [];

  for (const doc of snap.docs) {
    const m = doc.data();
    const url = (m.maps_url as string) || "";
    if (!url) continue;
    const r = await extractLatLng(url);
    if (r) {
      await doc.ref.update({ latitude: r.lat, longitude: r.lng });
      updated++;
    } else {
      failed.push({ id: doc.id, nom: (m.nom as string) || doc.id, maps_url: url });
    }
  }

  return NextResponse.json({ ok: true, updated, failed });
}
