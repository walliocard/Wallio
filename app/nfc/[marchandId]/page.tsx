"use client";

import { useEffect, useState, useCallback, use } from "react";
import {
  getMarchandByNfcId, getClientByWalletId, getClientByTelephone, getWalletClientByTelephone,
  creerClient, ajouterTampon, validerRecompense,
  formatTemps, WALLET_KEY,
  type Marchand, type Client, type TamponResult,
} from "@/lib/loyalty";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { registerFcmToken } from "@/lib/fcm";
import { useAutoRefresh } from "@/hooks/useAutoRefresh";
import { useTimeTheme } from "@/hooks/useTimeTheme";
import AppleWalletCard from "@/components/AppleWalletCard";
import GoogleWalletCard from "@/components/GoogleWalletCard";
import QRCode from "qrcode";

type Screen =
  | { type: "loading" }
  | { type: "result"; result: TamponResult; client: Client; marchand: Marchand }
  | { type: "inscription"; marchand: Marchand }
  | { type: "recuperation"; marchand: Marchand }
  | { type: "carte"; client: Client; marchand: Marchand; recuperation?: boolean }
  | { type: "erreur"; message: string };

export default function NfcPage({ params }: { params: Promise<{ marchandId: string }> }) {
  const { marchandId } = use(params);
  const [screen, setScreen] = useState<Screen>({ type: "loading" });
  useTimeTheme("light"); // page NFC toujours en mode clair
  useAutoRefresh(screen.type === "loading");

  const traiterTampon = useCallback(async (client: Client, marchand: Marchand) => {
    const result = await ajouterTampon(client, marchand);
    setScreen({ type: "result", result, client, marchand });
    // Signal Wallet pour mettre à jour la carte (fire-and-forget)
    if (result.type === "ok" || result.type === "recompense") {
      const body = JSON.stringify({ walletId: client.wallet_id });
      const opts = { method: "POST", headers: { "Content-Type": "application/json" }, body };
      fetch("/api/apple-wallet/push-update", opts).catch(() => {});
      fetch("/api/google-wallet/push-update", opts).catch(() => {});
    }
  }, []);

  useEffect(() => {
    async function init() {
      try {
        const marchand = await getMarchandByNfcId(marchandId);
        if (!marchand || !marchand.actif) {
          setScreen({ type: "erreur", message: "Ce service est temporairement indisponible." });
          return;
        }

        const walletId = localStorage.getItem(WALLET_KEY(marchandId));
        let compteSupprimeIci = false;

        if (walletId) {
          const client = await getClientByWalletId(walletId, marchand.id);
          if (client) {
            // Si ce client n'est pas dans Apple/Google Wallet, chercher le bon par téléphone
            const hasWallet = client.apns_push_token || client.wallet_type;
            if (!hasWallet && client.telephone) {
              const walletClient = await getWalletClientByTelephone(client.telephone, marchand.id);
              if (walletClient && walletClient.wallet_id !== walletId) {
                localStorage.setItem(WALLET_KEY(marchandId), walletClient.wallet_id);
                await traiterTampon(walletClient, marchand);
                return;
              }
            }
            await traiterTampon(client, marchand);
            return;
          }
          // wallet_id présent en local mais compte supprimé → on nettoie
          localStorage.removeItem(WALLET_KEY(marchandId));
          compteSupprimeIci = true;
        }

        // Identité Wallio connue → inscription automatique chez un NOUVEAU marchand
        // (skip si le compte a été explicitement supprimé chez CE marchand)
        const cachedPhone  = localStorage.getItem("wallio_client_phone");
        const cachedPrenom = localStorage.getItem("wallio_client_prenom");
        const cachedNom    = localStorage.getItem("wallio_client_nom");
        const cachedDob    = localStorage.getItem("wallio_client_dob");
        if (cachedPhone && cachedPrenom && cachedNom && !compteSupprimeIci) {
          // Peut-être déjà inscrit ici (localStorage perdu / nouvel appareil)
          const existing = await getClientByTelephone(cachedPhone, marchand.id);
          if (existing) {
            localStorage.setItem(WALLET_KEY(marchandId), existing.wallet_id);
            await traiterTampon(existing, marchand);
            return;
          }
          // Nouveau chez ce marchand → on crée la carte automatiquement
          const { clientId, walletId: newWalletId } = await creerClient({
            prenom: cachedPrenom,
            nom: cachedNom,
            telephone: cachedPhone,
            date_naissance: cachedDob || "",
            marchand_id: marchand.id,
          });
          const newClient: Client = {
            id: clientId,
            prenom: cachedPrenom,
            nom: cachedNom,
            telephone: cachedPhone,
            date_naissance: cachedDob || "",
            wallet_id: newWalletId,
            marchand_id: marchand.id,
            tampons: 0,
          };
          localStorage.setItem(WALLET_KEY(marchandId), newWalletId);
          const result = await ajouterTampon(newClient, marchand);
          if (result.type === "ok" || result.type === "recompense") {
            const body = JSON.stringify({ walletId: newWalletId });
            const opts = { method: "POST", headers: { "Content-Type": "application/json" }, body };
            fetch("/api/apple-wallet/push-update", opts).catch(() => {});
            fetch("/api/google-wallet/push-update", opts).catch(() => {});
          }
          setScreen({ type: "carte", client: { ...newClient, tampons: result.type === "ok" ? result.tampons : 1 }, marchand });
          return;
        }

        setScreen({ type: "inscription", marchand });
      } catch (e) {
        setScreen({ type: "erreur", message: `Erreur de connexion. Réessayez. (${String(e).slice(0, 60)})` });
      }
    }
    init();
  }, [marchandId, traiterTampon]);

  if (screen.type === "loading") return <Loading />;
  if (screen.type === "erreur") return <Erreur message={screen.message} />;
  if (screen.type === "result") return (
    <ResultScreen
      result={screen.result}
      marchand={screen.marchand}
      walletId={screen.client.wallet_id}
      onValiderRecompense={async () => {
        await validerRecompense(screen.client.id);
        setScreen({ type: "result", result: { type: "ok", tampons: 0, objectif: screen.marchand.objectif_tampons, prenom: screen.client.prenom }, client: screen.client, marchand: screen.marchand });
      }}
    />
  );
  if (screen.type === "inscription") return (
    <InscriptionForm
      marchand={screen.marchand}
      onSuccess={async (client) => {
        localStorage.setItem(WALLET_KEY(marchandId), client.wallet_id);
        if (client.telephone)    localStorage.setItem("wallio_client_phone", client.telephone);
        if (client.prenom)       localStorage.setItem("wallio_client_prenom", client.prenom);
        if (client.nom)          localStorage.setItem("wallio_client_nom", client.nom);
        if (client.date_naissance) localStorage.setItem("wallio_client_dob", client.date_naissance);
        const result = await ajouterTampon(client, screen.marchand);
        setScreen({ type: "carte", client: { ...client, tampons: result.type === "ok" ? result.tampons : 1 }, marchand: screen.marchand });
      }}
      onRecuperation={() => setScreen({ type: "recuperation", marchand: screen.marchand })}
    />
  );
  if (screen.type === "recuperation") return (
    <RecuperationForm
      marchand={screen.marchand}
      onSuccess={(client) => {
        localStorage.setItem(WALLET_KEY(marchandId), client.wallet_id);
        if (client.telephone)      localStorage.setItem("wallio_client_phone", client.telephone);
        if (client.prenom)         localStorage.setItem("wallio_client_prenom", client.prenom);
        if (client.nom)            localStorage.setItem("wallio_client_nom", client.nom);
        if (client.date_naissance) localStorage.setItem("wallio_client_dob", client.date_naissance);
        setScreen({ type: "carte", client, marchand: screen.marchand, recuperation: true });
      }}
      onBack={() => setScreen({ type: "inscription", marchand: screen.marchand })}
    />
  );
  if (screen.type === "carte") return <CarteCreee client={screen.client} marchand={screen.marchand} recuperation={screen.recuperation} />;
  return null;
}

