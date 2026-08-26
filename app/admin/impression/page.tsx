"use client";

import { useEffect, useRef, useState } from "react";
import { drawPrintCard, PRINT_W, PRINT_H } from "@/lib/print-card-draw";

const PREVIEW_SCALE = 0.42;
const PRINT_SCALE   = 2; // 3000×2000px — print quality

export default function ImpressionPage() {
  const [urls, setUrls] = useState<string>("");
  const [previewUrl, setPreviewUrl] = useState("https://app.wallio.ma/nfc/demo");
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const previewRef = useRef<HTMLCanvasElement>(null);

  // Refresh preview when previewUrl changes
  useEffect(() => {
    const canvas = previewRef.current;
    if (!canvas) return;
    drawPrintCard(canvas, previewUrl, PREVIEW_SCALE).catch(() => {});
  }, [previewUrl]);

  // Parse textarea into list of URLs
  function parseUrls(): string[] {
    return urls
      .split("\n")
      .map(l => l.trim())
      .filter(l => l.length > 0);
  }

  async function downloadSingle() {
    setGenerating(true);
    const canvas = document.createElement("canvas");
    await drawPrintCard(canvas, previewUrl, PRINT_SCALE);
    const link = document.createElement("a");
    link.download = `wallio-carte-comptoir.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
    setGenerating(false);
  }

  async function downloadBatch() {
    const list = parseUrls();
    if (list.length === 0) return;
    setGenerating(true);
    setProgress(0);

    const JSZip = (await import("jszip")).default;
    const zip = new JSZip();

    for (let i = 0; i < list.length; i++) {
      const canvas = document.createElement("canvas");
      await drawPrintCard(canvas, list[i], PRINT_SCALE);
      const blob = await new Promise<Blob>(resolve =>
        canvas.toBlob(b => resolve(b!), "image/png")
      );
      const label = (i + 1).toString().padStart(2, "0");
      zip.file(`wallio-carte-${label}.png`, blob);
      setProgress(Math.round(((i + 1) / list.length) * 100));
    }

    const content = await zip.generateAsync({ type: "blob" });
    const link = document.createElement("a");
    link.download = `wallio-cartes-comptoir-${list.length}.zip`;
    link.href = URL.createObjectURL(content);
    link.click();
    setGenerating(false);
    setProgress(0);
  }

  const list = parseUrls();

  return (
    <div style={{
      minHeight: "100vh", background: "#F5F5F7",
      fontFamily: "-apple-system, 'Helvetica Neue', sans-serif",
      padding: "40px 32px",
    }}>

      {/* Header */}
      <div style={{ maxWidth: 960, margin: "0 auto 36px" }}>
        <p style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.08em", color: "#8E8E93", textTransform: "uppercase", marginBottom: 6 }}>
          Admin — Impression
        </p>
        <h1 style={{ fontSize: 28, fontWeight: 600, color: "#1D1D1F", letterSpacing: -0.5, margin: 0 }}>
          Cartes comptoir WALLIO
        </h1>
        <p style={{ fontSize: 14, color: "#6E6E73", marginTop: 6 }}>
          {PRINT_W}×{PRINT_H}px · 160×100mm · 300 DPI · prêt à l'impression
        </p>
      </div>

      <div style={{ maxWidth: 960, margin: "0 auto", display: "flex", gap: 28, alignItems: "flex-start", flexWrap: "wrap" }}>

        {/* Left — controls */}
        <div style={{ flex: "0 0 320px", display: "flex", flexDirection: "column", gap: 20 }}>

          {/* Single preview URL */}
          <div style={{ background: "#FFFFFF", borderRadius: 16, padding: 20, border: "1px solid rgba(0,0,0,0.07)", boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}>
            <p style={{ fontSize: 11, fontWeight: 600, color: "#8E8E93", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>
              Aperçu — URL unique
            </p>
            <input
              type="text"
              value={previewUrl}
              onChange={e => setPreviewUrl(e.target.value)}
              placeholder="https://app.wallio.ma/nfc/xxx"
              style={{
                width: "100%", padding: "9px 12px", borderRadius: 10, fontSize: 13,
                border: "1px solid rgba(0,0,0,0.12)", outline: "none",
                color: "#1D1D1F", background: "#F5F5F7", boxSizing: "border-box",
              }}
            />
            <button
              onClick={downloadSingle}
              disabled={generating}
              style={{
                marginTop: 12, width: "100%", padding: "11px 0", borderRadius: 10,
                fontSize: 14, fontWeight: 600, color: "#FFFFFF", cursor: "pointer",
                background: generating ? "#C7C7CC" : "#4E7EF6", border: "none",
              }}
            >
              {generating ? "Génération…" : "⬇ Télécharger cette carte (PNG)"}
            </button>
          </div>

          {/* Batch */}
          <div style={{ background: "#FFFFFF", borderRadius: 16, padding: 20, border: "1px solid rgba(0,0,0,0.07)", boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}>
            <p style={{ fontSize: 11, fontWeight: 600, color: "#8E8E93", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>
              Batch — une URL par ligne
            </p>
            <textarea
              value={urls}
              onChange={e => setUrls(e.target.value)}
              rows={10}
              placeholder={"https://app.wallio.ma/nfc/abc\nhttps://app.wallio.ma/nfc/def\n…"}
              style={{
                width: "100%", padding: "9px 12px", borderRadius: 10, fontSize: 12,
                border: "1px solid rgba(0,0,0,0.12)", outline: "none", resize: "vertical",
                color: "#1D1D1F", background: "#F5F5F7", boxSizing: "border-box",
                fontFamily: "monospace", lineHeight: 1.6,
              }}
            />
            <p style={{ fontSize: 11, color: "#8E8E93", margin: "6px 0 10px" }}>
              {list.length} carte{list.length !== 1 ? "s" : ""} détectée{list.length !== 1 ? "s" : ""}
            </p>

            {generating && progress > 0 && (
              <div style={{ marginBottom: 10 }}>
                <div style={{ height: 4, background: "#F0F0F0", borderRadius: 4, overflow: "hidden" }}>
                  <div style={{ width: `${progress}%`, height: "100%", background: "#4E7EF6", borderRadius: 4, transition: "width 0.3s" }} />
                </div>
                <p style={{ fontSize: 11, color: "#8E8E93", marginTop: 4 }}>{progress}%</p>
              </div>
            )}

            <button
              onClick={downloadBatch}
              disabled={generating || list.length === 0}
              style={{
                width: "100%", padding: "11px 0", borderRadius: 10,
                fontSize: 14, fontWeight: 600, color: "#FFFFFF", cursor: list.length === 0 ? "not-allowed" : "pointer",
                background: generating || list.length === 0 ? "#C7C7CC" : "#6A5AF9", border: "none",
              }}
            >
              {generating ? `Génération… ${progress}%` : `⬇ Télécharger ${list.length} cartes (ZIP)`}
            </button>
          </div>

          {/* Print specs */}
          <div style={{ background: "#FFFFFF", borderRadius: 16, padding: 20, border: "1px solid rgba(0,0,0,0.07)" }}>
            <p style={{ fontSize: 11, fontWeight: 600, color: "#8E8E93", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 12 }}>
              Specs imprimeur
            </p>
            {[
              ["Format", "152 × 101 mm (ratio 3:2)"],
              ["Résolution export", `${PRINT_W * PRINT_SCALE} × ${PRINT_H * PRINT_SCALE} px`],
              ["DPI équivalent", "~200 DPI"],
              ["Format fichier", "PNG (RVB)"],
              ["Fond perdu", "inclure 3 mm"],
              ["Support recommandé", "PVC rigide 1mm"],
              ["Finition", "Mat ou Satiné"],
            ].map(([k, v]) => (
              <div key={k} style={{ display: "flex", justifyContent: "space-between", marginBottom: 7 }}>
                <span style={{ fontSize: 12, color: "#8E8E93" }}>{k}</span>
                <span style={{ fontSize: 12, fontWeight: 500, color: "#1D1D1F" }}>{v}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right — preview canvas */}
        <div style={{ flex: 1, minWidth: 300 }}>
          <div style={{ background: "#FFFFFF", borderRadius: 16, padding: 24, border: "1px solid rgba(0,0,0,0.07)", boxShadow: "0 2px 16px rgba(0,0,0,0.06)" }}>
            <p style={{ fontSize: 11, fontWeight: 600, color: "#8E8E93", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 16 }}>
              Aperçu — échelle {Math.round(PREVIEW_SCALE * 100)}%
            </p>
            <div style={{ borderRadius: 8, overflow: "hidden", boxShadow: "0 8px 32px rgba(0,0,0,0.12)", display: "inline-block" }}>
              <canvas
                ref={previewRef}
                style={{
                  display: "block",
                  width: Math.round(PRINT_W * PREVIEW_SCALE),
                  height: Math.round(PRINT_H * PREVIEW_SCALE),
                }}
              />
            </div>
            <p style={{ fontSize: 11, color: "#C7C7CC", marginTop: 12 }}>
              L'aperçu est au {Math.round(PREVIEW_SCALE * 100)}% — le fichier téléchargé est pleine résolution ({PRINT_W}×{PRINT_H}px).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
