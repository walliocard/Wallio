"use client";

import { useAuth } from "@/lib/auth-context";
import { useState } from "react";
import type React from "react";
import { getAuth } from "firebase/auth";
import { useLang } from "@/lib/lang-context";

type Segment = "tous" | "actifs" | "inactifs";
type SendState = "idle" | "sending" | "success" | "error";

export default function NotificationsPage() {
  const { user, marchand } = useAuth();
  const { t } = useLang();
  const [segment, setSegment] = useState<Segment>("tous");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [sendState, setSendState] = useState<SendState>("idle");
  const [result, setResult] = useState<{ sent: number; failed: number; total: number } | null>(null);

  if (!user || !marchand) return null;

  const SEGMENTS: { id: Segment; label: string; desc: string; icon: React.ReactNode }[] = [
    { id: "tous",     label: t.notif_segment_all,      desc: t.notif_segment_active_desc,   icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg> },
    { id: "actifs",   label: t.notif_segment_active,   desc: t.notif_segment_active_desc,   icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg> },
    { id: "inactifs", label: t.notif_segment_inactive, desc: t.notif_segment_inactive_desc, icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg> },
  ];

  const TEMPLATES = [
    { label: "★", title: t.notif_tpl_offer_title, body: t.notif_tpl_offer_body },
    { label: "×2", title: t.notif_tpl_double_title, body: t.notif_tpl_double_body },
    { label: "♟", title: t.notif_tpl_event_title, body: t.notif_tpl_event_body },
    { label: "🏆", title: t.notif_tpl_reward_title, body: t.notif_tpl_reward_body },
  ];

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
    <div className="px-5 md:px-8 lg:px-10 pt-8 lg:pt-10 pb-44 md:pb-10 max-w-2xl">

      <div className="mb-5 md:mb-8">
        <h1 className="text-[24px] md:text-[28px] font-semibold tracking-[-0.5px]" style={{ color: "var(--fg)" }}>
          {t.notif_title}
        </h1>
        <p className="text-[13px] md:text-[14px] mt-1" style={{ color: "var(--fg-secondary)" }}>
          {t.notif_subtitle}
        </p>
      </div>

      <div className="space-y-4">

        {/* Segment */}
        <div className="rounded-2xl p-5" style={{ background: "var(--glass-bg)", border: "1px solid var(--border)" }}>
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
                  <p className="text-[14px] font-medium" style={{ color: segment === s.id ? "var(--accent)" : "var(--fg)" }}>{s.label}</p>
                  <p className="text-[12px]" style={{ color: "var(--fg-tertiary)" }}>{s.desc}</p>
                </div>
                {segment === s.id && (
                  <div className="ml-auto w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "var(--accent)" }}>
                    <span className="text-white text-[11px]">✓</span>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Templates */}
        <div className="rounded-2xl p-4 md:p-5" style={{ background: "var(--glass-bg)", border: "1px solid var(--border)" }}>
          <div className="flex gap-2 overflow-x-auto pb-1 snap-x md:grid md:grid-cols-2 md:overflow-visible md:pb-0" style={{ scrollbarWidth: "none" }}>
            {TEMPLATES.map(tmpl => (
              <button key={tmpl.label}
                onClick={() => { setTitle(tmpl.title); setBody(tmpl.body); }}
                className="flex-shrink-0 snap-start text-left px-3 py-2.5 rounded-xl transition-all active:scale-95 md:flex-shrink"
                style={{
                  background: title === tmpl.title ? "rgba(0,122,255,0.08)" : "var(--bg)",
                  border: `1px solid ${title === tmpl.title ? "var(--accent)" : "var(--border)"}`,
                  minWidth: 130,
                }}>
                <p className="text-[12px] font-semibold" style={{ color: title === tmpl.title ? "var(--accent)" : "var(--fg)" }}>{tmpl.label}</p>
                <p className="text-[11px] mt-0.5 truncate" style={{ color: "var(--fg-tertiary)" }}>{tmpl.title}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Rédaction */}
        <div className="rounded-2xl p-5" style={{ background: "var(--glass-bg)", border: "1px solid var(--border)" }}>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between mb-1.5">
                <label className="text-[12px]" style={{ color: "var(--fg-secondary)" }}>{t.notif_title_label}</label>
                <span className="text-[11px]" style={{ color: charTitle > 50 ? "#FF3B30" : "var(--fg-tertiary)" }}>{charTitle}/65</span>
              </div>
              <input
                type="text" value={title} onChange={e => setTitle(e.target.value)} maxLength={65}
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
                <span className="text-[11px]" style={{ color: charBody > 150 ? "#FF3B30" : "var(--fg-tertiary)" }}>{charBody}/180</span>
              </div>
              <textarea
                value={body} onChange={e => setBody(e.target.value)} maxLength={180} rows={3}
                placeholder={t.notif_placeholder_body}
                className="w-full px-4 py-3 rounded-2xl text-[14px] outline-none resize-none"
                style={{ background: "var(--bg)", border: "1px solid var(--border)", color: "var(--fg)", lineHeight: 1.5 }}
                onFocus={e => (e.target.style.borderColor = "var(--accent)")}
                onBlur={e => (e.target.style.borderColor = "var(--border)")}
              />
            </div>

            {(title || body) && (
              <div className="rounded-2xl p-4" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
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
                    <p className="text-[12px] mt-0.5" style={{ color: "var(--fg-secondary)" }}>{title ? `${title} · ${body || ""}` : "…"}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {sendState === "success" && result && (
          <div className="rounded-2xl p-4 flex items-center gap-3"
            style={{ background: "rgba(52,199,89,0.08)", border: "1px solid rgba(52,199,89,0.2)" }}>
            <span className="text-2xl">✅</span>
            <p className="text-[14px] font-semibold" style={{ color: "#34C759" }}>
              {result.sent} {t.notif_send} ✓
            </p>
          </div>
        )}

        {sendState === "error" && (
          <div className="rounded-2xl p-4" style={{ background: "rgba(255,59,48,0.08)", border: "1px solid rgba(255,59,48,0.2)" }}>
            <p className="text-[13px] font-medium" style={{ color: "#FF3B30" }}>{t.notif_error}</p>
          </div>
        )}

        <button
          onClick={envoyer}
          disabled={!canSend || sendState === "sending"}
          className="w-full py-4 rounded-2xl text-[15px] font-semibold text-white transition-all"
          style={{
            background: canSend ? "var(--accent)" : "var(--border)",
            boxShadow: canSend ? "0 8px 24px rgba(0,122,255,0.25)" : "none",
            cursor: canSend ? "pointer" : "not-allowed",
          }}>
          {sendState === "sending" ? t.notif_sending : t.notif_send}
        </button>

      </div>
    </div>
  );
}
