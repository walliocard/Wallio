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
    monthly: 35,
    sixMonths: 180,
    annual: 300,
    monthlyEquiv6: 30,
    monthlyEquivAnnual: 25,
    strikethrough6: 210,
    strikethroughAnnual: 420,
  },
  ro: {
    currency: "€",
    locale: "ro-RO",
    lang: "ro",
    monthly: 35,
    sixMonths: 180,
    annual: 300,
    monthlyEquiv6: 30,
    monthlyEquivAnnual: 25,
    strikethrough6: 210,
    strikethroughAnnual: 420,
  },
};

export function getRegionFromHost(host: string): Region {
  if (host.startsWith("eu.")) return "fr";
  return "ma";
}

export const DEFAULT_REGION: Region = "ma";
