import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { adminDb, initAdmin } from "@/lib/admin";

export async function POST(req: Request) {
  try {
    const { telephone, pin } = await req.json();
    if (!telephone || !pin || !/^\d{4}$/.test(pin)) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }
    initAdmin();
    const db = adminDb();
    const snap = await db.collection("clients").where("telephone", "==", telephone).get();
    if (snap.empty) return NextResponse.json({ ok: false });
    const hash = snap.docs.map(d => d.data().pin_hash as string | undefined).find(h => !!h);
    if (!hash) return NextResponse.json({ ok: false, noPin: true });
    const ok = await bcrypt.compare(pin, hash);
    return NextResponse.json({ ok });
  } catch (e) {
    console.error("verify-pin error:", e);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
