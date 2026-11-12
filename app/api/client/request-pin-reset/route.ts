import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { adminDb, initAdmin } from "@/lib/admin";
import { Timestamp } from "firebase-admin/firestore";

function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (local.length <= 2) return `${local[0]}***@${domain}`;
  return `${local[0]}***${local[local.length - 1]}@${domain}`;
}

export async function POST(req: Request) {
  try {
    const { telephone } = await req.json();
    if (!telephone) return NextResponse.json({ ok: false, error: "Données invalides" }, { status: 400 });

    initAdmin();
    const db = adminDb();
    const snap = await db.collection("clients").where("telephone", "==", telephone).get();
    if (snap.empty) return NextResponse.json({ ok: false, error: "Client introuvable" }, { status: 404 });

    const email = snap.docs.map(d => d.data().email as string | undefined).find(e => !!e);

    if (!email) return NextResponse.json({ ok: true, method: "dob" });

    // Générer OTP 6 chiffres
    const code = String(Math.floor(100000 + Math.random() * 900000));
    const hash = await bcrypt.hash(code, 8);
    const expiresAt = Timestamp.fromDate(new Date(Date.now() + 10 * 60 * 1000));

    const batch = db.batch();
    snap.docs.forEach(d => batch.update(d.ref, { pin_reset_code_hash: hash, pin_reset_expires_at: expiresAt }));
    await batch.commit();

    const RESEND_KEY = process.env.RESEND_API_KEY;
    if (RESEND_KEY) {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${RESEND_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: "Wallio <hello@walliocard.com>",
          to: [email],
          subject: "Votre code de réinitialisation PIN Wallio",
          html: `
            <div style="font-family:-apple-system,'Helvetica Neue',sans-serif;max-width:480px;margin:0 auto;padding:24px;background:#F5F5F7;border-radius:24px;">
              <div style="text-align:center;margin-bottom:20px;">
                <span style="display:inline-block;background:linear-gradient(135deg,#007AFF,#8B5CF6);border-radius:14px;padding:10px 22px;color:white;font-size:17px;font-weight:700;letter-spacing:3px;">WALLIO</span>
              </div>
              <div style="background:white;border-radius:16px;padding:24px;margin-bottom:16px;">
                <h2 style="color:#1D1D1F;margin:0 0 10px;font-size:19px;">Réinitialisation de votre PIN</h2>
                <p style="color:#3C3C43;margin:0 0 20px;line-height:1.65;font-size:15px;">Votre code de vérification est :</p>
                <div style="background:#F5F5F7;border-radius:12px;padding:20px;text-align:center;margin-bottom:20px;">
                  <span style="font-size:36px;font-weight:700;letter-spacing:0.4em;color:#1D1D1F;">${code}</span>
                </div>
                <p style="color:#8E8E93;font-size:13px;margin:0;">Ce code est valable 10 minutes. Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.</p>
              </div>
              <p style="color:#8E8E93;font-size:12px;text-align:center;margin:0;">L'équipe Wallio</p>
            </div>`,
        }),
      }).catch(() => {});
    }

    return NextResponse.json({ ok: true, method: "email", emailMasked: maskEmail(email) });
  } catch (e) {
    console.error("request-pin-reset error:", e);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
