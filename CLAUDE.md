@AGENTS.md

# Wallio — Documentation de référence complète

SaaS B2B de cartes de fidélité digitales (Apple/Google Wallet) pour prestataires de services.
Fondateur/CEO : Karim. Claude = CTO/co-fondateur technique.
**Règle de collaboration** : expliquer avant de coder, avancer brique par brique, ça marche simplement > perfectionnisme.

---

## Apps et URLs

| App | URL prod | URL dev |
|---|---|---|
| Dashboard marchand | app.wallio.ma | wallio-seven.vercel.app |
| Super admin | admin.wallio.ma | wallio-seven.vercel.app/admin |
| NFC client | app.wallio.ma/nfc/[nfc_id] | wallio-seven.vercel.app/nfc/[nfc_id] |
| QR client | app.wallio.ma/client/[wallet_id] | wallio-seven.vercel.app/client/[wallet_id] |

> Domaine wallio.ma pas encore acheté. Tout passe par wallio-seven.vercel.app.

---

## Stack

- **Next.js 16** App Router → Vercel (repo `walliocard/Wallio`, branche `main`)
- **Firebase** (projet `wallio-card`) : Firestore + Auth + Storage + FCM
- **Packages clés** : firebase, firebase-admin, jsqr, qrcode, jszip, html2canvas, uuid, @anthropic-ai/sdk
- **Dev local** : `/Users/karim/Desktop/wallio/app/`

---

## Firestore — Collections et schémas

### Collection `marchands` — document ID = UID Firebase Auth

```
nom: string
actif: boolean                    ← activé par super admin uniquement
objectif_tampons: number          ← mode cyclique
nom_recompense: string
mode_recompense: "cyclique" | "progressif"
paliers?: { tampons: number; recompense: string }[]   ← mode progressif
icone_tampons: string             ← emoji ex: "☕"
couleur_principale: string        ← hex
couleur_secondaire: string        ← hex
anti_doublon_delai: number        ← secondes (900, 3600, 14400, 28800, 86400, custom)
fuseau_horaire: string            ← ex: "Africa/Casablanca"
nfc_id?: string                   ← géré par admin uniquement, pas le marchand
logo_url?: string                 ← Firebase Storage URL
strip_url?: string                ← bannière Apple Wallet
double_tampons_fin?: string       ← ISO date fin promo double tampons
notif_actif?: boolean
notif_message?: string
automatisations?: {
  anniversaire?: { actif: boolean; jours_avant: number; message: string }
  relance?: { actif: boolean; delai_jours: number; message: string }
}
# Champs Apple Wallet
apple_bg_color, apple_fg_color, apple_label_color
apple_primary_label, apple_reward_label, apple_member_label
apple_header_label, apple_header_value
apple_aux1_label, apple_aux1_value
apple_aux2_label, apple_aux2_value
apple_back_info, apple_description
stamps_on_strip, strip_stamp_style, stamp_text, stamp_color
stamp_text_bold, stamp_text_italic, stamp_text_size
stamp_position, stamp_size_preset, stamp_thickness, stamp_logo_opacity
milestone_rewards
```

### Collection `clients` — document ID = clientId (UUID)

```
prenom: string
nom: string
telephone: string                 ← format complet avec indicatif ex: "+212612345678"
date_naissance: string            ← format "YYYY-MM-DD"
wallet_id: string                 ← UUID unique, sert de serialNumber Apple Wallet
marchand_id: string               ← UID du marchand
tampons: number
niveau?: number                   ← palier actuel (mode progressif)
paliers_valides?: boolean[]       ← paliers déjà validés
date_inscription?: Timestamp
derniere_visite?: Timestamp       ← utilisé pour segments actifs/inactifs (seuil 30 jours)
recompense_en_attente?: boolean
fcm_token?: string                ← token FCM pour notifs push web
apns_push_token?: string          ← token APNS pour mise à jour Apple Wallet
apns_device_lib_id?: string
apns_last_updated?: string
wallet_type?: "apple" | "google"
birthday_bonus?: boolean          ← posé par cron anniversaires
birthday_bonus_used?: boolean     ← évite le doublon anniversaire sur l'année
relance_pending?: boolean         ← posé par cron relances
```

> Un même client chez deux marchands = deux documents séparés (wallet_id différents).

---

## lib/loyalty.ts — Fonctions métier

