import { adminDb } from "@/lib/admin";
import { randomUUID } from "crypto";

export const CODE_CHARS = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

export function genererCodeEtablissement(): string {
  return Array.from({ length: 6 }, () => CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]).join("");
}

export interface EquipeSession {
  token: string;
  marchand_id: string;
  membre_id: string;
  prenom: string;
  permissions: { notifs: boolean; clients: boolean };
}

export async function verifierTokenEquipe(token: string): Promise<EquipeSession | null> {
  if (!token) return null;
  const doc = await adminDb().collection("equipe_sessions").doc(token).get();
  if (!doc.exists) return null;
  const data = doc.data()!;
  if (data.expires_at.toDate() < new Date()) {
    await doc.ref.delete();
    return null;
  }
  return {
    token,
    marchand_id: data.marchand_id,
    membre_id: data.membre_id,
    prenom: data.prenom,
    permissions: data.permissions || { notifs: false, clients: false },
  };
}

export async function creerSession(marchandId: string, membreId: string, prenom: string, permissions: { notifs: boolean; clients: boolean }): Promise<string> {
  const token = randomUUID();
  const { Timestamp } = await import("firebase-admin/firestore");
  await adminDb().collection("equipe_sessions").doc(token).set({
    marchand_id: marchandId,
    membre_id: membreId,
    prenom,
    permissions,
    created_at: Timestamp.now(),
    expires_at: Timestamp.fromDate(new Date(Date.now() + 24 * 60 * 60 * 1000)),
  });
  return token;
}

export function getTokenFromRequest(req: Request): string {
  return req.headers.get("x-equipe-token") || "";
}
