"use client";

import { useAuth } from "@/lib/auth-context";
import { useState } from "react";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import AppleWalletCard from "@/components/AppleWalletCard";
import GoogleWalletCard from "@/components/GoogleWalletCard";

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
  // Strip editor
  const [stripFrom, setStripFrom] = useState<string>("");
  const [stripTo, setStripTo]   = useState<string>("");
  const [stripAngle, setStripAngle] = useState<number>(135);
  const [stripText, setStripText]   = useState<string>("");
  const [stripTextSize, setStripTextSize] = useState<"s"|"m"|"l">("m");
  const [stripTextColor, setStripTextColor] = useState<string>("#FFFFFF");
  const [stripTextPos, setStripTextPos] = useState<"bl"|"bc"|"br"|"c">("bl");
  const [stripTextFont, setStripTextFont] = useState<"sans"|"serif"|"mono">("sans");

  const [primaryLabel, setPrimaryLabel] = useState<string>((marchand?.apple_primary_label as string) || "Tampons");
  const [rewardLabel, setRewardLabel] = useState<string>((marchand?.apple_reward_label as string) || "Récompense");
  const [memberLabel, setMemberLabel] = useState<string>((marchand?.apple_member_label as string) || "Membre");
  const [description, setDescription] = useState<string>((marchand?.apple_description as string) || "");
  const [backInfo, setBackInfo] = useState<string>((marchand?.apple_back_info as string) || "");

  // Preview mode
  const [previewMode, setPreviewMode] = useState<"full" | "compact" | "back">("full");
  // Wallet type
  const [walletType, setWalletType] = useState<"apple" | "google">("apple");

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingStrip, setUploadingStrip] = useState(false);

  if (!marchand || !user) return null;

  const stampsCurrent = Math.round(objectif * 0.6);

  // Couleurs effectives (auto ou manuelles)
  const effectiveFg = fgAuto ? autoFg(bgColor) : fgColor;
  const effectiveLabel = labelAuto ? autoLabel(bgColor) : labelColor;

  // Vérificateur de contraste WCAG
  const contrastRatioValue = contrastRatio(effectiveFg, bgColor);
  const contrastLevel: "ok" | "weak" | "fail" =
    contrastRatioValue >= 4.5 ? "ok" : contrastRatioValue >= 3 ? "weak" : "fail";

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
      apple_description: description,
      apple_back_info: backInfo,
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

  function handleDownloadBanner() {
    const dark = isDarkBg(bgColor);
    const lightColor = dark ? lightenDarken(bgColor, 38) : lightenDarken(bgColor, -38);
    const strip = buildStrip(lightColor, bgColor, 160);
    downloadStrip(strip, `wallio-banner-${nom || "carte"}.jpg`);
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

          {/* Toggle Apple / Google Wallet */}
          <div style={{ display: "flex", gap: 6, background: "var(--glass-bg)", border: "1px solid var(--border)", borderRadius: 14, padding: 4 }}>
            {(["apple", "google"] as const).map(wt => (
              <button key={wt} onClick={() => setWalletType(wt)} style={{
                padding: "6px 16px", borderRadius: 10, fontSize: 12, fontWeight: 600,
                background: walletType === wt ? "var(--accent)" : "transparent",
                color: walletType === wt ? "white" : "var(--fg-tertiary)",
                border: "none", cursor: "pointer", transition: "all 0.15s",
              }}>
                {wt === "apple" ? "Apple Wallet" : "Google Wallet"}
              </button>
            ))}
          </div>

          <div style={{
            padding: "5px 16px", background: "var(--glass-bg)",
            border: "1px solid var(--border)", borderRadius: 20,
          }}>
            <p style={{ fontSize: 11, color: "var(--fg-tertiary)", letterSpacing: "0.04em" }}>
              Aperçu fidèle · iPhone · {walletType === "apple" ? "Apple Wallet" : "Google Wallet"}
            </p>
          </div>

          {/* Boutons de mode (Apple uniquement) */}
          {walletType === "apple" && (
            <div style={{ display: "flex", gap: 6 }}>
              {([
                { key: "full", label: "Complète" },
                { key: "compact", label: "Liste" },
                { key: "back", label: "Dos" },
              ] as const).map(({ key, label }) => (
                <button key={key} onClick={() => setPreviewMode(key)} style={{
                  padding: "6px 14px", borderRadius: 20, fontSize: 11, fontWeight: 600,
                  background: previewMode === key ? "var(--accent)" : "var(--glass-bg)",
                  color: previewMode === key ? "white" : "var(--fg-secondary)",
                  border: `1px solid ${previewMode === key ? "var(--accent)" : "var(--border)"}`,
                  cursor: "pointer",
                }}>
                  {key === "full" ? "📱 " : key === "compact" ? "☰ " : "↩ "}{label}
                </button>
              ))}
            </div>
          )}

          {walletType === "apple" ? (
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
              previewUid={user.uid}
              mode={previewMode}
              backInfo={backInfo}
              description={description}
            />
          ) : (
            <GoogleWalletCard
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
              previewUid={user.uid}
            />
          )}

          <p style={{ fontSize: 11, color: "var(--fg-tertiary)", textAlign: "center", maxWidth: 340 }}>
            Bannière libre · Couleurs personnalisables · Structure imposée par {walletType === "apple" ? "Apple" : "Google"}
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

          {/* Éditeur bannière dégradée */}
          <Section label="Éditeur bannière">

            {/* Thèmes */}
            <p style={{ fontSize: 10, color: "var(--fg-tertiary)", margin: "-4px 0 6px" }}>
              Choisir un thème dégradé
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
              {GRADIENT_THEMES.map(t => (
                <button key={t.name} title={t.name} onClick={() => {
                  const angle = t.angle ?? 135;
                  setStripFrom(t.from); setStripTo(t.to); setStripAngle(angle);
                  setBgColor(t.bg);
                  const strip = buildStrip(t.from, t.to, angle, stripText, stripTextColor, stripTextSize, stripTextPos, stripTextFont);
                  setStripUrl(strip);
                  updateDoc(doc(db, "marchands", user!.uid), { strip_url: strip, apple_bg_color: t.bg });
                }} style={{
                  width: 40, height: 26, borderRadius: 7, padding: 0, cursor: "pointer",
                  background: `linear-gradient(${t.angle ?? 135}deg, ${t.from}, ${t.to})`,
                  border: stripFrom === t.from && stripTo === t.to ? "2px solid var(--accent)" : "1px solid rgba(128,128,128,0.2)",
                  boxShadow: "0 2px 6px rgba(0,0,0,0.18)",
                  flexShrink: 0,
                }}/>
              ))}
            </div>

            {/* Texte sur la bannière */}
            <Field label="Texte sur la bannière">
              <TextInput value={stripText} onChange={setStripText} placeholder="Nom, slogan, accroche…"/>
            </Field>

            {stripText && (
              <>
                {/* Taille */}
                <Field label="Taille du texte">
                  <div style={{ display: "flex", gap: 6 }}>
                    {(["s","m","l"] as const).map(s => (
                      <button key={s} onClick={() => setStripTextSize(s)} style={{
                        flex: 1, padding: "6px 0", borderRadius: 10, fontSize: 12, fontWeight: 600,
                        background: stripTextSize === s ? "var(--accent)" : "var(--glass-bg)",
                        color: stripTextSize === s ? "white" : "var(--fg-secondary)",
                        border: `1px solid ${stripTextSize === s ? "var(--accent)" : "var(--border)"}`,
                        cursor: "pointer",
                      }}>
                        {s === "s" ? "Petit" : s === "m" ? "Moyen" : "Grand"}
                      </button>
                    ))}
                  </div>
                </Field>

                {/* Police */}
                <Field label="Police">
                  <div style={{ display: "flex", gap: 6 }}>
                    {(["sans", "serif", "mono"] as const).map(f => (
                      <button key={f} onClick={() => setStripTextFont(f)} style={{
                        flex: 1, padding: "6px 0", borderRadius: 10, fontSize: 11, fontWeight: 600,
                        background: stripTextFont === f ? "var(--accent)" : "var(--glass-bg)",
                        color: stripTextFont === f ? "white" : "var(--fg-secondary)",
                        border: `1px solid ${stripTextFont === f ? "var(--accent)" : "var(--border)"}`,
                        cursor: "pointer",
                        fontFamily: f === "sans" ? "sans-serif" : f === "serif" ? "serif" : "monospace",
                      }}>
                        {f === "sans" ? "Sans" : f === "serif" ? "Serif" : "Mono"}
                      </button>
                    ))}
                  </div>
                </Field>

                {/* Couleur texte */}
                <Field label="Couleur du texte">
                  <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    {["#FFFFFF","#000000","#F5F0E8","#FFD60A","#00F5A0"].map(c => (
                      <button key={c} onClick={() => setStripTextColor(c)} style={{
                        width: 28, height: 28, borderRadius: 8, background: c, padding: 0, cursor: "pointer",
                        border: stripTextColor === c ? "2px solid var(--accent)" : "1px solid var(--border)",
                        boxShadow: c === "#FFFFFF" ? "inset 0 0 0 1px rgba(0,0,0,0.1)" : undefined,
                      }}/>
                    ))}
                    <input type="color" value={/^#[0-9a-f]{6}$/i.test(stripTextColor) ? stripTextColor : "#ffffff"}
                      onChange={e => setStripTextColor(e.target.value)}
                      style={{ width: 28, height: 28, borderRadius: 8, border: "1px solid var(--border)", cursor: "pointer", padding: 2 }}
                    />
                  </div>
                </Field>

                {/* Position */}
                <Field label="Position du texte">
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 5 }}>
                    {([
                      { k: "bl", label: "↙ Bas gauche" },
                      { k: "bc", label: "↓ Bas centre" },
                      { k: "br", label: "↘ Bas droite" },
                      { k: "c",  label: "⊕ Centré" },
                    ] as const).map(({ k, label }) => (
                      <button key={k} onClick={() => setStripTextPos(k)} style={{
                        padding: "5px 3px", borderRadius: 8, fontSize: 10, fontWeight: stripTextPos === k ? 600 : 400,
                        background: stripTextPos === k ? "var(--accent)" : "var(--glass-bg)",
                        color: stripTextPos === k ? "white" : "var(--fg-secondary)",
                        border: `1px solid ${stripTextPos === k ? "var(--accent)" : "var(--border)"}`,
                        cursor: "pointer",
                      }}>{label}</button>
                    ))}
                  </div>
                </Field>
              </>
            )}

            {/* Actions */}
            {(stripFrom || stripUrl) && (
              <div style={{ display: "flex", gap: 8 }}>
                {stripFrom && (
                  <button onClick={() => {
                    const strip = buildStrip(stripFrom, stripTo, stripAngle, stripText, stripTextColor, stripTextSize, stripTextPos, stripTextFont);
                    setStripUrl(strip);
                    updateDoc(doc(db, "marchands", user!.uid), { strip_url: strip });
                  }} style={{
                    flex: 1, padding: "8px 0", borderRadius: 10, fontSize: 12, fontWeight: 600,
                    background: "var(--glass-bg)", border: "1px solid var(--border)",
                    color: "var(--fg)", cursor: "pointer",
                  }}>
                    ↺ Régénérer
                  </button>
                )}
                {stripUrl && (
                  <button onClick={() => downloadStrip(stripUrl, `wallio-strip-${nom || "carte"}.jpg`)} style={{
                    flex: 1, padding: "8px 0", borderRadius: 10, fontSize: 12, fontWeight: 600,
                    background: "var(--glass-bg)", border: "1px solid var(--border)",
                    color: "var(--fg)", cursor: "pointer",
                  }}>
                    ⬇ Télécharger
                  </button>
                )}
              </div>
            )}
          </Section>

          {/* Couleurs */}
          <Section label="Couleurs de la carte">

            {/* Fond */}
            <ColorRow
              label="Fond"
              value={bgColor}
              onChange={setBgColor}
              presets={[
                "#0A0A0A","#1C1C1E","#2C2C2E","#3A3A3C",
                "#1A1A2E","#16213E","#0F3460","#1B262C",
                "#2D3A2D","#3A4A32","#1A2E1A","#0D2B1A",
                "#3A2A1C","#4A3020","#2E1A0E","#1C0E05",
                "#2A1018","#3A1020","#4A0E28","#2E0A20",
                "#1C1C3A","#2A2050","#1A0E3A","#0E0A2E",
                "#F5F0E8","#EDE8DC","#FAF8F5","#FFFFFF",
                "#F0EBE3","#E8E0D5","#DDD5C8","#D4CBBC",
                "#D4E8D0","#C8DCC4","#E8F4E4","#F0F8EC",
                "#F0D8D0","#E8CCC4","#F8EAE5","#FFF0EB",
                "#D8D0E8","#CCC4DC","#EDE8F8","#F5F0FF",
                "#D4E4F0","#C4D8EC","#E4EFF8","#EDF5FF",
                "#F8F4E8","#F4EDD8","#FFF8E8","#FFFBF0",
                "#E8F0F4","#D8E8F0","#C8DCE8","#B8D0E0",
              ]}
            />

            {/* Bouton téléchargement bannière depuis palette */}
            <button
              onClick={handleDownloadBanner}
              style={{
                width: "100%", padding: "8px 0", borderRadius: 10, fontSize: 12, fontWeight: 600,
                background: "var(--glass-bg)", border: "1px solid var(--border)",
                color: "var(--fg)", cursor: "pointer", display: "flex",
                alignItems: "center", justifyContent: "center", gap: 6,
              }}
            >
              <span>⬇</span>
              <span>Télécharger bannière</span>
              <span style={{
                display: "inline-block", width: 14, height: 14, borderRadius: 4,
                background: bgColor, border: "1px solid var(--border)",
                verticalAlign: "middle",
              }}/>
            </button>

            {/* Vérificateur de contraste */}
            <div style={{
              display: "flex", alignItems: "center", gap: 8, padding: "8px 12px",
              borderRadius: 10, fontSize: 11, fontWeight: 500,
              background: contrastLevel === "fail"
                ? "rgba(255,59,48,0.08)"
                : contrastLevel === "weak"
                ? "rgba(255,159,10,0.08)"
                : "rgba(52,199,89,0.08)",
              border: `1px solid ${
                contrastLevel === "fail"
                  ? "rgba(255,59,48,0.25)"
                  : contrastLevel === "weak"
                  ? "rgba(255,159,10,0.25)"
                  : "rgba(52,199,89,0.25)"
              }`,
            }}>
              <div style={{
                width: 8, height: 8, borderRadius: "50%", flexShrink: 0,
                background: contrastLevel === "fail" ? "#FF3B30" : contrastLevel === "weak" ? "#FF9F0A" : "#34C759",
              }}/>
              <span style={{
                color: contrastLevel === "fail" ? "#FF3B30" : contrastLevel === "weak" ? "#FF9F0A" : "#34C759",
              }}>
                {contrastLevel === "fail"
                  ? "Contraste insuffisant"
                  : contrastLevel === "weak"
                  ? "Contraste faible"
                  : "Contraste OK"}
              </span>
              <span style={{ color: "var(--fg-tertiary)", marginLeft: "auto" }}>
                {contrastRatioValue.toFixed(2)}:1
              </span>
            </div>

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

            <LabelField
              label="Champ principal"
              value={primaryLabel}
              onChange={setPrimaryLabel}
              suggestions={["Tampons","Points","Visites","Cafés","Soins","Séances","Passages"]}
            />
            <LabelField
              label="Récompense"
              value={rewardLabel}
              onChange={setRewardLabel}
              suggestions={["Récompense","Cadeau","Offre","Avantage","Bonus","Surprise"]}
            />
            <LabelField
              label="Membre"
              value={memberLabel}
              onChange={setMemberLabel}
              suggestions={["Membre","Client","Titulaire","Fidèle","Abonné","Nom"]}
            />
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

          {/* Dos de la carte */}
          <Section label="Dos de la carte">
            <p style={{ fontSize: 10, color: "var(--fg-tertiary)", margin: "-4px 0 4px" }}>
              Visible quand le client retourne sa carte dans Wallet.
            </p>
            <Field label="Description (nom dans la liste Wallet)">
              <TextInput value={description} onChange={setDescription} placeholder={`Fidélité ${nom || "Établissement"}`}/>
            </Field>
            <Field label="Message / infos (dos de carte)">
              <textarea
                value={backInfo}
                onChange={e => setBackInfo(e.target.value)}
                placeholder="Présentez votre carte à chaque visite pour gagner vos tampons. Valable dans tous nos établissements."
                rows={3}
                style={{
                  width: "100%", padding: "8px 12px", borderRadius: 10, fontSize: 12,
                  background: "var(--glass-bg)", border: "1px solid var(--border)",
                  color: "var(--fg)", outline: "none", resize: "vertical",
                  fontFamily: "inherit", lineHeight: 1.5, boxSizing: "border-box",
                }}
                onFocus={e => (e.target.style.borderColor = "var(--accent)")}
                onBlur={e => (e.target.style.borderColor = "var(--border)")}
              />
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

