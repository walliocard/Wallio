import { test } from "node:test";
import assert from "node:assert/strict";
import { statutOuverture, type Horaires } from "./horaires.js";

const TZ = "UTC"; // déterministe pour les tests
// Lundi 2024-01-01 (getDay()=1) à l'heure voulue, en UTC.
const lundi = (hhmm: string) => new Date(`2024-01-01T${hhmm}:00Z`);
const mardi = (hhmm: string) => new Date(`2024-01-02T${hhmm}:00Z`);

test("aucun horaire → null", () => {
  assert.equal(statutOuverture({}, [], TZ, lundi("10:00")), null);
});

test("plage normale — ouvert", () => {
  const h: Horaires = { lun: [{ ouverture: "08:00", fermeture: "18:00" }] };
  const s = statutOuverture(h, [], TZ, lundi("10:00"))!;
  assert.equal(s.ouvert, true);
  assert.equal(s.etat, "ouvert");
  assert.equal(s.fermeA, "18:00");
});

test("plage normale — fermé avant ouverture, ouvre aujourd'hui", () => {
  const h: Horaires = { lun: [{ ouverture: "08:00", fermeture: "18:00" }] };
  const s = statutOuverture(h, [], TZ, lundi("07:00"))!;
  assert.equal(s.ouvert, false);
  assert.equal(s.ouvreA, "08:00");
  assert.equal(s.ouvreJour, "aujourd'hui");
});

test("deux plages — fermé dans la pause déjeuner", () => {
  const h: Horaires = { lun: [{ ouverture: "08:00", fermeture: "14:00" }, { ouverture: "16:00", fermeture: "22:00" }] };
  assert.equal(statutOuverture(h, [], TZ, lundi("15:00"))!.ouvert, false);
  assert.equal(statutOuverture(h, [], TZ, lundi("17:00"))!.ouvert, true);
  assert.equal(statutOuverture(h, [], TZ, lundi("09:00"))!.fermeA, "14:00");
});

test("plage franchissant minuit — ouvert après minuit grâce à la veille", () => {
  const h: Horaires = { lun: [{ ouverture: "18:00", fermeture: "02:00" }] };
  // Lundi 23:00 : ouvert, ferme à 02:00
  const soir = statutOuverture(h, [], TZ, lundi("23:00"))!;
  assert.equal(soir.ouvert, true);
  assert.equal(soir.fermeA, "02:00");
  // Mardi 01:00 : encore ouvert grâce à la plage de lundi
  const nuit = statutOuverture(h, [], TZ, mardi("01:00"))!;
  assert.equal(nuit.ouvert, true);
  assert.equal(nuit.fermeA, "02:00");
});

test("jour fermé (tableau vide) → prochaine ouverture", () => {
  const h: Horaires = { lun: [], mar: [{ ouverture: "09:00", fermeture: "17:00" }] };
  const s = statutOuverture(h, [], TZ, lundi("10:00"))!;
  assert.equal(s.ouvert, false);
  assert.equal(s.ouvreJour, "demain");
  assert.equal(s.ouvreA, "09:00");
});

test("fermeture exceptionnelle — fermé même pendant les horaires", () => {
  const h: Horaires = { lun: [{ ouverture: "08:00", fermeture: "18:00" }], mar: [{ ouverture: "08:00", fermeture: "18:00" }] };
  const s = statutOuverture(h, ["2024-01-01"], TZ, lundi("10:00"))!;
  assert.equal(s.ouvert, false);
  assert.equal(s.ouvreJour, "demain"); // mardi
});

test("ferme bientôt — moins de 30 min avant fermeture", () => {
  const h: Horaires = { lun: [{ ouverture: "08:00", fermeture: "18:00" }] };
  const s = statutOuverture(h, [], TZ, lundi("17:45"))!;
  assert.equal(s.etat, "ferme_bientot");
  assert.equal(s.ouvert, true);
});
