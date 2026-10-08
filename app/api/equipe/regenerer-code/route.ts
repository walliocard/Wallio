import { adminDb, adminAuth } from "@/lib/admin";
import { genererCodeEtablissement } from "@/lib/equipe";

export async function POST(req: Request) {
  try {
    const auth = req.headers.get("Authorization");
    if (!auth?.startsWith("Bearer ")) return Response.json({ error: "Non autorisé" }, { status: 401 });
    const decoded = await adminAuth().verifyIdToken(auth.slice(7));

    const code = genererCodeEtablissement();
    await adminDb().collection("marchands").doc(decoded.uid).update({ code_etablissement: code });
    return Response.json({ code });
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 });
  }
}
