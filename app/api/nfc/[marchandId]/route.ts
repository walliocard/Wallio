import { NextResponse } from "next/server";
import { adminDb, initAdmin } from "@/lib/admin";

// Retourne les infos du marchand par nfc_id — côté serveur, Firestore Admin déjà chaud
export async function GET(_: Request, { params }: { params: Promise<{ marchandId: string }> }) {
  const { marchandId } = await params;
  initAdmin();
  const snap = await adminDb().collection("marchands")
    .where("nfc_id", "==", marchandId)
    .limit(1)
    .get();
  if (snap.empty) return NextResponse.json(null, { status: 404 });
  const d = snap.docs[0];
  const data = d.data();
  if (!data.actif) return NextResponse.json(null, { status: 403 });
  // Ne retourner que les champs nécessaires côté client
  return NextResponse.json({
    id: d.id,
    nom: data.nom,
    actif: data.actif,
    objectif_tampons: data.objectif_tampons,
    nom_recompense: data.nom_recompense,
    icone_tampons: data.icone_tampons,
    couleur_principale: data.couleur_principale,
    couleur_secondaire: data.couleur_secondaire,
    anti_doublon_delai: data.anti_doublon_delai,
    logo_url: data.logo_url,
    strip_url: data.strip_url,
    nfc_id: data.nfc_id,
    notif_actif: data.notif_actif,
    double_tampons_fin: data.double_tampons_fin ?? null,
    // Champs wallet
    apple_bg_color: data.apple_bg_color,
    apple_fg_color: data.apple_fg_color,
    apple_label_color: data.apple_label_color,
    google_bg_color: data.google_bg_color,
  }, {
    headers: { "Cache-Control": "no-store" },
  });
}
