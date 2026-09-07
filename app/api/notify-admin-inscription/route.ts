import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { nom, email } = await req.json().catch(() => ({})) as { nom?: string; email?: string };
  if (!nom || !email) return NextResponse.json({ ok: false });

  const RESEND_KEY = process.env.RESEND_API_KEY;
  if (!RESEND_KEY) return NextResponse.json({ ok: false, reason: "no_resend_key" });

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${RESEND_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: "Wallio <onboarding@walliocard.com>",
      to: ["karimmejbar2003@gmail.com"],
      subject: `Nouveau marchand en attente : ${nom}`,
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
          <h2 style="color: #007AFF; margin: 0 0 16px;">Nouveau marchand inscrit</h2>
          <p style="color: #1C1C1E; margin: 0 0 8px;"><strong>Nom :</strong> ${nom}</p>
          <p style="color: #1C1C1E; margin: 0 0 24px;"><strong>Email :</strong> ${email}</p>
          <a href="https://app.walliocard.com/admin"
            style="display: inline-block; padding: 12px 24px; background: #007AFF; color: white;
                   border-radius: 12px; text-decoration: none; font-weight: 600;">
            Activer depuis l'admin
          </a>
        </div>
      `,
    }),
  });

  return NextResponse.json({ ok: res.ok });
}
