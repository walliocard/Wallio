import { NextResponse } from "next/server";
import { initAdmin, adminDb } from "@/lib/admin";

// Garde Firebase Admin + page NFC chaudes — appelé toutes les 10 min
export async function GET(req: Request) {
  if (req.headers.get("Authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  const origin = new URL(req.url).origin;

  // 1. Chauffe Firebase Admin + Firestore Admin
  initAdmin();
  await adminDb().collection("marchands").limit(1).get();

  // 2. Chauffe la page NFC
  fetch(`${origin}/nfc/warmup-ping`).catch(() => {});

  // 3. Chauffe la page de connexion marchand
  fetch(`${origin}/auth/connexion`).catch(() => {});

  // 4. Chauffe les routes API critiques (Apple + Google Wallet push)
  fetch(`${origin}/api/apple-wallet/push-update`, { method: "POST", body: "{}", headers: { "Content-Type": "application/json" } }).catch(() => {});

  return NextResponse.json({ ok: true, ts: Date.now() });
}
