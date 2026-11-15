import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { adminDb, initAdmin } from "@/lib/admin";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "wallio.card@gmail.com";
const SECRET = process.env.ADMIN_SECRET ?? process.env.CRON_SECRET ?? "";

export async function POST(req: Request) {
  const store = await cookies();
  const token = store.get("wallio_admin")?.value;
  const expected = Buffer.from(`${ADMIN_EMAIL}:${SECRET}`).toString("base64");
  if (token !== expected) return NextResponse.json({ ok: false }, { status: 401 });

  const { fcm_token } = await req.json() as { fcm_token?: string };
  if (!fcm_token) return NextResponse.json({ ok: false }, { status: 400 });

  initAdmin();
  await adminDb().collection("config").doc("admin_notif").set({ fcm_token }, { merge: true });
  return NextResponse.json({ ok: true });
}
