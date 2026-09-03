import * as http2 from "http2";
import * as crypto from "crypto";

const PASS_TYPE_ID = process.env.APPLE_PASS_TYPE_ID || "pass.com.walliocard.loyalty";
const APNS_HOST = "api.push.apple.com";

function missingConfig(): boolean {
  return !process.env.APNS_KEY_ID || !process.env.APPLE_TEAM_ID || !process.env.APNS_KEY;
}

// Cache JWT (valide 55 min — Apple exige renouvellement avant 60 min)
let _jwtCache: { token: string; exp: number } | null = null;

function buildJwt(): string {
  if (_jwtCache && Date.now() < _jwtCache.exp) return _jwtCache.token;

  const keyId  = process.env.APNS_KEY_ID!;
  const teamId = process.env.APPLE_TEAM_ID!;
  const pemKey = Buffer.from(process.env.APNS_KEY!, "base64").toString("utf8");

  const header  = Buffer.from(JSON.stringify({ alg: "ES256", kid: keyId })).toString("base64url");
  const payload = Buffer.from(JSON.stringify({ iss: teamId, iat: Math.floor(Date.now() / 1000) })).toString("base64url");
  const input   = `${header}.${payload}`;

  const sig = crypto.createSign("SHA256").update(input).sign({ key: pemKey, dsaEncoding: "ieee-p1363" });
  const token = `${input}.${sig.toString("base64url")}`;

  _jwtCache = { token, exp: Date.now() + 55 * 60 * 1000 };
  return token;
}

export async function pushPassUpdate(pushToken: string): Promise<void> {
  if (missingConfig()) {
    console.warn("[APNS] Variables manquantes — push ignoré");
    return;
  }

  const jwt  = buildJwt();
  const path = `/3/device/${pushToken}`;

  return new Promise((resolve, reject) => {
    const client = http2.connect(`https://${APNS_HOST}`);
    client.on("error", reject);

    const req = client.request({
      ":method": "POST",
      ":path": path,
      "authorization": `bearer ${jwt}`,
      "apns-push-type": "background",
      "apns-priority": "10",
      "apns-topic": PASS_TYPE_ID,
      "content-type": "application/json",
    });

    req.write(JSON.stringify({}));
    req.end();

    req.on("response", (headers) => {
      const status = headers[":status"] as number;
      client.close();
      if (status === 200) resolve();
      else reject(new Error(`APNS status ${status}`));
    });

    req.on("error", (err) => { client.close(); reject(err); });
  });
}