const NFC_BG = "#F0F4FF";

// ─── Loading ──────────────────────────────────────────────────────────────────

function Loading() {
  return (
    <main className="min-h-screen flex items-center justify-center" style={{ background: NFC_BG }}>
      <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
        style={{ borderColor: "#007AFF", borderTopColor: "transparent" }} />
    </main>
  );
}

// ─── Erreur ───────────────────────────────────────────────────────────────────

function Erreur({ message }: { message: string }) {
  return (
    <main className="min-h-screen flex items-center justify-center px-6" style={{ background: NFC_BG }}>
      <div className="text-center max-w-sm">
        <div className="w-14 h-14 mx-auto mb-5 rounded-2xl flex items-center justify-center"
          style={{ background: "rgba(255,59,48,0.10)", border: "1.5px solid rgba(255,59,48,0.2)" }}>
          <span className="text-[24px] font-bold" style={{ color: "#FF3B30" }}>!</span>
        </div>
        <p className="text-[17px]" style={{ color: "#3C3C43" }}>{message}</p>
      </div>
    </main>
  );
}

// ─── Résultat tampon ──────────────────────────────────────────────────────────

function ResultScreen({ result, marchand, walletId, onValiderRecompense }: {
  result: TamponResult;
  marchand: Marchand;
  walletId: string;
  onValiderRecompense: () => void;
}) {

  if (result.type === "not_found") return <Erreur message="Client introuvable." />;

  const isOk = result.type === "ok";
  const isRecompense = result.type === "recompense";
  const isAntiDoublon = result.type === "anti_doublon";

  return (
    <main className="min-h-screen flex items-center justify-center px-6" style={{ background: NFC_BG }}>
      <div className="w-full max-w-[360px] text-center">

        {/* Badge icône */}
        {isOk && (
          <div className="w-16 h-16 mx-auto mb-6 rounded-2xl flex items-center justify-center"
            style={{ background: "linear-gradient(135deg,#007AFF,#8B5CF6)", boxShadow: "0 8px 24px rgba(91,124,250,0.28)" }}>
            <span className="text-[22px] font-bold text-white">+{result.double ? "2" : "1"}</span>
          </div>
        )}
        {isRecompense && (
          <div className="w-16 h-16 mx-auto mb-6 rounded-2xl flex items-center justify-center"
            style={{ background: "linear-gradient(135deg,#34C759,#30D158)", boxShadow: "0 8px 24px rgba(52,199,89,0.28)" }}>
            <span className="text-[22px] font-bold text-white">+1</span>
          </div>
        )}
        {isAntiDoublon && (
          <div className="w-16 h-16 mx-auto mb-6 rounded-2xl flex items-center justify-center"
            style={{ background: "rgba(255,159,10,0.12)", border: "1.5px solid rgba(255,159,10,0.28)" }}>
            <span className="text-[28px] font-bold leading-none" style={{ color: "#FF9F0A" }}>!</span>
          </div>
        )}

        {/* Titre */}
        <h1 className="text-[26px] font-semibold tracking-tight mb-2" style={{ color: "#1D1D1F" }}>
          {isOk && (result.double ? "2 tampons ajoutés" : "Tampon ajouté")}
          {isRecompense && "Récompense débloquée"}
          {isAntiDoublon && "Déjà enregistré"}
        </h1>

        {/* Sous-titre */}
        <p className="text-[16px] mb-6" style={{ color: "#6E6E73" }}>
          {isOk && `Bonjour ${result.prenom}`}
          {isRecompense && `Bonjour ${result.prenom} — ${result.nom_recompense}`}
          {isAntiDoublon && `Bonjour ${result.prenom}`}
        </p>

        {/* Barre de progression (ok) */}
        {isOk && (
          <div className="mb-6">
            {result.double && (
              <p className="text-[12px] font-medium mb-3 px-3 py-1.5 rounded-full inline-block"
                style={{ background: "rgba(0,122,255,0.08)", color: "#007AFF" }}>
                Offre x2 tampons active
              </p>
            )}
            <div className="flex justify-between text-[12px] mb-2" style={{ color: "#AEAEB2" }}>
              <span>{result.tampons} tampon{result.tampons > 1 ? "s" : ""}</span>
              <span>Objectif {result.objectif}</span>
            </div>
            <div className="h-2 rounded-full overflow-hidden" style={{ background: "#E5E5EA" }}>
              <div className="h-full rounded-full transition-all duration-700"
                style={{ width: `${Math.min((result.tampons / result.objectif) * 100, 100)}%`, background: "linear-gradient(90deg,#007AFF,#8B5CF6)" }} />
            </div>
            {result.tampons < result.objectif && (
              <p className="text-[12px] mt-2" style={{ color: "#AEAEB2" }}>
                {result.objectif - result.tampons} avant {marchand.nom_recompense}
              </p>
            )}
          </div>
        )}

        {/* Anti-doublon countdown */}
        {isAntiDoublon && result.secondes_restantes > 0 && (
          <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl mb-6"
            style={{ background: "rgba(255,159,10,0.10)", border: "1px solid rgba(255,159,10,0.22)" }}>
            <span className="text-[13px] font-medium" style={{ color: "#FF9F0A" }}>Prochain tampon dans</span>
            <span className="text-[15px] font-bold" style={{ color: "#FF9F0A" }}>{formatTemps(result.secondes_restantes)}</span>
          </div>
        )}

        {/* QR récompense */}
        {isRecompense && <RecompenseQR walletId={walletId} />}

        <a href={`/preferences/${walletId}`} className="block mt-10 text-[11px] text-center" style={{ color: "#C7C7CC" }}>
          Gérer mes notifications
        </a>
      </div>
    </main>
  );
}

