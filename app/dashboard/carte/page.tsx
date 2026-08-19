"use client";

import { useAuth } from "@/lib/auth-context";
import { useState } from "react";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import AppleWalletCard from "@/components/AppleWalletCard";

export default function CartePage() {
  const { user, marchand } = useAuth();

  const [nom, setNom] = useState<string>((marchand?.nom as string) || "");
  const [logoUrl, setLogoUrl] = useState<string>((marchand?.logo_url as string) || "");
  const [stripUrl, setStripUrl] = useState<string>((marchand?.strip_url as string) || "");
  const [recompense, setRecompense] = useState<string>((marchand?.nom_recompense as string) || "");
  const [objectif, setObjectif] = useState<number>((marchand?.objectif_tampons as number) || 10);

  // Couleurs Apple Wallet — 3 champs officiels
  const [bgColor, setBgColor] = useState<string>((marchand?.apple_bg_color as string) || "#1C1C1E");
  const [fgAuto, setFgAuto] = useState<boolean>(!(marchand?.apple_fg_color));
  const [fgColor, setFgColor] = useState<string>((marchand?.apple_fg_color as string) || "#FFFFFF");
  const [labelAuto, setLabelAuto] = useState<boolean>(!(marchand?.apple_label_color));
  const [labelColor, setLabelColor] = useState<string>((marchand?.apple_label_color as string) || "rgba(255,255,255,0.55)");
  const [primaryLabel, setPrimaryLabel] = useState<string>((marchand?.apple_primary_label as string) || "Tampons");
  const [rewardLabel, setRewardLabel] = useState<string>((marchand?.apple_reward_label as string) || "Récompense");
  const [memberLabel, setMemberLabel] = useState<string>((marchand?.apple_member_label as string) || "Membre");

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingStrip, setUploadingStrip] = useState(false);

  if (!marchand || !user) return null;

  const stampsCurrent = Math.round(objectif * 0.6);

  // Couleurs effectives (auto ou manuelles)
  const effectiveFg = fgAuto ? autoFg(bgColor) : fgColor;
  const effectiveLabel = labelAuto ? autoLabel(bgColor) : labelColor;

  async function sauvegarder() {
    setSaving(true);
    await updateDoc(doc(db, "marchands", user!.uid), {
      nom,
      logo_url: logoUrl,
      strip_url: stripUrl,
      nom_recompense: recompense,
      objectif_tampons: objectif,
      apple_bg_color: bgColor,
      apple_fg_color: fgAuto ? null : fgColor,
      apple_label_color: labelAuto ? null : labelColor,
      apple_primary_label: primaryLabel,
      apple_reward_label: rewardLabel,
      apple_member_label: memberLabel,
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
      const dataUrl = await resizeImage(file, 320);
      setLogoUrl(dataUrl);
      await updateDoc(doc(db, "marchands", user.uid), { logo_url: dataUrl });
    } catch (err: unknown) {
      alert(`Erreur : ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setUploadingLogo(false);
    }
  }

  async function handleStripUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !user || !file.type.startsWith("image/")) return;
    setUploadingStrip(true);
    try {
      // Strip Apple Wallet @2x : 750×288px
      const dataUrl = await cropResizeImage(file, 750, 288);
      setStripUrl(dataUrl);
      await updateDoc(doc(db, "marchands", user.uid), { strip_url: dataUrl });
    } catch (err: unknown) {
      alert(`Erreur : ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setUploadingStrip(false);
    }
  }

  return (
    <div style={{ height: "calc(100vh - 0px)", display: "flex", flexDirection: "column" }}>

      {/* ── Header ── */}
      <div style={{
        padding: "14px 24px",
        borderBottom: "1px solid var(--border)",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        background: "var(--glass-bg)", backdropFilter: "blur(20px)", flexShrink: 0,
      }}>
        <div>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--fg-tertiary)" }}>
            Carte Apple Wallet
          </p>
          <h1 style={{ fontSize: 20, fontWeight: 600, letterSpacing: -0.5, color: "var(--fg)", marginTop: 1 }}>
            Ma carte
          </h1>
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

        {/* ── Preview ── */}
        <div style={{
          flex: 1, display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          padding: 32, gap: 14, background: "var(--bg)", overflowY: "auto",
        }}>
          <div style={{
            padding: "5px 16px", background: "var(--glass-bg)",
            border: "1px solid var(--border)", borderRadius: 20,
          }}>
            <p style={{ fontSize: 11, color: "var(--fg-tertiary)", letterSpacing: "0.04em" }}>
              Aperçu fidèle · iPhone · Apple Wallet
            </p>
          </div>

          <AppleWalletCard
            logoUrl={logoUrl}
            logoText={nom}
            stripUrl={stripUrl || undefined}
            backgroundColor={bgColor}
            foregroundColor={effectiveFg}
            labelColor={effectiveLabel}
            stampsCurrent={stampsCurrent}
            stampsObjective={objectif}
            rewardName={recompense}
            clientPrenom="Prénom"
            clientNom="Nom"
            primaryLabel={primaryLabel}
            rewardLabel={rewardLabel}
            memberLabel={memberLabel}
          />

          <p style={{ fontSize: 11, color: "var(--fg-tertiary)", textAlign: "center", maxWidth: 340 }}>
            Bannière libre · Couleurs personnalisables · Structure imposée par Apple
          </p>
        </div>

        {/* ── Panel droit ── */}
        <div style={{
          width: 300, borderLeft: "1px solid var(--border)",
          overflowY: "auto", padding: "20px 18px",
          display: "flex", flexDirection: "column", gap: 22, flexShrink: 0,
        }}>

          {/* Logo */}
          <Section label="Logo">
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <label style={{
                width: 52, height: 52, borderRadius: 12,
                border: "1px solid var(--border)", overflow: "hidden", flexShrink: 0,
                display: "flex", alignItems: "center", justifyContent: "center",
                background: "var(--glass-bg)", cursor: uploadingLogo ? "wait" : "pointer",
              }}>
                <input type="file" accept="image/*" style={{ display: "none" }} onChange={handleLogoUpload} disabled={uploadingLogo}/>
                {logoUrl
                  ? <img src={logoUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "contain" }}/>
                  : <CameraIcon/>
                }
              </label>
              <div style={{ flex: 1 }}>
                <label style={{
                  display: "block", width: "100%", padding: "8px 0", borderRadius: 10,
                  fontSize: 12, fontWeight: 500, background: "var(--glass-bg)",
                  border: "1px solid var(--border)", color: "var(--fg)",
                  cursor: uploadingLogo ? "wait" : "pointer", textAlign: "center",
                }}>
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

          {/* Bannière */}
          <Section label="Bannière (strip image)">
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {stripUrl ? (
                <div style={{ borderRadius: 10, overflow: "hidden", aspectRatio: "375/144", border: "1px solid var(--border)", position: "relative" }}>
                  <img src={stripUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }}/>
                </div>
              ) : (
                <label style={{
                  borderRadius: 10, aspectRatio: "375/144",
                  border: "2px dashed var(--border)",
                  display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                  background: "var(--glass-bg)", cursor: uploadingStrip ? "wait" : "pointer", gap: 6,
                }}>
                  <input type="file" accept="image/*" style={{ display: "none" }} onChange={handleStripUpload} disabled={uploadingStrip}/>
                  {uploadingStrip ? (
                    <span style={{ fontSize: 12, color: "var(--fg-tertiary)" }}>Upload…</span>
                  ) : (
                    <>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--fg-tertiary)" strokeWidth="1.5">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
                      </svg>
                      <span style={{ fontSize: 11, color: "var(--fg-tertiary)" }}>Photo ou design du marchand</span>
                    </>
                  )}
                </label>
              )}
              <div style={{ display: "flex", gap: 6 }}>
                <label style={{
                  flex: 1, padding: "8px 0", borderRadius: 10, fontSize: 12, fontWeight: 500,
                  background: "var(--glass-bg)", border: "1px solid var(--border)",
                  color: "var(--fg)", cursor: uploadingStrip ? "wait" : "pointer", textAlign: "center",
                }}>
                  <input type="file" accept="image/*" style={{ display: "none" }} onChange={handleStripUpload} disabled={uploadingStrip}/>
                  {uploadingStrip ? "Upload…" : stripUrl ? "Changer" : "Importer"}
                </label>
                {stripUrl && (
                  <button
                    onClick={() => { setStripUrl(""); updateDoc(doc(db, "marchands", user!.uid), { strip_url: "" }); }}
                    style={{ padding: "8px 14px", borderRadius: 10, fontSize: 13, fontWeight: 600, background: "rgba(255,59,48,0.1)", border: "1px solid rgba(255,59,48,0.3)", color: "#FF3B30", cursor: "pointer" }}
                  >
                    Suppr.
                  </button>
                )}
              </div>
              <p style={{ fontSize: 10, color: "var(--fg-tertiary)", margin: 0 }}>
                Format paysage large · min 750×288px · recadrage auto
              </p>
            </div>
          </Section>

          {/* Couleurs */}
          <Section label="Couleurs de la carte">

            {/* Fond */}
            <ColorRow
              label="Fond"
              value={bgColor}
              onChange={setBgColor}
              presets={[
                // Noirs & sombres
                "#0A0A0A","#1C1C1E","#2C2C2E","#1A1A2E",
                // Matcha & nature
                "#2D3A2D","#3A4A32","#4A6741","#5C7A52",
                // Terres & épices
                "#3A2A1C","#4A3020","#6B3A2A","#8B4513",
                // Bleus & marines
                "#0D1B2A","#1C2A3A","#1A2744","#0F2952",
                // Bordeaux & profonds
                "#2A1018","#3A1020","#4A1428","#2A0A1C",
                // Pastels épurés
                "#F5F0E8","#EDE8DC","#F0E8D4","#E8F0EC",
                // Matcha clair & sage
                "#D4E8D0","#C8DCC4","#B5C9A8","#A8C49A",
                // Rose poudré & blush
                "#F0D8D0","#E8CCC4","#D4B8B0","#C4A09A",
                // Lavande & lilas
                "#D8D0E8","#CCC4DC","#BEB4D0","#E8D8F0",
                // Crème & ivoire
                "#FAF8F5","#F8F4EC","#F2EDE4","#FFFFFF",
              ]}
            />

            {/* Texte */}
            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ fontSize: 11, color: "var(--fg-tertiary)" }}>Texte principal</span>
                <Toggle label="Auto" active={fgAuto} onToggle={() => setFgAuto(v => !v)}/>
              </div>
              {!fgAuto && (
                <ColorRow value={fgColor} onChange={setFgColor}
                  presets={[
                    "#FFFFFF","#F5F0E8","#EDE8DC","#0A0A0A",
                    "#4A6741","#C4958A","#8B7355","#BF5AF2",
                    "#FFD60A","#FF6B35","#00C896","#007AFF",
                  ]}
                />
              )}
              {fgAuto && (
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 22, height: 22, borderRadius: 6, background: effectiveFg, border: "1px solid var(--border)" }}/>
                  <span style={{ fontSize: 11, color: "var(--fg-tertiary)" }}>
                    {effectiveFg === "#FFFFFF" ? "Blanc" : "Noir"} — calculé depuis le fond
                  </span>
                </div>
              )}
            </div>

            {/* Labels */}
            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ fontSize: 11, color: "var(--fg-tertiary)" }}>Labels</span>
                <Toggle label="Auto" active={labelAuto} onToggle={() => setLabelAuto(v => !v)}/>
              </div>
              {!labelAuto && (
                <ColorRow value={labelColor} onChange={setLabelColor}
                  presets={[
                    "rgba(255,255,255,0.55)","rgba(255,255,255,0.38)","rgba(0,0,0,0.42)","rgba(0,0,0,0.28)",
                    "#7B9E5F","#C4958A","#8B7355","#9A8FA0",
                    "#FFD60A","#FF6B35","#00C896","#007AFF",
                  ]}
                />
              )}
              {labelAuto && (
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 22, height: 22, borderRadius: 6, background: effectiveLabel, border: "1px solid var(--border)" }}/>
                  <span style={{ fontSize: 11, color: "var(--fg-tertiary)" }}>
                    Automatique — {isDarkBg(bgColor) ? "blanc 55%" : "noir 42%"}
                  </span>
                </div>
              )}
            </div>
          </Section>

          {/* Infos */}
          <Section label="Informations">
            <Field label="Nom de l'établissement">
              <TextInput value={nom} onChange={setNom} placeholder="Café du Centre"/>
            </Field>
          </Section>

          {/* Labels des champs */}
          <Section label="Labels des champs">
            <p style={{ fontSize: 10, color: "var(--fg-tertiary)", margin: "-4px 0 4px" }}>
              Texte affiché au-dessus de chaque valeur — imposé en majuscules par Apple.
            </p>

            <Field label="Champ principal (tampons)">
              <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                {["Tampons","Points","Visites","Passages","Cafés","Soins","Séances"].map(v => (
                  <Chip key={v} label={v} active={primaryLabel === v} onClick={() => setPrimaryLabel(v)}/>
                ))}
              </div>
            </Field>

            <Field label="Récompense">
              <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                {["Récompense","Cadeau","Offre","Avantage","Bonus","Surprise"].map(v => (
                  <Chip key={v} label={v} active={rewardLabel === v} onClick={() => setRewardLabel(v)}/>
                ))}
              </div>
            </Field>

            <Field label="Membre">
              <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                {["Membre","Client","Titulaire","Fidèle","Nom"].map(v => (
                  <Chip key={v} label={v} active={memberLabel === v} onClick={() => setMemberLabel(v)}/>
                ))}
              </div>
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
                {[5,6,8,10,12,15,20].map(n => (
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

          {/* Note */}
          <div style={{ padding: "12px 14px", borderRadius: 12, background: "rgba(0,122,255,0.06)", border: "1px solid rgba(0,122,255,0.15)" }}>
            <p style={{ fontSize: 11, color: "var(--fg-secondary)", margin: 0, lineHeight: 1.6 }}>
              <strong style={{ color: "var(--accent)" }}>Génération .pkpass</strong><br/>
              Structure prête · En attente du certificat Apple Developer.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}

// ── Color helpers ─────────────────────────────────────

function isDarkBg(hex: string): boolean {
  if (!/^#[0-9a-f]{6}$/i.test(hex)) return true;
  const r = parseInt(hex.slice(1,3),16)/255;
  const g = parseInt(hex.slice(3,5),16)/255;
  const b = parseInt(hex.slice(5,7),16)/255;
  const lin = (c: number) => c <= 0.03928 ? c/12.92 : ((c+0.055)/1.055)**2.4;
  return 0.2126*lin(r)+0.7152*lin(g)+0.0722*lin(b) < 0.35;
}

function autoFg(bg: string): string {
  return isDarkBg(bg) ? "#FFFFFF" : "#000000";
}

function autoLabel(bg: string): string {
  return isDarkBg(bg) ? "rgba(255,255,255,0.55)" : "rgba(0,0,0,0.42)";
}

// ── Image helpers ─────────────────────────────────────

async function resizeImage(file: File, maxW: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const ratio = Math.min(maxW/img.width,1);
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width*ratio);
      canvas.height = Math.round(img.height*ratio);
      canvas.getContext("2d")!.drawImage(img,0,0,canvas.width,canvas.height);
      resolve(canvas.toDataURL("image/jpeg",0.85));
    };
    img.onerror = reject;
    img.src = url;
  });
}