```typescript
// Marchands
getMarchandByNfcId(nfcId: string): Promise<Marchand | null>
getMarchandById(id: string): Promise<Marchand | null>
genererNfcId(marchandId: string): Promise<string>  ← ADMIN UNIQUEMENT

// Clients
getClientByWalletId(walletId: string, marchandId: string): Promise<Client | null>
getClientByTelephone(telephone: string, marchandId: string): Promise<Client | null>
  // telephone doit inclure indicatif ex: "+212612345678"
creerClient({ prenom, nom, telephone, date_naissance, marchand_id }): Promise<{ clientId, walletId }>
  // crée avec tampons=0, niveau=0, date_inscription=now

// Tampons
ajouterTampon(client, marchand): Promise<TamponResult>
  // Gère anti-doublon, double_tampons_fin, détecte récompense
  // Met à jour derniere_visite
validerRecompense(clientId, marchand, niveau, paliers_valides): Promise<void>
setTampons(clientId, tampons): Promise<void>  ← modification manuelle

// Utilitaires
formatTemps(secondes: number): string          // "12 min", "3 h"
formatTempsDepuis(ts?: Timestamp): string      // "il y a 2 h"
WALLET_KEY(marchandId: string): string         // clé localStorage: "wallio_{marchandId}"
```

### Type TamponResult
```typescript
| { type: "ok"; tampons: number; objectif: number; prenom: string }
| { type: "recompense"; prenom: string; nom_recompense: string; tampons: number }
| { type: "anti_doublon"; prenom: string; secondes_restantes: number }
| { type: "not_found" }
```

---

## Routes API

### Admin (auth : cookie httpOnly `wallio_admin`)
| Route | Méthode | Corps | Retour |
|---|---|---|---|
| /api/admin/login | POST | `{ email, password }` | `{ ok: true }` + cookie |
| /api/admin/check | GET | — | `{ ok: true/false }` |
| /api/admin/create-marchand | POST | `{ nom, email, password }` | `{ uid, nfc_id }` |
| /api/admin/logout | POST | — | `{ ok: true }` |

### Apple Wallet (protocole PassKit Apple)
| Route | Méthode | Auth | Action |
|---|---|---|---|
| /api/apple-wallet/generate/[walletId] | GET | — | Génère .pkpass binaire |
| /api/apple-wallet/push-update | POST | — | `{ walletId }` → signal APNS |
| /api/apple-wallet/passes/[type]/[serial] | GET | ApplePass token | Retourne pass mis à jour |
| /api/apple-wallet/devices/.../[serial] | POST | ApplePass token | Enregistre pushToken |
| /api/apple-wallet/devices/.../[serial] | DELETE | ApplePass token | Désenregistre |
| /api/apple-wallet/log | POST | — | Logs Apple |

### Google Wallet
| Route | Méthode | Action |
|---|---|---|
| /api/google-wallet/generate/[walletId] | GET | Redirect vers pay.google.com/gp/v/save/{jwt} |
| /api/google-wallet/push-update | POST | Fire-and-forget, retourne `{ pushed: false }` |

### Notifications
```
POST /api/notify
Body: { title, body, segment: "tous"|"actifs"|"inactifs", marchandId, idToken, logoUrl?: string }
Auth: idToken Firebase vérifié côté serveur
Segmentation: actifs = derniere_visite ≤ 30j, inactifs > 30j
Icône FCM: logoUrl si fourni, sinon /icon-192.png
Retour: { sent, failed, total }
```

### Divers
```
POST /api/suggest-colors  — Body: { description } → Claude Haiku → 3 palettes
GET  /api/firebase-sw     — Service worker FCM (JS injecté avec config Firebase)
```

### Crons Vercel (auth : header `Authorization: Bearer {CRON_SECRET}`)
```
GET /api/cron/anniversaires  — 08:00 UTC quotidien
GET /api/cron/relances       — 09:00 UTC quotidien
```
> ⚠️ Les crons tournent en UTC. Le fuseau horaire des marchands n'est PAS encore appliqué dans les crons — à corriger.

---

## Flux NFC client (états de /nfc/[marchandId])

```
loading
  → getMarchandByNfcId() + vérif actif
  → localStorage[WALLET_KEY] existe ?
      OUI → getClientByWalletId() → ajouterTampon() → result
      NON → inscription

inscription (formulaire: prénom, nom, téléphone+indicatif, date naissance)
  → creerClient() → localStorage.setItem(walletId) → ajouterTampon() → carte

recuperation (formulaire: indicatif+téléphone)
  → getClientByTelephone("+212..." + num) → localStorage.setItem → carte

carte (succès)
  → AppleWalletCard preview
  → [Ajouter à Apple Wallet] → GET /api/apple-wallet/generate/[walletId]
  → [Ajouter à Google Wallet] → GET /api/google-wallet/generate/[walletId]
  → Prompt notifications FCM si notif_actif=true

result
  → ok: tampons + objectif
  → recompense: bouton "Valider" (pour marchand — validerRecompense)
  → anti_doublon: compte à rebours
  → not_found: erreur

erreur
```

---

## Design / DA

### Direction artistique globale Wallio
- Fond clair `#F5F5F7`, fond sombre `#0A0A0A` / `#0B0B0D`
- Accent : `#007AFF` (bleu) en mode clair, `#0A84FF` en sombre
- Logo Wallio : dégradé `#007AFF → #8B5CF6` (bleu-violet)
- Police : Geist / Inter
- Style : minimaliste premium, glassmorphism subtil, coins arrondis xl

