import { NextResponse } from "next/server";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "wallio.card@gmail.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "";
const SECRET = process.env.CRON_SECRET ?? "secret";

export async function POST(req: Request) {
  const { email, password } = await req.json();

  if (email !== ADMIN_EMAIL || password !== ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Identifiants incorrects." }, { status: 401 });
  }

  const token = Buffer.from(`${email}:${SECRET}`).toString("base64");
  const res = NextResponse.json({ ok: true });
  res.cookies.set("wallio_admin", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });
  return res;
}
