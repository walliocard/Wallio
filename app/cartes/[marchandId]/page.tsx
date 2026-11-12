"use client";

import { useEffect, useState, useCallback, use, lazy, Suspense } from "react";
import Link from "next/link";
import {
  getMarchandByNfcId,
  getClientByWalletId, getClientByTelephone, creerClient,
  WALLET_KEY,
  type Marchand, type Client,
} from "@/lib/loyalty";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { registerFcmToken } from "@/lib/fcm";
import { useTimeTheme } from "@/hooks/useTimeTheme";
import { getWalletLang } from "@/lib/wallet-lang";
import InstallBanner from "@/components/InstallBanner";

const AppleWalletCard    = lazy(() => import("@/components/AppleWalletCard"));
const GoogleWalletCard   = lazy(() => import("@/components/GoogleWalletCard"));
const PasskeyRegisterBanner = lazy(() => import("@/components/PasskeyRegisterBanner"));

type Screen =
  | { type: "loading" }
  | { type: "inscription"; marchand: Marchand }
  | { type: "recuperation"; marchand: Marchand }
  | { type: "carte"; client: Client; marchand: Marchand; isNew?: boolean }
  | { type: "erreur"; message: string };

function setCookiePhone(phone: string) {
  const exp = new Date(); exp.setFullYear(exp.getFullYear() + 1);
  document.cookie = `wallio_p=${encodeURIComponent(phone)}; expires=${exp.toUTCString()}; path=/; SameSite=Lax`;
}
function getCookiePhone(): string | null {
  const m = document.cookie.match(/(?:^|;\s*)wallio_p=([^;]+)/);
  return m ? decodeURIComponent(m[1]) : null;
}

const BG_PAGE = "#F0F4FF";
const BG_CARD = "#FFFFFF";
const BORDER  = "rgba(99,102,241,0.14)";
const FG_MAIN = "#1D1D1F";
const FG_SEC  = "#6E6E73";
const ACCENT  = "#007AFF";
const ACCENT_FG = "#FFFFFF";
const BTN_BG  = "linear-gradient(135deg, #007AFF 0%, #8B5CF6 100%)";
const inputStyle: React.CSSProperties = { background: BG_CARD, border: `1px solid ${BORDER}`, color: FG_MAIN, WebkitAppearance: "none" };

