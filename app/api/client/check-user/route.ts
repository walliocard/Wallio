import { NextResponse } from "next/server";
import { adminDb, initAdmin } from "@/lib/admin";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const telephone = searchParams.get("telephone");
    if (!telephone) return NextResponse.json({ exists: false });
    initAdmin();
    const snap = await adminDb().collection("wallio_users").doc(telephone).get();
    if (!snap.exists) return NextResponse.json({ exists: false });
    const data = snap.data()!;
    return NextResponse.json({
      exists: true,
      hasPin: !!data.pin_hash,
      prenom: data.prenom,
      nom: data.nom,
      email: data.email || null,
    });
  } catch (e) {
    console.error("check-user error:", e);
    return NextResponse.json({ exists: false });
  }
}
