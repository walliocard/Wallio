"use client";

import { useAuth } from "@/lib/auth-context";
import { useRef, useState, useCallback } from "react";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { getDefaultTemplate, getTemplate } from "@/lib/card-engine/registry";
import type { CardData } from "@/lib/card-engine/types";
import CardDesigner from "@/components/card-designer/CardDesigner";

export default function CartePage() {
  const { user, marchand } = useAuth();

  const defaultTemplate = getDefaultTemplate();

  const [data, setData] = useState<CardData>({
    nom:              (marchand?.nom as string) || "",
    logo_url:         (marchand?.logo_url as string) || "",
    tampons:          0,
    objectif_tampons: (marchand?.objectif_tampons as number) || 10,
    nom_recompense:   (marchand?.nom_recompense as string) || "Récompense offerte",
    slogan:           (marchand?.slogan as string) || "",
    wallet_id:        "",
  });

  const [templateId, setTemplateId]     = useState((marchand?.template_id as string) || defaultTemplate.id);
  const [paletteId,  setPaletteId]      = useState((marchand?.palette_id as string)  || defaultTemplate.defaultPaletteId);
  const [tab, setTab]                   = useState<"designs" | "infos">("designs");
  const [saving, setSaving]             = useState(false);
  const [saved, setSaved]               = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  if (!marchand || !user) return null;

  const template = getTemplate(templateId) ?? defaultTemplate;
  const palette  = template.palettes.find(p => p.id === paletteId) ?? template.palettes[0];

  const set = <K extends keyof CardData>(k: K, v: CardData[K]) =>
    setData(d => ({ ...d, [k]: v }));

  async function sauvegarder() {
    setSaving(true);
    await updateDoc(doc(db, "marchands", user!.uid), {
      nom:              data.nom,
      slogan:           data.slogan,
      objectif_tampons: data.objectif_tampons,
      nom_recompense:   data.nom_recompense,
      logo_url:         data.logo_url,
      template_id:      templateId,
      palette_id:       paletteId,
      updated_at:       serverTimestamp(),
    });
    setSaving(false); setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (!file.type.startsWith("image/")) return;
    setUploadingLogo(true);
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const img = new Image();
        const url = URL.createObjectURL(file);
        img.onload = () => {
          URL.revokeObjectURL(url);
          const MAX = 280;
          const ratio = Math.min(MAX / img.width, MAX / img.height, 1);
          const canvas = document.createElement("canvas");
          canvas.width = Math.round(img.width * ratio);
          canvas.height = Math.round(img.height * ratio);
          canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL("image/jpeg", 0.72));
        };
        img.onerror = reject;
        img.src = url;
      });
      // Stocké directement en base64 dans Firestore (évite Firebase Storage)
      set("logo_url", dataUrl);
      await updateDoc(doc(db, "marchands", user.uid), { logo_url: dataUrl });
    } catch (err: unknown) {
      alert(`Erreur : ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setUploadingLogo(false);
    }
  }

  return (
    <div style={{ height: "calc(100vh - 0px)", display: "flex", flexDirection: "column" }}>

      {/* Header */}
      <div style={{
        padding: "16px 24px", borderBottom: "1px solid var(--border)",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        background: "var(--glass-bg)", backdropFilter: "blur(20px)", flexShrink: 0,
      }}>
        <div>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--fg-tertiary)" }}>
            Carte de fidélité
          </p>
          <h1 style={{ fontSize: 22, fontWeight: 600, letterSpacing: -0.5, color: "var(--fg)", marginTop: 2 }}>
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

        {/* Save */}
        <button onClick={sauvegarder} disabled={saving} style={{
          padding: "8px 20px", borderRadius: 12, fontSize: 13, fontWeight: 600,
          background: saved ? "#34C759" : "var(--accent)", color: "white",
          border: "none", cursor: "pointer",
          boxShadow: "0 4px 14px rgba(0,122,255,0.25)",
        }}>
          {saving ? "…" : saved ? "Sauvegardé ✓" : "Sauvegarder"}
        </button>
      </div>

      {/* Contenu principal */}
      <div style={{ flex: 1, overflow: "hidden" }}>
        {tab === "designs" ? (
          <CardDesigner
            data={data}
            selectedTemplateId={templateId}
            selectedPaletteId={paletteId}
            onSelectTemplate={(tid, pid) => { setTemplateId(tid); setPaletteId(pid); }}
            onChangePalette={setPaletteId}
          />
        ) : (
          /* ── Onglet Personnaliser ── */
          <div style={{ display: "flex", height: "100%", gap: 0 }}>

            {/* Preview sticky */}
            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 32, gap: 0 }}>
              <div style={{ width: "100%", maxWidth: 460 }}>
                {/* Carte */}
                <div style={{ width: "100%", aspectRatio: "375/246", borderRadius: "16px 16px 0 0", overflow: "hidden", boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>
                  {template.render({ data, tokens: palette.tokens, palette, thumbnail: false })}
                </div>
                {/* Extension QR */}
                <div style={{ width: "100%", background: palette.tokens.background, borderRadius: "0 0 16px 16px", borderTop: `1px solid ${palette.tokens.border}`, display: "flex", flexDirection: "column", alignItems: "center", padding: "14px 0 12px", boxShadow: "0 10px 30px rgba(0,0,0,0.15)" }}>
                  <div style={{ width: 60, height: 60, background: "#fff", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <svg width="52" height="52" viewBox="0 0 200 200"><rect width="200" height="200" fill="#fff"/><rect x="10" y="10" width="70" height="70" rx="6" fill="#000"/><rect x="20" y="20" width="50" height="50" rx="3" fill="#fff"/><rect x="30" y="30" width="30" height="30" rx="2" fill="#000"/><rect x="120" y="10" width="70" height="70" rx="6" fill="#000"/><rect x="130" y="20" width="50" height="50" rx="3" fill="#fff"/><rect x="140" y="30" width="30" height="30" rx="2" fill="#000"/><rect x="10" y="120" width="70" height="70" rx="6" fill="#000"/><rect x="20" y="130" width="50" height="50" rx="3" fill="#fff"/><rect x="30" y="140" width="30" height="30" rx="2" fill="#000"/><rect x="100" y="100" width="10" height="10" fill="#000"/><rect x="120" y="105" width="10" height="10" fill="#000"/><rect x="140" y="100" width="10" height="10" fill="#000"/><rect x="100" y="120" width="15" height="10" fill="#000"/><rect x="130" y="125" width="20" height="10" fill="#000"/><rect x="100" y="140" width="10" height="10" fill="#000"/><rect x="125" y="145" width="15" height="10" fill="#000"/><rect x="150" y="140" width="20" height="10" fill="#000"/></svg>
                  </div>
                  <p style={{ fontSize: 9, marginTop: 8, letterSpacing: "0.1em", textTransform: "uppercase", color: palette.tokens.textTertiary }}>Votre carte · Wallio</p>
                </div>
              </div>
            </div>

            {/* Panel droit */}
            <div style={{
              width: 300, borderLeft: "1px solid var(--border)",
              overflowY: "auto", padding: "20px 18px",
              display: "flex", flexDirection: "column", gap: 20,
            }}>

              {/* Logo — label direct pour meilleure compat navigateur */}
              <Section label="Logo">
                <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                  <label style={{
                    width: 52, height: 52, borderRadius: 12,
                    border: "1px solid var(--border)",
                    overflow: "hidden", flexShrink: 0,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    background: "var(--glass-bg)", cursor: uploadingLogo ? "wait" : "pointer",
                  }}>
                    <input type="file" accept="image/*" style={{ display: "none" }} onChange={handleLogoUpload} disabled={uploadingLogo}/>
                    {data.logo_url
                      ? <img src={data.logo_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }}/>
                      : <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--fg-tertiary)" strokeWidth="1.5" strokeLinecap="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
                    }
                  </label>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: "block", width: "100%", padding: "8px 0", borderRadius: 10, fontSize: 12, fontWeight: 500, background: "var(--glass-bg)", border: "1px solid var(--border)", color: "var(--fg)", cursor: uploadingLogo ? "wait" : "pointer", textAlign: "center" }}>
                      <input type="file" accept="image/*" style={{ display: "none" }} onChange={handleLogoUpload} disabled={uploadingLogo}/>
                      {uploadingLogo ? "Upload…" : data.logo_url ? "Changer" : "Upload…"}
                    </label>
                    {data.logo_url && (
                      <button onClick={() => set("logo_url", "")} style={{ width: "100%", marginTop: 4, padding: "5px 0", borderRadius: 8, fontSize: 11, background: "none", border: "none", color: "#FF3B30", cursor: "pointer" }}>
                        Supprimer
                      </button>
                    )}
                  </div>
                </div>
              </Section>

              {/* Infos */}
              <Section label="Informations">
                <Field label="Nom de l'établissement">
                  <TextInput value={data.nom} onChange={v => set("nom", v)} placeholder="Café du Centre"/>
                </Field>
                <Field label="Slogan (optionnel)">
                  <TextInput value={data.slogan || ""} onChange={v => set("slogan", v)} placeholder="Le meilleur café de la ville"/>
                </Field>
              </Section>

              {/* Récompense */}
              <Section label="Récompense">
                <Field label="Description">
                  <TextInput value={data.nom_recompense} onChange={v => set("nom_recompense", v)} placeholder="1 café offert"/>
                </Field>
                <Field label={`Tampons nécessaires — ${data.objectif_tampons}`}>
                  <input type="range" min={5} max={20} value={data.objectif_tampons}
                    onChange={e => set("objectif_tampons", Number(e.target.value))}
                    style={{ width: "100%", accentColor: "var(--accent)" }}/>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    {[5,6,8,10,12,15,20].map(n => (
                      <button key={n} onClick={() => set("objectif_tampons", n)} style={{
                        fontSize: 10, padding: "2px 5px", borderRadius: 5,
                        background: data.objectif_tampons === n ? "var(--accent)" : "var(--glass-bg)",
                        border: "1px solid var(--border)",
                        color: data.objectif_tampons === n ? "white" : "var(--fg-tertiary)",
                        cursor: "pointer",
                      }}>{n}</button>
                    ))}
                  </div>
                </Field>
              </Section>

              {/* Palettes */}
              <Section label="Palette de couleurs">
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {template.palettes.map(p => (
                    <button key={p.id} onClick={() => setPaletteId(p.id)} style={{
                      display: "flex", alignItems: "center", gap: 10, padding: "8px 12px",
                      borderRadius: 10,
                      background: paletteId === p.id ? "rgba(0,122,255,0.08)" : "transparent",
                      border: `1px solid ${paletteId === p.id ? "var(--accent)" : "var(--border)"}`,
                      cursor: "pointer",
                    }}>
                      <div style={{ width: 22, height: 22, borderRadius: 6, background: p.tokens.background, border: "1px solid rgba(128,128,128,0.3)", flexShrink: 0 }}/>
                      <div style={{ display: "flex", gap: 3 }}>
                        <div style={{ width: 12, height: 12, borderRadius: 3, background: p.tokens.accent }}/>
                        <div style={{ width: 12, height: 12, borderRadius: 3, background: p.tokens.stampActive }}/>
                      </div>
                      <span style={{ fontSize: 12, fontWeight: paletteId === p.id ? 600 : 500, color: paletteId === p.id ? "var(--accent)" : "var(--fg)" }}>{p.name}</span>
                    </button>
                  ))}
                </div>
              </Section>

              {/* Couleurs libres */}
              <Section label="Couleurs personnalisées">
                <p style={{ fontSize: 10, color: "var(--fg-tertiary)", marginTop: -6 }}>Remplace la palette sélectionnée</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {[
                    { label: "Fond", key: "background" as const },
                    { label: "Accent / tampons", key: "accent" as const },
                    { label: "Texte", key: "text" as const },
                  ].map(({ label, key }) => (
                    <div key={key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span style={{ fontSize: 12, color: "var(--fg)" }}>{label}</span>
                      <input
                        type="color"
                        value={palette.tokens[key] || "#000000"}
                        onChange={e => {
                          const newTokens = { ...palette.tokens, [key]: e.target.value };
                          if (key === "accent") newTokens.accentSecondary = e.target.value;
                          if (key === "accent") newTokens.stampActive = e.target.value;
                          const idx = template.palettes.findIndex(p => p.id === paletteId);
                          if (idx >= 0) template.palettes[idx] = { ...template.palettes[idx], tokens: newTokens };
                          setPaletteId(p => p); // force re-render
                        }}
                        style={{ width: 36, height: 28, borderRadius: 6, border: "1px solid var(--border)", cursor: "pointer", padding: 2 }}
                      />
                    </div>
                  ))}
                </div>
              </Section>

            </div>
          </div>
        )}
      </div>
    </div>
  );
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
        color: "var(--fg)", outline: "none",
      }}
      onFocus={e => (e.target.style.borderColor = "var(--accent)")}
      onBlur={e => (e.target.style.borderColor = "var(--border)")}
    />
  );
}
