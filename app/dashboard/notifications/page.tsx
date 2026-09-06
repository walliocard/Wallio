"use client";

import { useAuth } from "@/lib/auth-context";
import { useState } from "react";
import type React from "react";
import { getAuth } from "firebase/auth";

type Segment = "tous" | "actifs" | "inactifs";
type SendState = "idle" | "sending" | "success" | "error";

const SEGMENTS: { id: Segment; label: string; desc: string; icon: React.ReactNode }[] = [
  { id: "tous",     label: "Tous les clients", desc: "Clients avec notifications activées",  icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg> },
  { id: "actifs",   label: "Clients actifs",   desc: "Visiteurs dans les 30 derniers jours", icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg> },
  { id: "inactifs", label: "Clients inactifs", desc: "Absents depuis plus de 30 jours",       icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg> },
];

const TEMPLATES = [
  { label: "Offre spéciale",    title: "Offre exclusive",       body: "Une surprise vous attend — venez nous rendre visite !" },
  { label: "Double tampons",    title: "Double tampons",         body: "Ce week-end, chaque visite compte double. Profitez-en !" },
  { label: "Événement",         title: "Événement spécial",     body: "Rejoignez-nous pour un moment unique. On vous attend !" },
  { label: "Récompense proche", title: "Vous y êtes presque !", body: "Il vous manque peu de tampons pour votre récompense. Passez nous voir !" },
];

