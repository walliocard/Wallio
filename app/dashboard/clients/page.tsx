"use client";

import { useAuth } from "@/lib/auth-context";
import { useEffect, useRef, useState } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { creerClient, getClientByTelephone, formatTempsDepuis, setTampons as setTamponsLib, type Client } from "@/lib/loyalty";
import { Icons } from "@/components/dashboard/icons";
import Link from "next/link";
import { useLang } from "@/lib/lang-context";
import CompactHeader from "@/components/dashboard/CompactHeader";
import { formatName } from "@/lib/format";

const cap = (s: string) => s ? s.charAt(0).toUpperCase() + s.slice(1) : s;

type Sort = "recent" | "visite" | "tampons" | "alpha";

// ── Points de tampons ─────────────────────────────────────────────────────────

function StampDots({ tampons, objectif }: { tampons: number; objectif: number }) {
  if (objectif > 12) {
    const pct = Math.min(100, Math.round((tampons / objectif) * 100));
    return (
      <div style={{ height: 4, borderRadius: 2, background: "#E5E5EA", overflow: "hidden", flex: 1 }}>
        <div style={{ height: "100%", borderRadius: 2, background: "linear-gradient(90deg, #2F7BFF, #8B5CF6)", width: `${pct}%`, transition: "width 0.3s ease" }} />
      </div>
    );
  }
  return (
    <div style={{ display: "flex", gap: 4, flexWrap: "nowrap", alignItems: "center" }}>
      {Array.from({ length: objectif }).map((_, i) => (
        <div key={i} style={{
          width: 8, height: 8, borderRadius: "50%", flexShrink: 0,
          background: i < tampons ? "linear-gradient(135deg, #2F7BFF, #8B5CF6)" : "#E5E5EA",
        }} />
      ))}
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function ClientsPage() {
  const { user, marchand } = useAuth();
  const { t } = useLang();
  const titleRef = useRef<HTMLHeadingElement>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<Sort>("visite");
  const [filterRecompense, setFilterRecompense] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showSortSheet, setShowSortSheet] = useState(false);
  const [form, setForm] = useState({ prenom: "", nom: "", telephone: "", date_naissance: "", email: "" });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [fetchError, setFetchError] = useState("");
  const [validatingId, setValidatingId] = useState<string | null>(null);
  const [annivValidatingId, setAnnivValidatingId] = useState<string | null>(null);
  const [activeStampId, setActiveStampId] = useState<string | null>(null);
  const [stampLoading, setStampLoading] = useState<string | null>(null);

  const mn = marchand as Record<string, unknown> | null;
  const annivCustom = (mn?.automatisations as Record<string, unknown> | undefined)
    ?.anniversaire !== undefined &&
    ((mn?.automatisations as Record<string, unknown>)?.anniversaire as Record<string, unknown>)?.type === "custom";

  async function handleValiderAnniv(clientId: string) {
    if (!user || annivValidatingId) return;
    setAnnivValidatingId(clientId);
    try {
      const token = await user.getIdToken();
      await fetch("/api/valider-anniv", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ clientId }),
      });
    } catch { /* silent */ }
    finally { setAnnivValidatingId(null); }
  }

  async function handleValiderRecompense(clientId: string) {
    if (!user || validatingId) return;
    setValidatingId(clientId);
    try {
      const token = await user.getIdToken();
      await fetch("/api/valider-recompense", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ clientId }),
      });
    } catch { /* silent */ }
    finally { setValidatingId(null); }
  }

  async function handleAddStamp(clientId: string) {
    if (stampLoading) return;
    setStampLoading(clientId);
    try {
      const token = await user!.getIdToken();
      await fetch("/api/dashboard/tampon", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ clientId, forceOverride: true }),
      });
    } catch { /* silent */ }
    finally { setStampLoading(null); }
  }

  async function handleRemoveStamp(clientId: string, tampons: number) {
    if (stampLoading || tampons <= 0) return;
    setStampLoading(clientId);
    try {
      await setTamponsLib(clientId, tampons - 1);
    } catch { /* silent */ }
    finally { setStampLoading(null); }
  }

  useEffect(() => {
    const uid = user?.uid;
    if (!uid) { setLoading(false); return; }

    const unsub = onSnapshot(
      query(collection(db, "clients"), where("marchand_id", "==", uid)),
      (snap) => {
        const liste = snap.docs.map(d => ({ id: d.id, ...d.data() } as Client));
        liste.sort((a, b) => {
          const ta = (a.date_inscription as { seconds?: number })?.seconds ?? 0;
          const tb = (b.date_inscription as { seconds?: number })?.seconds ?? 0;
          return tb - ta;
        });
        setClients(liste);
        setLoading(false);
      },
      (err) => {
        setFetchError(String(err));
        setLoading(false);
      }
    );

    return () => unsub();
  }, [user?.uid]); // eslint-disable-line react-hooks/exhaustive-deps

  const recompensesCount = clients.filter(c => c.recompense_en_attente).length;

  const filtered = clients
    .filter(c => !filterRecompense || c.recompense_en_attente)
    .filter(c => !search || `${c.prenom} ${c.nom} ${c.telephone}`.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sort === "tampons") return b.tampons - a.tampons;
      if (sort === "alpha") return `${a.prenom} ${a.nom}`.localeCompare(`${b.prenom} ${b.nom}`, "fr");
      if (sort === "visite") return ((b.derniere_visite as { seconds?: number })?.seconds || 0) - ((a.derniere_visite as { seconds?: number })?.seconds || 0);
      return 0;
    });

  async function ajouterClient() {
    if (!user || !form.prenom.trim() || !form.telephone.trim() || !form.email.trim()) {
      setFormError(t.clients_error_required_msg);
      return;
    }
    setSaving(true);
    setFormError("");
    const existing = await getClientByTelephone(form.telephone.trim(), user.uid);
    if (existing) {
      setFormError(t.clients_error_exists_msg);
      setSaving(false);
      return;
    }
    const { walletId } = await creerClient({
      prenom: form.prenom.trim(),
      nom: form.nom.trim(),
      telephone: form.telephone.trim(),
      date_naissance: form.date_naissance,
      marchand_id: user.uid,
      email: form.email.trim(),
    });
    fetch("/api/admin/notify-new-client", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ prenom: form.prenom.trim(), nom: form.nom.trim(), marchandNom: marchand?.nom || "" }) }).catch(() => {});
    fetch("/api/client/register", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ telephone: form.telephone.trim(), prenom: form.prenom.trim(), nom: form.nom.trim(), dob: form.date_naissance, email: form.email.trim() }),
    }).catch(() => {});
    fetch("/api/send-welcome-email", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: form.email.trim(), prenom: form.prenom.trim(), marchandNom: marchand?.nom || "", walletId, mode: "inscription" }),
    }).catch(() => {});
    setForm({ prenom: "", nom: "", telephone: "", date_naissance: "", email: "" });
    setShowModal(false);
    setSaving(false);
  }

  const trenteJoursAgo = new Date();
  trenteJoursAgo.setDate(trenteJoursAgo.getDate() - 30);
  const todayMonth = new Date().getMonth() + 1;
  const todayDay = new Date().getDate();

  const SORT_OPTIONS: { label: string; value: Sort }[] = [
    { label: t.clients_sort_recent, value: "recent" },
    { label: "Dernier tampon", value: "visite" },
    { label: t.clients_sort_stamps, value: "tampons" },
    { label: t.clients_sort_alpha_label, value: "alpha" },
  ];

  return (
    <div>
      <CompactHeader title="Clients" observeRef={titleRef} />
      <div className="px-5 md:px-8 lg:px-10 pb-36 md:pb-10" style={{ paddingTop: "calc(env(safe-area-inset-top) + 20px)" }}>

      {/* Modal ajout client */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-5"
          style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(8px)", animation: "fade-in 0.2s ease" }}
          onClick={() => setShowModal(false)}
        >
          <div
            className="w-full max-w-sm rounded-[28px] p-7"
            style={{ background: "var(--bg)", border: "1px solid var(--border)", animation: "slide-up 0.3s cubic-bezier(0.34,1.06,0.64,1)" }}
            onClick={e => e.stopPropagation()}
          >
            <h3 className="text-[18px] font-semibold mb-5" style={{ color: "var(--fg)" }}>{t.clients_add_title}</h3>
            <div className="space-y-3">
              {[
                { key: "prenom",        label: t.clients_prenom, type: "text",  placeholder: "Marie" },
                { key: "nom",           label: t.clients_nom,    type: "text",  placeholder: "Dupont" },
                { key: "telephone",     label: t.clients_phone,  type: "tel",   placeholder: "+212 6 00 00 00 00" },
                { key: "email",         label: "Email",          type: "email", placeholder: "marie@email.com" },
                { key: "date_naissance",label: t.clients_dob,    type: "date",  placeholder: "" },
              ].map(f => (
                <div key={f.key}>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: "var(--fg-tertiary)" }}>
                    {f.label}
                  </label>
                  <input
                    type={f.type}
                    placeholder={f.placeholder}
                    value={form[f.key as keyof typeof form]}
                    onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                    className="w-full px-4 py-3 rounded-2xl text-[14px] outline-none"
                    style={{ background: "var(--glass-bg)", border: "1px solid var(--border)", color: "var(--fg)" }}
                    onFocus={e => (e.target.style.borderColor = "var(--accent)")}
                    onBlur={e => (e.target.style.borderColor = "var(--border)")}
                  />
                </div>
              ))}
              {formError && (
                <p className="text-[13px]" style={{ color: "#FF3B30", animation: "shake 0.4s ease-in-out" }}>{formError}</p>
              )}
            </div>
            <div className="flex gap-3 mt-5">
              <button
                onClick={() => { setShowModal(false); setFormError(""); }}
                className="flex-1 py-3 rounded-2xl text-[14px] font-medium"
                style={{ background: "var(--glass-bg)", border: "1px solid var(--border)", color: "var(--fg)" }}
              >
                {t.mes_cartes_delete_cancel}
              </button>
              <button
                onClick={ajouterClient}
                disabled={saving}
                className="flex-1 py-3 rounded-2xl text-[14px] font-semibold text-white"
                style={{ background: "var(--accent)" }}
              >
                {saving ? t.clients_adding : t.clients_add}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sheet tri */}
      {showSortSheet && (
        <div className="fixed inset-0 z-50 flex items-end"
          style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)" }}
          onClick={() => setShowSortSheet(false)}>
          <div className="w-full rounded-t-3xl p-6"
            style={{ background: "var(--bg)", animation: "slide-up 0.3s cubic-bezier(0.34,1.06,0.64,1)", paddingBottom: "max(24px, env(safe-area-inset-bottom))" }}
            onClick={e => e.stopPropagation()}>
            <div className="w-10 h-1 rounded-full mx-auto mb-5" style={{ background: "var(--border)" }} />
            <p className="text-[17px] font-semibold mb-4" style={{ color: "var(--fg)" }}>Trier par</p>
            <div className="space-y-1">
              {SORT_OPTIONS.map(opt => (
                <button key={opt.value}
                  onClick={() => { setSort(opt.value); setShowSortSheet(false); }}
                  className="w-full text-left px-4 py-3 rounded-2xl text-[15px] transition-all"
                  style={{
                    background: sort === opt.value ? "#EEF0FF" : "transparent",
                    color: sort === opt.value ? "#4B4FD6" : "var(--fg)",
                    fontWeight: sort === opt.value ? 600 : 400,
                    border: "none", cursor: "pointer",
                  }}>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 ref={titleRef} className="text-[34px] font-bold tracking-[-1px]" style={{ color: "var(--fg)" }}>{t.clients_title}</h1>
          {!loading && <p style={{ fontSize: 13, color: "var(--fg-tertiary)", marginTop: 2 }}>{clients.length} client{clients.length > 1 ? "s" : ""}</p>}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {/* Tri */}
          <button
            onClick={() => setShowSortSheet(true)}
            style={{ width: 36, height: 36, borderRadius: "50%", background: "#EEF0FF", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#4B4FD6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 5h10M11 9h7M11 13h4"/><path d="M3 5l4 4-4 4"/>
            </svg>
          </button>
          {/* Ajouter */}
          <button
            onClick={() => { setShowModal(true); setFormError(""); }}
            style={{ width: 36, height: 36, borderRadius: "50%", background: "#EEF0FF", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#4B4FD6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Filtres */}
      <div className="flex gap-2 mb-4">
        {/* Recherche */}
        <div className="relative flex-1">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: "var(--fg-tertiary)" }}>
            <Icons.Search size={15} />
          </span>
          <input
            type="text"
            placeholder={t.clients_search}
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl text-[14px] outline-none"
            style={{ background: "var(--glass-bg)", border: "1px solid var(--border)", color: "var(--fg)" }}
            onFocus={e => (e.target.style.borderColor = "var(--accent)")}
            onBlur={e => (e.target.style.borderColor = "var(--border)")}
          />
        </div>
        {recompensesCount > 0 && (
          <button
            onClick={() => setFilterRecompense(f => !f)}
            className="flex items-center gap-1.5 px-3 py-2.5 rounded-2xl text-[13px] font-medium transition-all flex-shrink-0"
            style={{
              background: filterRecompense ? "rgba(52,199,89,0.12)" : "var(--glass-bg)",
              border: `1px solid ${filterRecompense ? "rgba(52,199,89,0.3)" : "var(--border)"}`,
              color: filterRecompense ? "#34C759" : "var(--fg-secondary)",
            }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 12v10H4V12"/><path d="M22 7H2v5h20V7z"/><path d="M12 22V7"/>
              <path d="M12 7H7.5a2.5 2.5 0 010-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 000-5C13 2 12 7 12 7z"/>
            </svg>
            {recompensesCount}
          </button>
        )}
      </div>

      {/* Liste */}
      {fetchError ? (
        <div className="py-10 text-center">
          <p className="text-[13px] font-mono px-4" style={{ color: "#FF453A", wordBreak: "break-all" }}>{fetchError}</p>
        </div>
      ) : loading ? (
        <div className="flex justify-center py-20">
          <div className="w-5 h-5 rounded-full border-2 animate-spin"
            style={{ borderColor: "var(--border)", borderTopColor: "var(--accent)" }} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: "#EEF0FF" }}>
            <span style={{ color: "#4B4FD6" }}><Icons.Users size={28} /></span>
          </div>
          <div>
            <p className="text-[16px] font-semibold mb-1" style={{ color: "var(--fg)" }}>
              {search ? "Aucun résultat" : "Aucun client pour l'instant"}
            </p>
            <p className="text-[13px]" style={{ color: "var(--fg-tertiary)" }}>
              {search ? "Essayez un autre nom ou numéro" : "Les clients apparaissent ici après leur premier scan"}
            </p>
          </div>
        </div>
      ) : (
        <div style={{ background: "#FFFFFF", borderRadius: 20, border: "1px solid var(--border)", overflow: "hidden", boxShadow: "var(--shadow-sm)" }}
          className="lg:grid lg:grid-cols-2 lg:gap-0 fade-y">
          {filtered.map((client, idx) => {
            const initiales = `${(client.prenom?.[0] || "").toUpperCase()}${(client.nom?.[0] || "").toUpperCase()}`;
            const mn = marchand as Record<string, unknown> | undefined;
            const paliersDef = (mn?.paliers as { tampons: number; recompense: string }[]) || [];
            const pv = client.paliers_valides || [];
            const enProgressif = mn?.mode_recompense === "progressif" && paliersDef.length > 0;
            const prochainPalier = enProgressif ? (paliersDef.find((p, i) => !pv[i]) ?? paliersDef[paliersDef.length - 1]) : null;
            const enFlex = mn?.mode_recompense === "flex";
            const palierInt = (mn?.palier_intermediaire as number ?? 5);
            // Au-dessus du palier (tampons > palier) → le client a forcément choisi « grand »
            // → on vise l'objectif final, pas le palier intermédiaire.
            const flexObjectif = enFlex
              ? ((client as Record<string,unknown>).choix_fait === "grand" || client.tampons > palierInt
                ? (mn?.objectif_tampons as number ?? 10)
                : palierInt)
              : null;
            const objectifActuel = prochainPalier ? prochainPalier.tampons : (flexObjectif ?? (marchand?.objectif_tampons ?? 10));
            const dvSeconds = (client.derniere_visite as { seconds?: number })?.seconds;
            const isInactif = dvSeconds ? (dvSeconds * 1000) < trenteJoursAgo.getTime() : false;
            const isProche = client.tampons === objectifActuel - 1 && !client.recompense_en_attente;
            const isAnniversaire = (() => {
              const parts = client.date_naissance?.split("-");
              return parts?.length === 3 && parseInt(parts[1]) === todayMonth && parseInt(parts[2]) === todayDay;
            })();
            void isInactif;
            return (
              <Link
                key={client.id}
                href={`/client/${client.wallet_id}`}
                className="flex items-center gap-3 p-3.5 transition-all duration-150 active:opacity-70 hover:opacity-80 block"
                style={{ borderBottom: idx < filtered.length - 1 ? `1px solid var(--separator)` : "none", animation: "stagger-in 0.35s ease backwards", animationDelay: `${Math.min(idx * 0.04, 0.4)}s` }}
                onClick={() => { if (activeStampId) { setActiveStampId(null); } }}
              >
                {/* Avatar rond */}
                <div
                  className="w-11 h-11 flex items-center justify-center text-[13px] font-bold flex-shrink-0"
                  style={{
                    borderRadius: "50%",
                    background: client.recompense_en_attente ? "linear-gradient(135deg,#2F7BFF,#8B5CF6)" : "#EEF0FF",
                    color: client.recompense_en_attente ? "white" : "#4B4FD6",
                  }}
                >
                  {initiales}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                    <p className="text-[14px] font-semibold truncate" style={{ color: "var(--fg)" }}>
                      {formatName(client.prenom)} {formatName(client.nom)}
                    </p>
                    {client.recompense_en_attente && (
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full flex-shrink-0"
                        style={{ background: "rgba(52,199,89,0.12)", color: "#34C759" }}>
                        {t.dash_rewards}
                      </span>
                    )}
                    {!!(client as Record<string,unknown>).choix_en_attente && (
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full flex-shrink-0"
                        style={{ background: "rgba(0,122,255,0.10)", color: "#007AFF" }}>
                        Choix
                      </span>
                    )}
                    {annivCustom && client.birthday_bonus && (
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full flex-shrink-0"
                        style={{ background: "rgba(255,45,85,0.12)", color: "#FF2D55" }}>
                        Anniversaire !
                      </span>
                    )}
                    {isAnniversaire && (
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full flex-shrink-0"
                        style={{ background: "rgba(255,159,10,0.12)", color: "#FF9F0A" }}>
                        Anniv.
                      </span>
                    )}
                    {isProche && (
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full flex-shrink-0"
                        style={{ background: "#EEF0FF", color: "#4B4FD6" }}>
                        Presque
                      </span>
                    )}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 2 }}>
                    <p className="text-[11px]" style={{ color: "var(--fg-tertiary)", flexShrink: 0 }}>
                      {formatTempsDepuis(client.derniere_visite)}
                    </p>
                    <StampDots tampons={client.tampons} objectif={objectifActuel} />
                  </div>
                </div>

                {/* Contrôle tampons / actions */}
                {client.recompense_en_attente ? (
                  <button
                    onClick={e => { e.preventDefault(); e.stopPropagation(); handleValiderRecompense(client.id); }}
                    disabled={validatingId === client.id}
                    className="flex-shrink-0 text-[12px] font-semibold px-3 py-1.5 rounded-xl"
                    style={{ background: "#34C759", color: "white", border: "none", cursor: "pointer", opacity: validatingId === client.id ? 0.6 : 1 }}
                  >
                    {validatingId === client.id ? "…" : "Valider"}
                  </button>
                ) : annivCustom && client.birthday_bonus ? (
                  <button
                    onClick={e => { e.preventDefault(); e.stopPropagation(); handleValiderAnniv(client.id); }}
                    disabled={annivValidatingId === client.id}
                    className="flex-shrink-0 text-[12px] font-semibold px-3 py-1.5 rounded-xl"
                    style={{ background: "#FF2D55", color: "white", border: "none", cursor: "pointer", opacity: annivValidatingId === client.id ? 0.6 : 1 }}
                  >
                    {annivValidatingId === client.id ? "…" : "Cadeau"}
                  </button>
                ) : activeStampId === client.id ? (
                  /* Contrôle +/− actif */
                  <div
                    onClick={e => { e.preventDefault(); e.stopPropagation(); }}
                    style={{ display: "flex", alignItems: "center", gap: 2, background: "#EEF0FF", borderRadius: 12, padding: "2px 2px", flexShrink: 0 }}
                  >
                    <button
                      onClick={e => { e.preventDefault(); e.stopPropagation(); handleRemoveStamp(client.id, client.tampons); }}
                      disabled={stampLoading === client.id || client.tampons <= 0}
                      style={{ width: 30, height: 30, border: "none", background: "transparent", cursor: client.tampons > 0 ? "pointer" : "default", color: "#4B4FD6", fontSize: 20, fontWeight: 300, display: "flex", alignItems: "center", justifyContent: "center", opacity: client.tampons <= 0 ? 0.3 : 1 }}
                    >
                      {stampLoading === client.id ? "·" : "−"}
                    </button>
                    <span style={{ fontSize: 14, fontWeight: 700, color: "#4B4FD6", minWidth: 20, textAlign: "center", fontVariantNumeric: "tabular-nums" }}>
                      {client.tampons}
                    </span>
                    <button
                      onClick={e => { e.preventDefault(); e.stopPropagation(); handleAddStamp(client.id); }}
                      disabled={stampLoading === client.id}
                      style={{ width: 30, height: 30, border: "none", background: "transparent", cursor: "pointer", color: "#4B4FD6", fontSize: 20, fontWeight: 300, display: "flex", alignItems: "center", justifyContent: "center" }}
                    >
                      {stampLoading === client.id ? "·" : "+"}
                    </button>
                  </div>
                ) : (
                  /* Badge tampon tappable */
                  <button
                    onClick={e => { e.preventDefault(); e.stopPropagation(); setActiveStampId(client.id); }}
                    style={{ background: "#EEF0FF", color: "#4B4FD6", borderRadius: 10, padding: "5px 10px", border: "none", cursor: "pointer", fontWeight: 700, fontSize: 14, fontVariantNumeric: "tabular-nums", flexShrink: 0 }}
                  >
                    {client.tampons}
                    <span style={{ fontSize: 11, fontWeight: 500, color: "#8B9CF7" }}>/{objectifActuel}</span>
                  </button>
                )}
              </Link>
            );
          })}
        </div>
      )}
      </div>
    </div>
  );
}