function isLightColor(hex: string): boolean {
  const h = (hex || "#007AFF").replace("#", "");
  const r = parseInt(h.substring(0, 2), 16), g = parseInt(h.substring(2, 4), 16), b = parseInt(h.substring(4, 6), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 160;
}

export default function CartesPage({ params }: { params: Promise<{ marchandId: string }> }) {
  const { marchandId } = use(params);
  const [screen, setScreen] = useState<Screen>({ type: "loading" });
  useTimeTheme("light");

  const afficherCarte = useCallback((client: Client, marchand: Marchand, isNew = false) => {
    setScreen({ type: "carte", client, marchand, isNew });
  }, []);

  useEffect(() => {
    async function init() {
      try {
        const CACHE_KEY = `wm_${marchandId}`;
        const CACHE_TTL = 4 * 60 * 60 * 1000;
        let marchand: Marchand | null = null;
        try {
          const raw = localStorage.getItem(CACHE_KEY);
          if (raw) { const { d, ts } = JSON.parse(raw); if (Date.now() - ts < CACHE_TTL) marchand = d; }
        } catch {}
        if (!marchand) {
          marchand = await getMarchandByNfcId(marchandId);
          if (marchand) try { localStorage.setItem(CACHE_KEY, JSON.stringify({ d: marchand, ts: Date.now() })); } catch {}
        }
        if (!marchand || !marchand.actif) {
          setScreen({ type: "erreur", message: "Ce service est temporairement indisponible." });
          return;
        }

        // Client existant via localStorage
        const walletId = localStorage.getItem(WALLET_KEY(marchandId));
        if (walletId) {
          const client = await getClientByWalletId(walletId, marchand.id);
          if (client) { afficherCarte(client, marchand); return; }
          localStorage.removeItem(WALLET_KEY(marchandId));
        }

        // Identité Wallio connue → inscription auto chez un nouveau marchand (sans tampon)
        const cachedPhone  = localStorage.getItem("wallio_client_phone");
        const cachedPrenom = localStorage.getItem("wallio_client_prenom");
        const cachedNom    = localStorage.getItem("wallio_client_nom");
        const cachedDob    = localStorage.getItem("wallio_client_dob");
        if (cachedPhone && cachedPrenom && cachedNom) {
          const existing = await getClientByTelephone(cachedPhone, marchand.id);
          if (existing) { localStorage.setItem(WALLET_KEY(marchandId), existing.wallet_id); afficherCarte(existing, marchand); return; }
          const { clientId, walletId: newWalletId } = await creerClient({
            prenom: cachedPrenom, nom: cachedNom, telephone: cachedPhone,
            date_naissance: cachedDob || "", marchand_id: marchand.id,
          });
          localStorage.setItem(WALLET_KEY(marchandId), newWalletId);
          afficherCarte({ id: clientId, prenom: cachedPrenom, nom: cachedNom, telephone: cachedPhone, date_naissance: cachedDob || "", wallet_id: newWalletId, marchand_id: marchand.id, tampons: 0 }, marchand, true);
          return;
        }

        // Fallback cookie
        const cookiePhone = getCookiePhone();
        if (cookiePhone) {
          const existing = await getClientByTelephone(cookiePhone, marchand.id);
          if (existing) { localStorage.setItem(WALLET_KEY(marchandId), existing.wallet_id); afficherCarte(existing, marchand); return; }
        }

        setScreen({ type: "inscription", marchand });
      } catch (e) {
        setScreen({ type: "erreur", message: `Erreur de connexion. Réessayez. (${String(e).slice(0, 60)})` });
      }
    }
    init();
  }, [marchandId, afficherCarte]);

  if (screen.type === "loading") return <Loading />;
  if (screen.type === "erreur")  return <Erreur message={screen.message} />;
  if (screen.type === "inscription") return (
    <InscriptionForm
      marchand={screen.marchand}
      onSuccess={async (client, isNew) => {
        localStorage.setItem(WALLET_KEY(marchandId), client.wallet_id);
        if (client.telephone)      { localStorage.setItem("wallio_client_phone", client.telephone); setCookiePhone(client.telephone); }
        if (client.prenom)         localStorage.setItem("wallio_client_prenom", client.prenom);
        if (client.nom)            localStorage.setItem("wallio_client_nom", client.nom);
        if (client.date_naissance) localStorage.setItem("wallio_client_dob", client.date_naissance);
        afficherCarte(client, screen.marchand, isNew);
      }}
      onRecuperation={() => setScreen({ type: "recuperation", marchand: screen.marchand })}
    />
  );
  if (screen.type === "recuperation") return (
    <RecuperationForm
      marchand={screen.marchand}
      onSuccess={(client) => {
        localStorage.setItem(WALLET_KEY(marchandId), client.wallet_id);
        if (client.telephone)      { localStorage.setItem("wallio_client_phone", client.telephone); setCookiePhone(client.telephone); }
        if (client.prenom)         localStorage.setItem("wallio_client_prenom", client.prenom);
        if (client.nom)            localStorage.setItem("wallio_client_nom", client.nom);
        if (client.date_naissance) localStorage.setItem("wallio_client_dob", client.date_naissance);
        afficherCarte(client, screen.marchand);
      }}
      onBack={() => setScreen({ type: "inscription", marchand: screen.marchand })}
    />
  );
  if (screen.type === "carte") return <CarteView client={screen.client} marchand={screen.marchand} isNew={screen.isNew} />;
  return null;
}

// ─── Loading ──────────────────────────────────────────────────────────────────

function Loading() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-8" style={{ background: BG_PAGE }}>
      <div style={{ display: "flex", gap: 10, marginBottom: 28 }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{ width: 10, height: 10, borderRadius: "50%", background: "rgba(99,102,241,0.5)", animation: `pulse-dot 1.2s ease-in-out ${i * 0.2}s infinite` }} />
        ))}
      </div>
      <style>{`@keyframes pulse-dot{0%,100%{opacity:.3;transform:scale(.85)}50%{opacity:1;transform:scale(1)}}`}</style>
      <p style={{ fontSize: 16, fontWeight: 600, color: "#3C3C43" }}>Chargement…</p>
    </main>
  );
}

