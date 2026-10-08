import { adminDb } from "@/lib/admin";
import { creerSession } from "@/lib/equipe";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const { marchandId, membreId, pin } = await req.json();
    if (!marchandId || !membreId || !pin) return Response.json({ error: "Données manquantes" }, { status: 400 });

    const db = adminDb();
    const membreDoc = await db.collection("marchands").doc(marchandId).collection("membres").doc(membreId).get();
    if (!membreDoc.exists) return Response.json({ error: "Membre introuvable" }, { status: 404 });

    const membre = membreDoc.data()!;
    if (membre.statut !== "actif") return Response.json({ error: "Compte désactivé" }, { status: 403 });

    const pinOk = await bcrypt.compare(String(pin), membre.pin_hash);
    if (!pinOk) return Response.json({ error: "PIN incorrect" }, { status: 401 });

    const marchandDoc = await db.collection("marchands").doc(marchandId).get();
    const marchand = marchandDoc.data()!;
    // Scanner + Clients toujours actifs — notifs retirées
    const permissions = { notifs: false, clients: true };

    const token = await creerSession(marchandId, membreId, membre.prenom, permissions);

    return Response.json({
      token,
      prenom: membre.prenom,
      marchandId,
      marchandNom: marchand.nom,
      logo_url: marchand.logo_url || null,
      permissions,
    });
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 });
  }
}
