# Refonte App Client Wallio — Progression

Source : `~/Downloads/wallio-app-client-pack` (PROMPT_1_APP_CLIENT.md, PROMPT_2_WALLIO_PRO_ET_ADMIN.md, maquettes/).
Règle : étape par étape, arrêt + validation « ok » après chacune. Aucune migration Firestore sans accord (montrer le changement de schéma avant).
Note : le pack dit « SQL/tables » mais la base est **Firestore** (collections `marchands`, `clients`, `databases`).

## Décisions
- **Nouvelle app App Store dédiée client.** La PWA client refondue deviendra une NOUVELLE app « Wallio » (clients uniquement), distincte de « Wallio Pro » (commerçant). Deux apps séparées sur le store.
- **Géoloc = seul coût App Store.** Tout regrouper (étapes 4-5 : Découvrir liste+carte+distances) en UN seul passage natif (plugin `@capacitor/geolocation` + textes Info.plist). Reste (1-3, 6-9) = web à distance, sans review Apple.
- Routes nouvelles sous domaine racine (server.url Capacitor casse avec un chemin).

## Ordre d'exécution
1. [en cours] PROMPT 2 — données (horaires, catégorie, Instagram, GPS, statut, API publique)
2. [à faire] PROMPT 1 — refonte UI app client (9 étapes)

---

## PROMPT 2 — Wallio Pro + admin

### Étape 0 — État des lieux (lecture seule) — FAIT, en attente validation Karim
Champs du document `marchands` (ID = UID Firebase Auth) :

| Champ demandé | Existe ? | Stockage | Modifiable par |
|---|---|---|---|
| Catégorie | ❌ manquant | — | à créer (Wallio Pro) |
| Horaires | ❌ manquant | — | à créer (Wallio Pro) |
| Instagram | ❌ manquant | — | à créer (Wallio Pro) |
| Téléphone établissement | ✅ | `marchands.telephone` | admin (adminAllowed) + saisie création |
| Ville | ✅ | `marchands.ville` | admin + création |
| Pays | ✅ | `marchands.pays` | admin |
| Lien Google Maps | ✅ brut | `marchands.maps_url` | admin (adminAllowed) |
| Latitude/Longitude (découvrir) | ❌ pas parsé | — | à créer (admin, extraction depuis maps_url) |
| Date de création marchand | ✅ | `marchands.date_inscription` (serverTimestamp) | auto à la création → sert au badge « Nouveau » |
| Slug marchand | ❌ | — | à décider (route /c/[slug]) |
| Bannière / Logo | ✅ | `strip_url` / `logo_url` | marchand |
| Couleur | ✅ | `couleur_principale` / `couleur_secondaire` | marchand |