// ── Gradient themes ──────────────────────────────────

const GRADIENT_THEMES = [
  { name: "Minuit",      from: "#1A1A2E", to: "#0A0A0A",   bg: "#0A0A0A",   angle: 160 },
  { name: "Cosmos",      from: "#2A1654", to: "#0A0A1A",   bg: "#0A0A1A",   angle: 135 },
  { name: "Océan nuit",  from: "#0F3460", to: "#0A0A1A",   bg: "#0A0A1A",   angle: 145 },
  { name: "Forêt",       from: "#1A3A1A", to: "#0A1A0A",   bg: "#0A1A0A",   angle: 150 },
  { name: "Matcha",      from: "#4A6741", to: "#2D3A2D",   bg: "#2D3A2D",   angle: 135 },
  { name: "Espresso",    from: "#4A3020", to: "#1C0E05",   bg: "#1C0E05",   angle: 140 },
  { name: "Bordeaux",    from: "#6B1A30", to: "#2A0A14",   bg: "#2A0A14",   angle: 135 },
  { name: "Prune",       from: "#4A1A6B", to: "#1A0A2E",   bg: "#1A0A2E",   angle: 135 },
  { name: "Aurore",      from: "#6B2A4A", to: "#2A0A1A",   bg: "#2A0A1A",   angle: 125 },
  { name: "Ardoise",     from: "#3A4A5A", to: "#1A2A3A",   bg: "#1A2A3A",   angle: 155 },
  { name: "Ivoire",      from: "#FFFFFF", to: "#F0EBE3",   bg: "#F0EBE3",   angle: 160 },
  { name: "Crème",       from: "#FFFBF0", to: "#F4EDD8",   bg: "#F4EDD8",   angle: 135 },
  { name: "Blush",       from: "#FFE8E0", to: "#F0D8D0",   bg: "#F0D8D0",   angle: 135 },
  { name: "Sage clair",  from: "#E8F4E4", to: "#D4E8D0",   bg: "#D4E8D0",   angle: 145 },
  { name: "Lavande",     from: "#EDE8F8", to: "#D8D0E8",   bg: "#D8D0E8",   angle: 135 },
  { name: "Ciel",        from: "#EDF5FF", to: "#D4E4F0",   bg: "#D4E4F0",   angle: 150 },
];

