"use client";

import { useAuth } from "@/lib/auth-context";
import { useState } from "react";
import ThemeToggle from "@/components/ThemeToggle";
import { saveMarchandFields } from "@/lib/save-marchand";
import { useLang } from "@/lib/lang-context";

const FUSEAUX = [
  "Africa/Casablanca",
  "Europe/Madrid",
  "Europe/Paris",
  "Europe/London",
  "America/New_York",
  "Asia/Dubai",
];

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
  ];
  const autoRaw = (marchand as Record<string, unknown>)?.automatisations as Record<string, Record<string, unknown>> | undefined;

  const [nomEtablissement, setNomEtablissement] = useState<string>(marchand?.nom || "");
  const [objectif, setObjectif] = useState<number>(marchand?.objectif_tampons || 10);
  const [nomRecompense, setNomRecompense] = useState<string>(marchand?.nom_recompense || "");
  const [modeRecompense, setModeRecompense] = useState<"cyclique" | "progressif">(
    ((marchand as Record<string, unknown>)?.mode_recompense as "cyclique" | "progressif") || "cyclique"
  );
  const [paliers, setPaliers] = useState<{ tampons: number; recompense: string }[]>(
    ((marchand as Record<string, unknown>)?.paliers as { tampons: number; recompense: string }[]) ||
    [{ tampons: 5, recompense: "" }, { tampons: 10, recompense: "" }]
  );
  const [config, setConfig] = useState({
    anti_doublon_delai: marchand?.anti_doublon_delai ?? 86400,
    fuseau_horaire:   marchand?.fuseau_horaire || Intl.DateTimeFormat().resolvedOptions().timeZone,
  });
  const [auto, setAuto] = useState({
    anniversaire_actif:     Boolean(autoRaw?.anniversaire?.actif),
    anniversaire_jours_avant: Number(autoRaw?.anniversaire?.jours_avant ?? 0),
    anniversaire_message:   String(autoRaw?.anniversaire?.message ?? `${t.settings_birthday_msg_default} ${marchand?.nom || "nous"}.`),
    relance_actif:          Boolean(autoRaw?.relance?.actif),
    relance_delai_jours:    Number(autoRaw?.relance?.delai_jours ?? 30),
    relance_message:        String(autoRaw?.relance?.message ?? `${t.settings_relance_msg_default} ${marchand?.nom || "nous"}.`),
  });
  const [notifActif, setNotifActif] = useState<boolean>((marchand as Record<string,unknown>)?.notif_actif !== false);
  const [notifMessage, setNotifMessage] = useState<string>(
    ((marchand as Record<string,unknown>)?.notif_message as string) ||
    `${t.settings_notif_msg_default} ${marchand?.nom || "nous"}, ${t.settings_notif_msg_default2}`
  );
  const m = marchand as Record<string, unknown>;
  const doubleFin = m.double_tampons_fin as string | undefined;
  const [doubleTamponsActif, setDoubleTamponsActif] = useState<boolean>(
    doubleFin ? new Date(doubleFin) > new Date() : false
  );
  const [doubleTamponsFin, setDoubleTamponsFin] = useState<string>(
    doubleFin ?? new Date(Date.now() + 86400000 * 2).toISOString().slice(0, 10)
  );
  const [parrainageActif, setParrainageActif] = useState<boolean>(
    !!((marchand as Record<string, unknown>)?.parrainage_actif)
  );
  const [langue, setLangue] = useState<"fr" | "ro" | "es">(
    ((marchand as Record<string, unknown>)?.langue as "fr" | "ro" | "es") || "fr"
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  if (!marchand || !user) return null;

  const set = (k: string, v: string | number) => setConfig(c => ({ ...c, [k]: v }));
  const setA = (k: string, v: boolean | number | string) => setAuto(a => ({ ...a, [k]: v }));

  async function sauvegarder() {
    if (modeRecompense === "progressif") {
      const paliersValides = paliers.filter(p => p.recompense.trim());
      if (paliersValides.length === 0) {
        alert("Ajoutez au moins un palier avec une récompense pour activer le mode progressif.");
        return;
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
        ...config,
        automatisations: {
          anniversaire: { actif: auto.anniversaire_actif, jours_avant: auto.anniversaire_jours_avant, message: auto.anniversaire_message },
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
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      alert(`Erreur : ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="px-5 md:px-8 lg:px-10 pt-8 lg:pt-10 pb-40 md:pb-10 max-w-3xl">

      {/* Header */}
      <div className="mb-6">
        <p className="text-[12px] font-semibold uppercase tracking-widest mb-1" style={{ color: "var(--fg-tertiary)" }}>
          {t.settings_config}
        </p>
        <h1 className="text-[28px] font-semibold tracking-[-0.5px]" style={{ color: "var(--fg)" }}>{t.settings_title}</h1>
      </div>

      <div className="space-y-3 lg:grid lg:grid-cols-2 lg:gap-4 lg:space-y-0">

        {/* Programme fidélité */}
        <Card title={t.settings_establishment} className="lg:col-span-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="md:col-span-2">
              <p className="text-[11px] font-semibold uppercase tracking-widest mb-2" style={{ color: "var(--fg-tertiary)" }}>
                {t.settings_name}
              </p>
              <input
                type="text"
                value={nomEtablissement}
                onChange={e => setNomEtablissement(e.target.value)}
                placeholder={t.settings_name_placeholder}
                className="w-full px-4 py-3 rounded-2xl text-[14px] outline-none"
                style={{ background: "var(--bg)", border: "1px solid var(--border)", color: "var(--fg)" }}
                onFocus={e => (e.target.style.borderColor = "var(--accent)")}
                onBlur={e => (e.target.style.borderColor = "var(--border)")}
              />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-widest mb-2" style={{ color: "var(--fg-tertiary)" }}>
                {t.settings_reward}
              </p>
              <input
                type="text"
                value={nomRecompense}
                onChange={e => setNomRecompense(e.target.value)}
                placeholder={t.settings_reward_placeholder}
                className="w-full px-4 py-3 rounded-2xl text-[14px] outline-none"
                style={{ background: "var(--bg)", border: "1px solid var(--border)", color: "var(--fg)" }}
                onFocus={e => (e.target.style.borderColor = "var(--accent)")}
                onBlur={e => (e.target.style.borderColor = "var(--border)")}
              />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-widest mb-2" style={{ color: "var(--fg-tertiary)" }}>
                {t.settings_stamps_needed} — <span style={{ color: "var(--accent)" }}>{objectif}</span>
              </p>
              <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
                {[5, 6, 8, 10, 12, 15, 20].map(n => (
                  <button key={n} onClick={() => setObjectif(n)}
                    className="flex-shrink-0 text-[13px] font-medium rounded-xl transition-all"
                    style={{
                      minWidth: 44, height: 36,
                      background: objectif === n ? "var(--accent)" : "var(--bg)",
                      border: `1px solid ${objectif === n ? "var(--accent)" : "var(--border)"}`,
                      color: objectif === n ? "white" : "var(--fg-tertiary)",
                    }}>
                    {n}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Toggle mode récompense */}
          <div className="md:col-span-2 pt-4" style={{ borderTop: "1px solid var(--border)" }}>
            <p className="text-[11px] font-semibold uppercase tracking-widest mb-3" style={{ color: "var(--fg-tertiary)" }}>
              Mode récompense
            </p>
            <div className="flex gap-2 mb-4">
              {(["cyclique", "progressif"] as const).map(mode => (
                <button key={mode} onClick={() => setModeRecompense(mode)}
                  className="px-4 py-2 rounded-2xl text-[13px] font-medium transition-all"
                  style={{
                    background: modeRecompense === mode ? "var(--accent)" : "var(--bg)",
                    color: modeRecompense === mode ? "white" : "var(--fg-secondary)",
                    border: `1px solid ${modeRecompense === mode ? "var(--accent)" : "var(--border)"}`,
                  }}>
                  {mode === "cyclique" ? "Cyclique" : "Progressif"}
                </button>
              ))}
            </div>

            {modeRecompense === "cyclique" && (
              <p className="text-[12px]" style={{ color: "var(--fg-tertiary)" }}>
                Le compteur repart à zéro après chaque récompense.
              </p>
            )}

            {modeRecompense === "progressif" && (
              <div className="space-y-3">
                <p className="text-[12px]" style={{ color: "var(--fg-tertiary)" }}>
                  Les tampons s&apos;accumulent. Chaque palier débloque une récompense différente.
                </p>
                {paliers.map((palier, i) => {
                  const minVal = i > 0 ? paliers[i - 1].tampons + 1 : 1;
                  const maxVal = i < paliers.length - 1 ? paliers[i + 1].tampons - 1 : objectif;
                  return (
                  <div key={i} className="flex items-center gap-2">
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={() => setPaliers(prev => prev.map((p, j) => j === i ? { ...p, tampons: Math.max(minVal, p.tampons - 1) } : p))}
                        disabled={palier.tampons <= minVal}
                        className="w-7 h-7 rounded-lg text-[15px] font-bold flex items-center justify-center"
                        style={{ background: "var(--bg)", border: "1px solid var(--border)", color: "var(--fg-secondary)", opacity: palier.tampons <= minVal ? 0.3 : 1 }}>−</button>
                      <span className="w-8 text-center text-[14px] font-semibold" style={{ color: "var(--accent)" }}>{palier.tampons}</span>
                      <button
                        onClick={() => setPaliers(prev => prev.map((p, j) => j === i ? { ...p, tampons: Math.min(maxVal, p.tampons + 1) } : p))}
                        disabled={palier.tampons >= maxVal}
                        className="w-7 h-7 rounded-lg text-[15px] font-bold flex items-center justify-center"
                        style={{ background: "var(--bg)", border: "1px solid var(--border)", color: "var(--fg-secondary)", opacity: palier.tampons >= maxVal ? 0.3 : 1 }}>+</button>
                    </div>
                    <input
                      type="text"
                      value={palier.recompense}
                      onChange={e => setPaliers(prev => prev.map((p, j) => j === i ? { ...p, recompense: e.target.value } : p))}
                      placeholder={t.settings_reward_placeholder}
                      className="flex-1 px-3 py-2 rounded-xl text-[13px] outline-none"
                      style={{ background: "var(--bg)", border: "1px solid var(--border)", color: "var(--fg)" }}
                      onFocus={e => (e.target.style.borderColor = "var(--accent)")}
                      onBlur={e => (e.target.style.borderColor = "var(--border)")}
                    />
                    {paliers.length > 1 && (
                      <button
                        onClick={() => setPaliers(prev => prev.filter((_, j) => j !== i))}
                        className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ background: "rgba(255,59,48,0.08)", color: "#FF3B30", border: "1px solid rgba(255,59,48,0.15)" }}>
                        ×
                      </button>
                    )}
                  </div>
                  );
                })}
                <button
                  onClick={() => {
                    const dernier = paliers.at(-1)?.tampons ?? 0;
                    const nouveau = Math.min(objectif, dernier + 3);
                    if (nouveau > dernier) setPaliers(prev => [...prev, { tampons: nouveau, recompense: "" }]);
                  }}
                  disabled={(paliers.at(-1)?.tampons ?? 0) >= objectif}
                  className="w-full py-2 rounded-xl text-[13px] font-medium"
                  style={{ background: "var(--bg)", border: "1px dashed var(--border)", color: "var(--fg-secondary)", opacity: (paliers.at(-1)?.tampons ?? 0) >= objectif ? 0.4 : 1 }}>
                  + Ajouter un palier
                </button>
              </div>
            )}
          </div>

        </Card>

        {/* Anti-doublon */}
        <Card title={t.settings_anti_doublon}>
          <select
            value={config.anti_doublon_delai}
            onChange={e => set("anti_doublon_delai", Number(e.target.value))}
            className="w-full px-4 py-3 rounded-2xl text-[14px] outline-none mb-2"
            style={{ background: "var(--bg)", border: "1px solid var(--border)", color: "var(--fg)" }}
          >
            {ANTI_DOUBLON.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <p className="text-[12px]" style={{ color: "var(--fg-tertiary)" }}>
            {t.settings_delay_hint}
          </p>
        </Card>

        {/* Double tampons */}
        <Card title={t.settings_double_stamps}>
          <div className="flex items-start justify-between gap-3 mb-3">
            <div>
              <p className="text-[14px]" style={{ color: "var(--fg)" }}>
                {doubleTamponsActif
                  ? new Date(doubleTamponsFin).toLocaleDateString()
                  : t.settings_anti_doublon_off}
              </p>
              <p className="text-[12px] mt-0.5" style={{ color: "var(--fg-tertiary)" }}>
                {t.settings_double_desc}
              </p>
            </div>
            <Toggle value={doubleTamponsActif} onChange={setDoubleTamponsActif} />
          </div>
          {doubleTamponsActif && (
            <div className="pt-3" style={{ borderTop: "1px solid var(--border)" }}>
              <p className="text-[12px] mb-2" style={{ color: "var(--fg-secondary)" }}>{t.settings_active_until}</p>
              <input type="date" value={doubleTamponsFin}
                min={new Date().toISOString().slice(0, 10)}
                onChange={e => setDoubleTamponsFin(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl text-[14px] outline-none"
                style={{ background: "var(--bg)", border: "1px solid var(--border)", color: "var(--fg)" }}
              />
            </div>
          )}
        </Card>

        {/* Automatisations */}
        <Card title={t.settings_automations} className="lg:col-span-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

            <div>
              <div className="flex items-start justify-between gap-3 mb-1">
                <div>
                  <p className="text-[14px] font-medium" style={{ color: "var(--fg)" }}>{t.settings_birthday}</p>
                  <p className="text-[12px] mt-0.5" style={{ color: "var(--fg-tertiary)" }}>{t.settings_birthday_auto}</p>
                </div>
                <Toggle value={auto.anniversaire_actif} onChange={v => setA("anniversaire_actif", v)} />
              </div>
              {auto.anniversaire_actif && (
                <div className="mt-3 pt-3 space-y-3" style={{ borderTop: "1px solid var(--border)" }}>
                  <div>
                    <p className="text-[12px] mb-2" style={{ color: "var(--fg-secondary)" }}>
                      {auto.anniversaire_jours_avant === 0 ? t.settings_birthday_day_0 : `${auto.anniversaire_jours_avant} ${t.settings_birthday_days}`}
                    </p>
                    <input type="range" min={0} max={7} value={auto.anniversaire_jours_avant}
                      onChange={e => setA("anniversaire_jours_avant", Number(e.target.value))}
                      className="w-full" />
                  </div>
                  <div>
                    <p className="text-[12px] mb-1.5" style={{ color: "var(--fg-secondary)" }}>{t.settings_birthday_msg_label}</p>
                    <textarea value={auto.anniversaire_message}
                      onChange={e => setA("anniversaire_message", e.target.value)}
                      rows={2} className="w-full px-3 py-2.5 rounded-xl text-[12px] outline-none resize-none"
                      style={{ background: "var(--bg)", border: "1px solid var(--border)", color: "var(--fg)", lineHeight: 1.5 }}
                      onFocus={e => (e.target.style.borderColor = "var(--accent)")}
                      onBlur={e => (e.target.style.borderColor = "var(--border)")} />
                  </div>
                </div>
              )}
            </div>

            <div>
              <div className="flex items-start justify-between gap-3 mb-1">
                <div>
                  <p className="text-[14px] font-medium" style={{ color: "var(--fg)" }}>{t.settings_reminder}</p>
                  <p className="text-[12px] mt-0.5" style={{ color: "var(--fg-tertiary)" }}>{t.settings_relance_desc}</p>
                </div>
                <Toggle value={auto.relance_actif} onChange={v => setA("relance_actif", v)} />
              </div>
              {auto.relance_actif && (
                <div className="mt-3 pt-3 space-y-3" style={{ borderTop: "1px solid var(--border)" }}>
                  <div>
                    <p className="text-[12px] mb-2" style={{ color: "var(--fg-secondary)" }}>
                      {auto.relance_delai_jours} {t.settings_relance_days}
                    </p>
                    <input type="range" min={7} max={90} step={7} value={auto.relance_delai_jours}
                      onChange={e => setA("relance_delai_jours", Number(e.target.value))}
                      className="w-full" />
                  </div>
                  <div>
                    <p className="text-[12px] mb-1.5" style={{ color: "var(--fg-secondary)" }}>{t.settings_relance_msg_label}</p>
                    <textarea value={auto.relance_message}
                      onChange={e => setA("relance_message", e.target.value)}
                      rows={2} className="w-full px-3 py-2.5 rounded-xl text-[12px] outline-none resize-none"
                      style={{ background: "var(--bg)", border: "1px solid var(--border)", color: "var(--fg)", lineHeight: 1.5 }}
                      onFocus={e => (e.target.style.borderColor = "var(--accent)")}
                      onBlur={e => (e.target.style.borderColor = "var(--border)")} />
                  </div>
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Fuseau horaire */}
        <Card title={t.settings_timezone}>
          <select
            value={config.fuseau_horaire}
            onChange={e => set("fuseau_horaire", e.target.value)}
            className="w-full px-4 py-3 rounded-2xl text-[14px] outline-none"
            style={{ background: "var(--bg)", border: "1px solid var(--border)", color: "var(--fg)" }}
          >
            {FUSEAUX.map(tz => <option key={tz} value={tz}>{tz}</option>)}
          </select>
        </Card>

        {/* Parrainage */}
        <Card title={t.settings_referral}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[14px] font-medium" style={{ color: "var(--fg)" }}>{t.settings_referral_title}</p>
              <p className="text-[12px] mt-0.5" style={{ color: "var(--fg-tertiary)" }}>
                {t.settings_referral_desc}
              </p>
            </div>
            <Toggle value={parrainageActif} onChange={async (v) => {
              setParrainageActif(v);
              await saveMarchandFields(user!, { parrainage_actif: v });
            }} />
          </div>
          {parrainageActif && (
            <div className="mt-4 rounded-2xl p-3" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
              <p className="text-[11px] font-semibold uppercase tracking-widest mb-1.5" style={{ color: "var(--fg-tertiary)" }}>{t.settings_referral_how}</p>
              <div className="space-y-1.5">
                {[t.settings_referral_step1, t.settings_referral_step2, t.settings_referral_step3].map(step => (
                  <div key={step} className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ background: "var(--accent)" }} />
                    <p className="text-[12px]" style={{ color: "var(--fg-secondary)" }}>{step}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>

        {/* Notifications clients */}
        <Card title={t.settings_notif_card_title} className="lg:col-span-2">
          <div className="flex items-start justify-between gap-3 mb-4">
            <div>
              <p className="text-[14px] font-medium" style={{ color: "var(--fg)" }}>{t.settings_notif_prompt_title}</p>
              <p className="text-[12px] mt-0.5" style={{ color: "var(--fg-tertiary)" }}>
                {t.settings_notif_prompt_desc}
              </p>
            </div>
            <Toggle value={notifActif} onChange={setNotifActif} />
          </div>

          {notifActif && (
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-widest mb-2" style={{ color: "var(--fg-tertiary)" }}>
                {t.settings_notif_msg_label}
              </p>
              <textarea
                value={notifMessage}
                onChange={e => setNotifMessage(e.target.value)}
                rows={2}
                className="w-full px-4 py-3 rounded-2xl text-[13px] outline-none resize-none"
                style={{ background: "var(--bg)", border: "1px solid var(--border)", color: "var(--fg)", lineHeight: 1.5 }}
                onFocus={e => (e.target.style.borderColor = "var(--accent)")}
                onBlur={e => (e.target.style.borderColor = "var(--border)")}
              />
              <div className="mt-3 rounded-2xl p-3" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
                <p className="text-[10px] uppercase tracking-widest mb-2" style={{ color: "var(--fg-tertiary)" }}>Aperçu</p>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg flex-shrink-0 overflow-hidden" style={{ background: marchand.couleur_principale || "var(--accent)" }}>
                    {(marchand as Record<string,unknown>).logo_url
                      ? <img src={(marchand as Record<string,unknown>).logo_url as string} alt="" className="w-full h-full object-cover" />
                      : <span className="w-full h-full flex items-center justify-center text-white font-semibold text-[13px]">{marchand.nom?.[0] || "W"}</span>
                    }
                  </div>
                  <div>
                    <p className="text-[13px] font-medium mb-0.5" style={{ color: "var(--fg)" }}>{t.settings_notif_preview}</p>
                    <p className="text-[12px]" style={{ color: "var(--fg-secondary)" }}>{notifMessage}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </Card>

      </div>

      {/* Sticky save — mobile uniquement */}
      <div className="md:hidden fixed left-0 right-0 z-30 px-4 pt-3 pb-3"
        style={{
          bottom: "calc(60px + env(safe-area-inset-bottom, 0px))",
          background: "var(--glass-bg)",
          backdropFilter: "blur(20px)",
          borderTop: "1px solid var(--border)",
        }}>
        <button
          onClick={sauvegarder}
          disabled={saving}
          className="w-full py-3.5 rounded-2xl text-[15px] font-semibold text-white transition-all duration-300"
          style={{ background: saved ? "#34C759" : "var(--accent)", boxShadow: "0 4px 16px rgba(0,122,255,0.25)" }}
        >
          {saving ? t.settings_saving : saved ? `${t.settings_saved} ✓` : t.settings_save}
        </button>
      </div>

      {/* Save desktop */}
      <div className="mt-6">
        <button
          onClick={sauvegarder}
          disabled={saving}
          className="hidden md:block w-full py-4 rounded-2xl text-[15px] font-semibold text-white transition-all duration-300"
          style={{ background: saved ? "#34C759" : "var(--accent)", boxShadow: "0 4px 20px rgba(0,122,255,0.2)" }}
        >
          {saving ? t.settings_saving : saved ? `${t.settings_saved} ✓` : t.settings_save}
        </button>

        {/* Apparence */}
        <div className="mt-4 rounded-2xl p-5"
          style={{ background: "var(--glass-bg)", border: "1px solid var(--border)" }}>
          <p className="text-[11px] font-semibold uppercase tracking-widest mb-4" style={{ color: "var(--fg-tertiary)" }}>
            {t.settings_appearance}
          </p>
          <div className="flex items-center justify-between mb-4">
            <p className="text-[14px] font-medium" style={{ color: "var(--fg)" }}>{t.settings_display_mode}</p>
            <ThemeToggle />
          </div>
          <div className="flex items-center justify-between">
            <p className="text-[14px] font-medium" style={{ color: "var(--fg)" }}>{t.settings_language}</p>
            <div className="flex gap-2">
              {(["fr", "ro", "es"] as const).map(l => (
                <button key={l} onClick={() => setLangue(l)}
                  className="px-4 py-1.5 rounded-xl text-[13px] font-semibold transition-all"
                  style={{
                    background: langue === l ? "var(--accent)" : "var(--glass-bg)",
                    color: langue === l ? "white" : "var(--fg-secondary)",
                    border: `1px solid ${langue === l ? "var(--accent)" : "var(--border)"}`,
                  }}>
                  {l === "fr" ? "FR" : l === "ro" ? "RO" : "ES"}
                </button>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

function Card({ title, children, className = "" }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-2xl p-5 ${className}`}
      style={{ background: "var(--glass-bg)", border: "1px solid var(--border)", backdropFilter: "blur(20px)" }}
    >
      <p className="text-[11px] font-semibold uppercase tracking-widest mb-4" style={{ color: "var(--fg-tertiary)" }}>
        {title}
      </p>
      {children}
    </div>
  );
}

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!value)}
      className="relative w-11 h-6 rounded-full transition-all duration-200 flex-shrink-0"
      style={{ background: value ? "var(--accent)" : "var(--border)" }}
    >
      <div
        className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-all duration-200"
        style={{ left: value ? "calc(100% - 22px)" : "2px" }}
      />
    </button>
  );
}
