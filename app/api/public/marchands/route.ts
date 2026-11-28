import { NextResponse } from "next/server";
import { adminDb, initAdmin } from "@/lib/admin";
import { toMarchandPublic } from "@/lib/marchand-public";

// Liste publique des commerçants pour Découvrir (liste + carte).
// Uniquement les commerçants actifs. Filtre optionnel par catégorie (?categorie=cafe).
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const categorie = searchParams.get("categorie");

  initAdmin();
  const snap = await adminDb().collection("marchands").where("actif", "==", true).get();

  const now = new Date();
  // On exclut les commerçants de test (démo) — invisibles pour les vrais clients.
  let marchands = snap.docs
    .filter(d => !(d.data() as Record<string, unknown>).is_test)
    .map(d => toMarchandPublic(d.id, d.data() as Record<string, unknown>, now));
  if (categorie && categorie !== "tous") {
    marchands = marchands.filter(m => m.categorie === categorie);
  }

  return NextResponse.json({ marchands });
}