function buildStrip(
  from: string, to: string, angle: number,
  text = "", textColor = "#FFFFFF",
  textSize: "s"|"m"|"l" = "m",
  textPos: "bl"|"bc"|"br"|"c" = "bl",
  font: "sans"|"serif"|"mono" = "sans",
): string {
  const W = 750, H = 288;
  const canvas = document.createElement("canvas");
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  // Dégradé
  const rad = (angle * Math.PI) / 180;
  const cx = W / 2, cy = H / 2;
  const grad = ctx.createLinearGradient(
    cx - Math.cos(rad) * W / 2, cy - Math.sin(rad) * H / 2,
    cx + Math.cos(rad) * W / 2, cy + Math.sin(rad) * H / 2,
  );
  grad.addColorStop(0, from);
  grad.addColorStop(1, to);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // Texte
  if (text) {
    const sz = textSize === "s" ? 36 : textSize === "m" ? 54 : 76;
    const fontFamily =
      font === "serif" ? `Georgia, "Times New Roman", serif`
      : font === "mono" ? `"Courier New", Courier, monospace`
      : `-apple-system, "Helvetica Neue", sans-serif`;
    ctx.font = `700 ${sz}px ${fontFamily}`;
    ctx.fillStyle = textColor;
    const pad = 44;
    const align = textPos === "bc" ? "center" : textPos === "br" ? "right" : "left";
    ctx.textAlign = align;
    const x = textPos === "bl" ? pad : textPos === "bc" ? W / 2 : textPos === "br" ? W - pad : W / 2;
    const y = textPos === "c" ? H / 2 + sz * 0.35 : H - pad;
    ctx.fillText(text, x, y);
  }

  return canvas.toDataURL("image/jpeg", 0.92);
}

