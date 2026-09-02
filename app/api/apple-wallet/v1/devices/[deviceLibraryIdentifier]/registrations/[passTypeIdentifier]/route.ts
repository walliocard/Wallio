import { NextResponse } from "next/server";
import { adminDb } from "@/lib/admin";

// GET : Apple demande la liste des serialNumbers mis à jour depuis une date
export async function GET(
  req: Request,
  { params }: { params: Promise<{ deviceLibraryIdentifier: string; passTypeIdentifier: string }> }
) {
  const { deviceLibraryIdentifier } = await params;
  const url = new URL(req.url);
  const passesUpdatedSince = url.searchParams.get("passesUpdatedSince");

  const db = adminDb();

  // Filtre sur apns_device_lib_id seul (pas d'index composite nécessaire)
  // Le filtre temporel se fait côté JS pour éviter FAILED_PRECONDITION Firestore
  const snap = await db
    .collection("clients")
    .where("apns_device_lib_id", "==", deviceLibraryIdentifier)
    .get();

  if (snap.empty) return new Response(null, { status: 204 });

  const sinceMs = passesUpdatedSince ? Number(passesUpdatedSince) * 1000 : 0;
  const docs = sinceMs
    ? snap.docs.filter(d => {
        const updated = d.data().apns_last_updated;
        return updated && new Date(updated).getTime() >= sinceMs;
      })
    : snap.docs;

  if (docs.length === 0) return new Response(null, { status: 204 });

  const serialNumbers = docs.map((d) => d.data().wallet_id as string);
  const lastUpdated = Math.floor(Date.now() / 1000).toString();

  return NextResponse.json({ serialNumbers, lastUpdated }, { status: 200 });
}
