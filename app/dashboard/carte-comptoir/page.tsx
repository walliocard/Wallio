"use client";

import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";

type Format = "chevaleret" | "comptoir";
type Template = "dark" | "couleur" | "clair" | "gradient";

const TEMPLATES: { id: Template; label: string; desc: string }[] = [
  { id: "dark",     label: "Noir",     desc: "Fond noir, NFC vert Wallio" },
  { id: "couleur",  label: "Couleur",  desc: "Fond couleur principale" },
  { id: "clair",    label: "Clair",    desc: "Fond blanc, accents couleur" },
  { id: "gradient", label: "Dégradé",  desc: "Transition des deux couleurs" },
];

function nfcArcs(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number,
  unit: number,
  color: string,
) {
  ctx.lineWidth = unit * 0.028;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.arc(cx, cy, unit * 0.022, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
  for (let i = 0; i < 4; i++) {
    const r = unit * (0.07 + i * 0.075);
    const opacity = 1 - i * 0.12;
    ctx.beginPath();
    ctx.arc(cx, cy, r, -Math.PI * 0.4, Math.PI * 0.4);
    ctx.strokeStyle = color.startsWith("#")
      ? color + Math.round(opacity * 255).toString(16).padStart(2, "0")
      : color;
    ctx.stroke();
  }
}

function drawChevaleret(
  canvas: HTMLCanvasElement,
  couleur_principale: string,
  couleur_secondaire: string,
  nom: string,
  nfc_id: string | undefined,
  template: Template,
) {
  const W = 800, H = 1440;
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  const green = "#00F5A0";
  let bgFill: string | CanvasGradient;
  let nfcColor: string;
  let textColor: string;

  if (template === "dark") {
    bgFill = "#0A0A0A"; nfcColor = green; textColor = "#FFFFFF";
  } else if (template === "couleur") {
    bgFill = couleur_principale; nfcColor = "#FFFFFF"; textColor = "#FFFFFF";
  } else if (template === "clair") {
    bgFill = "#FFFFFF"; nfcColor = couleur_principale; textColor = "#0A0A0A";
  } else {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, couleur_principale); g.addColorStop(1, couleur_secondaire);
    bgFill = g; nfcColor = "#FFFFFF"; textColor = "#FFFFFF";
  }

  ctx.fillStyle = bgFill;
  ctx.fillRect(0, 0, W, H);

  // Trou d'accrochage
  ctx.beginPath();
  ctx.arc(W / 2, 52, 26, 0, Math.PI * 2);
  ctx.strokeStyle = `${textColor}18`; ctx.lineWidth = 2; ctx.stroke();

  // WALLIO
  ctx.font = `bold ${W * 0.065}px Arial, sans-serif`;
  ctx.fillStyle = template === "dark" ? green : nfcColor;
  ctx.textAlign = "center"; ctx.textBaseline = "top";
  ctx.fillText("WALLIO", W / 2, H * 0.065);

  // Séparateur
  ctx.beginPath();
  ctx.moveTo(W * 0.1, H * 0.115);
  ctx.lineTo(W * 0.9, H * 0.115);
  ctx.strokeStyle = `${textColor}1A`; ctx.lineWidth = 1.5; ctx.stroke();

  // Sous-titre
  ctx.font = `${W * 0.028}px Arial, sans-serif`;
  ctx.fillStyle = `${textColor}44`;
  ctx.fillText("LOYALTY · REIMAGINED", W / 2, H * 0.127);

  // NFC arcs — décalé à gauche du centre
  const ox = W / 2 - W * 0.08;
  const oy = H * 0.38;
  nfcArcs(ctx, ox, oy, W, nfcColor);

  // TAP. EARN. REPEAT.
  ctx.font = `bold ${W * 0.06}px Arial, sans-serif`;
  ctx.fillStyle = textColor;
  ctx.textAlign = "center";
  ctx.fillText("TAP. EARN. REPEAT.", W / 2 + W * 0.04, H * 0.575);

  // Nom marchand
  if (nom) {
    ctx.font = `${W * 0.038}px Arial, sans-serif`;
    ctx.fillStyle = `${textColor}70`;
    ctx.fillText(nom, W / 2 + W * 0.04, H * 0.635);
  }

  // Séparateur bas
  ctx.beginPath();
  ctx.moveTo(W * 0.3, H * 0.79);
  ctx.lineTo(W * 0.7, H * 0.79);
  ctx.strokeStyle = `${textColor}14`; ctx.lineWidth = 1.5; ctx.stroke();

  // URL
  const url = nfc_id ? `app.wallio.ma/nfc/${nfc_id}` : "app.wallio.ma";
  ctx.font = `${W * 0.025}px Arial, sans-serif`;
  ctx.fillStyle = `${textColor}28`;
  ctx.fillText(url, W / 2, H * 0.93);
}

