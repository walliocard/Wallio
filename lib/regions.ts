export type Region = "ma" | "ro" | "fr";

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
  ro: {
    currency: "RON",
    locale: "ro-RO",
    lang: "ro",
    monthly: 249,
    sixMonths: 1299,
    annual: 2299,
    monthlyEquiv6: 217,
    monthlyEquivAnnual: 192,
    strikethrough6: 1494,
    strikethroughAnnual: 2988,
  },
  fr: {
    currency: "€",
    locale: "fr-FR",
    lang: "fr",
    monthly: 59,
    sixMonths: 299,
    annual: 499,
    monthlyEquiv6: 50,
    monthlyEquivAnnual: 42,
    strikethrough6: 354,
    strikethroughAnnual: 708,
  },
};

export function getRegionFromHost(host: string): Region {
  if (host.startsWith("ro.")) return "ro";
  if (host.startsWith("fr.")) return "fr";
  return "ma";
}

export const DEFAULT_REGION: Region = "ma";
