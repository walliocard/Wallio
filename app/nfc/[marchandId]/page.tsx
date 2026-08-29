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
  // Auto-refresh uniquement sur l'écran de chargement initial
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
      onValiderRecompense={async () => {
        await validerRecompense(
          screen.client.id,
          screen.marchand,
          screen.client.niveau ?? 0,
          screen.client.paliers_valides ?? []
        );
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

function ResultScreen({ result, marchand, onValiderRecompense }: {
  result: TamponResult;
  marchand: Marchand;
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
          {isOk ? marchand.icone_tampons || "⭐" : isRecompense ? "🎁" : "⏳"}
        </div>

        <h1 className="text-[28px] font-semibold tracking-tight mb-2" style={{ color: "var(--fg)" }}>
          {isOk && "Tampon ajouté !"}
          {isRecompense && "Récompense débloquée !"}
          {isAntiDoublon && "Déjà enregistré"}
        </h1>

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
                {i < result.tampons ? (marchand.icone_tampons || "⭐") : ""}
              </div>
            ))}
          </div>
        )}

        {isRecompense && (
          <button
            onClick={onValiderRecompense}
            className="w-full py-4 rounded-2xl text-[17px] font-semibold text-white"
            style={{ background: "#34C759", boxShadow: "0 8px 24px rgba(52,199,89,0.3)" }}
          >
            Valider la récompense
          </button>
        )}
      </div>
    </main>
  );
}

// ─── Inscription ──────────────────────────────────────────────────────────────

const MOIS = ["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"];

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
      <h1 className="text-[22px] font-semibold tracking-tight mb-1" style={{ color: "var(--fg)" }}>{marchand.nom}</h1>
      <p className="text-[14px]" style={{ color: "var(--fg-secondary)" }}>Programme de fidélité</p>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  background: "rgba(255,255,255,0.07)",
  border: "1px solid rgba(255,255,255,0.1)",
  color: "var(--fg)",
  WebkitAppearance: "none",
};

