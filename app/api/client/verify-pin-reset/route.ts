import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { adminDb, initAdmin } from "@/lib/admin";
import { Timestamp } from "firebase-admin/firestore";

export async function POST(req: Request) {
  try {
    const { telephone, code, dob } = await req.json() as { telephone?: string; code?: string; dob?: string };
    if (!telephone || (!code && !dob)) {
      return NextResponse.json({ ok: false, error: "Données invalides" }, { status: 400 });
    }

    initAdmin();
    const db = adminDb();
    const snap = await db.collection("clients").where("telephone", "==", telephone).get();
    if (snap.empty) return NextResponse.json({ ok: false, error: "Client introuvable" }, { status: 404 });

    if (dob) {
      // Vérification par date de naissance
      const match = snap.docs.some(d => d.data().date_naissance === dob);
      if (!match) return NextResponse.json({ ok: false, error: "Date de naissance incorrecte" });
      return NextResponse.json({ ok: true });
    }

    // Vérification par code OTP email
    const clientData = snap.docs[0].data();
    const hash = clientData.pin_reset_code_hash as string | undefined;
    const expiresAt = clientData.pin_reset_expires_at as Timestamp | undefined;

    if (!hash || !expiresAt) return NextResponse.json({ ok: false, error: "Aucun code en attente" });
    if (expiresAt.toDate() < new Date()) return NextResponse.json({ ok: false, error: "Code expiré. Recommencez." });

    const valid = await bcrypt.compare(code!, hash);
    if (!valid) return NextResponse.json({ ok: false, error: "Code incorrect" });

    // Nettoyer le code après validation
    const batch = db.batch();
    snap.docs.forEach(d => batch.update(d.ref, { pin_reset_code_hash: null, pin_reset_expires_at: null }));
    await batch.commit();

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("verify-pin-reset error:", e);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
