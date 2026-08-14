"use client";

import { useState, useMemo } from "react";
import type { CardTemplate, CardData, CardPalette, CardDimensions } from "@/lib/card-engine/types";
import { FORMAT_RATIOS } from "@/lib/card-engine/types";
import { getAllTemplates, getTemplatesByCategory } from "@/lib/card-engine/registry";

const CATEGORIES = [
  { id: "all",       label: "Tous" },
  { id: "minimal",   label: "Minimal" },
  { id: "premium",   label: "Premium" },
  { id: "luxury",    label: "Luxury" },
  { id: "coffee",    label: "Café" },
  { id: "restaurant",label: "Restaurant" },
  { id: "barber",    label: "Barber" },
  { id: "beauty",    label: "Beauté" },
  { id: "sport",     label: "Sport" },
  { id: "nature",    label: "Nature" },
  { id: "editorial", label: "Éditorial" },
  { id: "retro",     label: "Rétro" },
  { id: "colorful",  label: "Coloré" },
  { id: "street",    label: "Street" },
  { id: "modern",    label: "Moderne" },
  { id: "artistic",  label: "Artistique" },
];

interface CardDesignerProps {
  data: CardData;
  dims: CardDimensions;
  selectedTemplateId: string;
  selectedPaletteId: string;
  onSelectTemplate: (templateId: string, paletteId: string) => void;
  onChangePalette: (paletteId: string) => void;
}

