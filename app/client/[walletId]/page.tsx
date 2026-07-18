"use client";

import { useEffect, useState } from "react";
import { getClientByWalletId, getMarchandById, ajouterTampon, validerRecompense, formatTemps, type Client, type Marchand, type TamponResult } from "@/lib/loyalty";
import { useAuth } from "@/lib/auth-context";

export default function ClientQrPage({ params }: { params: { walletId: string } }) {
  const { walletId } = params;
  const { user, marchand: marchandAuth, loading: authLoading } = useAuth();
  const [client, setClient] = useState<Client | null>(null);
  const [marchand, setMarchand] = useState<Marchand | null>(null);
  const [result, setResult] = useState<TamponResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user || !marchandAuth?.actif) {
      setLoading(false);
      return;
    }
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
    if (!client || !marchand) return;
    const r = await ajouterTampon(client, marchand);
    setResult(r);
    if (r.type === "ok") setClient(prev => prev ? { ...prev, tampons: r.tampons } : prev);
  }

  async function handleValiderRecompense() {
    if (!client || !marchand) return;
    await validerRecompense(client.id, marchand);
    setResult(null);
    setClient(prev => prev ? { ...prev, tampons: 0, recompense_en_attente: false } : prev);
  }

  if (loading || authLoading) return <Loading />;
  if (!user || !marchandAuth?.actif) return <Erreur message="Connectez-vous pour scanner une carte." />;
  if (!client) return <Erreur message="Client introuvable." />;

  return (
    <main className="min-h-screen flex items-center justify-center px-6" style={{ background: "var(--bg)" }}>
      <div className="w-full max-w-[380px]">

        {/* Carte client */}
        <div className="rounded-[28px] p-7 mb-5"
          style={{ background: "var(--glass-bg)", border: "1px solid var(--glass-border)", backdropFilter: "blur(30px)", boxShadow: "var(--shadow-lg)" }}>

          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl"
              style={{ background: "var(--accent)", boxShadow: "0 4px 12px rgba(0,122,255,0.3)" }}>
              {marchand?.icone_tampons || "⭐"}
            </div>
            <div>
              <p className="text-[18px] font-semibold" style={{ color: "var(--fg)" }}>{client.prenom} {client.nom}</p>
              <p className="text-[13px]" style={{ color: "var(--fg-secondary)" }}>Dernière visite : {client.derniere_visite ? new Date(client.derniere_visite.seconds * 1000).toLocaleDateString("fr-FR") : "jamais"}</p>
            </div>
          </div>

          {/* Tampons */}
          <div className="flex gap-2 flex-wrap mb-6">
            {Array.from({ length: marchand?.objectif_tampons || 10 }).map((_, i) => (
              <div key={i} className="w-8 h-8 rounded-full flex items-center justify-center text-base transition-all"
                style={{ background: i < client.tampons ? "var(--accent)" : "var(--border)" }}>
                {i < client.tampons ? (marchand?.icone_tampons || "⭐") : ""}
              </div>
            ))}
          </div>

          <p className="text-center text-[15px] font-medium mb-6" style={{ color: "var(--fg)" }}>
            {client.tampons}/{marchand?.objectif_tampons || 10} tampons
          </p>

          {/* Résultat */}
          {result && (
            <div className="rounded-2xl p-4 mb-5 text-center"
              style={{
                background: result.type === "anti_doublon" ? "rgba(255,159,10,0.1)" : result.type === "recompense" ? "rgba(52,199,89,0.1)" : "rgba(0,122,255,0.1)",
                border: `1px solid ${result.type === "anti_doublon" ? "rgba(255,159,10,0.2)" : result.type === "recompense" ? "rgba(52,199,89,0.2)" : "rgba(0,122,255,0.2)"}`,
              }}>
              <p className="text-[15px] font-medium" style={{ color: result.type === "anti_doublon" ? "#FF9F0A" : result.type === "recompense" ? "#34C759" : "var(--accent)" }}>
                {result.type === "ok" && `✅ Tampon ajouté — ${result.tampons}/${result.objectif}`}
                {result.type === "anti_doublon" && `⏳ Reviens dans ${formatTemps(result.secondes_restantes)}`}
                {result.type === "recompense" && `🎁 ${result.nom_recompense} !`}
              </p>
            </div>
          )}

          {result?.type === "recompense" ? (
            <button onClick={handleValiderRecompense}
              className="w-full py-4 rounded-2xl text-[16px] font-semibold text-white"
              style={{ background: "#34C759", boxShadow: "0 4px 16px rgba(52,199,89,0.3)" }}>
              Valider la récompense
            </button>
          ) : (
            <button onClick={handleAjouterTampon}
              className="w-full py-4 rounded-2xl text-[16px] font-semibold text-white transition-all"
              style={{ background: "var(--accent)", boxShadow: "0 4px 16px rgba(0,122,255,0.3)" }}
              onMouseEnter={e => (e.target as HTMLElement).style.transform = "translateY(-1px)"}
              onMouseLeave={e => (e.target as HTMLElement).style.transform = "translateY(0)"}>
              + Ajouter un tampon
            </button>
          )}
        </div>

        <p className="text-center text-[13px]" style={{ color: "var(--fg-tertiary)" }}>
          <a href="/dashboard" style={{ color: "var(--accent)" }}>← Retour au dashboard</a>
        </p>
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
        <p className="text-[17px]" style={{ color: "var(--fg-secondary)" }}>{message}</p>
        <a href="/dashboard" className="text-[15px] mt-4 block" style={{ color: "var(--accent)" }}>← Dashboard</a>
      </div>
    </main>
  );
}
