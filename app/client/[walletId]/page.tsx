"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { doc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  getClientByWalletId, getMarchandById,
  ajouterTampon, validerRecompense, setTampons,
  formatTemps, formatTempsDepuis,
  type Client, type Marchand, type TamponResult,
} from "@/lib/loyalty";
import { useAuth } from "@/lib/auth-context";
import { Icons } from "@/components/dashboard/icons";

export default function ClientQrPage({ params }: { params: Promise<{ walletId: string }> }) {
  const { walletId } = use(params);
  const { user, marchand: marchandAuth, loading: authLoading } = useAuth();
  const [client, setClient] = useState<Client | null>(null);
  const [marchand, setMarchand] = useState<Marchand | null>(null);
  const [result, setResult] = useState<TamponResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [ajoutEnCours, setAjoutEnCours] = useState(false);
  const [validationEnCours, setValidationEnCours] = useState(false);
  const [adjusting, setAdjusting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleted, setDeleted] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user || !marchandAuth?.actif) { setLoading(false); return; }
    async function init() {
      const m = await getMarchandById(user!.uid);
      if (!m) { setLoading(false); return; }
      setMarchand(m);
      const c = await getClientByWalletId(walletId, user!.uid);
      setClient(c);
      setLoading(false);
    }
    init();
  }, [user, marchandAuth, authLoading, walletId]);

  async function handleAjouterTampon() {
    if (!client || !marchand || ajoutEnCours) return;
    setAjoutEnCours(true);
    const r = await ajouterTampon(client, marchand);
    setResult(r);
    if (r.type === "ok") {
      setClient(prev => prev ? { ...prev, tampons: r.tampons, derniere_visite: { seconds: Date.now() / 1000 } as never } : prev);
      const body = JSON.stringify({ walletId: client.wallet_id });
      const opts = { method: "POST", headers: { "Content-Type": "application/json" }, body };
      fetch("/api/apple-wallet/push-update", opts).catch(() => {});
      fetch("/api/google-wallet/push-update", opts).catch(() => {});
    }
    if (r.type === "recompense") {
      setClient(prev => prev ? { ...prev, tampons: 0, recompense_en_attente: true, derniere_visite: { seconds: Date.now() / 1000 } as never } : prev);
      const body = JSON.stringify({ walletId: client.wallet_id });
      const opts = { method: "POST", headers: { "Content-Type": "application/json" }, body };
      fetch("/api/apple-wallet/push-update", opts).catch(() => {});
      fetch("/api/google-wallet/push-update", opts).catch(() => {});
    }
    setAjoutEnCours(false);
  }

  async function handleValiderRecompense() {
    if (!client || !marchand || validationEnCours) return;
    setValidationEnCours(true);
    await validerRecompense(client.id);
    setResult(null);
    setClient(prev => prev ? { ...prev, tampons: 0, recompense_en_attente: false } : prev);
    setValidationEnCours(false);
  }

  async function handleAjuster(delta: number) {
    if (!client || !marchand || adjusting) return;
    const next = Math.max(0, Math.min(client.tampons + delta, marchand.objectif_tampons));
    setAdjusting(true);
    await setTampons(client.id, next);
    setClient(prev => prev ? { ...prev, tampons: next } : prev);
    setResult(null);
    const body = JSON.stringify({ walletId: client.wallet_id });
    const opts = { method: "POST", headers: { "Content-Type": "application/json" }, body };
    fetch("/api/apple-wallet/push-update", opts).catch(() => {});
    fetch("/api/google-wallet/push-update", opts).catch(() => {});
    setAdjusting(false);
  }

  if (loading || authLoading) return <Loading />;
  if (!user || !marchandAuth?.actif) return <Erreur message="Connectez-vous pour accéder à cette page." />;
  if (!client) return <Erreur message="Client introuvable pour cet établissement." />;

  const objectif = marchand?.objectif_tampons || 10;
  const nomRecompense = marchand?.nom_recompense || "";
  const pct = Math.min((client.tampons / objectif) * 100, 100);
  const restants = objectif - client.tampons;

  if (deleted) return (
    <main className="min-h-screen pb-10" style={{ background: "var(--bg)" }}>
      <div className="max-w-lg mx-auto px-5 pt-6">
        <Link href="/dashboard/clients" className="inline-flex items-center gap-1.5 mb-10 text-[14px]" style={{ color: "var(--accent)" }}>
          <Icons.ArrowLeft size={15} />
          Clients
        </Link>
        <p className="text-[15px] font-medium" style={{ color: "var(--fg-secondary)" }}>Client supprimé.</p>
      </div>
    </main>
  );

  return (
    <main className="min-h-screen pb-10" style={{ background: "var(--bg)" }}>
      <div className="max-w-lg mx-auto px-5 pt-6">

        {/* Retour */}
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 mb-6 text-[14px]"
          style={{ color: "var(--accent)" }}
        >
          <Icons.ArrowLeft size={15} />
          Dashboard
        </Link>

        {/* Header client */}
        <div className="flex items-center gap-4 mb-5">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-bold text-[18px] flex-shrink-0"
            style={{ background: "var(--accent)", boxShadow: "0 4px 14px rgba(0,122,255,0.3)" }}
          >
            {(client.prenom?.[0] || "").toUpperCase()}{(client.nom?.[0] || "").toUpperCase()}
          </div>
          <div>
            <h1 className="text-[22px] font-semibold tracking-tight leading-tight" style={{ color: "var(--fg)" }}>
              {client.prenom} {client.nom}
            </h1>
            <p className="text-[14px] mt-0.5" style={{ color: "var(--fg-secondary)" }}>{client.telephone}</p>
          </div>
        </div>

        {/* Infos */}
        <div className="rounded-2xl overflow-hidden mb-4" style={{ background: "var(--glass-bg)", border: "1px solid var(--border)" }}>
          {[
            {
              label: "Dernière visite",
              value: formatTempsDepuis(client.derniere_visite),
              highlight: !client.derniere_visite,
            },
            {
              label: "Client depuis",
              value: client.date_inscription
                ? new Date((client.date_inscription as { seconds: number }).seconds * 1000)
                    .toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })
                : "—",
            },
            {
              label: "Anniversaire",
              value: client.date_naissance || "—",
            },
          ].map((row, i, arr) => (
            <div
              key={row.label}
              className="flex items-center justify-between px-5 py-3.5"
              style={{ borderBottom: i < arr.length - 1 ? "1px solid var(--border)" : "none" }}
            >
              <span className="text-[13px]" style={{ color: "var(--fg-tertiary)" }}>{row.label}</span>
              <span className="text-[13px] font-medium" style={{ color: row.highlight ? "var(--fg-tertiary)" : "var(--fg)" }}>
                {row.value}
              </span>
            </div>
          ))}
        </div>

        {/* Tampons */}
        <div className="rounded-2xl p-5 mb-4" style={{ background: "var(--glass-bg)", border: "1px solid var(--border)" }}>


          <div className="flex items-center justify-between mb-3">
            <p className="text-[15px] font-semibold" style={{ color: "var(--fg)" }}>
              {client.tampons} / {objectif} tampons
            </p>
            <p className="text-[12px]" style={{ color: "var(--fg-tertiary)" }}>
              {nomRecompense}
            </p>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden mb-4" style={{ background: "var(--border)" }}>
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${pct}%`, background: "var(--wallio-gradient)" }}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: objectif }).map((_, i) => (
              <div
                key={i}
                className="w-8 h-8 rounded-full transition-all duration-300"
                style={i < client.tampons
                  ? { background: "var(--wallio-gradient)", boxShadow: "0 2px 8px rgba(139,92,246,0.35)" }
                  : { background: "transparent", border: "1.5px solid var(--border)" }
                }
              />
            ))}
          </div>
        </div>

        {/* Résultat */}
        {result && (
          <div
            className="rounded-2xl p-4 mb-4"
            style={{
              background:
                result.type === "anti_doublon" ? "rgba(255,159,10,0.1)" :
                result.type === "recompense"   ? "rgba(52,199,89,0.1)" :
                "rgba(0,122,255,0.08)",
              border: `1px solid ${
                result.type === "anti_doublon" ? "rgba(255,159,10,0.25)" :
                result.type === "recompense"   ? "rgba(52,199,89,0.25)" :
                "rgba(0,122,255,0.2)"}`,
            }}
          >
            <p
              className="text-[15px] font-semibold mb-0.5"
              style={{
                color:
                  result.type === "anti_doublon" ? "#FF9F0A" :
                  result.type === "recompense"   ? "#34C759" :
                  "var(--accent)",
              }}
            >
              {result.type === "ok"          && `Tampon ajouté — ${result.tampons}/${result.objectif}`}
              {result.type === "anti_doublon" && "Déjà enregistré récemment"}
              {result.type === "recompense"   && `${result.nom_recompense} débloqué !`}
            </p>
            <p className="text-[13px]" style={{ color: "var(--fg-secondary)" }}>
              {result.type === "ok" && result.objectif > result.tampons && `${result.objectif - result.tampons} tampon${result.objectif - result.tampons > 1 ? "s" : ""} restant avant la récompense`}
              {result.type === "anti_doublon" && `Prochain tampon dans ${formatTemps(result.secondes_restantes)}`}
              {result.type === "recompense" && "Validez la récompense pour continuer"}
            </p>
          </div>
        )}

        {/* CTA principal */}
        {client.recompense_en_attente ? (
          <button
            onClick={handleValiderRecompense}
            disabled={validationEnCours}
            className="w-full py-4 rounded-2xl text-[16px] font-semibold text-white mb-3"
            style={{ background: "#34C759", boxShadow: "0 4px 18px rgba(52,199,89,0.35)" }}
          >
            {validationEnCours ? "Validation…" : "Valider la récompense"}
          </button>
        ) : (
          <button
            onClick={handleAjouterTampon}
            disabled={ajoutEnCours}
            className="w-full py-4 rounded-2xl text-[16px] font-semibold text-white mb-5"
            style={{ background: "var(--wallio-gradient)", boxShadow: "0 4px 18px rgba(139,92,246,0.3)" }}
          >
            {ajoutEnCours ? "Enregistrement…" : "+ Ajouter un tampon"}
          </button>
        )}

        {/* Correction manuelle */}
        <div className="rounded-2xl p-5" style={{ background: "var(--glass-bg)", border: "1px solid var(--border)" }}>
          <p className="text-[11px] font-semibold uppercase tracking-widest mb-4" style={{ color: "var(--fg-tertiary)" }}>
            Correction manuelle
          </p>
          <div className="flex items-center justify-between">
            <button
              onClick={() => handleAjuster(-1)}
              disabled={adjusting || client.tampons === 0}
              className="w-12 h-12 rounded-2xl text-[22px] font-bold flex items-center justify-center transition-all"
              style={{
                background: "rgba(255,59,48,0.08)",
                color: "#FF3B30",
                opacity: client.tampons === 0 ? 0.3 : 1,
              }}
            >
              −
            </button>
            <div className="text-center">
              <p className="text-[32px] font-semibold leading-none" style={{ color: "var(--fg)" }}>
                {client.tampons}
              </p>
              <p className="text-[11px] mt-1" style={{ color: "var(--fg-tertiary)" }}>tampons</p>
            </div>
            <button
              onClick={() => handleAjuster(1)}
              disabled={adjusting || client.tampons >= objectif}
              className="w-12 h-12 rounded-2xl text-[22px] font-bold flex items-center justify-center transition-all"
              style={{
                background: "rgba(0,122,255,0.08)",
                color: "var(--accent)",
                opacity: client.tampons >= objectif ? 0.3 : 1,
              }}
            >
              +
            </button>
          </div>
        </div>

        {/* Supprimer le client */}
        <button
          onClick={async () => {
            if (!confirm(`Supprimer définitivement ${client.prenom} ${client.nom} ?`)) return;
            setDeleting(true);
            await deleteDoc(doc(db, "clients", client.id));
            setDeleted(true);
          }}
          disabled={deleting}
          className="w-full py-3.5 rounded-2xl text-[14px] font-medium mt-3"
          style={{ background: "rgba(255,59,48,0.07)", color: "#FF3B30", border: "1px solid rgba(255,59,48,0.2)" }}
        >
          {deleting ? "Suppression…" : "Supprimer ce client"}
        </button>

      </div>
    </main>
  );
}

function Loading() {
  return (
    <main className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg)" }}>
      <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
        style={{ borderColor: "var(--accent)", borderTopColor: "transparent" }} />
    </main>
  );
}

function Erreur({ message }: { message: string }) {
  return (
    <main className="min-h-screen flex items-center justify-center px-6" style={{ background: "var(--bg)" }}>
      <div className="text-center max-w-sm">
        <p className="text-[17px] mb-5" style={{ color: "var(--fg-secondary)" }}>{message}</p>
        <Link href="/dashboard" className="text-[15px] font-medium" style={{ color: "var(--accent)" }}>
          ← Dashboard
        </Link>
      </div>
    </main>
  );
}
