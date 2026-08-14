"use client";

import { useAuth } from "@/lib/auth-context";
import { useRef, useState, useCallback } from "react";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "@/lib/firebase";
import { getDefaultTemplate, getTemplate } from "@/lib/card-engine/registry";
import type { CardData } from "@/lib/card-engine/types";
import CardDesigner from "@/components/card-designer/CardDesigner";

export default function CartePage() {
  const { user, marchand } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);

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
    if (!file.type.startsWith("image/")) { alert("Fichier image requis"); return; }
    setUploadingLogo(true);
    try {
      const blob = await new Promise<Blob>((resolve, reject) => {
        const img = new Image();
        const url = URL.createObjectURL(file);
        img.onload = () => {
          URL.revokeObjectURL(url);
          const MAX = 400;
          const ratio = Math.min(MAX / img.width, MAX / img.height, 1);
          const canvas = document.createElement("canvas");
          canvas.width = Math.round(img.width * ratio);
          canvas.height = Math.round(img.height * ratio);
          canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
          canvas.toBlob(b => b ? resolve(b) : reject(new Error("Canvas failed")), "image/jpeg", 0.85);
        };
        img.onerror = reject;
        img.src = url;
      });
      const r = storageRef(storage, `logos/${user.uid}.jpg`);
      await uploadBytes(r, blob, { contentType: "image/jpeg" });
      const url = await getDownloadURL(r);
      set("logo_url", url);
      await updateDoc(doc(db, "marchands", user.uid), { logo_url: url });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("unauthorized")) {
        alert("Accès refusé Firebase Storage. Vérifier les règles Storage.");
      } else {
        alert(`Erreur upload : ${msg}`);
      }
    } finally {
      setUploadingLogo(false);
      if (fileRef.current) fileRef.current.value = "";
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
            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 32, gap: 16 }}>
              <div style={{ width: "100%", maxWidth: 460 }}>
                <div style={{ width: "100%", aspectRatio: "375/246", borderRadius: 16, overflow: "hidden", boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>
                  {template.render({ data, tokens: palette.tokens, palette, thumbnail: false })}
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <div style={{ width: "80%", height: 1, background: palette.tokens.border }}/>
                  <div style={{
                    width: "80%", background: palette.tokens.background,
                    borderRadius: "0 0 16px 16px", padding: "14px 0 12px",
                    display: "flex", flexDirection: "column", alignItems: "center",
                    boxShadow: "0 10px 25px rgba(0,0,0,0.12)",
                  }}>
                    <div style={{ width: 60, height: 60, background: "#fff", borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <span style={{ fontSize: 8, color: "#666" }}>QR Code</span>
                    </div>
                    <p style={{ fontSize: 8, marginTop: 8, letterSpacing: "0.1em", color: palette.tokens.textTertiary }}>
                      VOTRE CARTE · WALLIO
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Panel droit */}
            <div style={{
              width: 300, borderLeft: "1px solid var(--border)",
              overflowY: "auto", padding: "20px 18px",
              display: "flex", flexDirection: "column", gap: 20,
            }}>

              {/* Logo */}
              <Section label="Logo">
                <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                  <div style={{
                    width: 52, height: 52, borderRadius: 12,
                    border: "1px solid var(--border)",
                    overflow: "hidden", flexShrink: 0,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    background: "var(--glass-bg)",
                  }}>
                    {data.logo_url
                      ? <img src={data.logo_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }}/>
                      : <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--fg-tertiary)" strokeWidth="1.5" strokeLinecap="round">
                          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                          <circle cx="12" cy="13" r="4"/>
                        </svg>
                    }
                  </div>
                  <div style={{ flex: 1 }}>
                    <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleLogoUpload}/>
                    <button onClick={() => fileRef.current?.click()} disabled={uploadingLogo} style={{
                      width: "100%", padding: "8px 0", borderRadius: 10, fontSize: 12, fontWeight: 500,
                      background: "var(--glass-bg)", border: "1px solid var(--border)", color: "var(--fg)", cursor: "pointer",
                    }}>
                      {uploadingLogo ? "Upload…" : data.logo_url ? "Changer" : "Ajouter un logo"}
                    </button>
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
                      background: paletteId === p.id ? "var(--glass-bg)" : "transparent",
                      border: `1px solid ${paletteId === p.id ? "var(--accent)" : "var(--border)"}`,
                      cursor: "pointer",
                    }}>
                      <div style={{ width: 22, height: 22, borderRadius: 6, background: p.tokens.background, border: "1px solid rgba(0,0,0,0.1)", flexShrink: 0 }}/>
                      <div style={{ display: "flex", gap: 4 }}>
                        <div style={{ width: 12, height: 12, borderRadius: 3, background: p.tokens.accent }}/>
                        <div style={{ width: 12, height: 12, borderRadius: 3, background: p.tokens.stampActive }}/>
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 500, color: "var(--fg)" }}>{p.name}</span>
                    </button>
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