Notes :
- `maps_url` est stocké mais **jamais parsé** en lat/lng ; aujourd'hui juste un lien (`mes-cartes` le passe en `mapsUrl`).
- Les `latitude/longitude` présents dans le code concernent **Apple/Google Wallet** (relevance écran verrouillé), pas la découverte géographique. À ne pas confondre.
- Pas de champ `slug` marchand → à créer pour `/c/[slug]` (ou utiliser l'ID).
- Manque donc à créer : **categorie, horaires, instagram, latitude, longitude (parsés), slug**.

### Étape 1 — Wallio Pro section « Établissement » — FAIT, en attente test Karim
Fichiers modifiés :
- `app/api/marchand/save/route.ts` : whitelist +4 champs (`categorie`, `instagram`, `horaires`, `fermetures_exceptionnelles`).
- `app/dashboard/reglages/page.tsx` : helpers module (CATEGORIES, JOURS, statutOuverture préview, instagramUsername), composant `HorairesEditor`, états + payload, UI (catégorie/Instagram, horaires par jour + « Appliquer lundi aux jours de semaine », fermetures exceptionnelles, aperçu fiche Découvrir + complétude).
Nouveaux champs Firestore `marchands` (tous optionnels) :
- `categorie: string` (clé parmi CATEGORIES)
- `instagram: string` (username nettoyé)
- `horaires: { lun..dim: {ouverture,fermeture}[] }` (plage franchissant minuit = fermeture<=ouverture)
- `fermetures_exceptionnelles: string[]` (dates ISO)
Note : `statutOuverture` est une version préview locale ; la version partagée + testée est à faire à l'Étape 3.
Warnings eslint préexistants non touchés (Date.now L312, setState-in-effect L982).
### Étape 2 — Admin coordonnées GPS (parse maps_url) — FAIT, en attente test Karim
Fichiers :
- `lib/geo.ts` (NOUVEAU) : parseLatLng (formats !3d/!4d, @lat,lng, ?q/ll/query/destination/center), resolveMapsUrl (suit redirection liens courts maps.app.goo.gl/goo.gl), extractLatLng.
- `app/api/admin/update-marchand/route.ts` : import geo ; whitelist +latitude/longitude ; extraction auto à l'enregistrement de maps_url (manuel prioritaire) ; retourne { geo, geoError }.
- `app/api/admin/recalc-geo/route.ts` (NOUVEAU) : POST, réextrait pour tous, retourne { updated, failed[] }.
- `app/admin/page.tsx` : type Marchand +maps_url/latitude/longitude ; états locLat/locLng/geoMsg/recalcing ; saveLocalisation lit la géo du retour ; saveCoordsManuelles ; recalcGeoTous ; UI carte de vérification (iframe OpenStreetMap, sans clé), champs lat/lng manuels, bouton recalcul global.
Nouveaux champs Firestore `marchands` : `latitude: number|null`, `longitude: number|null`.
Note : carte de vérif = OpenStreetMap embed (pas de clé). MapKit (app client Découvrir) viendra à l'Étape 5 du Prompt 1.
Lint : erreurs signalées = préexistantes (SLabel in-render, Date.now), pas mes lignes.
### Étape 3 — API publique marchand + liste Découvrir + statut d'ouverture — FAIT, en attente test Karim
Fichiers :
- `lib/horaires.ts` (NOUVEAU) : fonction partagée `statutOuverture` (états ouvert/ferme_bientot/ferme + prochaine ouverture), gère 1 plage, 2 plages, après minuit, jour fermé, fermeture exceptionnelle. Exporte JOUR_ORDER, types Horaires/Plage/Statut.
- `lib/horaires.test.ts` (NOUVEAU) : 8 tests node:test, tous verts. Lancer : `npx tsc lib/horaires.ts lib/horaires.test.ts --outDir /tmp/htest --module nodenext --target es2022 --moduleResolution nodenext --skipLibCheck && node --test /tmp/htest/`
- `app/dashboard/reglages/page.tsx` : REFACTOR — supprime la copie préview locale, importe `statutOuverture`/`JOUR_ORDER`/types depuis lib/horaires (source unique).
- `lib/marchand-public.ts` (NOUVEAU) : `toMarchandPublic()` = projection champs publics + statut calculé. Jamais email/perso/clients.
- `app/api/public/marchand/[id]/route.ts` (NOUVEAU) : GET par id OU slug, 404 si inactif.
- `app/api/public/marchands/route.ts` (NOUVEAU) : GET liste actifs + filtre ?categorie=.
Note : pas de champ `adresse` dans le schéma (seulement `ville`) ; `slug` pas encore créé (route /c/[slug] = Prompt 1). Aucune dépendance de test ajoutée (node:test + tsc ponctuel).

### Reste côté App Store (fin Prompt 2)
Ces changements sont tous web/serveur → PAS de nouvelle version native requise. L'app client (future app Wallio) consommera ces routes à distance.

---

## PROMPT 1 — App client (après Prompt 2)
Prompt 2 terminé (étapes 0-3).

### Étape 0 — État des lieux (lecture seule) — FAIT
- **Parrainage** : lien `/ref/{wallet_id parrain}` → vérifie parrainage_actif → redirige flux inscription NFC avec parrain_wallet_id. Filleul créé avec tampons:1 + parrain_id + parrain_recompense:false ; au 1er scan, verifierParrainage() crédite +1 au parrain (traiterParrainage, bypass anti-doublon) et pose parrain_recompense:true. Net 1 tampon chacun. PAS de compteur de parrainages réussis (dérivable : clients where parrain_id==X && parrain_recompense==true → index requis).
- **Messages** : PAS de collection ; tableau `notifs: {id,title,body,marchandNom,marchandId,sentAt,read}[]` sur chaque doc `clients`. État lu/non lu EXISTE (read) et est persisté (marqué lu à l'ouverture onglet Messages → réécrit clients/{id}.notifs). Étape 6 = regroupement UI, aucune migration.
- **Historique** : sous-collection `marchands/{id}/historique` {client_id, client_prenom, client_nom, tampons_apres, tampons_avant?, recompense, type, added_by, created_at}. Types : visite/ok/qr_gerant/apple (tampon), recompense/choix_gerant (validée équipe), auto_validation (délivrée au scan suivant). LACUNE : tampon de parrainage NON logé (traiterParrainage n'écrit rien) → à ajouter pour « Vos visites ».
- **Manques** : slug marchand (/c/[slug]), adresse précise (ville seule), compteur parrainages, event historique parrainage, page filleul riche (Étape 7), géoloc client (Étapes 4-5 natif).

### Décisions Prompt 1
- **Pas de changement de numéro** (validé Karim). Le numéro est identité multi-docs ; on NE migre PAS. Profil affiche le numéro masqué en lecture seule + bouton « Se déconnecter » (= ancien bouton « Changer » = handleLogout). L'anniversaire n'est PAS un nouveau champ : `date_naissance` existe déjà sur clients.

### Étape 1 — En-tête + page Profil — FAIT, en attente test Karim
Fichiers :
- `app/profil/page.tsx` (NOUVEAU) : route /profil. Avatar initiale, prénom, numéro masqué (lecture seule). Groupes : Mon compte (Prénom éditable→maj tous les docs, Téléphone lecture seule, Anniversaire=date_naissance éditable), Notifications (toggle global = désactive tout quand off ; « Par commerce » déplie la liste → liens vers /preferences/[walletId] existant), Préférences (Langue=Français, structure prête), Informations (Confidentialité/CGU/Mentions → /privacy /terms /legal), Se déconnecter, Supprimer mon compte (rouge, modal, /api/delete-account).
- `app/mes-cartes/page.tsx` : téléphone retiré de l'en-tête ; bouton « Changer » remplacé par avatar rond (initiale, lavande) → /profil ; onglet Messages = pastille nombre de non-lus ; liens légaux + lien/modal suppression retirés du bas (déplacés dans Profil) ; handleLogout/handleDeleteAccount + états supprimés (déplacés).
Décisions : pas de changement de numéro (lecture seule) ; anniversaire = date_naissance existant (pas de nouveau champ).
Note : activation des notifs par appareil reste gérée dans /preferences (token FCM) ; le toggle global ne fait que désactiver. Lint : erreurs = règle setState-in-effect, pattern identique à l'existant, non bloquant.

### Étape 2 — Mes cartes — FAIT
`mes-cartes` : CardItem refondu (haut coloré gardé ; bas = « Encore N tampons »/« Première visite » + nom récompense ; pastille « Récompense prête »). Tri récompenses prêtes puis restants croissants, sans titres de ville. Carte entière = lien vers /c/[marchandId]. Helper cardRestants().

### Étape 3 — Page marchand membre (+ variante non-membre Étape 4) — FAIT
- `app/c/[id]/page.tsx` (NOUVEAU) : bannière + boutons ronds, logo/nom/statut, 4 actions (Itinéraire iOS/Android, Appeler, Instagram, Wallet ; masquées si données absentes), bloc récompense prête (sans bouton), progression (cyclique/progressif/flex), parrainage (invite + compteur), infos (mini-carte OSM + horaires semaine jour en évidence + téléphone), Vos visites (historique), messages, notifs commerce, Quitter le programme. Variante non-membre = « Comment ça marche » + bouton Rejoindre.
- `app/api/public/carte/route.ts` (NOUVEAU) : historique de SA carte + compteur parrainages (vérif walletId).
- `app/api/public/quitter/route.ts` (NOUVEAU) : supprime 1 carte (vérif walletId).

### Étape 6 — Messages regroupés — FAIT
`mes-cartes` : messages groupés par commerce (logo, nom, dernier titre, date, pastille non-lus), dépli au tap, marquage lu par commerce (markCommerceRead). Suppression de l'effet « tout lu à l'ouverture ».

### Étape 7 — Page filleul — FAIT
`app/ref/[walletId]/page.tsx` : remplace la redirection par une vraie landing (bannière, « Prénom vous invite », « Rejoignez X », bloc +1 tampon, 3 étapes, bouton fixe « Rejoindre » + « Gratuit · sans app »). Bouton → /nfc/[nfc]?ref= (attribution inchangée).

### Étape 8 — Connexion — FAIT
`mes-cartes` écran login : pile de 3 mini-cartes inclinées sous le logo ; sélecteur pays élargi (indicatif complet, sans troncature). Reste inchangé.

### RESTE À FAIRE
- **Étape 4 (Découvrir liste)** : FAIT. `mes-cartes` : MarchandDiscover enrichi (categorie, banner, objectif, reward, lat/lng, dateInscription) SANS toucher rejoindre() (n'utilise que id/nom/logo/couleur). Rendu refondu : titre « Par ville », sélecteur Liste/Carte, filtres catégorie en pastilles (Tous + catégories présentes), cartes-bannières (bannière, badge « Nouveau » <30j, logo chevauchant, cat·ville, « X tampons → récompense », bouton Rejoindre lavande #4B4FD6), tap carte → /c/[id]. Vue Carte = placeholder (Étape 5). RESTE : distances (géoloc, Étape 5) et tri par distance ; titre « Près de vous » quand géoloc autorisée.
- **Étape 5 (Découvrir carte MapKit)** : CODÉ, en attente clé Apple. `app/api/public/mapkit-token/route.ts` (JWT ES256 via node:crypto, env APPLE_MAPKIT_KEY_ID/TEAM_ID/PRIVATE_KEY, 501 si non configuré). `components/DiscoverMap.tsx` (MapKit JS chargé dynamiquement, épingles MarkerAnnotation + clustering, fiche au tap avec Itinéraire + Voir la carte/Rejoindre, Me localiser via navigator.geolocation). Branché dans la vue Carte de Découvrir. Pas de page test (décision Karim). Tri Découvrir reste alphabétique par ville (pas de distance, décision Karim). Fonctionne dès que les 3 env vars sont posées.
- **Étape 9 (hors ligne)** : service worker + bandeau offline. NON FAIT — risqué sur PWA prod, à traiter délibérément.
- Lacune connue : tampon de parrainage toujours pas écrit dans l'historique (traiterParrainage) → « Tampon de parrainage » n'apparaîtra dans « Vos visites » qu'une fois ce log ajouté.
