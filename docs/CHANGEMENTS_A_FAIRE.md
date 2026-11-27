# Changements validés à coder (app client Wallio) — en attente de GO

Statut : validés en discussion, PAS encore codés. À faire une fois le dernier point tranché.
Contexte : vrais marchands/clients en prod → prudence, surtout sur le flux de scan.

## 1. Badge Wallet officiel sur la page marchand `/c/[id]`
- Remplacer la petite action « Dans le Wallet / Ajouter » par le **vrai badge officiel Apple « Add to Apple Wallet »** (et **« Add to Google Wallet »** sur Android) — plus explicite ET **exigé par Apple** pour la review.
- Affiché en **gros, pleine largeur, sous les 3 actions** (Itinéraire/Appeler/Instagram restent dans la grille) **quand la carte n'est PAS dans le Wallet**.
- Quand déjà dans le Wallet → petit « ✓ Dans Apple Wallet » discret (ou lien « Voir »).
- **Détection fiable via `apns_push_token`** (pas `wallet_type` qui ne se met pas toujours à jour).

## 2. Onglet « Map » séparé (4 onglets)
- Barre : `Mes cartes` · `Messages` · **`Map`** · `Découvrir` (nom validé = **Map**).
- **Découvrir** redevient **liste seule** (cartes par ville) — retirer la bascule Liste/Carte.
- **Map** = onglet carte plein écran (entre Messages et Découvrir), tous les marchands en épingles-logo.
- Filtres catégorie dispos sur Map et Découvrir.
- Attention : 4 onglets = barre plus serrée sur petit écran (libellés courts).

## 3. Page de scan « transitoire » (anti-résurgence historique)
- Après un **tampon crédité** sur `/nfc/[id]`, faire **`history.replaceState(null,'','/mes-cartes')`** — change l'URL + le back-stack SANS naviguer (le résultat reste affiché, logique tampon INCHANGÉE).
- But : la page de scan ne « s'installe » plus dans l'historique → remonte beaucoup moins quand on tape « Wallio », et le bouton retour / rechargement ne ramènent plus sur /nfc (donc pas de re-tampon accidentel).
- **UNIQUEMENT sur l'écran résultat (tampon crédité)** — pas inscription/récupération/parrainage.
- Ne touche NI au dead flag, NI à l'anti-doublon, NI à l'affichage. 1 ligne, réversible en 1 commit.
- Limite assumée : ne supprime pas l'URL de l'auto-complétion Safari (aucune API ne le permet) ; règle net le back/reload.
- Décisions liées : on NE force PAS de minimum d'anti-doublon ; tags NFC dynamiques (NTAG 424/SUN) = vrai verrou inviolable, pour plus tard.

## 4. Rappel « dernière étape » sur `/cartes` (page du QR comptoir admin)
- Contexte : la carte admin imprimée a un **QR → `/cartes/[nfc_id]`** = crée SEULEMENT le compte (0 tampon). Le tampon est volontairement un acte contrôlé par le marchand (tag NFC OU barista scanne la carte Wallet). On NE veut PAS d'auto-tampon (le marchand garde le contrôle).
- Problème : le client scanne le QR, sa carte est créée, mais il peut **repartir sans son 1er tampon** (oublie la 2ᵉ étape).
- Solution validée : un **bandeau de rappel** sur l'écran carte de `/cartes`, couleur du marchand, sous la carte.
  - **Quand** : tant que la carte a **0 tampon** (Option A).
  - **Où** : uniquement sur `/cartes` (pas Mes cartes / page marchand pour l'instant).
  - **Contenu** (neutre) : titre « Plus qu'une étape ! » + « Présentez votre carte au comptoir pour recevoir votre premier tampon. »
  - **Pas de bouton tampon, pas d'automatisation** — simple nudge. Zéro emoji.
- Vérifié : QR admin = `/cartes/` (create only), NFC + QR dashboard = `/nfc/` (tampon). `/cartes` pose bien le WALLET_KEY.
