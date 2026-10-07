import { verifyRegistrationResponse } from "@simplewebauthn/server";
import { adminDb } from "@/lib/admin";
import { Timestamp } from "firebase-admin/firestore";

const RP_ID = process.env.PASSKEY_RP_ID || "walliocard.com";
const ORIGINS = (process.env.PASSKEY_ORIGINS || "https://app.walliocard.com,https://eu.walliocard.com").split(",");

export async function POST(req: Request) {
  try {
    const { sessionId, response } = await req.json();

    const db = adminDb();
    const challengeDoc = await db.collection("passkey_challenges").doc(sessionId).get();
    if (!challengeDoc.exists) return Response.json({ error: "Session invalide" }, { status: 400 });

    const data = challengeDoc.data()!;
    if (data.type !== "register") return Response.json({ error: "Type invalide" }, { status: 400 });
    if ((data.expires_at as Timestamp).toDate() < new Date()) {
      await challengeDoc.ref.delete();
      return Response.json({ error: "Session expirée" }, { status: 400 });
    }

    const verification = await verifyRegistrationResponse({
      response,
      expectedChallenge: data.challenge,
      expectedOrigin: ORIGINS,
      expectedRPID: RP_ID,
    });

    await challengeDoc.ref.delete();

    if (!verification.verified || !verification.registrationInfo) {
      return Response.json({ error: "Vérification échouée" }, { status: 400 });
    }

    const { credential } = verification.registrationInfo;

    await db.collection("passkeys").doc(credential.id).set({
      wallet_id: data.wallet_id,
      public_key: Buffer.from(credential.publicKey).toString("base64"),
      counter: credential.counter,
      created_at: Timestamp.now(),
    });

    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 });
  }
}
