import { adminDb } from "@/lib/admin";

export async function GET(req: Request) {
  try {
    const telephone = new URL(req.url).searchParams.get("telephone");
    if (!telephone) return Response.json({ registered: false });
    const snap = await adminDb().collection("passkeys").where("telephone", "==", telephone).limit(1).get();
    return Response.json({ registered: !snap.empty });
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 });
  }
}
