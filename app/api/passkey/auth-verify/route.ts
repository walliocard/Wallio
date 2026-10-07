import { verifyAuthenticationResponse } from "@simplewebauthn/server";
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
    if (data.type !== "auth") return Response.json({ error: "Type invalide" }, { status: 400 });
    if ((data.expires_at as Timestamp).toDate() < new Date()) {
      await challengeDoc.ref.delete();
      return Response.json({ error: "Session expirée" }, { status: 400 });
    }

    const credentialId = response.id as string;
    const passkeyDoc = await db.collection("passkeys").doc(credentialId).get();
    if (!passkeyDoc.exists) return Response.json({ error: "Passkey inconnue" }, { status: 404 });

    const passkeyData = passkeyDoc.data()!;

    const verification = await verifyAuthenticationResponse({
      response,
      expectedChallenge: data.challenge,
      expectedOrigin: ORIGINS,
      expectedRPID: RP_ID,
      credential: {
        id: credentialId,
        publicKey: new Uint8Array(Buffer.from(passkeyData.public_key, "base64")),
        counter: passkeyData.counter,
      },
    });

    await challengeDoc.ref.delete();

    if (!verification.verified) {
      return Response.json({ error: "Vérification échouée" }, { status: 400 });
    }

    await passkeyDoc.ref.update({ counter: verification.authenticationInfo.newCounter });

    return Response.json({ wallet_id: passkeyData.wallet_id });
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 });
  }
}
