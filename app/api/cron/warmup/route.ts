import { NextResponse } from "next/server";
import { initAdmin, adminDb } from "@/lib/admin";

// Garde Firebase Admin chaud — appelé toutes les 10 minutes
export async function GET(req: Request) {
  if (req.headers.get("Authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  initAdmin();
  // Ping léger Firestore pour garder la connexion active
  await adminDb().collection("marchands").limit(1).get();
  return NextResponse.json({ ok: true, ts: Date.now() });
}