async function cropResizeImage(file: File, targetW: number, targetH: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const targetRatio = targetW / targetH;
      const imgRatio = img.width / img.height;
      let sx=0, sy=0, sw=img.width, sh=img.height;
      if (imgRatio > targetRatio) {
        sw = Math.round(img.height * targetRatio);
        sx = Math.round((img.width - sw) / 2);
      } else {
        sh = Math.round(img.width / targetRatio);
        sy = Math.round((img.height - sh) / 2);
      }
      const canvas = document.createElement("canvas");
      canvas.width = targetW; canvas.height = targetH;
      canvas.getContext("2d")!.drawImage(img, sx, sy, sw, sh, 0, 0, targetW, targetH);
      resolve(canvas.toDataURL("image/jpeg", 0.88));
    };
    img.onerror = reject;
    img.src = url;
  });
}

// ── UI Components ─────────────────────────────────────

function ColorRow({ label, value, onChange, presets }: {
  label?: string; value: string; onChange: (v: string) => void; presets: string[];
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {label && <span style={{ fontSize: 11, color: "var(--fg-tertiary)" }}>{label}</span>}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <input type="color"
          value={/^#[0-9a-f]{6}$/i.test(value) ? value : "#000000"}
          onChange={e => onChange(e.target.value)}
          style={{ width: 36, height: 30, borderRadius: 8, border: "1px solid var(--border)", cursor: "pointer", padding: 2, background: "none" }}
        />
        <span style={{ fontSize: 11, fontWeight: 500, color: "var(--fg)", fontFamily: "monospace" }}>
          {/^#[0-9a-f]{6}$/i.test(value) ? value.toUpperCase() : value}
        </span>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
        {presets.map(c => (
          <button key={c} onClick={() => onChange(c)} style={{
            width: 22, height: 22, borderRadius: 6,
            background: c,
            border: value === c ? "2px solid var(--accent)" : "1px solid var(--border)",
            cursor: "pointer", padding: 0,
            boxShadow: (c === "#FFFFFF" || c === "#F2F2F7" || c === "#F5F5F5") ? "inset 0 0 0 1px rgba(0,0,0,0.08)" : undefined,
          }}/>
        ))}
      </div>
    </div>
  );
}

function Chip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{
      padding: "4px 10px", borderRadius: 20, fontSize: 11, fontWeight: active ? 600 : 400,
      background: active ? "var(--accent)" : "var(--glass-bg)",
      color: active ? "white" : "var(--fg-secondary)",
      border: `1px solid ${active ? "var(--accent)" : "var(--border)"}`,
      cursor: "pointer",
    }}>
      {label}
    </button>
  );
}

