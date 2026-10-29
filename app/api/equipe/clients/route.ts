import { adminDb } from "@/lib/admin";
import { verifierTokenEquipe, getTokenFromRequest } from "@/lib/equipe";

export async function GET(req: Request) {
  try {
    const session = await verifierTokenEquipe(getTokenFromRequest(req));
    if (!session) return Response.json({ error: "Non autorisé" }, { status: 401 });

    const [snap, marchandDoc] = await Promise.all([
      adminDb().collection("clients").where("marchand_id", "==", session.marchand_id).get(),
      adminDb().collection("marchands").doc(session.marchand_id).get(),
    ]);

    const marchandData = marchandDoc.data() || {};
    const annivType = (marchandData.automatisations as Record<string, unknown> | undefined)
      ?.anniversaire as Record<string, unknown> | undefined;
    const anniv_custom = (annivType?.type as string | undefined) === "custom";

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
          recompense_en_attente: data.recompense_en_attente || false,
          birthday_bonus: data.birthday_bonus || false,
          derniere_visite: data.derniere_visite ? { seconds: data.derniere_visite.seconds } : null,
        };
      })
      .sort((a, b) => ((b.derniere_visite?.seconds || 0) - (a.derniere_visite?.seconds || 0)));

    return Response.json({ clients, anniv_custom });
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 });
  }
}
