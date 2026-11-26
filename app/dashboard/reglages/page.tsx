"use client";

import { useAuth } from "@/lib/auth-context";
import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { saveMarchandFields } from "@/lib/save-marchand";
import { useLang } from "@/lib/lang-context";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";
import { getAuth, signOut } from "firebase/auth";
import { haptic, HAPTICS_KEY, isHapticsEnabled } from "@/lib/haptics";
import Link from "next/link";

async function getIdToken(): Promise<string> {
  const u = getAuth().currentUser;
  return u ? u.getIdToken() : "";
}

const cap = (s: string) => s ? s.charAt(0).toUpperCase() + s.slice(1) : s;

const FUSEAUX = ["Africa/Casablanca","Europe/Madrid","Europe/Paris","Europe/London","America/New_York","Asia/Dubai"];

// ── Helpers UI ───────────────────────────────────────────────────────────────

function SectionLabel({ title, first, id }: { title: string; first?: boolean; id?: string }) {
  return (
    <p id={id} className={`text-[11px] font-semibold uppercase tracking-widest px-1 mb-2 ${first ? "mt-0" : "mt-6"}`}
      style={{ color: "var(--fg-tertiary)", scrollMarginTop: "80px" }}>
      {title}
    </p>
  );
}

function IosCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: "var(--glass-bg)", border: "1px solid var(--border)" }}>
      {children}
    </div>
  );
}

function IosRow({ label, right, last, onPress }: { label: React.ReactNode; right?: React.ReactNode; last?: boolean; onPress?: () => void }) {
  const Tag = onPress ? "button" : "div";
  return (
    <Tag onClick={onPress} className="w-full flex items-center justify-between px-5 py-4 text-left"
      style={{ borderBottom: last ? "none" : "1px solid var(--border)", background: "transparent" }}>
      <span className="text-[15px]" style={{ color: "var(--fg)" }}>{label}</span>
      {right && <span className="flex items-center gap-1.5" style={{ color: "var(--fg-tertiary)" }}>{right}</span>}
    </Tag>
  );
}

function Stepper({ value, onChange, min = 1, max = 100 }: { value: number; onChange: (n: number) => void; min?: number; max?: number }) {
  return (
    <div className="flex items-center gap-3">
      <button onClick={() => onChange(Math.max(min, value - 1))} disabled={value <= min}
        className="w-8 h-8 rounded-full flex items-center justify-center text-[20px] font-light transition-all"
        style={{ background: "var(--bg)", border: "1px solid var(--border)", color: value <= min ? "var(--border)" : "var(--fg-secondary)", lineHeight: 1 }}>
        −
      </button>
      <span className="text-[17px] font-semibold" style={{ minWidth: 28, textAlign: "center", color: "var(--accent)", fontVariantNumeric: "tabular-nums" }}>
        {value}
      </span>
      <button onClick={() => onChange(Math.min(max, value + 1))} disabled={value >= max}
        className="w-8 h-8 rounded-full flex items-center justify-center text-[20px] font-light transition-all"
        style={{ background: "var(--bg)", border: "1px solid var(--border)", color: value >= max ? "var(--border)" : "var(--fg-secondary)", lineHeight: 1 }}>
        +
      </button>
    </div>
  );
}

