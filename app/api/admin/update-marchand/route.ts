import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { adminDb } from "@/lib/admin";
import { FieldValue } from "firebase-admin/firestore";

async function checkAdmin() {
  const cookieStore = await cookies();
  return cookieStore.get("wallio_admin")?.value === process.env.ADMIN_PASSWORD;
}

// PATCH — mise à jour champs admin (actif, nfc_id, abonnement_statut)
export async function PATCH(req: Request) {
  if (!await checkAdmin()) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }
  const { marchandId, fields } = await req.json();
  if (!marchandId || typeof fields !== "object") {
    return NextResponse.json({ error: "Paramètres invalides" }, { status: 400 });
  }

  // Whitelist admin : champs que seul l'admin peut modifier
  const adminAllowed = ["actif", "nfc_id", "abonnement_statut"];
  const data: Record<string, unknown> = { updated_at: FieldValue.serverTimestamp() };
  for (const key of adminAllowed) {
    if (key in fields) data[key] = fields[key];
  }

  await adminDb().collection("marchands").doc(marchandId).update(data);
  return NextResponse.json({ ok: true });
}

// DELETE — suppression d'un marchand
export async function DELETE(req: Request) {
  if (!await checkAdmin()) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }
  const { marchandId } = await req.json();
  if (!marchandId) {
    return NextResponse.json({ error: "marchandId requis" }, { status: 400 });
  }
  await adminDb().collection("marchands").doc(marchandId).delete();
  return NextResponse.json({ ok: true });
}
