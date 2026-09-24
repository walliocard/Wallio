import { NextResponse } from "next/server";
import { adminDb } from "@/lib/admin";

// Sert le logo du marchand comme image — nécessaire pour les icônes de notification
// (les data URLs base64 sont rejetées par les navigateurs pour les notifications web)
export async function GET(
  req: Request,
  { params }: { params: Promise<{ marchandId: string }> }
) {
  const { marchandId } = await params;
  const { searchParams } = new URL(req.url);
  const notifMode = searchParams.get("notif") === "1";

  try {
    const snap = await adminDb().collection("marchands").doc(marchandId).get();
    if (!snap.exists) {
      return new Response(null, { status: 404 });
    }

    const data = snap.data()!;
    const logoUrl = data.logo_url as string | undefined;

    if (!logoUrl) {
      return NextResponse.redirect("https://app.walliocard.com/icon-192.png");
    }

    // Mode notif : composite le logo sur la couleur principale → carré plein sans transparence
    if (notifMode) {
      const couleur = (data.couleur_principale as string | undefined) || "#1a1a2e";
      const { createCanvas, loadImage } = await import("@napi-rs/canvas");
      const SIZE = 512;
      const PAD = 64;
      const canvas = createCanvas(SIZE, SIZE);
      const ctx = canvas.getContext("2d");

      ctx.fillStyle = couleur;
      ctx.fillRect(0, 0, SIZE, SIZE);

      try {
        // loadImage accepte URL string ou Buffer
        const logoSrc = logoUrl.startsWith("data:")
          ? Buffer.from(logoUrl.split(",")[1], "base64")
          : logoUrl;
        const img = await loadImage(logoSrc as Parameters<typeof loadImage>[0]);
        const scale = Math.min((SIZE - PAD * 2) / img.width, (SIZE - PAD * 2) / img.height);
        const w = img.width * scale;
        const h = img.height * scale;
        ctx.drawImage(img, (SIZE - w) / 2, (SIZE - h) / 2, w, h);
      } catch {
        // Logo illisible → retourne fond uni
      }

      const png = new Uint8Array(await canvas.encode("png"));
      return new Response(png, {
        headers: {
          "Content-Type": "image/png",
          "Cache-Control": "public, max-age=3600",
        },
      });
    }

    // Mode normal : retourne le logo brut
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

    return NextResponse.redirect(logoUrl);
  } catch {
    return new Response(null, { status: 500 });
  }
}
