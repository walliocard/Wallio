import { verifierTokenEquipe, getTokenFromRequest } from "@/lib/equipe";
import { getMarchandById, getClientByWalletId, ajouterTampon } from "@/lib/loyalty";

export async function POST(req: Request) {
  try {
    const session = await verifierTokenEquipe(getTokenFromRequest(req));
    if (!session) return Response.json({ error: "Non autorisé" }, { status: 401 });

    const { walletId } = await req.json();
    if (!walletId) return Response.json({ error: "walletId manquant" }, { status: 400 });

    const marchand = await getMarchandById(session.marchand_id);
    if (!marchand) return Response.json({ error: "Marchand introuvable" }, { status: 404 });

    const client = await getClientByWalletId(walletId, session.marchand_id);
    if (!client) return Response.json({ type: "not_found" });

    const result = await ajouterTampon(client, marchand);

    if (result.type === "ok" || result.type === "recompense") {
      const body = JSON.stringify({ walletId: client.wallet_id });
      const opts = { method: "POST", headers: { "Content-Type": "application/json" }, body };
      fetch(`${process.env.NEXT_PUBLIC_APP_URL || "https://app.walliocard.com"}/api/apple-wallet/push-update`, opts).catch(() => {});
      fetch(`${process.env.NEXT_PUBLIC_APP_URL || "https://app.walliocard.com"}/api/google-wallet/push-update`, opts).catch(() => {});
    }

    return Response.json({ ...result, clientId: client.id, telephone: client.telephone, prenom: client.prenom });
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 });
  }
}
