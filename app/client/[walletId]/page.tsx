"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { doc, deleteDoc, collection, query, where, getDocs, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  getClientByWalletId, getMarchandById,
  ajouterTampon, validerRecompense, setTampons, checkEtRecompenseParrain,
  formatTemps, formatTempsDepuis,
  type Client, type Marchand, type TamponResult,
} from "@/lib/loyalty";
import { useAuth } from "@/lib/auth-context";
import { Icons } from "@/components/dashboard/icons";
import { haptic } from "@/lib/haptics";

const AVATAR_PALETTES = [
  { bg: "rgba(94,140,247,0.18)",  text: "#5E8CF7" },
  { bg: "rgba(139,127,212,0.18)", text: "#9B8FE8" },
  { bg: "rgba(52,199,137,0.18)",  text: "#34C789" },
  { bg: "rgba(247,133,110,0.18)", text: "#E8785E" },
  { bg: "rgba(240,160,96,0.18)",  text: "#E0A060" },
  { bg: "rgba(112,184,232,0.18)", text: "#60B8E8" },
  { bg: "rgba(212,127,179,0.18)", text: "#D47FB3" },
  { bg: "rgba(92,200,168,0.18)",  text: "#5CC8A8" },
];
function avatarColor(initials: string) {
  const code = (initials.charCodeAt(0) || 0) + (initials.charCodeAt(1) || 0);
  return AVATAR_PALETTES[code % AVATAR_PALETTES.length];
}

import { formatPhone, formatName } from "@/lib/format";

function anniversaireInfo(dob: string | undefined): { label: string; isToday: boolean } {
  if (!dob) return { label: "—", isToday: false };
  const parts = dob.split("-");
  if (parts.length !== 3) return { label: dob, isToday: false };
  const today = new Date();
  const month = parseInt(parts[1]) - 1;
  const day = parseInt(parts[2]);
  const monthLabel = new Date(2000, month, day).toLocaleDateString("fr-FR", { day: "numeric", month: "long" });
  const isToday = today.getDate() === day && today.getMonth() === month;
  if (isToday) return { label: monthLabel, isToday: true };
  const thisYearBday = new Date(today.getFullYear(), month, day);
  const nextBday = thisYearBday < today
    ? new Date(today.getFullYear() + 1, month, day)
    : thisYearBday;
  const days = Math.ceil((nextBday.getTime() - today.getTime()) / 86400000);
  return { label: `${monthLabel} · dans ${days} jour${days > 1 ? "s" : ""}`, isToday: false };
}

function formatVisiteDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
  const time = d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  if (d.toDateString() === today.toDateString()) return `Aujourd'hui à ${time}`;
  if (d.toDateString() === yesterday.toDateString()) return `Hier à ${time}`;
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" }) + ` à ${time}`;
}

const cap = (s: string) => s ? s.charAt(0).toUpperCase() + s.slice(1) : s;

interface VisiteEntry {
  id: string;
  created_at: string | null;
  type: string;
  added_by: string;
  tampons_apres: number;
  recompense: boolean;
}

function VisiteBadge({ type }: { type: string }) {
  const styles: Record<string, { bg: string; color: string; label: string }> = {
    manuel_equipe:  { bg: "rgba(255,159,10,0.12)",  color: "#FF9F0A", label: "Manuel" },
    qr_equipe:      { bg: "rgba(0,122,255,0.10)",   color: "#007AFF", label: "QR" },
    qr_gerant:      { bg: "rgba(139,92,246,0.10)",  color: "#8B5CF6", label: "QR" },
    nfc_client:     { bg: "rgba(0,199,190,0.10)",   color: "#00C7BE", label: "NFC" },
    auto_validation:{ bg: "rgba(52,199,89,0.10)",   color: "#34C759", label: "Auto" },
    anti_doublon:      { bg: "rgba(255,59,48,0.10)",   color: "#FF3B30", label: "Refusé" },
    correction_gerant: { bg: "rgba(255,149,0,0.10)",   color: "#FF9500", label: "Correction" },
  };
  const s = styles[type] ?? { bg: "rgba(142,142,147,0.10)", color: "#8E8E93", label: "—" };
  return (
    <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 8px", borderRadius: 6, background: s.bg, color: s.color, flexShrink: 0 }}>
      {s.label}
    </span>
  );
}

