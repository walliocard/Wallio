import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { initAdmin, adminDb } from "@/lib/admin";
import { getAuth } from "firebase-admin/auth";
import { FieldValue } from "firebase-admin/firestore";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "wallio.card@gmail.com";
const SECRET      = process.env.CRON_SECRET  ?? "secret";

function slugify(str: string) {
  return str.toLowerCase()
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function genNfcId(nom: string) {
  const base = slugify(nom) || "marchand";
  const rand  = Math.random().toString(36).substring(2, 7);
  return `${base}-${rand}`;
}

export async function POST(req: NextRequest) {
  // Auth check
  const store    = await cookies();
  const token    = store.get("wallio_admin")?.value;
  const expected = Buffer.from(`${ADMIN_EMAIL}:${SECRET}`).toString("base64");
  if (token !== expected) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { nom, email, password } = await req.json();
  if (!nom || !email || !password) return NextResponse.json({ error: "Champs manquants" }, { status: 400 });

  try {
    initAdmin();
    const auth = getAuth();
    const db   = adminDb();

    // Créer le compte Firebase Auth
    const user = await auth.createUser({ email, password, displayName: nom });

    // Créer le document Firestore
    const nfc_id = genNfcId(nom);
    await db.collection("marchands").doc(user.uid).set({
      nom,
      email,
      actif: true,
      nfc_id,
      abonnement_statut: "en_attente",
      date_inscription: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ uid: user.uid, nfc_id });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Erreur inconnue";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
