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
  /* true = miniature dans la galerie (peut simplifier le rendu) */
  thumbnail?: boolean;
}
