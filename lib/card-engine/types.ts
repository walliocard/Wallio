import type { ReactElement } from "react";

/* ── Données marchand ── */
export interface CardData {
  nom: string;
  slogan?: string;
  logo_url?: string;
  tampons: number;
  objectif_tampons: number;
  nom_recompense: string;
  message_fidelite?: string;
  wallet_id?: string;
  adresse?: string;
  telephone?: string;
  site_web?: string;
  instagram?: string;
}

/* ── Dimensions personnalisées ── */
export interface CardDimensions {
  stampSize?: number;      // taille px des tampons en full (défaut template)
  nameScale?: number;      // multiplicateur taille nom 0.6–2.0
  sloganScale?: number;    // multiplicateur taille slogan 0.6–2.0
  rewardScale?: number;    // multiplicateur taille récompense 0.6–2.0
  paddingScale?: number;   // multiplicateur padding 0.5–1.5
  format?: "standard" | "compact" | "wide"; // ratio carte
}

/* ── Design tokens — chaque palette instancie ces tokens ── */
export interface CardTokens {
  background: string;
  surface: string;
  surfaceSecondary: string;
  text: string;
  textSecondary: string;
  textTertiary: string;
  accent: string;
  accentSecondary: string;
  stampActive: string;
  stampActiveIcon: string;
  stampInactive: string;
  border: string;
  borderStrong: string;
  qrBackground: string;
  qrForeground: string;
  rewardBackground: string;
}

/* ── Palette nommée ── */
export interface CardPalette {
  id: string;
  name: string;
  tokens: CardTokens;
}

/* ── Catégories ── */
export type CardCategory =
  | "minimal" | "premium" | "luxury" | "coffee" | "restaurant"
  | "barber" | "beauty" | "sport" | "nature" | "editorial"
  | "retro" | "colorful" | "street" | "modern" | "artistic";

/* ── Template ── */
export interface CardTemplate {
  id: string;          // "01-aura"
  name: string;        // "AURA"
  subtitle: string;    // "Minimal Premium"
  description: string;
  categories: CardCategory[];
  palettes: CardPalette[];
  defaultPaletteId: string;
  render: (props: RenderProps) => ReactElement;
}

export interface RenderProps {
  data: CardData;
  tokens: CardTokens;
  palette: CardPalette;
  thumbnail?: boolean;
  dimensions?: CardDimensions;
}

/* ── Format → aspect ratio ── */
export const FORMAT_RATIOS: Record<NonNullable<CardDimensions["format"]>, string> = {
  standard: "375/246",   // Apple Wallet Store Card (ratio actuel)
  compact:  "375/160",   // Apple Wallet Coupon / Boarding pass
  wide:     "375/125",   // Google Wallet Loyalty Hero
};