// ─── QR Récompense ────────────────────────────────────────────────────────────

function RecompenseQR({ walletId }: { walletId: string }) {
  const [qr, setQr] = useState("");

  useEffect(() => {
    QRCode.toDataURL(`https://app.walliocard.com/client/${walletId}`, {
      width: 600, margin: 1, errorCorrectionLevel: "M",
      color: { dark: "#1D1D1F", light: "#FFFFFF" },
    }).then(setQr).catch(() => {});
  }, [walletId]);

  return (
    <div className="rounded-2xl px-5 py-5" style={{ background: "rgba(52,199,89,0.08)", border: "1px solid rgba(52,199,89,0.2)" }}>
      <p className="text-[15px] font-semibold mb-1" style={{ color: "#34C759" }}>Récompense à valider</p>
      <p className="text-[13px] mb-4" style={{ color: "var(--fg-secondary)" }}>
        Faites scanner ce code par le marchand.
      </p>
      {qr ? (
        <div className="flex justify-center">
          <img src={qr} alt="QR récompense" className="w-36 h-36 rounded-xl" />
        </div>
      ) : (
        <div className="w-36 h-36 mx-auto rounded-xl" style={{ background: "var(--border)" }} />
      )}
    </div>
  );
}

// ─── Inscription ──────────────────────────────────────────────────────────────

const MOIS = ["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"];

