import { adminDb } from "@/lib/admin";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const identifier = url.searchParams.get("identifier") || url.searchParams.get("telephone");
    if (!identifier) return Response.json({ registered: false });
    const snap = await adminDb().collection("passkeys")
      .where("identifier", "==", identifier)
      .limit(1).get();
    if (!snap.empty) return Response.json({ registered: true });
    // backward compat : anciens docs sans champ identifier
    const snap2 = await adminDb().collection("passkeys")
      .where("telephone", "==", identifier)
      .limit(1).get();
    return Response.json({ registered: !snap2.empty });
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 });
  }
}
