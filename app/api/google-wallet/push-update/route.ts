import { NextResponse } from "next/server";
import { adminDb } from "@/lib/admin";
import { getGoogleAccessToken } from "@/lib/google-wallet/auth";

const ISSUER_ID = process.env.GOOGLE_WALLET_ISSUER_ID!;
const API = "https://walletobjects.googleapis.com/walletobjects/v1";

function objectId(walletId: string) {
  return `${ISSUER_ID}.${walletId.replace(/[^a-zA-Z0-9_]/g, "_")}`;
}

export async function POST(req: Request) {
  const { walletId } = await req.json().catch(() => ({})) as { walletId?: string };
  if (!walletId) return NextResponse.json({ error: "walletId manquant" }, { status: 400 });

  const db = adminDb();
  const snap = await db.collection("clients")
    .where("wallet_id", "==", walletId).limit(1).get();
  if (snap.empty) return NextResponse.json({ error: "Client introuvable" }, { status: 404 });

  const client = snap.docs[0].data();

  if (client.wallet_type !== "google") {
    return NextResponse.json({ updated: false, reason: "Pas de carte Google Wallet" });
  }

  try {
    const token = await getGoogleAccessToken();
    const res = await fetch(`${API}/loyaltyObject/${encodeURIComponent(objectId(walletId))}`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        loyaltyPoints: { balance: { int: client.tampons || 0 }, label: "Tampons" },
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      return NextResponse.json({ updated: false, error: err }, { status: res.status });
    }

    return NextResponse.json({ updated: true });
  } catch (e) {
    return NextResponse.json({ updated: false, error: String(e) }, { status: 500 });
  }
}