function drawComptoir(
  canvas: HTMLCanvasElement,
  couleur_principale: string,
  couleur_secondaire: string,
  nom: string,
  nfc_id: string | undefined,
  template: Template,
) {
  const W = 1600, H = 900;
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  const green = "#00F5A0";
  let bgFill: string | CanvasGradient;
  let nfcColor: string;
  let textColor: string;

  if (template === "dark") {
    bgFill = "#0A0A0A"; nfcColor = green; textColor = "#FFFFFF";
  } else if (template === "couleur") {
    bgFill = couleur_principale; nfcColor = "#FFFFFF"; textColor = "#FFFFFF";
  } else if (template === "clair") {
    bgFill = "#FFFFFF"; nfcColor = couleur_principale; textColor = "#0A0A0A";
  } else {
    const g = ctx.createLinearGradient(0, 0, W, 0);
    g.addColorStop(0, couleur_principale); g.addColorStop(1, couleur_secondaire);
    bgFill = g; nfcColor = "#FFFFFF"; textColor = "#FFFFFF";
  }

  ctx.fillStyle = bgFill;
  ctx.fillRect(0, 0, W, H);

  // Ambient
  if (template === "dark") {
    const g = ctx.createRadialGradient(W * 0.75, H * 0.15, 0, W * 0.75, H * 0.15, 500);
    g.addColorStop(0, "rgba(0,245,160,0.06)"); g.addColorStop(1, "transparent");
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  }

  // Trou
  ctx.beginPath();
  ctx.arc(W / 2, 52, 24, 0, Math.PI * 2);
  ctx.strokeStyle = `${textColor}15`; ctx.lineWidth = 2; ctx.stroke();

  // WALLIO top-left
  ctx.font = `bold ${H * 0.07}px Arial, sans-serif`;
  ctx.fillStyle = template === "dark" ? green : nfcColor;
  ctx.textBaseline = "top"; ctx.textAlign = "left";
  ctx.fillText("WALLIO", 80, 75);

  // Nom top-right
  if (nom) {
    ctx.font = `500 ${H * 0.055}px Arial, sans-serif`;
    ctx.fillStyle = `${textColor}80`;
    ctx.textAlign = "right";
    ctx.fillText(nom, W - 80, 88);
  }

  // NFC arcs — centre légèrement gauche
  const ox = W / 2 - W * 0.06;
  const oy = H / 2 - 10;
  nfcArcs(ctx, ox, oy, H, nfcColor);

  // Texte principal
  const tx = W / 2 + W * 0.07;
  ctx.textAlign = "center";
  ctx.font = `600 ${H * 0.052}px Arial, sans-serif`;
  ctx.fillStyle = textColor;
  ctx.fillText("Posez votre téléphone", tx, oy + H * 0.34);

  ctx.font = `400 ${H * 0.045}px Arial, sans-serif`;
  ctx.fillStyle = `${textColor}60`;
  ctx.fillText("pour gagner vos points", tx, oy + H * 0.41);

  // URL bas
  const url = nfc_id ? `app.wallio.ma/nfc/${nfc_id}` : "app.wallio.ma";
  ctx.font = `${H * 0.032}px Arial, sans-serif`;
  ctx.fillStyle = `${textColor}25`;
  ctx.fillText(url, W / 2, H - 60);
}

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
    fn(canvas, marchand.couleur_principale, marchand.couleur_secondaire, marchand.nom, marchand.nfc_id, template.id);
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
      drawChevaleret(canvas, marchandData.couleur_principale, marchandData.couleur_secondaire, marchandData.nom, marchandData.nfc_id, template);
    } else {
      drawComptoir(canvas, marchandData.couleur_principale, marchandData.couleur_secondaire, marchandData.nom, marchandData.nfc_id, template);
    }
    const link = document.createElement("a");
    const label = format === "chevaleret" ? "chevaleret" : "carte-comptoir";
    link.download = `wallio-${label}-${template}-${marchand.nom?.replace(/\s+/g, "-").toLowerCase() || "enseigne"}.png`;
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