export default function CardDesigner({
  data, dims, selectedTemplateId, selectedPaletteId,
  onSelectTemplate, onChangePalette,
}: CardDesignerProps) {
  const [category, setCategory] = useState("all");
  const [favorites, setFavorites] = useState<string[]>([]);
  const [showFavs, setShowFavs] = useState(false);

  const allTemplates = useMemo(() => getAllTemplates(), []);
  const filtered = useMemo(() => {
    const list = showFavs
      ? allTemplates.filter(t => favorites.includes(t.id))
      : getTemplatesByCategory(category);
    return list;
  }, [category, showFavs, favorites, allTemplates]);

  const selectedTemplate = allTemplates.find(t => t.id === selectedTemplateId) ?? allTemplates[0];
  const selectedPalette = selectedTemplate?.palettes.find(p => p.id === selectedPaletteId)
    ?? selectedTemplate?.palettes[0];

  function toggleFav(id: string) {
    setFavorites(prev => prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]);
  }

  return (
    <div style={{ display: "flex", height: "100%", gap: 0 }}>

      {/* ══════════════════════════════
          SIDEBAR GAUCHE — Galerie
      ══════════════════════════════ */}
      <div style={{
        width: 280, flexShrink: 0, borderRight: "1px solid var(--border)",
        display: "flex", flexDirection: "column", height: "100%", overflow: "hidden",
      }}>
        {/* Header galerie */}
        <div style={{ padding: "14px 16px 10px", borderBottom: "1px solid var(--border)", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--fg-tertiary)" }}>
              Designs
            </span>
            <button
              onClick={() => setShowFavs(v => !v)}
              style={{
                fontSize: 11, padding: "3px 8px", borderRadius: 8,
                background: showFavs ? "var(--accent)" : "var(--glass-bg)",
                border: "1px solid var(--border)",
                color: showFavs ? "white" : "var(--fg-tertiary)",
                cursor: "pointer",
              }}
            >
              ♥ {favorites.length}
            </button>
          </div>

          {/* Filtres catégories */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
            {CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => { setCategory(cat.id); setShowFavs(false); }}
                style={{
                  fontSize: 10, padding: "2px 7px", borderRadius: 6,
                  background: category === cat.id && !showFavs ? "var(--accent)" : "var(--glass-bg)",
                  border: "1px solid var(--border)",
                  color: category === cat.id && !showFavs ? "white" : "var(--fg-tertiary)",
                  cursor: "pointer", whiteSpace: "nowrap",
                }}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Grille templates */}
        <div style={{ flex: 1, overflowY: "auto", padding: 12, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, alignContent: "start" }}>
          {filtered.map(template => {
            const palette = template.palettes.find(p => p.id === template.defaultPaletteId) ?? template.palettes[0];
            const isSelected = template.id === selectedTemplateId;
            const isFav = favorites.includes(template.id);
            return (
              <div
                key={template.id}
                onClick={() => onSelectTemplate(template.id, template.defaultPaletteId)}
                style={{
                  position: "relative", cursor: "pointer",
                  borderRadius: 10, overflow: "hidden",
                  outline: isSelected ? "2px solid var(--accent)" : "1px solid var(--border)",
                  outlineOffset: isSelected ? 2 : 0,
                  transition: "all 0.15s ease",
                }}
              >
                {/* Mini-preview */}
                <div style={{ aspectRatio: "375/246", position: "relative", overflow: "hidden" }}>
                  {template.render({ data, tokens: palette.tokens, palette, thumbnail: true })}
                </div>

                {/* Label */}
                <div style={{
                  padding: "5px 7px",
                  background: "var(--glass-bg)",
                  borderTop: "1px solid var(--border)",
                }}>
                  <div style={{ fontSize: 9, fontWeight: 700, color: "var(--fg)", letterSpacing: "0.05em" }}>
                    {template.name}
                  </div>
                  <div style={{ fontSize: 8, color: "var(--fg-tertiary)", marginTop: 1 }}>
                    {template.subtitle}
                  </div>
                </div>

                {/* Favori */}
                <button
                  onClick={e => { e.stopPropagation(); toggleFav(template.id); }}
                  style={{
                    position: "absolute", top: 4, right: 4,
                    width: 20, height: 20, borderRadius: "50%",
                    background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)",
                    border: "none", cursor: "pointer",
                    fontSize: 10, lineHeight: "20px", textAlign: "center",
                    color: isFav ? "#FF3B6A" : "rgba(255,255,255,0.6)",
                  }}
                >
                  ♥
                </button>
              </div>
            );
          })}

          {filtered.length === 0 && (
            <div style={{ gridColumn: "1/-1", textAlign: "center", padding: 24, color: "var(--fg-tertiary)", fontSize: 12 }}>
              {showFavs ? "Aucun favori" : "Aucun design dans cette catégorie"}
            </div>
          )}
        </div>
      </div>

      {/* ══════════════════════════════
          CENTRE — Preview
      ══════════════════════════════ */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px 32px", gap: 16 }}>

        <div style={{ textAlign: "center" }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: "var(--fg)" }}>{selectedTemplate?.name}</p>
          <p style={{ fontSize: 11, color: "var(--fg-tertiary)" }}>{selectedTemplate?.subtitle}</p>
        </div>

        {/* Carte principale */}
        {selectedTemplate && selectedPalette && (
          <div style={{ width: "100%", maxWidth: 520 }}>
            {/* Carte */}
            <div style={{ width: "100%", aspectRatio: FORMAT_RATIOS[dims.format ?? "standard"], borderRadius: "16px 16px 0 0", overflow: "hidden", boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>
              {selectedTemplate.render({ data, tokens: selectedPalette.tokens, palette: selectedPalette, thumbnail: false, dimensions: dims })}
            </div>
            {/* Extension QR */}
            {(() => {
              const qr = dims.qrSize ?? 56;
              return (
                <div style={{ width: "100%", background: selectedPalette.tokens.background, borderRadius: "0 0 16px 16px", borderTop: `1px solid ${selectedPalette.tokens.border}`, display: "flex", flexDirection: "column", alignItems: "center", padding: `${Math.round(qr * 0.25)}px 0`, boxShadow: "0 10px 30px rgba(0,0,0,0.15)" }}>
                  <div style={{ width: qr, height: qr, background: "#fff", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <svg width={qr - 8} height={qr - 8} viewBox="0 0 200 200"><rect width="200" height="200" fill="#fff"/><rect x="10" y="10" width="70" height="70" rx="6" fill="#000"/><rect x="20" y="20" width="50" height="50" rx="3" fill="#fff"/><rect x="30" y="30" width="30" height="30" rx="2" fill="#000"/><rect x="120" y="10" width="70" height="70" rx="6" fill="#000"/><rect x="130" y="20" width="50" height="50" rx="3" fill="#fff"/><rect x="140" y="30" width="30" height="30" rx="2" fill="#000"/><rect x="10" y="120" width="70" height="70" rx="6" fill="#000"/><rect x="20" y="130" width="50" height="50" rx="3" fill="#fff"/><rect x="30" y="140" width="30" height="30" rx="2" fill="#000"/><rect x="100" y="100" width="10" height="10" fill="#000"/><rect x="120" y="105" width="10" height="10" fill="#000"/><rect x="140" y="100" width="10" height="10" fill="#000"/><rect x="100" y="120" width="15" height="10" fill="#000"/><rect x="130" y="125" width="20" height="10" fill="#000"/><rect x="100" y="140" width="10" height="10" fill="#000"/><rect x="125" y="145" width="15" height="10" fill="#000"/><rect x="150" y="140" width="20" height="10" fill="#000"/></svg>
                  </div>
                  <p style={{ fontSize: 9, marginTop: 8, letterSpacing: "0.1em", textTransform: "uppercase", color: selectedPalette.tokens.textTertiary }}>Votre carte · Wallio</p>
                </div>
              );
            })()}
          </div>
        )}

        {/* Palettes */}
        {selectedTemplate && (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
            {selectedTemplate.palettes.map(palette => (
              <button
                key={palette.id}
                onClick={() => onChangePalette(palette.id)}
                style={{
                  display: "flex", alignItems: "center", gap: 8,
                  padding: "6px 12px", borderRadius: 20,
                  background: selectedPaletteId === palette.id ? "var(--accent)" : "var(--glass-bg)",
                  border: `1px solid ${selectedPaletteId === palette.id ? "var(--accent)" : "var(--border)"}`,
                  cursor: "pointer",
                }}
              >
                <div style={{ width: 14, height: 14, borderRadius: "50%", background: palette.tokens.background, border: "1px solid rgba(0,0,0,0.1)", flexShrink: 0 }}/>
                <span style={{ fontSize: 11, fontWeight: 500, color: selectedPaletteId === palette.id ? "white" : "var(--fg)" }}>
                  {palette.name}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
