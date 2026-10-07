export async function isPasskeySupported(): Promise<boolean> {
  if (typeof window === "undefined" || !window.PublicKeyCredential) return false;
  try {
    return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
  } catch {
    return false;
  }
}

// Retourne le numéro de téléphone lié à la passkey, ou null
export async function authenticateWithPasskey(): Promise<string | null> {
  const { startAuthentication } = await import("@simplewebauthn/browser");

  const optRes = await fetch("/api/passkey/auth-options", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "{}",
  });
  if (!optRes.ok) return null;
  const { sessionId, options } = await optRes.json();

  const response = await startAuthentication({ optionsJSON: options });

  const verRes = await fetch("/api/passkey/auth-verify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sessionId, response }),
  });
  if (!verRes.ok) return null;
  const { telephone } = await verRes.json();
  return telephone || null;
}

// Enregistre une passkey liée au numéro de téléphone
export async function registerPasskey(telephone: string): Promise<boolean> {
  const { startRegistration } = await import("@simplewebauthn/browser");

  const optRes = await fetch("/api/passkey/register-options", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ telephone }),
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

export async function isPasskeyRegistered(telephone: string): Promise<boolean> {
  const res = await fetch(`/api/passkey/check?telephone=${encodeURIComponent(telephone)}`).catch(() => null);
  if (!res?.ok) return false;
  const { registered } = await res.json();
  return !!registered;
}
