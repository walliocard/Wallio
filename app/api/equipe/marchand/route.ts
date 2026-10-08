import { adminDb } from "@/lib/admin";
import { verifierTokenEquipe, getTokenFromRequest } from "@/lib/equipe";

export async function GET(req: Request) {
  try {
    const session = await verifierTokenEquipe(getTokenFromRequest(req));
    if (!session) return Response.json({ error: "Non autorisé" }, { status: 401 });

    const doc = await adminDb().collection("marchands").doc(session.marchand_id).get();
    if (!doc.exists) return Response.json({ error: "Marchand introuvable" }, { status: 404 });

    const m = doc.data()!;
    return Response.json({
      id: doc.id,
      nom: m.nom,
      objectif_tampons: m.objectif_tampons,
      nom_recompense: m.nom_recompense,
      mode_recompense: m.mode_recompense || "cyclique",
      paliers: m.paliers || [],
      couleur_principale: m.couleur_principale,
      apple_bg_color: m.apple_bg_color,
      logo_url: m.logo_url,
      anti_doublon_delai: m.anti_doublon_delai,
      fuseau_horaire: m.fuseau_horaire,
      double_tampons_fin: m.double_tampons_fin || null,
    });
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 });
  }
}
