"use client";

import { useAuth } from "@/lib/auth-context";
import { useEffect, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { creerClient, getClientByTelephone, formatTempsDepuis, type Client } from "@/lib/loyalty";
import { Icons } from "@/components/dashboard/icons";
import Link from "next/link";

type Sort = "recent" | "tampons" | "alpha";

export default function ClientsPage() {
  const { user, marchand, loading: authLoading } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<Sort>("recent");
  const [filterRecompense, setFilterRecompense] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ prenom: "", nom: "", telephone: "", date_naissance: "" });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [fetchError, setFetchError] = useState("");

  useEffect(() => {
    const uid = user?.uid;
    if (!uid) { setLoading(false); return; }

    let cancelled = false;
    const timeout = setTimeout(() => {
      if (!cancelled) setFetchError("Timeout — Firebase ne répond pas (vérifier connexion ou règles Firestore)");
    }, 8000);

    getDocs(query(collection(db, "clients"), where("marchand_id", "==", uid)))
      .then(snap => {
        if (cancelled) return;
        const liste = snap.docs.map(d => ({ id: d.id, ...d.data() } as Client));
        liste.sort((a, b) => {
          const ta = (a.date_inscription as { seconds?: number })?.seconds ?? 0;
          const tb = (b.date_inscription as { seconds?: number })?.seconds ?? 0;
          return tb - ta;
        });
        setClients(liste);
      })
      .catch(e => { if (!cancelled) setFetchError(String(e)); })
      .finally(() => { if (!cancelled) { clearTimeout(timeout); setLoading(false); } });

    return () => { cancelled = true; clearTimeout(timeout); };
  }, [user?.uid]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!marchand) return null;

  const recompensesCount = clients.filter(c => c.recompense_en_attente).length;

  const filtered = clients
    .filter(c => !filterRecompense || c.recompense_en_attente)
    .filter(c => !search || `${c.prenom} ${c.nom} ${c.telephone}`.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sort === "tampons") return b.tampons - a.tampons;
      if (sort === "alpha") return `${a.prenom} ${a.nom}`.localeCompare(`${b.prenom} ${b.nom}`, "fr");
      // "recent" : déjà trié par date_inscription dans charger()
    });

  async function ajouterClient() {
    if (!user || !form.prenom.trim() || !form.telephone.trim()) {
      setFormError("Prénom et téléphone requis.");
      return;
    }
    setSaving(true);
    setFormError("");
    const existing = await getClientByTelephone(form.telephone.trim(), user.uid);
    if (existing) {
      setFormError("Ce numéro est déjà inscrit.");
      setSaving(false);
      return;
    }
    await creerClient({
      prenom: form.prenom.trim(),
      nom: form.nom.trim(),
      telephone: form.telephone.trim(),
      date_naissance: form.date_naissance,
      marchand_id: user.uid,
    });
    setForm({ prenom: "", nom: "", telephone: "", date_naissance: "" });
    setShowModal(false);
    setSaving(false);
    await charger();
  }

  return (
    <div className="px-5 md:px-8 lg:px-10 pt-8 lg:pt-10 pb-28 md:pb-10">

      {/* Modal ajout client */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-5"
          style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(8px)" }}
          onClick={() => setShowModal(false)}
        >
          <div
            className="w-full max-w-sm rounded-[28px] p-7"
            style={{ background: "var(--bg)", border: "1px solid var(--border)" }}
            onClick={e => e.stopPropagation()}
          >
            <h3 className="text-[18px] font-semibold mb-5" style={{ color: "var(--fg)" }}>Ajouter un client</h3>
            <div className="space-y-3">
              {[
                { key: "prenom",        label: "Prénom *",         type: "text",  placeholder: "Marie" },
                { key: "nom",           label: "Nom",              type: "text",  placeholder: "Dupont" },
                { key: "telephone",     label: "Téléphone *",      type: "tel",   placeholder: "+212 6 00 00 00 00" },
                { key: "date_naissance",label: "Date de naissance",type: "date",  placeholder: "" },
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
                <p className="text-[13px]" style={{ color: "#FF3B30" }}>{formError}</p>
              )}
            </div>
            <div className="flex gap-3 mt-5">
              <button
                onClick={() => { setShowModal(false); setFormError(""); }}
                className="flex-1 py-3 rounded-2xl text-[14px] font-medium"
                style={{ background: "var(--glass-bg)", border: "1px solid var(--border)", color: "var(--fg)" }}
              >
                Annuler
              </button>
              <button
                onClick={ajouterClient}
                disabled={saving}
                className="flex-1 py-3 rounded-2xl text-[14px] font-semibold text-white"
                style={{ background: "var(--accent)" }}
              >
                {saving ? "Ajout…" : "Ajouter"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-end justify-between mb-5">
        <div>
          <p className="text-[12px] font-semibold uppercase tracking-widest mb-1" style={{ color: "var(--fg-tertiary)" }}>
            {loading ? "—" : `${clients.length} client${clients.length > 1 ? "s" : ""}`}
          </p>
          <h1 className="text-[28px] font-semibold tracking-[-0.5px]" style={{ color: "var(--fg)" }}>Clients</h1>
        </div>
        <button
          onClick={() => { setShowModal(true); setFormError(""); }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl text-[13px] font-semibold text-white"
          style={{ background: "var(--accent)", boxShadow: "0 4px 14px rgba(0,122,255,0.25)" }}
        >
          <span className="text-[18px] leading-none font-light">+</span>
          Ajouter
        </button>
      </div>

      {/* Filtres */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        {/* Recherche */}
        <div className="relative flex-1 min-w-[160px]">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: "var(--fg-tertiary)" }}>
            <Icons.Search size={15} />
          </span>
          <input
            type="text"
            placeholder="Rechercher…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl text-[14px] outline-none"
            style={{ background: "var(--glass-bg)", border: "1px solid var(--border)", color: "var(--fg)" }}
            onFocus={e => (e.target.style.borderColor = "var(--accent)")}
            onBlur={e => (e.target.style.borderColor = "var(--border)")}
          />
        </div>

        {/* Sort */}
        <select
          value={sort}
          onChange={e => setSort(e.target.value as Sort)}
          className="px-3 py-2.5 rounded-2xl text-[13px] outline-none"
          style={{ background: "var(--glass-bg)", border: "1px solid var(--border)", color: "var(--fg)" }}
        >
          <option value="recent">Plus récents</option>
          <option value="tampons">Plus de tampons</option>
          <option value="alpha">A → Z</option>
        </select>

        {/* Filtre récompenses */}
        {recompensesCount > 0 && (
          <button
            onClick={() => setFilterRecompense(f => !f)}
            className="flex items-center gap-1.5 px-3 py-2.5 rounded-2xl text-[13px] font-medium transition-all"
            style={{
              background: filterRecompense ? "rgba(52,199,89,0.12)" : "var(--glass-bg)",
              border: `1px solid ${filterRecompense ? "rgba(52,199,89,0.3)" : "var(--border)"}`,
              color: filterRecompense ? "#34C759" : "var(--fg-secondary)",
            }}
          >
            🎁 {recompensesCount}
          </button>
        )}
      </div>

      {/* Liste */}
      {/* DEBUG — à supprimer */}
      <div className="mb-4 p-3 rounded-xl text-[11px] font-mono" style={{ background: "rgba(0,0,0,0.06)", lineHeight: 1.8 }}>
        <div>user.uid: <b>{user?.uid ?? "NULL"}</b></div>
        <div>authLoading: <b>{String(authLoading)}</b></div>
        <div>loading: <b>{String(loading)}</b></div>
        <div>clients.length: <b>{clients.length}</b></div>
        {fetchError && <div style={{ color: "#FF453A" }}>error: {fetchError}</div>}
      </div>

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
        <div className="text-center py-20">
          <p className="text-[15px]" style={{ color: "var(--fg-tertiary)" }}>
            {search || filterRecompense ? "Aucun résultat" : "Aucun client pour l'instant"}
          </p>
        </div>
      ) : (
        <div className="space-y-2 lg:grid lg:grid-cols-2 lg:gap-3 lg:space-y-0">
          {filtered.map(client => {
            const initiales = `${(client.prenom?.[0] || "").toUpperCase()}${(client.nom?.[0] || "").toUpperCase()}`;
            const niveau = (client.niveau as number | undefined) ?? 0;
            const palier = marchand.paliers?.[niveau];
            const objectifActuel = palier?.tampons ?? marchand.objectif_tampons ?? 10;
            const pct = Math.min(100, Math.round((client.tampons / objectifActuel) * 100));
            return (
              <Link
                key={client.id}
                href={`/client/${client.wallet_id}`}
                className="flex items-center gap-3.5 p-4 rounded-2xl transition-all duration-150 hover:opacity-80 block"
                style={{ background: "var(--glass-bg)", border: "1px solid var(--border)", backdropFilter: "blur(20px)" }}
              >
                {/* Avatar */}
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white text-[13px] font-semibold flex-shrink-0"
                  style={{ background: "var(--accent)" }}
                >
                  {initiales}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-medium truncate" style={{ color: "var(--fg)" }}>
                    {client.prenom} {client.nom}
                  </p>
                  <p className="text-[11px] truncate" style={{ color: "var(--fg-tertiary)" }}>
                    {formatTempsDepuis(client.derniere_visite)}
                  </p>
                  <div className="mt-1.5 h-1 rounded-full overflow-hidden" style={{ background: "var(--border)" }}>
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${Math.min(pct, 100)}%`, background: "var(--accent)" }}
                    />
                  </div>
                </div>

                {/* Tampons + récompense */}
                <div className="text-right flex-shrink-0">
                  <p className="text-[15px] font-semibold" style={{ color: "var(--accent)" }}>
                    {client.tampons}
                    <span className="text-[11px] font-normal" style={{ color: "var(--fg-tertiary)" }}>
                      /{marchand.objectif_tampons}
                    </span>
                  </p>
                  {client.recompense_en_attente && (
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                      style={{ background: "rgba(52,199,89,0.12)", color: "#34C759" }}>
                      🎁 Récompense
                    </span>
                  )}
                </div>

                <Icons.ChevronRight />
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
