import { NextResponse } from "next/server";
import { adminDb, initAdmin } from "@/lib/admin";

// Sert la bannière hero Google Wallet du marchand comme image publique HTTPS.
// Nécessaire car Google ne peut pas fetcher des data URLs base64 depuis Firestore.
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ marchandId: string }> }
) {
  const { marchandId } = await params;

  try {
    initAdmin();
    const snap = await adminDb().collection("marchands").doc(marchandId).get();
    if (!snap.exists) return new Response(null, { status: 404 });

    const data = snap.data()!;
    const heroUrl = (data.google_hero_url as string | undefined) || (data.strip_url as string | undefined);

    if (!heroUrl) return new Response(null, { status: 404 });

    // Base64 data URL → decode et sert comme image
    if (heroUrl.startsWith("data:")) {
      const [meta, base64] = heroUrl.split(",");
      const mimeMatch = meta.match(/data:([^;]+)/);
      const mime = mimeMatch?.[1] || "image/jpeg";
      const buffer = Buffer.from(base64, "base64");
      return new Response(buffer, {
        headers: {
          "Content-Type": mime,
          "Cache-Control": "public, max-age=3600",
        },
      });
    }

    // URL externe → redirect
    return NextResponse.redirect(heroUrl);
  } catch {
    return new Response(null, { status: 500 });
  }
}