function InscriptionForm({ marchand, onSuccess, onRecuperation }: {
  marchand: Marchand;
  onSuccess: (client: Client) => void;
  onRecuperation: () => void;
}) {
  const [prenom, setPrenom] = useState("");
  const [nom, setNom] = useState("");
  const [telephone, setTelephone] = useState("");
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
    const date_naissance = `${dateA}-${dateM.padStart(2, "0")}-${dateJ.padStart(2, "0")}`;
    setLoading(true);
    setError("");
    try {
      const { clientId, walletId } = await creerClient({ prenom, nom, telephone, date_naissance, marchand_id: marchand.id });
      onSuccess({ id: clientId, prenom, nom, telephone, date_naissance, wallet_id: walletId, marchand_id: marchand.id, tampons: 0 });
    } catch {
      setError("Une erreur est survenue. Réessayez.");
    } finally {
      setLoading(false);
    }
  }

  const selectStyle: React.CSSProperties = { ...inputStyle, backgroundImage: "none" };

  return (
    <main className="min-h-screen flex flex-col justify-center px-5 py-12" style={{ background: "var(--bg)" }}>
      <div className="w-full max-w-[390px] mx-auto">
        <MarchandHeader marchand={marchand} />

        <div className="rounded-[28px] p-6"
          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)", backdropFilter: "blur(40px)" }}>
          <form onSubmit={handleSubmit} className="space-y-2.5">
            {([
              { value: prenom, set: setPrenom, placeholder: "Prénom", type: "text", autoComplete: "given-name" },
              { value: nom, set: setNom, placeholder: "Nom", type: "text", autoComplete: "family-name" },
              { value: telephone, set: setTelephone, placeholder: "Téléphone", type: "tel", autoComplete: "tel" },
            ] as const).map(f => (
              <input key={f.placeholder} type={f.type} required placeholder={f.placeholder}
                autoComplete={f.autoComplete} value={f.value}
                onChange={e => f.set(e.target.value)}
                className="w-full px-4 py-3.5 rounded-2xl text-[15px] outline-none transition-colors"
                style={inputStyle}
                onFocus={e => (e.target.style.borderColor = "var(--accent)")}
                onBlur={e => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
              />
            ))}

            {/* Date de naissance */}
            <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.1)" }}>
              <p className="text-[11px] font-medium uppercase tracking-wider px-4 pt-3 pb-1"
                style={{ color: "var(--fg-secondary)" }}>Date de naissance</p>
              <div className="grid grid-cols-3 divide-x" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
                {[
                  { value: dateJ, set: setDateJ, placeholder: "Jour", options: Array.from({ length: 31 }, (_, i) => ({ v: String(i + 1), l: String(i + 1) })) },
                  { value: dateM, set: setDateM, placeholder: "Mois", options: MOIS.map((l, i) => ({ v: String(i + 1), l })) },
                  { value: dateA, set: setDateA, placeholder: "Année", options: annees.map(a => ({ v: String(a), l: String(a) })) },
                ].map(s => (
                  <select key={s.placeholder} required value={s.value}
                    onChange={e => s.set(e.target.value)}
                    className="w-full px-3 py-3.5 text-[14px] outline-none bg-transparent"
                    style={{ color: s.value ? "var(--fg)" : "var(--fg-secondary)", ...selectStyle }}>
                    <option value="" disabled>{s.placeholder}</option>
                    {s.options.map(o => <option key={o.v} value={o.v} style={{ background: "#1C1C1E" }}>{o.l}</option>)}
                  </select>
                ))}
              </div>
            </div>

            {error && <p className="text-[13px] px-1" style={{ color: "#FF453A" }}>{error}</p>}

            <button type="submit" disabled={loading}
              className="w-full py-4 rounded-2xl text-[16px] font-semibold text-white transition-opacity active:opacity-80 mt-1"
              style={{ background: "var(--accent)", boxShadow: "0 4px 20px rgba(0,122,255,0.35)" }}>
              {loading ? "Création…" : "Créer ma carte"}
            </button>
          </form>
        </div>

        <p className="text-center text-[13px] mt-5" style={{ color: "rgba(255,255,255,0.35)" }}>
          Déjà inscrit ?{" "}
          <button onClick={onRecuperation} style={{ color: "var(--accent)" }} className="font-medium">
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
  const [telephone, setTelephone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const client = await getClientByTelephone(telephone, marchand.id);
    if (!client) {
      setError("Aucun compte trouvé avec ce numéro.");
      setLoading(false);
      return;
    }
    onSuccess(client);
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6" style={{ background: "var(--bg)" }}>
      <div className="w-full max-w-[380px]">
        <div className="text-center mb-8">
          <h1 className="text-[24px] font-semibold tracking-tight" style={{ color: "var(--fg)" }}>Récupérer mon compte</h1>
          <p className="text-[15px] mt-1" style={{ color: "var(--fg-secondary)" }}>Entre ton numéro de téléphone</p>
        </div>

        <div className="rounded-[28px] p-7"
          style={{ background: "var(--glass-bg)", border: "1px solid var(--glass-border)", backdropFilter: "blur(30px)", boxShadow: "var(--shadow-lg)" }}>
          <form onSubmit={handleSubmit} className="space-y-3">
            <input type="tel" required placeholder="Numéro de téléphone"
              value={telephone} onChange={e => setTelephone(e.target.value)}
              className="w-full px-4 py-3.5 rounded-2xl text-[15px] outline-none transition-all"
              style={{ background: "var(--bg)", border: "1px solid var(--border)", color: "var(--fg)" }}
              onFocus={e => e.target.style.borderColor = "var(--accent)"}
              onBlur={e => e.target.style.borderColor = "var(--border)"}
            />
            {error && <p className="text-red-500 text-[13px]">{error}</p>}
            <button type="submit" disabled={loading}
              className="w-full py-4 rounded-2xl text-[16px] font-semibold text-white transition-all"
              style={{ background: "var(--accent)", boxShadow: "0 4px 16px rgba(0,122,255,0.3)" }}>
              {loading ? "Recherche…" : "Récupérer"}
            </button>
          </form>
        </div>

        <p className="text-center text-[13px] mt-5">
          <button onClick={onBack} style={{ color: "var(--accent)" }} className="font-medium">← Retour</button>
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

        {/* Carte marchand */}
        <div className="rounded-[28px] p-6 mb-5 overflow-hidden relative"
          style={{
            background: `linear-gradient(145deg, ${couleur}, ${couleur2}cc)`,
            boxShadow: `0 24px 60px ${couleur}40`,
          }}>
          <div className="absolute inset-0 opacity-10"
            style={{ background: "radial-gradient(circle at 80% 20%, rgba(255,255,255,0.6) 0%, transparent 50%)" }} />

          <div className="flex items-start justify-between mb-6 relative">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-widest mb-0.5" style={{ color: "rgba(255,255,255,0.6)" }}>
                Carte de fidélité
              </p>
              <p className="text-[19px] font-semibold text-white leading-tight">{marchand.nom}</p>
            </div>
            {logo ? (
              <img src={logo} alt={marchand.nom} className="w-11 h-11 rounded-xl object-cover" style={{ background: "rgba(255,255,255,0.15)" }} />
            ) : (
              <div className="w-11 h-11 rounded-xl flex items-center justify-center text-[18px] font-bold text-white"
                style={{ background: "rgba(255,255,255,0.2)" }}>
                {marchand.nom.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          {/* Tampons */}
          <div className="flex gap-2 mb-6 flex-wrap relative">
            {Array.from({ length: marchand.objectif_tampons }).map((_, i) => (
              <div key={i} className="w-7 h-7 rounded-full transition-all"
                style={{
                  background: i === 0 ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.18)",
                  border: i === 0 ? "none" : "1.5px solid rgba(255,255,255,0.3)",
                  transform: i === 0 ? "scale(1.1)" : "scale(1)",
                }} />
            ))}
          </div>

          <div className="flex items-end justify-between relative">
            <div>
              <p className="text-[10px] uppercase tracking-widest mb-0.5" style={{ color: "rgba(255,255,255,0.55)" }}>Client</p>
              <p className="text-[15px] font-medium text-white">{client.prenom} {client.nom}</p>
            </div>
            <p className="text-[11px] font-medium" style={{ color: "rgba(255,255,255,0.5)" }}>
              1 / {marchand.objectif_tampons}
            </p>
          </div>
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
            <a href={`/api/apple-wallet/generate/${client.wallet_id}`} download
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
