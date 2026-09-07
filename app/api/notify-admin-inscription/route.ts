import { NextResponse } from "next/server";

const FROM = "Wallio <hello@walliocard.com>";

async function sendEmail(key: string, to: string, subject: string, html: string) {
  return fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: FROM, to: [to], subject, html }),
  });
}

export async function POST(req: Request) {
  const { nom, email } = await req.json().catch(() => ({})) as { nom?: string; email?: string };
  if (!nom || !email) return NextResponse.json({ ok: false });

  const RESEND_KEY = process.env.RESEND_API_KEY;
  if (!RESEND_KEY) return NextResponse.json({ ok: false, reason: "no_resend_key" });

  // Email à Karim (admin)
  sendEmail(RESEND_KEY, "karimmejbar2003@gmail.com",
    `Nouveau marchand en attente : ${nom}`,
    `<div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
      <h2 style="color: #007AFF; margin: 0 0 16px;">Nouveau marchand inscrit</h2>
      <p style="color: #1C1C1E; margin: 0 0 8px;"><strong>Nom :</strong> ${nom}</p>
      <p style="color: #1C1C1E; margin: 0 0 24px;"><strong>Email :</strong> ${email}</p>
      <a href="https://app.walliocard.com/admin"
        style="display: inline-block; padding: 12px 24px; background: #007AFF; color: white;
               border-radius: 12px; text-decoration: none; font-weight: 600;">
        Activer depuis l'admin
      </a>
    </div>`
  ).catch(() => {});

  // Email de confirmation au marchand
  sendEmail(RESEND_KEY, email,
    "Votre demande Wallio est bien reçue",
    `<div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
      <h2 style="color: #007AFF; margin: 0 0 12px;">Bonjour ${nom} !</h2>
      <p style="color: #1C1C1E; margin: 0 0 16px; line-height: 1.6;">
        Nous avons bien reçu votre demande d'accès à Wallio.
        Votre compte est en cours de validation par notre équipe.
      </p>
      <p style="color: #1C1C1E; margin: 0 0 24px; line-height: 1.6;">
        Vous recevrez un email dès que votre espace marchand est activé, généralement sous 24h.
      </p>
      <p style="color: #6E6E73; font-size: 13px; margin: 0;">L'équipe Wallio</p>
    </div>`
  ).catch(() => {});

  return NextResponse.json({ ok: true });
}
