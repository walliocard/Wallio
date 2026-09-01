import crypto from "crypto";

function base64url(data: Buffer | string): string {
  const buf = typeof data === "string" ? Buffer.from(data) : data;
  return buf.toString("base64url");
}

function signRS256(header: object, payload: object, privateKey: string): string {
  const h = base64url(JSON.stringify(header));
  const p = base64url(JSON.stringify(payload));
  const input = `${h}.${p}`;
  const sig = crypto.createSign("RSA-SHA256").update(input).sign(privateKey);
  return `${input}.${base64url(sig)}`;
}

let _cache: { token: string; exp: number } | null = null;

export async function getGoogleAccessToken(): Promise<string> {
  if (_cache && Date.now() < _cache.exp) return _cache.token;

  const key = JSON.parse(process.env.GOOGLE_WALLET_KEY_JSON!);
  const now = Math.floor(Date.now() / 1000);

  const assertion = signRS256(
    { alg: "RS256", typ: "JWT" },
    {
      iss: key.client_email,
      scope: "https://www.googleapis.com/auth/wallet_object.issuer",
      aud: "https://oauth2.googleapis.com/token",
      iat: now,
      exp: now + 3600,
    },
    key.private_key
  );

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
  });

  const data = await res.json() as { access_token: string; expires_in: number };
  _cache = { token: data.access_token, exp: Date.now() + (data.expires_in - 60) * 1000 };
  return _cache.token;
}

export function buildSaveToWalletJwt(loyaltyObjects: object[]): string {
  const key = JSON.parse(process.env.GOOGLE_WALLET_KEY_JSON!);
  return signRS256(
    { alg: "RS256", typ: "JWT" },
    {
      iss: key.client_email,
      aud: "google",
      typ: "savetowallet",
      iat: Math.floor(Date.now() / 1000),
      origins: ["https://app.walliocard.com", "https://wallio-seven.vercel.app"],
      payload: { loyaltyObjects },
    },
    key.private_key
  );
}
