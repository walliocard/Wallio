import { adminDb } from "@/lib/admin";
import { verifierTokenEquipe } from "@/lib/equipe";

export async function POST(req: Request) {
  try {
    const equipeToken = req.headers.get("x-equipe-token") || "";
    const bearerToken = req.headers.get("authorization")?.replace("Bearer ", "") || "";

    let marchandId: string | null = null;

    if (equipeToken) {
      const session = await verifierTokenEquipe(equipeToken);
      if (!session) return Response.json({ error: "Non autorisé" }, { status: 401 });
      marchandId = session.marchand_id;
    } else if (bearerToken) {
      const { getAuth } = await import("firebase-admin/auth");
      const decoded = await getAuth().verifyIdToken(bearerToken);
      marchandId = decoded.uid;
    } else {
      return Response.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { clientId } = await req.json();
    if (!clientId) return Response.json({ error: "clientId manquant" }, { status: 400 });

    const clientDoc = await adminDb().collection("clients").doc(clientId).get();
    if (!clientDoc.exists || clientDoc.data()!.marchand_id !== marchandId)
      return Response.json({ error: "Non autorisé" }, { status: 403 });

    await adminDb().collection("clients").doc(clientId).update({ birthday_bonus: false });
    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 });
  }
}
