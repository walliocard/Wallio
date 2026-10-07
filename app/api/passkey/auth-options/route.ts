import { generateAuthenticationOptions } from "@simplewebauthn/server";
import { adminDb } from "@/lib/admin";
import { randomUUID } from "crypto";
import { Timestamp } from "firebase-admin/firestore";

const RP_ID = process.env.PASSKEY_RP_ID || "walliocard.com";

export async function POST() {
  try {
    const options = await generateAuthenticationOptions({
      rpID: RP_ID,
      allowCredentials: [],
      userVerification: "preferred",
    });

    const sessionId = randomUUID();
    await adminDb().collection("passkey_challenges").doc(sessionId).set({
      challenge: options.challenge,
      type: "auth",
      expires_at: Timestamp.fromDate(new Date(Date.now() + 5 * 60 * 1000)),
    });

    return Response.json({ sessionId, options });
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 });
  }
}
