import * as http2 from "http2";

// TODO (Apple Developer requis) : déposer la clé APNs .p8 dans /private/AuthKey_XXXXXXXXXX.p8
// et renseigner APNS_KEY_ID, APNS_TEAM_ID, APNS_KEY_PATH dans les variables d'environnement Vercel.
// Sans ces valeurs, pushPassUpdate() loggue un avertissement et ne fait rien.

const PASS_TYPE_ID = "pass.ma.wallio.loyalty";
const APNS_HOST_PROD = "api.push.apple.com";
const APNS_HOST_DEV  = "api.development.push.apple.com";

function missingConfig(): boolean {
  return !process.env.APNS_KEY_ID || !process.env.APNS_TEAM_ID || !process.env.APNS_KEY;
}

// Génère un JWT APNS signé avec la clé p8 (requis par Apple)
function buildJwt(): string {
  // TODO : générer le JWT avec APNS_KEY (contenu de la clé .p8), APNS_KEY_ID, APNS_TEAM_ID
  // Algorithme : ES256
  // Header : { alg: "ES256", kid: APNS_KEY_ID }
  // Payload : { iss: APNS_TEAM_ID, iat: Math.floor(Date.now() / 1000) }
  throw new Error("APNS JWT non implémenté — Apple Developer requis");
}

// Envoie le signal "please update" à Apple pour le pushToken donné.
// Apple appellera ensuite notre endpoint GET /api/apple-wallet/passes/... pour télécharger le pass mis à jour.
export async function pushPassUpdate(pushToken: string): Promise<void> {
  if (missingConfig()) {
    console.warn("[APNS] Variables manquantes (APNS_KEY_ID, APNS_TEAM_ID, APNS_KEY) — push ignoré");
    return;
  }

  const host = process.env.NODE_ENV === "production" ? APNS_HOST_PROD : APNS_HOST_DEV;
  const path = `/3/device/${pushToken}`;
  let jwt: string;
  try {
    jwt = buildJwt();
  } catch (e) {
    console.warn("[APNS] buildJwt échoué — Apple Developer requis", e);
    return;
  }

  return new Promise((resolve, reject) => {
    const client = http2.connect(`https://${host}`);

    client.on("error", reject);

    const req = client.request({
      ":method": "POST",
      ":path": path,
      "authorization": `bearer ${jwt}`,
      "apns-push-type": "background",
      "apns-topic": PASS_TYPE_ID, // Pour les passes Wallet, le topic = passTypeIdentifier exact
      "content-type": "application/json",
    });

    req.write(JSON.stringify({})); // Corps vide — Apple demande juste de mettre à jour le pass
    req.end();

    req.on("response", (headers) => {
      const status = headers[":status"] as number;
      client.close();
      if (status === 200) {
        resolve();
      } else {
        reject(new Error(`APNS a répondu ${status}`));
      }
    });

    req.on("error", (err) => {
      client.close();
      reject(err);
    });
  });
}
