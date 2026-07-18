"use client";

import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export default function CarteComptoirPage() {
  const { user, marchand, loading } = useAuth();
  const router = useRouter();
  const carteRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (!loading && (!user || !marchand?.actif)) router.push("/auth/connexion");
  }, [user, marchand, loading, router]);

  async function telecharger() {
    if (!carteRef.current) return;
    setDownloading(true);
    try {
      const html2canvas = (await import("html2canvas")).default;
      const canvas = await html2canvas(carteRef.current, {
        scale: 3,
        backgroundColor: "#0A0A0A",
        useCORS: true,
      });
      const link = document.createElement("a");
      link.download = `carte-${marchand?.nom?.replace(/\s+/g, "-").toLowerCase() || "wallio"}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } finally {
      setDownloading(false);
    }
  }

  if (loading || !marchand) return (
    <main className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg)" }}>
      <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
        style={{ borderColor: "var(--accent)", borderTopColor: "transparent" }} />
    </main>
  );

  const nfcUrl = marchand.nfc_id ? `app.wallio.ma/nfc/${marchand.nfc_id}` : "app.wallio.ma";

  return (
    <main className="min-h-screen px-5 pt-12 pb-10" style={{ background: "var(--bg)" }}>
      <div className="max-w-lg mx-auto">

        <div className="flex items-center gap-3 mb-8">
          <a href="/dashboard" className="text-[14px]" style={{ color: "var(--accent)" }}>← Dashboard</a>
        </div>

        <h1 className="text-[26px] font-semibold tracking-tight mb-1" style={{ color: "var(--fg)" }}>Carte comptoir</h1>
        <p className="text-[14px] mb-8" style={{ color: "var(--fg-secondary)" }}>
          Carte physique 16×9 cm — posez sur votre comptoir avec votre boîtier NFC
        </p>

        {/* Carte preview — ratio 16:9 */}
        <div ref={carteRef}
          className="relative w-full rounded-[28px] overflow-hidden"
          style={{
            aspectRatio: "16/9",
            background: "#0A0A0A",
            border: "1px solid rgba(255,255,255,0.08)",
            fontFamily: "system-ui, -apple-system, sans-serif",
          }}>

          {/* Fond avec halo */}
          <div className="absolute inset-0"
            style={{ background: "radial-gradient(ellipse at 50% 120%, rgba(0,245,160,0.08) 0%, transparent 60%)" }} />

          {/* Header logos */}
          <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-8 pt-6">
            {/* Logo Wallio */}
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{ background: "#00F5A0" }}>
                <span className="text-black font-bold text-[12px]">W</span>
              </div>
              <span className="text-white font-semibold text-[15px] tracking-tight">Wallio</span>
            </div>
            {/* Nom marchand */}
            <span className="text-white/60 text-[13px] font-medium">{marchand.nom}</span>
          </div>

          {/* Centre — icône NFC + texte */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            {/* Icône NFC */}
            <div className="mb-4 relative">
              {/* Ondes NFC */}
              <div className="flex items-center gap-0.5">
                {[16, 24, 32, 40].map((size, i) => (
                  <div key={i} className="rounded-full border-2 border-t-0 border-l-0"
                    style={{
                      width: size,
                      height: size,
                      borderColor: "#00F5A0",
                      opacity: 0.3 + i * 0.175,
                      transform: "rotate(45deg)",
                    }} />
                ))}
              </div>
            </div>
            <p className="text-white text-[15px] font-medium text-center mb-1" style={{ letterSpacing: "-0.2px" }}>
              Posez votre téléphone
            </p>
            <p className="text-white/50 text-[13px] text-center">
              pour gagner vos points
            </p>
          </div>

          {/* Footer */}
          <div className="absolute bottom-0 left-0 right-0 flex items-center justify-center pb-5">
            <span className="text-white/30 text-[11px] tracking-wider">{nfcUrl}</span>
          </div>

          {/* Trou d'accrochage */}
          <div className="absolute top-3 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full"
            style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.1)" }} />
        </div>

        {/* Specs */}
        <div className="mt-6 rounded-[20px] p-5"
          style={{ background: "var(--glass-bg)", border: "1px solid var(--glass-border)", backdropFilter: "blur(20px)" }}>
          <p className="text-[13px] font-semibold mb-3" style={{ color: "var(--fg)" }}>Spécifications d&apos;impression</p>
          <div className="space-y-2">
            {[
              ["Format", "16 × 9 cm"],
              ["Matière recommandée", "PVC rigide 1mm"],
              ["Trou", "5mm en haut au centre"],
              ["Fond", "#0A0A0A"],
              ["Résolution", "300 DPI minimum"],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between">
                <span className="text-[13px]" style={{ color: "var(--fg-secondary)" }}>{k}</span>
                <span className="text-[13px] font-medium" style={{ color: "var(--fg)" }}>{v}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bouton télécharger */}
        <button onClick={telecharger} disabled={downloading}
          className="w-full mt-5 py-4 rounded-2xl text-[16px] font-semibold text-white transition-all"
          style={{ background: "var(--accent)", boxShadow: "0 8px 24px rgba(0,122,255,0.3)" }}>
          {downloading ? "Génération…" : "⬇ Télécharger en PNG"}
        </button>

        {!marchand.nfc_id && (
          <p className="text-center text-[13px] mt-4" style={{ color: "#FF9F0A" }}>
            ⚠️ Génère d&apos;abord ton identifiant NFC dans Réglages
          </p>
        )}
      </div>
    </main>
  );
}
