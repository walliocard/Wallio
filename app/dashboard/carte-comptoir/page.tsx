"use client";

import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  type Template,
  ENSEIGNE_TEMPLATES,
  drawEnseigne,
} from "@/lib/carte-comptoir-draw";

function TemplatePreview({
  template, marchand, texte, selected, onSelect,
}: {
  template: typeof ENSEIGNE_TEMPLATES[0];
  marchand: { nom: string; couleur_principale: string; couleur_secondaire: string; nfc_id?: string };
  texte: string;
  selected: boolean;
  onSelect: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    drawEnseigne(canvas, marchand.couleur_principale, marchand.couleur_secondaire, marchand.nom, texte, marchand.nfc_id, template.id, 1, false)
      .catch(() => {});
  }, [template.id, marchand, texte]);

  return (
    <button
      onClick={onSelect}
      className="flex flex-col items-center gap-2 transition-all duration-150"
      style={{ transform: selected ? "scale(1.04)" : "scale(1)" }}
    >
      <div style={{
        borderRadius: 10,
        overflow: "hidden",
        outline: selected ? "2px solid var(--accent)" : "2px solid transparent",
        outlineOffset: 3,
        boxShadow: selected ? "0 8px 24px rgba(0,122,255,0.25)" : "0 4px 16px rgba(0,0,0,0.2)",
      }}>
        <canvas
          ref={canvasRef}
          style={{ display: "block", width: 140, height: 88 }}
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
  const [template, setTemplate] = useState<Template>("dark");
  const [showQR, setShowQR] = useState(true);
  const [texte, setTexte] = useState("Posez votre téléphone pour gagner vos points");
  const [downloading, setDownloading] = useState(false);

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
    await drawEnseigne(canvas, marchandData.couleur_principale, marchandData.couleur_secondaire, marchandData.nom, texte, marchandData.nfc_id, template, 4, showQR);
    const link = document.createElement("a");
    link.download = `wallio-enseigne-${template}-${marchand?.nom?.replace(/\s+/g, "-").toLowerCase() || "comptoir"}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
    setDownloading(false);
  }

  return (
    <div className="px-5 md:px-8 lg:px-10 pt-8 lg:pt-10 pb-44 md:pb-10 max-w-2xl">

      <Link href="/dashboard" className="inline-flex items-center gap-1.5 mb-6 text-[14px]" style={{ color: "var(--accent)" }}>
        ← Dashboard
      </Link>

      <div className="mb-6">
        <p className="text-[12px] font-semibold uppercase tracking-widest mb-1" style={{ color: "var(--fg-tertiary)" }}>
          Support imprimable
        </p>
        <h1 className="text-[28px] font-semibold tracking-[-0.5px]" style={{ color: "var(--fg)" }}>Enseigne NFC</h1>
        <p className="text-[13px] mt-1" style={{ color: "var(--fg-secondary)" }}>
          160 × 100 mm · À poser sur le comptoir
        </p>
      </div>

      {/* Fond */}
      <div className="rounded-2xl p-5 mb-4" style={{ background: "var(--glass-bg)", border: "1px solid var(--border)" }}>
        <p className="text-[11px] font-semibold uppercase tracking-widest mb-4" style={{ color: "var(--fg-tertiary)" }}>
          Fond
        </p>
        <div className="flex gap-5 flex-wrap">
          {ENSEIGNE_TEMPLATES.map(t => (
            <TemplatePreview
              key={t.id}
              template={t}
              marchand={marchandData}
              texte={texte}
              selected={template === t.id}
              onSelect={() => setTemplate(t.id)}
            />
          ))}
        </div>
      </div>

      {/* Texte */}
      <div className="rounded-2xl p-5 mb-4" style={{ background: "var(--glass-bg)", border: "1px solid var(--border)" }}>
        <p className="text-[11px] font-semibold uppercase tracking-widest mb-3" style={{ color: "var(--fg-tertiary)" }}>
          Texte affiché
        </p>
        <input
          type="text"
          value={texte}
          onChange={e => setTexte(e.target.value)}
          maxLength={60}
          className="w-full rounded-xl px-4 py-3 text-[14px]"
          style={{
            background: "var(--bg)",
            border: "1px solid var(--border)",
            color: "var(--fg)",
            outline: "none",
          }}
        />
      </div>

      {/* QR */}
      <div className="flex items-start gap-3 p-4 rounded-2xl mb-4"
        style={{ background: "var(--glass-bg)", border: "1px solid var(--border)" }}>
        <input type="checkbox" id="show-qr" checked={showQR} onChange={e => setShowQR(e.target.checked)}
          style={{ accentColor: "var(--accent)", width: 16, height: 16, marginTop: 2, cursor: "pointer", flexShrink: 0 }}
        />
        <label htmlFor="show-qr" style={{ cursor: "pointer" }}>
          <p className="text-[13px] font-medium" style={{ color: "var(--fg)" }}>QR code</p>
          <p className="text-[11px] mt-0.5" style={{ color: "var(--fg-tertiary)" }}>
            Affiché à droite · même lien que le NFC
          </p>
        </label>
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

      <button
        onClick={telecharger}
        disabled={downloading}
        className="w-full py-4 rounded-2xl text-[15px] font-semibold text-white transition-all"
        style={{ background: "var(--accent)", boxShadow: "0 8px 24px rgba(0,122,255,0.3)" }}
      >
        {downloading ? "Génération…" : "⬇ Télécharger l'enseigne"}
      </button>
    </div>
  );
}
