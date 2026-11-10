import { verifierTokenEquipe, getTokenFromRequest } from "@/lib/equipe";
import { getMarchandById, getClientByWalletId, ajouterTampon, checkEtRecompenseParrain } from "@/lib/loyalty";
import { adminDb } from "@/lib/admin";
import { FieldValue, Timestamp } from "firebase-admin/firestore";

export async function POST(req: Request) {
  try {
    const session = await verifierTokenEquipe(getTokenFromRequest(req));
    if (!session) return Response.json({ error: "Non autorisé" }, { status: 401 });

    const { walletId, manual, forceVisite } = await req.json();
    if (!walletId) return Response.json({ error: "walletId manquant" }, { status: 400 });

    const marchand = await getMarchandById(session.marchand_id);
    if (!marchand) return Response.json({ error: "Marchand introuvable" }, { status: 404 });

    const client = await getClientByWalletId(walletId, session.marchand_id);
    if (!client) return Response.json({ type: "not_found" });

    // Mode flex + choix_en_attente : retourner choix_requis immédiatement, sans consommer derniere_visite_force
    if (marchand.mode_recompense === "flex" && client.choix_en_attente) {
      const mn = marchand as Record<string, unknown>;
      return Response.json({
        type: "choix_requis",
        prenom: client.prenom,
        tampons: client.tampons,
        clientId: client.id,
        walletId: client.wallet_id,
        mode_recompense: "flex",
        palier_intermediaire: mn.palier_intermediaire ?? null,
        nom_recompense_petit: mn.nom_recompense_petit ?? "",
        nom_recompense_grand: mn.nom_recompense_grand ?? "",
        choix_en_attente: true,
        paliers_valides: client.paliers_valides || [],
        total_paliers: 0,
        objectif: (mn.objectif_tampons as number) ?? 10,
      });
    }

    // Vérification derniere_visite_force : barista peut forcer une seule fois par période
    if (forceVisite === true) {
      const clientDoc = await adminDb().collection("clients").doc(client.id).get();
      const dvf = clientDoc.data()?.derniere_visite_force as { seconds: number } | undefined;
      const periodeSecondes = marchand.anti_doublon_delai ?? 86400;
      if (dvf && (Date.now() / 1000 - dvf.seconds) < periodeSecondes) {
        return Response.json({ type: "anti_doublon_limite", prenom: client.prenom, secondes_restantes: Math.ceil(periodeSecondes - (Date.now() / 1000 - dvf.seconds)) });
      }
      await adminDb().collection("clients").doc(client.id).update({ derniere_visite_force: Timestamp.now() });
    }

    const result = await ajouterTampon(client, marchand, forceVisite === true);

    const choixBypass = result.type === "choix_requis" && !!client.choix_en_attente;
    if ((result.type === "ok" || result.type === "recompense" || result.type === "choix_requis") && !choixBypass) {
      const body = JSON.stringify({ walletId: client.wallet_id });
      const opts = { method: "POST", headers: { "Content-Type": "application/json" }, body };
      fetch(`${process.env.NEXT_PUBLIC_APP_URL || "https://app.walliocard.com"}/api/apple-wallet/push-update`, opts).catch(() => {});
      fetch(`${process.env.NEXT_PUBLIC_APP_URL || "https://app.walliocard.com"}/api/google-wallet/push-update`, opts).catch(() => {});

      // Historique (fire-and-forget)
      adminDb().collection("marchands").doc(session.marchand_id).collection("historique").add({
        client_id: client.id,
        client_prenom: client.prenom,
        client_nom: client.nom || "",
        tampons_apres: (result as Record<string,unknown>).tampons ?? client.tampons,
        recompense: result.type === "recompense",
        type: manual ? "manuel_equipe" : "qr_equipe",
        added_by: session.prenom,
        membre_id: session.membre_id,
        created_at: Timestamp.now(),
      }).catch(() => {});

      // Parrainage — récompense parrain si filleul a un parrain non encore récompensé
      checkEtRecompenseParrain(client, session.marchand_id).then(res => {
        if (!res) return;
        const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://app.walliocard.com";
        const b = JSON.stringify({ walletId: res.walletId });
        const opts = { method: "POST", headers: { "Content-Type": "application/json" }, body: b };
        fetch(`${APP_URL}/api/apple-wallet/push-update`, opts).catch(() => {});
        fetch(`${APP_URL}/api/google-wallet/push-update`, opts).catch(() => {});
        fetch(`${APP_URL}/api/notify-parrainage`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ parrainWalletId: res.walletId, filleulPrenom: client.prenom, filleulNom: client.nom, type: "visite", recompense: res.recompense, marchandId: session.marchand_id, marchandNom: marchand.nom }),
        }).catch(() => {});
      }).catch(() => {});

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
      walletId: client.wallet_id,
      telephone: client.telephone,
      prenom: client.prenom,
      objectif: (r.objectif as number | undefined) ?? (mn.objectif_tampons as number),
      prochain_recompense: (r.prochainRecompense as string) || (mn.nom_recompense as string) || "",
      mode_recompense: (mn.mode_recompense as string) || "cyclique",
      paliers_valides: (r.paliers_valides as boolean[] | undefined) ?? client.paliers_valides ?? [],
      total_paliers: ((mn.paliers as unknown[]) || []).length,
      palier_intermediaire: (mn.palier_intermediaire as number | undefined) ?? null,
      nom_recompense_petit: (mn.nom_recompense_petit as string | undefined) ?? "",
      nom_recompense_grand: (mn.nom_recompense_grand as string | undefined) ?? "",
      choix_en_attente: result.type === "choix_requis" ? true : (client.choix_en_attente ?? false),
      choix_fait: client.choix_fait ?? null,
    });
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 });
  }
}
