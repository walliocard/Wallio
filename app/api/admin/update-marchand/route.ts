import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { adminDb, initAdmin } from "@/lib/admin";
import { FieldValue } from "firebase-admin/firestore";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "wallio.card@gmail.com";
const SECRET = process.env.ADMIN_SECRET ?? process.env.CRON_SECRET ?? "secret";
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://app.walliocard.com";

async function checkAdmin() {
  const store = await cookies();
  const token = store.get("wallio_admin")?.value;
  const expected = Buffer.from(`${ADMIN_EMAIL}:${SECRET}`).toString("base64");
  return token === expected;
}

async function sendActivationEmail(email: string, nom: string) {
  const key = process.env.RESEND_API_KEY;
  if (!key) return;
  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: "Wallio <hello@walliocard.com>",
      to: [email],
      subject: "Votre compte Wallio est activé !",
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
          <h2 style="color: #007AFF; margin: 0 0 12px;">Bienvenue sur Wallio, ${nom} !</h2>
          <p style="color: #1C1C1E; margin: 0 0 24px; line-height: 1.6;">
            Votre espace marchand vient d'être activé. Vous pouvez maintenant vous connecter
            et configurer votre carte de fidélité.
          </p>
          <a href="${BASE_URL}/auth/connexion"
            style="display: inline-block; padding: 12px 24px; background: #007AFF; color: white;
                   border-radius: 12px; text-decoration: none; font-weight: 600;">
            Accéder à mon espace
          </a>
          <p style="color: #6E6E73; font-size: 13px; margin-top: 24px;">
            L'équipe Wallio
          </p>
        </div>
      `,
    }),
  }).catch(() => {});
}

// PATCH — mise à jour champs admin (actif, nfc_id, abonnement_statut)
export async function PATCH(req: Request) {
  if (!await checkAdmin()) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }
  const { marchandId, fields } = await req.json();
  if (!marchandId || typeof fields !== "object") {
    return NextResponse.json({ error: "Paramètres invalides" }, { status: 400 });
  }

  const adminAllowed = ["actif", "nfc_id", "abonnement_statut"];
  const data: Record<string, unknown> = { updated_at: FieldValue.serverTimestamp() };
  for (const key of adminAllowed) {
    if (key in fields) data[key] = fields[key];
  }

  initAdmin();
  await adminDb().collection("marchands").doc(marchandId).update(data);

  // Mail d'activation si on vient d'activer le marchand
  if (fields.actif === true) {
    const snap = await adminDb().collection("marchands").doc(marchandId).get();
    const m = snap.data();
    if (m?.email && m?.nom) {
      sendActivationEmail(m.email as string, m.nom as string).catch(() => {});
    }
  }

  return NextResponse.json({ ok: true });
}

// DELETE — suppression d'un marchand
export async function DELETE(req: Request) {
  if (!await checkAdmin()) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }
  const { marchandId } = await req.json();
  if (!marchandId) {
    return NextResponse.json({ error: "marchandId requis" }, { status: 400 });
  }
  initAdmin();
  await adminDb().collection("marchands").doc(marchandId).delete();
  return NextResponse.json({ ok: true });
}
