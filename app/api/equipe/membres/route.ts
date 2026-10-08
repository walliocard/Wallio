import { adminDb } from "@/lib/admin";
import { adminAuth } from "@/lib/admin";
import bcrypt from "bcryptjs";
import { Timestamp } from "firebase-admin/firestore";
import { randomUUID } from "crypto";

async function getPatronId(req: Request): Promise<string | null> {
  const auth = req.headers.get("Authorization");
  if (!auth?.startsWith("Bearer ")) return null;
  try {
    const decoded = await adminAuth().verifyIdToken(auth.slice(7));
    return decoded.uid;
  } catch {
    return null;
  }
}

export async function GET(req: Request) {
  try {
    const patronId = await getPatronId(req);
    if (!patronId) return Response.json({ error: "Non autorisé" }, { status: 401 });

    const snap = await adminDb().collection("marchands").doc(patronId).collection("membres").orderBy("prenom").get();
    const membres = snap.docs.map(d => ({
      id: d.id,
      prenom: d.data().prenom,
      statut: d.data().statut,
      date_activation: d.data().date_activation?.toDate?.()?.toISOString() || null,
    }));
    return Response.json({ membres });
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const patronId = await getPatronId(req);
    if (!patronId) return Response.json({ error: "Non autorisé" }, { status: 401 });

    const { prenom, pin } = await req.json();
    if (!prenom || !pin || String(pin).length !== 4) return Response.json({ error: "Prénom et PIN 4 chiffres requis" }, { status: 400 });

    const pin_hash = await bcrypt.hash(String(pin), 10);
    const membreId = randomUUID();

    await adminDb().collection("marchands").doc(patronId).collection("membres").doc(membreId).set({
      prenom: prenom.trim(),
      pin_hash,
      statut: "actif",
      date_activation: Timestamp.now(),
    });

    return Response.json({ ok: true, membreId });
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const patronId = await getPatronId(req);
    if (!patronId) return Response.json({ error: "Non autorisé" }, { status: 401 });

    const { membreId, action, pin } = await req.json();
    if (!membreId || !action) return Response.json({ error: "Données manquantes" }, { status: 400 });

    const ref = adminDb().collection("marchands").doc(patronId).collection("membres").doc(membreId);

    if (action === "reset_pin") {
      if (!pin || String(pin).length !== 4) return Response.json({ error: "PIN 4 chiffres requis" }, { status: 400 });
      const pin_hash = await bcrypt.hash(String(pin), 10);
      await ref.update({ pin_hash });
    } else if (action === "desactiver") {
      await ref.update({ statut: "desactive" });
    } else if (action === "activer") {
      await ref.update({ statut: "actif" });
    } else {
      return Response.json({ error: "Action inconnue" }, { status: 400 });
    }

    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const patronId = await getPatronId(req);
    if (!patronId) return Response.json({ error: "Non autorisé" }, { status: 401 });

    const { membreId } = await req.json();
    if (!membreId) return Response.json({ error: "membreId manquant" }, { status: 400 });

    await adminDb().collection("marchands").doc(patronId).collection("membres").doc(membreId).delete();
    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 });
  }
}
