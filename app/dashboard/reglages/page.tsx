"use client";

import { useAuth } from "@/lib/auth-context";
import { useState } from "react";
import ThemeToggle from "@/components/ThemeToggle";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

const ANTI_DOUBLON = [
  { label: "15 minutes", value: 900 },
  { label: "1 heure",    value: 3600 },
  { label: "4 heures",   value: 14400 },
  { label: "8 heures",   value: 28800 },
  { label: "1 jour",     value: 86400 },
];

const FUSEAUX = [
  "Africa/Casablanca",
  "Europe/Paris",
  "Europe/London",
  "America/New_York",
  "Asia/Dubai",
];

export default function ReglagesPage() {
  const { user, marchand } = useAuth();
  const autoRaw = (marchand as Record<string, unknown>)?.automatisations as Record<string, Record<string, unknown>> | undefined;

  const [config, setConfig] = useState({
    anti_doublon_delai: marchand?.anti_doublon_delai || 86400,
    fuseau_horaire:   marchand?.fuseau_horaire || Intl.DateTimeFormat().resolvedOptions().timeZone,
  });
  const [auto, setAuto] = useState({
    anniversaire_actif:     Boolean(autoRaw?.anniversaire?.actif),
    anniversaire_jours_avant: Number(autoRaw?.anniversaire?.jours_avant ?? 0),
    anniversaire_message:   String(autoRaw?.anniversaire?.message ?? `Joyeux anniversaire ! Un tampon offert vous attend chez ${marchand?.nom || "nous"}.`),
    relance_actif:          Boolean(autoRaw?.relance?.actif),
    relance_delai_jours:    Number(autoRaw?.relance?.delai_jours ?? 30),
    relance_message:        String(autoRaw?.relance?.message ?? `Vous nous manquez ! Venez récupérer vos tampons chez ${marchand?.nom || "nous"}.`),
  });
  const [notifActif, setNotifActif] = useState<boolean>((marchand as Record<string,unknown>)?.notif_actif !== false);
  const [notifMessage, setNotifMessage] = useState<string>(
    ((marchand as Record<string,unknown>)?.notif_message as string) ||
    `Pour ne manquer aucune de vos récompenses chez ${marchand?.nom || "nous"}, activez les notifications !`
  );
  const m = marchand as Record<string, unknown>;
  const doubleFin = m.double_tampons_fin as string | undefined;
  const [doubleTamponsActif, setDoubleTamponsActif] = useState<boolean>(
    doubleFin ? new Date(doubleFin) > new Date() : false
  );
  const [doubleTamponsFin, setDoubleTamponsFin] = useState<string>(
    doubleFin ?? new Date(Date.now() + 86400000 * 2).toISOString().slice(0, 10)
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  if (!marchand || !user) return null;

  const set = (k: string, v: string | number) => setConfig(c => ({ ...c, [k]: v }));
  const setA = (k: string, v: boolean | number | string) => setAuto(a => ({ ...a, [k]: v }));

  async function sauvegarder() {
    setSaving(true);
    await updateDoc(doc(db, "marchands", user!.uid), {
      ...config,
      automatisations: {
        anniversaire: { actif: auto.anniversaire_actif, jours_avant: auto.anniversaire_jours_avant, message: auto.anniversaire_message },
        relance: { actif: auto.relance_actif, delai_jours: auto.relance_delai_jours, message: auto.relance_message },
      },
      notif_actif: notifActif,
      notif_message: notifMessage,
      double_tampons_fin: doubleTamponsActif ? doubleTamponsFin : null,
      updated_at: serverTimestamp(),
    });
    setSaving(false); setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  return (
    <div className="px-5 md:px-8 lg:px-10 pt-8 lg:pt-10 pb-28 md:pb-10 max-w-3xl">

      {/* Header */}
      <div className="mb-6">
        <p className="text-[12px] font-semibold uppercase tracking-widest mb-1" style={{ color: "var(--fg-tertiary)" }}>
          Configuration
        </p>
        <h1 className="text-[28px] font-semibold tracking-[-0.5px]" style={{ color: "var(--fg)" }}>Réglages</h1>
      </div>

      <div className="space-y-3 lg:grid lg:grid-cols-2 lg:gap-4 lg:space-y-0">


        {/* Anti-doublon */}
        <Card title="Anti-doublon">
          <select
            value={config.anti_doublon_delai}
            onChange={e => set("anti_doublon_delai", Number(e.target.value))}
            className="w-full px-4 py-3 rounded-2xl text-[14px] outline-none mb-2"
            style={{ background: "var(--bg)", border: "1px solid var(--border)", color: "var(--fg)" }}
          >
            {ANTI_DOUBLON.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <p className="text-[12px]" style={{ color: "var(--fg-tertiary)" }}>
            Délai minimum entre deux tampons pour un même client
          </p>
        </Card>

        {/* Double tampons */}
        <Card title="Double tampons">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div>
              <p className="text-[14px]" style={{ color: "var(--fg)" }}>
                {doubleTamponsActif
                  ? `Actif jusqu'au ${new Date(doubleTamponsFin).toLocaleDateString("fr-FR")}`
                  : "Désactivé"}
              </p>
              <p className="text-[12px] mt-0.5" style={{ color: "var(--fg-tertiary)" }}>
                Chaque visite ajoute 2 tampons au lieu de 1
              </p>
            </div>
            <Toggle value={doubleTamponsActif} onChange={setDoubleTamponsActif} />
          </div>
          {doubleTamponsActif && (
            <div className="pt-3" style={{ borderTop: "1px solid var(--border)" }}>
              <p className="text-[12px] mb-2" style={{ color: "var(--fg-secondary)" }}>Actif jusqu'au</p>
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
        <Card title="Automatisations" className="lg:col-span-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

            <div>
              <div className="flex items-start justify-between gap-3 mb-1">
                <div>
                  <p className="text-[14px] font-medium" style={{ color: "var(--fg)" }}>Anniversaire client</p>
                  <p className="text-[12px] mt-0.5" style={{ color: "var(--fg-tertiary)" }}>Bonus tampon automatique</p>
                </div>
                <Toggle value={auto.anniversaire_actif} onChange={v => setA("anniversaire_actif", v)} />
              </div>
              {auto.anniversaire_actif && (
                <div className="mt-3 pt-3 space-y-3" style={{ borderTop: "1px solid var(--border)" }}>
                  <div>
                    <p className="text-[12px] mb-2" style={{ color: "var(--fg-secondary)" }}>
                      {auto.anniversaire_jours_avant === 0 ? "Le jour J" : `${auto.anniversaire_jours_avant} jour(s) avant`}
                    </p>
                    <input type="range" min={0} max={7} value={auto.anniversaire_jours_avant}
                      onChange={e => setA("anniversaire_jours_avant", Number(e.target.value))}
                      className="w-full" />
                  </div>
                  <div>
                    <p className="text-[12px] mb-1.5" style={{ color: "var(--fg-secondary)" }}>Message d'anniversaire</p>
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
                  <p className="text-[14px] font-medium" style={{ color: "var(--fg)" }}>Relance inactifs</p>
                  <p className="text-[12px] mt-0.5" style={{ color: "var(--fg-tertiary)" }}>Clients sans visite depuis X jours</p>
                </div>
                <Toggle value={auto.relance_actif} onChange={v => setA("relance_actif", v)} />
              </div>
              {auto.relance_actif && (
                <div className="mt-3 pt-3 space-y-3" style={{ borderTop: "1px solid var(--border)" }}>
                  <div>
                    <p className="text-[12px] mb-2" style={{ color: "var(--fg-secondary)" }}>
                      Après {auto.relance_delai_jours} jours d&apos;inactivité
                    </p>
                    <input type="range" min={7} max={90} step={7} value={auto.relance_delai_jours}
                      onChange={e => setA("relance_delai_jours", Number(e.target.value))}
                      className="w-full" />
                  </div>
                  <div>
                    <p className="text-[12px] mb-1.5" style={{ color: "var(--fg-secondary)" }}>Message de relance</p>
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
        <Card title="Fuseau horaire">
          <select
            value={config.fuseau_horaire}
            onChange={e => set("fuseau_horaire", e.target.value)}
            className="w-full px-4 py-3 rounded-2xl text-[14px] outline-none"
            style={{ background: "var(--bg)", border: "1px solid var(--border)", color: "var(--fg)" }}
          >
            {FUSEAUX.map(tz => <option key={tz} value={tz}>{tz}</option>)}
          </select>
        </Card>

        {/* Notifications clients */}
        <Card title="Notifications clients" className="lg:col-span-2">
          <div className="flex items-start justify-between gap-3 mb-4">
            <div>
              <p className="text-[14px] font-medium" style={{ color: "var(--fg)" }}>Prompt d&apos;activation</p>
              <p className="text-[12px] mt-0.5" style={{ color: "var(--fg-tertiary)" }}>
                Affiché au client juste après la création de sa carte, pour activer les notifications push.
              </p>
            </div>
            <Toggle value={notifActif} onChange={setNotifActif} />
          </div>

          {notifActif && (
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-widest mb-2" style={{ color: "var(--fg-tertiary)" }}>
                Message personnalisé
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
                    <p className="text-[13px] font-medium mb-0.5" style={{ color: "var(--fg)" }}>Restez informé</p>
                    <p className="text-[12px]" style={{ color: "var(--fg-secondary)" }}>{notifMessage}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </Card>

      </div>

      {/* Save */}
      <div className="mt-6">
        <button
          onClick={sauvegarder}
          disabled={saving}
          className="w-full py-4 rounded-2xl text-[15px] font-semibold text-white transition-all duration-300"
          style={{ background: saved ? "#34C759" : "var(--accent)", boxShadow: "0 4px 20px rgba(0,122,255,0.2)" }}
        >
          {saving ? "Sauvegarde…" : saved ? "Sauvegardé ✓" : "Sauvegarder les réglages"}
        </button>

        {/* Apparence */}
        <div className="mt-4 rounded-2xl p-5"
          style={{ background: "var(--glass-bg)", border: "1px solid var(--border)" }}>
          <p className="text-[11px] font-semibold uppercase tracking-widest mb-4" style={{ color: "var(--fg-tertiary)" }}>
            Apparence
          </p>
          <div className="flex items-center justify-between">
            <p className="text-[14px] font-medium" style={{ color: "var(--fg)" }}>Mode d&apos;affichage</p>
            <ThemeToggle />
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
