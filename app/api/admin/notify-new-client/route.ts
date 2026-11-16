import { NextResponse } from "next/server";
import { adminDb, adminMessaging, initAdmin } from "@/lib/admin";

export async function POST(req: Request) {
  try {
    const { prenom, nom, marchandNom } = await req.json() as { prenom?: string; nom?: string; marchandNom?: string };
    if (!prenom) return NextResponse.json({ ok: false });

    initAdmin();
    const snap = await adminDb().collection("config").doc("admin_notif").get();
    const fcmToken = snap.exists ? (snap.data()?.fcm_token as string | undefined) : undefined;
    if (!fcmToken) return NextResponse.json({ ok: false, reason: "no_token" });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://app.walliocard.com";
    const body = `${prenom}${nom ? ` ${nom}` : ""} a rejoint ${marchandNom || "un marchand"}`;
    await adminMessaging().send({
      token: fcmToken,
      webpush: {
        notification: {
          title: "Nouveau client Wallio",
          body,
          icon: `${appUrl}/wallio-instagram-profil.png`,
        },
        data: {
          url: "https://admin.walliocard.com",
        },
        headers: { TTL: "86400" },
        fcmOptions: { link: "https://admin.walliocard.com" },
      },
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[notify-new-client]", err);
    return NextResponse.json({ ok: false });
  }
}
