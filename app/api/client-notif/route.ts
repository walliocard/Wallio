import { NextResponse } from "next/server";
import { adminDb, initAdmin } from "@/lib/admin";

// PATCH /api/client-notif
// Body: { walletId: string; fcm_token: string | null }
// Permet au client de gérer son opt-in/out FCM (walletId sert de token d'auth)
export async function PATCH(req: Request) {
  try {
    const { walletId, fcm_token } = await req.json();
    if (!walletId) return NextResponse.json({ error: "walletId requis" }, { status: 400 });

    initAdmin();
    const db = adminDb();

    const snap = await db.collection("clients").where("wallet_id", "==", walletId).limit(1).get();
    if (snap.empty) return NextResponse.json({ error: "Client introuvable" }, { status: 404 });

    await snap.docs[0].ref.update({ fcm_token: fcm_token ?? null });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
