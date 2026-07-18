"use client";

import { useEffect, useState, useCallback } from "react";
import {
  getMarchandByNfcId, getClientByWalletId, getClientByTelephone,
  creerClient, ajouterTampon, validerRecompense,
  formatTemps, WALLET_KEY,
  type Marchand, type Client, type TamponResult,
} from "@/lib/loyalty";

type Screen =
  | { type: "loading" }
  | { type: "result"; result: TamponResult; client: Client; marchand: Marchand }
  | { type: "inscription"; marchand: Marchand }
  | { type: "recuperation"; marchand: Marchand }
  | { type: "carte"; client: Client; marchand: Marchand }
  | { type: "erreur"; message: string };

export default function NfcPage({ params }: { params: { marchandId: string } }) {
  const { marchandId } = params;
  const [screen, setScreen] = useState<Screen>({ type: "loading" });

  const traiterTampon = useCallback(async (client: Client, marchand: Marchand) => {
    const result = await ajouterTampon(client, marchand);
    setScreen({ type: "result", result, client, marchand });
  }, []);

  useEffect(() => {
    async function init() {
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
        await validerRecompense(screen.client.id, screen.marchand);
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
      onSuccess={async (client) => {
        localStorage.setItem(WALLET_KEY(marchandId), client.wallet_id);
        await traiterTampon(client, screen.marchand);
      }}
      onBack={() => setScreen({ type: "inscription", marchand: screen.marchand })}
    />
  );
  if (screen.type === "carte") return <CarteCreee client={screen.client} marchand={screen.marchand} />;
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

function InscriptionForm({ marchand, onSuccess, onRecuperation }: {
  marchand: Marchand;
  onSuccess: (client: Client) => void;
  onRecuperation: () => void;
}) {
  const [form, setForm] = useState({ prenom: "", nom: "", date_naissance: "", telephone: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const { clientId, walletId } = await creerClient({ ...form, marchand_id: marchand.id });
      onSuccess({ id: clientId, ...form, wallet_id: walletId, marchand_id: marchand.id, tampons: 0 });
    } catch {
      setError("Une erreur est survenue. Réessayez.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-10" style={{ background: "var(--bg)" }}>
      <div className="w-full max-w-[380px]">
        <div className="text-center mb-8">
          <div className="text-4xl mb-3">{marchand.icone_tampons || "⭐"}</div>
          <h1 className="text-[24px] font-semibold tracking-tight" style={{ color: "var(--fg)" }}>{marchand.nom}</h1>
          <p className="text-[15px] mt-1" style={{ color: "var(--fg-secondary)" }}>Créer votre carte de fidélité</p>
        </div>

        <div className="rounded-[28px] p-7"
          style={{ background: "var(--glass-bg)", border: "1px solid var(--glass-border)", backdropFilter: "blur(30px)", boxShadow: "var(--shadow-lg)" }}>
          <form onSubmit={handleSubmit} className="space-y-3">
            {[
              { key: "prenom", placeholder: "Prénom", type: "text" },
              { key: "nom", placeholder: "Nom", type: "text" },
              { key: "telephone", placeholder: "Téléphone", type: "tel" },
              { key: "date_naissance", placeholder: "Date de naissance", type: "date" },
            ].map(f => (
              <input key={f.key} type={f.type} required placeholder={f.placeholder}
                value={form[f.key as keyof typeof form]}
                onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                className="w-full px-4 py-3.5 rounded-2xl text-[15px] outline-none transition-all"
                style={{ background: "var(--bg)", border: "1px solid var(--border)", color: "var(--fg)" }}
                onFocus={e => e.target.style.borderColor = "var(--accent)"}
                onBlur={e => e.target.style.borderColor = "var(--border)"}
              />
            ))}

            {error && <p className="text-red-500 text-[13px]">{error}</p>}

            <button type="submit" disabled={loading}
              className="w-full py-4 rounded-2xl text-[16px] font-semibold text-white mt-1 transition-all"
              style={{ background: "var(--accent)", boxShadow: "0 4px 16px rgba(0,122,255,0.3)" }}>
              {loading ? "Création…" : "Créer ma carte"}
            </button>
          </form>
        </div>

        <p className="text-center text-[13px] mt-5" style={{ color: "var(--fg-tertiary)" }}>
          Déjà une carte ?{" "}
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

function CarteCreee({ client, marchand }: { client: Client; marchand: Marchand }) {
  return (
    <main className="min-h-screen flex items-center justify-center px-6" style={{ background: "var(--bg)" }}>
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[50%] translate-x-[-50%] w-[600px] h-[500px] rounded-full opacity-20"
          style={{ background: "radial-gradient(circle, rgba(0,122,255,0.25) 0%, transparent 70%)" }} />
      </div>

      <div className="w-full max-w-[360px] relative text-center">
        <h1 className="text-[28px] font-semibold tracking-tight mb-2" style={{ color: "var(--fg)" }}>
          Bienvenue, {client.prenom} !
        </h1>
        <p className="text-[16px] mb-8" style={{ color: "var(--fg-secondary)" }}>
          Votre carte de fidélité est créée · 1er tampon ajouté
        </p>

        {/* Carte preview */}
        <div className="rounded-[28px] p-6 mb-6 text-left"
          style={{
            background: `linear-gradient(135deg, ${marchand.couleur_principale || "#007AFF"}, #005EC4)`,
            boxShadow: "0 20px 60px rgba(0,122,255,0.35)",
          }}>
          <div className="flex items-start justify-between mb-8">
            <div>
              <p className="text-white/60 text-[12px] font-medium uppercase tracking-wider">Carte de fidélité</p>
              <p className="text-white text-[18px] font-semibold mt-0.5">{marchand.nom}</p>
            </div>
            <span className="text-[28px]">{marchand.icone_tampons || "⭐"}</span>
          </div>

          <div className="flex gap-2 mb-8 flex-wrap">
            {Array.from({ length: marchand.objectif_tampons }).map((_, i) => (
              <div key={i} className="w-7 h-7 rounded-full flex items-center justify-center text-sm"
                style={{ background: i === 0 ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.2)" }}>
                {i === 0 ? (marchand.icone_tampons || "⭐") : ""}
              </div>
            ))}
          </div>

          <div>
            <p className="text-white/60 text-[11px] uppercase tracking-wider">Client</p>
            <p className="text-white text-[16px] font-medium">{client.prenom} {client.nom}</p>
          </div>
        </div>

        {/* Bouton Wallet (placeholder — actif à la brique 4) */}
        <div className="rounded-2xl py-4 px-6 flex items-center justify-center gap-3"
          style={{ background: "var(--glass-bg)", border: "1px solid var(--glass-border)", backdropFilter: "blur(20px)" }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <rect x="2" y="5" width="20" height="14" rx="3" stroke="var(--fg-secondary)" strokeWidth="1.5"/>
            <path d="M2 10H22" stroke="var(--fg-secondary)" strokeWidth="1.5"/>
          </svg>
          <span className="text-[15px] font-medium" style={{ color: "var(--fg-secondary)" }}>
            Ajouter à Apple Wallet — disponible prochainement
          </span>
        </div>
      </div>
    </main>
  );
}
