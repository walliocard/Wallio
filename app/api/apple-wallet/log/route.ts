import { NextResponse } from "next/server";

// POST : Apple Wallet envoie des logs d'erreur ici
export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.error("[Apple Wallet logs]", JSON.stringify(body));
  } catch {
    // corps invalide — ignorer
  }
  return NextResponse.json({}, { status: 200 });
}
