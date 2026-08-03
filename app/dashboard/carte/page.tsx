"use client";

import { useAuth } from "@/lib/auth-context";
import { useState } from "react";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

const ICONES = ["☕","🌸","✂️","🍕","🍣","💇","💪","🛒","🌿","⭐","🎯","🏆","🎁","💈","🧁"];

export default function CartePage() {
  const { user, marchand } = useAuth();
  const [config, setConfig] = useState({
    nom:                marchand?.nom || "",
    icone_tampons:      marchand?.icone_tampons || "⭐",
    couleur_principale: marchand?.couleur_principale || "#007AFF",
    couleur_secondaire: marchand?.couleur_secondaire || "#005EC4",
    objectif_tampons:   marchand?.objectif_tampons || 10,
    nom_recompense:     marchand?.nom_recompense || "Récompense offerte",
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  if (!marchand || !user) return null;

  async function sauvegarder() {
    setSaving(true);
    await updateDoc(doc(db, "marchands", user!.uid), { ...config, updated_at: serverTimestamp() });
    setSaving(false); setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  const set = (k: string, v: string | number) => setConfig(c => ({ ...c, [k]: v }));

  return (
    <div className="px-5 md:px-8 lg:px-10 pt-8 lg:pt-10 pb-28 md:pb-10">

      {/* Header */}
      <div className="mb-6">
        <p className="text-[12px] font-semibold uppercase tracking-widest mb-1" style={{ color: "var(--fg-tertiary)" }}>
          Personnalisation
        </p>
        <h1 className="text-[28px] font-semibold tracking-[-0.5px]" style={{ color: "var(--fg)" }}>Ma carte</h1>
      </div>

      <div className="lg:grid lg:grid-cols-2 lg:gap-8 lg:items-start">

        {/* Aperçu — sticky sur desktop */}
        <div className="mb-6 lg:mb-0 lg:sticky lg:top-10">
          <div
            className="rounded-3xl p-6 select-none"
            style={{
              background: `linear-gradient(135deg, ${config.couleur_principale}, ${config.couleur_secondaire})`,
              boxShadow: "0 20px 60px rgba(0,0,0,0.18)",
            }}
          >
            <div className="flex items-start justify-between mb-8">
              <div>
                <p className="text-white/50 text-[10px] font-semibold uppercase tracking-widest mb-1">Fidélité</p>
                <p className="text-white text-[18px] font-semibold tracking-tight">
                  {config.nom || "Nom de l'établissement"}
                </p>
              </div>
              <span className="text-2xl">{config.icone_tampons}</span>
            </div>

            {/* Tampons */}
            <div className="flex flex-wrap gap-2 mb-8">
              {Array.from({ length: Math.min(config.objectif_tampons, 12) }).map((_, i) => (
                <div
                  key={i}
                  className="w-7 h-7 rounded-full flex items-center justify-center text-sm"
                  style={{ background: i < 3 ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.18)" }}
                >
                  {i < 3 ? config.icone_tampons : ""}
                </div>
              ))}
              {config.objectif_tampons > 12 && (
                <span className="text-white/40 text-xs self-center">+{config.objectif_tampons - 12}</span>
              )}
            </div>

            <div>
              <p className="text-white/40 text-[10px] font-semibold uppercase tracking-widest">Récompense</p>
              <p className="text-white text-[13px] font-medium mt-0.5">{config.nom_recompense}</p>
            </div>
          </div>
        </div>

        {/* Éditeur */}
        <div className="space-y-5">

          <Field label="Nom de l'établissement">
            <input
              type="text"
              value={config.nom}
              onChange={e => set("nom", e.target.value)}
              placeholder="Ex : Café du Centre"
              className="w-full px-4 py-3.5 rounded-2xl text-[14px] outline-none transition-all"
              style={{ background: "var(--glass-bg)", border: "1px solid var(--border)", color: "var(--fg)" }}
              onFocus={e => (e.target.style.borderColor = "var(--accent)")}
              onBlur={e => (e.target.style.borderColor = "var(--border)")}
            />
          </Field>

          <Field label="Récompense">
            <input
              type="text"
              value={config.nom_recompense}
              onChange={e => set("nom_recompense", e.target.value)}
              className="w-full px-4 py-3.5 rounded-2xl text-[14px] outline-none transition-all"
              style={{ background: "var(--glass-bg)", border: "1px solid var(--border)", color: "var(--fg)" }}
              onFocus={e => (e.target.style.borderColor = "var(--accent)")}
              onBlur={e => (e.target.style.borderColor = "var(--border)")}
            />
          </Field>

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

          <Field label="Couleurs">
            <div className="grid grid-cols-2 gap-3">
              {([["couleur_principale", "Principale"], ["couleur_secondaire", "Secondaire"]] as const).map(([key, label]) => (
                <div
                  key={key}
                  className="rounded-2xl p-3.5 flex items-center gap-3"
                  style={{ background: "var(--glass-bg)", border: "1px solid var(--border)" }}
                >
                  <div className="relative flex-shrink-0">
                    <div className="w-9 h-9 rounded-xl" style={{ background: config[key] }} />
                    <input
                      type="color"
                      value={config[key]}
                      onChange={e => set(key, e.target.value)}
                      className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                    />
                  </div>
                  <div>
                    <p className="text-[11px]" style={{ color: "var(--fg-tertiary)" }}>{label}</p>
                    <p className="text-[11px] font-mono" style={{ color: "var(--fg)" }}>{config[key]}</p>
                  </div>
                </div>
              ))}
            </div>
          </Field>

          <Field label="Icône">
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

          <button
            onClick={sauvegarder}
            disabled={saving}
            className="w-full py-4 rounded-2xl text-[15px] font-semibold text-white transition-all duration-300"
            style={{ background: saved ? "#34C759" : "var(--accent)", boxShadow: "0 4px 20px rgba(0,122,255,0.2)" }}
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
