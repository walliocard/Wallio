import type { ReactElement } from "react";

/* ── Palier (mode progressif) ── */
export interface Palier {
  tampons: number;      // tampons nécessaires pour CE palier (depuis le précédent)
  recompense: string;   // "Café offert"
}

/* ── Données marchand ── */
export interface CardData {
  nom: string;
  slogan?: string;
  logo_url?: string;
  tampons: number;           // tampons en cours (palier actuel ou total cyclique)
  objectif_tampons: number;  // objectif du palier actuel (ou total cyclique)
  nom_recompense: string;    // récompense du palier actuel

  /* Mode progressif */
  mode?: "cyclique" | "progressif";
  paliers?: Palier[];                 // tous les paliers configurés
  palier_actuel?: number;             // index 0-based du palier en cours
  paliers_valides?: boolean[];        // paliers déjà réclamés

  /* Photo de couverture horizontale */
  photo_url?: string;

  /* Client personnalisé */
  client_prenom?: string;
  client_nom?: string;

  /* Divers */
  message_fidelite?: string;
  wallet_id?: string;
  adresse?: string;
  telephone?: string;
  site_web?: string;
  instagram?: string;
}

/* ── Dimensions personnalisées ── */
export interface CardDimensions {
  logoSize?: number;
  nameScale?: number;
  sloganScale?: number;
  stampSize?: number;
  stampStyle?: import("./components/Stamps").StampStyle;
  rewardScale?: number;
  scoreScale?: number;
  qrSize?: number;
  format?: "standard" | "compact" | "wide";
  photoHeight?: number;
}

/* ── Design tokens ── */
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
  id: string;
  name: string;
  subtitle: string;
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
  standard: "375/246",
  compact:  "375/160",
  wide:     "375/125",
};