// ─── Erreur ───────────────────────────────────────────────────────────────────

function Erreur({ message }: { message: string }) {
  return (
    <main className="min-h-screen flex items-center justify-center px-6" style={{ background: BG_PAGE }}>
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

// ─── Header marchand ──────────────────────────────────────────────────────────

function MarchandHeader({ marchand }: { marchand: Marchand }) {
  const m = marchand as Record<string, unknown>;
  const logo = m.logo_url as string | undefined;
  const couleur = marchand.couleur_principale || "#007AFF";
  return (
    <div className="text-center mb-10">
      <div className="flex justify-center mb-4">
        {logo ? (
          <img src={logo} alt={marchand.nom} className="w-16 h-16 rounded-2xl object-cover" style={{ boxShadow: `0 8px 24px ${couleur}40` }} />
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
  { code: "+40",  flag: "🇷🇴", label: "Roumanie",     digits: 9  },
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

function InscriptionForm({ marchand, onSuccess, onRecuperation }: {
  marchand: Marchand;
  onSuccess: (client: Client, isNew: boolean) => void;
  onRecuperation: () => void;
}) {
  const [prenom, setPrenom] = useState("");
  const [nom, setNom] = useState("");
  const [email, setEmail] = useState("");
  const [pin, setPin] = useState("");
  const [indicatif, setIndicatif] = useState(PAYS[0]);
  const [numLocal, setNumLocal] = useState("");
  const [dateJ, setDateJ] = useState("");
  const [dateM, setDateM] = useState("");
  const [dateA, setDateA] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [consent, setConsent] = useState(false);
  const anneeMax = new Date().getFullYear() - 5;
  const annees = Array.from({ length: 90 }, (_, i) => anneeMax - i);
  const m = marchand as Record<string, unknown>;
  const couleur = (m.apple_bg_color as string) || marchand.couleur_principale || "#007AFF";
  const isLight = isLightColor(couleur);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!dateJ || !dateM || !dateA) { setError("Veuillez saisir votre date de naissance."); return; }
    const numPropre = numLocal.replace(/\D/g, "").replace(/^0/, "");
    if (numPropre.length < indicatif.digits - 1) { setError(`Numéro invalide (${indicatif.digits} chiffres attendus).`); return; }
    const telephone = `${indicatif.code}${numPropre}`;
    const date_naissance = `${dateA}-${dateM.padStart(2, "0")}-${dateJ.padStart(2, "0")}`;
    setLoading(true); setError("");
    try {
      const existing = await getClientByTelephone(telephone, marchand.id);
      if (existing) { onSuccess(existing, false); return; }
      const { clientId, walletId } = await creerClient({ prenom, nom, telephone, date_naissance, marchand_id: marchand.id, email: email.trim() || undefined });
      if (email.trim()) {
        fetch("/api/send-welcome-email", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: email.trim(), prenom, marchandNom: marchand.nom, walletId, mode: "inscription" }),
        }).catch(() => {});
      }
      if (pin) {
        await fetch("/api/client/set-pin", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ telephone, pin }),
        }).catch(() => {});
      }
      onSuccess({ id: clientId, prenom, nom, telephone, date_naissance, wallet_id: walletId, marchand_id: marchand.id, tampons: 0 }, true);
    } catch { setError("Une erreur est survenue. Réessayez."); }
    finally { setLoading(false); }
  }

  return (
    <main className="min-h-screen flex flex-col px-5 py-12" style={{ background: BG_PAGE }}>
      <div className="w-full max-w-[390px] mx-auto">
        <MarchandHeader marchand={marchand} />
        <div className="rounded-[28px] p-6" style={{ background: BG_CARD, border: `1px solid ${BORDER}`, boxShadow: "0 8px 40px rgba(0,0,0,0.05)" }}>
          <form onSubmit={handleSubmit} className="space-y-2.5">
            {([
              { value: prenom, set: setPrenom, placeholder: "Prénom", autoComplete: "given-name" },
              { value: nom,    set: setNom,    placeholder: "Nom",    autoComplete: "family-name" },
            ] as const).map(f => (
              <input key={f.placeholder} type="text" required placeholder={f.placeholder} autoComplete={f.autoComplete}
                value={f.value} onChange={e => f.set(e.target.value)}
                className="w-full px-4 py-3.5 rounded-2xl text-[15px] outline-none"
                style={inputStyle}
                onFocus={e => (e.target.style.borderColor = ACCENT)}
                onBlur={e => (e.target.style.borderColor = BORDER)} />
            ))}

            <div className="flex rounded-2xl overflow-hidden" style={{ ...inputStyle, padding: 0 }}>
              <select value={indicatif.code} onChange={e => setIndicatif(PAYS.find(p => p.code === e.target.value) ?? PAYS[0])}
                className="outline-none text-[14px] font-medium shrink-0 border-r"
                style={{ background: "transparent", color: FG_MAIN, borderColor: BORDER, padding: "0 10px 0 14px", WebkitAppearance: "none" }}>
                {PAYS.map(p => <option key={p.code} value={p.code} style={{ background: BG_CARD }}>{p.flag} {p.code}</option>)}
              </select>
              <input type="tel" required placeholder={`Numéro (${indicatif.digits} chiffres)`} autoComplete="tel-national"
                value={numLocal} onChange={e => setNumLocal(e.target.value.replace(/[^\d\s]/g, ""))}
                className="flex-1 px-4 py-3.5 text-[15px] outline-none bg-transparent" style={{ color: FG_MAIN }} />
            </div>

            <div className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${BORDER}` }}>
              <p className="text-[11px] font-medium uppercase tracking-wider px-4 pt-3 pb-1" style={{ color: FG_SEC }}>Date de naissance</p>
              <div className="grid grid-cols-3 divide-x" style={{ borderColor: BORDER }}>
                {[
                  { value: dateJ, set: setDateJ, placeholder: "Jour",  options: Array.from({ length: 31 }, (_, i) => ({ v: String(i + 1), l: String(i + 1) })) },
                  { value: dateM, set: setDateM, placeholder: "Mois",  options: MOIS.map((l, i) => ({ v: String(i + 1), l })) },
                  { value: dateA, set: setDateA, placeholder: "Année", options: annees.map(a => ({ v: String(a), l: String(a) })) },
                ].map(s => (
                  <select key={s.placeholder} required value={s.value} onChange={e => s.set(e.target.value)}
                    className="w-full px-3 py-3.5 text-[14px] outline-none bg-transparent"
                    style={{ color: s.value ? FG_MAIN : FG_SEC, backgroundImage: "none", WebkitAppearance: "none" }}>
                    <option value="" disabled>{s.placeholder}</option>
                    {s.options.map(o => <option key={o.v} value={o.v} style={{ background: BG_CARD }}>{o.l}</option>)}
                  </select>
                ))}
              </div>
            </div>

            <input type="email" placeholder="Email" required value={email}
              onChange={e => setEmail(e.target.value)} autoComplete="email"
              className="w-full px-4 py-3.5 rounded-2xl text-[15px] outline-none"
              style={inputStyle}
              onFocus={e => (e.target.style.borderColor = ACCENT)}
              onBlur={e => (e.target.style.borderColor = BORDER)} />
            <input type="password" inputMode="numeric" pattern="\d{4}" maxLength={4}
              placeholder="Code PIN à 4 chiffres" required value={pin}
              onChange={e => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
              className="w-full px-4 py-3.5 rounded-2xl text-[15px] outline-none"
              style={{ ...inputStyle, textAlign: "center", letterSpacing: "0.5em", fontWeight: 700 }}
              onFocus={e => (e.target.style.borderColor = ACCENT)}
              onBlur={e => (e.target.style.borderColor = BORDER)} />

            {error && <p className="text-[13px] px-1" style={{ color: "#FF453A" }}>{error}</p>}

            <label className="flex items-center gap-3 px-1 py-1 cursor-pointer select-none">
              <input type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)}
                style={{ width: 18, height: 18, accentColor: ACCENT, cursor: "pointer", flexShrink: 0 }} />
              <span className="text-[12px] leading-snug" style={{ color: FG_SEC }}>
                J&apos;accepte la{" "}
                <a href="/privacy" target="_blank" rel="noopener noreferrer" style={{ color: ACCENT, textDecoration: "underline", fontWeight: 600 }}>
                  politique de confidentialité
                </a>
              </span>
            </label>

            <button type="submit" disabled={loading || !consent}
              className="w-full py-4 rounded-2xl text-[16px] font-semibold transition-opacity active:opacity-80 mt-1"
              style={{ background: couleur, color: isLight ? "#1D1D1F" : "#FFFFFF", opacity: consent ? 1 : 0.45 }}>
              {loading ? "Création…" : "Créer ma carte"}
            </button>
          </form>
        </div>
        <p className="text-center text-[13px] mt-5" style={{ color: FG_SEC }}>
          Déjà inscrit ?{" "}
          <button onClick={onRecuperation} style={{ color: ACCENT }} className="font-semibold">Récupérer mon compte</button>
        </p>
      </div>
    </main>
  );
}

// ─── PWA Install Banner ───────────────────────────────────────────────────────

// ─── Récupération ─────────────────────────────────────────────────────────────

function RecuperationForm({ marchand, onSuccess, onBack }: { marchand: Marchand; onSuccess: (c: Client) => void; onBack: () => void }) {
  const [indicatif, setIndicatif] = useState(PAYS[0]);
  const [numLocal, setNumLocal] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setLoading(true); setError("");
    const numPropre = numLocal.replace(/\D/g, "").replace(/^0/, "");
    const telephone = `${indicatif.code}${numPropre}`;
    const client = await getClientByTelephone(telephone, marchand.id);
    if (!client) { setError("Aucun compte trouvé avec ce numéro."); setLoading(false); return; }
    onSuccess(client);
  }

  return (
    <main className="min-h-screen flex flex-col px-5 py-12" style={{ background: BG_PAGE }}>
      <div className="w-full max-w-[390px] mx-auto">
        <MarchandHeader marchand={marchand} />
        <div className="rounded-[28px] p-6" style={{ background: BG_CARD, border: `1px solid ${BORDER}`, boxShadow: "0 8px 40px rgba(0,0,0,0.06)" }}>
          <p className="text-[17px] font-semibold mb-0.5" style={{ color: FG_MAIN }}>Récupérer mon compte</p>
          <p className="text-[13px] mb-5" style={{ color: FG_SEC }}>Entre le numéro utilisé lors de ton inscription</p>
          <form onSubmit={handleSubmit} className="space-y-2.5">
            <div className="flex rounded-2xl overflow-hidden" style={{ ...inputStyle, padding: 0 }}>
              <select value={indicatif.code} onChange={e => setIndicatif(PAYS.find(p => p.code === e.target.value) ?? PAYS[0])}
                className="outline-none text-[14px] font-medium shrink-0 border-r"
                style={{ background: "transparent", color: FG_MAIN, borderColor: BORDER, padding: "0 10px 0 14px", WebkitAppearance: "none" }}>
                {PAYS.map(p => <option key={p.code} value={p.code} style={{ background: BG_CARD }}>{p.flag} {p.code}</option>)}
              </select>
              <input type="tel" required placeholder={`Numéro (${indicatif.digits} chiffres)`} autoComplete="tel-national"
                value={numLocal} onChange={e => setNumLocal(e.target.value.replace(/[^\d\s]/g, ""))}
                className="flex-1 px-4 py-3.5 text-[15px] outline-none bg-transparent" style={{ color: FG_MAIN }} />
            </div>
            {error && <p className="text-[13px] px-1" style={{ color: "#FF453A" }}>{error}</p>}
            <button type="submit" disabled={loading}
              className="w-full py-4 rounded-2xl text-[16px] font-semibold transition-opacity active:opacity-80"
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

// ─── Vue carte (sans tampon) ──────────────────────────────────────────────────

function CarteView({ client, marchand, isNew }: { client: Client; marchand: Marchand; isNew?: boolean }) {
  const [isAndroid, setIsAndroid] = useState(false);
  useEffect(() => { setIsAndroid(/android/i.test(navigator.userAgent)); }, []);
  const ld = getWalletLang((marchand as unknown as Record<string, unknown>).langue as string | undefined);
  const m = marchand as Record<string, unknown>;
  const couleur = marchand.couleur_principale || "#007AFF";
  const logo = m.logo_url as string | undefined;
  const paliersDef = (m.paliers as { tampons: number; recompense: string }[] | undefined) || [];
  const paliersValides = (client.paliers_valides || []) as boolean[];
  const prochainPalier = m.mode_recompense === "progressif" && paliersDef.length > 0
    ? (paliersDef.find((p, i) => !paliersValides[i]) ?? paliersDef[paliersDef.length - 1]) : null;
  const flexObjectif = m.mode_recompense === "flex"
    ? ((client as Record<string, unknown>).choix_fait === "grand" ? ((m.objectif_tampons as number) || 10) : ((m.palier_intermediaire as number) || 5)) : null;
  const displayObjectif = prochainPalier ? prochainPalier.tampons : (flexObjectif ?? marchand.objectif_tampons);
  const displayReward = prochainPalier ? prochainPalier.recompense
    : m.mode_recompense === "flex"
      ? ((client as Record<string, unknown>).choix_fait === "grand" ? ((m.nom_recompense_grand as string) || ld.reward) : ((m.nom_recompense_petit as string) || ld.reward))
      : ((m.nom_recompense as string) || ld.reward);

  const [notifState, setNotifState] = useState<"idle" | "granted" | "denied">(() => {
    if (typeof window === "undefined") return "idle";
    if (!("Notification" in window)) return "denied";
    if (Notification.permission === "granted") return "granted";
    if (Notification.permission === "denied") return "denied";
    return "idle";
  });

  async function activerNotifications() {
    if (!("Notification" in window)) { setNotifState("denied"); return; }
    const perm = await Notification.requestPermission();
    if (perm === "granted") {
      setNotifState("granted");
      const token = await registerFcmToken();
      if (token && client.id) {
        await updateDoc(doc(db, "clients", client.id), { fcm_token: token });
        const cachedPhone = localStorage.getItem("wallio_client_phone");
        if (cachedPhone) {
          const { collection, query, where, getDocs } = await import("firebase/firestore");
          const snap = await getDocs(query(collection(db, "clients"), where("telephone", "==", cachedPhone)));
          await Promise.all(snap.docs.filter(d => d.id !== client.id).map(d => updateDoc(d.ref, { fcm_token: token })));
        }
      }
    } else { setNotifState("denied"); }
  }

  return (
    <main className="min-h-screen flex flex-col px-5 pt-12 pb-16" style={{ background: "var(--bg)" }}>
      <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
        <div className="absolute top-[-10%] left-[50%] translate-x-[-50%] w-[500px] h-[400px] rounded-full"
          style={{ background: `radial-gradient(circle, ${couleur}22 0%, transparent 70%)` }} />
      </div>

      <div className="w-full max-w-[390px] mx-auto relative" style={{ zIndex: 1 }}>
        <div className="text-center mb-7">
          {logo ? (
            <img src={logo} alt={marchand.nom} className="w-14 h-14 rounded-2xl object-cover mx-auto mb-3"
              style={{ boxShadow: `0 8px 24px ${couleur}40` }} />
          ) : (
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-[22px] font-bold text-white mx-auto mb-3"
              style={{ background: couleur }}>
              {marchand.nom.charAt(0).toUpperCase()}
            </div>
          )}
          <h1 className="text-[26px] font-semibold tracking-tight mb-1" style={{ color: "var(--fg)" }}>
            {isNew ? `Bienvenue, ${client.prenom} !` : `Bonjour, ${client.prenom} !`}
          </h1>
          <p className="text-[14px]" style={{ color: "var(--fg-secondary)" }}>
            {isNew
              ? "Votre carte est créée — scannez le tag NFC pour votre 1er tampon"
              : `${client.tampons} tampon${(client.tampons ?? 0) > 1 ? "s" : ""} · ${marchand.nom}`}
          </p>
        </div>

        <div className="mb-5 -mx-5 flex justify-center" style={{ touchAction: "pan-y", overflowX: "hidden" }}>
          <Suspense fallback={<div style={{ width: 340, height: 300, borderRadius: 16, background: couleur, opacity: 0.3 }} />}>
            {isAndroid ? (
              <GoogleWalletCard
                logoUrl={logo} logoText={marchand.nom}
                backgroundColor={(m.google_bg_color as string) || (m.apple_bg_color as string) || couleur}
                heroUrl={(m.google_hero_url as string) || (m.strip_url as string) || undefined}
                stampsCurrent={client.tampons ?? 0} stampsObjective={displayObjectif} rewardName={displayReward}
                previewUid={client.wallet_id}
                primaryLabel={(m.google_primary_label as string) || ld.stamps}
                secondaryLabel={(m.google_secondary_label as string) || "Objectif"}
                textModules={((m.google_text_modules as { header: string; body: string; id: string }[]) || [])}
                links={((m.google_links as { uri: string; description: string }[]) || [])}
              />
            ) : (
              <AppleWalletCard
                logoUrl={logo} logoText={marchand.nom}
                stripUrl={(m.strip_url as string) || undefined}
                backgroundColor={(m.apple_bg_color as string) || couleur}
                foregroundColor={(m.apple_fg_color as string) || undefined}
                labelColor={(m.apple_label_color as string) || undefined}
                stampsCurrent={client.tampons ?? 0} stampsObjective={displayObjectif} rewardName={displayReward}
                previewUid={client.wallet_id} clientPrenom={client.prenom} clientNom={client.nom}
                primaryLabel={(m.apple_primary_label as string) || ld.stamps}
                rewardLabel={(m.apple_reward_label as string) || ld.reward}
                memberLabel={(m.apple_member_label as string) || ld.member}
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
          </Suspense>
        </div>

        {/* Notifications */}
        {m.notif_actif !== false && notifState === "idle" && (
          <div className="rounded-[22px] p-5 mb-4"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)", backdropFilter: "blur(40px)" }}>
            <p className="text-[15px] font-semibold mb-1" style={{ color: "var(--fg)" }}>Restez informé</p>
            <p className="text-[13px] mb-4" style={{ color: "var(--fg-secondary)", lineHeight: 1.55 }}>
              {(m.notif_message as string) || `Recevez vos récompenses et offres de ${marchand.nom}`}
            </p>
            <div className="flex gap-2">
              <button onClick={activerNotifications}
                className="flex-1 py-3 rounded-2xl text-[14px] font-semibold text-white"
                style={{ background: "var(--accent)" }}>Activer</button>
              <button onClick={() => setNotifState("denied")}
                className="py-3 px-5 rounded-2xl text-[14px] font-medium"
                style={{ background: "rgba(255,255,255,0.08)", color: "var(--fg-secondary)" }}>Plus tard</button>
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

        <PasskeyRegisterBanner telephone={client.telephone || ""} />

        <InstallBanner />

        {/* Boutons Wallet */}
        <div className="flex flex-col gap-2.5 mt-2">
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

        <Link href="/mes-cartes" className="block mt-5 py-4 rounded-2xl text-center text-[15px] font-semibold"
          style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)", color: "var(--fg)" }}>
          Voir toutes mes cartes
        </Link>
      </div>
    </main>
  );
}