function downloadStrip(dataUrl: string, filename: string) {
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = filename;
  a.click();
}

// Keep for potential future use
function generateGradientStrip(from: string, to: string, angle: number): string {
  return buildStrip(from, to, angle);
}
// Suppress unused warning at module level
void generateGradientStrip;

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

function relativeLuminance(hex: string): number {
  if (!/^#[0-9a-f]{6}$/i.test(hex)) return 0;
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const lin = (c: number) => c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

function contrastRatio(hex1: string, hex2: string): number {
  const L1 = relativeLuminance(hex1);
  const L2 = relativeLuminance(hex2);
  const lighter = Math.max(L1, L2);
  const darker = Math.min(L1, L2);
  return (lighter + 0.05) / (darker + 0.05);
}

function lightenDarken(hex: string, amount: number): string {
  if (!/^#[0-9a-f]{6}$/i.test(hex)) return hex;
  const r = Math.min(255, Math.max(0, parseInt(hex.slice(1, 3), 16) + amount));
  const g = Math.min(255, Math.max(0, parseInt(hex.slice(3, 5), 16) + amount));
  const b = Math.min(255, Math.max(0, parseInt(hex.slice(5, 7), 16) + amount));
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
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

function LabelField({ label, value, onChange, suggestions }: {
  label: string; value: string; onChange: (v: string) => void; suggestions: string[];
}) {
  return (
    <div>
      <p style={{ fontSize: 11, color: "var(--fg-tertiary)", marginBottom: 6 }}>{label}</p>
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={`Ex: ${suggestions[0]}, ${suggestions[1]}…`}
        style={{
          width: "100%", padding: "9px 12px", borderRadius: 10, fontSize: 13,
          background: "var(--glass-bg)", border: "1.5px solid var(--accent)",
          color: "var(--fg)", outline: "none", boxSizing: "border-box",
          fontWeight: 500,
        }}
      />
      <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginTop: 7 }}>
        <span style={{ fontSize: 10, color: "var(--fg-tertiary)", alignSelf: "center", marginRight: 2 }}>
          Suggestions :
        </span>
        {suggestions.map(v => (
          <Chip key={v} label={v} active={value === v} onClick={() => onChange(v)}/>
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
