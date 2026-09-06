// Génère le pass.json Apple Wallet (structure officielle PKPass — storeCard)
// Nécessite : Apple Developer ($99/an), passTypeIdentifier, teamIdentifier, certificat PKCS12

function hexToRgb(hex: string): string {
  const h = /^#[0-9a-f]{6}$/i.test(hex) ? hex : "#000000";
  const r = parseInt(h.slice(1, 3), 16);
  const g = parseInt(h.slice(3, 5), 16);
  const b = parseInt(h.slice(5, 7), 16);
  return `rgb(${r},${g},${b})`;
}

function relativeLuminance(hex: string): number {
  const h = /^#[0-9a-f]{6}$/i.test(hex) ? hex : "#000000";
  const r = parseInt(h.slice(1, 3), 16) / 255;
  const g = parseInt(h.slice(3, 5), 16) / 255;
  const b = parseInt(h.slice(5, 7), 16) / 255;
  const lin = (c: number) => c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

export interface PassField {
  label: string;
  value: string;
}

export interface PassLocation {
  latitude: number;
  longitude: number;
  relevantText?: string;
}

export interface PassInput {
  walletId: string;
  authToken: string;
  merchantName: string;
  backgroundColor: string;
  foregroundColor?: string;
  labelColorHex?: string;
  stampsCurrent: number;
  stampsObjective: number;
  rewardName: string;
  clientPrenom: string;
  clientNom: string;
  primaryLabel?: string;
  rewardLabel?: string;
  memberLabel?: string;
  auxiliaryFields?: PassField[];
  backInfo?: string;
  description?: string;
  locations?: PassLocation[];
}

export function generatePassJson(input: PassInput): object {
  const dark = relativeLuminance(input.backgroundColor) < 0.35;
  const fg = input.foregroundColor ?? (dark ? "#FFFFFF" : "#000000");
  const lc = input.labelColorHex ?? (dark ? "#AAAAAA" : "#666666");

  // Champs marchand : 1 max en face (le reste va au dos)
  const allMarchandAux = (input.auxiliaryFields ?? []).filter(f => f.value);
  const frontAux = allMarchandAux.slice(0, 3).map((f, i) => ({ key: `aux${i + 1}`, label: f.label.toUpperCase(), value: f.value }));
  const backAux  = allMarchandAux.slice(3).map((f, i)  => ({ key: `back_aux${i + 1}`, label: f.label.toUpperCase(), value: f.value }));

  const auxiliaryFields = [...frontAux];

  return {
    formatVersion: 1,
    passTypeIdentifier: process.env.APPLE_PASS_TYPE_ID ?? "pass.com.walliocard.loyalty",
    teamIdentifier: process.env.APPLE_TEAM_ID ?? "V922LM2G7C",
    serialNumber: input.walletId,
    webServiceURL: `${process.env.NEXT_PUBLIC_APP_URL ?? "https://app.walliocard.com"}/api/apple-wallet`,
    authenticationToken: input.authToken,
    organizationName: "Wallio",
    description: input.description || `Carte de fidélité — ${input.merchantName}`,
    logoText: input.merchantName,
    backgroundColor: hexToRgb(input.backgroundColor),
    foregroundColor: hexToRgb(fg),
    labelColor: hexToRgb(lc),
    storeCard: {
      headerFields: [
        {
          key: "stamps",
          label: (input.primaryLabel ?? "TAMPONS").toUpperCase(),
          value: `${input.stampsCurrent}/${input.stampsObjective}`,
          changeMessage: "Nouveau tampon ! Vous avez maintenant %@",
        },
      ],
      secondaryFields: [
        {
          key: "reward",
          label: (input.rewardLabel ?? "RÉCOMPENSE").toUpperCase(),
          value: input.rewardName,
        },
        {
          key: "member",
          label: (input.memberLabel ?? "MEMBRE").toUpperCase(),
          value: `${input.clientPrenom} ${input.clientNom}`.trim(),
        },
      ],
      auxiliaryFields,
      backFields: [
        ...(input.backInfo ? [{ key: "info", label: "À PROPOS", value: input.backInfo }] : []),
        ...backAux,
        { key: "rgpd", label: "VOS DONNÉES", value: "Vos données sont gérées conformément au RGPD. Suppression disponible depuis l'application." },
        { key: "contact", label: "CONTACT", value: "support@walliocard.com" },
      ],
    },
    // barcodes au niveau racine (spec Apple Wallet)
    barcodes: [
      {
        format: "PKBarcodeFormatQR",
        message: `WALLIO:${input.walletId}`,
        messageEncoding: "iso-8859-1",
      },
    ],
    // Géolocalisation — notification lock screen quand le client s'approche
    ...(input.locations?.length ? {
      locations: input.locations.map(l => ({
        latitude: l.latitude,
        longitude: l.longitude,
        ...(l.relevantText ? { relevantText: l.relevantText } : {}),
      })),
      maxDistance: 200, // mètres
    } : {}),
  };
}
