// Génère le pass.json Apple Wallet (structure officielle PKPass — storeCard)
// Nécessite : Apple Developer ($99/an), passTypeIdentifier, teamIdentifier, certificat PKCS12
// Pour générer le .pkpass réel : zipper pass.json + images + manifest.json + signature

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

export interface PassInput {
  walletId: string;          // serialNumber unique du client
  merchantName: string;
  backgroundColor: string;  // hex — couleur_principale du marchand
  stampsCurrent: number;
  stampsObjective: number;
  rewardName: string;
  clientPrenom: string;
  clientNom: string;
}

export function generatePassJson(input: PassInput): object {
  const dark = relativeLuminance(input.backgroundColor) < 0.35;
  const fg = dark ? "#FFFFFF" : "#000000";
  const labelColor = dark ? "#AAAAAA" : "#666666";

  return {
    formatVersion: 1,

    // À remplir avec les identifiants Apple Developer
    passTypeIdentifier: "pass.ma.wallio.loyalty",
    teamIdentifier: process.env.APPLE_TEAM_ID ?? "XXXXXXXXXX",

    // Identifiant unique du pass client
    serialNumber: input.walletId,

    // webServiceURL et authenticationToken ajoutés quand le serveur de mise à jour push sera prêt

    organizationName: "Wallio",
    description: `Carte de fidélité — ${input.merchantName}`,
    logoText: input.merchantName,

    backgroundColor: hexToRgb(input.backgroundColor),
    foregroundColor: hexToRgb(fg),
    labelColor: hexToRgb(labelColor),

    // Type storeCard = carte fidélité (Apple Wallet)
    storeCard: {
      // Champ haut-droite (1 max)
      headerFields: [
        {
          key: "brand",
          label: "Fidélité",
          value: "Wallio",
        },
      ],

      // Champ principal (le plus visible — grand texte)
      primaryFields: [
        {
          key: "stamps",
          label: "TAMPONS",
          value: `${input.stampsCurrent}/${input.stampsObjective}`,
          changeMessage: "Nouveau tampon ! Vous avez maintenant %@",
        },
      ],

      // Champs secondaires (2 colonnes)
      secondaryFields: [
        {
          key: "reward",
          label: "RÉCOMPENSE",
          value: input.rewardName,
        },
        {
          key: "member",
          label: "MEMBRE",
          value: `${input.clientPrenom} ${input.clientNom}`.trim(),
        },
      ],

      // Champs auxiliaires (optionnels — pas utilisés en MVP)
      auxiliaryFields: [],

      // Dos de la carte (non visible sur la face, accessible en retournant)
      backFields: [
        {
          key: "info",
          label: "À PROPOS",
          value:
            "Carte de fidélité numérique. Présentez votre QR code à chaque visite pour gagner vos tampons.",
        },
        {
          key: "rgpd",
          label: "VOS DONNÉES",
          value:
            "Vos données sont gérées conformément au RGPD. Suppression disponible depuis l'application.",
        },
        {
          key: "contact",
          label: "CONTACT",
          value: "support@wallio.ma",
        },
      ],

      // QR code — scanné par le marchand pour créditer un tampon
      barcode: {
        format: "PKBarcodeFormatQR",
        message: `https://app.wallio.ma/client/${input.walletId}`,
        messageEncoding: "iso-8859-1",
        altText: input.walletId,
      },
    },
  };
}

// Images requises dans le .pkpass (à générer côté serveur) :
// - icon.png    : 29×29px  (icon@2x.png : 58×58, icon@3x.png : 87×87)  — OBLIGATOIRE
// - logo.png    : ≤160×50px (logo@2x.png : ≤320×100) — logo marchand
// - strip.png   : 375×144px (strip@2x.png : 750×288) — image bannière optionnelle
