export type WalletLangDefaults = {
  stamps: string;
  reward: string;
  member: string;
  locale: string;
  country: string;
};

const DEFAULTS: Record<string, WalletLangDefaults> = {
  fr: { stamps: "Tampons",  reward: "Récompense", member: "Membre",  locale: "fr-FR", country: "FR" },
  ro: { stamps: "Ștampile", reward: "Recompensă", member: "Membru",  locale: "ro-RO", country: "RO" },
  es: { stamps: "Sellos",   reward: "Recompensa", member: "Miembro", locale: "es-ES", country: "ES" },
};

export function getWalletLang(langue?: string): WalletLangDefaults {
  return DEFAULTS[langue || "fr"] ?? DEFAULTS.fr;
}