const PAYS = [
  { code: "+212", flag: "🇲🇦", label: "Maroc",        digits: 9  },
  { code: "+213", flag: "🇩🇿", label: "Algérie",      digits: 9  },
  { code: "+216", flag: "🇹🇳", label: "Tunisie",      digits: 8  },
  { code: "+33",  flag: "🇫🇷", label: "France",       digits: 9  },
  { code: "+32",  flag: "🇧🇪", label: "Belgique",     digits: 9  },
  { code: "+34",  flag: "🇪🇸", label: "Espagne",      digits: 9  },
  { code: "+39",  flag: "🇮🇹", label: "Italie",       digits: 10 },
  { code: "+41",  flag: "🇨🇭", label: "Suisse",       digits: 9  },
  { code: "+44",  flag: "🇬🇧", label: "Royaume-Uni",  digits: 10 },
  { code: "+49",  flag: "🇩🇪", label: "Allemagne",    digits: 10 },
  { code: "+31",  flag: "🇳🇱", label: "Pays-Bas",     digits: 9  },
  { code: "+351", flag: "🇵🇹", label: "Portugal",     digits: 9  },
  { code: "+90",  flag: "🇹🇷", label: "Turquie",      digits: 10 },
  { code: "+971", flag: "🇦🇪", label: "Émirats",      digits: 9  },
  { code: "+966", flag: "🇸🇦", label: "Arabie S.",    digits: 9  },
  { code: "+974", flag: "🇶🇦", label: "Qatar",        digits: 8  },
  { code: "+965", flag: "🇰🇼", label: "Koweït",       digits: 8  },
  { code: "+221", flag: "🇸🇳", label: "Sénégal",      digits: 9  },
  { code: "+225", flag: "🇨🇮", label: "Côte d'Ivoire",digits: 10 },
  { code: "+1",   flag: "🇺🇸", label: "USA / Canada", digits: 10 },
];

function MarchandHeader({ marchand }: { marchand: Marchand }) {
  const m = marchand as Record<string, unknown>;
  const logo = m.logo_url as string | undefined;
  const couleur = marchand.couleur_principale || "#007AFF";
  return (
    <div className="text-center mb-10">
      <div className="flex justify-center mb-4">
        {logo ? (
          <img src={logo} alt={marchand.nom}
            className="w-16 h-16 rounded-2xl object-cover"
            style={{ boxShadow: `0 8px 24px ${couleur}40` }} />
        ) : (
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-[26px] font-bold text-white"
            style={{ background: couleur, boxShadow: `0 8px 24px ${couleur}40` }}>
            {marchand.nom.charAt(0).toUpperCase()}
          </div>
        )}
      </div>
      <h1 className="text-[22px] font-bold tracking-tight mb-1" style={{ color: FG_MAIN }}>{marchand.nom}</h1>
      <p className="text-[14px]" style={{ color: FG_SEC }}>Programme de fidélité</p>
    </div>
  );
}

// Palette DA Wallio — light premium
const BG_PAGE   = "#F0F4FF";
const BG_CARD   = "#FFFFFF";
const BORDER    = "rgba(99,102,241,0.14)";
const FG_MAIN   = "#1D1D1F";
const FG_SEC    = "#6E6E73";
const ACCENT    = "#007AFF";
const ACCENT_FG = "#FFFFFF";
const BTN_BG    = "linear-gradient(135deg, #007AFF 0%, #8B5CF6 100%)";

const inputStyle: React.CSSProperties = {
  background: BG_CARD,
  border: `1px solid ${BORDER}`,
  color: FG_MAIN,
  WebkitAppearance: "none",
};

