import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.error("[native-error]", JSON.stringify(body));
  } catch {}
  return NextResponse.json({ ok: true });
}
