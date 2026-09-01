import { NextResponse } from "next/server";
import { adminDb } from "@/lib/admin";
import { pushPassUpdate } from "@/lib/apple-wallet/apns";

// POST /api/apple-wallet/push-update
// Body : { walletId: string }
// Appelé côté UI après un tampon ajouté → signal Apple pour télécharger le pass mis à jour
export async function POST(req: Request) {
  const { walletId } = await req.json().catch(() => ({})) as { walletId?: string };
  if (!walletId) return NextResponse.json({ error: "walletId manquant" }, { status: 400 });

  const db = adminDb();

  const snap = await db
    .collection("clients")
    .where("wallet_id", "==", walletId)
    .limit(1)
    .get();

  if (snap.empty) return NextResponse.json({ error: "Client introuvable" }, { status: 404 });

  const client = snap.docs[0].data();

  // Enregistre la date de mise à jour (utilisée pour If-Modified-Since)
  await snap.docs[0].ref.update({ apns_last_updated: new Date().toISOString() });

  const pushToken: string | undefined = client.apns_push_token;
  if (!pushToken) {
    return NextResponse.json({ pushed: false, reason: "no_push_token" });
  }

  try {
    await pushPassUpdate(pushToken);
    return NextResponse.json({ pushed: true });
  } catch (err) {
    console.error("[push-update] APNS error:", err);
    return NextResponse.json({ pushed: false, reason: "apns_error", detail: String(err) }, { status: 500 });
  }
}
