import { adminDb } from "@/lib/admin";

// Format valide : "gerant:{uid}", "membre:{id}:{id}", ou téléphone "+212..."
function isValidIdentifier(id: string): boolean {
  if (id.startsWith("gerant:")) return id.length > 10 && id.length < 80;
  if (id.startsWith("membre:")) return id.length > 14 && id.length < 120;
  if (id.startsWith("+")) return /^\+\d{7,15}$/.test(id);
  return false;
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const identifier = url.searchParams.get("identifier") || url.searchParams.get("telephone");
    if (!identifier || !isValidIdentifier(identifier)) {
      return Response.json({ registered: false });
    }
    const snap = await adminDb().collection("passkeys")
      .where("identifier", "==", identifier)
      .limit(1).get();
    if (!snap.empty) return Response.json({ registered: true });
    // backward compat : anciens docs sans champ identifier
    const snap2 = await adminDb().collection("passkeys")
      .where("telephone", "==", identifier)
      .limit(1).get();
    return Response.json({ registered: !snap2.empty });
  } catch {
    return Response.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
