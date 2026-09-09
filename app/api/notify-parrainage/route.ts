import { NextResponse } from "next/server";
import { adminDb, adminMessaging, initAdmin } from "@/lib/admin";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://app.walliocard.com";

// POST /api/notify-parrainage
// Body: { parrainWalletId: string; filleulPrenom: string; filleulNom: string }
// Envoie une notif FCM spécifique au parrain quand quelqu'un utilise son lien
export async function POST(req: Request) {
  try {
    const { parrainWalletId, filleulPrenom, filleulNom } = await req.json() as {
      parrainWalletId?: string;
      filleulPrenom?: string;
      filleulNom?: string;
    };

    if (!parrainWalletId) {
      return NextResponse.json({ error: "parrainWalletId requis" }, { status: 400 });
    }

    initAdmin();
    const db = adminDb();

    const snap = await db
      .collection("clients")
      .where("wallet_id", "==", parrainWalletId)
      .limit(1)
      .get();

    if (snap.empty) return NextResponse.json({ ok: false, reason: "parrain_not_found" });

    const parrain = snap.docs[0].data();
    const fcmToken: string | undefined = parrain.fcm_token;

    if (!fcmToken) return NextResponse.json({ ok: false, reason: "no_fcm_token" });

    const prenom = filleulPrenom?.trim() || "Quelqu'un";
    const nom    = filleulNom?.trim()    || "";
    const nomComplet = [prenom, nom].filter(Boolean).join(" ");

    const messaging = adminMessaging();
    try {
      await messaging.send({
        token: fcmToken,
        data: {
          title: "! Parrainage réussi",
          body: `${nomComplet} a rejoint grâce à votre lien — vous recevez 1 tampon bonus !`,
          link: `${APP_URL}/mes-cartes`,
        },
        webpush: {
          fcmOptions: { link: `${APP_URL}/mes-cartes` },
          notification: {
            title: "! Parrainage réussi",
            body: `${nomComplet} a rejoint grâce à votre lien — vous recevez 1 tampon bonus !`,
            icon: `${APP_URL}/icon-192.png`,
          },
        },
      });
      return NextResponse.json({ ok: true });
    } catch (err: unknown) {
      const code = (err as { errorInfo?: { code?: string } })?.errorInfo?.code ?? "";
      if (
        code === "messaging/registration-token-not-registered" ||
        code === "messaging/invalid-registration-token"
      ) {
        await snap.docs[0].ref.update({ fcm_token: null });
      }
      return NextResponse.json({ ok: false, reason: "fcm_error" });
    }
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
