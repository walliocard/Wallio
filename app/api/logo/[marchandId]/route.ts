import { NextResponse } from "next/server";
import { adminDb } from "@/lib/admin";

// Sert le logo du marchand comme image — nécessaire pour les icônes de notification
// (les data URLs base64 sont rejetées par les navigateurs pour les notifications web)
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ marchandId: string }> }
) {
  const { marchandId } = await params;

  try {
    const snap = await adminDb().collection("marchands").doc(marchandId).get();
    if (!snap.exists) {
      return new Response(null, { status: 404 });
    }

    const logoUrl = snap.data()?.logo_url as string | undefined;
    if (!logoUrl) {
      return new Response(null, { status: 404 });
    }

    // Logo stocké en base64 data URL
    if (logoUrl.startsWith("data:")) {
      const [meta, base64] = logoUrl.split(",");
      const mimeMatch = meta.match(/data:([^;]+)/);
      const mime = mimeMatch?.[1] || "image/png";
      const buffer = Buffer.from(base64, "base64");
      return new Response(buffer, {
        headers: {
          "Content-Type": mime,
          "Cache-Control": "public, max-age=3600",
        },
      });
    }

    // Logo stocké comme URL externe → redirect
    return NextResponse.redirect(logoUrl);
  } catch {
    return new Response(null, { status: 500 });
  }
}
