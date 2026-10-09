import { adminAuth, adminDb } from "@/lib/admin";
import { getMarchandById, getClientByWalletId, ajouterTampon } from "@/lib/loyalty";

export async function POST(req: Request) {
  try {
    const token = req.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) return Response.json({ error: "Non autorisé" }, { status: 401 });

    const decoded = await adminAuth().verifyIdToken(token);
    const marchandId = decoded.uid;

    const { walletId, forceOverride } = await req.json();
    if (!walletId) return Response.json({ error: "walletId manquant" }, { status: 400 });

    const marchand = await getMarchandById(marchandId);
    if (!marchand) return Response.json({ error: "Marchand introuvable" }, { status: 404 });

    const client = await getClientByWalletId(walletId, marchandId);
    if (!client) return Response.json({ type: "not_found" });

    const result = await ajouterTampon(client, marchand, forceOverride === true);

    if (result.type === "ok" || result.type === "recompense") {
      const body = JSON.stringify({ walletId: client.wallet_id });
      const opts = { method: "POST", headers: { "Content-Type": "application/json" }, body };
      const base = process.env.NEXT_PUBLIC_APP_URL || "https://app.walliocard.com";
      fetch(`${base}/api/apple-wallet/push-update`, opts).catch(() => {});
      fetch(`${base}/api/google-wallet/push-update`, opts).catch(() => {});

      const { Timestamp: TS } = await import("firebase-admin/firestore");
      adminDb().collection("marchands").doc(marchandId).collection("historique").add({
        client_id: client.id,
        client_prenom: client.prenom,
        client_nom: client.nom || "",
        tampons_apres: (result as Record<string, unknown>).tampons ?? client.tampons,
        recompense: result.type === "recompense",
        type: "qr_gerant",
        added_by: marchand.nom,
        created_at: TS.now(),
      }).catch(() => {});
    }

    const mn = marchand as Record<string, unknown>;
    const r = result as Record<string, unknown>;
    return Response.json({
      ...result,
      clientId: client.id,
      walletId: client.wallet_id,
      prenom: client.prenom,
      objectif: (r.objectif as number | undefined) ?? (mn.objectif_tampons as number),
      prochain_recompense: (r.prochainRecompense as string) || (mn.nom_recompense as string) || "",
      mode_recompense: (mn.mode_recompense as string) || "cyclique",
      paliers_valides: client.paliers_valides || [],
      total_paliers: ((mn.paliers as unknown[]) || []).length,
    });
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 });
  }
}
