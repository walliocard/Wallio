import JSZip from "jszip";
import crypto from "crypto";
import forge from "node-forge";
import { generatePassJson, type PassInput } from "./generatePass";

// Certificat intermédiaire Apple WWDR G4 (public, nécessaire pour la chaîne PKCS7)
// Source : https://www.apple.com/certificateauthority/
const WWDR_G4_PEM = `-----BEGIN CERTIFICATE-----
MIIEkTCCA3mgAwIBAgIQUTk8NscZMXNpK/ADgKAqkDANBgkqhkiG9w0BAQsFADBi
MQswCQYDVQQGEwJVUzETMBEGA1UEChMKQXBwbGUgSW5jLjEmMCQGA1UECxMdQXBw
bGUgQ2VydGlmaWNhdGlvbiBBdXRob3JpdHkxFjAUBgNVBAMTDUFwcGxlIFJvb3Qg
Q0EwHhcNMjIwMzE3MjAzNjE0WhcNMzMwMzE3MDAwMDAwWjBvMQswCQYDVQQGEwJV
UzETMBEGA1UEChMKQXBwbGUgSW5jLjEmMCQGA1UECxMdQXBwbGUgQ2VydGlmaWNh
dGlvbiBBdXRob3JpdHkxIzAhBgNVBAMTGkFwcGxlIFdvcmxkd2lkZSBEZXZlbG9w
ZXIgUmVsYXRpb25zIENlcnRpZmljYXRpb24gQXV0aG9yaXR5MIIBIjANBgkqhkiG
9w0BAQEFAAOCAQ8AMIIBCgKCAQEAoGSYFRbHDCE2NDVJTZOcTh5hj0n0fT1LsrCi
fiqVY6JDiepH/B0Kf+A0HRohFiZUt3fqUJWf+4UVkKBqZT12g52mfFpLmIvS1ga
4ULK1IZT5E0Hxx2PVJoFuGcMNGSDGHW/vLLv+RV1HbRfujIvRYRKPEF1I3w4RmT
OM0qSIlbFOW7TtGn+fU3AMTLpHO9aBFDH2cWHEJRCEUV9Oq3P5Xjsm5T+hFBMoJ
n9KpqnmPlZYjJjl/e/Iv2k6pUiDSFTAT5q0UDm6hNnkl/r+3ZfE4R+y9I5bVMj6
U2HW6K8rdUZ+kF5RJjBMoQrNFu6vqmMOYSQZ2w9sCfWQzQIDAQABo4HyMIHvMB0G
A1UdDgQWBBRXFf+nEdbIZb/7MKqDkk3s9v8aHjAPBgNVHRMBAf8EBTADAQH/MB8G
A1UdIwQYMBaAFCvQaUeUdgn+9GuNLkCm90dNfwheMEQGA1UdIAQ9MDswOQYFZ4EM
AQEwMDAuBggrBgEFBQcCARYiaHR0cHM6Ly93d3cuYXBwbGUuY29tL2NlcnRpZmlj
YXRlYXV0aG9yaXR5LzA+BgNVHR8ENzA1MDOgMaAvhi1odHRwOi8vY3JsLmFwcGxl
LmNvbS9hcHBsZXJvb3RjYS9yb290LmNybDAOBgNVHQ8BAf8EBAMCAQYwEAYKKoZI
hvdjZAYCEwIFADANBgkqhkiG9w0BAQsFAAOCAQEAHHxWXjE5q1q2fy/PsDx4UVMZ
pIa7UrPNDELbflX7p+JjzEBZKBH8r7m1N2T2lfFSO1B7tNBbWRIiGHPNjJWLgJkV
8rkN7gO3LYrw0D6K0m5iM7IHM5WG3rLV0IQpNuEcGAqfBPovnPGQ8iGCJCcK2RLp
Y1vEiMh0Q+Tj3SxEyQB18N4J0MEHpCFP7J3YI8E0QyPb4vF0WQrqaEVY5F3ZKFT
Fl0fmr/+vFYoUyC/e+gZi+VhF+6zNGHdlzOJR7j7Xt0iMXIKwKGH+l7DuNQ2a9Z
QRJ2oTmDpMgT7VeHZJP7KD5m78nC1i0EEFrJv2sVsFk2Q+S5tq3JjUJBhA==
-----END CERTIFICATE-----`;

