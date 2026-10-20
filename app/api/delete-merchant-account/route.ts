import { NextResponse } from "next/server";
import { adminDb, adminAuth, initAdmin } from "@/lib/admin";

// DELETE /api/delete-merchant-account
// Header: Authorization: Bearer <idToken>
// Supprime le compte marchand : document Firestore + subcollections + Firebase Auth user
export async function DELETE(req: Request) {
  const authHeader = req.headers.get("Authorization");
  const idToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!idToken) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  initAdmin();
  const auth = adminAuth();
  const db = adminDb();

  let uid: string;
  try {
    const decoded = await auth.verifyIdToken(idToken);
    uid = decoded.uid;
  } catch {
    return NextResponse.json({ error: "Token invalide" }, { status: 401 });
  }

  // Supprimer subcollection membres
  const membresSnap = await db.collection("marchands").doc(uid).collection("membres").get();
  if (!membresSnap.empty) {
    const batch = db.batch();
    membresSnap.docs.forEach(d => batch.delete(d.ref));
    await batch.commit();
  }

  // Supprimer document marchand
  await db.collection("marchands").doc(uid).delete();

  // Supprimer passkeys liées au compte
  try {
    const userRecord = await auth.getUser(uid);
    const email = userRecord.email;
    if (email) {
      const passkeysSnap = await db.collection("passkeys").where("telephone", "==", email).get();
      if (!passkeysSnap.empty) {
        const batch = db.batch();
        passkeysSnap.docs.forEach(d => batch.delete(d.ref));
        await batch.commit();
      }
    }
  } catch { /* non bloquant */ }

  // Supprimer le compte Firebase Auth
  await auth.deleteUser(uid);

  return NextResponse.json({ ok: true });
}