export default function NotificationsPage() {
  const { user, marchand } = useAuth();
  const [segment, setSegment] = useState<Segment>("tous");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [sendState, setSendState] = useState<SendState>("idle");
  const [result, setResult] = useState<{ sent: number; failed: number; total: number } | null>(null);

  if (!user || !marchand) return null;

  const charTitle = title.length;
  const charBody = body.length;
  const canSend = title.trim().length > 0 && body.trim().length > 0;

  async function envoyer() {
    if (!canSend || sendState === "sending") return;
    setSendState("sending");
    setResult(null);
    try {
      const idToken = await getAuth().currentUser?.getIdToken();
      const res = await fetch("/api/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, body, segment, marchandId: user!.uid, idToken, logoUrl: (marchand as Record<string,unknown>).logo_url || null }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResult(data);
      setSendState("success");
    } catch {
      setSendState("error");
    }
  }

  return (
    <div className="px-5 md:px-8 lg:px-10 pt-8 lg:pt-10 pb-28 md:pb-10 max-w-2xl">

      {/* Header */}
      <div className="mb-5 md:mb-8">
        <p className="text-[12px] font-semibold uppercase tracking-widest mb-1" style={{ color: "var(--fg-tertiary)" }}>
          Marketing
        </p>
        <h1 className="text-[24px] md:text-[28px] font-semibold tracking-[-0.5px]" style={{ color: "var(--fg)" }}>
          Notifications push
        </h1>
        <p className="text-[13px] md:text-[14px] mt-1" style={{ color: "var(--fg-secondary)" }}>
          Envoyez un message à vos clients ayant activé les notifications.
        </p>
      </div>

      <div className="space-y-4">

        {/* Segment */}
        <div className="rounded-2xl p-5" style={{ background: "var(--glass-bg)", border: "1px solid var(--border)" }}>
          <p className="text-[11px] font-semibold uppercase tracking-widest mb-3" style={{ color: "var(--fg-tertiary)" }}>
            Destinataires
          </p>
          <div className="space-y-2">
            {SEGMENTS.map(s => (
              <button key={s.id} onClick={() => setSegment(s.id)}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-left transition-all"
                style={{
                  background: segment === s.id ? "rgba(0,122,255,0.08)" : "var(--bg)",
                  border: `1px solid ${segment === s.id ? "var(--accent)" : "var(--border)"}`,
                }}>
                <span className="flex-shrink-0" style={{ color: segment === s.id ? "var(--accent)" : "var(--fg-tertiary)" }}>{s.icon}</span>
                <div>
                  <p className="text-[14px] font-medium" style={{ color: segment === s.id ? "var(--accent)" : "var(--fg)" }}>
                    {s.label}
                  </p>
                  <p className="text-[12px]" style={{ color: "var(--fg-tertiary)" }}>{s.desc}</p>
                </div>
                {segment === s.id && (
                  <div className="ml-auto w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: "var(--accent)" }}>
                    <span className="text-white text-[11px]">✓</span>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Templates */}
        <div className="rounded-2xl p-4 md:p-5" style={{ background: "var(--glass-bg)", border: "1px solid var(--border)" }}>
          <p className="text-[11px] font-semibold uppercase tracking-widest mb-3" style={{ color: "var(--fg-tertiary)" }}>
            Templates rapides
          </p>
          {/* Scroll horizontal sur mobile, grille sur desktop */}
          <div className="flex gap-2 overflow-x-auto pb-1 snap-x md:grid md:grid-cols-2 md:overflow-visible md:pb-0"
            style={{ scrollbarWidth: "none" }}>
            {TEMPLATES.map(t => (
              <button key={t.label}
                onClick={() => { setTitle(t.title); setBody(t.body); }}
                className="flex-shrink-0 snap-start text-left px-3 py-2.5 rounded-xl transition-all active:scale-95 md:flex-shrink"
                style={{
                  background: title === t.title ? "rgba(0,122,255,0.08)" : "var(--bg)",
                  border: `1px solid ${title === t.title ? "var(--accent)" : "var(--border)"}`,
                  minWidth: 130,
                }}>
                <p className="text-[12px] font-semibold" style={{ color: title === t.title ? "var(--accent)" : "var(--fg)" }}>
                  {t.label}
                </p>
                <p className="text-[11px] mt-0.5 truncate" style={{ color: "var(--fg-tertiary)" }}>{t.title}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Rédaction */}
        <div className="rounded-2xl p-5" style={{ background: "var(--glass-bg)", border: "1px solid var(--border)" }}>
          <p className="text-[11px] font-semibold uppercase tracking-widest mb-4" style={{ color: "var(--fg-tertiary)" }}>
            Message
          </p>

          <div className="space-y-3">
            <div>
              <div className="flex justify-between mb-1.5">
                <label className="text-[12px]" style={{ color: "var(--fg-secondary)" }}>Titre</label>
                <span className="text-[11px]" style={{ color: charTitle > 50 ? "#FF3B30" : "var(--fg-tertiary)" }}>
                  {charTitle}/65
                </span>
              </div>
              <input
                type="text" value={title} onChange={e => setTitle(e.target.value)} maxLength={65}
                placeholder="Ex: Offre exclusive ce week-end"
                className="w-full px-4 py-3 rounded-2xl text-[14px] outline-none"
                style={{ background: "var(--bg)", border: "1px solid var(--border)", color: "var(--fg)" }}
                onFocus={e => (e.target.style.borderColor = "var(--accent)")}
                onBlur={e => (e.target.style.borderColor = "var(--border)")}
              />
            </div>

            <div>
              <div className="flex justify-between mb-1.5">
                <label className="text-[12px]" style={{ color: "var(--fg-secondary)" }}>Corps du message</label>
                <span className="text-[11px]" style={{ color: charBody > 150 ? "#FF3B30" : "var(--fg-tertiary)" }}>
                  {charBody}/180
                </span>
              </div>
              <textarea
                value={body} onChange={e => setBody(e.target.value)} maxLength={180} rows={3}
                placeholder="Ex: Une surprise vous attend — venez nous rendre visite !"
                className="w-full px-4 py-3 rounded-2xl text-[14px] outline-none resize-none"
                style={{ background: "var(--bg)", border: "1px solid var(--border)", color: "var(--fg)", lineHeight: 1.5 }}
                onFocus={e => (e.target.style.borderColor = "var(--accent)")}
                onBlur={e => (e.target.style.borderColor = "var(--border)")}
              />
            </div>

            {/* Preview notif */}
            {(title || body) && (
              <div className="rounded-2xl p-4" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
                <p className="text-[10px] uppercase tracking-widest mb-2" style={{ color: "var(--fg-tertiary)" }}>
                  Aperçu
                </p>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl flex-shrink-0 overflow-hidden flex items-center justify-center"
                    style={{ background: (marchand as Record<string,unknown>).logo_url ? "var(--bg)" : (marchand.couleur_principale || "var(--accent)") }}>
                    {(marchand as Record<string,unknown>).logo_url
                      ? <img src={(marchand as Record<string,unknown>).logo_url as string} alt="" className="w-full h-full object-cover"/>
                      : <span className="text-white font-bold text-[16px]">{marchand.nom[0]?.toUpperCase()}</span>
                    }
                  </div>
                  <div>
                    <p className="text-[13px] font-semibold" style={{ color: "var(--fg)" }}>{marchand.nom}</p>
                    <p className="text-[12px] mt-0.5" style={{ color: "var(--fg-secondary)" }}>{title ? `${title} · ${body || ""}` : "Message…"}</p>
                    <p className="text-[10px] mt-1" style={{ color: "var(--fg-tertiary)" }}>app.walliocard.com</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Résultat */}
        {sendState === "success" && result && (
          <div className="rounded-2xl p-4 flex items-center gap-3"
            style={{ background: "rgba(52,199,89,0.08)", border: "1px solid rgba(52,199,89,0.2)" }}>
            <span className="text-2xl">✅</span>
            <div>
              <p className="text-[14px] font-semibold" style={{ color: "#34C759" }}>
                {result.sent} notification{result.sent > 1 ? "s" : ""} envoyée{result.sent > 1 ? "s" : ""}
              </p>
              {result.failed > 0 && (
                <p className="text-[12px]" style={{ color: "var(--fg-tertiary)" }}>
                  {result.failed} échec(s) — tokens expirés
                </p>
              )}
            </div>
          </div>
        )}

        {sendState === "error" && (
          <div className="rounded-2xl p-4" style={{ background: "rgba(255,59,48,0.08)", border: "1px solid rgba(255,59,48,0.2)" }}>
            <p className="text-[13px] font-medium" style={{ color: "#FF3B30" }}>
              Erreur lors de l&apos;envoi. Réessayez.
            </p>
          </div>
        )}

        {/* Bouton envoi */}
        <button
          onClick={envoyer}
          disabled={!canSend || sendState === "sending"}
          className="w-full py-4 rounded-2xl text-[15px] font-semibold text-white transition-all"
          style={{
            background: canSend ? "var(--accent)" : "var(--border)",
            boxShadow: canSend ? "0 8px 24px rgba(0,122,255,0.25)" : "none",
            cursor: canSend ? "pointer" : "not-allowed",
          }}>
          {sendState === "sending"
            ? "Envoi…"
            : <><span className="md:hidden">Envoyer</span><span className="hidden md:inline">Envoyer aux {SEGMENTS.find(s => s.id === segment)?.label.toLowerCase()}</span></>
          }
        </button>

      </div>
    </div>
  );
}
