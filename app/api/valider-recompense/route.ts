import { adminDb } from "@/lib/admin";
import { verifierTokenEquipe } from "@/lib/equipe";
import { validerRecompense } from "@/lib/loyalty";

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
    if (!clientDoc.exists) return Response.json({ error: "Client introuvable" }, { status: 404 });
    const clientData = clientDoc.data()!;

    if (clientData.marchand_id !== marchandId)
      return Response.json({ error: "Non autorisé" }, { status: 403 });

    const marchandDoc = await adminDb().collection("marchands").doc(marchandId).get();
    const marchandData = marchandDoc.data() || {};
    const mode = (marchandData.mode_recompense as string) || "cyclique";

    let palierIndex: number | undefined;
    let paliersValides: boolean[] | undefined;
    let totalPaliers: number | undefined;

    if (mode === "progressif") {
      const paliers = (marchandData.paliers as { tampons: number; recompense: string }[]) || [];
      totalPaliers = paliers.length;
      paliersValides = (clientData.paliers_valides as boolean[]) || new Array(paliers.length).fill(false);
      palierIndex = paliers.findIndex((p, i) =>
        clientData.tampons >= p.tampons && !paliersValides![i]
      );
      if (palierIndex === -1) palierIndex = undefined;
    }

    await validerRecompense(clientId, mode, palierIndex, paliersValides, totalPaliers);
    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 });
  }
}
