"use client";

import { useAuth } from "@/lib/auth-context";
import { useMemo, useState } from "react";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { getAllTemplates, getDefaultTemplate } from "@/lib/card-engine/registry";
import type { CardData, CardDimensions } from "@/lib/card-engine/types";
import AppleWalletCard from "@/components/AppleWalletCard";

export default function CartePage() {
  const { user, marchand } = useAuth();

  const allTemplates = useMemo(() => getAllTemplates(), []);
  const defaultTpl = getDefaultTemplate();

  const objectifInit = (marchand?.objectif_tampons as number) || 10;

  // Calcul du template/palette initial pour le fallback couleur de fond
  const initTemplateId = (marchand?.template_id as string) || defaultTpl.id;
  const initTemplate = allTemplates.find(t => t.id === initTemplateId) ?? allTemplates[0];
  const initPaletteId = (marchand?.palette_id as string) || initTemplate.defaultPaletteId;
  const initPalette = initTemplate.palettes.find(p => p.id === initPaletteId) ?? initTemplate.palettes[0];

  const [templateId, setTemplateId] = useState<string>(initTemplateId);
  const [paletteId, setPaletteId] = useState<string>(initPaletteId);
  const [nom, setNom] = useState<string>((marchand?.nom as string) || "");
  const [logoUrl, setLogoUrl] = useState<string>((marchand?.logo_url as string) || "");
  const [recompense, setRecompense] = useState<string>((marchand?.nom_recompense as string) || "");
  const [objectif, setObjectif] = useState<number>(objectifInit);
  // apple_bg_color = champ dédié, fallback sur la couleur du template (jamais couleur_principale)
  const [bgColor, setBgColor] = useState<string>((marchand?.apple_bg_color as string) || initPalette.tokens.background);
  const [tab, setTab] = useState<"designs" | "infos">("designs");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [category, setCategory] = useState("all");

  if (!marchand || !user) return null;

  const template = allTemplates.find(t => t.id === templateId) ?? allTemplates[0];
  const palette = template.palettes.find(p => p.id === paletteId) ?? template.palettes[0];
  const stampsCurrent = Math.round(objectif * 0.6);

  const cardData: CardData = {
    nom,
    logo_url: logoUrl,
    tampons: stampsCurrent,
    objectif_tampons: objectif,
    nom_recompense: recompense,
    mode: (marchand?.mode_recompense as "cyclique" | "progressif") || "cyclique",
    client_prenom: "Prénom",
    client_nom: "Nom",
  };

  const dims: CardDimensions = { format: "standard" };

  // Strip = template rendu en mode strip (375×144 natif, décoratifs + identité marchand)
  const stripContent = template.render({ data: cardData, tokens: palette.tokens, palette, thumbnail: false, dimensions: dims, strip: true });

  async function sauvegarder() {
    setSaving(true);
    await updateDoc(doc(db, "marchands", user!.uid), {
      nom,
      logo_url: logoUrl,
      nom_recompense: recompense,
      objectif_tampons: objectif,
      template_id: templateId,
      palette_id: paletteId,
      apple_bg_color: bgColor,
      updated_at: serverTimestamp(),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !user || !file.type.startsWith("image/")) return;
    setUploadingLogo(true);
    try {
      const dataUrl = await resizeImage(file, 280);
      setLogoUrl(dataUrl);
      await updateDoc(doc(db, "marchands", user.uid), { logo_url: dataUrl });
    } catch (err: unknown) {
      alert(`Erreur : ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setUploadingLogo(false);
    }
  }

  const categories = [
    { id: "all", label: "Tous" },
    { id: "minimal", label: "Minimal" },
    { id: "premium", label: "Premium" },
    { id: "coffee", label: "Café" },
    { id: "restaurant", label: "Resto" },
    { id: "beauty", label: "Beauté" },
    { id: "barber", label: "Barber" },
    { id: "sport", label: "Sport" },
    { id: "colorful", label: "Coloré" },
    { id: "retro", label: "Rétro" },
  ];

  const filtered = category === "all"
    ? allTemplates
    : allTemplates.filter(t => t.categories.includes(category as Parameters<typeof t.categories.includes>[0]));

  return (
    <div style={{ height: "calc(100vh - 0px)", display: "flex", flexDirection: "column" }}>

      {/* ── Header ── */}
      <div style={{
        padding: "14px 24px",
        borderBottom: "1px solid var(--border)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        background: "var(--glass-bg)",
        backdropFilter: "blur(20px)",
        flexShrink: 0,
      }}>
        <div>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--fg-tertiary)" }}>
            Carte Apple Wallet
          </p>
          <h1 style={{ fontSize: 20, fontWeight: 600, letterSpacing: -0.5, color: "var(--fg)", marginTop: 1 }}>
            Ma carte
          </h1>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 4, background: "var(--glass-bg)", border: "1px solid var(--border)", borderRadius: 10, padding: 3 }}>
          {(["designs", "infos"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              padding: "6px 14px", borderRadius: 7, fontSize: 12, fontWeight: 500,
              background: tab === t ? "var(--accent)" : "transparent",
              color: tab === t ? "white" : "var(--fg-secondary)",
              border: "none", cursor: "pointer",
            }}>
              {t === "designs" ? "Designs" : "Personnaliser"}
            </button>
          ))}
        </div>

        <button onClick={sauvegarder} disabled={saving} style={{
          padding: "8px 20px", borderRadius: 12, fontSize: 13, fontWeight: 600,
          background: saved ? "#34C759" : "var(--accent)", color: "white",
          border: "none", cursor: "pointer",
          boxShadow: "0 4px 14px rgba(0,122,255,0.25)",
        }}>
          {saving ? "…" : saved ? "Sauvegardé ✓" : "Sauvegarder"}
        </button>
      </div>

      {/* ── Contenu ── */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>

        {/* Preview Apple Wallet — toujours visible */}
        <div style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: 32,
          gap: 14,
          background: "var(--bg)",
          overflowY: "auto",
        }}>
          <div style={{
            padding: "5px 16px",
            background: "var(--glass-bg)",
            border: "1px solid var(--border)",
            borderRadius: 20,
          }}>
            <p style={{ fontSize: 11, color: "var(--fg-tertiary)", letterSpacing: "0.04em" }}>
              Aperçu fidèle · iPhone · Apple Wallet
            </p>
          </div>

          <AppleWalletCard
            logoUrl={logoUrl}
            logoText={nom}
            stripContent={stripContent}
            backgroundColor={bgColor}
            stampsCurrent={stampsCurrent}
            stampsObjective={objectif}
            rewardName={recompense}
            clientPrenom="Prénom"
            clientNom="Nom"
          />

          <p style={{ fontSize: 11, color: "var(--fg-tertiary)", textAlign: "center", maxWidth: 340 }}>
            Le design apparaît dans la bannière — la mise en page des champs est imposée par Apple.
          </p>
        </div>

        {/* ── Panel droit ── */}
        <div style={{
          width: 320,
          borderLeft: "1px solid var(--border)",
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          flexShrink: 0,
        }}>

          {tab === "designs" ? (
            /* ── Onglet Designs ── */
            <div style={{ padding: "16px 14px", display: "flex", flexDirection: "column", gap: 14 }}>

              {/* Filtre catégories */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                {categories.map(c => (
                  <button key={c.id} onClick={() => setCategory(c.id)} style={{
                    padding: "4px 10px", borderRadius: 20, fontSize: 11, fontWeight: 500,
                    background: category === c.id ? "var(--accent)" : "var(--glass-bg)",
                    color: category === c.id ? "white" : "var(--fg-secondary)",
                    border: `1px solid ${category === c.id ? "var(--accent)" : "var(--border)"}`,
                    cursor: "pointer",
                  }}>
                    {c.label}
                  </button>
                ))}
              </div>

              {/* Grille templates */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8 }}>
                {filtered.map(tpl => {
                  const pal = tpl.palettes.find(p => p.id === (tpl.id === templateId ? paletteId : tpl.defaultPaletteId)) ?? tpl.palettes[0];
                  const selected = tpl.id === templateId;
                  return (
                    <button
                      key={tpl.id}
                      onClick={() => { setTemplateId(tpl.id); setPaletteId(pal.id); }}
                      style={{
                        padding: 0, border: `2px solid ${selected ? "var(--accent)" : "transparent"}`,
                        borderRadius: 12, overflow: "hidden", cursor: "pointer",
                        boxShadow: selected ? "0 0 0 3px rgba(0,122,255,0.15)" : "none",
                        background: "none",
                        position: "relative",
                      }}
                    >
                      {/* Miniature : template rendu à 375×246, scalé à 144×94 */}
                      <div style={{
                        width: 144, height: 94,
                        overflow: "hidden",
                        position: "relative",
                      }}>
                        <div style={{
                          width: 375, height: 246,
                          transform: "scale(0.384)",
                          transformOrigin: "top left",
                          pointerEvents: "none",
                        }}>
                          {tpl.render({ data: cardData, tokens: pal.tokens, palette: pal, thumbnail: true })}
                        </div>
                      </div>
                      {/* Nom du template */}
                      <div style={{
                        position: "absolute", bottom: 0, left: 0, right: 0,
                        padding: "12px 6px 5px",
                        background: "linear-gradient(to bottom, transparent, rgba(0,0,0,0.7))",
                        textAlign: "center",
                      }}>
                        <span style={{ fontSize: 9, fontWeight: 600, color: "#fff", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                          {tpl.name}
                        </span>
                      </div>
                      {selected && (
                        <div style={{
                          position: "absolute", top: 5, right: 5,
                          width: 18, height: 18, borderRadius: "50%",
                          background: "var(--accent)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                        }}>
                          <span style={{ fontSize: 10, color: "white" }}>✓</span>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Palettes du template sélectionné */}
              {template.palettes.length > 1 && (
                <div>
                  <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--fg-tertiary)", marginBottom: 8 }}>
                    Palette — {template.name}
                  </p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {template.palettes.map(p => (
                      <button key={p.id} onClick={() => setPaletteId(p.id)} style={{
                        display: "flex", alignItems: "center", gap: 10, padding: "8px 12px",
                        borderRadius: 10, cursor: "pointer",
                        background: paletteId === p.id ? "rgba(0,122,255,0.08)" : "transparent",
                        border: `1px solid ${paletteId === p.id ? "var(--accent)" : "var(--border)"}`,
                      }}>
                        <div style={{ width: 20, height: 20, borderRadius: 5, background: p.tokens.background, border: "1px solid rgba(128,128,128,0.3)", flexShrink: 0 }}/>
                        <div style={{ display: "flex", gap: 3 }}>
                          <div style={{ width: 10, height: 10, borderRadius: 3, background: p.tokens.accent }}/>
                          <div style={{ width: 10, height: 10, borderRadius: 3, background: p.tokens.stampActive }}/>
                        </div>
                        <span style={{ fontSize: 12, fontWeight: paletteId === p.id ? 600 : 500, color: paletteId === p.id ? "var(--accent)" : "var(--fg)" }}>{p.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

          ) : (
            /* ── Onglet Personnaliser ── */
            <div style={{ padding: "16px 14px", display: "flex", flexDirection: "column", gap: 20 }}>

              {/* Logo */}
              <Section label="Logo">
                <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                  <label style={{
                    width: 52, height: 52, borderRadius: 12,
                    border: "1px solid var(--border)", overflow: "hidden",
                    flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
                    background: "var(--glass-bg)", cursor: uploadingLogo ? "wait" : "pointer",
                  }}>
                    <input type="file" accept="image/*" style={{ display: "none" }} onChange={handleLogoUpload} disabled={uploadingLogo}/>
                    {logoUrl
                      ? <img src={logoUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }}/>
                      : <CameraIcon />
                    }
                  </label>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: "block", width: "100%", padding: "8px 0", borderRadius: 10, fontSize: 12, fontWeight: 500, background: "var(--glass-bg)", border: "1px solid var(--border)", color: "var(--fg)", cursor: uploadingLogo ? "wait" : "pointer", textAlign: "center" }}>
                      <input type="file" accept="image/*" style={{ display: "none" }} onChange={handleLogoUpload} disabled={uploadingLogo}/>
                      {uploadingLogo ? "Upload…" : logoUrl ? "Changer" : "Ajouter"}
                    </label>
                    {logoUrl && (
                      <button onClick={() => setLogoUrl("")} style={{ width: "100%", marginTop: 4, padding: "5px 0", borderRadius: 8, fontSize: 11, background: "none", border: "none", color: "#FF3B30", cursor: "pointer" }}>
                        Supprimer
                      </button>
                    )}
                  </div>
                </div>
                <p style={{ fontSize: 10, color: "var(--fg-tertiary)", margin: "4px 0 0" }}>
                  Affiché en haut à gauche · max 160×50pt
                </p>
              </Section>

              {/* Infos */}
              <Section label="Informations">
                <Field label="Nom de l'établissement">
                  <TextInput value={nom} onChange={setNom} placeholder="Café du Centre"/>
                </Field>
              </Section>

              {/* Récompense */}
              <Section label="Récompense">
                <Field label="Description">
                  <TextInput value={recompense} onChange={setRecompense} placeholder="1 café offert"/>
                </Field>
                <Field label={`Tampons nécessaires — ${objectif}`}>
                  <input type="range" min={5} max={20} value={objectif}
                    onChange={e => setObjectif(Number(e.target.value))}
                    style={{ width: "100%", accentColor: "var(--accent)" }}/>
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
                    {[5, 6, 8, 10, 12, 15, 20].map(n => (
                      <button key={n} onClick={() => setObjectif(n)} style={{
                        fontSize: 10, padding: "2px 5px", borderRadius: 5,
                        background: objectif === n ? "var(--accent)" : "var(--glass-bg)",
                        border: "1px solid var(--border)",
                        color: objectif === n ? "white" : "var(--fg-tertiary)",
                        cursor: "pointer",
                      }}>{n}</button>
                    ))}
                  </div>
                </Field>
              </Section>

              {/* Couleur de fond */}
              <Section label="Couleur de fond de la carte">
                <p style={{ fontSize: 10, color: "var(--fg-tertiary)", margin: "-4px 0 4px" }}>
                  Indépendante du design — s&apos;applique au header, aux champs et à la zone QR.
                </p>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <input
                    type="color"
                    value={/^#[0-9a-f]{6}$/i.test(bgColor) ? bgColor : "#1c1c1e"}
                    onChange={e => setBgColor(e.target.value)}
                    style={{ width: 52, height: 40, borderRadius: 10, border: "1px solid var(--border)", cursor: "pointer", padding: 3, background: "none" }}
                  />
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 500, color: "var(--fg)", margin: 0 }}>{bgColor.toUpperCase()}</p>
                    <p style={{ fontSize: 11, color: "var(--fg-tertiary)", margin: "2px 0 0" }}>
                      Texte {isDarkBg(bgColor) ? "blanc" : "noir"} auto
                    </p>
                  </div>
                </div>

                {/* Presets */}
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {[
                    "#0A0A0A", "#1C1C1E", "#1A1A2E", "#0D1B2A",
                    "#1C3A5C", "#3A1C1C", "#1C3A1C", "#2C1654",
                    "#FFFFFF", "#F2F2F7", "#EEF3FF", "#FFF9F0",
                  ].map(c => (
                    <button key={c} onClick={() => setBgColor(c)} style={{
                      width: 28, height: 28, borderRadius: 8,
                      background: c,
                      border: bgColor === c ? "2px solid var(--accent)" : "1px solid var(--border)",
                      cursor: "pointer", padding: 0,
                      boxShadow: c === "#FFFFFF" ? "inset 0 0 0 1px rgba(0,0,0,0.1)" : undefined,
                    }}/>
                  ))}
                </div>

                {/* Sync depuis le design */}
                <button
                  onClick={() => setBgColor(palette.tokens.background)}
                  style={{
                    padding: "7px 12px", borderRadius: 10, fontSize: 11, fontWeight: 500,
                    background: "var(--glass-bg)", border: "1px solid var(--border)",
                    color: "var(--fg-secondary)", cursor: "pointer", textAlign: "left",
                    display: "flex", alignItems: "center", gap: 8,
                  }}
                >
                  <div style={{ width: 14, height: 14, borderRadius: 4, background: palette.tokens.background, border: "1px solid rgba(128,128,128,0.3)", flexShrink: 0 }}/>
                  Utiliser la couleur du design sélectionné
                </button>
              </Section>

              {/* Note Apple Wallet */}
              <div style={{
                padding: "12px 14px", borderRadius: 12,
                background: "rgba(0,122,255,0.06)",
                border: "1px solid rgba(0,122,255,0.15)",
              }}>
                <p style={{ fontSize: 11, color: "var(--fg-secondary)", margin: 0, lineHeight: 1.6 }}>
                  <strong style={{ color: "var(--accent)" }}>Génération .pkpass</strong><br/>
                  Structure prête · En attente du certificat Apple Developer.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Helpers ──────────────────────────────────────────

function isDarkBg(hex: string): boolean {
  if (!/^#[0-9a-f]{6}$/i.test(hex)) return true;
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const lin = (c: number) => c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b) < 0.35;
}

async function resizeImage(file: File, maxW: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const ratio = Math.min(maxW / img.width, 1);
      const w = Math.round(img.width * ratio);
      const h = Math.round(img.height * ratio);
      const canvas = document.createElement("canvas");
      canvas.width = w; canvas.height = h;
      canvas.getContext("2d")!.drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL("image/jpeg", 0.82));
    };
    img.onerror = reject;
    img.src = url;
  });
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--fg-tertiary)", marginBottom: 10 }}>{label}</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>{children}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p style={{ fontSize: 11, color: "var(--fg-tertiary)", marginBottom: 5 }}>{label}</p>
      {children}
    </div>
  );
}

function TextInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <input
      type="text" value={value} placeholder={placeholder}
      onChange={e => onChange(e.target.value)}
      style={{
        width: "100%", padding: "8px 12px", borderRadius: 10, fontSize: 13,
        background: "var(--glass-bg)", border: "1px solid var(--border)",
        color: "var(--fg)", outline: "none", boxSizing: "border-box",
      }}
      onFocus={e => (e.target.style.borderColor = "var(--accent)")}
      onBlur={e => (e.target.style.borderColor = "var(--border)")}
    />
  );
}

function CameraIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--fg-tertiary)" strokeWidth="1.5" strokeLinecap="round">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
      <circle cx="12" cy="13" r="4"/>
    </svg>
  );
}
