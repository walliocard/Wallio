"use client";

import { useEffect, useState } from "react";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Link from "next/link";

interface CardData {
  walletId: string;
  marchandId: string;
  marchandNom: string;
  logoUrl?: string;
  couleur: string;
  stampsCurrent: number;
  stampsObjective: number;
  rewardName: string;
  prenom: string;
}

export default function MesCartesPage() {
  const [cards, setCards] = useState<CardData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const entries: { marchandId: string; walletId: string }[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith("wallio_")) {
          const marchandId = key.replace("wallio_", "");
          const walletId = localStorage.getItem(key);
          if (walletId) entries.push({ marchandId, walletId });
        }
      }

      if (entries.length === 0) { setLoading(false); return; }

      const results: CardData[] = [];
      await Promise.all(entries.map(async ({ marchandId, walletId }) => {
        try {
          const [clientSnap, marchandSnap] = await Promise.all([
            getDocs(query(collection(db, "clients"), where("wallet_id", "==", walletId), where("marchand_id", "==", marchandId))),
            getDoc(doc(db, "marchands", marchandId)),
          ]);
          if (clientSnap.empty || !marchandSnap.exists()) return;
          const client = clientSnap.docs[0].data();
          const m = marchandSnap.data();
          results.push({
            walletId,
            marchandId,
            marchandNom: m.nom || "Établissement",
            logoUrl: m.logo_url || undefined,
            couleur: m.apple_bg_color || m.couleur_principale || "#1C1C1E",
            stampsCurrent: client.tampons || 0,
            stampsObjective: m.objectif_tampons || 10,
            rewardName: m.nom_recompense || "Récompense",
            prenom: client.prenom || "",
          });
        } catch { /* ignorer les erreurs individuelles */ }
      }));

      setCards(results);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return (
      <main style={{ minHeight: "100vh", background: "#F0F4FF", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: 28, height: 28, borderRadius: "50%", border: "2.5px solid #007AFF", borderTopColor: "transparent", animation: "spin 0.8s linear infinite" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </main>
    );
  }

  if (cards.length === 0) {
    return (
      <main style={{ minHeight: "100vh", background: "#F0F4FF", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 20px", fontFamily: "-apple-system, 'SF Pro Display', sans-serif" }}>
        <div style={{ fontSize: 52, marginBottom: 16 }}>🃏</div>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "#1D1D1F", marginBottom: 8, textAlign: "center" }}>Aucune carte</h1>
        <p style={{ fontSize: 15, color: "#6E6E73", textAlign: "center", maxWidth: 280, lineHeight: 1.55 }}>
          Scannez le tag NFC ou le QR code d'un établissement pour obtenir votre première carte.
        </p>
      </main>
    );
  }

  const firstName = cards[0]?.prenom;

  return (
    <main style={{ minHeight: "100vh", background: "#F0F4FF", fontFamily: "-apple-system, 'SF Pro Display', sans-serif", WebkitFontSmoothing: "antialiased" }}>

      {/* Header */}
      <div style={{ padding: "56px 20px 20px", maxWidth: 430, margin: "0 auto" }}>
        <p style={{ fontSize: 13, fontWeight: 600, letterSpacing: "0.10em", textTransform: "uppercase", color: "#007AFF", marginBottom: 4 }}>
          Wallio
        </p>
        <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: -0.5, color: "#1D1D1F" }}>
          {firstName ? `Bonjour, ${firstName} !` : "Mes cartes"}
        </h1>
        <p style={{ fontSize: 14, color: "#6E6E73", marginTop: 4 }}>
          {cards.length} carte{cards.length > 1 ? "s" : ""} de fidélité
        </p>
      </div>

      {/* Cards */}
      <div style={{ padding: "8px 20px 48px", maxWidth: 430, margin: "0 auto", display: "flex", flexDirection: "column", gap: 16 }}>
        {cards.map((card) => {
          const pct = Math.min(100, Math.round((card.stampsCurrent / card.stampsObjective) * 100));
          const restants = card.stampsObjective - card.stampsCurrent;
          const isDark = isColorDark(card.couleur);

          return (
            <div key={card.walletId} style={{
              borderRadius: 24,
              overflow: "hidden",
              boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
            }}>
              {/* Card top */}
              <div style={{
                background: card.couleur,
                padding: "20px 20px 16px",
              }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    {card.logoUrl ? (
                      <img src={card.logoUrl} alt="" style={{ height: 32, width: 32, borderRadius: 8, objectFit: "contain", background: "rgba(255,255,255,0.15)" }} />
                    ) : (
                      <div style={{ height: 32, width: 32, borderRadius: 8, background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <span style={{ fontSize: 14, fontWeight: 700, color: isDark ? "white" : "#1D1D1F" }}>
                          {card.marchandNom[0]?.toUpperCase()}
                        </span>
                      </div>
                    )}
                    <span style={{ fontSize: 15, fontWeight: 600, color: isDark ? "white" : "#1D1D1F" }}>
                      {card.marchandNom}
                    </span>
                  </div>
                  <span style={{ fontSize: 22, fontWeight: 700, color: isDark ? "white" : "#1D1D1F" }}>
                    {card.stampsCurrent}<span style={{ fontSize: 14, fontWeight: 400, opacity: 0.6 }}>/{card.stampsObjective}</span>
                  </span>
                </div>

                {/* Progress bar */}
                <div style={{ height: 5, background: "rgba(255,255,255,0.2)", borderRadius: 10 }}>
                  <div style={{
                    height: "100%", borderRadius: 10,
                    background: isDark ? "rgba(255,255,255,0.85)" : "rgba(0,0,0,0.5)",
                    width: `${pct}%`,
                    transition: "width 0.6s cubic-bezier(.16,1,.3,1)",
                  }} />
                </div>

                <p style={{ fontSize: 12, color: isDark ? "rgba(255,255,255,0.65)" : "rgba(0,0,0,0.45)", marginTop: 8 }}>
                  {restants > 0
                    ? `${restants} tampon${restants > 1 ? "s" : ""} avant : ${card.rewardName}`
                    : `Récompense disponible : ${card.rewardName} !`}
                </p>
              </div>

              {/* Card bottom */}
              <div style={{ background: "white", padding: "14px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <a
                  href={`/api/apple-wallet/generate/${card.walletId}`}
                  style={{
                    display: "flex", alignItems: "center", gap: 8,
                    background: "#000", borderRadius: 12, padding: "9px 16px",
                    textDecoration: "none",
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8">
                    <rect x="2" y="5" width="20" height="14" rx="3"/><path d="M2 10h20"/><circle cx="7" cy="14.5" r="1.5" fill="white" stroke="none"/>
                  </svg>
                  <span style={{ fontSize: 12, fontWeight: 600, color: "white" }}>Apple Wallet</span>
                </a>
                <span style={{ fontSize: 12, color: "#8E8E93" }}>
                  {pct === 100 ? "Récompense prête" : `${pct}% complété`}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <p style={{ textAlign: "center", fontSize: 12, color: "#C7C7CC", paddingBottom: 32 }}>
        Wallio · cartes de fidélité digitales
      </p>
    </main>
  );
}

function isColorDark(hex: string): boolean {
  const h = /^#[0-9a-f]{6}$/i.test(hex) ? hex : "#1C1C1E";
  const r = parseInt(h.slice(1, 3), 16) / 255;
  const g = parseInt(h.slice(3, 5), 16) / 255;
  const b = parseInt(h.slice(5, 7), 16) / 255;
  const lin = (c: number) => c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b) < 0.35;
}
