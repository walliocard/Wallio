import type { CardTemplate } from "./types";

import t01 from "./templates/01-aura";
import t02 from "./templates/02-noir";
import t03 from "./templates/03-ko";
import t04 from "./templates/04-studio";
import t08 from "./templates/08-wave";
import t09 from "./templates/09-raw";
import t14 from "./templates/14-espresso";
import t27 from "./templates/27-ticket";
import t48 from "./templates/48-frame";
import t50 from "./templates/50-wallio";

/* ── Registry ── */
const REGISTRY: CardTemplate[] = [
  t50, // Wallio Signature — premier par défaut
  t01,
  t02,
  t03,
  t04,
  t08,
  t09,
  t14,
  t27,
  t48,
  // Phase 2 : 05-atlas, 06-club, 07-bloom, 10-club90, 11-play...
  // Phase 3 : 12-mono, 13-oasis, 15-roast, 16-barber...
];

export function getAllTemplates(): CardTemplate[] {
  return REGISTRY;
}

export function getTemplate(id: string): CardTemplate | undefined {
  return REGISTRY.find(t => t.id === id);
}

export function getTemplatesByCategory(category: string): CardTemplate[] {
  if (category === "all") return REGISTRY;
  return REGISTRY.filter(t => t.categories.includes(category as never));
}

export function getDefaultTemplate(): CardTemplate {
  return REGISTRY[0];
}
