import { adminDb } from "@/lib/admin";
import { FieldValue, Timestamp } from "firebase-admin/firestore";

export async function POST(req: Request) {
  try {
    const { walletId, marchandId, choix } = await req.json();
    if (!walletId || !marchandId || !choix) return Response.json({ error: "Paramètres manquants" }, { status: 400 });
    if (choix !== "petit" && choix !== "grand") return Response.json({ error: "Choix invalide" }, { status: 400 });

    const snap = await adminDb().collection("clients")
      .where("wallet_id", "==", walletId)
      .where("marchand_id", "==", marchandId)
      .limit(1)
      .get();
    if (snap.empty) return Response.json({ error: "Client introuvable" }, { status: 404 });

    const clientDoc = snap.docs[0];
    const clientData = clientDoc.data();

    const marchandDoc = await adminDb().collection("marchands").doc(marchandId).get();
    if (!marchandDoc.exists) return Response.json({ error: "Marchand introuvable" }, { status: 404 });
    if (marchandDoc.data()?.mode_recompense !== "flex") return Response.json({ error: "Mode non supporté" }, { status: 400 });

    if (!clientData.choix_en_attente) return Response.json({ already_done: true });

    const update: Record<string, unknown> = {
      choix_en_attente: FieldValue.delete(),
      choix_fait: choix,
      ...(choix === "petit" ? { recompense_en_attente: true } : {}),
    };
    await clientDoc.ref.update(update);

    adminDb().collection("marchands").doc(marchandId).collection("historique").add({
      client_id: clientDoc.id,
      client_prenom: clientData.prenom,
      client_nom: clientData.nom || "",
      type: "choix_client",
      choix,
      created_at: Timestamp.now(),
    }).catch(() => {});

    const base = process.env.NEXT_PUBLIC_APP_URL || "https://app.walliocard.com";
    const body = JSON.stringify({ walletId });
    const opts = { method: "POST", headers: { "Content-Type": "application/json" }, body };
    fetch(`${base}/api/apple-wallet/push-update`, opts).catch(() => {});
    fetch(`${base}/api/google-wallet/push-update`, opts).catch(() => {});

    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 });
  }
}
