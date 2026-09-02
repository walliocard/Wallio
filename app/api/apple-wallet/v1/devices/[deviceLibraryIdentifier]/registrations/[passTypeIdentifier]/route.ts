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

  let query = db
    .collection("clients")
    .where("apns_device_lib_id", "==", deviceLibraryIdentifier);

  if (passesUpdatedSince) {
    const sinceDate = new Date(Number(passesUpdatedSince) * 1000);
    query = query.where("apns_last_updated", ">=", sinceDate.toISOString()) as typeof query;
  }

  const snap = await query.get();

  if (snap.empty) return new Response(null, { status: 204 });

  const serialNumbers = snap.docs.map((d) => d.data().wallet_id as string);
  const lastUpdated = Math.floor(Date.now() / 1000).toString();

  return NextResponse.json({ serialNumbers, lastUpdated }, { status: 200 });
}