function InscriptionForm({ marchand, onSuccess, onRecuperation }: {
  marchand: Marchand;
  onSuccess: (client: Client) => void;
  onRecuperation: () => void;
}) {
  const [prenom, setPrenom] = useState("");
  const [nom, setNom] = useState("");
  const [indicatif, setIndicatif] = useState(PAYS[0]);
  const [numLocal, setNumLocal] = useState("");
  const [dateJ, setDateJ] = useState("");
  const [dateM, setDateM] = useState("");
  const [dateA, setDateA] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const anneeMax = new Date().getFullYear() - 5;
  const annees = Array.from({ length: 90 }, (_, i) => anneeMax - i);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!dateJ || !dateM || !dateA) { setError("Veuillez saisir votre date de naissance."); return; }
    const numPropre = numLocal.replace(/\D/g, "").replace(/^0/, "");
    if (numPropre.length < indicatif.digits - 1) { setError(`Numéro invalide (${indicatif.digits} chiffres attendus).`); return; }
    const telephone = `${indicatif.code}${numPropre}`;
    const date_naissance = `${dateA}-${dateM.padStart(2, "0")}-${dateJ.padStart(2, "0")}`;
    setLoading(true);
    setError("");
    try {
      const existing = await getClientByTelephone(telephone, marchand.id);
      if (existing &&
          existing.prenom.trim().toLowerCase() === prenom.trim().toLowerCase() &&
          existing.nom.trim().toLowerCase() === nom.trim().toLowerCase()) {
        onSuccess(existing);
        return;
      }
      const { clientId, walletId } = await creerClient({ prenom, nom, telephone, date_naissance, marchand_id: marchand.id });
      onSuccess({ id: clientId, prenom, nom, telephone: `${indicatif.code}${numPropre}`, date_naissance, wallet_id: walletId, marchand_id: marchand.id, tampons: 0 });
    } catch {
      setError("Une erreur est survenue. Réessayez.");
    } finally {
      setLoading(false);
    }
  }

  const selectStyle: React.CSSProperties = { ...inputStyle, backgroundImage: "none" };

  return (
    <main className="min-h-screen flex flex-col justify-center px-5 py-12" style={{ background: BG_PAGE }}>
      <div className="w-full max-w-[390px] mx-auto">
        <MarchandHeader marchand={marchand} />

        <div className="rounded-[28px] p-6" style={{ background: BG_CARD, border: `1px solid ${BORDER}`, boxShadow: "0 8px 40px rgba(0,0,0,0.5)" }}>
          <form onSubmit={handleSubmit} className="space-y-2.5">
            {([
              { value: prenom, set: setPrenom, placeholder: "Prénom", type: "text", autoComplete: "given-name" },
              { value: nom, set: setNom, placeholder: "Nom", type: "text", autoComplete: "family-name" },
            ] as const).map(f => (
              <input key={f.placeholder} type={f.type} required placeholder={f.placeholder}
                autoComplete={f.autoComplete} value={f.value}
                onChange={e => f.set(e.target.value)}
                className="w-full px-4 py-3.5 rounded-2xl text-[15px] outline-none transition-colors"
                style={inputStyle}
                onFocus={e => (e.target.style.borderColor = ACCENT)}
                onBlur={e => (e.target.style.borderColor = BORDER)}
              />
            ))}

            {/* Téléphone : indicatif + numéro */}
            <div className="flex rounded-2xl overflow-hidden transition-colors"
              style={{ ...inputStyle, padding: 0, gap: 0 }}>
              <select
                value={indicatif.code}
                onChange={e => setIndicatif(PAYS.find(p => p.code === e.target.value) ?? PAYS[0])}
                className="outline-none text-[14px] font-medium shrink-0 border-r"
                style={{ background: "transparent", color: FG_MAIN, borderColor: BORDER, padding: "0 10px 0 14px", WebkitAppearance: "none" }}>
                {PAYS.map(p => (
                  <option key={p.code} value={p.code} style={{ background: BG_CARD }}>
                    {p.flag} {p.code}
                  </option>
                ))}
              </select>
              <input
                type="tel" required placeholder={`Numéro (${indicatif.digits} chiffres)`}
                autoComplete="tel-national" value={numLocal}
                onChange={e => setNumLocal(e.target.value.replace(/[^\d\s]/g, ""))}
                className="flex-1 px-4 py-3.5 text-[15px] outline-none bg-transparent"
                style={{ color: FG_MAIN }}
              />
            </div>

            {/* Date de naissance */}
            <div className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${BORDER}` }}>
              <p className="text-[11px] font-medium uppercase tracking-wider px-4 pt-3 pb-1"
                style={{ color: FG_SEC }}>Date de naissance</p>
              <div className="grid grid-cols-3 divide-x" style={{ borderColor: BORDER }}>
                {[
                  { value: dateJ, set: setDateJ, placeholder: "Jour", options: Array.from({ length: 31 }, (_, i) => ({ v: String(i + 1), l: String(i + 1) })) },
                  { value: dateM, set: setDateM, placeholder: "Mois", options: MOIS.map((l, i) => ({ v: String(i + 1), l })) },
                  { value: dateA, set: setDateA, placeholder: "Année", options: annees.map(a => ({ v: String(a), l: String(a) })) },
                ].map(s => (
                  <select key={s.placeholder} required value={s.value}
                    onChange={e => s.set(e.target.value)}
                    className="w-full px-3 py-3.5 text-[14px] outline-none bg-transparent"
                    style={{ color: s.value ? FG_MAIN : FG_SEC, ...selectStyle }}>
                    <option value="" disabled>{s.placeholder}</option>
                    {s.options.map(o => <option key={o.v} value={o.v} style={{ background: BG_CARD }}>{o.l}</option>)}
                  </select>
                ))}
              </div>
            </div>

            {error && <p className="text-[13px] px-1" style={{ color: "#FF453A" }}>{error}</p>}

            <button type="submit" disabled={loading}
              className="w-full py-4 rounded-2xl text-[16px] font-semibold transition-opacity active:opacity-80 mt-1"
              style={{ background: BTN_BG, color: ACCENT_FG, boxShadow: "0 4px 24px rgba(99,102,241,0.30)" }}>
              {loading ? "Création…" : "Créer ma carte"}
            </button>
          </form>
        </div>

        <p className="text-center text-[13px] mt-5" style={{ color: FG_SEC }}>
          Déjà inscrit ?{" "}
          <button onClick={onRecuperation} style={{ color: ACCENT }} className="font-semibold">
            Récupérer mon compte
          </button>
        </p>
      </div>
    </main>
  );
}

// ─── Récupération ─────────────────────────────────────────────────────────────

function RecuperationForm({ marchand, onSuccess, onBack }: {
  marchand: Marchand;
  onSuccess: (client: Client) => void;
  onBack: () => void;
}) {
  const [indicatif, setIndicatif] = useState(PAYS[0]);
  const [numLocal, setNumLocal] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const selectStyle: React.CSSProperties = { ...inputStyle, backgroundImage: "none" };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const numPropre = numLocal.replace(/\D/g, "").replace(/^0/, "");
    const telephone = `${indicatif.code}${numPropre}`;
    const client = await getClientByTelephone(telephone, marchand.id);
    if (!client) {
      setError("Aucun compte trouvé avec ce numéro.");
      setLoading(false);
      return;
    }
    onSuccess(client);
  }

  return (
    <main className="min-h-screen flex flex-col justify-center px-5 py-12" style={{ background: BG_PAGE }}>
      <div className="w-full max-w-[390px] mx-auto">
        <MarchandHeader marchand={marchand} />

        <div className="rounded-[28px] p-6" style={{ background: BG_CARD, border: `1px solid ${BORDER}`, boxShadow: "0 8px 40px rgba(0,0,0,0.06)" }}>
          <p className="text-[17px] font-semibold mb-0.5" style={{ color: FG_MAIN }}>Récupérer mon compte</p>
          <p className="text-[13px] mb-5" style={{ color: FG_SEC }}>Entre le numéro utilisé lors de ton inscription</p>

          <form onSubmit={handleSubmit} className="space-y-2.5">
            <div className="flex rounded-2xl overflow-hidden transition-colors"
              style={{ ...inputStyle, padding: 0, gap: 0 }}>
              <select
                value={indicatif.code}
                onChange={e => setIndicatif(PAYS.find(p => p.code === e.target.value) ?? PAYS[0])}
                className="outline-none text-[14px] font-medium shrink-0 border-r"
                style={{ background: "transparent", color: FG_MAIN, borderColor: BORDER, padding: "0 10px 0 14px", WebkitAppearance: "none" }}>
                {PAYS.map(p => (
                  <option key={p.code} value={p.code} style={{ background: BG_CARD }}>
                    {p.flag} {p.code}
                  </option>
                ))}
              </select>
              <input
                type="tel" required placeholder={`Numéro (${indicatif.digits} chiffres)`}
                autoComplete="tel-national" value={numLocal}
                onChange={e => setNumLocal(e.target.value.replace(/[^\d\s]/g, ""))}
                className="flex-1 px-4 py-3.5 text-[15px] outline-none bg-transparent"
                style={{ color: FG_MAIN }}
              />
            </div>

            {error && <p className="text-[13px] px-1" style={{ color: "#FF453A" }}>{error}</p>}

            <button type="submit" disabled={loading}
              className="w-full py-4 rounded-2xl text-[16px] font-semibold transition-opacity active:opacity-80 mt-1"
              style={{ background: BTN_BG, color: ACCENT_FG, boxShadow: "0 4px 24px rgba(99,102,241,0.30)" }}>
              {loading ? "Recherche…" : "Récupérer mon compte"}
            </button>
          </form>
        </div>

        <p className="text-center text-[13px] mt-5" style={{ color: FG_SEC }}>
          <button onClick={onBack} style={{ color: FG_SEC }} className="font-medium">← Retour</button>
        </p>
      </div>
    </main>
  );
}

// ─── Carte créée ──────────────────────────────────────────────────────────────

function InstallBanner() {
  const [show, setShow] = useState(false);
  const [isIos, setIsIos] = useState(false);

  useEffect(() => {
    const standalone = window.matchMedia("(display-mode: standalone)").matches || (navigator as unknown as Record<string, unknown>).standalone === true;
    if (standalone) return;
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
    setIsIos(ios);
    setShow(true);
  }, []);

  if (!show) return null;

  return (
    <div style={{
      borderRadius: 24, marginBottom: 16, overflow: "hidden",
      background: "linear-gradient(135deg, rgba(91,124,250,0.12) 0%, rgba(124,91,250,0.10) 100%)",
      border: "1px solid rgba(91,124,250,0.25)",
      backdropFilter: "blur(20px)",
    }}>
      {/* Header banner */}
      <div style={{ padding: "16px 18px 12px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <img src="/icon-192.png" alt="Wallio" style={{ width: 34, height: 34, borderRadius: 8, display: "block" }} />
          <div>
            <p style={{ fontSize: 15, fontWeight: 700, color: "var(--fg)", letterSpacing: -0.2 }}>
              Installez Wallio
            </p>
            <p style={{ fontSize: 12, color: "var(--fg-secondary)" }}>Gratuit · 2 secondes</p>
          </div>
        </div>
        <button onClick={() => setShow(false)} style={{ background: "rgba(0,0,0,0.06)", border: "none", borderRadius: 8, padding: "4px 8px", cursor: "pointer", color: "var(--fg-tertiary)", fontSize: 12 }}>
          Plus tard
        </button>
      </div>

      {/* Benefits */}
      <div style={{ padding: "0 18px 14px", display: "flex", flexDirection: "column", gap: 8 }}>
        {[
          "Offre d'anniversaire automatique",
          "Offres exclusives de vos établissements",
          "Toutes vos cartes au même endroit",
        ].map(text => (
          <div key={text} style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 6, height: 6, borderRadius: 99, flexShrink: 0, background: "linear-gradient(135deg,#007AFF,#8B5CF6)" }} />
            <span style={{ fontSize: 13, color: "var(--fg)", fontWeight: 500 }}>{text}</span>
          </div>
        ))}
      </div>

      {/* Instructions */}
      <div style={{ margin: "0 14px 14px", padding: "12px 14px", borderRadius: 16, background: "rgba(255,255,255,0.6)", backdropFilter: "blur(12px)" }}>
        {isIos ? (
          <div>
            <p style={{ fontSize: 12, fontWeight: 600, color: "var(--fg)", marginBottom: 8 }}>Comment installer sur iPhone :</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {[
                { n: "1", t: "Appuyez sur le bouton Partager", icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg> },
                { n: "2", t: "Faites défiler vers « Sur l'écran d'accueil »", icon: null },
                { n: "3", t: "Appuyez sur « Ajouter »", icon: null },
              ].map(s => (
                <div key={s.n} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 20, height: 20, borderRadius: 6, background: "linear-gradient(135deg,#5B7CFA,#7C5BFA)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: "white" }}>{s.n}</span>
                  </div>
                  <span style={{ fontSize: 12, color: "var(--fg-secondary)" }}>{s.t}</span>
                  {s.icon && <span style={{ color: "var(--fg-secondary)", lineHeight: 0 }}>{s.icon}</span>}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div>
            <p style={{ fontSize: 12, fontWeight: 600, color: "var(--fg)", marginBottom: 8 }}>Comment installer sur Android :</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {[
                { n: "1", t: "Appuyez sur ⋮ (menu Chrome en haut à droite)" },
                { n: "2", t: "Appuyez sur « Ajouter à l'écran d'accueil »" },
                { n: "3", t: "Confirmez avec « Ajouter »" },
              ].map(s => (
                <div key={s.n} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 20, height: 20, borderRadius: 6, background: "linear-gradient(135deg,#5B7CFA,#7C5BFA)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: "white" }}>{s.n}</span>
                  </div>
                  <span style={{ fontSize: 12, color: "var(--fg-secondary)" }}>{s.t}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function CarteCreee({ client, marchand, recuperation = false }: { client: Client; marchand: Marchand; recuperation?: boolean }) {
  const [isAndroid, setIsAndroid] = useState(false);
  useEffect(() => { setIsAndroid(/android/i.test(navigator.userAgent)); }, []);

  const [notifState, setNotifState] = useState<"idle" | "granted" | "denied">(() => {
    if (typeof window === "undefined") return "idle";
    if (!("Notification" in window)) return "denied";
    if (Notification.permission === "granted") return "granted";
    if (Notification.permission === "denied") return "denied";
    return "idle";
  });

  // Si déjà accordé, masquer après 2s pour ne pas encombrer
  useEffect(() => {
    if (notifState === "granted") {
      const t = setTimeout(() => setNotifState("denied"), 2000);
      return () => clearTimeout(t);
    }
  }, [notifState]);

  const m = marchand as Record<string, unknown>;
  const notifActif = m.notif_actif !== false;
  const notifMessage = (m.notif_message as string) ||
    `Pour ne manquer aucune de vos récompenses chez ${marchand.nom}, activez les notifications !`;
  const couleur = marchand.couleur_principale || "#007AFF";
  const couleur2 = (m.couleur_secondaire as string) || marchand.couleur_principale || "#005EC4";
  const logo = m.logo_url as string | undefined;

  async function activerNotifications() {
    if (!("Notification" in window)) { setNotifState("denied"); return; }
    const perm = await Notification.requestPermission();
    if (perm === "granted") {
      setNotifState("granted");
      const token = await registerFcmToken();
      if (token && client.id) {
        await updateDoc(doc(db, "clients", client.id), { fcm_token: token });
      }
    } else {
      setNotifState("denied");
    }
  }

  return (
    <main className="min-h-screen flex flex-col justify-center px-5 py-12" style={{ background: "var(--bg)" }}>
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[50%] translate-x-[-50%] w-[500px] h-[400px] rounded-full"
          style={{ background: `radial-gradient(circle, ${couleur}22 0%, transparent 70%)` }} />
      </div>

      <div className="w-full max-w-[390px] mx-auto relative">
        {/* Header */}
        <div className="text-center mb-7">
          <h1 className="text-[26px] font-semibold tracking-tight mb-1" style={{ color: "var(--fg)" }}>
            {recuperation ? `Bonjour, ${client.prenom} !` : `Bienvenue, ${client.prenom} !`}
          </h1>
          <p className="text-[14px]" style={{ color: "var(--fg-secondary)" }}>
            {recuperation
              ? `${client.tampons} tampon${(client.tampons ?? 0) > 1 ? "s" : ""} · Compte retrouvé`
              : "Votre carte est créée · 1er tampon ajouté"}
          </p>
        </div>

        {/* Carte preview — Google sur Android, Apple sur iOS */}
        <div className="mb-5 w-full">
          {isAndroid ? (
            <GoogleWalletCard
              logoUrl={logo}
              logoText={marchand.nom}
              backgroundColor={(m.google_bg_color as string) || (m.apple_bg_color as string) || couleur}
              heroUrl={(m.google_hero_url as string) || (m.strip_url as string) || undefined}
              stampsCurrent={client.tampons ?? 0}
              stampsObjective={marchand.objectif_tampons}
              rewardName={(m.nom_recompense as string) || "Récompense"}
              previewUid={client.wallet_id}
              primaryLabel={(m.google_primary_label as string) || "Tampons"}
              secondaryLabel={(m.google_secondary_label as string) || "Objectif"}
              textModules={((m.google_text_modules as { header: string; body: string; id: string }[]) || [])}
              links={((m.google_links as { uri: string; description: string }[]) || [])}
            />
          ) : (
            <AppleWalletCard
              logoUrl={logo}
              logoText={marchand.nom}
              stripUrl={(m.strip_url as string) || undefined}
              backgroundColor={(m.apple_bg_color as string) || couleur}
              foregroundColor={(m.apple_fg_color as string) || undefined}
              labelColor={(m.apple_label_color as string) || undefined}
              stampsCurrent={client.tampons ?? 0}
              stampsObjective={marchand.objectif_tampons}
              rewardName={(m.nom_recompense as string) || "Récompense"}
              previewUid={client.wallet_id}
              clientPrenom={client.prenom}
              clientNom={client.nom}
              primaryLabel={(m.apple_primary_label as string) || "Tampons"}
              rewardLabel={(m.apple_reward_label as string) || "Récompense"}
              memberLabel={(m.apple_member_label as string) || "Membre"}
              auxiliaryFields={[
                { label: (m.apple_aux1_label as string) || "INFO", value: (m.apple_aux1_value as string) || "" },
                { label: (m.apple_aux2_label as string) || "INFO", value: (m.apple_aux2_value as string) || "" },
                { label: (m.apple_aux3_label as string) || "INFO", value: (m.apple_aux3_value as string) || "" },
              ]}
              mode="full"
              stampsOnStrip={(m.apple_stamps_on_strip as boolean) ?? false}
              stripStampStyle={(m.apple_strip_stamp_style as never) || undefined}
              stampText={(m.apple_stamp_text as string) || undefined}
              stampTextBold={(m.apple_stamp_text_bold as boolean) ?? false}
              stampTextItalic={(m.apple_stamp_text_italic as boolean) ?? false}
              stampTextSize={(m.apple_stamp_text_size as number) || undefined}
              stampColor={(m.apple_stamp_color as string) || undefined}
              stampPosition={typeof m.apple_stamp_position === "number" ? m.apple_stamp_position : m.apple_stamp_position === "top" ? 20 : m.apple_stamp_position === "bottom" ? 80 : 50}
              stampSizePreset={(m.apple_stamp_size as never) || undefined}
              stampThickness={(m.apple_stamp_thickness as number) || undefined}
              stampLogoOpacity={(m.apple_stamp_logo_opacity as number) || undefined}
            />
          )}
        </div>

        {/* Notifications */}
        {notifActif && notifState === "idle" && (
          <div className="rounded-[22px] p-5 mb-4"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)", backdropFilter: "blur(40px)" }}>
            <p className="text-[15px] font-semibold mb-1" style={{ color: "var(--fg)" }}>Restez informé</p>
            <p className="text-[13px] mb-4" style={{ color: "var(--fg-secondary)", lineHeight: 1.55 }}>{notifMessage}</p>
            <div className="flex gap-2">
              <button onClick={activerNotifications}
                className="flex-1 py-3 rounded-2xl text-[14px] font-semibold text-white"
                style={{ background: "var(--accent)" }}>
                Activer
              </button>
              <button onClick={() => setNotifState("denied")}
                className="py-3 px-5 rounded-2xl text-[14px] font-medium"
                style={{ background: "rgba(255,255,255,0.08)", color: "var(--fg-secondary)" }}>
                Plus tard
              </button>
            </div>
          </div>
        )}

        {notifState === "granted" && (
          <div className="rounded-2xl py-3 px-4 mb-4 flex items-center gap-2"
            style={{ background: "rgba(52,199,89,0.1)", border: "1px solid rgba(52,199,89,0.2)" }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M3 8l3.5 3.5L13 4" stroke="#34C759" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <p className="text-[13px] font-medium" style={{ color: "#34C759" }}>Notifications activées</p>
          </div>
        )}

        <InstallBanner />

        {/* Boutons Wallet — Apple sur iOS, Google sur Android */}
        <div className="flex flex-col gap-2.5">
          {!isAndroid && (
            process.env.NEXT_PUBLIC_APPLE_WALLET_ENABLED === "true" ? (
              <a href={`/api/apple-wallet/generate/${client.wallet_id}`}
                className="w-full rounded-2xl py-4 px-6 flex items-center justify-center gap-3 active:opacity-75 transition-opacity"
                style={{ background: "#000", border: "1px solid rgba(255,255,255,0.15)" }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <rect x="2" y="5" width="20" height="14" rx="3" stroke="white" strokeWidth="1.5"/>
                  <path d="M2 10H22" stroke="white" strokeWidth="1.5"/>
                  <circle cx="7" cy="14.5" r="1.5" fill="white"/>
                </svg>
                <span className="text-[15px] font-semibold text-white">Ajouter à Apple Wallet</span>
              </a>
            ) : (
              <div className="w-full rounded-2xl py-3.5 px-6 flex items-center justify-between"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)" }}>
                <span className="text-[14px] font-medium" style={{ color: "var(--fg)" }}>Apple Wallet</span>
                <span className="text-[12px]" style={{ color: "var(--fg-secondary)" }}>Bientôt disponible</span>
              </div>
            )
          )}

          {isAndroid && process.env.NEXT_PUBLIC_GOOGLE_WALLET_ENABLED === "true" && (
            <a href={`/api/google-wallet/generate/${client.wallet_id}`}
              className="w-full rounded-2xl py-4 px-6 flex items-center justify-center gap-3 active:opacity-75 transition-opacity"
              style={{ background: "#1a73e8" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M21 7H3a1 1 0 00-1 1v8a1 1 0 001 1h18a1 1 0 001-1V8a1 1 0 00-1-1z" stroke="white" strokeWidth="1.5"/>
                <path d="M1 10h22" stroke="white" strokeWidth="1.5"/>
              </svg>
              <span className="text-[15px] font-semibold text-white">Ajouter à Google Wallet</span>
            </a>
          )}
        </div>
      </div>
    </main>
  );
}
