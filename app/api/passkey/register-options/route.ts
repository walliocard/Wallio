import { generateRegistrationOptions } from "@simplewebauthn/server";
import { adminDb } from "@/lib/admin";
import { randomUUID } from "crypto";
import { Timestamp } from "firebase-admin/firestore";

const RP_ID = process.env.PASSKEY_RP_ID || "walliocard.com";

export async function POST(req: Request) {
  try {
    const { telephone } = await req.json();
    if (!telephone) return Response.json({ error: "telephone requis" }, { status: 400 });

    const options = await generateRegistrationOptions({
      rpName: "Wallio",
      rpID: RP_ID,
      userID: new TextEncoder().encode(telephone),
      userName: telephone,
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
      telephone,
      type: "register",
      expires_at: Timestamp.fromDate(new Date(Date.now() + 5 * 60 * 1000)),
    });

    return Response.json({ sessionId, options });
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 });
  }
}
