import { NextResponse } from "next/server";
import { adminDb } from "@/lib/admin";
import { createCanvas, loadImage } from "@napi-rs/canvas";

const SIZE = 192;

// Composite le logo sur un fond coloré 192×192.
// Sans fond explicite, iOS (mode sombre) ajoute son propre fond derrière les zones transparentes.
async function buildIcon(logoSrc: string, bgColor: string): Promise<Buffer> {
  let buffer: Buffer;
  if (logoSrc.startsWith("data:")) {
    const [, b64] = logoSrc.split(",");
    buffer = Buffer.from(b64, "base64");
  } else {
    const res = await fetch(logoSrc);
    buffer = Buffer.from(await res.arrayBuffer());
  }

  const img = await loadImage(buffer);
  const canvas = createCanvas(SIZE, SIZE);
  const ctx = canvas.getContext("2d");

  // Fond uni avec la couleur de la carte du marchand
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, SIZE, SIZE);

  // Logo en cover : remplit tout l'espace, centre l'image
  const scale = Math.max(SIZE / img.width, SIZE / img.height);
  const w = img.width * scale;
  const h = img.height * scale;
  ctx.drawImage(img, (SIZE - w) / 2, (SIZE - h) / 2, w, h);

  return canvas.toBuffer("image/png");
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ marchandId: string }> }
) {
  const { marchandId } = await params;

  try {
    const snap = await adminDb().collection("marchands").doc(marchandId).get();
    if (!snap.exists) return new Response(null, { status: 404 });

    const data = snap.data()!;
    const logoUrl = data.logo_url as string | undefined;
    if (!logoUrl) {
      return NextResponse.redirect("https://app.walliocard.com/icon-192.png");
    }

    // Fond = couleur de fond de la carte Apple Wallet, puis couleur principale, puis blanc
    const bgColor = (data.apple_bg_color as string | undefined)
      || (data.couleur_principale as string | undefined)
      || "#FFFFFF";

    const png = await buildIcon(logoUrl, bgColor);
    return new Response(png, {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch {
    return NextResponse.redirect("https://app.walliocard.com/icon-192.png");
  }
}
