import { adminDb } from "@/lib/admin";
import { verifierTokenEquipe, getTokenFromRequest } from "@/lib/equipe";
import { validerRecompense } from "@/lib/loyalty";

export async function POST(req: Request) {
  try {
    const session = await verifierTokenEquipe(getTokenFromRequest(req));
    if (!session) return Response.json({ error: "Non autorisé" }, { status: 401 });

    const { clientId, mode, palierIndex, paliersValides, totalPaliers } = await req.json();
    if (!clientId) return Response.json({ error: "clientId manquant" }, { status: 400 });

    // Mode flex : lire le client + marchand pour calculer le reset partiel
    if (mode === "flex") {
      const clientDoc = await adminDb().collection("clients").doc(clientId).get();
      if (!clientDoc.exists) return Response.json({ error: "Client introuvable" }, { status: 404 });
      if (clientDoc.data()!.marchand_id !== session.marchand_id) return Response.json({ error: "Non autorisé" }, { status: 403 });

      const marchandDoc = await adminDb().collection("marchands").doc(session.marchand_id).get();
      const marchandData = marchandDoc.data() || {};
      const clientData = clientDoc.data()!;

      if (!clientData.recompense_en_attente) return Response.json({ error: "Aucune récompense en attente" }, { status: 400 });
      const choixFait = clientData.choix_fait as "petit" | "grand" | undefined;
      if (!choixFait) return Response.json({ error: "Choix client manquant" }, { status: 400 });
      const tamponsActuels = clientData.tampons as number;
      const seuilReset = choixFait === "petit"
        ? (marchandData.palier_intermediaire as number)
        : (marchandData.objectif_tampons as number);

      await validerRecompense(clientId, "flex", undefined, undefined, undefined, tamponsActuels, seuilReset);
      const nouveauxTampons = Math.max(0, (tamponsActuels ?? 0) - (seuilReset ?? 0));
      return Response.json({ ok: true, nouveauxTampons });
    }

    // Vérification ownership pour modes non-flex
    const clientDoc2 = await adminDb().collection("clients").doc(clientId).get();
    if (!clientDoc2.exists || clientDoc2.data()!.marchand_id !== session.marchand_id)
      return Response.json({ error: "Non autorisé" }, { status: 403 });

    await validerRecompense(clientId, mode, palierIndex, paliersValides, totalPaliers);
    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 });
  }
}
