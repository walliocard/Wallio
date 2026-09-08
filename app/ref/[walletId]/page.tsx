import { redirect } from "next/navigation";
import { adminDb, initAdmin } from "@/lib/admin";

export default async function RefPage({ params }: { params: Promise<{ walletId: string }> }) {
  const { walletId } = await params;
  initAdmin();

  try {
    // Trouver le client par wallet_id → récupérer son marchand_id → récupérer nfc_id
    const clientSnap = await adminDb()
      .collection("clients")
      .where("wallet_id", "==", walletId)
      .limit(1)
      .get();

    if (!clientSnap.empty) {
      const marchandId = clientSnap.docs[0].data().marchand_id as string;
      const marchandSnap = await adminDb().collection("marchands").doc(marchandId).get();
      const nfcId = marchandSnap.data()?.nfc_id as string | undefined;
      const parrainageActif = marchandSnap.data()?.parrainage_actif as boolean | undefined;

      if (nfcId && parrainageActif) {
        redirect(`/nfc/${nfcId}?ref=${walletId}`);
      }
      if (nfcId) {
        redirect(`/nfc/${nfcId}`);
      }
    }
  } catch { /* silent */ }

  redirect("/");
}
