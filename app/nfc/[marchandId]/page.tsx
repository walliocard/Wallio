"use client";

import { useEffect, useState, useCallback, use } from "react";
import {
  getMarchandByNfcId, getClientByWalletId, getClientByTelephone,
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
        if (walletId) {
          const client = await getClientByWalletId(walletId, marchandId);
          if (client) {
            await traiterTampon(client, marchand);
            return;
          }
          localStorage.removeItem(WALLET_KEY(marchandId));
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
        setScreen({ type: "carte", client, marchand: screen.marchand, recuperation: true });
      }}
      onBack={() => setScreen({ type: "inscription", marchand: screen.marchand })}
    />
  );
  if (screen.type === "carte") return <CarteCreee client={screen.client} marchand={screen.marchand} recuperation={screen.recuperation} />;
  return null;
}

// ─── Loading ──────────────────────────────────────────────────────────────────

function Loading() {
  return (
    <main className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg)" }}>
      <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
        style={{ borderColor: "var(--accent)", borderTopColor: "transparent" }} />
    </main>
  );
}

// ─── Erreur ───────────────────────────────────────────────────────────────────

function Erreur({ message }: { message: string }) {
  return (
    <main className="min-h-screen flex items-center justify-center px-6" style={{ background: "var(--bg)" }}>
      <div className="text-center max-w-sm">
        <div className="text-5xl mb-4">⚠️</div>
        <p className="text-[17px]" style={{ color: "var(--fg-secondary)" }}>{message}</p>
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
    <main className="min-h-screen flex items-center justify-center px-6" style={{ background: "var(--bg)" }}>
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[50%] translate-x-[-50%] w-[600px] h-[500px] rounded-full opacity-25"
          style={{ background: `radial-gradient(circle, ${isAntiDoublon ? "rgba(255,159,10,0.3)" : isRecompense ? "rgba(52,199,89,0.3)" : "rgba(0,122,255,0.2)"} 0%, transparent 70%)` }} />
      </div>

      <div className="w-full max-w-[360px] relative text-center">
        <div className="text-6xl mb-6 animate-bounce">
          {isOk ? marchand.icone_tampons || "+" : isRecompense ? "+" : "!"}
        </div>

        <h1 className="text-[28px] font-semibold tracking-tight mb-2" style={{ color: "var(--fg)" }}>
          {isOk && (result.double ? "2 tampons ajoutés !" : "Tampon ajouté !")}
          {isRecompense && "Récompense débloquée !"}
          {isAntiDoublon && "Déjà enregistré"}
        </h1>

        {isOk && result.double && (
          <p className="text-[13px] font-medium mb-2 px-3 py-1.5 rounded-full inline-block" style={{ background: "rgba(0,122,255,0.1)", color: "var(--accent)" }}>
            Offre spéciale x2 tampons active
          </p>
        )}

        <p className="text-[17px] mb-8" style={{ color: "var(--fg-secondary)" }}>
          {isOk && `${result.prenom} — ${result.tampons}/${result.objectif} tampons`}
          {isRecompense && `${result.prenom} — ${result.nom_recompense}`}
          {isAntiDoublon && `${result.prenom} a déjà été enregistré${result.secondes_restantes ? ` · Reviens dans ${formatTemps(result.secondes_restantes)}` : ""}`}
        </p>

        {isOk && (
          <div className="flex justify-center gap-2 flex-wrap mb-8">
            {Array.from({ length: result.objectif }).map((_, i) => (
              <div key={i} className="w-8 h-8 rounded-full flex items-center justify-center text-lg transition-all"
                style={{
                  background: i < result.tampons ? "var(--accent)" : "var(--border)",
                  transform: i === result.tampons - 1 ? "scale(1.2)" : "scale(1)",
                }}>
                {i < result.tampons ? (marchand.icone_tampons || "+") : ""}
              </div>
            ))}
          </div>
        )}

        {isRecompense && (
          <RecompenseQR walletId={walletId} />
        )}

        <a href={`/preferences/${walletId}`}
          className="block mt-8 text-[12px] text-center"
          style={{ color: "var(--fg-tertiary)" }}>
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

function CarteCreee({ client, marchand, recuperation = false }: { client: Client; marchand: Marchand; recuperation?: boolean }) {
  const [notifState, setNotifState] = useState<"idle" | "granted" | "denied">("idle");

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

        {/* Carte Apple Wallet — identique au dashboard */}
        <div className="mb-5 w-full">
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

        {/* Boutons Wallet */}
        <div className="flex flex-col gap-2.5">
          {process.env.NEXT_PUBLIC_APPLE_WALLET_ENABLED === "true" ? (
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
          )}

          {process.env.NEXT_PUBLIC_GOOGLE_WALLET_ENABLED === "true" && (
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
