import { NextResponse } from "next/server";
import { adminDb, initAdmin } from "@/lib/admin";

// DELETE /api/delete-account
// Body: { telephone: string, walletId: string }
// Supprime tous les documents clients avec ce numéro (tous marchands)
// Requiert walletId pour prouver que l'appelant possède bien ce compte
export async function DELETE(req: Request) {
  const { telephone, walletId } = await req.json();
  if (!telephone || typeof telephone !== "string") {
    return NextResponse.json({ error: "telephone requis" }, { status: 400 });
  }
  if (!walletId || typeof walletId !== "string") {
    return NextResponse.json({ error: "walletId requis" }, { status: 400 });
  }

  initAdmin();
  const db = adminDb();

  // Vérification croisée : le walletId doit appartenir à ce numéro de téléphone
  const verif = await db.collection("clients")
    .where("wallet_id", "==", walletId)
    .where("telephone", "==", telephone)
    .limit(1)
    .get();
  if (verif.empty) {
    return NextResponse.json({ error: "Identifiants invalides" }, { status: 403 });
  }

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
