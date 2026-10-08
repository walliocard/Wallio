import { verifierTokenEquipe, getTokenFromRequest } from "@/lib/equipe";
import { validerRecompense } from "@/lib/loyalty";

export async function POST(req: Request) {
  try {
    const session = await verifierTokenEquipe(getTokenFromRequest(req));
    if (!session) return Response.json({ error: "Non autorisé" }, { status: 401 });

    const { clientId, mode, palierIndex, paliersValides, totalPaliers } = await req.json();
    if (!clientId) return Response.json({ error: "clientId manquant" }, { status: 400 });

    await validerRecompense(clientId, mode, palierIndex, paliersValides, totalPaliers);
    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 });
  }
}
