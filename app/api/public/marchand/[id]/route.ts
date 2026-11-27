import { NextResponse } from "next/server";
import { adminDb, initAdmin } from "@/lib/admin";
import { toMarchandPublic } from "@/lib/marchand-public";

// API publique d'un commerçant : champs publics uniquement.
// Accepte l'ID du document ou un slug.
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!id) return NextResponse.json({ error: "id requis" }, { status: 400 });

  initAdmin();
  const db = adminDb();

  let doc = await db.collection("marchands").doc(id).get();
  if (!doc.exists) {
    // Essai par slug
    const q = await db.collection("marchands").where("slug", "==", id).limit(1).get();
    if (!q.empty) doc = q.docs[0];
  }
  if (!doc.exists) return NextResponse.json({ error: "Introuvable" }, { status: 404 });

  const m = doc.data() as Record<string, unknown>;
  if (m.actif === false) return NextResponse.json({ error: "Introuvable" }, { status: 404 });

  return NextResponse.json(toMarchandPublic(doc.id, m));
}
