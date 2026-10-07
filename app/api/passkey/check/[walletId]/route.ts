import { adminDb } from "@/lib/admin";

export async function GET(_: Request, { params }: { params: Promise<{ walletId: string }> }) {
  try {
    const { walletId } = await params;
    const snap = await adminDb().collection("passkeys").where("wallet_id", "==", walletId).limit(1).get();
    return Response.json({ registered: !snap.empty });
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 });
  }
}
