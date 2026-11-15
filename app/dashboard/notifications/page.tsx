"use client";

import { useAuth } from "@/lib/auth-context";
import { useState, useEffect, useRef } from "react";
import type React from "react";
import { getAuth } from "firebase/auth";
import { getDocs, collection, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useLang } from "@/lib/lang-context";
import { haptic } from "@/lib/haptics";
import AmbientBackground, { triggerAmbientPulse } from "@/components/AmbientBackground";

type Segment = "tous" | "actifs" | "inactifs";
type SendState = "idle" | "sending" | "success" | "error";

function formatExpiry(date: string, time: string): string {
  if (!date) return "";
  const d = new Date(`${date}T${time}`);
  return d.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" }) + ` à ${time}`;
}

export default function NotificationsPage() {
  const { user, marchand } = useAuth();
  const { t } = useLang();
  const [segment, setSegment] = useState<Segment>("tous");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [sendState, setSendState] = useState<SendState>("idle");
  const [result, setResult] = useState<{ sent: number; failed: number; total: number } | null>(null);
  const [expiresDate, setExpiresDate] = useState("");
  const [expiresTime, setExpiresTime] = useState("23:00");
  const [segmentCounts, setSegmentCounts] = useState({ tous: 0, actifs: 0, inactifs: 0 });
  const [showConfirm, setShowConfirm] = useState(false);
  const [showExpirySheet, setShowExpirySheet] = useState(false);
  const [successBanner, setSuccessBanner] = useState(false);
  const typingRef = useRef(false);

  const expiresAt = expiresDate ? `${expiresDate}T${expiresTime || "23:00"}` : "";

  useEffect(() => {
    if (!user) return;
    const trente = new Date(); trente.setDate(trente.getDate() - 30);
    getDocs(query(collection(db, "clients"), where("marchand_id", "==", user.uid))).then(snap => {
      let actifs = 0, inactifs = 0;
      snap.docs.forEach(d => {
        const dv = (d.data().derniere_visite?.seconds || 0) * 1000;
        if (dv >= trente.getTime()) actifs++;
        else if (dv > 0) inactifs++;
      });
      setSegmentCounts({ tous: snap.size, actifs, inactifs });
    });
  }, [user?.uid]); // eslint-disable-line react-hooks/exhaustive-deps

  function setQuickExpiry(hours: number) {
    const d = new Date(Date.now() + hours * 3600000);
    setExpiresDate(d.toISOString().slice(0, 10));
    setExpiresTime(`${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`);
  }

  async function applyTemplate(tmplTitle: string, tmplBody: string) {
    typingRef.current = true;
    setTitle("");
    setBody("");
    for (let i = 0; i <= tmplTitle.length; i++) {
      if (!typingRef.current) return;
      setTitle(tmplTitle.slice(0, i));
      await new Promise(r => setTimeout(r, 22));
    }
    for (let i = 0; i <= tmplBody.length; i++) {
      if (!typingRef.current) return;
      setBody(tmplBody.slice(0, i));
      await new Promise(r => setTimeout(r, 14));
    }
  }

  async function envoyer() {
    if (!user || !marchand || !canSend || sendState === "sending") return;
    setShowConfirm(false);
    setSendState("sending");
    setResult(null);
    try {
      const idToken = await getAuth().currentUser?.getIdToken();
      const mn = marchand as Record<string, unknown>;
      const res = await fetch("/api/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, body, segment, marchandId: user.uid, idToken, logoUrl: mn.logo_url || null, expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResult(data);
      setSendState("success");
      haptic("success");
      triggerAmbientPulse();
      setSuccessBanner(true);
      setTimeout(() => { setSendState("idle"); setSuccessBanner(false); }, 3000);
    } catch {
      setSendState("error");
    }
  }

  if (!user || !marchand) return null;

  const mn = marchand as Record<string, unknown>;
  const charTitle = title.length;
  const charBody = body.length;
  const canSend = title.trim().length > 0 && body.trim().length > 0 && expiresDate.length > 0;
  const count = segmentCounts[segment];

  const TEMPLATES: { label: string; icon: React.ReactNode; title: string; body: string }[] = [
    {
      label: t.notif_tpl_offer_title,
      icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 12v10H4V12"/><path d="M22 7H2v5h20V7z"/><path d="M12 22V7"/><path d="M12 7H7.5a2.5 2.5 0 010-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 000-5C13 2 12 7 12 7z"/></svg>,
      title: t.notif_tpl_offer_title, body: t.notif_tpl_offer_body,
    },
    {
      label: t.notif_tpl_double_title,
      icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 12h8"/><path d="M12 8v8"/></svg>,
      title: t.notif_tpl_double_title, body: t.notif_tpl_double_body,
    },
    {
      label: t.notif_tpl_event_title,
      icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
      title: t.notif_tpl_event_title, body: t.notif_tpl_event_body,
    },
    {
      label: t.notif_tpl_reward_title,
      icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
      title: t.notif_tpl_reward_title, body: t.notif_tpl_reward_body,
    },
  ];

  const iosPreview = (
    <div className="rounded-2xl overflow-hidden" style={{ background: "rgba(20,20,22,0.85)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)" }}>
      <div className="flex items-center justify-between px-4 pt-3 pb-1">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg overflow-hidden flex-shrink-0" style={{ background: marchand.couleur_principale || "var(--accent)" }}>
            {mn.logo_url
              ? <img src={mn.logo_url as string} alt="" className="w-full h-full object-cover" />
              : <span className="text-white font-bold text-[10px] flex items-center justify-center w-full h-full">{marchand.nom[0]?.toUpperCase()}</span>
            }
          </div>
          <span className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: "rgba(255,255,255,0.5)" }}>{marchand.nom}</span>
        </div>
        <span className="text-[11px]" style={{ color: "rgba(255,255,255,0.35)" }}>maintenant</span>
      </div>
      <div className="px-4 pb-4">
        <p className="text-[14px] font-semibold mb-0.5" style={{ color: "white" }}>{title || "Titre…"}</p>
        <p className="text-[13px]" style={{ color: "rgba(255,255,255,0.65)" }}>{body || "Message…"}</p>
      </div>
    </div>
  );

  const sendBtn = (
    <div>
      <button
        onClick={() => { if (canSend && sendState === "idle") setShowConfirm(true); }}
        disabled={sendState === "sending"}
        className="w-full py-4 rounded-2xl text-[15px] font-semibold transition-all flex items-center justify-center gap-2"
        style={{
          background: canSend ? "linear-gradient(135deg,#2F7BFF,#8B5CF6)" : "var(--glass-bg)",
          boxShadow: canSend ? "0 8px 24px rgba(47,123,255,0.25)" : "none",
          border: canSend ? "none" : "1px solid var(--border)",
          cursor: canSend && sendState === "idle" ? "pointer" : "default",
          color: canSend ? "white" : "var(--fg-tertiary)",
        }}
      >
        {sendState === "sending" && <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />}
        {sendState === "success" && (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" style={{ animation: "checkmark 0.3s ease" }}>
            <path d="M20 6 9 17l-5-5"/>
          </svg>
        )}
        {sendState === "sending" ? t.notif_sending
         : sendState === "success" ? `Envoyée à ${result?.sent ?? count} client${(result?.sent ?? count) > 1 ? "s" : ""}`
         : canSend ? `Envoyer à ${count} client${count > 1 ? "s" : ""}`
         : "Rédiger un message"}
      </button>
      {!canSend && sendState === "idle" && (
        <p className="text-[11px] text-center mt-1.5" style={{ color: "var(--fg-tertiary)" }}>
          {!title.trim() ? "Ajoutez un titre et un message" : !expiresDate ? "Choisissez une date d'expiration" : ""}
        </p>
      )}
    </div>
  );

  return (
    <div style={{ position: "relative" }}>
      <AmbientBackground variant="subtle" />
      <div className="px-5 md:px-8 lg:px-10 pt-8 lg:pt-10 pb-32 md:pb-10 max-w-5xl" style={{ position: "relative", zIndex: 1 }}>

      {/* Toast succès */}
      {successBanner && result && (
        <div style={{ position: "fixed", top: "calc(env(safe-area-inset-top, 0px) + 12px)", left: "50%", transform: "translateX(-50%)", zIndex: 999, background: "rgba(52,199,89,0.92)", backdropFilter: "blur(12px)", padding: "10px 18px", borderRadius: 100, animation: "toast-in 0.25s ease", whiteSpace: "nowrap" }}>
          <p style={{ color: "white", fontSize: 13, fontWeight: 600 }}>Envoyée à {result.sent} client{result.sent > 1 ? "s" : ""}</p>
        </div>
      )}

      <div className="mb-5 md:mb-8">
        <h1 className="text-[34px] font-bold tracking-[-1px]" style={{ color: "var(--fg)" }}>{t.notif_title}</h1>
      </div>

      <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] lg:gap-6 space-y-4 lg:space-y-0">

        {/* Colonne gauche */}
        <div className="space-y-4 min-w-0">

          {/* Segment */}
          <div className="rounded-2xl p-4" style={{ background: "var(--glass-bg)", border: "1px solid var(--border)" }}>
            <div style={{ display: "flex", background: "rgba(0,0,0,0.06)", borderRadius: 10, padding: 3, marginBottom: 12 }}>
              {(["tous", "actifs", "inactifs"] as Segment[]).map(id => (
                <button key={id} onClick={() => setSegment(id)}
                  style={{ flex: 1, padding: "7px 4px", borderRadius: 8, fontSize: 12, fontWeight: segment === id ? 600 : 400, background: segment === id ? "#FFFFFF" : "transparent", color: segment === id ? "var(--fg)" : "var(--fg-tertiary)", border: "none", cursor: "pointer", boxShadow: segment === id ? "0 1px 4px rgba(0,0,0,0.12)" : "none", transition: "all 0.15s", whiteSpace: "nowrap" }}>
                  {id === "tous" ? "Tous" : id === "actifs" ? "Actifs" : "Inactifs"}
                  {" "}
                  <span key={segmentCounts[id]} style={{ opacity: 0.7, animation: "fade-in 0.2s ease" }}>
                    ({segmentCounts[id]})
                  </span>
                </button>
              ))}
            </div>
            <p style={{ fontSize: 12, color: "var(--fg-tertiary)" }}>
              {segment === "tous" ? "Tous les porteurs de la carte" : segment === "actifs" ? t.notif_segment_active_desc : t.notif_segment_inactive_desc}
            </p>
          </div>

          {/* Templates — carrousel horizontal */}
          <div className="rounded-2xl p-4" style={{ background: "var(--glass-bg)", border: "1px solid var(--border)" }}>
            <p className="text-[12px] mb-3" style={{ color: "var(--fg-tertiary)" }}>Modèles</p>
            <div className="flex gap-2 pb-1 overflow-x-auto lg:flex-col lg:overflow-visible" style={{ scrollbarWidth: "none" as never, WebkitOverflowScrolling: "touch" as never }}>
              <style>{`.tpl-btn::-webkit-scrollbar{display:none}`}</style>
              {TEMPLATES.map(tmpl => (
                <button key={tmpl.label}
                  onClick={() => applyTemplate(tmpl.title, tmpl.body)}
                  className="tpl-btn text-left rounded-xl transition-all active:scale-95 flex-shrink-0 lg:w-full"
                  style={{
                    minWidth: 158,
                    padding: "12px",
                    background: title === tmpl.title ? "rgba(47,123,255,0.08)" : "var(--bg)",
                    border: `1px solid ${title === tmpl.title ? "var(--accent)" : "var(--border)"}`,
                  }}>
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <span style={{ color: title === tmpl.title ? "var(--accent)" : "var(--fg-tertiary)" }}>{tmpl.icon}</span>
                    <p className="text-[12px] font-semibold truncate" style={{ color: title === tmpl.title ? "var(--accent)" : "var(--fg)" }}>{tmpl.label}</p>
                  </div>
                  <p className="text-[11px]" style={{ color: "var(--fg-tertiary)", lineHeight: 1.4, display: "-webkit-box", WebkitLineClamp: 3 as never, WebkitBoxOrient: "vertical" as never, overflow: "hidden" }}>
                    {tmpl.body}
                  </p>
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* Colonne droite */}
        <div className="space-y-4 min-w-0">

          {/* Rédaction + aperçu */}
          <div className="rounded-2xl p-5" style={{ background: "var(--glass-bg)", border: "1px solid var(--border)" }}>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between mb-1.5">
                  <label className="text-[12px]" style={{ color: "var(--fg-secondary)" }}>{t.notif_title_label}</label>
                  <span className="text-[11px]" style={{ color: charTitle > 61 ? "#FF3B30" : charTitle > 50 ? "#FF9F0A" : "var(--fg-tertiary)" }}>{charTitle}/65</span>
                </div>
                <input
                  type="text" value={title}
                  onChange={e => { typingRef.current = false; setTitle(e.target.value); }}
                  maxLength={65}
                  placeholder={t.notif_placeholder_title}
                  className="w-full px-4 py-3 rounded-2xl text-[14px] outline-none"
                  style={{ background: "var(--bg)", border: "1px solid var(--border)", color: "var(--fg)" }}
                  onFocus={e => (e.target.style.borderColor = "var(--accent)")}
                  onBlur={e => (e.target.style.borderColor = "var(--border)")}
                />
              </div>

              <div>
                <div className="flex justify-between mb-1.5">
                  <label className="text-[12px]" style={{ color: "var(--fg-secondary)" }}>{t.notif_message_label}</label>
                  <span className="text-[11px]" style={{ color: charBody > 171 ? "#FF3B30" : charBody > 144 ? "#FF9F0A" : "var(--fg-tertiary)" }}>{charBody}/180</span>
                </div>
                <textarea
                  value={body}
                  onChange={e => { typingRef.current = false; setBody(e.target.value); }}
                  maxLength={180} rows={3}
                  placeholder={t.notif_placeholder_body}
                  className="w-full px-4 py-3 rounded-2xl text-[14px] outline-none resize-none"
                  style={{ background: "var(--bg)", border: "1px solid var(--border)", color: "var(--fg)", lineHeight: 1.5 }}
                  onFocus={e => (e.target.style.borderColor = "var(--accent)")}
                  onBlur={e => (e.target.style.borderColor = "var(--border)")}
                />
              </div>

              {/* Aperçu live — toujours visible */}
              <div>
                <p className="text-[12px] mb-2" style={{ color: "var(--fg-tertiary)" }}>Aperçu</p>
                {iosPreview}
              </div>
            </div>
          </div>

          {/* Expiration */}
          <div className="rounded-2xl p-5" style={{ background: "var(--glass-bg)", border: "1px solid var(--border)" }}>
            <div className="flex items-center gap-2 mb-4">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ color: "var(--fg-tertiary)", flexShrink: 0 }}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              <p className="text-[13px] font-semibold" style={{ color: "var(--fg-secondary)" }}>Expiration</p>
            </div>

            {/* Choix rapides */}
            <div className="flex gap-2 mb-4">
              {[{ label: "24 h", h: 24 }, { label: "3 jours", h: 72 }, { label: "7 jours", h: 168 }].map(opt => (
                <button key={opt.label} onClick={() => setQuickExpiry(opt.h)}
                  className="px-3 py-2 rounded-xl text-[12px] font-semibold transition-all active:opacity-70"
                  style={{ background: "var(--bg)", border: "1px solid var(--border)", color: "var(--fg-secondary)" }}>
                  {opt.label}
                </button>
              ))}
              <button onClick={() => setShowExpirySheet(true)}
                className="px-3 py-2 rounded-xl text-[12px] font-semibold transition-all flex-1 active:opacity-70"
                style={{ background: "var(--bg)", border: "1px solid var(--border)", color: "var(--accent)" }}>
                Personnaliser
              </button>
            </div>

            {expiresDate ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#34C759" strokeWidth="2.5" strokeLinecap="round"><path d="M20 6 9 17l-5-5"/></svg>
                  <p className="text-[13px] font-medium" style={{ color: "var(--fg)" }}>
                    Expire le · {formatExpiry(expiresDate, expiresTime)}
                  </p>
                </div>
                <button onClick={() => { setExpiresDate(""); setExpiresTime("23:00"); }}
                  className="text-[12px]" style={{ color: "var(--fg-tertiary)", background: "none", border: "none", cursor: "pointer" }}>
                  Effacer
                </button>
              </div>
            ) : (
              <p className="text-[12px]" style={{ color: "var(--fg-tertiary)" }}>
                Choisissez quand ce message disparaîtra du wallet
              </p>
            )}
          </div>

          {/* Erreur */}
          {sendState === "error" && (
            <div className="rounded-2xl p-4" style={{ background: "rgba(255,59,48,0.08)", border: "1px solid rgba(255,59,48,0.2)" }}>
              <p className="text-[13px] font-medium" style={{ color: "#FF3B30" }}>{t.notif_error}</p>
            </div>
          )}

          {/* Bouton desktop */}
          <div className="hidden md:block">{sendBtn}</div>

        </div>
      </div>

      {/* Bouton fixé mobile */}
      <div className="md:hidden fixed left-0 right-0 px-5 z-30"
        style={{ bottom: "calc(var(--tab-h, 49px) + env(safe-area-inset-bottom, 0px) + 8px)" }}>
        {sendBtn}
      </div>

      {/* Modal confirmation */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center"
          style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(6px)" }}
          onClick={() => setShowConfirm(false)}>
          <div className="w-full max-w-sm rounded-t-3xl md:rounded-3xl p-6 md:mx-4"
            style={{ background: "var(--bg)", animation: "slide-up 0.3s cubic-bezier(0.34,1.06,0.64,1)", paddingBottom: "max(24px, env(safe-area-inset-bottom))" }}
            onClick={e => e.stopPropagation()}>
            <div className="w-10 h-1 rounded-full mx-auto mb-5 md:hidden" style={{ background: "var(--border)" }} />
            <p className="text-[17px] font-semibold mb-4" style={{ color: "var(--fg)" }}>Confirmer l'envoi</p>
            {iosPreview}
            <p className="text-[13px] mt-4 mb-5 text-center" style={{ color: "var(--fg-tertiary)" }}>
              Sera envoyée à <strong style={{ color: "var(--fg)" }}>{count} client{count > 1 ? "s" : ""}</strong>
            </p>
            <button onClick={envoyer}
              className="w-full py-4 rounded-2xl text-[15px] font-semibold text-white"
              style={{ background: "linear-gradient(135deg,#2F7BFF,#8B5CF6)", boxShadow: "0 8px 24px rgba(47,123,255,0.25)" }}>
              Envoyer
            </button>
            <button onClick={() => setShowConfirm(false)}
              className="w-full py-3 mt-2 text-[14px]"
              style={{ color: "var(--fg-tertiary)", background: "none", border: "none", cursor: "pointer" }}>
              Annuler
            </button>
          </div>
        </div>
      )}

      {/* Bottom sheet expiration */}
      {showExpirySheet && (
        <div className="fixed inset-0 z-50 flex items-end"
          style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)" }}
          onClick={() => setShowExpirySheet(false)}>
          <div className="w-full rounded-t-3xl p-6"
            style={{ background: "var(--bg)", animation: "slide-up 0.3s cubic-bezier(0.34,1.06,0.64,1)", paddingBottom: "max(24px, env(safe-area-inset-bottom))" }}
            onClick={e => e.stopPropagation()}>
            <div className="w-10 h-1 rounded-full mx-auto mb-5" style={{ background: "var(--border)" }} />
            <p className="text-[17px] font-semibold mb-5" style={{ color: "var(--fg)" }}>Choisir une date</p>
            <input
              type="datetime-local"
              value={expiresDate && expiresTime ? `${expiresDate}T${expiresTime}` : ""}
              min={new Date().toISOString().slice(0, 16)}
              onChange={e => {
                const [d, ti] = e.target.value.split("T");
                if (d) setExpiresDate(d);
                if (ti) setExpiresTime(ti.slice(0, 5));
              }}
              className="w-full px-4 py-3 rounded-2xl text-[14px] outline-none"
              style={{ background: "var(--bg)", border: "1px solid var(--border)", color: "var(--fg)" }}
            />
            <button onClick={() => setShowExpirySheet(false)}
              className="w-full py-4 mt-4 rounded-2xl text-[15px] font-semibold text-white"
              style={{ background: "linear-gradient(135deg,#2F7BFF,#8B5CF6)" }}>
              Confirmer
            </button>
          </div>
        </div>
      )}

      </div>
    </div>
  );
}
