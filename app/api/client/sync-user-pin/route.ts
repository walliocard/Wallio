import { NextResponse } from "next/server";
import { adminDb, initAdmin } from "@/lib/admin";

// Copie pin_hash + email de wallio_users vers tous les docs clients de ce téléphone
export async function POST(req: Request) {
  try {
    const { telephone } = await req.json() as { telephone?: string };
    if (!telephone) return NextResponse.json({ ok: false });
    initAdmin();
    const db = adminDb();
    const userSnap = await db.collection("wallio_users").doc(telephone).get();
    if (!userSnap.exists) return NextResponse.json({ ok: false, error: "user_not_found" });
    const userData = userSnap.data()!;
    const patch: Record<string, unknown> = {};
    if (userData.pin_hash) patch.pin_hash = userData.pin_hash;
    if (userData.email) patch.email = userData.email;
    if (Object.keys(patch).length === 0) return NextResponse.json({ ok: true, synced: 0 });
    const clientsSnap = await db.collection("clients").where("telephone", "==", telephone).get();
    if (clientsSnap.empty) return NextResponse.json({ ok: true, synced: 0 });
    const batch = db.batch();
    clientsSnap.docs.forEach(d => batch.update(d.ref, patch));
    await batch.commit();
    return NextResponse.json({ ok: true, synced: clientsSnap.size });
  } catch (e) {
    console.error("sync-user-pin error:", e);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
