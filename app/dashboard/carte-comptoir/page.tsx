"use client";

import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  type Format,
  type Template,
  COMPTOIR_TEMPLATES as TEMPLATES,
  drawChevaleret,
  drawComptoir,
} from "@/lib/carte-comptoir-draw";

// Mini preview (canvas at reduced scale for the UI)
function TemplatePreview({
  format, template, marchand, selected, onSelect,
}: {
  format: Format;
  template: typeof TEMPLATES[0];
  marchand: { nom: string; couleur_principale: string; couleur_secondaire: string; nfc_id?: string };
  selected: boolean;
  onSelect: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const fn = format === "chevaleret" ? drawChevaleret : drawComptoir;
    // preview sans QR pour ne pas ralentir le rendu des miniatures
    fn(canvas, marchand.couleur_principale, marchand.couleur_secondaire, marchand.nom, marchand.nfc_id, template.id, 1, false)
      .catch(() => {});
  }, [format, template.id, marchand]);

  const isPortrait = format === "chevaleret";

  return (
    <button
      onClick={onSelect}
      className="flex flex-col items-center gap-2 transition-all duration-150"
      style={{ transform: selected ? "scale(1.04)" : "scale(1)" }}
    >
      <div className="rounded-2xl overflow-hidden"
        style={{
          outline: selected ? "2px solid var(--accent)" : "2px solid transparent",
          outlineOffset: 3,
          boxShadow: selected ? "0 8px 24px rgba(0,122,255,0.25)" : "0 4px 16px rgba(0,0,0,0.2)",
        }}>
        <canvas
          ref={canvasRef}
          style={{
            display: "block",
            width: isPortrait ? 80 : 142,
            height: isPortrait ? 144 : 80,
          }}
        />
      </div>
      <span className="text-[11px] font-medium" style={{ color: selected ? "var(--accent)" : "var(--fg-secondary)" }}>
        {template.label}
      </span>
    </button>
  );
}

