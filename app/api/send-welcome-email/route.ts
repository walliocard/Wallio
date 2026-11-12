import { NextResponse } from "next/server";

const FROM = "Wallio <hello@walliocard.com>";

async function sendEmail(key: string, to: string, subject: string, html: string) {
  return fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: FROM, to: [to], subject, html }),
  });
}

// mode "inscription" : mentionne le marchand + boutons Apple/Google Wallet
// mode "mes-cartes"  : générique, juste le lien /mes-cartes
export async function POST(req: Request) {
  const { email, prenom, marchandNom, walletId, mode } = await req.json().catch(() => ({})) as {
    email?: string; prenom?: string; marchandNom?: string; walletId?: string; mode?: string;
  };
  if (!email || !prenom) return NextResponse.json({ ok: false });

  const RESEND_KEY = process.env.RESEND_API_KEY;
  if (!RESEND_KEY) return NextResponse.json({ ok: false, reason: "no_key" });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://app.walliocard.com";
  const isInscription = mode === "inscription";

  const subject = isInscription
    ? `Bienvenue chez ${marchandNom} — votre carte fidélité est prête`
    : "Votre espace Wallio est prêt";

  const intro = isInscription
    ? `Votre carte de fidélité chez <strong>${marchandNom}</strong> est créée et déjà active.`
    : `Toutes vos cartes de fidélité Wallio sont disponibles en un clic.`;

  const walletButtons = isInscription && walletId ? `
    <div style="background:#F5F5F7;border-radius:14px;padding:18px;margin-bottom:20px;">
      <p style="color:#3C3C43;margin:0 0 12px;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:.05em;">Ajouter à votre portefeuille</p>
      <div style="display:flex;gap:10px;flex-wrap:wrap;">
        <a href="${appUrl}/api/apple-wallet/generate/${walletId}"
          style="flex:1;min-width:130px;display:block;text-align:center;padding:11px 16px;background:#000;color:white;border-radius:10px;text-decoration:none;font-size:13px;font-weight:600;">
          Apple Wallet
        </a>
        <a href="${appUrl}/api/google-wallet/generate/${walletId}"
          style="flex:1;min-width:130px;display:block;text-align:center;padding:11px 16px;background:#1a73e8;color:white;border-radius:10px;text-decoration:none;font-size:13px;font-weight:600;">
          Google Wallet
        </a>
      </div>
    </div>` : "";

  const html = `
    <div style="font-family:-apple-system,'Helvetica Neue',sans-serif;max-width:480px;margin:0 auto;padding:24px;background:#F5F5F7;border-radius:24px;">
      <div style="text-align:center;margin-bottom:20px;">
        <span style="display:inline-block;background:linear-gradient(135deg,#007AFF,#8B5CF6);border-radius:14px;padding:10px 22px;color:white;font-size:17px;font-weight:700;letter-spacing:3px;">WALLIO</span>
      </div>
      <div style="background:white;border-radius:16px;padding:24px;margin-bottom:16px;">
        <h2 style="color:#1D1D1F;margin:0 0 10px;font-size:19px;">Bonjour ${prenom} !</h2>
        <p style="color:#3C3C43;margin:0 0 20px;line-height:1.65;font-size:15px;">${intro}</p>
        <a href="${appUrl}/mes-cartes"
          style="display:block;text-align:center;padding:14px 24px;background:linear-gradient(135deg,#007AFF,#8B5CF6);color:white;border-radius:12px;text-decoration:none;font-weight:600;font-size:15px;">
          Voir ma carte
        </a>
      </div>
      ${walletButtons}
      <p style="color:#8E8E93;font-size:12px;text-align:center;margin:0;">L'équipe Wallio</p>
    </div>`;

  await sendEmail(RESEND_KEY, email, subject, html).catch(() => {});
  return NextResponse.json({ ok: true });
}
