import { adminDb } from "@/lib/admin";
import { verifierTokenEquipe, getTokenFromRequest } from "@/lib/equipe";

export async function GET(req: Request) {
  try {
    const session = await verifierTokenEquipe(getTokenFromRequest(req));
    if (!session) return Response.json({ error: "Non autorisé" }, { status: 401 });

    const snap = await adminDb()
      .collection("clients")
      .where("marchand_id", "==", session.marchand_id)
      .get();

    const clients = snap.docs
      .map(d => {
        const data = d.data();
        return {
          id: d.id,
          wallet_id: data.wallet_id as string,
          prenom: data.prenom,
          nom: data.nom,
          telephone: data.telephone,
          tampons: data.tampons || 0,
          derniere_visite: data.derniere_visite ? { seconds: data.derniere_visite.seconds } : null,
        };
      })
      .sort((a, b) => b.tampons - a.tampons);

    return Response.json({ clients });
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 });
  }
}
