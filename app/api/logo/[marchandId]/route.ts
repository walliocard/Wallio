import { NextResponse } from "next/server";
import { adminDb } from "@/lib/admin";
import { createCanvas, loadImage } from "@napi-rs/canvas";

const SIZE = 192;

// Redimensionne le logo en 192×192 mode cover (remplit tout l'espace, pas de fond système ajouté)
async function logoCarré(src: string): Promise<Buffer> {
  let buffer: Buffer;
  if (src.startsWith("data:")) {
    const [, b64] = src.split(",");
    buffer = Buffer.from(b64, "base64");
  } else {
    const res = await fetch(src);
    buffer = Buffer.from(await res.arrayBuffer());
  }
  const img = await loadImage(buffer);
  const canvas = createCanvas(SIZE, SIZE);
  const ctx = canvas.getContext("2d");
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

    const logoUrl = snap.data()?.logo_url as string | undefined;
    if (!logoUrl) {
      return NextResponse.redirect("https://app.walliocard.com/icon-192.png");
    }

    const png = await logoCarré(logoUrl);
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
