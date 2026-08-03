"use client";

import { useAuth } from "@/lib/auth-context";
import { useRef, useState } from "react";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "@/lib/firebase";

const ICONES = ["☕","🌸","✂️","🍕","🍣","💇","💪","🛒","🌿","⭐","🎯","🏆","🎁","💈","🧁"];

const PALETTES = [
  { label: "Noir",     p: "#0A0A0A", s: "#1A1A1A" },
  { label: "Marine",   p: "#0D2240", s: "#1A3A6E" },
  { label: "Bordeaux", p: "#5C0F1F", s: "#8A1A30" },
  { label: "Forêt",    p: "#0F3020", s: "#1A5E3A" },
  { label: "Bleu",     p: "#005CC4", s: "#0070F3" },
  { label: "Ardoise",  p: "#2C3E50", s: "#3D5166" },
  { label: "Sable",    p: "#F5ECD5", s: "#EBD9BB" },
  { label: "Blanc",    p: "#FFFFFF", s: "#F4F4F4" },
];

function isLight(hex: string): boolean {
  const h = hex.replace("#", "");
  if (h.length < 6) return false;
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 145;
}

export default function CartePage() {
  const { user, marchand } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);

  const [config, setConfig] = useState({
    nom:                marchand?.nom || "",
    icone_tampons:      marchand?.icone_tampons || "⭐",
    couleur_principale: marchand?.couleur_principale || "#0A0A0A",
    couleur_secondaire: marchand?.couleur_secondaire || "#1A1A1A",
    objectif_tampons:   marchand?.objectif_tampons || 10,
    nom_recompense:     marchand?.nom_recompense || "Récompense offerte",
    logo_url:           (marchand?.logo_url as string) || "",
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  if (!marchand || !user) return null;

  const set = <K extends keyof typeof config>(k: K, v: typeof config[K]) =>
    setConfig(c => ({ ...c, [k]: v }));

  const light = isLight(config.couleur_principale);
  const fg = light ? "#0A0A0A" : "#FFFFFF";
  const fgMuted = light ? "rgba(0,0,0,0.45)" : "rgba(255,255,255,0.45)";
  const fgLabel = light ? "rgba(0,0,0,0.35)" : "rgba(255,255,255,0.35)";
  const divider = light ? "rgba(0,0,0,0.1)" : "rgba(255,255,255,0.1)";

  async function sauvegarder() {
    setSaving(true);
    await updateDoc(doc(db, "marchands", user!.uid), { ...config, updated_at: serverTimestamp() });
    setSaving(false); setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploadingLogo(true);
    try {
      const r = storageRef(storage, `logos/${user.uid}`);
      await uploadBytes(r, file);
      const url = await getDownloadURL(r);
      set("logo_url", url);
      await updateDoc(doc(db, "marchands", user.uid), { logo_url: url });
    } finally {
      setUploadingLogo(false);
    }
  }

  // Sample data for preview
  const PREVIEW_TAMPONS = Math.min(Math.floor(config.objectif_tampons * 0.6), config.objectif_tampons);

  return (
    <div className="px-5 md:px-8 lg:px-10 pt-8 lg:pt-10 pb-28 md:pb-10">

      {/* Header */}
      <div className="mb-6">
        <p className="text-[12px] font-semibold uppercase tracking-widest mb-1" style={{ color: "var(--fg-tertiary)" }}>
          Carte de fidélité
        </p>
        <h1 className="text-[28px] font-semibold tracking-[-0.5px]" style={{ color: "var(--fg)" }}>Ma carte</h1>
      </div>

      <div className="lg:grid lg:grid-cols-2 lg:gap-10 lg:items-start">

        {/* ── Preview Apple Wallet ── */}
        <div className="mb-8 lg:mb-0 lg:sticky lg:top-10">
          <p className="text-[11px] font-semibold uppercase tracking-widest mb-3" style={{ color: "var(--fg-tertiary)" }}>
            Aperçu Apple Wallet
          </p>

          {/* iPhone frame hint */}
          <div className="rounded-[32px] p-3 inline-block w-full"
            style={{ background: "var(--glass-bg)", border: "1px solid var(--border)", boxShadow: "var(--shadow-lg)" }}>

            {/* Card */}
            <div className="rounded-[22px] overflow-hidden select-none"
              style={{
                background: config.couleur_principale,
                boxShadow: `0 16px 48px ${config.couleur_principale}66`,
              }}>

              {/* Header row */}
              <div className="flex items-center gap-3 px-5 py-4"
                style={{ borderBottom: `1px solid ${divider}` }}>
                {/* Logo */}
                <div className="w-9 h-9 rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center"
                  style={{ background: fgMuted }}>
                  {config.logo_url ? (
                    <img src={config.logo_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-[16px] font-bold" style={{ color: config.couleur_principale }}>
                      {(config.nom?.[0] || "W").toUpperCase()}
                    </span>
                  )}
                </div>
                <span className="flex-1 text-[14px] font-semibold truncate" style={{ color: fg }}>
                  {config.nom || "Nom de l'établissement"}
                </span>
                <span className="text-[9px] font-bold px-2 py-1 rounded-full"
                  style={{ background: divider, color: fgMuted, letterSpacing: "0.08em" }}>
                  WALLIO
                </span>
              </div>

              {/* Stamps area */}
              <div className="px-5 pt-5 pb-4">
                <div className="flex flex-wrap gap-2 mb-4">
                  {Array.from({ length: Math.min(config.objectif_tampons, 12) }).map((_, i) => (
                    <div
                      key={i}
                      className="w-7 h-7 rounded-full flex items-center justify-center text-[13px] transition-all"
                      style={{
                        background: i < PREVIEW_TAMPONS ? fg : divider,
                        fontSize: i < PREVIEW_TAMPONS ? 13 : 0,
                      }}
                    >
                      {i < PREVIEW_TAMPONS ? config.icone_tampons : ""}
                    </div>
                  ))}
                  {config.objectif_tampons > 12 && (
                    <span className="text-[11px] self-center" style={{ color: fgMuted }}>
                      +{config.objectif_tampons - 12}
                    </span>
                  )}
                </div>

                {/* Fields */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[9px] font-semibold uppercase tracking-wider mb-0.5" style={{ color: fgLabel }}>
                      Tampons
                    </p>
                    <p className="text-[20px] font-semibold leading-none" style={{ color: fg }}>
                      {PREVIEW_TAMPONS}
                      <span className="text-[13px] font-normal" style={{ color: fgMuted }}>
                        /{config.objectif_tampons}
                      </span>
                    </p>
                  </div>
                  <div>
                    <p className="text-[9px] font-semibold uppercase tracking-wider mb-0.5" style={{ color: fgLabel }}>
                      Récompense
                    </p>
                    <p className="text-[13px] font-medium leading-tight" style={{ color: fg }}>
                      {config.nom_recompense || "—"}
                    </p>
                  </div>
                </div>
              </div>

              {/* QR code hint */}
              <div className="px-5 py-3.5 flex items-center justify-center gap-0.5"
                style={{ borderTop: `1px solid ${divider}` }}>
                {[3,1,4,2,3,1,2,4,1,3,2,1,4,2,3,1,2].map((h, i) => (
                  <div key={i} className="rounded-[1px]"
                    style={{ width: 2, height: h * 4, background: fg, opacity: 0.5 }} />
                ))}
                <div className="mx-2 w-12 h-12 flex-shrink-0"
                  style={{ background: divider, borderRadius: 4 }}>
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="grid grid-cols-3 gap-0.5 p-1">
                      {Array.from({length: 9}).map((_,i) => (
                        <div key={i} className="rounded-[1px]"
                          style={{ width: 3, height: 3, background: i !== 4 ? fg : "transparent", opacity: 0.6 }} />
                      ))}
                    </div>
                  </div>
                </div>
                {[2,4,1,3,2,4,1,2,3,1,4,2,1,3,2,4,1].map((h, i) => (
                  <div key={i} className="rounded-[1px]"
                    style={{ width: 2, height: h * 4, background: fg, opacity: 0.5 }} />
                ))}
              </div>
            </div>
          </div>

          <p className="text-[12px] mt-3 text-center" style={{ color: "var(--fg-tertiary)" }}>
            Aperçu indicatif — la carte réelle sera générée lors de l&apos;ajout dans Apple Wallet
          </p>
        </div>

        {/* ── Éditeur ── */}
        <div className="space-y-6">

          {/* Logo */}
          <Field label="Logo de l'établissement">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl overflow-hidden flex-shrink-0 flex items-center justify-center"
                style={{ background: "var(--glass-bg)", border: "1px solid var(--border)" }}>
                {config.logo_url ? (
                  <img src={config.logo_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span style={{ color: "var(--fg-tertiary)", fontSize: 22 }}>📷</span>
                )}
              </div>
              <div className="flex-1">
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleLogoUpload}
                />
                <button
                  onClick={() => fileRef.current?.click()}
                  disabled={uploadingLogo}
                  className="w-full py-2.5 rounded-2xl text-[13px] font-medium"
                  style={{ background: "var(--glass-bg)", border: "1px solid var(--border)", color: "var(--fg)" }}
                >
                  {uploadingLogo ? "Upload…" : config.logo_url ? "Changer le logo" : "Ajouter un logo"}
                </button>
                {config.logo_url && (
                  <button
                    onClick={() => set("logo_url", "")}
                    className="w-full mt-1.5 py-1.5 rounded-xl text-[12px]"
                    style={{ color: "#FF3B30" }}
                  >
                    Supprimer
                  </button>
                )}
              </div>
            </div>
          </Field>

          {/* Palette */}
          <Field label="Couleur de la carte">
            <div className="grid grid-cols-4 gap-2 mb-3">
              {PALETTES.map(palette => (
                <button
                  key={palette.label}
                  onClick={() => { set("couleur_principale", palette.p); set("couleur_secondaire", palette.s); }}
                  className="rounded-2xl overflow-hidden"
                  style={{
                    outline: config.couleur_principale === palette.p ? `2px solid var(--accent)` : "none",
                    outlineOffset: 2,
                  }}
                >
                  <div className="h-10 w-full" style={{ background: palette.p }} />
                  <div className="py-1 text-[10px] font-medium" style={{ background: "var(--glass-bg)", color: "var(--fg-tertiary)" }}>
                    {palette.label}
                  </div>
                </button>
              ))}
            </div>
            {/* Custom pickers */}
            <div className="grid grid-cols-2 gap-2">
              {([["couleur_principale", "Principale"], ["couleur_secondaire", "Secondaire"]] as const).map(([key, label]) => (
                <div key={key} className="rounded-2xl p-3 flex items-center gap-3"
                  style={{ background: "var(--glass-bg)", border: "1px solid var(--border)" }}>
                  <div className="relative flex-shrink-0">
                    <div className="w-8 h-8 rounded-xl" style={{ background: config[key] }} />
                    <input
                      type="color"
                      value={config[key]}
                      onChange={e => set(key, e.target.value)}
                      className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                    />
                  </div>
                  <div>
                    <p className="text-[10px]" style={{ color: "var(--fg-tertiary)" }}>{label}</p>
                    <p className="text-[11px] font-mono" style={{ color: "var(--fg)" }}>{config[key]}</p>
                  </div>
                </div>
              ))}
            </div>
          </Field>

          {/* Nom */}
          <Field label="Nom de l'établissement">
            <input
              type="text"
              value={config.nom}
              onChange={e => set("nom", e.target.value)}
              placeholder="Ex : Café du Centre"
              className="w-full px-4 py-3.5 rounded-2xl text-[14px] outline-none"
              style={{ background: "var(--glass-bg)", border: "1px solid var(--border)", color: "var(--fg)" }}
              onFocus={e => (e.target.style.borderColor = "var(--accent)")}
              onBlur={e => (e.target.style.borderColor = "var(--border)")}
            />
          </Field>

          {/* Récompense */}
          <Field label="Nom de la récompense">
            <input
              type="text"
              value={config.nom_recompense}
              onChange={e => set("nom_recompense", e.target.value)}
              placeholder="Ex : 1 café offert"
              className="w-full px-4 py-3.5 rounded-2xl text-[14px] outline-none"
              style={{ background: "var(--glass-bg)", border: "1px solid var(--border)", color: "var(--fg)" }}
              onFocus={e => (e.target.style.borderColor = "var(--accent)")}
              onBlur={e => (e.target.style.borderColor = "var(--border)")}
            />
          </Field>

          {/* Objectif */}
          <Field label={`Nombre de tampons — ${config.objectif_tampons}`}>
            <input
              type="range" min={3} max={20} value={config.objectif_tampons}
              onChange={e => set("objectif_tampons", Number(e.target.value))}
              className="w-full mt-1" style={{ accentColor: "var(--accent)" }}
            />
            <div className="flex justify-between mt-1">
              <span className="text-[11px]" style={{ color: "var(--fg-tertiary)" }}>3</span>
              <span className="text-[11px]" style={{ color: "var(--fg-tertiary)" }}>20</span>
            </div>
          </Field>

          {/* Icône */}
          <Field label="Icône des tampons">
            <div className="flex flex-wrap gap-2">
              {ICONES.map(ic => (
                <button
                  key={ic}
                  onClick={() => set("icone_tampons", ic)}
                  className="w-11 h-11 rounded-2xl text-xl flex items-center justify-center transition-all duration-150"
                  style={{
                    background: config.icone_tampons === ic ? "var(--accent)" : "var(--glass-bg)",
                    border: `1px solid ${config.icone_tampons === ic ? "var(--accent)" : "var(--border)"}`,
                    transform: config.icone_tampons === ic ? "scale(1.08)" : "scale(1)",
                  }}
                >
                  {ic}
                </button>
              ))}
            </div>
          </Field>

          {/* Save */}
          <button
            onClick={sauvegarder}
            disabled={saving}
            className="w-full py-4 rounded-2xl text-[15px] font-semibold text-white transition-all duration-300"
            style={{
              background: saved ? "#34C759" : "var(--accent)",
              boxShadow: "0 4px 20px rgba(0,122,255,0.2)",
            }}
          >
            {saving ? "Sauvegarde…" : saved ? "Sauvegardé ✓" : "Sauvegarder"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[11px] font-semibold uppercase tracking-widest mb-2.5" style={{ color: "var(--fg-tertiary)" }}>
        {label}
      </label>
      {children}
    </div>
  );
}
