import { NextResponse } from "next/server";
import { adminDb, initAdmin } from "@/lib/admin";
import { getGoogleAccessToken } from "@/lib/google-wallet/auth";

const ISSUER_ID = process.env.GOOGLE_WALLET_ISSUER_ID!;
const API = "https://walletobjects.googleapis.com/walletobjects/v1";

function objectId(walletId: string) {
  return `${ISSUER_ID}.${walletId.replace(/[^a-zA-Z0-9_]/g, "_")}`;
}

export async function POST(req: Request) {
  const { walletId } = await req.json().catch(() => ({})) as { walletId?: string };
  if (!walletId || !ISSUER_ID || !process.env.GOOGLE_WALLET_KEY_JSON) {
    return NextResponse.json({ pushed: false });
  }

  initAdmin();
  const db = adminDb();

  const snap = await db.collection("clients")
    .where("wallet_id", "==", walletId).limit(1).get();
  if (snap.empty) return NextResponse.json({ pushed: false });

  const client = snap.docs[0].data();
  if (client.wallet_type !== "google") {
    return NextResponse.json({ pushed: false, reason: "not_google" });
  }

  const marchandSnap = await db.collection("marchands").doc(client.marchand_id).get();
  const m = marchandSnap.exists ? marchandSnap.data()! : {};

  try {
    const token = await getGoogleAccessToken();
    const res = await fetch(
      `${API}/loyaltyObject/${encodeURIComponent(objectId(walletId))}?updateMask=loyaltyPoints`,
      {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          loyaltyPoints: {
            balance: { string: `${client.tampons || 0} / ${(m.objectif_tampons as number) || 10}` },
            label: (m.google_primary_label as string) || "Tampons",
          },
        }),
      }
    );

    if (!res.ok) {
      const err = await res.text();
      console.error("[GW push-update] PATCH failed:", res.status, err);
      return NextResponse.json({ pushed: false, error: err });
    }

    return NextResponse.json({ pushed: true });
  } catch (e) {
    console.error("[GW push-update] error:", e);
    return NextResponse.json({ pushed: false, error: String(e) });
  }
}