export default function ClientQrPage({ params }: { params: Promise<{ walletId: string }> }) {
  const { walletId } = use(params);
  const { user, marchand: marchandAuth, loading: authLoading } = useAuth();
  const [client, setClient] = useState<Client | null>(null);
  const [marchand, setMarchand] = useState<Marchand | null>(null);
  const [result, setResult] = useState<TamponResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [ajoutEnCours, setAjoutEnCours] = useState(false);
  const [validationEnCours, setValidationEnCours] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleted, setDeleted] = useState(false);
  const [enregistrantChoix, setEnregistrantChoix] = useState(false);
  const [reinitialisantChoix, setReinitialisantChoix] = useState(false);
  // UI state
  const [phoneCopied, setPhoneCopied] = useState(false);
  const [showCheck, setShowCheck] = useState(false);
  const [showCorrectionSheet, setShowCorrectionSheet] = useState(false);
  const [correctionValue, setCorrectionValue] = useState(0);
  const [correctionSaving, setCorrectionSaving] = useState(false);
  const [correctionSaved, setCorrectionSaved] = useState(false);
  const [recentVisits, setRecentVisits] = useState<VisiteEntry[]>([]);
  const [totalVisites, setTotalVisites] = useState(0);
  const [totalRecompenses, setTotalRecompenses] = useState(0);

  useEffect(() => {
    if (authLoading) return;
    if (!user || !marchandAuth?.actif) { setLoading(false); return; }
    async function init() {
      const m = await getMarchandById(user!.uid);
      if (!m) { setLoading(false); return; }
      setMarchand(m);
      const c = await getClientByWalletId(walletId, user!.uid);
      setClient(c);
      setLoading(false);
    }
    init();
  }, [user, marchandAuth, authLoading, walletId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!client?.id || !user?.uid) return;
    getDocs(
      query(
        collection(db, "marchands", user.uid, "historique"),
        where("client_id", "==", client.id)
      )
    ).then(snap => {
      const all: VisiteEntry[] = snap.docs
        .filter(d => !String(d.data().type || "").startsWith("choix_"))
        .map(d => ({
          id: d.id,
          created_at: d.data().created_at?.toDate?.()?.toISOString() || null,
          type: d.data().type,
          added_by: d.data().added_by,
          tampons_apres: d.data().tampons_apres,
          recompense: d.data().recompense || false,
        }))
        .sort((a, b) => (b.created_at || "").localeCompare(a.created_at || ""));
      setTotalVisites(all.filter(e => e.type !== "anti_doublon" && e.type !== "auto_validation").length);
      setTotalRecompenses(all.filter(e => e.recompense).length);
      setRecentVisits(all.filter(e => e.type !== "anti_doublon").slice(0, 5));
    }).catch(() => {});
  }, [client?.id, user?.uid]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleAjouterTampon(forceOverride = false) {
    if (!client || !marchand || ajoutEnCours) return;
    setAjoutEnCours(true);
    const r = await ajouterTampon(client, marchand, forceOverride);
    setResult(r);
    if (r.type === "ok" || r.type === "recompense" || r.type === "choix_requis") {
      setClient(prev => prev ? {
        ...prev,
        tampons: r.type === "ok" ? r.tampons
          : r.type === "recompense" && r.palier_index !== undefined ? r.tampons
          : r.type === "choix_requis" ? r.tampons
          : 0,
        recompense_en_attente: r.type === "recompense" ? true : prev.recompense_en_attente,
        choix_en_attente: r.type === "choix_requis" ? true : prev.choix_en_attente,
        derniere_visite: { seconds: Date.now() / 1000 } as never,
        ...(!prev.paliers_valides && (
          (r.type === "ok" && r.prochainRecompense !== undefined) ||
          (r.type === "recompense" && r.palier_index !== undefined)
        ) ? { paliers_valides: [] as boolean[] } : {}),
      } : prev);
      const body = JSON.stringify({ walletId: client.wallet_id });
      const opts = { method: "POST", headers: { "Content-Type": "application/json" }, body };
      fetch("/api/apple-wallet/push-update", opts).catch(() => {});
      fetch("/api/google-wallet/push-update", opts).catch(() => {});
      if (marchand) {
        checkEtRecompenseParrain(client, marchand.id).then(res => {
          if (!res) return;
          const b = JSON.stringify({ walletId: res.walletId });
          const o = { method: "POST", headers: { "Content-Type": "application/json" }, body: b };
          fetch("/api/apple-wallet/push-update", o).catch(() => {});
          fetch("/api/google-wallet/push-update", o).catch(() => {});
          fetch("/api/notify-parrainage", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ parrainWalletId: res.walletId, filleulPrenom: client.prenom, filleulNom: client.nom, type: "visite", recompense: res.recompense, marchandId: marchand.id, marchandNom: marchand.nom }),
          }).catch(() => {});
        }).catch(() => {});
      }
      if (r.type === "ok" || r.type === "recompense") {
        setShowCheck(true);
        haptic("medium");
        setTimeout(() => setShowCheck(false), 800);
      }
      setTimeout(() => setAjoutEnCours(false), 1000);
    } else {
      setAjoutEnCours(false);
    }
  }

  async function handleValiderRecompense() {
    if (!client || !marchand || validationEnCours) return;
    setValidationEnCours(true);
    const m = marchand as Record<string, unknown>;
    const mode = (m.mode_recompense as string) || "cyclique";
    const paliers = (m.paliers as { tampons: number; recompense: string }[]) || [];
    const paliersValides = client.paliers_valides || [];
    const isProgressiveReward = mode === "progressif" && paliers.length > 0 && client.paliers_valides !== undefined;
    if (isProgressiveReward) {
      const palierIndex = result?.type === "recompense" && result.palier_index !== undefined
        ? result.palier_index
        : paliers.findIndex((p, i) => !paliersValides[i] && client.tampons >= p.tampons);
      if (palierIndex !== -1) {
        await validerRecompense(client.id, "progressif", palierIndex, paliersValides, paliers.length);
        const nouveauxPV = [...paliersValides];
        nouveauxPV[palierIndex] = true;
        const cycleTermine = nouveauxPV.filter(Boolean).length >= paliers.length;
        setClient(prev => prev ? {
          ...prev,
          recompense_en_attente: false,
          paliers_valides: cycleTermine ? [] : nouveauxPV,
          ...(cycleTermine ? { tampons: 0 } : {}),
        } : prev);
      } else {
        await validerRecompense(client.id);
        setClient(prev => prev ? { ...prev, tampons: 0, recompense_en_attente: false } : prev);
      }
    } else if (mode === "flex") {
      const choixFait = client.choix_fait;
      if (!choixFait) { setValidationEnCours(false); return; }
      const seuilReset = choixFait === "petit"
        ? (m?.palier_intermediaire as number | undefined)
        : marchand?.objectif_tampons;
      if (seuilReset !== undefined && seuilReset !== null) {
        await validerRecompense(client.id, "flex", undefined, undefined, undefined, client.tampons, seuilReset);
        const nouveauxTampons = Math.max(0, client.tampons - seuilReset);
        setClient(prev => prev ? { ...prev, tampons: nouveauxTampons, recompense_en_attente: false, choix_fait: undefined } : prev);
      }
    } else {
      await validerRecompense(client.id);
      setClient(prev => prev ? { ...prev, tampons: 0, recompense_en_attente: false } : prev);
    }
    const body = JSON.stringify({ walletId: client.wallet_id });
    const opts = { method: "POST", headers: { "Content-Type": "application/json" }, body };
    fetch("/api/apple-wallet/push-update", opts).catch(() => {});
    fetch("/api/google-wallet/push-update", opts).catch(() => {});
    setResult(null);
    setValidationEnCours(false);
  }

  async function handleEnregistrerChoix(choix: "petit" | "grand") {
    if (!client || !user || enregistrantChoix) return;
    setEnregistrantChoix(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch("/api/dashboard/enregistrer-choix", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ clientId: client.id, choix }),
      });
      const data = await res.json();
      if (data.ok || data.already_done) {
        setClient(prev => prev ? {
          ...prev,
          choix_en_attente: undefined,
          choix_fait: choix,
          ...(choix === "petit" ? { recompense_en_attente: true } : {}),
        } : prev);
      }
    } catch { /* silent */ }
    finally { setEnregistrantChoix(false); }
  }

  async function handleReinitialiserChoix() {
    if (!client || reinitialisantChoix) return;
    setReinitialisantChoix(true);
    const { updateDoc, doc: fDoc, deleteField } = await import("firebase/firestore");
    const { db: db2 } = await import("@/lib/firebase");
    await updateDoc(fDoc(db2, "clients", client.id), {
      choix_en_attente: true,
      choix_fait: deleteField(),
      recompense_en_attente: false,
    });
    setClient(prev => prev ? { ...prev, choix_en_attente: true, choix_fait: undefined, recompense_en_attente: false } : prev);
    setReinitialisantChoix(false);
  }

  async function handleCorrectionSave() {
    if (!client || !marchand || correctionSaving) return;
    setCorrectionSaving(true);
    const maxT = modeRecompense === "progressif" && paliersDef.length > 0
      ? paliersDef[paliersDef.length - 1].tampons
      : marchand.objectif_tampons;
    const next = Math.max(0, Math.min(correctionValue, maxT));
    let newPV: boolean[] | undefined;
    if (modeRecompense === "progressif" && paliersDef.length > 0) {
      newPV = paliersDef.map(p => next >= p.tampons);
    }
    const flexClear = modeRecompense === "flex" && !!(client.choix_en_attente || client.choix_fait);
    await setTampons(client.id, next, newPV, flexClear);
    // Log dans l'historique — précise gérant ou équipe + qui
    addDoc(collection(db, "marchands", marchand.id, "historique"), {
      client_id: client.id,
      client_prenom: client.prenom,
      client_nom: client.nom || "",
      tampons_avant: client.tampons,
      tampons_apres: next,
      recompense: false,
      type: "correction_gerant",
      added_by: marchand.nom,
      created_at: serverTimestamp(),
    }).catch(() => {});
    setClient(prev => prev ? {
      ...prev,
      tampons: next,
      ...(newPV !== undefined ? { paliers_valides: newPV } : {}),
      ...(flexClear ? { choix_en_attente: undefined, choix_fait: undefined, recompense_en_attente: false } : {}),
    } : prev);
    setResult(null);
    const body = JSON.stringify({ walletId: client.wallet_id });
    const opts = { method: "POST", headers: { "Content-Type": "application/json" }, body };
    fetch("/api/apple-wallet/push-update", opts).catch(() => {});
    fetch("/api/google-wallet/push-update", opts).catch(() => {});
    haptic("success");
    setCorrectionSaving(false);
    setShowCorrectionSheet(false);
    setCorrectionSaved(true);
    setTimeout(() => setCorrectionSaved(false), 2500);
  }

  async function copyPhone() {
    if (!client?.telephone) return;
    try {
      await navigator.clipboard.writeText(formatPhone(client.telephone));
      setPhoneCopied(true);
      setTimeout(() => setPhoneCopied(false), 2000);
    } catch {}
  }

  if (loading || authLoading) return <Loading />;
  if (!user || !marchandAuth?.actif) return <Erreur message="Connectez-vous pour accéder à cette page." />;
  if (!client) return <Erreur message="Client introuvable pour cet établissement." />;

  const m = marchand as Record<string, unknown> | null;
  const modeRecompense = (m?.mode_recompense as string) || "cyclique";
  const paliersDef = (m?.paliers as { tampons: number; recompense: string }[]) || [];
  const paliersValides = client.paliers_valides || [];

  let objectif: number;
  let nomRecompense: string;
  if (modeRecompense === "progressif" && paliersDef.length > 0) {
    const prochain = paliersDef.find((p, i) => !paliersValides[i]) ?? paliersDef[paliersDef.length - 1];
    objectif = prochain.tampons;
    nomRecompense = prochain.recompense;
  } else if (modeRecompense === "flex") {
    const palierInter = (m?.palier_intermediaire as number) || 5;
    const choixFait = client.choix_fait;
    // Si choix "petit" → objectif = palier ; sinon (grand ou pas encore choisi) → objectif_tampons
    objectif = choixFait === "petit" ? palierInter : (marchand?.objectif_tampons || 10);
    nomRecompense = choixFait === "grand"
      ? ((m?.nom_recompense_grand as string) || "")
      : choixFait === "petit"
        ? ((m?.nom_recompense_petit as string) || "")
        : ((m?.nom_recompense_petit as string) || "Choix en attente");
  } else {
    objectif = marchand?.objectif_tampons || 10;
    nomRecompense = marchand?.nom_recompense || "";
  }

  const pct = Math.min((client.tampons / objectif) * 100, 100);
  const initiales = `${(client.prenom?.[0] || "").toUpperCase()}${(client.nom?.[0] || "").toUpperCase()}`;
  const aColor = avatarColor(initiales);
  const annivInfo = anniversaireInfo(client.date_naissance);
  const maxTampons = modeRecompense === "progressif" && paliersDef.length > 0
    ? paliersDef[paliersDef.length - 1].tampons
    : marchand?.objectif_tampons || 10;

  if (deleted) return (
    <main className="min-h-screen pb-10" style={{ background: "var(--bg)" }}>
      <div className="max-w-lg mx-auto px-5" style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 16px)" }}>
        <Link href="/dashboard/clients" className="inline-flex items-center gap-1.5 mb-10 text-[14px]" style={{ color: "var(--accent)" }}>
          <Icons.ArrowLeft size={15} />
          Clients
        </Link>
        <p className="text-[15px] font-medium" style={{ color: "var(--fg-secondary)" }}>Client supprimé.</p>
      </div>
    </main>
  );

  return (
    <main className="min-h-screen pb-10" style={{ background: "var(--bg)" }}>

      {/* Toast numéro copié */}
      {phoneCopied && (
        <div style={{ position: "fixed", top: "calc(env(safe-area-inset-top) + 12px)", left: "50%", transform: "translateX(-50%)", zIndex: 999, background: "rgba(30,30,32,0.92)", backdropFilter: "blur(12px)", padding: "10px 18px", borderRadius: 100, animation: "toast-in 0.25s ease", whiteSpace: "nowrap" }}>
          <p style={{ color: "white", fontSize: 13, fontWeight: 600 }}>Numéro copié</p>
        </div>
      )}

      {/* Toast tampons mis à jour */}
      {correctionSaved && (
        <div style={{ position: "fixed", top: "calc(env(safe-area-inset-top) + 12px)", left: "50%", transform: "translateX(-50%)", zIndex: 999, background: "rgba(52,199,89,0.92)", backdropFilter: "blur(12px)", padding: "10px 18px", borderRadius: 100, animation: "toast-in 0.25s ease", whiteSpace: "nowrap" }}>
          <p style={{ color: "white", fontSize: 13, fontWeight: 600 }}>Tampons mis à jour</p>
        </div>
      )}

      <div className="max-w-lg mx-auto px-5" style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 16px)" }}>

        {/* Retour */}
        <Link href="/dashboard/clients" className="inline-flex items-center gap-1.5 mb-6 text-[14px]" style={{ color: "var(--accent)" }}>
          <Icons.ArrowLeft size={15} />
          Clients
        </Link>

        {/* Header */}
        <div className="flex items-center gap-4 mb-5">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center font-bold text-[18px] flex-shrink-0"
            style={{ background: aColor.bg, color: aColor.text }}
          >
            {initiales}
          </div>
          <div>
            <h1 className="text-[22px] font-semibold tracking-tight leading-tight" style={{ color: "var(--fg)" }}>
              {formatName(client.prenom)} {formatName(client.nom)}
            </h1>
            <button
              onClick={copyPhone}
              className="text-[14px] mt-0.5 active:opacity-60 transition-opacity text-left"
              style={{ color: "var(--fg-secondary)", background: "none", border: "none", padding: 0, cursor: "pointer" }}
            >
              {formatPhone(client.telephone)}
            </button>
          </div>
        </div>

        {/* Infos */}
        <div className="rounded-2xl overflow-hidden mb-4" style={{ background: "var(--glass-bg)", border: "1px solid var(--border)" }}>
          {[
            {
              label: "Dernière visite",
              value: formatTempsDepuis(client.derniere_visite),
              highlight: !client.derniere_visite,
            },
            {
              label: "Client depuis",
              value: client.date_inscription
                ? new Date((client.date_inscription as { seconds: number }).seconds * 1000)
                    .toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })
                : "—",
            },
            {
              label: "Anniversaire",
              value: annivInfo.label,
              isToday: annivInfo.isToday,
            },
            {
              label: "Visites au total",
              value: String(totalVisites || "—"),
            },
            {
              label: "Récompenses",
              value: String(totalRecompenses || "—"),
            },
          ].map((row, i, arr) => (
            <div
              key={row.label}
              className="flex items-center justify-between px-5 py-3.5"
              style={{ borderBottom: i < arr.length - 1 ? "1px solid var(--border)" : "none" }}
            >
              <span className="text-[13px]" style={{ color: "var(--fg-tertiary)" }}>{row.label}</span>
              <div className="flex items-center gap-1.5">
                {row.isToday && (
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#FF9F0A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 12v10H4V12"/><path d="M22 7H2v5h20V7z"/><path d="M12 22V7"/>
                    <path d="M12 7H7.5a2.5 2.5 0 010-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 000-5C13 2 12 7 12 7z"/>
                  </svg>
                )}
                <span className="text-[13px] font-medium" style={{ color: row.highlight ? "var(--fg-tertiary)" : "var(--fg)" }}>
                  {row.value}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Tampons */}
        <div className="rounded-2xl p-5 mb-4" style={{ background: "var(--glass-bg)", border: "1px solid var(--border)" }}>
          <div className="flex items-center justify-between mb-3">
            <p className="text-[15px] font-semibold" style={{ color: "var(--fg)" }}>
              {client.tampons} / {objectif} tampons
            </p>
            <p className="text-[12px]" style={{ color: "var(--fg-tertiary)" }}>{cap(nomRecompense)}</p>
          </div>

          {objectif <= 12 ? (
            <div>
              <div className="flex flex-wrap gap-2">
                {Array.from({ length: objectif }).map((_, i) => (
                  <div
                    key={i}
                    className="w-8 h-8 rounded-full"
                    style={i < client.tampons
                      ? {
                          background: "var(--wallio-gradient)",
                          boxShadow: "0 2px 8px rgba(139,92,246,0.35)",
                          animation: showCheck && i === client.tampons - 1
                            ? "success-pop 0.4s cubic-bezier(0.34,1.56,0.64,1)"
                            : undefined,
                        }
                      : { background: "transparent", border: "1.5px solid var(--border)" }
                    }
                  />
                ))}
              </div>
              {modeRecompense === "flex" && !client.choix_fait && (() => {
                const palierInter = (m?.palier_intermediaire as number) || 5;
                return (
                  <p className="text-[11px] mt-2" style={{ color: "var(--fg-tertiary)" }}>
                    Au tampon {palierInter} : {cap((m?.nom_recompense_petit as string) || "petite récompense")} · Au tampon {objectif} : {cap((m?.nom_recompense_grand as string) || "grande récompense")}
                  </p>
                );
              })()}
            </div>
          ) : (
            <div>
              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--border)" }}>
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${pct}%`, background: "var(--wallio-gradient)" }}
                />
              </div>
              {modeRecompense === "flex" && (() => {
                const palierInter = (m?.palier_intermediaire as number) || 5;
                const grand = marchand?.objectif_tampons || 10;
                const pctPetit = Math.min(99, Math.round((palierInter / grand) * 100));
                return (
                  <div className="relative mt-2" style={{ height: 24 }}>
                    <div style={{ position: "absolute", left: `${pctPetit}%`, transform: "translateX(-50%)" }}>
                      <div style={{ width: 1, height: 6, background: "var(--fg-tertiary)", margin: "0 auto" }} />
                      <p className="text-[9px] mt-0.5 whitespace-nowrap" style={{ color: "var(--fg-tertiary)", textAlign: "center" }}>
                        {cap((m?.nom_recompense_petit as string) || "")}
                      </p>
                    </div>
                    <div style={{ position: "absolute", right: 0 }}>
                      <div style={{ width: 1, height: 6, background: "var(--fg-tertiary)", margin: "0 auto" }} />
                      <p className="text-[9px] mt-0.5 whitespace-nowrap" style={{ color: "var(--fg-tertiary)", textAlign: "right" }}>
                        {cap((m?.nom_recompense_grand as string) || "")}
                      </p>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {modeRecompense === "progressif" && paliersDef.length > 0 && (
            <div className="mt-4 pt-4 space-y-2" style={{ borderTop: "1px solid var(--border)" }}>
              <p className="text-[12px] mb-3" style={{ color: "var(--fg-tertiary)" }}>Programme progressif</p>
              {paliersDef.map((palier, i) => {
                const valide = !!(paliersValides[i]) && client.tampons >= palier.tampons;
                const atteint = !valide && client.tampons >= palier.tampons;
                const enCours = !valide && !atteint && paliersDef.findIndex((p, j) => !(paliersValides[j] && paliersDef[j].tampons <= client.tampons) && paliersDef[j].tampons > client.tampons) === i;
                const restants = palier.tampons - client.tampons;
                return (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ background: valide ? "rgba(52,199,89,0.15)" : atteint ? "rgba(255,159,10,0.15)" : enCours ? "rgba(0,122,255,0.12)" : "var(--border)" }}>
                      {valide && (
                        <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                          <path d="M2 6l3 3 5-5" stroke="#34C759" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                      {atteint && <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#FF9F0A" }} />}
                      {!valide && !atteint && <div style={{ width: 5, height: 5, borderRadius: "50%", background: enCours ? "var(--accent)" : "var(--fg-tertiary)", opacity: enCours ? 1 : 0.4 }} />}
                    </div>
                    <div className="flex-1 flex items-center justify-between min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-semibold flex-shrink-0"
                          style={{ color: valide ? "#34C759" : atteint ? "#FF9F0A" : enCours ? "var(--accent)" : "var(--fg-tertiary)" }}>
                          {palier.tampons}
                        </span>
                        <span className="text-[13px] font-medium truncate"
                          style={{ color: valide || atteint || enCours ? "var(--fg)" : "var(--fg-tertiary)" }}>
                          {cap(palier.recompense)}
                        </span>
                      </div>
                      <span className="text-[11px] flex-shrink-0 ml-2"
                        style={{ color: valide ? "#34C759" : atteint ? "#FF9F0A" : "var(--fg-tertiary)" }}>
                        {valide ? "Validé" : atteint ? "À valider" : `${restants} restant${restants > 1 ? "s" : ""}`}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Résultat */}
        {result && result.type !== "choix_requis" && (
          <div className="rounded-2xl p-4 mb-4" style={{
            background: result.type === "anti_doublon" ? "rgba(255,159,10,0.1)" : result.type === "recompense" ? "rgba(52,199,89,0.1)" : "rgba(0,122,255,0.08)",
            border: `1px solid ${result.type === "anti_doublon" ? "rgba(255,159,10,0.25)" : result.type === "recompense" ? "rgba(52,199,89,0.25)" : "rgba(0,122,255,0.2)"}`,
          }}>
            <p className="text-[15px] font-semibold mb-0.5" style={{
              color: result.type === "anti_doublon" ? "#FF9F0A" : result.type === "recompense" ? "#34C759" : "var(--accent)",
            }}>
              {result.type === "ok" && `Tampon ajouté — ${result.tampons}/${result.objectif}`}
              {result.type === "anti_doublon" && "Déjà scanné récemment"}
              {result.type === "recompense" && `${cap(result.nom_recompense)} !`}
            </p>
            <p className="text-[13px]" style={{ color: "var(--fg-secondary)" }}>
              {result.type === "ok" && result.objectif > result.tampons && `${result.objectif - result.tampons} tampon${result.objectif - result.tampons > 1 ? "s" : ""} restant avant ${cap(result.prochainRecompense || nomRecompense || "la récompense")}`}
              {result.type === "anti_doublon" && `Scanné il y a ${formatTemps(marchand!.anti_doublon_delai - result.secondes_restantes)} — prochain dans ${formatTemps(result.secondes_restantes)}`}
              {result.type === "recompense" && "Validez la récompense pour continuer"}
            </p>
            {result.type === "anti_doublon" && (
              <button onClick={() => handleAjouterTampon(true)} disabled={ajoutEnCours}
                className="mt-3 w-full py-2.5 rounded-xl text-[13px] font-semibold"
                style={{ background: "rgba(255,159,10,0.15)", color: "#FF9F0A", border: "1px solid rgba(255,159,10,0.3)" }}>
                Ajouter quand même
              </button>
            )}
          </div>
        )}

        {/* Choix Flex */}
        {modeRecompense === "flex" && client.choix_en_attente && (
          <div className="rounded-2xl p-4 mb-4" style={{ background: "rgba(0,122,255,0.08)", border: "1px solid rgba(0,122,255,0.22)" }}>
            {result?.type === "choix_requis" && result.birthday && (
              <p className="text-[12px] font-semibold mb-2" style={{ color: "#FF2D55" }}>
                Joyeux anniversaire {client.prenom} !{result.birthday_offre ? ` — ${result.birthday_offre}` : ""}
              </p>
            )}
            <p className="text-[14px] font-semibold mb-1" style={{ color: "var(--accent)" }}>Choix en attente</p>
            <p className="text-[12px] mb-3" style={{ color: "var(--fg-secondary)" }}>
              {client.prenom} a atteint le palier. Quel est son choix ?
            </p>
            <div className="flex flex-col gap-2">
              <button onClick={() => handleEnregistrerChoix("petit")} disabled={enregistrantChoix}
                className="w-full py-3 rounded-xl text-[14px] font-semibold text-white"
                style={{ background: enregistrantChoix ? "var(--border)" : "linear-gradient(135deg,#007AFF,#8B5CF6)", border: "none" }}>
                {enregistrantChoix ? "…" : `Prendre : ${(m?.nom_recompense_petit as string) || "Petite récompense"}`}
              </button>
              <button onClick={() => handleEnregistrerChoix("grand")} disabled={enregistrantChoix}
                className="w-full py-2.5 rounded-xl text-[13px] font-semibold"
                style={{ background: "var(--glass-bg)", color: "var(--fg)", border: "1px solid var(--border)" }}>
                {`Continuer vers : ${(m?.nom_recompense_grand as string) || "Grande récompense"}`}
              </button>
            </div>
          </div>
        )}

        {/* Réinitialiser choix */}
        {modeRecompense === "flex" && client.choix_fait && (
          <div className="mb-4 px-1">
            <p className="text-[12px]" style={{ color: "var(--fg-tertiary)" }}>
              Choix enregistré : <strong>{client.choix_fait === "petit" ? (m?.nom_recompense_petit as string) || "Petite" : (m?.nom_recompense_grand as string) || "Grande"}</strong>
            </p>
            <button onClick={handleReinitialiserChoix} disabled={reinitialisantChoix}
              className="text-[12px] font-medium mt-1"
              style={{ color: "#FF9F0A", background: "none", border: "none", padding: 0, cursor: "pointer" }}>
              {reinitialisantChoix ? "…" : "Réinitialiser le choix"}
            </button>
          </div>
        )}

        {/* CTA principal */}
        {client.recompense_en_attente ? (
          <button onClick={handleValiderRecompense} disabled={validationEnCours}
            className="w-full py-4 rounded-2xl text-[16px] font-semibold text-white mb-4"
            style={{ background: "#34C759", boxShadow: "0 4px 18px rgba(52,199,89,0.35)" }}>
            {validationEnCours ? "Validation…" : "Valider la récompense"}
          </button>
        ) : !client.choix_en_attente ? (
          <button
            onClick={() => { setCorrectionValue(client.tampons); setShowCorrectionSheet(true); }}
            className="w-full py-4 rounded-2xl text-[16px] font-semibold text-white mb-5 transition-all"
            style={{ background: "var(--wallio-gradient)", boxShadow: "0 4px 18px rgba(139,92,246,0.3)" }}>
            Modifier les tampons
          </button>
        ) : null}

        {/* Dernières visites */}
        {recentVisits.length > 0 && (
          <div className="rounded-2xl overflow-hidden mb-3" style={{ background: "var(--glass-bg)", border: "1px solid var(--border)" }}>
            <div className="flex items-center justify-between px-5 py-3.5" style={{ borderBottom: "1px solid var(--border)" }}>
              <p className="text-[13px] font-semibold" style={{ color: "var(--fg)" }}>Dernières visites</p>
              <Link href="/dashboard/historique" className="text-[12px]" style={{ color: "var(--accent)" }}>Voir tout</Link>
            </div>
            {recentVisits.map((v, i) => (
              <div key={v.id} className="flex items-center gap-3 px-5 py-3"
                style={{ borderBottom: i < recentVisits.length - 1 ? "1px solid var(--border)" : "none" }}>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px]" style={{ color: "var(--fg)" }}>{formatVisiteDate(v.created_at)}</p>
                  {v.added_by && v.added_by !== "Client" && (
                    <p className="text-[11px] mt-0.5" style={{ color: "var(--fg-tertiary)" }}>{v.added_by}</p>
                  )}
                </div>
                <VisiteBadge type={v.type} />
              </div>
            ))}
          </div>
        )}

        {/* Supprimer */}
        <button
          onClick={async () => {
            if (!confirm(`Supprimer définitivement ${cap(client.prenom)} ${cap(client.nom)} ?\nSes tampons seront perdus.`)) return;
            setDeleting(true);
            // Invalider la carte Apple Wallet avant suppression :
            // await garantit que le document existe encore quand push-update le lit.
            // Apple reçoit le push, appelle GET passes, obtient 410 → retire la carte du Wallet.
            if (client.apns_push_token) {
              try {
                await fetch("/api/apple-wallet/push-update", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ walletId: client.wallet_id }),
                });
              } catch {}
            }
            await deleteDoc(doc(db, "clients", client.id));
            setDeleted(true);
          }}
          disabled={deleting}
          className="w-full py-3 text-[14px] font-medium mt-1"
          style={{ background: "none", color: "#FF3B30", border: "none", cursor: "pointer" }}
        >
          {deleting ? "Suppression…" : "Supprimer ce client"}
        </button>

      </div>

      {/* Bottom sheet — Modifier les tampons */}
      {showCorrectionSheet && (
        <div
          className="fixed inset-0 z-50 flex items-end"
          style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)" }}
          onClick={() => setShowCorrectionSheet(false)}
        >
          <div
            className="w-full rounded-t-3xl p-6"
            style={{ background: "var(--bg)", animation: "slide-up 0.3s cubic-bezier(0.34,1.06,0.64,1)", paddingBottom: "max(24px, env(safe-area-inset-bottom))" }}
            onClick={e => e.stopPropagation()}
          >
            <div className="w-10 h-1 rounded-full mx-auto mb-5" style={{ background: "var(--border)" }} />

            {/* Nom + progression live */}
            <div className="text-center mb-6">
              <p className="text-[17px] font-semibold mb-3" style={{ color: "var(--fg)" }}>
                {formatName(client.prenom)} {formatName(client.nom)}
              </p>
              {objectif <= 12 ? (
                <div className="flex justify-center flex-wrap gap-1.5">
                  {Array.from({ length: objectif }).map((_, i) => (
                    <div key={i} style={{
                      width: 10, height: 10, borderRadius: "50%",
                      background: i < correctionValue ? "linear-gradient(135deg, #2F7BFF, #8B5CF6)" : "var(--border)",
                      transition: "background 0.15s ease",
                    }} />
                  ))}
                </div>
              ) : (
                <div>
                  <div className="h-1.5 rounded-full overflow-hidden mx-auto" style={{ background: "var(--border)", maxWidth: 240 }}>
                    <div className="h-full rounded-full transition-all duration-200"
                      style={{ width: `${Math.min(100, Math.round((correctionValue / objectif) * 100))}%`, background: "var(--wallio-gradient)" }} />
                  </div>
                  <p className="text-[11px] mt-1" style={{ color: "var(--fg-tertiary)" }}>{correctionValue} / {objectif}</p>
                </div>
              )}
            </div>

            {/* Compteur +/− */}
            <div className="flex items-center justify-center gap-10 mb-2">
              <button
                onClick={() => setCorrectionValue(v => Math.max(0, v - 1))}
                className="w-14 h-14 rounded-full flex items-center justify-center text-[26px] font-light"
                style={{ background: "rgba(255,59,48,0.08)", color: "#FF3B30", border: "none", cursor: correctionValue > 0 ? "pointer" : "default", opacity: correctionValue > 0 ? 1 : 0.35 }}
              >
                −
              </button>
              <p className="text-[48px] font-bold" style={{ color: "var(--fg)", minWidth: 70, textAlign: "center", fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>
                {correctionValue}
              </p>
              <button
                onClick={() => setCorrectionValue(v => Math.min(maxTampons, v + 1))}
                className="w-14 h-14 rounded-full flex items-center justify-center text-[26px] font-light"
                style={{ background: "rgba(47,123,255,0.08)", color: "#2F7BFF", border: "none", cursor: "pointer" }}
              >
                +
              </button>
            </div>

            {/* Indicateur de changement */}
            <div className="text-center mb-6" style={{ minHeight: 20 }}>
              {correctionValue !== client.tampons && (
                <p className="text-[13px] font-medium" style={{ color: correctionValue > client.tampons ? "#2F7BFF" : "#FF3B30" }}>
                  {correctionValue > client.tampons ? `+${correctionValue - client.tampons}` : correctionValue - client.tampons} tampon{Math.abs(correctionValue - client.tampons) > 1 ? "s" : ""}
                </p>
              )}
            </div>
            <button
              onClick={handleCorrectionSave}
              disabled={correctionSaving || correctionValue === client.tampons}
              className="w-full py-4 rounded-2xl text-[15px] font-semibold"
              style={{
                background: correctionValue !== client.tampons ? "var(--wallio-gradient)" : "#E9E9EE",
                color: correctionValue !== client.tampons ? "white" : "#8E8E93",
                boxShadow: correctionValue !== client.tampons ? "0 4px 18px rgba(139,92,246,0.25)" : "none",
                border: "none",
                cursor: correctionValue !== client.tampons ? "pointer" : "default",
              }}
            >
              {correctionSaving ? "Enregistrement…" : "Valider"}
            </button>
            <button
              onClick={() => setShowCorrectionSheet(false)}
              className="w-full py-3 mt-1 text-[14px]"
              style={{ color: "var(--fg-tertiary)", background: "none", border: "none", cursor: "pointer" }}
            >
              Annuler
            </button>
          </div>
        </div>
      )}

    </main>
  );
}

function Loading() {
  return (
    <main className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg)" }}>
      <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
        style={{ borderColor: "var(--accent)", borderTopColor: "transparent" }} />
    </main>
  );
}

function Erreur({ message }: { message: string }) {
  return (
    <main className="min-h-screen flex items-center justify-center px-6" style={{ background: "var(--bg)" }}>
      <div className="text-center max-w-sm">
        <p className="text-[17px] mb-5" style={{ color: "var(--fg-secondary)" }}>{message}</p>
        <Link href="/dashboard" className="text-[15px] font-medium" style={{ color: "var(--accent)" }}>
          ← Dashboard
        </Link>
      </div>
    </main>
  );
}
