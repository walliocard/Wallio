import type { Marchand, Client } from "@/lib/loyalty";

export interface PassData {
  backgroundColor: string;
  foregroundColor: string;
  labelColor: string;
  logo?: string;
  logoShape: "square" | "round";
  logoText: string;
  strip?: string;
  counterLabel: string;
  rewardLabel: string;
  memberLabel: string;
  clientName: string;
  auxiliaryFields: { label: string; value: string }[];
}

export function buildPassData(marchand: Marchand, client: Client): PassData {
  const mn = marchand as Record<string, unknown>;
  const isRound = mn.logo_shape === "round";
  return {
    backgroundColor: (mn.apple_bg_color as string) || marchand.couleur_principale || "#1C1C1E",
    foregroundColor: (mn.apple_fg_color as string) || "#FFFFFF",
    labelColor: (mn.apple_label_color as string) || "rgba(255,255,255,0.65)",
    logo: (isRound && mn.logo_circle_url)
      ? (mn.logo_circle_url as string)
      : (mn.logo_url as string | undefined),
    logoShape: isRound ? "round" : "square",
    logoText: marchand.nom,
    strip: (mn.strip_url as string) || undefined,
    counterLabel: (mn.apple_primary_label as string) || "TAMPONS",
    rewardLabel: (mn.apple_reward_label as string) || "RÉCOMPENSE",
    memberLabel: (mn.apple_member_label as string) || "MEMBRE",
    clientName: `${client.prenom}${client.nom ? " " + client.nom : ""}`,
    auxiliaryFields: [
      mn.apple_aux1_value ? { label: (mn.apple_aux1_label as string) || "", value: mn.apple_aux1_value as string } : null,
      mn.apple_aux2_value ? { label: (mn.apple_aux2_label as string) || "", value: mn.apple_aux2_value as string } : null,
    ].filter(Boolean) as { label: string; value: string }[],
  };
}