export default function CarteComptoirPage() {
  const { user, marchand, loading } = useAuth();
  const router = useRouter();
  const [format, setFormat] = useState<Format>("chevaleret");
  const [template, setTemplate] = useState<Template>("dark");
  const [downloading, setDownloading] = useState(false);
  const [showQR, setShowQR] = useState(true);

  useEffect(() => {
    if (!loading && (!user || !marchand?.actif)) router.push("/auth/connexion");
  }, [user, marchand, loading, router]);

  if (loading || !marchand || !user) return (
    <main className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg)" }}>
      <div className="w-6 h-6 rounded-full border-2 animate-spin"
        style={{ borderColor: "var(--border)", borderTopColor: "var(--accent)" }} />
    </main>
  );

  const marchandData = {
    nom: marchand.nom,
    couleur_principale: marchand.couleur_principale || "#0A0A0A",
    couleur_secondaire: marchand.couleur_secondaire || "#1A1A1A",
    nfc_id: marchand.nfc_id,
  };

  async function telecharger() {
    setDownloading(true);
    const canvas = document.createElement("canvas");
    if (format === "chevaleret") {
      await drawChevaleret(canvas, marchandData.couleur_principale, marchandData.couleur_secondaire, marchandData.nom, marchandData.nfc_id, template, 4, showQR);
    } else {
      await drawComptoir(canvas, marchandData.couleur_principale, marchandData.couleur_secondaire, marchandData.nom, marchandData.nfc_id, template, 4, showQR);
    }
    const link = document.createElement("a");
    const label = format === "chevaleret" ? "chevaleret" : "carte-comptoir";
    link.download = `wallio-${label}-${template}-${marchand?.nom?.replace(/\s+/g, "-").toLowerCase() || "enseigne"}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
    setDownloading(false);
  }

  return (
    <div className="px-5 md:px-8 lg:px-10 pt-8 lg:pt-10 pb-28 md:pb-10 max-w-2xl">

      {/* Back */}
      <Link href="/dashboard" className="inline-flex items-center gap-1.5 mb-6 text-[14px]" style={{ color: "var(--accent)" }}>
        ← Dashboard
      </Link>

      {/* Header */}
      <div className="mb-6">
        <p className="text-[12px] font-semibold uppercase tracking-widest mb-1" style={{ color: "var(--fg-tertiary)" }}>
          Supports NFC imprimables
        </p>
        <h1 className="text-[28px] font-semibold tracking-[-0.5px]" style={{ color: "var(--fg)" }}>Enseignes NFC</h1>
      </div>

      {/* Format selector */}
      <div className="flex gap-3 mb-6">
        {([
          ["chevaleret", "Chevaleret", "100×180 mm · Portrait · Debout"],
          ["comptoir",   "Carte comptoir", "160×90 mm · Paysage · À plat"],
        ] as [Format, string, string][]).map(([f, label, desc]) => (
          <button
            key={f}
            onClick={() => setFormat(f)}
            className="flex-1 rounded-2xl p-4 text-left transition-all"
            style={{
              background: format === f ? "rgba(0,122,255,0.08)" : "var(--glass-bg)",
              border: `1px solid ${format === f ? "var(--accent)" : "var(--border)"}`,
            }}
          >
            <p className="text-[14px] font-semibold mb-0.5" style={{ color: format === f ? "var(--accent)" : "var(--fg)" }}>
              {label}
            </p>
            <p className="text-[11px]" style={{ color: "var(--fg-tertiary)" }}>{desc}</p>
          </button>
        ))}
      </div>

      {/* Templates */}
      <div className="rounded-2xl p-5 mb-5" style={{ background: "var(--glass-bg)", border: "1px solid var(--border)" }}>
        <p className="text-[11px] font-semibold uppercase tracking-widest mb-4" style={{ color: "var(--fg-tertiary)" }}>
          Choisir un design
        </p>
        <div className="flex gap-5 flex-wrap">
          {TEMPLATES.map(t => (
            <TemplatePreview
              key={t.id}
              format={format}
              template={t}
              marchand={marchandData}
              selected={template === t.id}
              onSelect={() => setTemplate(t.id)}
            />
          ))}
        </div>
        <div className="mt-4 pt-4" style={{ borderTop: "1px solid var(--border)" }}>
          <p className="text-[13px]" style={{ color: "var(--fg-secondary)" }}>
            <span className="font-medium" style={{ color: "var(--fg)" }}>
              {TEMPLATES.find(t => t.id === template)?.label}
            </span>
            {" — "}{TEMPLATES.find(t => t.id === template)?.desc}
          </p>
        </div>
      </div>

      {/* Specs */}
      <div className="rounded-2xl p-5 mb-5" style={{ background: "var(--glass-bg)", border: "1px solid var(--border)" }}>
        <p className="text-[11px] font-semibold uppercase tracking-widest mb-3" style={{ color: "var(--fg-tertiary)" }}>
          Spécifications d&apos;impression
        </p>
        {format === "chevaleret" ? (
          <div className="space-y-2">
            {[
              ["Format", "100 × 180 mm (portrait)"],
              ["Support recommandé", "PVC rigide 1mm ou carton 350g"],
              ["Trou d'accrochage", "5mm en haut au centre"],
              ["Résolution export", "800 × 1440 px (300 DPI approx.)"],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between">
                <span className="text-[13px]" style={{ color: "var(--fg-secondary)" }}>{k}</span>
                <span className="text-[13px] font-medium" style={{ color: "var(--fg)" }}>{v}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {[
              ["Format", "160 × 90 mm (paysage = 16:9)"],
              ["Support recommandé", "PVC rigide 1mm"],
              ["Trou d'accrochage", "5mm en haut au centre"],
              ["Résolution export", "1600 × 900 px (300 DPI approx.)"],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between">
                <span className="text-[13px]" style={{ color: "var(--fg-secondary)" }}>{k}</span>
                <span className="text-[13px] font-medium" style={{ color: "var(--fg)" }}>{v}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {!marchand.nfc_id && (
        <div className="rounded-2xl p-4 mb-4" style={{ background: "rgba(255,159,10,0.08)", border: "1px solid rgba(255,159,10,0.2)" }}>
          <p className="text-[13px]" style={{ color: "#FF9F0A" }}>
            ⚠️ Génère d&apos;abord ton identifiant NFC dans{" "}
            <Link href="/dashboard/reglages" className="font-semibold underline">Réglages</Link>
            {" "}pour que l&apos;URL apparaisse sur l&apos;enseigne.
          </p>
        </div>
      )}

      {/* Option QR */}
      <div className="flex items-start gap-3 p-4 rounded-2xl mb-4"
        style={{ background: "var(--glass-bg)", border: "1px solid var(--border)" }}>
        <input type="checkbox" id="show-qr" checked={showQR} onChange={e => setShowQR(e.target.checked)}
          style={{ accentColor: "var(--accent)", width: 16, height: 16, marginTop: 2, cursor: "pointer", flexShrink: 0 }}
        />
        <label htmlFor="show-qr" style={{ cursor: "pointer" }}>
          <p className="text-[13px] font-medium" style={{ color: "var(--fg)" }}>QR code de secours</p>
          <p className="text-[11px] mt-0.5" style={{ color: "var(--fg-tertiary)" }}>
            Même rôle que le NFC · Anti-doublon partagé (NFC + QR = 1 tampon max par période)
          </p>
        </label>
      </div>

      {/* Download */}
      <button
        onClick={telecharger}
        disabled={downloading}
        className="w-full py-4 rounded-2xl text-[15px] font-semibold text-white transition-all"
        style={{ background: "var(--accent)", boxShadow: "0 8px 24px rgba(0,122,255,0.3)" }}
      >
        {downloading ? "Génération…" : `⬇ Télécharger — ${format === "chevaleret" ? "Chevaleret" : "Carte comptoir"} ${TEMPLATES.find(t => t.id === template)?.label}`}
      </button>
    </div>
  );
}
