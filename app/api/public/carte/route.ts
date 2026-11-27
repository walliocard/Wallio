import { NextResponse } from "next/server";
import { adminDb, initAdmin } from "@/lib/admin";

// Données privées de LA carte d'un client (vérifié par son walletId).
// Retourne : derniers événements d'historique de ce client + nombre de parrainages réussis.
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const walletId = searchParams.get("walletId");
  if (!walletId) return NextResponse.json({ error: "walletId requis" }, { status: 400 });

  initAdmin();
  const db = adminDb();

  const snap = await db.collection("clients").where("wallet_id", "==", walletId).limit(1).get();
  if (snap.empty) return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  const clientDoc = snap.docs[0];
  const client = clientDoc.data();
  const marchandId = client.marchand_id as string;

  // Derniers événements d'historique de CE client
  const histSnap = await db.collection("marchands").doc(marchandId).collection("historique")
    .where("client_id", "==", clientDoc.id)
    .orderBy("created_at", "desc").limit(10).get();
  const events = histSnap.docs.map(d => {
    const e = d.data();
    const ts = e.created_at as { seconds?: number; _seconds?: number } | undefined;
    return {
      type: e.type as string,
      recompense: !!e.recompense,
      tampons_apres: e.tampons_apres ?? null,
      added_by: (e.added_by as string) ?? null,
      at: ts?.seconds ?? ts?._seconds ?? null,
    };
  });

  // Parrainages réussis (filleuls créés avec ce walletId et déjà récompensés)
  let parrainagesReussis = 0;
  try {
    const refSnap = await db.collection("clients")
      .where("parrain_id", "==", walletId)
      .where("parrain_recompense", "==", true).get();
    parrainagesReussis = refSnap.size;
  } catch { parrainagesReussis = 0; }

  return NextResponse.json({ events, parrainagesReussis });
}
