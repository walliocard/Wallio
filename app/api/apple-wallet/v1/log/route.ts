import { NextResponse } from "next/server";
import { adminDb } from "@/lib/admin";

// POST : Apple Wallet envoie des logs d'erreur ici
export async function POST(req: Request) {
  let body: unknown = null;
  try {
    body = await req.json();
  } catch {
    // corps invalide
  }
  console.error("[Apple Wallet logs]", JSON.stringify(body));
  try {
    const db = adminDb();
    await db.collection("apple_wallet_logs").add({
      body,
      createdAt: new Date().toISOString(),
    });
  } catch (e) {
    console.error("[Apple Wallet logs] Firestore write failed:", e);
  }
  return NextResponse.json({}, { status: 200 });
}
