// Statut d'ouverture d'un commerçant — fonction partagée (Wallio Pro, app client, API publique).
// Gère : plage normale, deux plages, plage franchissant minuit, jour fermé, fermeture exceptionnelle.

export type Plage = { ouverture: string; fermeture: string };
export type Horaires = Record<string, Plage[]>;
export type EtatOuverture = "ouvert" | "ferme_bientot" | "ferme";
export type Statut = {
  ouvert: boolean;
  etat: EtatOuverture;
  label: string;
  fermeA?: string;   // "HH:MM" si ouvert
  ouvreA?: string;   // "HH:MM" si fermé et une prochaine ouverture existe
  ouvreJour?: string; // "aujourd'hui" | "demain" | nom du jour
};

export const JOUR_ORDER = ["dim", "lun", "mar", "mer", "jeu", "ven", "sam"]; // Date.getDay() : 0 = dimanche
export const JOUR_LABELS: Record<string, string> = {
  lun: "lundi", mar: "mardi", mer: "mercredi", jeu: "jeudi", ven: "vendredi", sam: "samedi", dim: "dimanche",
};

const FERME_BIENTOT_MIN = 30; // seuil "ferme bientôt"

export const toMin = (t: string) => {
  const [h, m] = (t || "0:0").split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
};
export const fmtMin = (m: number) =>
  `${String(Math.floor(((m % 1440) + 1440) % 1440 / 60)).padStart(2, "0")}:${String(((m % 60) + 60) % 60).padStart(2, "0")}`;

// Jour (0=dim) / minutes depuis minuit / date "YYYY-MM-DD" dans un fuseau donné.
export function tzParts(tz: string, d: Date = new Date()) {
  try {
    const parts = new Intl.DateTimeFormat("en-GB", {
      timeZone: tz, hour12: false, weekday: "short",
      hour: "2-digit", minute: "2-digit", year: "numeric", month: "2-digit", day: "2-digit",
    }).formatToParts(d);
    const get = (t: string) => parts.find(p => p.type === t)?.value || "";
    const wmap: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
    return {
      dayIdx: wmap[get("weekday")] ?? 0,
      minutes: parseInt(get("hour")) * 60 + parseInt(get("minute")),
      dateStr: `${get("year")}-${get("month")}-${get("day")}`,
    };
  } catch {
    return { dayIdx: 0, minutes: 0, dateStr: "" };
  }
}

// Retourne null si aucun horaire n'est renseigné (section masquée côté client).
export function statutOuverture(
  horaires: Horaires | undefined,
  fermetures: string[] = [],
  tz: string,
  now: Date = new Date(),
): Statut | null {
  const h = horaires || {};
  if (!JOUR_ORDER.some(k => (h[k] ?? []).length > 0)) return null;

  const { dayIdx, minutes, dateStr } = tzParts(tz, now);
  const keyOf = (idx: number) => JOUR_ORDER[((idx % 7) + 7) % 7];
  const closedToday = fermetures.includes(dateStr);

  // Ouvert maintenant ? (plages d'aujourd'hui + plage d'hier qui franchit minuit)
  let closeAt: number | null = null;
  if (!closedToday) {
    for (const p of h[keyOf(dayIdx)] ?? []) {
      const o = toMin(p.ouverture), f = toMin(p.fermeture);
      if (f > o) { if (minutes >= o && minutes < f) closeAt = f; }
      else { if (minutes >= o) closeAt = f + 1440; } // franchit minuit → ferme demain
    }
  }
  for (const p of h[keyOf(dayIdx - 1)] ?? []) {
    const o = toMin(p.ouverture), f = toMin(p.fermeture);
    if (f <= o && minutes < f) closeAt = f;
  }

  if (closeAt != null) {
    const reste = closeAt - minutes;
    const fermeA = fmtMin(closeAt);
    if (reste <= FERME_BIENTOT_MIN) {
      return { ouvert: true, etat: "ferme_bientot", label: `Ferme bientôt · ${fermeA}`, fermeA };
    }
    return { ouvert: true, etat: "ouvert", label: `Ouvert · jusqu'à ${fermeA}`, fermeA };
  }

  // Prochaine ouverture (7 jours glissants)
  for (let off = 0; off < 8; off++) {
    const key = keyOf(dayIdx + off);
    const plages = [...(h[key] ?? [])].sort((a, b) => toMin(a.ouverture) - toMin(b.ouverture));
    for (const p of plages) {
      const o = toMin(p.ouverture);
      if (off === 0 && (closedToday || o <= minutes)) continue;
      const quand = off === 0 ? "aujourd'hui" : off === 1 ? "demain" : JOUR_LABELS[key];
      return { ouvert: false, etat: "ferme", label: `Fermé · ouvre ${quand} à ${fmtMin(o)}`, ouvreA: fmtMin(o), ouvreJour: quand };
    }
  }
  return { ouvert: false, etat: "ferme", label: "Fermé" };
}
