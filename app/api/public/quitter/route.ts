import { NextResponse } from "next/server";
import { adminDb, initAdmin } from "@/lib/admin";

// Quitter le programme d'UN commerce : supprime le document client correspondant.
// Vérifié par le walletId (preuve de possession de cette carte).
export async function DELETE(req: Request) {
  const { walletId } = await req.json();
  if (!walletId || typeof walletId !== "string") {
    return NextResponse.json({ error: "walletId requis" }, { status: 400 });
  }
  initAdmin();
  const db = adminDb();
  const snap = await db.collection("clients").where("wallet_id", "==", walletId).limit(1).get();
  if (snap.empty) return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  await snap.docs[0].ref.delete();
  return NextResponse.json({ ok: true });
}