function SegmentedControl({ options, value, onChange }: { options: { label: string; value: string }[]; value: string; onChange: (v: string) => void }) {
  return (
    <div style={{ display: "flex", background: "rgba(0,0,0,0.06)", borderRadius: 10, padding: 2 }}>
      {options.map(opt => (
        <button key={opt.value} onClick={() => onChange(opt.value)}
          className="flex-1 transition-all"
          style={{ padding: "7px 4px", borderRadius: 8, fontSize: 13, fontWeight: value === opt.value ? 600 : 400, background: value === opt.value ? "#FFFFFF" : "transparent", color: value === opt.value ? "var(--fg)" : "var(--fg-tertiary)", border: "none", cursor: "pointer", boxShadow: value === opt.value ? "0 1px 4px rgba(0,0,0,0.12)" : "none" }}>
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button onClick={() => onChange(!value)}
      className="relative w-11 h-6 rounded-full transition-all duration-200 flex-shrink-0"
      style={{ background: value ? "#9E8BD6" : "var(--border)" }}>
      <div className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-all duration-200"
        style={{ left: value ? "calc(100% - 22px)" : "2px" }} />
    </button>
  );
}

function ChevronRight() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M9 18l6-6-6-6"/>
    </svg>
  );
}

// ── Page principale ───────────────────────────────────────────────────────────

export default function ReglagesPage() {
  const { user, marchand } = useAuth();
  const { t, setLang } = useLang();

  const ANTI_DOUBLON = [
    { label: t.settings_anti_doublon_off, value: 0 },
    { label: t.settings_anti_doublon_15m, value: 900 },
    { label: t.settings_anti_doublon_1h,  value: 3600 },
    { label: t.settings_anti_doublon_4h,  value: 14400 },
    { label: t.settings_anti_doublon_8h,  value: 28800 },
    { label: t.settings_anti_doublon_1d,  value: 86400 },
    { label: t.settings_anti_doublon_7d,  value: 86400 * 7 },
    { label: t.settings_anti_doublon_10d, value: 86400 * 10 },
    { label: t.settings_anti_doublon_14d, value: 86400 * 14 },
  ];

  const autoRaw = (marchand as Record<string, unknown>)?.automatisations as Record<string, Record<string, unknown>> | undefined;
  const m = marchand as Record<string, unknown>;

  const [nomEtablissement, setNomEtablissement] = useState(marchand?.nom || "");
  const [objectif, setObjectif] = useState(marchand?.objectif_tampons || 10);
  const [nomRecompense, setNomRecompense] = useState(marchand?.nom_recompense || "");
  const [modeRecompense, setModeRecompense] = useState<"cyclique" | "progressif" | "flex">(
    ((m?.mode_recompense as "cyclique" | "progressif" | "flex") || "cyclique")
  );
  const [palierIntermediaire, setPalierIntermediaire] = useState<number>((m?.palier_intermediaire as number) || 5);
  const [nomRecompensePetit, setNomRecompensePetit] = useState<string>((m?.nom_recompense_petit as string) || "");
  const [nomRecompenseGrand, setNomRecompenseGrand] = useState<string>((m?.nom_recompense_grand as string) || "");
  const [confirmModeChange, setConfirmModeChange] = useState<"cyclique" | "progressif" | "flex" | null>(null);
  const [paliers, setPaliers] = useState<{ tampons: number; recompense: string }[]>(
    ((m?.paliers as { tampons: number; recompense: string }[]) || [{ tampons: 5, recompense: "" }, { tampons: 10, recompense: "" }])
  );
  const [config, setConfig] = useState({
    anti_doublon_delai: marchand?.anti_doublon_delai ?? 86400,
    fuseau_horaire: marchand?.fuseau_horaire || Intl.DateTimeFormat().resolvedOptions().timeZone,
  });
  const [auto, setAuto] = useState({
    anniversaire_actif:   Boolean(autoRaw?.anniversaire?.actif),
    anniversaire_jours_avant: Number(autoRaw?.anniversaire?.jours_avant ?? 0),
    anniversaire_message: String(autoRaw?.anniversaire?.message ?? `${t.settings_birthday_msg_default} ${marchand?.nom || "nous"}.`),
    anniversaire_type:    String((autoRaw?.anniversaire as Record<string,unknown>)?.type ?? "double") as "double" | "custom",
    anniversaire_offre:   String((autoRaw?.anniversaire as Record<string,unknown>)?.offre ?? ""),
    relance_actif:        Boolean(autoRaw?.relance?.actif),
    relance_delai_jours:  Number(autoRaw?.relance?.delai_jours ?? 30),
    relance_message:      String(autoRaw?.relance?.message ?? `${t.settings_relance_msg_default} ${marchand?.nom || "nous"}.`),
  });
  const [notifActif, setNotifActif] = useState<boolean>((m?.notif_actif !== false));
  const [notifMessage, setNotifMessage] = useState<string>(
    ((m?.notif_message as string) || `${t.settings_notif_msg_default} ${marchand?.nom || "nous"}, ${t.settings_notif_msg_default2}`)
  );
  const doubleFin = m.double_tampons_fin as string | undefined;
  const [doubleTamponsActif, setDoubleTamponsActif] = useState<boolean>(doubleFin ? new Date(doubleFin) > new Date() : false);
  const [doubleTamponsFin, setDoubleTamponsFin] = useState<string>(doubleFin ?? new Date(Date.now() + 86400000 * 2).toISOString().slice(0, 10));
  const [parrainageActif, setParrainageActif] = useState<boolean>(!!(m?.parrainage_actif));
  const [langue, setLangue] = useState<"fr" | "ro" | "es">((m?.langue as "fr" | "ro" | "es") || "fr");
  const [hapticsOn, setHapticsOn] = useState(isHapticsEnabled);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  const mark = () => setIsDirty(true);

  // Option C : vue focalisée sur une section (depuis le hub Compte via ?section=…).
  // Sans paramètre (desktop/iPad via sidebar) → tout s'affiche.
  const section = useMemo(() => (typeof window === "undefined" ? null : new URLSearchParams(window.location.search).get("section")), []);
  const showG = (g: string) => !section || section === g;
  const sectionTitle = section === "programme" ? "Programme de fidélité"
    : section === "etablissement" ? "Établissement"
    : section === "engagement" ? "Engagement clients"
    : t.settings_title;

  if (!marchand || !user) return null;

  const set = (k: string, v: string | number) => { setConfig(c => ({ ...c, [k]: v })); mark(); };
  const setA = (k: string, v: boolean | number | string) => { setAuto(a => ({ ...a, [k]: v })); mark(); };

  const antiDoublonLabel = ANTI_DOUBLON.find(o => o.value === config.anti_doublon_delai)?.label ?? "—";
  const langueLabel = langue === "fr" ? "Français" : langue === "ro" ? "Română" : "Español";

  async function sauvegarder() {
    if (modeRecompense === "progressif") {
      const ok = paliers.filter(p => p.recompense.trim());
      if (ok.length === 0) { alert("Ajoutez au moins un palier avec une récompense."); return; }
    }
    if (modeRecompense === "flex") {
      if (palierIntermediaire < 2 || palierIntermediaire >= objectif) {
        alert(`Le palier intermédiaire doit être entre 2 et ${objectif - 1}.`); return;
      }
      if (!nomRecompensePetit.trim() || !nomRecompenseGrand.trim()) {
        alert("Renseignez les deux récompenses."); return;
      }
    }
    setSaving(true);
    try {
      await saveMarchandFields(user!, {
        nom: nomEtablissement,
        objectif_tampons: objectif,
        nom_recompense: nomRecompense,
        mode_recompense: modeRecompense,
        paliers: modeRecompense === "progressif"
          ? paliers.filter(p => p.recompense.trim()).map(p => ({ ...p, tampons: Math.min(p.tampons, objectif) }))
          : [],
        ...(modeRecompense === "flex" ? { palier_intermediaire: palierIntermediaire, nom_recompense_petit: nomRecompensePetit.trim(), nom_recompense_grand: nomRecompenseGrand.trim() } : {}),
        ...config,
        automatisations: {
          anniversaire: { actif: auto.anniversaire_actif, jours_avant: 0, message: auto.anniversaire_message, type: auto.anniversaire_type, offre: auto.anniversaire_offre },
          relance: { actif: auto.relance_actif, delai_jours: auto.relance_delai_jours, message: auto.relance_message },
        },
        notif_actif: notifActif,
        notif_message: notifMessage,
        double_tampons_fin: doubleTamponsActif ? doubleTamponsFin : null,
        parrainage_actif: parrainageActif,
        langue,
      });
      setLang(langue);
      setSaved(true);
      setIsDirty(false);
      haptic("success");
      setTimeout(() => setSaved(false), 2500);
      getDocs(query(collection(db, "clients"), where("marchand_id", "==", user!.uid))).then(snap => {
        snap.docs.forEach(d => {
          const wt = d.data().wallet_type;
          if (wt !== "apple" && wt !== "google") return;
          const wid = d.data().wallet_id as string;
          const body = JSON.stringify({ walletId: wid });
          const opts = { method: "POST", headers: { "Content-Type": "application/json" }, body };
          fetch("/api/apple-wallet/push-update", opts).catch(() => {});
          fetch("/api/google-wallet/push-update", opts).catch(() => {});
        });
      }).catch(() => {});
    } catch (err) {
      alert(`Erreur : ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={`px-5 md:px-8 lg:px-10 max-w-2xl ${isDirty ? "pb-36 md:pb-28" : "pb-16"}`} style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 24px)" }}>

      {/* Saved indicator */}
      {saved && (
        <div style={{ position: "fixed", top: "calc(env(safe-area-inset-top, 0px) + 12px)", left: "50%", transform: "translateX(-50%)", zIndex: 999, background: "rgba(52,199,89,0.92)", backdropFilter: "blur(12px)", padding: "10px 18px", borderRadius: 100, animation: "toast-in 0.25s ease", whiteSpace: "nowrap" }}>
          <p style={{ color: "white", fontSize: 13, fontWeight: 600 }}>Enregistré</p>
        </div>
      )}

      <Link href="/dashboard/plus" className="md:hidden inline-flex items-center gap-1.5 mb-4 text-[14px]" style={{ color: "var(--accent)", textDecoration: "none" }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M15 18l-6-6 6-6"/></svg>
        Plus
      </Link>
      <h1 className="text-[34px] font-bold tracking-[-1px] mb-6" style={{ color: "var(--fg)" }}>{sectionTitle}</h1>

      {/* ── 1. Établissement ───────────────────────────────────────────────── */}
      {showG("etablissement") && (<>
      <SectionLabel title="Établissement" first id="etablissement" />
      <IosCard>
        <div className="px-5 py-4">
          <input type="text" value={nomEtablissement}
            onChange={e => { setNomEtablissement(e.target.value); mark(); }}
            placeholder={t.settings_name_placeholder}
            className="w-full text-[15px] outline-none bg-transparent"
            style={{ color: "var(--fg)" }}
            onFocus={e => (e.target.style.borderBottom = "1px solid var(--accent)")}
            onBlur={e => (e.target.style.borderBottom = "none")}
          />
        </div>
        <div className="relative overflow-hidden" style={{ borderTop: "1px solid var(--border)" }}>
          <div className="flex items-center justify-between px-5 py-4">
            <span className="text-[15px]" style={{ color: "var(--fg)" }}>Fuseau horaire</span>
            <div className="flex items-center gap-1.5" style={{ color: "var(--fg-tertiary)" }}>
              <span className="text-[14px]">{config.fuseau_horaire}</span>
              <ChevronRight />
            </div>
          </div>
          <select value={config.fuseau_horaire} onChange={e => set("fuseau_horaire", e.target.value)}
            className="absolute inset-0 opacity-0 w-full h-full cursor-pointer">
            {FUSEAUX.map(tz => <option key={tz} value={tz}>{tz}</option>)}
          </select>
        </div>
      </IosCard>

      {/* ── 2. Programme de fidélité ────────────────────────────────────────── */}
      </>)}
      {showG("programme") && (<>
      <SectionLabel title="Programme de fidélité" id="programme" />
      <IosCard>
        {/* Mode selector */}
        <div className="px-5 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
          <SegmentedControl
            options={[{ label: "Cyclique", value: "cyclique" }, { label: "Progressif", value: "progressif" }, { label: "Flex", value: "flex" }]}
            value={modeRecompense}
            onChange={v => {
              const mode = v as "cyclique" | "progressif" | "flex";
              if (mode === modeRecompense) return;
              const ancien = (marchand as Record<string,unknown>)?.mode_recompense as string || "cyclique";
              if (ancien !== mode) setConfirmModeChange(mode);
              else { setModeRecompense(mode); mark(); }
            }}
          />
          <p className="text-[12px] mt-3 transition-all" style={{ color: "var(--fg-tertiary)" }}>
            {modeRecompense === "cyclique" && "Le compteur repart à zéro après chaque récompense."}
            {modeRecompense === "progressif" && "Les tampons s'accumulent. Chaque palier débloque une récompense différente."}
            {modeRecompense === "flex" && "À mi-parcours, le client choisit entre une petite récompense immédiate ou continue pour la grande."}
          </p>
        </div>

        {/* Confirmation changement de mode */}
        {confirmModeChange && (
          <div className="mx-5 my-3 rounded-2xl p-4" style={{ background: "rgba(255,159,10,0.08)", border: "1px solid rgba(255,159,10,0.25)" }}>
            <p className="text-[13px] font-semibold mb-1" style={{ color: "#FF9F0A" }}>Changer de mode ?</p>
            <p className="text-[12px] mb-3" style={{ color: "var(--fg-secondary)" }}>Vos clients conservent leurs tampons. Les paliers validés seront réinitialisés.</p>
            <div className="flex gap-2">
              <button onClick={() => { setModeRecompense(confirmModeChange); setConfirmModeChange(null); mark(); }}
                className="flex-1 py-2 rounded-xl text-[13px] font-semibold text-white" style={{ background: "#FF9F0A" }}>
                Confirmer
              </button>
              <button onClick={() => setConfirmModeChange(null)}
                className="flex-1 py-2 rounded-xl text-[13px] font-semibold"
                style={{ background: "var(--bg)", border: "1px solid var(--border)", color: "var(--fg-secondary)" }}>
                Annuler
              </button>
            </div>
          </div>
        )}

        {/* Cyclique */}
        {modeRecompense === "cyclique" && (<>
          <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
            <span className="text-[15px]" style={{ color: "var(--fg)" }}>Tampons nécessaires</span>
            <Stepper value={objectif} onChange={v => { setObjectif(v); mark(); }} min={3} max={30} />
          </div>
          <div className="px-5 py-4">
            <input type="text" value={nomRecompense}
              onChange={e => { setNomRecompense(cap(e.target.value)); mark(); }}
              placeholder="Nom de la récompense"
              className="w-full text-[15px] outline-none bg-transparent"
              style={{ color: "var(--fg)" }}
              onFocus={e => (e.target.parentElement!.style.borderBottom = "1px solid var(--accent)")}
              onBlur={e => (e.target.parentElement!.style.borderBottom = "none")}
            />
            <p className="text-[12px] mt-1" style={{ color: "var(--fg-tertiary)" }}>ex: Café offert</p>
          </div>
        </>)}

        {/* Progressif */}
        {modeRecompense === "progressif" && (
          <div className="px-5 py-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[14px]" style={{ color: "var(--fg-secondary)" }}>Tampons total — cycle</span>
              <Stepper value={objectif} onChange={v => { setObjectif(v); mark(); }} min={3} max={30} />
            </div>
            <div style={{ borderTop: "1px solid var(--border)", paddingTop: 12 }}>
              {paliers.map((palier, i) => {
                const minVal = i > 0 ? paliers[i - 1].tampons + 1 : 1;
                const maxVal = i < paliers.length - 1 ? paliers[i + 1].tampons - 1 : objectif;
                return (
                  <div key={i} className="flex items-center gap-2 mb-2">
                    <Stepper value={palier.tampons}
                      onChange={v => { setPaliers(prev => prev.map((p, j) => j === i ? { ...p, tampons: v } : p)); mark(); }}
                      min={minVal} max={maxVal} />
                    <input type="text" value={palier.recompense}
                      onChange={e => { setPaliers(prev => prev.map((p, j) => j === i ? { ...p, recompense: cap(e.target.value) } : p)); mark(); }}
                      placeholder="Nom récompense"
                      className="flex-1 px-3 py-2 rounded-xl text-[13px] outline-none"
                      style={{ background: "var(--bg)", border: "1px solid var(--border)", color: "var(--fg)" }} />
                    {paliers.length > 1 && (
                      <button onClick={() => { setPaliers(prev => prev.filter((_, j) => j !== i)); mark(); }}
                        className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ background: "rgba(255,59,48,0.08)", color: "#FF3B30" }}>×</button>
                    )}
                  </div>
                );
              })}
              <button onClick={() => {
                const dernier = paliers.at(-1)?.tampons ?? 0;
                const nouveau = Math.min(objectif, dernier + 3);
                if (nouveau > dernier) { setPaliers(prev => [...prev, { tampons: nouveau, recompense: "" }]); mark(); }
              }} disabled={(paliers.at(-1)?.tampons ?? 0) >= objectif}
                className="w-full py-2 rounded-xl text-[13px] font-medium mt-2"
                style={{ background: "var(--bg)", border: "1px dashed var(--border)", color: "var(--fg-secondary)", opacity: (paliers.at(-1)?.tampons ?? 0) >= objectif ? 0.4 : 1 }}>
                + Ajouter un palier
              </button>
            </div>
          </div>
        )}

        {/* Flex */}
        {modeRecompense === "flex" && (
          <div className="px-5 py-4 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[14px]" style={{ color: "var(--fg)" }}>Grande récompense</span>
              <Stepper value={objectif} onChange={v => { setObjectif(v); if (palierIntermediaire >= v) setPalierIntermediaire(Math.max(2, v - 1)); mark(); }} min={4} max={30} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[14px]" style={{ color: "var(--fg)" }}>Palier intermédiaire</span>
              <Stepper value={palierIntermediaire} onChange={v => { setPalierIntermediaire(v); mark(); }} min={2} max={objectif - 1} />
            </div>
            <div style={{ borderTop: "1px solid var(--border)", paddingTop: 12, display: "flex", flexDirection: "column", gap: 8 }}>
              <div className="flex items-center gap-3">
                <span className="text-[13px] flex-shrink-0" style={{ color: "var(--fg-tertiary)", minWidth: 120 }}>
                  Petite · {palierIntermediaire} tampons
                </span>
                <input type="text" value={nomRecompensePetit}
                  onChange={e => { setNomRecompensePetit(cap(e.target.value)); mark(); }}
                  placeholder="ex: Cookie"
                  className="flex-1 px-3 py-2 rounded-xl text-[13px] outline-none"
                  style={{ background: "var(--bg)", border: "1px solid var(--border)", color: "var(--fg)" }} />
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[13px] flex-shrink-0" style={{ color: "var(--fg-tertiary)", minWidth: 120 }}>
                  Grande · {objectif} tampons
                </span>
                <input type="text" value={nomRecompenseGrand}
                  onChange={e => { setNomRecompenseGrand(cap(e.target.value)); mark(); }}
                  placeholder="ex: Matcha"
                  className="flex-1 px-3 py-2 rounded-xl text-[13px] outline-none"
                  style={{ background: "var(--bg)", border: "1px solid var(--border)", color: "var(--fg)" }} />
              </div>
            </div>
            {/* Frise — deux jalons */}
            {(nomRecompensePetit || nomRecompenseGrand) && (
              <div className="flex items-stretch gap-2 mt-2 pt-3" style={{ borderTop: "1px solid var(--border)" }}>
                <div className="flex-1 rounded-2xl p-3 text-center transition-all" style={{ background: "rgba(47,123,255,0.06)", border: "1px solid rgba(47,123,255,0.15)" }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2F7BFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ margin: "0 auto 5px" }}>
                    <path d="M20 12v10H4V12"/><path d="M22 7H2v5h20V7z"/><path d="M12 22V7"/>
                    <path d="M12 7H7.5a2.5 2.5 0 010-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 000-5C13 2 12 7 12 7z"/>
                  </svg>
                  <p className="text-[13px] font-semibold truncate" style={{ color: "var(--fg)" }}>{cap(nomRecompensePetit || "—")}</p>
                  <p className="text-[11px] mt-0.5 font-medium" style={{ color: "#2F7BFF" }}>{palierIntermediaire} tampons</p>
                </div>
                <div className="flex items-center flex-shrink-0" style={{ color: "var(--fg-tertiary)" }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                </div>
                <div className="flex-1 rounded-2xl p-3 text-center transition-all" style={{ background: "rgba(139,92,246,0.06)", border: "1px solid rgba(139,92,246,0.15)" }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8B5CF6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ margin: "0 auto 5px" }}>
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                  </svg>
                  <p className="text-[13px] font-semibold truncate" style={{ color: "var(--fg)" }}>{cap(nomRecompenseGrand || "—")}</p>
                  <p className="text-[11px] mt-0.5 font-medium" style={{ color: "#8B5CF6" }}>{objectif} tampons</p>
                </div>
              </div>
            )}
          </div>
        )}
      </IosCard>

      {/* ── 3. Anti-doublon ────────────────────────────────────────────────── */}
      <SectionLabel title="Anti-doublon" />
      <IosCard>
        <div className="relative overflow-hidden">
          <IosRow last
            label="Anti-doublon"
            right={<><span className="text-[14px]">{antiDoublonLabel}</span><ChevronRight /></>}
          />
          <select value={config.anti_doublon_delai}
            onChange={e => set("anti_doublon_delai", Number(e.target.value))}
            className="absolute inset-0 opacity-0 w-full h-full cursor-pointer">
            {ANTI_DOUBLON.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
      </IosCard>
      <p className="text-[12px] px-1 mt-2" style={{ color: "var(--fg-tertiary)" }}>{t.settings_delay_hint}</p>

      {/* ── 4. Double tampons ───────────────────────────────────────────────── */}
      <SectionLabel title="Double tampons" />
      <IosCard>
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: doubleTamponsActif ? "1px solid var(--border)" : "none" }}>
          <div>
            <p className="text-[15px]" style={{ color: "var(--fg)" }}>{t.settings_double_stamps}</p>
            <p className="text-[12px] mt-0.5" style={{ color: "var(--fg-tertiary)" }}>{t.settings_double_desc}</p>
          </div>
          <Toggle value={doubleTamponsActif} onChange={v => { setDoubleTamponsActif(v); mark(); }} />
        </div>
        {doubleTamponsActif && (
          <div className="px-5 py-4">
            <p className="text-[12px] mb-2" style={{ color: "var(--fg-secondary)" }}>{t.settings_active_until}</p>
            <input type="date" value={doubleTamponsFin} min={new Date().toISOString().slice(0, 10)}
              onChange={e => { setDoubleTamponsFin(e.target.value); mark(); }}
              className="w-full px-4 py-3 rounded-2xl text-[14px] outline-none"
              style={{ background: "var(--bg)", border: "1px solid var(--border)", color: "var(--fg)" }} />
          </div>
        )}
      </IosCard>

      {/* ── 5. Automatisations ─────────────────────────────────────────────── */}
      </>)}
      {showG("engagement") && (<>
      <SectionLabel title="Engagement clients" id="engagement" />
      <IosCard>
        {/* Anniversaire */}
        <div className="px-5 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[15px]" style={{ color: "var(--fg)" }}>{t.settings_birthday}</p>
              <p className="text-[12px] mt-0.5" style={{ color: "var(--fg-tertiary)" }}>{t.settings_birthday_auto}</p>
            </div>
            <Toggle value={auto.anniversaire_actif} onChange={v => setA("anniversaire_actif", v)} />
          </div>
          {auto.anniversaire_actif && (
            <div className="mt-3 pt-3 space-y-3" style={{ borderTop: "1px solid var(--border)" }}>
              <div className="flex gap-2">
                {(["double", "custom"] as const).map(type => (
                  <button key={type} onClick={() => setA("anniversaire_type", type)}
                    className="flex-1 py-2 rounded-xl text-[12px] font-medium transition-all"
                    style={{ background: auto.anniversaire_type === type ? "var(--accent)" : "var(--glass-bg)", color: auto.anniversaire_type === type ? "white" : "var(--fg-secondary)", border: `1px solid ${auto.anniversaire_type === type ? "transparent" : "var(--border)"}` }}>
                    {type === "double" ? "Double tampon" : "Offre personnalisée"}
                  </button>
                ))}
              </div>
              {auto.anniversaire_type === "custom" && (
                <input type="text" placeholder="Ex : Boisson offerte…" value={auto.anniversaire_offre}
                  onChange={e => setA("anniversaire_offre", e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl text-[12px] outline-none"
                  style={{ background: "var(--bg)", border: "1px solid var(--border)", color: "var(--fg)" }} />
              )}
              <textarea value={auto.anniversaire_message} onChange={e => setA("anniversaire_message", e.target.value)}
                rows={2} className="w-full px-3 py-2.5 rounded-xl text-[12px] outline-none resize-none"
                style={{ background: "var(--bg)", border: "1px solid var(--border)", color: "var(--fg)", lineHeight: 1.5 }} />
            </div>
          )}
        </div>
        {/* Relance */}
        <div className="px-5 py-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[15px]" style={{ color: "var(--fg)" }}>{t.settings_reminder}</p>
              <p className="text-[12px] mt-0.5" style={{ color: "var(--fg-tertiary)" }}>{t.settings_relance_desc}</p>
            </div>
            <Toggle value={auto.relance_actif} onChange={v => setA("relance_actif", v)} />
          </div>
          {auto.relance_actif && (
            <div className="mt-3 pt-3 space-y-3" style={{ borderTop: "1px solid var(--border)" }}>
              <div>
                <p className="text-[12px] mb-2" style={{ color: "var(--fg-secondary)" }}>{t.settings_relance_days}</p>
                <div className="flex flex-wrap gap-2">
                  {[7, 14, 21, 30, 45, 60, 90].map(j => (
                    <button key={j} onClick={() => setA("relance_delai_jours", j)}
                      className="px-3 py-1.5 rounded-xl text-[13px] font-semibold transition-all"
                      style={{ background: auto.relance_delai_jours === j ? "var(--accent)" : "var(--bg)", color: auto.relance_delai_jours === j ? "white" : "var(--fg-secondary)", border: `1px solid ${auto.relance_delai_jours === j ? "var(--accent)" : "var(--border)"}` }}>
                      {j}j
                    </button>
                  ))}
                </div>
              </div>
              <textarea value={auto.relance_message} onChange={e => setA("relance_message", e.target.value)}
                rows={2} className="w-full px-3 py-2.5 rounded-xl text-[12px] outline-none resize-none"
                style={{ background: "var(--bg)", border: "1px solid var(--border)", color: "var(--fg)", lineHeight: 1.5 }} />
            </div>
          )}
        </div>
      </IosCard>

      {/* ── 6. Parrainage (regroupé sous « Engagement clients ») ───────────── */}
      <div className="mt-3" />
      <IosCard>
        <div className="flex items-start justify-between gap-3 px-5 py-4">
          <div>
            <p className="text-[15px]" style={{ color: "var(--fg)" }}>{t.settings_referral_title}</p>
            <p className="text-[12px] mt-0.5" style={{ color: "var(--fg-tertiary)" }}>{t.settings_referral_desc}</p>
          </div>
          <Toggle value={parrainageActif} onChange={async v => {
            setParrainageActif(v); mark();
            await saveMarchandFields(user!, { parrainage_actif: v });
          }} />
        </div>
      </IosCard>
      {parrainageActif && (
        <div className="mt-3 space-y-2 px-1">
          {[t.settings_referral_step1, t.settings_referral_step2, t.settings_referral_step3].map((step, i) => (
            <div key={i} className="flex items-start gap-3">
              <span className="text-[11px] font-bold mt-0.5 flex-shrink-0 w-4" style={{ color: "var(--accent)" }}>{i + 1}.</span>
              <p className="text-[12px]" style={{ color: "var(--fg-tertiary)" }}>{step}</p>
            </div>
          ))}
        </div>
      )}

      {/* ── 7. Notifications clients ───────────────────────────────────────── */}
      </>)}
      {showG("etablissement") && (<>
      <SectionLabel title="Notifications clients" />
      <IosCard>
        <div className="flex items-start justify-between gap-3 px-5 py-4" style={{ borderBottom: notifActif ? "1px solid var(--border)" : "none" }}>
          <div>
            <p className="text-[15px]" style={{ color: "var(--fg)" }}>{t.settings_notif_prompt_title}</p>
            <p className="text-[12px] mt-0.5" style={{ color: "var(--fg-tertiary)" }}>{t.settings_notif_prompt_desc}</p>
          </div>
          <Toggle value={notifActif} onChange={v => { setNotifActif(v); mark(); }} />
        </div>
        {notifActif && (
          <div className="px-5 py-4 space-y-3">
            <textarea value={notifMessage} onChange={e => { setNotifMessage(e.target.value); mark(); }}
              rows={2} placeholder={t.settings_notif_msg_label}
              className="w-full px-4 py-3 rounded-2xl text-[13px] outline-none resize-none"
              style={{ background: "var(--bg)", border: "1px solid var(--border)", color: "var(--fg)", lineHeight: 1.5 }}
              onFocus={e => (e.target.style.borderColor = "var(--accent)")}
              onBlur={e => (e.target.style.borderColor = "var(--border)")} />
            {/* iOS notification preview */}
            <div className="rounded-2xl overflow-hidden" style={{ background: "rgba(20,20,22,0.85)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)" }}>
              <div className="flex items-center justify-between px-4 pt-3 pb-1">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg overflow-hidden flex-shrink-0" style={{ background: marchand.couleur_principale || "var(--accent)" }}>
                    {(m.logo_url) ? <img src={m.logo_url as string} alt="" className="w-full h-full object-cover" />
                      : <span className="text-white font-bold text-[10px] flex items-center justify-center w-full h-full">{marchand.nom[0]?.toUpperCase()}</span>}
                  </div>
                  <span className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: "rgba(255,255,255,0.5)" }}>{marchand.nom}</span>
                </div>
                <span className="text-[11px]" style={{ color: "rgba(255,255,255,0.35)" }}>maintenant</span>
              </div>
              <div className="px-4 pb-4">
                <p className="text-[14px] font-semibold mb-0.5" style={{ color: "white" }}>{t.settings_notif_preview}</p>
                <p className="text-[13px]" style={{ color: "rgba(255,255,255,0.65)" }}>{notifMessage}</p>
              </div>
            </div>
          </div>
        )}
      </IosCard>

      {/* ── 9. Apparence ───────────────────────────────────────────────────── */}
      <SectionLabel title="Apparence" />
      <IosCard>
        <div className="relative overflow-hidden">
          <IosRow label="Langue" right={<><span className="text-[14px]">{langueLabel}</span><ChevronRight /></>} />
          <select value={langue} onChange={e => { setLangue(e.target.value as "fr" | "ro" | "es"); mark(); }}
            className="absolute inset-0 opacity-0 w-full h-full cursor-pointer">
            <option value="fr">Français</option>
            <option value="ro">Română</option>
            <option value="es">Español</option>
          </select>
        </div>
        <div className="flex items-center justify-between px-5 py-4" style={{ borderTop: "1px solid var(--border)" }}>
          <span className="text-[15px]" style={{ color: "var(--fg)" }}>Vibrations</span>
          <Toggle value={hapticsOn} onChange={v => {
            setHapticsOn(v);
            if (v) localStorage.removeItem(HAPTICS_KEY);
            else localStorage.setItem(HAPTICS_KEY, "1");
          }} />
        </div>
      </IosCard>

      {/* ── 10. Compte ─────────────────────────────────────────────────────── */}
      <DeleteAccountSection />
      </>)}

      <div className="mb-8" />

      {/* ── Bottom save bar ─────────────────────────────────────────────────── */}
      {isDirty && (<>
        {/* Mobile */}
        <div className="md:hidden fixed left-0 right-0 z-30 px-5 py-3"
          style={{ bottom: "calc(var(--tab-h, 49px) + env(safe-area-inset-bottom, 0px))", background: "var(--bg)", borderTop: "1px solid var(--border)" }}>
          <button onClick={sauvegarder} disabled={saving}
            className="w-full py-4 rounded-2xl text-[15px] font-semibold text-white"
            style={{ background: "linear-gradient(135deg,#2F7BFF,#8B5CF6)" }}>
            {saving ? "Enregistrement…" : "Enregistrer les modifications"}
          </button>
        </div>
        {/* Desktop */}
        <div className="hidden md:block fixed bottom-0 left-[72px] lg:left-[240px] right-0 z-30 px-6 py-4"
          style={{ background: "var(--bg)", borderTop: "1px solid var(--border)" }}>
          <button onClick={sauvegarder} disabled={saving}
            className="py-3 px-8 rounded-2xl text-[14px] font-semibold text-white"
            style={{ background: "linear-gradient(135deg,#2F7BFF,#8B5CF6)" }}>
            {saving ? "Enregistrement…" : "Enregistrer"}
          </button>
        </div>
      </>)}

    </div>
  );
}

// ── Section Équipe ────────────────────────────────────────────────────────────

interface Membre { id: string; prenom: string; statut: string; }

const AVATAR_PALETTES = [
  { bg: "rgba(94,140,247,0.18)", text: "#5E8CF7" },
  { bg: "rgba(139,127,212,0.18)", text: "#9B8FE8" },
  { bg: "rgba(52,199,137,0.18)", text: "#34C789" },
  { bg: "rgba(247,133,110,0.18)", text: "#E8785E" },
  { bg: "rgba(240,160,96,0.18)", text: "#E0A060" },
  { bg: "rgba(112,184,232,0.18)", text: "#60B8E8" },
];
function avatarColor(initials: string) {
  const code = (initials.charCodeAt(0) || 0) + (initials.charCodeAt(1) || 0);
  return AVATAR_PALETTES[code % AVATAR_PALETTES.length];
}

function SectionEquipe({ onDirty }: { onDirty: () => void }) {
  const { marchand, user } = useAuth();
  const m = marchand as Record<string, unknown>;
  const [membres, setMembres] = useState<Membre[]>([]);
  const [code] = useState<string>((m?.code_etablissement as string) || "");
  const [showAdd, setShowAdd] = useState(false);
  const [newPrenom, setNewPrenom] = useState("");
  const [newPin, setNewPin] = useState("");
  const [adding, setAdding] = useState(false);
  const [copied, setCopied] = useState(false);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [resetTarget, setResetTarget] = useState<string | null>(null);
  const [resetPin, setResetPin] = useState("");

  const loadMembres = useCallback(async () => {
    const token = await getIdToken();
    const res = await fetch("/api/equipe/membres", { headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) { const d = await res.json(); setMembres(d.membres || []); }
  }, []);

  useEffect(() => { if (user) loadMembres(); }, [user, loadMembres]);

  async function handleAddMembre(e: React.FormEvent) {
    e.preventDefault();
    if (!newPrenom || newPin.length !== 4) return;
    setAdding(true);
    const token = await getIdToken();
    await fetch("/api/equipe/membres", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ prenom: newPrenom, pin: newPin }) });
    setNewPrenom(""); setNewPin(""); setShowAdd(false); setAdding(false);
    loadMembres();
  }

  async function toggleStatut(membreId: string, statut: string) {
    const token = await getIdToken();
    await fetch("/api/equipe/membres", { method: "PATCH", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ membreId, action: statut === "actif" ? "desactiver" : "activer" }) });
    loadMembres(); setMenuOpen(null);
  }

  async function handleResetPin(membreId: string) {
    if (resetPin.length !== 4) return;
    const token = await getIdToken();
    await fetch("/api/equipe/membres", { method: "PATCH", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ membreId, action: "reset_pin", pin: resetPin }) });
    setResetTarget(null); setResetPin(""); loadMembres();
  }

  function copyCode() {
    navigator.clipboard.writeText(code).then(() => { setCopied(true); haptic("light"); setTimeout(() => setCopied(false), 1500); });
  }

  return (
    <>
      <SectionLabel title="Équipe" />
      <IosCard>
        {/* Code établissement */}
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
          <div>
            <p className="text-[12px] mb-0.5" style={{ color: "var(--fg-tertiary)" }}>Code établissement</p>
            <p className="text-[28px] font-bold tracking-[0.25em]" style={{ color: "var(--fg)", fontVariantNumeric: "tabular-nums" }}>{code || "—"}</p>
          </div>
          <button onClick={copyCode}
            className="w-10 h-10 rounded-full flex items-center justify-center transition-all"
            style={{ background: copied ? "rgba(52,199,89,0.12)" : "var(--bg)", border: "1px solid var(--border)" }}>
            {copied ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#34C759" strokeWidth="2.5" strokeLinecap="round"><path d="M20 6 9 17l-5-5"/></svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" style={{ color: "var(--fg-secondary)" }}><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
            )}
          </button>
        </div>

        {/* Accès équipe */}
        {[
          { label: "Scanner QR clients" },
          { label: "Voir la liste des clients" },
          { label: "Tampon manuel", last: true },
        ].map(({ label, last }) => (
          <div key={label} className="flex items-center justify-between px-5 py-3.5" style={{ borderBottom: last ? "none" : "1px solid var(--border)" }}>
            <span className="text-[14px]" style={{ color: "var(--fg)" }}>{label}</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#34C759" strokeWidth="2.5" strokeLinecap="round"><path d="M20 6 9 17l-5-5"/></svg>
          </div>
        ))}
      </IosCard>

      {/* Membres */}
      <div className="mt-3">
        <IosCard>
          {membres.map((mb, i) => {
            const initiales = mb.prenom[0]?.toUpperCase() || "?";
            const aColor = avatarColor(initiales);
            return (
              <div key={mb.id} style={{ borderBottom: i < membres.length - 1 || showAdd ? "1px solid var(--border)" : "none" }}>
                <div className="flex items-center gap-3 px-5 py-3.5">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-[13px] font-bold flex-shrink-0"
                    style={{ background: mb.statut === "actif" ? aColor.bg : "var(--border)", color: mb.statut === "actif" ? aColor.text : "var(--fg-tertiary)" }}>
                    {initiales}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-medium" style={{ color: mb.statut === "actif" ? "var(--fg)" : "var(--fg-tertiary)" }}>
                      {mb.prenom.charAt(0).toUpperCase() + mb.prenom.slice(1).toLowerCase()}
                    </p>
                    <p className="text-[11px]" style={{ color: mb.statut === "actif" ? "#34C759" : "var(--fg-tertiary)" }}>
                      {mb.statut === "actif" ? "Actif" : "Désactivé"}
                    </p>
                  </div>
                  <div className="relative">
                    <button onClick={() => setMenuOpen(menuOpen === mb.id ? null : mb.id)}
                      className="w-8 h-8 rounded-full flex items-center justify-center"
                      style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="none" style={{ color: "var(--fg-tertiary)" }}>
                        <circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/>
                      </svg>
                    </button>
                    {menuOpen === mb.id && (
                      <div className="absolute right-0 top-9 rounded-2xl overflow-hidden z-10 shadow-lg" style={{ background: "var(--bg)", border: "1px solid var(--border)", minWidth: 160 }}>
                        <button onClick={() => { setResetTarget(mb.id); setMenuOpen(null); }}
                          className="w-full px-4 py-3 text-left text-[13px]" style={{ color: "var(--fg)", borderBottom: "1px solid var(--border)" }}>
                          Changer le PIN
                        </button>
                        <button onClick={() => toggleStatut(mb.id, mb.statut)}
                          className="w-full px-4 py-3 text-left text-[13px]"
                          style={{ color: mb.statut === "actif" ? "#FF3B30" : "#34C759" }}>
                          {mb.statut === "actif" ? "Désactiver" : "Activer"}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                {resetTarget === mb.id && (
                  <div className="flex gap-2 px-5 pb-3">
                    <input type="password" inputMode="numeric" placeholder="Nouveau PIN" maxLength={4}
                      value={resetPin} onChange={e => setResetPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                      className="flex-1 px-3 py-2 rounded-xl text-[13px] outline-none"
                      style={{ background: "var(--glass-bg)", border: "1px solid var(--border)", color: "var(--fg)" }} />
                    <button onClick={() => handleResetPin(mb.id)} disabled={resetPin.length !== 4}
                      className="px-4 py-2 rounded-xl text-[13px] font-semibold text-white"
                      style={{ background: "var(--accent)", opacity: resetPin.length !== 4 ? 0.4 : 1 }}>OK</button>
                  </div>
                )}
              </div>
            );
          })}
          {membres.length === 0 && (
            <div className="px-5 py-4">
              <p className="text-[13px]" style={{ color: "var(--fg-tertiary)" }}>Aucun membre pour l&apos;instant</p>
            </div>
          )}
          {/* + Ajouter */}
          {!showAdd ? (
            <button onClick={() => setShowAdd(true)}
              className="w-full flex items-center gap-2 px-5 py-4 text-left"
              style={{ borderTop: membres.length > 0 ? "1px solid var(--border)" : "none" }}>
              <span className="text-[15px] font-medium" style={{ color: "var(--accent)" }}>+ Ajouter un membre</span>
            </button>
          ) : (
            <form onSubmit={handleAddMembre} className="px-5 py-4 space-y-3" style={{ borderTop: "1px solid var(--border)" }}>
              <input type="text" placeholder="Prénom" required value={newPrenom} onChange={e => setNewPrenom(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl text-[14px] outline-none"
                style={{ background: "var(--glass-bg)", border: "1px solid var(--border)", color: "var(--fg)" }} />
              <input type="password" inputMode="numeric" placeholder="PIN 4 chiffres" maxLength={4} required
                value={newPin} onChange={e => setNewPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                className="w-full px-3 py-2.5 rounded-xl text-[14px] outline-none"
                style={{ background: "var(--glass-bg)", border: "1px solid var(--border)", color: "var(--fg)" }} />
              <div className="flex gap-2">
                <button type="button" onClick={() => setShowAdd(false)}
                  className="flex-1 py-2.5 rounded-xl text-[14px] font-medium"
                  style={{ background: "var(--glass-bg)", border: "1px solid var(--border)", color: "var(--fg)" }}>
                  Annuler
                </button>
                <button type="submit" disabled={adding || newPin.length !== 4}
                  className="flex-1 py-2.5 rounded-xl text-[14px] font-semibold text-white"
                  style={{ background: "var(--accent)", opacity: adding ? 0.7 : 1 }}>
                  {adding ? "Ajout…" : "Ajouter"}
                </button>
              </div>
            </form>
          )}
        </IosCard>
      </div>
    </>
  );
}

// ── Supprimer le compte ───────────────────────────────────────────────────────

function DeleteAccountSection() {
  const [step, setStep] = useState<"idle" | "confirm" | "loading">("idle");
  const [error, setError] = useState("");

  async function handleDelete() {
    setStep("loading");
    setError("");
    try {
      const token = await getAuth().currentUser?.getIdToken();
      const res = await fetch("/api/delete-merchant-account", { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error("Erreur serveur");
      await signOut(getAuth());
    } catch {
      setError("Une erreur est survenue. Réessaie.");
      setStep("confirm");
    }
  }

  if (step === "loading") return <p className="text-center text-[13px] mt-4" style={{ color: "var(--fg-tertiary)" }}>Suppression en cours…</p>;

  if (step === "confirm") return (
    <div className="mt-3 rounded-2xl p-5" style={{ background: "rgba(255,59,48,0.06)", border: "1px solid rgba(255,59,48,0.2)" }}>
      <p className="text-[15px] font-semibold mb-1" style={{ color: "#FF3B30" }}>Supprimer le compte ?</p>
      <p className="text-[13px] mb-4" style={{ color: "var(--fg-secondary)" }}>
        Action irréversible. Configuration, historique et membres seront supprimés définitivement.
      </p>
      {error && <p className="text-[13px] mb-3" style={{ color: "#FF3B30" }}>{error}</p>}
      <div className="flex gap-3">
        <button onClick={() => setStep("idle")} className="flex-1 rounded-xl py-2.5 text-[14px] font-medium"
          style={{ background: "var(--glass-bg)", border: "1px solid var(--border)", color: "var(--fg)" }}>
          Annuler
        </button>
        <button onClick={handleDelete} className="flex-1 rounded-xl py-2.5 text-[14px] font-semibold"
          style={{ background: "#FF3B30", color: "#fff" }}>
          Supprimer
        </button>
      </div>
    </div>
  );

  return (
    <button onClick={() => setStep("confirm")}
      className="w-full py-3 text-[13px] text-center mt-2"
      style={{ background: "none", color: "var(--fg-tertiary)", border: "none", cursor: "pointer" }}>
      Supprimer mon compte
    </button>
  );
}

// React import needed for JSX in helper components
import React from "react";