### Page NFC (/nfc/[marchandId]) — toujours clair
```
BG_PAGE = "#F0F4FF"
BG_CARD = "#FFFFFF"
BORDER  = "rgba(99,102,241,0.14)"
FG_MAIN = "#1D1D1F" / FG_SEC = "#6E6E73"
BTN_BG  = "linear-gradient(135deg, #007AFF, #8B5CF6)"
```

### Dashboard marchand — suit le thème système (clair/sombre via CSS vars)
Variables : `--bg`, `--fg`, `--accent`, `--border`, `--glass-bg`, etc.

### Sliders — style iOS (défini dans globals.css)
Piste 4px, thumb blanc 22px rond avec ombre, pas de fill webkit côté CSS.

---

## Sécurité

| Route | Protection |
|---|---|
| /api/admin/* | Cookie `wallio_admin` httpOnly vérifié |
| /api/notify | idToken Firebase vérifié côté serveur |
| /api/apple-wallet/* | Header `ApplePass {authToken}` pour routes sensibles |
| /api/cron/* | Header `Authorization: Bearer {CRON_SECRET}` |
| /api/suggest-colors | ⚠️ Aucune auth — exposée publiquement |
| /api/google-wallet/generate | ⚠️ Aucune auth — walletId suffit |
| /api/apple-wallet/generate | ⚠️ Aucune auth — walletId suffit |

---

## Variables d'environnement requises

```
# Firebase client (NEXT_PUBLIC_*)
NEXT_PUBLIC_FIREBASE_API_KEY, AUTH_DOMAIN, PROJECT_ID, STORAGE_BUCKET,
MESSAGING_SENDER_ID, APP_ID, VAPID_KEY

# Firebase Admin (serveur)
FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY

# Admin Wallio
ADMIN_EMAIL, ADMIN_PASSWORD

# Sécurité crons
CRON_SECRET

# Apple Wallet (en attente Apple Developer 99$/an)
APNS_KEY, APNS_KEY_ID, APNS_TEAM_ID, APPLE_TEAM_ID, APPLE_PASS_TYPE_ID

# Google Wallet
GOOGLE_WALLET_ISSUER_ID, GOOGLE_WALLET_KEY_JSON
NEXT_PUBLIC_GOOGLE_WALLET_ENABLED

# IA
ANTHROPIC_API_KEY
```

---

## Avancement briques

| Brique | Statut |
|---|---|
| 1. Config Firebase | ✅ |
| 2. Auth marchand | ✅ |
| 3. Admin dashboard | ✅ |
| 4. Apple Wallet | ⏳ En attente cert Apple Developer ($99) |
| 5. NFC ID | ✅ |
| 6. Flux nouveau client NFC | ✅ |
| 7. Flux client existant NFC | ✅ |
| 8. QR code marchand | ✅ |
| 9. Anti-doublon | ✅ |
| 10. Récompenses cyclique + progressif | ✅ |
| 11. Dashboard complet | ✅ |
| 12. Notifications push FCM | ✅ |
| 13. Automatisations anniversaire + relance | ✅ |
| 14. Stats + graphiques | ✅ |
| 15. PWA manifest | ✅ |
| 16. Google Wallet | ⏳ Désactivé |

---

## Règles métier importantes

1. **nfc_id** géré uniquement par super admin (`/admin`) — jamais exposé côté marchand
2. **actif** activé/désactivé uniquement par super admin — jamais par le marchand lui-même
3. **wallet_id** = UUID généré à l'inscription, immuable — sert de serialNumber Apple Wallet
4. **telephone** toujours stocké avec indicatif (`+212...`) — la récupération doit passer le même format
5. **anti_doublon_delai** = 86400s par défaut (1 jour) — comparé à `derniere_visite`
6. **double_tampons** : si `double_tampons_fin` > now, `ajouterTampon` crédite 2 tampons
7. **Segments notify** : actifs = `derniere_visite` ≤ 30j, inactifs = > 30j
8. Un client peut avoir plusieurs comptes chez plusieurs marchands (wallet_id différents)
9. **Mode progressif** : les paliers ne se réinitialisent jamais — `paliers_valides[]` accumule
10. **Apple Wallet push** : fire-and-forget après chaque tampon NFC et QR — ne bloque pas le flux

---

## Points d'attention / TODOs connus

- `/api/suggest-colors` sans auth → risque d'abus ANTHROPIC_API_KEY
- `/api/google-wallet/generate` et `/api/apple-wallet/generate` sans auth → walletId prévisible ?
- Crons en UTC → décalage potentiel pour anniversaires/relances hors fuseau Maroc (UTC+1)
- `fcm_token` non nettoyé si expiré → peut gonfler les compteurs `failed` dans `/api/notify`
- `apns_push_token` : si l'utilisateur supprime sa carte Apple Wallet, le token n'est pas toujours invalidé côté Firestore
- Google Wallet push-update non implémenté (retourne toujours `pushed: false`)
