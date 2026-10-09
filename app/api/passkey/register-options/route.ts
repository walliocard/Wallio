import { generateRegistrationOptions } from "@simplewebauthn/server";
import { adminDb } from "@/lib/admin";
import { randomUUID } from "crypto";
import { Timestamp } from "firebase-admin/firestore";

const RP_ID = process.env.PASSKEY_RP_ID || "walliocard.com";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const identifier: string = body.identifier || body.telephone;
    if (!identifier) return Response.json({ error: "identifier requis" }, { status: 400 });

    const options = await generateRegistrationOptions({
      rpName: "Wallio",
      rpID: RP_ID,
      userID: new TextEncoder().encode(identifier),
      userName: identifier,
      attestationType: "none",
      authenticatorSelection: {
        residentKey: "preferred",
        userVerification: "preferred",
        authenticatorAttachment: "platform",
      },
    });

    const sessionId = randomUUID();
    await adminDb().collection("passkey_challenges").doc(sessionId).set({
      challenge: options.challenge,
      identifier,
      // backward compat pour les clients NFC existants
      telephone: body.telephone || null,
      type: "register",
      expires_at: Timestamp.fromDate(new Date(Date.now() + 5 * 60 * 1000)),
    });

    return Response.json({ sessionId, options });
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 });
  }
}
