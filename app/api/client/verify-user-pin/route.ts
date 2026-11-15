import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { adminDb, initAdmin } from "@/lib/admin";

export async function POST(req: Request) {
  try {
    const { telephone, pin } = await req.json() as { telephone?: string; pin?: string };
    if (!telephone || !pin) return NextResponse.json({ ok: false });
    initAdmin();
    const snap = await adminDb().collection("wallio_users").doc(telephone).get();
    if (!snap.exists) return NextResponse.json({ ok: false, error: "not_found" });
    const hash = snap.data()!.pin_hash as string | undefined;
    if (!hash) return NextResponse.json({ ok: false, error: "no_pin" });
    const valid = await bcrypt.compare(pin, hash);
    return NextResponse.json({ ok: valid });
  } catch (e) {
    console.error("verify-user-pin error:", e);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
