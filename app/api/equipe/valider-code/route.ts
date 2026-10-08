import { adminDb } from "@/lib/admin";

export async function POST(req: Request) {
  try {
    const { code } = await req.json();
    if (!code || code.length !== 6) return Response.json({ error: "Code invalide" }, { status: 400 });

    const snap = await adminDb().collection("marchands")
      .where("code_etablissement", "==", code.toUpperCase())
      .where("equipe_actif", "==", true)
      .where("actif", "==", true)
      .limit(1)
      .get();

    if (snap.empty) return Response.json({ error: "Code introuvable ou équipe désactivée" }, { status: 404 });

    const marchandDoc = snap.docs[0];
    const marchand = marchandDoc.data();

    const membresSnap = await adminDb()
      .collection("marchands").doc(marchandDoc.id)
      .collection("membres")
      .where("statut", "==", "actif")
      .get();

    const membres = membresSnap.docs.map(d => ({ id: d.id, prenom: d.data().prenom as string }));

    return Response.json({
      marchandId: marchandDoc.id,
      marchandNom: marchand.nom,
      membres,
    });
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 });
  }
}
