"use client";

import { useAuth } from "@/lib/auth-context";
import { useState, useEffect, useRef, useCallback } from "react";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { ref as storageRef, uploadString, getDownloadURL } from "firebase/storage";
import { db, storage } from "@/lib/firebase";
import AppleWalletCard, { type StampStyle, type MilestoneReward } from "@/components/AppleWalletCard";
import GoogleWalletCard from "@/components/GoogleWalletCard";
import { drawChevaleret, drawComptoir, type Template as ComptoirTemplate, type Format as ComptoirFormat } from "@/lib/carte-comptoir-draw";

// ── History snapshot ──────────────────────────────────
interface Snapshot {
  bgColor: string;
  stripUrl: string;
  stripFrom: string;
  stripTo: string;
  stripAngle: number;
  logoUrl: string;
  nom: string;
  recompense: string;
  primaryLabel: string;
  rewardLabel: string;
  memberLabel: string;
  fgColor: string;
  labelColor: string;
}


export default function CartePage() {
  const { user, marchand } = useAuth();

  const [nom, setNom] = useState<string>((marchand?.nom as string) || "");
  const [logoUrl, setLogoUrl] = useState<string>((marchand?.logo_url as string) || "");
  const [stripUrl, setStripUrl] = useState<string>((marchand?.strip_url as string) || "");
  const [recompense, setRecompense] = useState<string>((marchand?.nom_recompense as string) || "");
  const [objectif, setObjectif] = useState<number>((marchand?.objectif_tampons as number) || 10);
  const couleurPrincipale = (marchand as Record<string, unknown>).couleur_principale as string || "#007AFF";

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

  // Feature 5 — texte 2 lignes bannière
  const [stripText2, setStripText2] = useState<string>("");
  const [stripText2Size, setStripText2Size] = useState<"s"|"m"|"l">("s");

  // Feature 4 — logo dans la bannière
  const [stripIncludeLogo, setStripIncludeLogo] = useState<boolean>(false);

  // Tampons sur la bannière
  const [stampsOnStrip, setStampsOnStrip] = useState<boolean>((marchand as Record<string, unknown>).apple_stamps_on_strip === true);
  const [stripStampStyle, setStripStampStyle] = useState<StampStyle>(
    ((marchand as Record<string, unknown>).apple_strip_stamp_style as StampStyle) || "dot"
  );
  const [stampText, setStampText] = useState<string>((marchand as Record<string, unknown>).apple_stamp_text as string || "");
  const [stampTextBold, setStampTextBold] = useState<boolean>((marchand as Record<string, unknown>).apple_stamp_text_bold === true);
  const [stampTextItalic, setStampTextItalic] = useState<boolean>((marchand as Record<string, unknown>).apple_stamp_text_italic === true);
  const [stampTextSize, setStampTextSize] = useState<number>(((marchand as Record<string, unknown>).apple_stamp_text_size as number) || 1);
  const [stampColor, setStampColor] = useState<string>((marchand as Record<string, unknown>).apple_stamp_color as string || "#FFFFFF");
  const [stampPosition, setStampPosition] = useState<"top"|"center"|"bottom">(((marchand as Record<string, unknown>).apple_stamp_position as "top"|"center"|"bottom") || "center");
  const [stampSizePreset, setStampSizePreset] = useState<"s"|"m"|"l">(((marchand as Record<string, unknown>).apple_stamp_size as "s"|"m"|"l") || "m");
  const [stampThickness, setStampThickness] = useState<number>(((marchand as Record<string, unknown>).apple_stamp_thickness as number) ?? 2);
  const [stampLogoOpacity, setStampLogoOpacity] = useState<number>(((marchand as Record<string, unknown>).apple_stamp_logo_opacity as number) ?? 1);
  const [milestoneRewards, setMilestoneRewards] = useState<MilestoneReward[]>(((marchand as Record<string, unknown>).apple_milestone_rewards as MilestoneReward[]) || []);
  const [newRewardLabel, setNewRewardLabel] = useState("");
  const [newRewardAt, setNewRewardAt] = useState<number>(objectif);

  // Feature 6 — cadrage image uploadée
  const [rawStripUrl, setRawStripUrl] = useState<string>("");
  const [cropY, setCropY] = useState<number>(50);
  const [isUploadedStrip, setIsUploadedStrip] = useState<boolean>(false);

  const [primaryLabel, setPrimaryLabel] = useState<string>((marchand?.apple_primary_label as string) || "Tampons");
  const [rewardLabel, setRewardLabel] = useState<string>((marchand?.apple_reward_label as string) || "Récompense");
  const [memberLabel, setMemberLabel] = useState<string>((marchand?.apple_member_label as string) || "Membre");
  const [description, setDescription] = useState<string>((marchand?.apple_description as string) || "");
  const [backInfo, setBackInfo] = useState<string>((marchand?.apple_back_info as string) || "");

  // Header field (haut droite Apple Wallet)
  const [headerLabel, setHeaderLabel] = useState<string>((marchand?.apple_header_label as string) || "");
  const [headerValue, setHeaderValue] = useState<string>((marchand?.apple_header_value as string) || "");

  // Auxiliary fields (entre secondary et barcode)
  const [aux1Label, setAux1Label] = useState<string>((marchand?.apple_aux1_label as string) || "");
  const [aux1Value, setAux1Value] = useState<string>((marchand?.apple_aux1_value as string) || "");
  const [aux2Label, setAux2Label] = useState<string>((marchand?.apple_aux2_label as string) || "");
  const [aux2Value, setAux2Value] = useState<string>((marchand?.apple_aux2_value as string) || "");

  // Icône notification (29×29px — affiché dans les pushs)
  const [iconUrl, setIconUrl] = useState<string>((marchand?.apple_icon_url as string) || "");
  const [uploadingIcon, setUploadingIcon] = useState(false);

  // Preview mode
  const [previewMode, setPreviewMode] = useState<"full" | "compact" | "back">("full");
  // Wallet type
  const [walletType, setWalletType] = useState<"apple" | "google">("apple");
  // Google Wallet labels
  const [googlePrimaryLabel, setGooglePrimaryLabel] = useState<string>((marchand as Record<string, unknown>).google_primary_label as string || "Tampons");
  const [googleSecondaryLabel, setGoogleSecondaryLabel] = useState<string>((marchand as Record<string, unknown>).google_secondary_label as string || "Objectif");

  // Feature 7 — preview états tampons
  const [previewFill, setPreviewFill] = useState<number>(0.5);

  const stampsCurrent = Math.round(objectif * previewFill);

  // Feature 3 — undo history
  const historyRef = useRef<Snapshot[]>([]);
  const historyIndexRef = useRef<number>(-1);
  const comptoirCanvasRef = useRef<HTMLCanvasElement>(null);
  const [canUndo, setCanUndo] = useState<boolean>(false);

  function makeSnapshot(): Snapshot {
    return { bgColor, stripUrl, stripFrom, stripTo, stripAngle, logoUrl, nom, recompense, primaryLabel, rewardLabel, memberLabel, fgColor, labelColor };
  }

  function pushHistory() {
    const snap = makeSnapshot();
    const newHistory = historyRef.current.slice(0, historyIndexRef.current + 1);
    newHistory.push(snap);
    if (newHistory.length > 20) newHistory.shift();
    historyRef.current = newHistory;
    historyIndexRef.current = newHistory.length - 1;
    setCanUndo(historyIndexRef.current > 0);
  }

  function undo() {
    if (historyIndexRef.current <= 0) return;
    historyIndexRef.current -= 1;
    const snap = historyRef.current[historyIndexRef.current];
    setBgColor(snap.bgColor);
    setStripUrl(snap.stripUrl);
    setStripFrom(snap.stripFrom);
    setStripTo(snap.stripTo);
    setStripAngle(snap.stripAngle);
    setLogoUrl(snap.logoUrl);
    setNom(snap.nom);
    setRecompense(snap.recompense);
    setPrimaryLabel(snap.primaryLabel);
    setRewardLabel(snap.rewardLabel);
    setMemberLabel(snap.memberLabel);
    setFgColor(snap.fgColor);
    setLabelColor(snap.labelColor);
    setCanUndo(historyIndexRef.current > 0);
  }

  // Feature 6 — recrop from rawStripUrl
  const applyCrop = useCallback(async (rawUrl: string, y: number): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const targetW = 750, targetH = 288;
        const targetRatio = targetW / targetH;
        const imgRatio = img.width / img.height;
        let sw = img.width, sh = img.height;
        let sx = 0, sy = 0;
        if (imgRatio > targetRatio) {
          sw = Math.round(img.height * targetRatio);
          sx = Math.round((img.width - sw) / 2);
          sy = 0;
        } else {
          sh = Math.round(img.width / targetRatio);
          // sy controlled by cropY 0=top 100=bottom
          sy = Math.round((img.height - sh) * y / 100);
        }
        const canvas = document.createElement("canvas");
        canvas.width = targetW; canvas.height = targetH;
        canvas.getContext("2d")!.drawImage(img, sx, sy, sw, sh, 0, 0, targetW, targetH);
        resolve(canvas.toDataURL("image/jpeg", 0.88));
      };
      img.onerror = reject;
      img.src = rawUrl;
    });
  }, []);

  // Regen when cropY changes on uploaded strip
  useEffect(() => {
    if (!rawStripUrl || !isUploadedStrip) return;
    applyCrop(rawStripUrl, cropY).then(url => setStripUrl(url)).catch(() => {});
  }, [cropY, rawStripUrl, isUploadedStrip, applyCrop]);

  // Auto-regen strip when text or options change (gradient active only)
  useEffect(() => {
    if (!stripFrom) return;
    buildStrip(
      stripFrom, stripTo, stripAngle,
      stripText, stripTextColor, stripTextSize, stripTextPos, stripTextFont,
      stripText2, stripText2Size,
      stripIncludeLogo ? logoUrl : undefined
    ).then(strip => setStripUrl(strip)).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stripText, stripTextSize, stripTextColor, stripTextPos, stripTextFont, stripText2, stripText2Size, stripIncludeLogo, logoUrl]);

  // Carte comptoir
  const [comptoirFormat, setComptoirFormat] = useState<ComptoirFormat>("comptoir");
  const [comptoirTemplate, setComptoirTemplate] = useState<ComptoirTemplate>("dark");
  const [comptoirShowQR, setComptoirShowQR] = useState(true);
  const [comptoirDownloading, setComptoirDownloading] = useState(false);
  const [comptoirBgUrl, setComptoirBgUrl] = useState<string>(
    ((marchand as Record<string, unknown>)?.comptoir_bg_url as string) || ""
  );
  const [uploadingComptoirBg, setUploadingComptoirBg] = useState(false);

  // Preview carte comptoir live (sans QR pour la vitesse)
  useEffect(() => {
    const canvas = comptoirCanvasRef.current;
    if (!canvas || !marchand) return;
    const couleurP = (marchand as Record<string, unknown>).couleur_principale as string || "#0A0A0A";
    const couleurS = (marchand as Record<string, unknown>).couleur_secondaire as string || "#1A1A1A";
    const nfcId = (marchand as Record<string, unknown>).nfc_id as string | undefined;
    const fn = comptoirFormat === "chevaleret" ? drawChevaleret : drawComptoir;
    fn(canvas, couleurP, couleurS, nom, nfcId, comptoirTemplate, 1, false, comptoirBgUrl || undefined).catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [comptoirFormat, comptoirTemplate, comptoirBgUrl, nom, marchand]);

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingStrip, setUploadingStrip] = useState(false);
  const [uploadingGoogleHero, setUploadingGoogleHero] = useState(false);
  const [googleBgColor, setGoogleBgColor] = useState<string>((marchand as Record<string, unknown>).google_bg_color as string || couleurPrincipale || "#007AFF");
  const [googleHeroUrl, setGoogleHeroUrl] = useState<string>((marchand as Record<string, unknown>).google_hero_url as string || "");
  // Verrouillage : true si la carte a déjà été sauvegardée au moins une fois
  const [locked, setLocked] = useState(!!(marchand as Record<string, unknown>)?.apple_bg_color);


  if (!marchand || !user) return null;

  // Couleurs effectives (auto ou manuelles)
  const effectiveFg = fgAuto ? autoFg(bgColor) : fgColor;
  const effectiveLabel = labelAuto ? autoLabel(bgColor) : labelColor;

  // Vérificateur de contraste WCAG
  const contrastRatioValue = contrastRatio(effectiveFg, bgColor);
  const contrastLevel: "ok" | "weak" | "fail" =
    contrastRatioValue >= 4.5 ? "ok" : contrastRatioValue >= 3 ? "weak" : "fail";

  // Feature 8 — upload to Firebase Storage
  async function uploadToStorage(dataUrl: string, path: string): Promise<string> {
    const sRef = storageRef(storage, path);
    await uploadString(sRef, dataUrl, "data_url");
    return getDownloadURL(sRef);
  }

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
      apple_header_label: headerLabel,
      apple_header_value: headerValue,
      apple_aux1_label: aux1Label,
      apple_aux1_value: aux1Value,
      apple_aux2_label: aux2Label,
      apple_aux2_value: aux2Value,
      apple_icon_url: iconUrl,
      apple_stamps_on_strip: stampsOnStrip,
      apple_strip_stamp_style: stripStampStyle,
      apple_stamp_text: stampText,
      apple_stamp_text_bold: stampTextBold,
      apple_stamp_text_italic: stampTextItalic,
      apple_stamp_text_size: stampTextSize,
      apple_stamp_color: stampColor,
      apple_stamp_position: stampPosition,
      apple_stamp_size: stampSizePreset,
      apple_stamp_thickness: stampThickness,
      apple_stamp_logo_opacity: stampLogoOpacity,
      google_primary_label: googlePrimaryLabel,
      google_secondary_label: googleSecondaryLabel,
      google_bg_color: googleBgColor,
      google_hero_url: googleHeroUrl,
      apple_milestone_rewards: milestoneRewards,
      updated_at: serverTimestamp(),
    });
    setSaving(false);
    setSaved(true);
    setLocked(true);
    setTimeout(() => setSaved(false), 2500);
  }

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !user || !file.type.startsWith("image/")) return;
    setUploadingLogo(true);
    pushHistory();
    try {
      const dataUrl = await resizeImage(file, 320);
      // Upload to Firebase Storage
      const url = await uploadToStorage(dataUrl, `marchands/${user.uid}/logo.jpg`);
      setLogoUrl(url);
      await updateDoc(doc(db, "marchands", user.uid), { logo_url: url });
    } catch (err: unknown) {
      // Fallback to dataUrl if Storage fails
      try {
        const dataUrl = await resizeImage(file, 320);
        setLogoUrl(dataUrl);
        await updateDoc(doc(db, "marchands", user.uid), { logo_url: dataUrl });
      } catch {
        alert(`Erreur : ${err instanceof Error ? err.message : String(err)}`);
      }
    } finally {
      setUploadingLogo(false);
    }
  }

  async function handleIconUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !user || !file.type.startsWith("image/")) return;
    setUploadingIcon(true);
    try {
      const dataUrl = await resizeImage(file, 87);
      setIconUrl(dataUrl);
      await updateDoc(doc(db, "marchands", user.uid), { apple_icon_url: dataUrl });
    } finally {
      setUploadingIcon(false);
    }
  }

  async function handleStripUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !user || !file.type.startsWith("image/")) return;
    setUploadingStrip(true);
    pushHistory();
    try {
      // Store raw resized (maintain aspect) for cropping
      const rawUrl = await resizeImageRaw(file, 1500);
      setRawStripUrl(rawUrl);
      setIsUploadedStrip(true);
      setStripFrom(""); // clear gradient mode
      setStripTo("");

      const cropped = await applyCrop(rawUrl, cropY);
      // Upload to Firebase Storage
      let finalUrl: string;
      try {
        finalUrl = await uploadToStorage(cropped, `marchands/${user.uid}/strip.jpg`);
      } catch {
        finalUrl = cropped; // fallback
      }
      setStripUrl(finalUrl);
      await updateDoc(doc(db, "marchands", user.uid), { strip_url: finalUrl });
    } catch (err: unknown) {
      alert(`Erreur : ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setUploadingStrip(false);
    }
  }

  // Couleur unie sélectionnée → efface la bannière dégradée, carte devient unie
  function handleBgColorChange(color: string) {
    pushHistory();
    setBgColor(color);
    if (stripFrom) {
      setStripFrom("");
      setStripTo("");
      setStripUrl("");
      updateDoc(doc(db, "marchands", user!.uid), { strip_url: "", apple_bg_color: color });
    }
  }

  function handleDownloadBanner() {
    const dark = isDarkBg(bgColor);
    const lightColor = dark ? lightenDarken(bgColor, 38) : lightenDarken(bgColor, -38);
    buildStrip(lightColor, bgColor, 160).then(strip => {
      downloadStrip(strip, `wallio-banner-${nom || "carte"}.jpg`);
    }).catch(() => {});
  }


  async function handleGoogleHeroUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !user || !file.type.startsWith("image/")) return;
    setUploadingGoogleHero(true);
    try {
      const raw = await resizeImageRaw(file, 1500);
      let url: string;
      try {
        url = await uploadToStorage(raw, `marchands/${user.uid}/google_hero.jpg`);
      } catch {
        url = raw;
      }
      setGoogleHeroUrl(url);
      await updateDoc(doc(db, "marchands", user.uid), { google_hero_url: url });
    } catch (err) {
      alert(`Erreur upload : ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setUploadingGoogleHero(false);
    }
  }

  // Feature 9 — Google Wallet hero image adapter
  async function handleAdaptForGoogle() {
    if (!stripUrl) return;
    // Create 430×172 canvas from existing strip
    const img = new Image();
    img.src = stripUrl;
    await new Promise(resolve => { img.onload = resolve; });
    const canvas = document.createElement("canvas");
    canvas.width = 430; canvas.height = 172;
    const ctx = canvas.getContext("2d")!;
    const targetRatio = 430 / 172;
    const imgRatio = img.width / img.height;
    let sx = 0, sy = 0, sw = img.width, sh = img.height;
    if (imgRatio > targetRatio) {
      sw = Math.round(img.height * targetRatio);
      sx = Math.round((img.width - sw) / 2);
    } else {
      sh = Math.round(img.width / targetRatio);
      sy = Math.round((img.height - sh) / 2);
    }
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, 430, 172);
    const adapted = canvas.toDataURL("image/jpeg", 0.88);
    setStripUrl(adapted);
    await updateDoc(doc(db, "marchands", user!.uid), { strip_url: adapted });
  }

  async function handleComptoirBgUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !user || !file.type.startsWith("image/")) return;
    setUploadingComptoirBg(true);
    try {
      const rawUrl = await resizeImageRaw(file, 1600);
      let finalUrl: string;
      try {
        finalUrl = await uploadToStorage(rawUrl, `marchands/${user.uid}/comptoir-bg.jpg`);
      } catch {
        finalUrl = rawUrl;
      }
      setComptoirBgUrl(finalUrl);
      await updateDoc(doc(db, "marchands", user!.uid), { comptoir_bg_url: finalUrl });
    } catch (err: unknown) {
      alert(`Erreur : ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setUploadingComptoirBg(false);
    }
  }

  async function telechargerComptoir() {
    setComptoirDownloading(true);
    const canvas = document.createElement("canvas");
    const couleurP = (marchand as Record<string, unknown>).couleur_principale as string || "#0A0A0A";
    const couleurS = (marchand as Record<string, unknown>).couleur_secondaire as string || "#1A1A1A";
    const nfcId = (marchand as Record<string, unknown>).nfc_id as string | undefined;
    if (comptoirFormat === "chevaleret") {
      await drawChevaleret(canvas, couleurP, couleurS, nom, nfcId, comptoirTemplate, 4, comptoirShowQR, comptoirBgUrl || undefined);
    } else {
      await drawComptoir(canvas, couleurP, couleurS, nom, nfcId, comptoirTemplate, 4, comptoirShowQR, comptoirBgUrl || undefined);
    }
    const link = document.createElement("a");
    const label = comptoirFormat === "chevaleret" ? "chevaleret" : "carte-comptoir";
    link.download = `wallio-${label}-${comptoirTemplate}-${nom?.replace(/\s+/g, "-").toLowerCase() || "enseigne"}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
    setComptoirDownloading(false);
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
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {locked ? (
            <button onClick={() => setLocked(false)} style={{
              padding: "8px 20px", borderRadius: 12, fontSize: 13, fontWeight: 600,
              background: "var(--glass-bg)", border: "1px solid var(--border)",
              color: "var(--fg)", cursor: "pointer",
            }}>
              Modifier la carte
            </button>
          ) : (
            <>
              <button
                onClick={undo}
                disabled={!canUndo}
                title="Annuler la dernière action"
                style={{
                  padding: "8px 14px", borderRadius: 12, fontSize: 13, fontWeight: 600,
                  background: "var(--glass-bg)", border: "1px solid var(--border)",
                  color: canUndo ? "var(--fg)" : "var(--fg-tertiary)",
                  cursor: canUndo ? "pointer" : "not-allowed", opacity: canUndo ? 1 : 0.5,
                }}
              >
                ↩ Annuler
              </button>
              <button onClick={() => setLocked(true)} style={{
                padding: "8px 14px", borderRadius: 12, fontSize: 13, fontWeight: 600,
                background: "var(--glass-bg)", border: "1px solid var(--border)",
                color: "var(--fg-secondary)", cursor: "pointer",
              }}>
                Annuler les modifs
              </button>
              <button onClick={sauvegarder} disabled={saving} style={{
                padding: "8px 20px", borderRadius: 12, fontSize: 13, fontWeight: 600,
                background: saved ? "#34C759" : "var(--accent)", color: "white",
                border: "none", cursor: "pointer",
                boxShadow: "0 4px 14px rgba(0,122,255,0.25)",
              }}>
                {saving ? "…" : saved ? "Sauvegardé ✓" : "Sauvegarder"}
              </button>
            </>
          )}
        </div>
      </div>

      {/* ── Contenu ── */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>

        {/* ── Preview ── */}
        <div style={{
          flex: 1, display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "flex-start",
          padding: "32px 32px 48px", gap: 14, background: "var(--bg)", overflowY: "auto",
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

          {/* Feature 7 — preview états tampons */}
          <div style={{ display: "flex", gap: 6 }}>
            {([
              { fill: 0,   label: `Vide 0/${objectif}` },
              { fill: 0.5, label: `Mi-chemin ${Math.round(objectif * 0.5)}/${objectif}` },
              { fill: 1,   label: `Complet ${objectif}/${objectif}` },
            ]).map(({ fill, label }) => (
              <button key={fill} onClick={() => setPreviewFill(fill)} style={{
                padding: "6px 14px", borderRadius: 20, fontSize: 11, fontWeight: 600,
                background: previewFill === fill ? "var(--accent)" : "var(--glass-bg)",
                color: previewFill === fill ? "white" : "var(--fg-secondary)",
                border: `1px solid ${previewFill === fill ? "var(--accent)" : "var(--border)"}`,
                cursor: "pointer",
              }}>
                {label}
              </button>
            ))}
          </div>

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
              headerField={headerValue ? { label: headerLabel || "INFO", value: headerValue } : undefined}
              auxiliaryFields={[
                { label: aux1Label || "INFOS", value: aux1Value },
                { label: aux2Label || "INFOS", value: aux2Value },
              ]}
              stampsOnStrip={stampsOnStrip}
              stripStampStyle={stripStampStyle}
              stampText={stampText}
              stampTextBold={stampTextBold}
              stampTextItalic={stampTextItalic}
              stampTextSize={stampTextSize}
              stampColor={stampColor}
              stampPosition={stampPosition}
              stampSizePreset={stampSizePreset}
              stampThickness={stampThickness}
              stampLogoOpacity={stampLogoOpacity}
              milestoneRewards={milestoneRewards}
            />
          ) : (
            <GoogleWalletCard
              logoUrl={logoUrl}
              logoText={nom}
              backgroundColor={googleBgColor}
              heroUrl={googleHeroUrl || undefined}
              stampsCurrent={stampsCurrent}
              stampsObjective={objectif}
              rewardName={recompense}
              primaryLabel={googlePrimaryLabel}
              secondaryLabel={googleSecondaryLabel}
              previewUid={user.uid}
            />
          )}

          <p style={{ fontSize: 11, color: "var(--fg-tertiary)", textAlign: "center", maxWidth: 340 }}>
            Bannière libre · Couleurs personnalisables · Structure imposée par {walletType === "apple" ? "Apple" : "Google"}
          </p>


        </div>

        {/* ── Panel droit ── */}
        {!locked && <div style={{
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
              Affiché en haut à gauche · max 160×50pt · Images stockées sur Firebase Storage
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
                    onClick={() => {
                      setStripUrl(""); setRawStripUrl(""); setIsUploadedStrip(false);
                      updateDoc(doc(db, "marchands", user!.uid), { strip_url: "" });
                    }}
                    style={{ padding: "8px 14px", borderRadius: 10, fontSize: 13, fontWeight: 600, background: "rgba(255,59,48,0.1)", border: "1px solid rgba(255,59,48,0.3)", color: "#FF3B30", cursor: "pointer" }}
                  >
                    Suppr.
                  </button>
                )}
              </div>

              {/* Feature 6 — slider cadrage vertical */}
              {rawStripUrl && isUploadedStrip && (
                <div>
                  <p style={{ fontSize: 11, color: "var(--fg-tertiary)", marginBottom: 6 }}>
                    Cadrage vertical — 0=Haut, 100=Bas
                  </p>
                  <input
                    type="range" min={0} max={100} value={cropY}
                    onChange={e => setCropY(Number(e.target.value))}
                    style={{ width: "100%", accentColor: "var(--accent)" }}
                  />
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "var(--fg-tertiary)" }}>
                    <span>Haut</span><span>{cropY}%</span><span>Bas</span>
                  </div>
                </div>
              )}

              <p style={{ fontSize: 10, color: "var(--fg-tertiary)", margin: 0 }}>
                Format paysage large · min 750×288px · recadrage auto
              </p>
            </div>
          </Section>

          {/* Éditeur bannière dégradée */}
          <Section label="Éditeur bannière">

            {/* Thèmes dégradés */}
            <p style={{ fontSize: 10, color: "var(--fg-tertiary)", margin: "-4px 0 6px" }}>
              Choisir un thème dégradé
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 40px)", gap: 5 }}>
              {GRADIENT_THEMES.map(t => (
                <button key={t.name} title={t.name} onClick={async () => {
                  pushHistory();
                  const angle = t.angle ?? 135;
                  setStripFrom(t.from); setStripTo(t.to); setStripAngle(angle);
                  setBgColor(t.bg);
                  setIsUploadedStrip(false); setRawStripUrl("");
                  const strip = await buildStrip(
                    t.from, t.to, angle,
                    stripText, stripTextColor, stripTextSize, stripTextPos, stripTextFont,
                    stripText2, stripText2Size,
                    stripIncludeLogo ? logoUrl : undefined
                  );
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
                {/* Taille texte 1 */}
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

                {/* Feature 5 — Sous-titre */}
                <Field label="Sous-titre (ligne 2)">
                  <TextInput value={stripText2} onChange={setStripText2} placeholder="Sous-titre, accroche…"/>
                </Field>
                {stripText2 && (
                  <Field label="Taille du sous-titre">
                    <div style={{ display: "flex", gap: 6 }}>
                      {(["s","m","l"] as const).map(s => (
                        <button key={s} onClick={() => setStripText2Size(s)} style={{
                          flex: 1, padding: "6px 0", borderRadius: 10, fontSize: 12, fontWeight: 600,
                          background: stripText2Size === s ? "var(--accent)" : "var(--glass-bg)",
                          color: stripText2Size === s ? "white" : "var(--fg-secondary)",
                          border: `1px solid ${stripText2Size === s ? "var(--accent)" : "var(--border)"}`,
                          cursor: "pointer",
                        }}>
                          {s === "s" ? "Petit" : s === "m" ? "Moyen" : "Grand"}
                        </button>
                      ))}
                    </div>
                  </Field>
                )}

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

            {/* Feature 4 — Logo dans la bannière */}
            {stripFrom && (
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <input type="checkbox" id="strip-include-logo"
                  checked={stripIncludeLogo} onChange={e => setStripIncludeLogo(e.target.checked)}
                  style={{ accentColor: "var(--accent)", width: 14, height: 14, cursor: "pointer" }}
                />
                <label htmlFor="strip-include-logo" style={{ fontSize: 12, color: "var(--fg)", cursor: "pointer" }}>
                  Ajouter le logo dans la bannière
                </label>
              </div>
            )}

            {/* Tampons sur la bannière */}
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: stampsOnStrip ? 10 : 0 }}>
                <input type="checkbox" id="stamps-on-strip"
                  checked={stampsOnStrip} onChange={e => setStampsOnStrip(e.target.checked)}
                  style={{ accentColor: "var(--accent)", width: 14, height: 14, cursor: "pointer" }}
                />
                <label htmlFor="stamps-on-strip" style={{ fontSize: 12, color: "var(--fg)", cursor: "pointer" }}>
                  Afficher les tampons sur la bannière
                </label>
              </div>

              {stampsOnStrip && (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>

                  {/* ── Style ── */}
                  <div>
                    <p style={{ fontSize: 10, color: "var(--fg-tertiary)", marginBottom: 6 }}>
                      Dessin · {marchand.objectif_tampons || 10} tampons
                    </p>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 5 }}>
                      {([
                        { key: "dot",   label: "·",  desc: "Point" },
                        { key: "ring",  label: "◎",  desc: "Anneau" },
                        { key: "plus",  label: "+",  desc: "Croix" },
                        { key: "check", label: "✓",  desc: "Check" },
                        { key: "heart", label: "♡",  desc: "Cœur" },
                        { key: "star",  label: "☆",  desc: "Étoile" },
                        { key: "text",  label: "Aa", desc: "Texte" },
                        { key: "logo",  label: "⊕",  desc: "Logo" },
                      ] as const).map(opt => (
                        <button key={opt.key} onClick={() => setStripStampStyle(opt.key)} style={{
                          padding: "7px 4px", borderRadius: 8, fontSize: 15,
                          display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
                          background: stripStampStyle === opt.key ? "var(--accent)" : "var(--glass-bg)",
                          border: `1px solid ${stripStampStyle === opt.key ? "var(--accent)" : "var(--border)"}`,
                          color: stripStampStyle === opt.key ? "white" : "var(--fg)", cursor: "pointer",
                        }}>
                          <span>{opt.label}</span>
                          <span style={{ fontSize: 8, opacity: 0.7 }}>{opt.desc}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* ── Couleur ── */}
                  <div>
                    <p style={{ fontSize: 10, color: "var(--fg-tertiary)", marginBottom: 6 }}>Couleur</p>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <input type="color" value={stampColor} onChange={e => setStampColor(e.target.value)}
                        style={{ width: 36, height: 30, borderRadius: 8, border: "1px solid var(--border)", cursor: "pointer", padding: 2, background: "none" }}
                      />
                      <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                        {["#FFFFFF","#000000","#FFD700","#FF6B6B","#74C0FC","#51CF66","#FF8CC8","#FFA94D"].map(c => (
                          <button key={c} onClick={() => setStampColor(c)} style={{
                            width: 22, height: 22, borderRadius: 5, background: c, cursor: "pointer", padding: 0,
                            border: stampColor === c ? "2px solid var(--accent)" : "1px solid rgba(128,128,128,0.3)",
                            boxShadow: c === "#FFFFFF" ? "inset 0 0 0 1px rgba(0,0,0,0.1)" : undefined,
                          }}/>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* ── Épaisseur ── */}
                  <div>
                    <p style={{ fontSize: 10, color: "var(--fg-tertiary)", marginBottom: 6 }}>
                      Épaisseur des cercles — {stampThickness === 1 ? "Fin" : stampThickness === 2 ? "Normal" : stampThickness === 3 ? "Épais" : stampThickness === 4 ? "Très épais" : "Maximum"}
                    </p>
                    <input type="range" min={1} max={5} step={1} value={stampThickness}
                      onChange={e => setStampThickness(+e.target.value)}
                      style={{ width: "100%", accentColor: "var(--accent)", cursor: "pointer" }}
                    />
                  </div>

                  {/* ── Opacité logo (style logo seulement) ── */}
                  {stripStampStyle === "logo" && (
                    <div>
                      <p style={{ fontSize: 10, color: "var(--fg-tertiary)", marginBottom: 6 }}>
                        Opacité du logo — {Math.round(stampLogoOpacity * 100)}%
                      </p>
                      <input type="range" min={0} max={1} step={0.05} value={stampLogoOpacity}
                        onChange={e => setStampLogoOpacity(+e.target.value)}
                        style={{ width: "100%", accentColor: "var(--accent)", cursor: "pointer" }}
                      />
                    </div>
                  )}

                  {/* ── Position ── */}
                  <div>
                    <p style={{ fontSize: 10, color: "var(--fg-tertiary)", marginBottom: 6 }}>Position</p>
                    <div style={{ display: "flex", gap: 5 }}>
                      {(["top","center","bottom"] as const).map(pos => (
                        <button key={pos} onClick={() => setStampPosition(pos)} style={{
                          flex: 1, padding: "7px 0", borderRadius: 8, fontSize: 11, fontWeight: 600,
                          background: stampPosition === pos ? "var(--accent)" : "var(--glass-bg)",
                          border: `1px solid ${stampPosition === pos ? "var(--accent)" : "var(--border)"}`,
                          color: stampPosition === pos ? "white" : "var(--fg-secondary)", cursor: "pointer",
                        }}>
                          {pos === "top" ? "↑ Haut" : pos === "center" ? "↕ Centre" : "↓ Bas"}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* ── Taille ── */}
                  <div>
                    <p style={{ fontSize: 10, color: "var(--fg-tertiary)", marginBottom: 6 }}>Taille des tampons</p>
                    <div style={{ display: "flex", gap: 5 }}>
                      {(["s","m","l"] as const).map(sz => (
                        <button key={sz} onClick={() => setStampSizePreset(sz)} style={{
                          flex: 1, padding: "7px 0", borderRadius: 8, fontSize: 11, fontWeight: 600,
                          background: stampSizePreset === sz ? "var(--accent)" : "var(--glass-bg)",
                          border: `1px solid ${stampSizePreset === sz ? "var(--accent)" : "var(--border)"}`,
                          color: stampSizePreset === sz ? "white" : "var(--fg-secondary)", cursor: "pointer",
                        }}>
                          {sz === "s" ? "S — Petit" : sz === "m" ? "M — Moyen" : "L — Grand"}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* ── Éditeur texte ── */}
                  {stripStampStyle === "text" && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      <div>
                        <p style={{ fontSize: 10, color: "var(--fg-tertiary)", marginBottom: 5 }}>
                          Texte dans le cercle — ex : CAFÉ, W
                        </p>
                        <input type="text" value={stampText} onChange={e => setStampText(e.target.value.slice(0, 12))}
                          placeholder="ex : CAFÉ, W" maxLength={12}
                          style={{
                            width: "100%", padding: "8px 12px", borderRadius: 10, fontSize: 13,
                            background: "var(--glass-bg)", border: "1px solid var(--border)",
                            color: "var(--fg)", outline: "none", boxSizing: "border-box",
                            fontWeight: stampTextBold ? 700 : 400, fontStyle: stampTextItalic ? "italic" : "normal",
                          }}
                          onFocus={e => (e.target.style.borderColor = "var(--accent)")}
                          onBlur={e => (e.target.style.borderColor = "var(--border)")}
                        />
                      </div>
                      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                        <button onClick={() => setStampTextBold(v => !v)} style={{
                          width: 34, height: 34, borderRadius: 8, fontSize: 15, fontWeight: 700,
                          background: stampTextBold ? "var(--accent)" : "var(--glass-bg)",
                          border: `1px solid ${stampTextBold ? "var(--accent)" : "var(--border)"}`,
                          color: stampTextBold ? "white" : "var(--fg)", cursor: "pointer",
                        }}>B</button>
                        <button onClick={() => setStampTextItalic(v => !v)} style={{
                          width: 34, height: 34, borderRadius: 8, fontSize: 15, fontStyle: "italic",
                          background: stampTextItalic ? "var(--accent)" : "var(--glass-bg)",
                          border: `1px solid ${stampTextItalic ? "var(--accent)" : "var(--border)"}`,
                          color: stampTextItalic ? "white" : "var(--fg)", cursor: "pointer",
                        }}>I</button>
                        <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 6 }}>
                          <button onClick={() => setStampTextSize(v => Math.max(0.6, +(v-0.1).toFixed(1)))} style={{ width: 28, height: 28, borderRadius: 8, fontSize: 16, background: "var(--glass-bg)", border: "1px solid var(--border)", color: "var(--fg)", cursor: "pointer" }}>−</button>
                          <span style={{ flex: 1, textAlign: "center", fontSize: 11, color: "var(--fg-secondary)" }}>
                            {Math.round(stampTextSize * 100)}%
                          </span>
                          <button onClick={() => setStampTextSize(v => Math.min(1.6, +(v+0.1).toFixed(1)))} style={{ width: 28, height: 28, borderRadius: 8, fontSize: 16, background: "var(--glass-bg)", border: "1px solid var(--border)", color: "var(--fg)", cursor: "pointer" }}>+</button>
                        </div>
                      </div>
                    </div>
                  )}

                </div>
              )}
            </div>

            {/* Actions */}
            {(stripFrom || stripUrl) && (
              <div style={{ display: "flex", gap: 8 }}>
                {stripFrom && (
                  <button onClick={async () => {
                    const strip = await buildStrip(
                      stripFrom, stripTo, stripAngle,
                      stripText, stripTextColor, stripTextSize, stripTextPos, stripTextFont,
                      stripText2, stripText2Size,
                      stripIncludeLogo ? logoUrl : undefined
                    );
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
              onChange={handleBgColorChange}
              presets={[
                // Noir → Gris foncé (9)
                "#000000","#050505","#0A0A0A","#111111","#1C1C1E","#2C2C2E","#3A3A3C","#4A4A4C","#636366",
                // Gris moyen → Blanc (9)
                "#8E8E93","#AEAEB2","#C7C7CC","#D1D1D6","#E5E5EA","#EBEBEB","#F0F0F0","#F5F5F5","#FFFFFF",
                // Bleu nuit (9)
                "#020B18","#0A0A1A","#0D1828","#0F1F33","#16213E","#1B2A4A","#1E3A5F","#0F3460","#243C54",
                // Bleu vif (9)
                "#001A6E","#0033AA","#0047AB","#005AE0","#007AFF","#0099FF","#29ABE2","#00B4D8","#64B5F6",
                // Teal foncé (9)
                "#001A1A","#003333","#004444","#005555","#006666","#007777","#008888","#009999","#00AAAA",
                // Teal clair (9)
                "#00BBBB","#00CED1","#20B2AA","#3DCFCF","#48D1CC","#5CE0D8","#7DE8E8","#9FF0F0","#C0FAF8",
                // Vert foncé (9)
                "#041404","#0A1A0A","#122212","#1A3218","#20401E","#285228","#336633","#3D7A3D","#4A8C4A",
                // Vert vif (9)
                "#005522","#006633","#008844","#00A550","#14B860","#2ECC71","#48D882","#7EE8A2","#B2F5CC",
                // Kaki / Olive (9)
                "#1A1A00","#2A2A00","#3A3800","#4A4A1A","#5C6B3A","#6B8040","#8BAA50","#A0C060","#C8DC80",
                // Marron / Espresso (9)
                "#150800","#1C0E05","#2E1A0E","#3A2A1C","#4A3020","#6B4520","#8B5E2A","#A0522D","#C68642",
                // Orange / Ambre (9)
                "#3A1A00","#5C2800","#8B3A00","#CC5500","#E65C00","#FF6600","#FF7F00","#FF9500","#FFB300",
                // Or / Jaune (9)
                "#3A2E00","#5A4400","#997700","#BB9900","#D4AF37","#E8C840","#FFD700","#FFE44A","#FFF0A0",
                // Rouge foncé (9)
                "#0A0000","#1A0508","#2A0A14","#4A1428","#6B1A30","#8B0000","#AA1111","#CC3333","#E85555",
                // Corail / Saumon (9)
                "#7A1A0A","#AA3333","#CC4444","#E8553A","#F07060","#F59080","#F7B09A","#FAC8B4","#FDDDD0",
                // Rose / Magenta (9)
                "#220011","#440022","#660033","#880044","#AA0055","#CC0066","#EE1188","#FF55AA","#FFB0D8",
                // Violet foncé (9)
                "#0A0514","#180A28","#2A1040","#3A1A54","#4A1E6B","#6D28D9","#8B36B0","#9B59B6","#B07CD0",
                // Violet clair / Lavande (9)
                "#C8A0E8","#D8C0F8","#E4DEFF","#EDE8F8","#F0E8FF","#F5F0FF","#E8E0FF","#D8D0FF","#CCBFFF",
                // Crème / Ivoire (9)
                "#F0E8D8","#F4EDD8","#F5F0E8","#F8F4EF","#FAF8F5","#FFFBF5","#FFFDE8","#FFFFF0","#FAFAF5",
                // Pastel chaud — pêche / abricot (9)
                "#FFE8E0","#FFD4BC","#FFC4A4","#FFB8A0","#F5D0B8","#FFECD2","#FFDAB9","#FFE4C4","#FFECC8",
                // Pastel froid — bleu / lilas (9)
                "#E0E8FF","#D0DCFF","#D0E4FF","#C0D8FF","#B0CCFF","#E8E0FF","#D8D0FF","#D0C8FF","#C8C0FF",
                // Pastel vert / menthe (9)
                "#D0F5EA","#B8EDD8","#A0E4C4","#E8F5E8","#D4ECD4","#C8DCC4","#B8CDB8","#E8F4E4","#D4E8D0",
                // Pastel rose / pêche (9)
                "#FFE0EE","#FFD0E4","#FFC0D8","#F5D0E0","#EEC0D0","#FFD4C0","#FFCCB0","#FFC4A0","#FFB890",
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
                <ColorRow value={fgColor} onChange={v => { pushHistory(); setFgColor(v); }}
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
                <ColorRow value={labelColor} onChange={v => { pushHistory(); setLabelColor(v); }}
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
              onChange={v => { pushHistory(); setPrimaryLabel(v); }}
              suggestions={["Tampons","Points","Visites","Cafés","Soins","Séances","Passages"]}
            />
            <LabelField
              label="Récompense"
              value={rewardLabel}
              onChange={v => { pushHistory(); setRewardLabel(v); }}
              suggestions={["Récompense","Cadeau","Offre","Avantage","Bonus","Surprise"]}
            />
            <LabelField
              label="Membre"
              value={memberLabel}
              onChange={v => { pushHistory(); setMemberLabel(v); }}
              suggestions={["Membre","Client","Titulaire","Fidèle","Abonné","Nom"]}
            />
          </Section>

          {/* Récompense principale */}
          <Section label="Récompense finale">
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

          {/* Paliers intermédiaires */}
          <Section label="Paliers à débloquer">
            <p style={{ fontSize: 10, color: "var(--fg-tertiary)", margin: "-4px 0 8px" }}>
              Cadeaux intermédiaires visibles sur la carte du client.
            </p>

            {/* Liste existante */}
            {milestoneRewards.sort((a, b) => a.at - b.at).map((r, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <div style={{
                  flexShrink: 0, padding: "3px 8px", borderRadius: 20, fontSize: 11, fontWeight: 600,
                  background: "var(--glass-bg)", border: "1px solid var(--border)", color: "var(--fg-secondary)",
                }}>
                  {r.at} ✦
                </div>
                <span style={{ flex: 1, fontSize: 13, color: "var(--fg)" }}>{r.label}</span>
                <button onClick={() => setMilestoneRewards(prev => prev.filter((_, j) => j !== i))} style={{
                  width: 26, height: 26, borderRadius: 6, fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center",
                  background: "none", border: "1px solid var(--border)", color: "var(--fg-tertiary)", cursor: "pointer",
                }}>×</button>
              </div>
            ))}

            {/* Ajouter un palier */}
            <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
              <input type="number" min={1} max={objectif - 1} value={newRewardAt}
                onChange={e => setNewRewardAt(Math.min(objectif - 1, Math.max(1, +e.target.value)))}
                style={{
                  width: 52, padding: "7px 8px", borderRadius: 8, fontSize: 12, textAlign: "center",
                  background: "var(--glass-bg)", border: "1px solid var(--border)", color: "var(--fg)", outline: "none",
                }}
              />
              <input type="text" value={newRewardLabel} onChange={e => setNewRewardLabel(e.target.value)}
                placeholder="ex : Café offert" maxLength={40}
                style={{
                  flex: 1, padding: "7px 10px", borderRadius: 8, fontSize: 12,
                  background: "var(--glass-bg)", border: "1px solid var(--border)", color: "var(--fg)", outline: "none",
                }}
                onFocus={e => (e.target.style.borderColor = "var(--accent)")}
                onBlur={e => (e.target.style.borderColor = "var(--border)")}
                onKeyDown={e => {
                  if (e.key === "Enter" && newRewardLabel.trim()) {
                    setMilestoneRewards(prev => [...prev, { at: newRewardAt, label: newRewardLabel.trim() }]);
                    setNewRewardLabel("");
                    setNewRewardAt(objectif);
                  }
                }}
              />
              <button
                disabled={!newRewardLabel.trim()}
                onClick={() => {
                  if (!newRewardLabel.trim()) return;
                  setMilestoneRewards(prev => [...prev, { at: newRewardAt, label: newRewardLabel.trim() }]);
                  setNewRewardLabel("");
                  setNewRewardAt(objectif);
                }}
                style={{
                  padding: "7px 12px", borderRadius: 8, fontSize: 12, fontWeight: 600,
                  background: newRewardLabel.trim() ? "var(--accent)" : "var(--glass-bg)",
                  border: "1px solid var(--border)",
                  color: newRewardLabel.trim() ? "white" : "var(--fg-tertiary)", cursor: "pointer",
                }}
              >
                +
              </button>
            </div>
            <p style={{ fontSize: 10, color: "var(--fg-tertiary)", marginTop: 6 }}>
              Le chiffre = nombre de tampons requis. Entrez et appuyez sur +.
            </p>
          </Section>

          {/* Champ en-tête — Apple uniquement */}
          {walletType === "apple" && (
            <Section label="Champ en-tête">
              <p style={{ fontSize: 10, color: "var(--fg-tertiary)", margin: "-4px 0 4px" }}>
                Affiché en haut à droite — ex : niveau, date, code.
              </p>
              <Field label="Label">
                <TextInput value={headerLabel} onChange={setHeaderLabel} placeholder="ex : NIVEAU"/>
              </Field>
              <Field label="Valeur (obligatoire pour afficher)">
                <TextInput value={headerValue} onChange={setHeaderValue} placeholder="ex : Gold, VIP, Premium…"/>
              </Field>
            </Section>
          )}

          {/* Champs auxiliaires — Apple uniquement */}
          {walletType === "apple" && (
            <Section label="Champs auxiliaires">
              <p style={{ fontSize: 10, color: "var(--fg-tertiary)", margin: "-4px 0 4px" }}>
                Ligne supplémentaire entre les champs et le QR code.
              </p>
              <Field label="Label 1">
                <TextInput value={aux1Label} onChange={setAux1Label} placeholder="ex : VALABLE"/>
              </Field>
              <Field label="Valeur 1 (obligatoire pour afficher)">
                <TextInput value={aux1Value} onChange={setAux1Value} placeholder="ex : Tous établissements"/>
              </Field>
              <Field label="Label 2">
                <TextInput value={aux2Label} onChange={setAux2Label} placeholder="ex : CODE"/>
              </Field>
              <Field label="Valeur 2">
                <TextInput value={aux2Value} onChange={setAux2Value} placeholder=""/>
              </Field>
            </Section>
          )}

          {/* Icône notification — Apple uniquement */}
          {walletType === "apple" && (
            <Section label="Icône notification">
              <p style={{ fontSize: 10, color: "var(--fg-tertiary)", margin: "-4px 0 6px" }}>
                29×29px — affichée dans les pushs Apple Wallet.
              </p>
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 10, flexShrink: 0,
                  border: "1px solid var(--border)", overflow: "hidden",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  background: "var(--glass-bg)",
                }}>
                  {iconUrl
                    ? <img src={iconUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "contain" }}/>
                    : <span style={{ fontSize: 18 }}>🔔</span>
                  }
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{
                    display: "block", width: "100%", padding: "7px 0", borderRadius: 10,
                    fontSize: 12, fontWeight: 500, background: "var(--glass-bg)",
                    border: "1px solid var(--border)", color: "var(--fg)",
                    cursor: uploadingIcon ? "wait" : "pointer", textAlign: "center",
                  }}>
                    <input type="file" accept="image/*" style={{ display: "none" }} onChange={handleIconUpload} disabled={uploadingIcon}/>
                    {uploadingIcon ? "Upload…" : iconUrl ? "Changer" : "Ajouter"}
                  </label>
                  {iconUrl && (
                    <button onClick={() => setIconUrl("")} style={{ width: "100%", marginTop: 4, padding: "4px 0", borderRadius: 8, fontSize: 11, background: "none", border: "none", color: "#FF3B30", cursor: "pointer" }}>
                      Supprimer
                    </button>
                  )}
                </div>
              </div>
            </Section>
          )}

          {/* Dos de la carte — Apple uniquement */}
          {walletType === "apple" && (
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
          )}

          {/* Google Wallet — personnalisation complète */}
          {walletType === "google" && (
            <>
              <div style={{ padding: "10px 12px", borderRadius: 10, fontSize: 11, background: "rgba(66,133,244,0.06)", border: "1px solid rgba(66,133,244,0.2)", color: "var(--fg-secondary)", lineHeight: 1.6 }}>
                <strong style={{ color: "#4285F4" }}>Google Wallet</strong> — structure fixée par Google. Tu contrôles la couleur, le logo, l&apos;image bannière et les textes.
              </div>

              <Section label="Couleur de fond">
                <p style={{ fontSize: 10, color: "var(--fg-tertiary)", margin: "-4px 0 8px" }}>
                  Couleur principale de la carte Google Wallet.
                </p>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 8, background: googleBgColor, border: "2px solid var(--border)", flexShrink: 0 }} />
                  <input
                    type="color" value={googleBgColor}
                    onChange={e => setGoogleBgColor(e.target.value)}
                    style={{ width: 36, height: 36, border: "none", padding: 0, background: "none", cursor: "pointer", borderRadius: 8 }}
                  />
                  <span style={{ fontSize: 12, color: "var(--fg-secondary)", fontFamily: "monospace" }}>{googleBgColor}</span>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {["#007AFF","#34C759","#FF3B30","#FF9500","#AF52DE","#5AC8FA","#1C1C1E","#2C2C2E","#4A4A4C","#636366"].map(c => (
                    <button key={c} onClick={() => setGoogleBgColor(c)} style={{
                      width: 28, height: 28, borderRadius: 7, border: googleBgColor === c ? "2px solid var(--fg)" : "1px solid var(--border)",
                      background: c, cursor: "pointer", padding: 0,
                    }} />
                  ))}
                </div>
              </Section>

              <Section label="Logo">
                <p style={{ fontSize: 10, color: "var(--fg-tertiary)", margin: "-4px 0 8px" }}>
                  Affiché en rond dans le coin supérieur gauche.
                </p>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 44, height: 44, borderRadius: "50%", overflow: "hidden", background: googleBgColor, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, border: "1px solid var(--border)" }}>
                    {logoUrl
                      ? <img src={logoUrl} alt="" style={{ width: 44, height: 44, objectFit: "cover" }} />
                      : <span style={{ color: "#fff", fontWeight: 700, fontSize: 18 }}>{nom?.[0] || "W"}</span>
                    }
                  </div>
                  <span style={{ fontSize: 11, color: "var(--fg-secondary)" }}>Modifiable dans la section &quot;Logo &amp; couleurs&quot;</span>
                </div>
              </Section>

              <Section label="Nom du programme">
                <p style={{ fontSize: 10, color: "var(--fg-tertiary)", margin: "-4px 0 6px" }}>
                  Affiché en grand sous le logo. Ex : DADA, Café Central…
                </p>
                <TextInput value={nom} onChange={setNom} placeholder="Nom affiché sur la carte" />
              </Section>

              <Section label="Image bannière">
                <p style={{ fontSize: 10, color: "var(--fg-tertiary)", margin: "-4px 0 8px" }}>
                  Image large affichée en haut de la carte · Ratio 3:1 · Recommandé : 1032×336px
                </p>
                {googleHeroUrl && (
                  <div style={{ marginBottom: 8, borderRadius: 10, overflow: "hidden", border: "1px solid var(--border)" }}>
                    <img src={googleHeroUrl} alt="Hero" style={{ width: "100%", height: 80, objectFit: "cover", display: "block" }} />
                  </div>
                )}
                <div style={{ display: "flex", gap: 6 }}>
                  <label style={{
                    flex: 1, display: "block", padding: "8px 0", borderRadius: 10, fontSize: 12, fontWeight: 500,
                    background: "var(--glass-bg)", border: "1px solid var(--border)", color: "var(--fg)",
                    cursor: uploadingGoogleHero ? "wait" : "pointer", textAlign: "center",
                  }}>
                    <input type="file" accept="image/*" style={{ display: "none" }} onChange={handleGoogleHeroUpload} disabled={uploadingGoogleHero} />
                    {uploadingGoogleHero ? "Upload…" : googleHeroUrl ? "Changer" : "Ajouter une bannière"}
                  </label>
                  {googleHeroUrl && (
                    <button onClick={async () => { setGoogleHeroUrl(""); await updateDoc(doc(db, "marchands", user!.uid), { google_hero_url: "" }); }}
                      style={{ padding: "8px 12px", borderRadius: 10, fontSize: 12, background: "rgba(255,59,48,0.08)", border: "none", color: "#FF3B30", cursor: "pointer" }}>
                      Suppr.
                    </button>
                  )}
                </div>
              </Section>

              <Section label="Labels">
                <p style={{ fontSize: 10, color: "var(--fg-tertiary)", margin: "-4px 0 8px" }}>
                  Seuls textes personnalisables — le reste est imposé par Google.
                </p>
                <Field label="Label tampons">
                  <TextInput value={googlePrimaryLabel} onChange={setGooglePrimaryLabel} placeholder="ex: Tampons, Points, Visites" />
                </Field>
                <Field label="Label objectif">
                  <TextInput value={googleSecondaryLabel} onChange={setGoogleSecondaryLabel} placeholder="ex: Objectif, Sur" />
                </Field>
                <Field label="Récompense">
                  <TextInput value={recompense} onChange={setRecompense} placeholder="ex: Café offert" />
                </Field>
              </Section>
            </>
          )}

          {/* Note */}
          <div style={{ padding: "12px 14px", borderRadius: 12, background: "rgba(0,122,255,0.06)", border: "1px solid rgba(0,122,255,0.15)" }}>
            <p style={{ fontSize: 11, color: "var(--fg-secondary)", margin: 0, lineHeight: 1.6 }}>
              <strong style={{ color: "var(--accent)" }}>Génération .pkpass</strong><br/>
              Structure prête · En attente du certificat Apple Developer.
            </p>
          </div>

        </div>}
      </div>
    </div>
  );
}

// ── Gradient themes ──────────────────────────────────

const GRADIENT_THEMES = [
  // Noir / Gris (5)
  { name: "Minuit",      from: "#1A1A2E", to: "#0A0A0A",   bg: "#0A0A0A",   angle: 160 },
  { name: "Charbon",     from: "#2C2C2E", to: "#0A0A0A",   bg: "#0A0A0A",   angle: 140 },
  { name: "Anthracite",  from: "#3A3A3C", to: "#1C1C1E",   bg: "#1C1C1E",   angle: 150 },
  { name: "Ardoise",     from: "#3A4A5A", to: "#1A2A3A",   bg: "#1A2A3A",   angle: 155 },
  { name: "Graphite",    from: "#4A4A4C", to: "#2C2C2E",   bg: "#2C2C2E",   angle: 145 },
  // Bleu nuit (5)
  { name: "Cosmos",      from: "#2A1654", to: "#0A0A1A",   bg: "#0A0A1A",   angle: 135 },
  { name: "Saphir",      from: "#1A4A8A", to: "#0A1A3A",   bg: "#0A1A3A",   angle: 150 },
  { name: "Cobalt",      from: "#0047AB", to: "#001A4A",   bg: "#001A4A",   angle: 155 },
  { name: "Ocean nuit",  from: "#0F3460", to: "#0A0A1A",   bg: "#0A0A1A",   angle: 145 },
  { name: "Denim",       from: "#2C5F8A", to: "#162E44",   bg: "#162E44",   angle: 140 },
  // Bleu vif (5)
  { name: "Glacial",     from: "#0099CC", to: "#005577",   bg: "#005577",   angle: 135 },
  { name: "Aqua",        from: "#00B4D8", to: "#0077B6",   bg: "#0077B6",   angle: 145 },
  { name: "Azur",        from: "#007AFF", to: "#003A88",   bg: "#003A88",   angle: 140 },
  { name: "Pacifique",   from: "#0096C7", to: "#003A55",   bg: "#003A55",   angle: 150 },
  { name: "Ciel elec.",  from: "#64B5F6", to: "#1565C0",   bg: "#1565C0",   angle: 135 },
  // Teal (5)
  { name: "Teal nuit",   from: "#006666", to: "#001A1A",   bg: "#001A1A",   angle: 145 },
  { name: "Turquoise",   from: "#00CED1", to: "#005577",   bg: "#005577",   angle: 135 },
  { name: "Lagon",       from: "#00AAA0", to: "#004444",   bg: "#004444",   angle: 140 },
  { name: "Em. eau",     from: "#00897B", to: "#00332C",   bg: "#00332C",   angle: 145 },
  { name: "Cyan",        from: "#00BCD4", to: "#006A70",   bg: "#00606A",   angle: 135 },
  // Vert (5)
  { name: "Foret",       from: "#1A3A1A", to: "#0A1A0A",   bg: "#0A1A0A",   angle: 150 },
  { name: "Matcha",      from: "#4A6741", to: "#2D3A2D",   bg: "#2D3A2D",   angle: 135 },
  { name: "Jade",        from: "#00A878", to: "#00503A",   bg: "#00503A",   angle: 135 },
  { name: "Emeraude",    from: "#00695C", to: "#00332C",   bg: "#00332C",   angle: 145 },
  { name: "Menthe",      from: "#2ECC71", to: "#0A5C30",   bg: "#0A5C30",   angle: 140 },
  // Kaki / Olive (5)
  { name: "Kaki",        from: "#5C6B3A", to: "#2C3418",   bg: "#2C3418",   angle: 150 },
  { name: "Olive",       from: "#6B7030", to: "#30340A",   bg: "#30340A",   angle: 145 },
  { name: "Militaire",   from: "#4B5320", to: "#1A1E00",   bg: "#1A1E00",   angle: 155 },
  { name: "Mousse",      from: "#6B7C45", to: "#2A3010",   bg: "#2A3010",   angle: 140 },
  { name: "Savane",      from: "#8A9A50", to: "#3A4018",   bg: "#3A4018",   angle: 135 },
  // Bordeaux / Rouge (5)
  { name: "Bordeaux",    from: "#6B1A30", to: "#2A0A14",   bg: "#2A0A14",   angle: 135 },
  { name: "Cramoisi",    from: "#8B0000", to: "#3A0000",   bg: "#3A0000",   angle: 140 },
  { name: "Grenat",      from: "#7B0028", to: "#320010",   bg: "#320010",   angle: 135 },
  { name: "Cerise",      from: "#CC0033", to: "#660011",   bg: "#660011",   angle: 135 },
  { name: "Aurore",      from: "#6B2A4A", to: "#2A0A1A",   bg: "#2A0A1A",   angle: 125 },
  // Corail / Orange (5)
  { name: "Corail",      from: "#E8553A", to: "#7A1A0A",   bg: "#7A1A0A",   angle: 130 },
  { name: "Sunset",      from: "#FF6B35", to: "#C0392B",   bg: "#7A1A0A",   angle: 125 },
  { name: "Feu",         from: "#FF4500", to: "#8B0000",   bg: "#5A0000",   angle: 130 },
  { name: "Amber",       from: "#CC7700", to: "#663300",   bg: "#663300",   angle: 135 },
  { name: "Caramel",     from: "#A0522D", to: "#4A1A0A",   bg: "#4A1A0A",   angle: 140 },
  // Or / Cuivre (5)
  { name: "Or",          from: "#D4AF37", to: "#6B5500",   bg: "#3A2E00",   angle: 140 },
  { name: "Champagne",   from: "#E8D5A3", to: "#B89A50",   bg: "#5A4400",   angle: 135 },
  { name: "Bronze",      from: "#CD7F32", to: "#5A3000",   bg: "#3A1A00",   angle: 145 },
  { name: "Cuivre",      from: "#B87333", to: "#5A300A",   bg: "#3A1A00",   angle: 145 },
  { name: "Safran",      from: "#F4A300", to: "#884400",   bg: "#5A2A00",   angle: 135 },
  // Rose / Magenta (5)
  { name: "Rose nuit",   from: "#8B1A4A", to: "#2A0A1A",   bg: "#2A0A1A",   angle: 130 },
  { name: "Magenta",     from: "#CC0066", to: "#660033",   bg: "#440022",   angle: 135 },
  { name: "Fuchsia",     from: "#FF0080", to: "#880040",   bg: "#440020",   angle: 140 },
  { name: "Orchidee",    from: "#DA70D6", to: "#8B008B",   bg: "#3A003A",   angle: 135 },
  { name: "Flamant",     from: "#FF69B4", to: "#C2185B",   bg: "#6A0033",   angle: 130 },
  // Violet (5)
  { name: "Prune",       from: "#4A1A6B", to: "#1A0A2E",   bg: "#1A0A2E",   angle: 135 },
  { name: "Amethyste",   from: "#9B59B6", to: "#4A1A6B",   bg: "#2A0A3A",   angle: 140 },
  { name: "Mauve",       from: "#8B5E8B", to: "#3A1A3A",   bg: "#2A0A2A",   angle: 135 },
  { name: "Indigo",      from: "#3F51B5", to: "#1A1A6B",   bg: "#0A0A3A",   angle: 150 },
  { name: "Lavande s.",  from: "#7B68EE", to: "#3A2A8B",   bg: "#1A0A5A",   angle: 140 },
  // Electriques (5)
  { name: "Neon vert",   from: "#00F5A0", to: "#005533",   bg: "#0A1A10",   angle: 135 },
  { name: "Electrique",  from: "#007AFF", to: "#0A1A3A",   bg: "#0A1A3A",   angle: 145 },
  { name: "Cyber",       from: "#00FFCC", to: "#003344",   bg: "#001A22",   angle: 140 },
  { name: "Aurora",      from: "#00F5A0", to: "#007AFF",   bg: "#001A3A",   angle: 135 },
  { name: "Neon violet", from: "#BF5FFF", to: "#6600CC",   bg: "#2A0055",   angle: 140 },
  // Clairs doux (5)
  { name: "Ivoire",      from: "#FFFFFF", to: "#F0EBE3",   bg: "#F0EBE3",   angle: 160 },
  { name: "Creme",       from: "#FFFBF0", to: "#F4EDD8",   bg: "#F4EDD8",   angle: 135 },
  { name: "Blush",       from: "#FFE8E0", to: "#F0D8D0",   bg: "#F0D8D0",   angle: 135 },
  { name: "Sage clair",  from: "#E8F4E4", to: "#D4E8D0",   bg: "#D4E8D0",   angle: 145 },
  { name: "Ciel pale",   from: "#EDF5FF", to: "#D4E4F0",   bg: "#D4E4F0",   angle: 150 },
  // Pastels doux (5)
  { name: "Lavande",     from: "#EDE8F8", to: "#D8D0E8",   bg: "#D8D0E8",   angle: 135 },
  { name: "Rose pale",   from: "#FFE0EE", to: "#F0C4DA",   bg: "#F0C4DA",   angle: 135 },
  { name: "Peche",       from: "#FFD4B2", to: "#F0B8A0",   bg: "#F0B8A0",   angle: 130 },
  { name: "Menthe pale", from: "#D0F5EA", to: "#B0E8D4",   bg: "#B0E8D4",   angle: 135 },
  { name: "Baby blue",   from: "#D0E8FF", to: "#B0CCEE",   bg: "#B0CCEE",   angle: 145 },
];

// Feature 4+5 — buildStrip async with logo + text2
async function buildStrip(
  from: string, to: string, angle: number,
  text = "", textColor = "#FFFFFF",
  textSize: "s"|"m"|"l" = "m",
  textPos: "bl"|"bc"|"br"|"c" = "bl",
  font: "sans"|"serif"|"mono" = "sans",
  text2 = "",
  text2Size: "s"|"m"|"l" = "s",
  logoUrl?: string,
): Promise<string> {
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

  // Feature 4 — Logo en bas à gauche
  if (logoUrl) {
    try {
      const logoImg = new Image();
      logoImg.src = logoUrl;
      await new Promise<void>((resolve, reject) => {
        logoImg.onload = () => resolve();
        logoImg.onerror = () => reject();
        // Timeout fallback
        setTimeout(resolve, 2000);
      });
      const logoZoneH = 60;
      const maxLogoH = 50;
      const pad = 20;
      const logoRatio = logoImg.width / (logoImg.height || 1);
      const logoH = Math.min(maxLogoH, logoImg.height);
      const logoW = logoH * logoRatio;
      const logoY = H - logoZoneH + (logoZoneH - logoH) / 2;
      ctx.drawImage(logoImg, pad, logoY, logoW, logoH);
    } catch {
      // silently fail
    }
  }

  // Feature 5 — Texte ligne 1 + ligne 2
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

    // Ligne 2
    if (text2) {
      const sz2 = text2Size === "s" ? 26 : text2Size === "m" ? 36 : 50;
      ctx.font = `500 ${sz2}px ${fontFamily}`;
      ctx.fillStyle = textColor;
      ctx.globalAlpha = 0.8;
      const y2 = textPos === "c" ? H / 2 + sz * 0.35 + sz2 + 8 : H - pad + sz2 + 8;
      ctx.fillText(text2, x, y2);
      ctx.globalAlpha = 1;
    }
  }

  return canvas.toDataURL("image/jpeg", 0.92);
}

function downloadStrip(dataUrl: string, filename: string) {
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = filename;
  a.click();
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

// Feature 6 — resize maintaining aspect ratio (for raw upload)
async function resizeImageRaw(file: File, maxW: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const ratio = Math.min(maxW / img.width, 1);
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * ratio);
      canvas.height = Math.round(img.height * ratio);
      canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL("image/jpeg", 0.92));
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
      <div style={{ display: "grid", gridTemplateColumns: "repeat(9, 22px)", gap: 4 }}>
        {presets.map(c => (
          <button key={c} onClick={() => onChange(c)} style={{
            width: 22, height: 22, borderRadius: 5,
            background: c,
            border: value === c ? "2px solid var(--accent)" : "1px solid rgba(128,128,128,0.25)",
            cursor: "pointer", padding: 0,
            boxShadow: (c === "#FFFFFF" || c.toUpperCase() === "#FAFAFA" || c.toUpperCase() === "#F5F5F5") ? "inset 0 0 0 1px rgba(0,0,0,0.08)" : undefined,
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
