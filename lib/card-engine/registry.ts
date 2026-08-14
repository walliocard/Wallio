import type { CardTemplate } from "./types";

import t01 from "./templates/01-aura";
import t02 from "./templates/02-noir";
import t03 from "./templates/03-ko";
import t04 from "./templates/04-studio";
import t05 from "./templates/05-atlas";
import t06 from "./templates/06-club";
import t07 from "./templates/07-bloom";
import t08 from "./templates/08-wave";
import t09 from "./templates/09-raw";
import t10 from "./templates/10-club90";
import t11 from "./templates/11-play";
import t12 from "./templates/12-mono";
import t13 from "./templates/13-oasis";
import t14 from "./templates/14-espresso";
import t15 from "./templates/15-roast";
import t16 from "./templates/16-barber";
import t17 from "./templates/17-tailor";
import t18 from "./templates/18-fashion";
import t19 from "./templates/19-gallery";
import t20 from "./templates/20-concrete";
import t21 from "./templates/21-neon";
import t22 from "./templates/22-chrome";
import t23 from "./templates/23-grid";
import t24 from "./templates/24-pixel";
import t25 from "./templates/25-poster";
import t26 from "./templates/26-stamp";
import t27 from "./templates/27-ticket";
import t28 from "./templates/28-newspaper";
import t29 from "./templates/29-organic";
import t30 from "./templates/30-clay";
import t31 from "./templates/31-botanica";
import t32 from "./templates/32-velvet";
import t33 from "./templates/33-silk";
import t34 from "./templates/34-thread";
import t35 from "./templates/35-signature";
import t36 from "./templates/36-seal";
import t37 from "./templates/37-label";
import t38 from "./templates/38-press";
import t39 from "./templates/39-stamped";
import t40 from "./templates/40-ink";
import t41 from "./templates/41-sun";
import t42 from "./templates/42-coast";
import t43 from "./templates/43-athletic";
import t44 from "./templates/44-run";
import t45 from "./templates/45-energy";
import t46 from "./templates/46-candy";
import t47 from "./templates/47-flux";
import t48 from "./templates/48-frame";
import t49 from "./templates/49-object";
import t50 from "./templates/50-wallio";

const REGISTRY: CardTemplate[] = [
  t50,
  t01, t02, t03, t04, t05, t06, t07, t08, t09, t10,
  t11, t12, t13, t14, t15, t16, t17, t18, t19, t20,
  t21, t22, t23, t24, t25, t26, t27, t28, t29, t30,
  t31, t32, t33, t34, t35, t36, t37, t38, t39, t40,
  t41, t42, t43, t44, t45, t46, t47, t48, t49,
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
