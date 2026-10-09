import { verifyAuthenticationResponse } from "@simplewebauthn/server";
import { adminDb, adminAuth } from "@/lib/admin";
import { creerSession } from "@/lib/equipe";
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

    const identifier: string = passkeyData.identifier || passkeyData.telephone;

    // Gérant : custom token Firebase
    if (identifier?.startsWith("gerant:")) {
      const uid = identifier.replace("gerant:", "");
      const customToken = await adminAuth().createCustomToken(uid);
      return Response.json({ identifier, customToken });
    }

    // Membre équipe : créer la session directement
    if (identifier?.startsWith("membre:")) {
      const parts = identifier.split(":");
      const marchandId = parts[1];
      const membreId = parts[2];

      const membreDoc = await db.collection("marchands").doc(marchandId).collection("membres").doc(membreId).get();
      if (!membreDoc.exists) return Response.json({ error: "Membre introuvable" }, { status: 404 });
      const membre = membreDoc.data()!;
      if (membre.statut !== "actif") return Response.json({ error: "Compte désactivé" }, { status: 403 });

      const marchandDoc = await db.collection("marchands").doc(marchandId).get();
      const marchand = marchandDoc.data()!;
      const permissions = { notifs: false, clients: true };
      const token = await creerSession(marchandId, membreId, membre.prenom, permissions);

      return Response.json({
        identifier,
        type: "membre",
        token,
        prenom: membre.prenom,
        marchandId,
        marchandNom: marchand.nom,
        logo_url: marchand.logo_url || null,
        permissions,
      });
    }

    // Client NFC (backward compat)
    return Response.json({ identifier, telephone: passkeyData.telephone });
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 });
  }
}