function Toggle({ label, active, onToggle }: { label: string; active: boolean; onToggle: () => void }) {
  return (
    <button onClick={onToggle} style={{
      display: "flex", alignItems: "center", gap: 5,
      padding: "3px 8px", borderRadius: 20, fontSize: 10, fontWeight: 600,
      background: active ? "rgba(0,122,255,0.1)" : "var(--glass-bg)",
      border: `1px solid ${active ? "rgba(0,122,255,0.3)" : "var(--border)"}`,
      color: active ? "var(--accent)" : "var(--fg-tertiary)",
      cursor: "pointer",
    }}>
      <div style={{
        width: 8, height: 8, borderRadius: "50%",
        background: active ? "var(--accent)" : "var(--fg-tertiary)",
      }}/>
      {label}
    </button>
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
    <input type="text" value={value} placeholder={placeholder}
      onChange={e => onChange(e.target.value)}
      style={{ width: "100%", padding: "8px 12px", borderRadius: 10, fontSize: 13, background: "var(--glass-bg)", border: "1px solid var(--border)", color: "var(--fg)", outline: "none", boxSizing: "border-box" }}
      onFocus={e => (e.target.style.borderColor = "var(--accent)")}
      onBlur={e => (e.target.style.borderColor = "var(--border)")}
    />
  );
}

function CameraIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--fg-tertiary)" strokeWidth="1.5" strokeLinecap="round">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/>
    </svg>
  );
}