function sha1(data: Buffer | string): string {
  return crypto.createHash("sha1").update(data).digest("hex");
}

function signManifest(manifestJson: string): Buffer {
  const p12B64     = process.env.APPLE_PASS_CERT_P12;
  const p12Pwd     = process.env.APPLE_PASS_CERT_PASSWORD || "";

  if (!p12B64) {
    console.warn("[PassKit] APPLE_PASS_CERT_P12 manquant — signature vide");
    return Buffer.alloc(0);
  }

  const p12Der  = forge.util.decode64(p12B64);
  const p12Asn1 = forge.asn1.fromDer(p12Der);
  const p12     = forge.pkcs12.pkcs12FromAsn1(p12Asn1, p12Pwd);

  // Extraire clé privée et certificat
  const keyBags  = p12.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag });
  const certBags = p12.getBags({ bagType: forge.pki.oids.certBag });
  const privateKey = keyBags[forge.pki.oids.pkcs8ShroudedKeyBag]?.[0]?.key;
  const cert       = certBags[forge.pki.oids.certBag]?.[0]?.cert;

  if (!privateKey || !cert) {
    console.error("[PassKit] Impossible d'extraire clé/cert du p12");
    return Buffer.alloc(0);
  }

  const wwdrCert = forge.pki.certificateFromPem(WWDR_G4_PEM);

  // Créer signature PKCS7 detached
  const p7 = forge.pkcs7.createSignedData();
  p7.content = forge.util.createBuffer(manifestJson, "utf8");
  p7.addCertificate(cert);
  p7.addCertificate(wwdrCert);
  p7.addSigner({
    key: privateKey,
    certificate: cert,
    digestAlgorithm: forge.pki.oids.sha256,
    authenticatedAttributes: [
      { type: forge.pki.oids.contentType, value: forge.pki.oids.data },
      { type: forge.pki.oids.messageDigest },
      { type: forge.pki.oids.signingTime, value: new Date().toISOString() },
    ],
  });
  p7.sign({ detached: true });

  const der = forge.asn1.toDer(p7.toAsn1());
  return Buffer.from(forge.util.binary.raw.decode(der.getBytes()));
}

const ICON_29 = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAB0AAAAdCAYAAABWk2cPAAAAQklEQVRIS2NkYGD4z0A5YJQa" +
  "pQZpgGqUGqQBqlFqkAaoRqlBGqAapQZpgGqUGqQBqlFqkAaoRqlBGqAapQZpgGoAdwAIAAH" +
  "V/AAAAAAElFTkSuQmCC",
  "base64"
);

export async function buildPkpass(input: PassInput & { stripUrl?: string }): Promise<Buffer> {
  const passJson = JSON.stringify(generatePassJson(input), null, 2);

  const files: Record<string, Buffer> = {
    "pass.json": Buffer.from(passJson, "utf8"),
    "icon.png":  ICON_29,
    "icon@2x.png": ICON_29,
    "icon@3x.png": ICON_29,
  };

  // Bannière : télécharger strip_url si fourni
  if (input.stripUrl) {
    try {
      const res = await fetch(input.stripUrl);
      if (res.ok) {
        const buf = Buffer.from(await res.arrayBuffer());
        files["strip.png"]    = buf;
        files["strip@2x.png"] = buf;
        files["strip@3x.png"] = buf;
      }
    } catch {
      // bannière optionnelle — on continue sans
    }
  }

  const manifest: Record<string, string> = {};
  for (const [name, data] of Object.entries(files)) {
    manifest[name] = sha1(data);
  }
  const manifestJson = JSON.stringify(manifest);
  files["manifest.json"] = Buffer.from(manifestJson, "utf8");

  const signature = signManifest(manifestJson);

  const zip = new JSZip();
  for (const [name, data] of Object.entries(files)) {
    zip.file(name, data);
  }
  zip.file("signature", signature);

  return zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" });
}
