import { NextResponse } from "next/server";
import { adminDb } from "@/lib/admin";

type RouteParams = Promise<{
  deviceLibraryIdentifier: string;
  passTypeIdentifier: string;
  serialNumber: string;
}>;

// POST : Apple Wallet enregistre un appareil pour recevoir les mises à jour du pass
export async function POST(req: Request, { params }: { params: RouteParams }) {
  const { deviceLibraryIdentifier, serialNumber } = await params;

  const authHeader = req.headers.get("Authorization") ?? "";
  const authToken = authHeader.replace("ApplePass ", "").trim();

  const db = adminDb();

  const snap = await db
    .collection("clients")
    .where("wallet_id", "==", serialNumber)
    .where("apns_auth_token", "==", authToken)
    .limit(1)
    .get();

  if (snap.empty) {
    console.error("[register] 401 — wallet_id:", serialNumber, "authToken:", authToken.slice(0, 8) + "...");
    return new Response(null, { status: 401 });
  }

  const { pushToken } = await req.json().catch(() => ({})) as { pushToken?: string };
  if (!pushToken) {
    console.error("[register] 400 — pas de pushToken dans le body");
    return new Response(null, { status: 400 });
  }

  await snap.docs[0].ref.update({
    apns_push_token: pushToken,
    apns_device_lib_id: deviceLibraryIdentifier,
    apns_registered_at: new Date().toISOString(),
  });

  console.log("[register] 201 OK — wallet_id:", serialNumber, "pushToken:", pushToken.slice(0, 8) + "...");
  return new Response(null, { status: 201 });
}

// DELETE : Apple Wallet supprime l'enregistrement (pass retiré du wallet)
export async function DELETE(req: Request, { params }: { params: RouteParams }) {
  const { deviceLibraryIdentifier, serialNumber } = await params;

  const authHeader = req.headers.get("Authorization") ?? "";
  const authToken = authHeader.replace("ApplePass ", "").trim();

  const db = adminDb();

  const snap = await db
    .collection("clients")
    .where("wallet_id", "==", serialNumber)
    .where("apns_auth_token", "==", authToken)
    .where("apns_device_lib_id", "==", deviceLibraryIdentifier)
    .limit(1)
    .get();

  if (snap.empty) return new Response(null, { status: 401 });

  await snap.docs[0].ref.update({
    apns_push_token: null,
    apns_device_lib_id: null,
  });

  return new Response(null, { status: 200 });
}
