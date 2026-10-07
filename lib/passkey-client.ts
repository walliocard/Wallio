export async function isPasskeySupported(): Promise<boolean> {
  if (typeof window === "undefined" || !window.PublicKeyCredential) return false;
  try {
    return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
  } catch {
    return false;
  }
}

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
  const { wallet_id } = await verRes.json();
  return wallet_id || null;
}

export async function registerPasskey(walletId: string): Promise<boolean> {
  const { startRegistration } = await import("@simplewebauthn/browser");

  const optRes = await fetch("/api/passkey/register-options", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ wallet_id: walletId }),
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
