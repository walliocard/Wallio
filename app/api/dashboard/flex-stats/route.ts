import { adminAuth, adminDb } from "@/lib/admin";

export async function GET(req: Request) {
  try {
    const token = req.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) return Response.json({ error: "Non autorisé" }, { status: 401 });
    const decoded = await adminAuth().verifyIdToken(token);
    const marchandId = decoded.uid;

    const snap = await adminDb()
      .collection("marchands").doc(marchandId)
      .collection("historique")
      .where("choix", "in", ["petit", "grand"])
      .get();

    let petit = 0, grand = 0;
    snap.docs.forEach(d => {
      if (d.data().choix === "petit") petit++;
      else grand++;
    });

    return Response.json({ petit, grand, total: petit + grand });
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 });
  }
}
