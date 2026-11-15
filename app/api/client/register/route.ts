import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { adminDb, initAdmin } from "@/lib/admin";
import { FieldValue } from "firebase-admin/firestore";

export async function POST(req: Request) {
  try {
    const { telephone, prenom, nom, dob, email, pin } = await req.json() as {
      telephone?: string; prenom?: string; nom?: string;
      dob?: string; email?: string; pin?: string;
    };
    if (!telephone || !prenom || !nom) {
      return NextResponse.json({ ok: false, error: "missing_fields" }, { status: 400 });
    }
    initAdmin();
    const db = adminDb();
    const ref = db.collection("wallio_users").doc(telephone);
    const existing = await ref.get();
    if (existing.exists) {
      return NextResponse.json({ ok: false, error: "already_exists" });
    }
    const data: Record<string, unknown> = {
      prenom, nom, telephone,
      date_naissance: dob || "",
      created_at: FieldValue.serverTimestamp(),
    };
    if (email) data.email = email;
    if (pin && /^\d{4}$/.test(pin)) data.pin_hash = await bcrypt.hash(pin, 10);
    await ref.set(data);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("register error:", e);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
