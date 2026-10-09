export async function isPasskeySupported(): Promise<boolean> {
  if (typeof window === "undefined" || !window.PublicKeyCredential) return false;
  try {
    return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
  } catch {
    return false;
  }
}

async function getAuthOptions() {
  const res = await fetch("/api/passkey/auth-options", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "{}",
  });
  if (!res.ok) return null;
  return res.json() as Promise<{ sessionId: string; options: unknown }>;
}

async function registerPasskeyForIdentifier(identifier: string): Promise<boolean> {
  const { startRegistration } = await import("@simplewebauthn/browser");
  const optRes = await fetch("/api/passkey/register-options", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ identifier }),
  });
  if (!optRes.ok) return false;
  const { sessionId, options } = await optRes.json();
  const response = await startRegistration({ optionsJSON: options });
  const verRes = await fetch("/api/passkey/register-verify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sessionId, response }),
  });
  return verRes.ok;
}

export async function isPasskeyRegistered(identifier: string): Promise<boolean> {
  const res = await fetch(`/api/passkey/check?identifier=${encodeURIComponent(identifier)}`).catch(() => null);
  if (!res?.ok) return false;
  const { registered } = await res.json();
  return !!registered;
}

// ── Clients NFC (backward compat) ──────────────────────────────────────────

export async function registerPasskey(telephone: string): Promise<boolean> {
  const { startRegistration } = await import("@simplewebauthn/browser");
  const optRes = await fetch("/api/passkey/register-options", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ telephone, identifier: telephone }),
  });
  if (!optRes.ok) return false;
  const { sessionId, options } = await optRes.json();
  const response = await startRegistration({ optionsJSON: options });
  const verRes = await fetch("/api/passkey/register-verify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sessionId, response }),
  });
  return verRes.ok;
}

export async function authenticateWithPasskey(): Promise<string | null> {
  const { startAuthentication } = await import("@simplewebauthn/browser");
  const auth = await getAuthOptions();
  if (!auth) return null;
  const response = await startAuthentication({ optionsJSON: auth.options as Parameters<typeof startAuthentication>[0]["optionsJSON"] });
  const verRes = await fetch("/api/passkey/auth-verify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sessionId: auth.sessionId, response }),
  });
  if (!verRes.ok) return null;
  const data = await verRes.json();
  return data.telephone || null;
}

// ── Gérant ─────────────────────────────────────────────────────────────────

export async function registerPasskeyForGerant(uid: string): Promise<boolean> {
  return registerPasskeyForIdentifier(`gerant:${uid}`);
}

export async function authenticateGerantWithPasskey(): Promise<{ customToken: string } | null> {
  const { startAuthentication } = await import("@simplewebauthn/browser");
  const auth = await getAuthOptions();
  if (!auth) return null;
  const response = await startAuthentication({ optionsJSON: auth.options as Parameters<typeof startAuthentication>[0]["optionsJSON"] });
  const verRes = await fetch("/api/passkey/auth-verify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sessionId: auth.sessionId, response }),
  });
  if (!verRes.ok) return null;
  const data = await verRes.json();
  return data.customToken ? { customToken: data.customToken } : null;
}

// ── Membre équipe ───────────────────────────────────────────────────────────

export async function registerPasskeyForMembre(marchandId: string, membreId: string): Promise<boolean> {
  return registerPasskeyForIdentifier(`membre:${marchandId}:${membreId}`);
}

export async function authenticateMembreWithPasskey(): Promise<{
  token: string; prenom: string; marchandId: string; marchandNom: string;
  logo_url: string | null; permissions: Record<string, boolean>;
} | null> {
  const { startAuthentication } = await import("@simplewebauthn/browser");
  const auth = await getAuthOptions();
  if (!auth) return null;
  const response = await startAuthentication({ optionsJSON: auth.options as Parameters<typeof startAuthentication>[0]["optionsJSON"] });
  const verRes = await fetch("/api/passkey/auth-verify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sessionId: auth.sessionId, response }),
  });
  if (!verRes.ok) return null;
  const data = await verRes.json();
  return data.type === "membre" ? data : null;
}
