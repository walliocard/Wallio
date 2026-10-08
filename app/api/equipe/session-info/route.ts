import { adminDb } from "@/lib/admin";
import { verifierTokenEquipe, getTokenFromRequest } from "@/lib/equipe";

export async function GET(req: Request) {
  try {
    const session = await verifierTokenEquipe(getTokenFromRequest(req));
    if (!session) return Response.json({ error: "Non autorisé" }, { status: 401 });

    const marchandDoc = await adminDb().collection("marchands").doc(session.marchand_id).get();
    if (!marchandDoc.exists) return Response.json({ error: "Marchand introuvable" }, { status: 404 });

    const membresSnap = await adminDb()
      .collection("marchands").doc(session.marchand_id)
      .collection("membres")
      .where("statut", "==", "actif")
      .get();

    const membres = membresSnap.docs.map(d => ({ id: d.id, prenom: d.data().prenom as string }));

    return Response.json({
      marchandId: session.marchand_id,
      marchandNom: marchandDoc.data()!.nom,
      membres,
    });
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 });
  }
}
