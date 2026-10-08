import { verifierTokenEquipe, getTokenFromRequest } from "@/lib/equipe";
import { getMarchandById, getClientByWalletId, ajouterTampon } from "@/lib/loyalty";
import { adminDb } from "@/lib/admin";
import { FieldValue } from "firebase-admin/firestore";

export async function POST(req: Request) {
  try {
    const session = await verifierTokenEquipe(getTokenFromRequest(req));
    if (!session) return Response.json({ error: "Non autorisé" }, { status: 401 });

    const { walletId, manual } = await req.json();
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

      // Mise à jour compteurs du membre (fire-and-forget)
      const today = new Date().toISOString().slice(0, 10);
      const membreRef = adminDb().collection("marchands").doc(session.marchand_id).collection("membres").doc(session.membre_id);
      membreRef.get().then(doc => {
        const data = doc.data() || {};
        const isToday = data.scans_today_date === today;
        const update: Record<string, unknown> = {
          scans_today: isToday ? FieldValue.increment(1) : 1,
          scans_today_date: today,
          scans_total: FieldValue.increment(1),
        };
        if (manual) {
          update.scans_manual_today = isToday ? FieldValue.increment(1) : 1;
          update.scans_manual_total = FieldValue.increment(1);
        }
        membreRef.update(update).catch(() => {});
      }).catch(() => {});
    }

    const mn = marchand as Record<string, unknown>;
    const r = result as Record<string, unknown>;
    return Response.json({
      ...result,
      clientId: client.id,
      telephone: client.telephone,
      prenom: client.prenom,
      prochain_recompense: (r.prochainRecompense as string) || (mn.nom_recompense as string) || "",
      mode_recompense: (mn.mode_recompense as string) || "cyclique",
      paliers_valides: client.paliers_valides || [],
      total_paliers: ((mn.paliers as unknown[]) || []).length,
    });
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 });
  }
}
