import { adminDb, adminAuth } from "@/lib/admin";

export async function GET(req: Request) {
  try {
    const auth = req.headers.get("Authorization");
    if (!auth?.startsWith("Bearer ")) return Response.json({ error: "Non autorisé" }, { status: 401 });
    const decoded = await adminAuth().verifyIdToken(auth.slice(7));

    const snap = await adminDb()
      .collection("marchands").doc(decoded.uid)
      .collection("historique")
      .orderBy("created_at", "desc")
      .limit(200)
      .get();

    const entries = snap.docs.map(d => {
      const data = d.data();
      return {
        id: d.id,
        client_prenom: data.client_prenom,
        client_nom: data.client_nom,
        tampons_apres: data.tampons_apres,
        recompense: data.recompense || false,
        type: data.type,
        added_by: data.added_by,
        created_at: data.created_at?.toDate?.()?.toISOString() || null,
      };
    });

    return Response.json({ entries });
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 });
  }
}
