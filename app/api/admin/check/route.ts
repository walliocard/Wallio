import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "wallio.card@gmail.com";
const SECRET = process.env.CRON_SECRET ?? "secret";

export async function GET() {
  const store = await cookies();
  const token = store.get("wallio_admin")?.value;
  const expected = Buffer.from(`${ADMIN_EMAIL}:${SECRET}`).toString("base64");
  if (token !== expected) return NextResponse.json({ ok: false }, { status: 401 });
  return NextResponse.json({ ok: true });
}
