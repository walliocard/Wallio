import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { adminDb, initAdmin } from "@/lib/admin";

export async function POST(req: Request) {
  try {
    const { telephone, pin } = await req.json();
    if (!telephone || !pin || !/^\d{4}$/.test(pin)) {
      return NextResponse.json({ ok: false, error: "Données invalides" }, { status: 400 });
    }
    initAdmin();
    const db = adminDb();
    const snap = await db.collection("clients").where("telephone", "==", telephone).get();
    if (snap.empty) return NextResponse.json({ ok: false, error: "Client introuvable" }, { status: 404 });
    const hash = await bcrypt.hash(pin, 10);
    const batch = db.batch();
    snap.docs.forEach(d => batch.update(d.ref, { pin_hash: hash }));
    await batch.commit();
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("set-pin error:", e);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
