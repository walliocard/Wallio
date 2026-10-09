export type Region = "ma" | "fr" | "ro";

export const REGIONS: Record<Region, {
  currency: string;
  locale: string;
  lang: "fr" | "ro";
  monthly: number;
  sixMonths: number;
  annual: number;
  monthlyEquiv6: number;
  monthlyEquivAnnual: number;
  strikethrough6: number;
  strikethroughAnnual: number;
}> = {
  ma: {
    currency: "DH",
    locale: "fr-FR",
    lang: "fr",
    monthly: 349,
    sixMonths: 1799,
    annual: 2999,
    monthlyEquiv6: 300,
    monthlyEquivAnnual: 250,
    strikethrough6: 2094,
    strikethroughAnnual: 4188,
  },
  fr: {
    currency: "€",
    locale: "fr-FR",
    lang: "fr",
    monthly: 40,
    sixMonths: 199,
    annual: 349,
    monthlyEquiv6: 33,
    monthlyEquivAnnual: 29,
    strikethrough6: 240,
    strikethroughAnnual: 480,
  },
  ro: {
    currency: "RON",
    locale: "ro-RO",
    lang: "ro",
    monthly: 199,
    sixMonths: 999,
    annual: 1799,
    monthlyEquiv6: 167,
    monthlyEquivAnnual: 150,
    strikethrough6: 1194,
    strikethroughAnnual: 2388,
  },
};

export function getRegionFromHost(host: string): Region {
  if (host.startsWith("eu.")) return "fr";
  return "ma";
}

export const DEFAULT_REGION: Region = "ma";
