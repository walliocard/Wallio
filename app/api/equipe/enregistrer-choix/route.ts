import { adminDb } from "@/lib/admin";
import { verifierTokenEquipe, getTokenFromRequest } from "@/lib/equipe";
import { FieldValue, Timestamp } from "firebase-admin/firestore";

export async function POST(req: Request) {
  try {
    const session = await verifierTokenEquipe(getTokenFromRequest(req));
    if (!session) return Response.json({ error: "Non autorisé" }, { status: 401 });

    const { clientId, choix } = await req.json();
    if (!clientId || !choix) return Response.json({ error: "Paramètres manquants" }, { status: 400 });
    if (choix !== "petit" && choix !== "grand") return Response.json({ error: "Choix invalide" }, { status: 400 });

    const clientRef = adminDb().collection("clients").doc(clientId);
    const clientDoc = await clientRef.get();
    if (!clientDoc.exists) return Response.json({ error: "Client introuvable" }, { status: 404 });

    const clientData = clientDoc.data()!;
    if (clientData.marchand_id !== session.marchand_id) return Response.json({ error: "Non autorisé" }, { status: 403 });

    if (!clientData.choix_en_attente) return Response.json({ already_done: true });

    const update: Record<string, unknown> = {
      choix_en_attente: FieldValue.delete(),
      choix_fait: choix,
      ...(choix === "petit" ? { recompense_en_attente: true } : {}),
    };
    await clientRef.update(update);

    adminDb().collection("marchands").doc(session.marchand_id).collection("historique").add({
      client_id: clientId,
      client_prenom: clientData.prenom,
      client_nom: clientData.nom || "",
      type: "choix_equipe",
      choix,
      added_by: session.prenom,
      membre_id: session.membre_id,
      created_at: Timestamp.now(),
    }).catch(() => {});

    const base = process.env.NEXT_PUBLIC_APP_URL || "https://app.walliocard.com";
    const body = JSON.stringify({ walletId: clientData.wallet_id });
    const opts = { method: "POST", headers: { "Content-Type": "application/json" }, body };
    fetch(`${base}/api/apple-wallet/push-update`, opts).catch(() => {});
    fetch(`${base}/api/google-wallet/push-update`, opts).catch(() => {});

    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 });
  }
}
