import { NextResponse } from "next/server";
import { adminDb, initAdmin } from "@/lib/admin";

// DELETE /api/delete-account
// Body: { telephone: string }
// Supprime tous les documents clients avec ce numéro (tous marchands)
export async function DELETE(req: Request) {
  const { telephone } = await req.json();
  if (!telephone || typeof telephone !== "string") {
    return NextResponse.json({ error: "telephone requis" }, { status: 400 });
  }

  initAdmin();
  const db = adminDb();

  const snap = await db.collection("clients")
    .where("telephone", "==", telephone)
    .get();

  if (snap.empty) {
    return NextResponse.json({ deleted: 0 });
  }

  // Batch delete (max 499 par batch)
  const docs = snap.docs;
  for (let i = 0; i < docs.length; i += 499) {
    const batch = db.batch();
    docs.slice(i, i + 499).forEach(d => batch.delete(d.ref));
    await batch.commit();
  }

  return NextResponse.json({ deleted: docs.length });
}
