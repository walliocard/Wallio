import { adminDb } from "@/lib/admin";
import { getTokenFromRequest } from "@/lib/equipe";

export async function DELETE(req: Request) {
  try {
    const token = getTokenFromRequest(req);
    if (token) await adminDb().collection("equipe_sessions").doc(token).delete();
    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 });
  }
}
