// Projection publique d'un marchand pour l'app client (page marchand + Découvrir).
// N'expose JAMAIS : email du gérant, données perso, données clients.

import { statutOuverture, type Horaires } from "./horaires";

export type MarchandPublic = {
  id: string;
  nom: string;
  slug: string | null;
  logo_url: string | null;
  strip_url: string | null;
  couleur_principale: string | null;
  couleur_secondaire: string | null;
  categorie: string | null;
  ville: string | null;
  pays: string | null;
  latitude: number | null;
  longitude: number | null;
  horaires: Horaires | null;
  statut: ReturnType<typeof statutOuverture>;
  telephone: string | null;
  instagram: string | null;
  // Règles de la carte
  objectif_tampons: number | null;
  nom_recompense: string | null;
  mode_recompense: string | null;
  paliers: { tampons: number; recompense: string }[] | null;
  palier_intermediaire: number | null;
  nom_recompense_petit: string | null;
  nom_recompense_grand: string | null;
  parrainage_actif: boolean;
  // Métadonnées
  date_inscription: number | null; // epoch secondes → badge "Nouveau"
};

type Doc = Record<string, unknown>;

export function toMarchandPublic(id: string, m: Doc, now: Date = new Date()): MarchandPublic {
  const horaires = (m.horaires as Horaires) || null;
  const tz = (m.fuseau_horaire as string) || "Africa/Casablanca";
  const fermetures = Array.isArray(m.fermetures_exceptionnelles) ? (m.fermetures_exceptionnelles as string[]) : [];
  const di = m.date_inscription as { seconds?: number; _seconds?: number } | undefined;

  return {
    id,
    nom: (m.nom as string) ?? "",
    slug: (m.slug as string) ?? null,
    logo_url: (m.logo_url as string) ?? null,
    strip_url: (m.strip_url as string) ?? (m.strip_raw_url as string) ?? null,
    couleur_principale: (m.couleur_principale as string) ?? null,
    couleur_secondaire: (m.couleur_secondaire as string) ?? null,
    categorie: (m.categorie as string) ?? null,
    ville: (m.ville as string) ?? null,
    pays: (m.pays as string) ?? null,
    latitude: typeof m.latitude === "number" ? m.latitude : null,
    longitude: typeof m.longitude === "number" ? m.longitude : null,
    horaires,
    statut: statutOuverture(horaires ?? undefined, fermetures, tz, now),
    telephone: (m.telephone as string) ?? null,
    instagram: (m.instagram as string) ?? null,
    objectif_tampons: typeof m.objectif_tampons === "number" ? m.objectif_tampons : null,
    nom_recompense: (m.nom_recompense as string) ?? null,
    mode_recompense: (m.mode_recompense as string) ?? null,
    paliers: Array.isArray(m.paliers) ? (m.paliers as { tampons: number; recompense: string }[]) : null,
    palier_intermediaire: typeof m.palier_intermediaire === "number" ? m.palier_intermediaire : null,
    nom_recompense_petit: (m.nom_recompense_petit as string) ?? null,
    nom_recompense_grand: (m.nom_recompense_grand as string) ?? null,
    parrainage_actif: !!m.parrainage_actif,
    date_inscription: di?.seconds ?? di?._seconds ?? null,
  };
}
