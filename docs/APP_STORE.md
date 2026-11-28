# Publication App Store — App client « Wallio »

> Nouvelle app App Store **dédiée clients** (distincte de « Wallio Pro »). Même code web (Next 16) packagé en app native via **Capacitor**.

## 1. Compte de démo review (DÉJÀ CRÉÉ EN PROD)
À coller dans **App Store Connect → App Review Information → Sign-In Required** :
- **Username (numéro)** : `+212600000000`
- **Password (PIN)** : `1234`

Le compte contient **3 cartes** :
- **MORI Matcha** (marchand de test réel de Karim) — 3/5, mode **flex** (cookie à 5, matcha à 10). `marchand_id = hBh27CytXMSl9b7cn64ezVmAwxx2`, `nfc_id = dada-np5g`.
- **Café Nova** (démo `is_test`, id `L2dZFYrlZgDewWFph6GL`) — 6/8 cyclique.
- **Douceurs du Jour** (démo `is_test`, id `i1N3AreTkxF5CKZg6HoT`) — récompense prête.

PIN stocké en bcrypt dans `wallio_users/+212600000000.pin_hash` ET sur chaque doc `clients` (le login lit wallio_users via check-user + verify-user-pin, repli sur clients via verify-pin).

**Lien de démo du scan** (ajouter un tampon SANS tag physique) : `https://app.walliocard.com/nfc/dada-np5g`

### Notes de review (texte à copier)
> Loyalty-card app. Sign in with phone number **+212600000000** and 4-digit PIN **1234** (no SMS required at login). Loyalty is "flex" (ex. MORI Matcha: a cookie at 5 stamps, a matcha at 10). To see a stamp being added WITHOUT a physical tag, open this link once signed in: **https://app.walliocard.com/nfc/dada-np5g** (same behavior as scanning an NFC tag / QR in-store). Stamps are normally added at the merchant counter.

### Marchands de démo
- Marqués `is_test: true` → **exclus de Découvrir ET de la Map** (filtre déployé, commit 75d2b15) → **invisibles pour les vrais clients**.
- Pour en ajouter d'autres : créer un `marchands` avec `is_test: true` + `actif: true`.
- Seed refait ? Supprimer `wallio_users/+212600000000` + les 3 clients + les 2 marchands démo, sinon le script s'arrête (garde-fou idempotence).

## 2. BLOQUANTS avant soumission (à faire)
1. **Texte de localisation (Info.plist natif)** : `NSLocationWhenInUseUsageDescription` (ex. « Wallio utilise votre position pour afficher les commerçants proches »). Requis par la carte Map / « Me localiser ». Sans ça : géoloc bloquée + risque de rejet.
2. **Badge Wallet officiel** : sur `app/c/[id]/page.tsx`, le bouton actuel « Ajouter à Apple/Google Wallet » est un **placeholder générique** (pastille noire + icône wallet générique + texte) — PAS le badge officiel (je n'ai pas reproduit le logo Apple, marque déposée). Apple **exige** son artwork officiel : télécharger « Add to Apple Wallet » sur developer.apple.com (+ badge Google Wallet), déposer dans `/public`, remplacer le bouton par `<img>`. Détection déjà fiable via `apns_push_token`.
3. **Étiquettes App Privacy** (App Store Connect) : déclarer numéro de téléphone, données d'usage, localisation. URL politique de confidentialité : `/privacy` (existe).
4. **Suppression de compte** : présente ✅ (Profil → « Supprimer mon compte »). Vérifier qu'elle marche de bout en bout.
5. **Contenu visible** : au moins des marchands avec GPS pour la Map (MORI en a). OK.

## 3. Déjà prêt côté natif (aucun code à changer)
- `viewport-fit: cover` (app/layout.tsx) + Capacitor `StatusBar.overlaysWebView: true` → **bannière plein cadre sous la Dynamic Island** en natif (comme Wallio Pro). En PWA la barre d'état reste opaque (theme-color #EEF2F7) — normal.
- **Splash** : NE PAS faire de splash web (double splash avec le natif). À faire au packaging : réutiliser `lib/wallio-splash.js` (système existant), cible de morph = logo de connexion `id="login-logo"` (déjà posé). Capacitor `@capacitor/splash-screen` déjà installé.

## 4. Packaging natif (nouvelle app)
- Nouveau **bundle id** iOS pour l'app client (distinct de Wallio Pro).
- `native-launch` actuel redirige vers `/dashboard` (Pro) → prévoir un lancement client vers `/mes-cartes`.
- Icône, screenshots, description, support URL.

## Historique utile
- Refonte + polish livrés (transitions, cache page marchand/profil, squelette, compteur animé, etc.). Voir `PROGRESS_APP_CLIENT.md` et `CHANGEMENTS_A_FAIRE.md`.
- Clé MapKit : voir mémoire `wallio_mapkit_key` (env Vercel posées).
