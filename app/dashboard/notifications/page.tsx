"use client";

import { useAuth } from "@/lib/auth-context";
import { useState, useEffect, useRef } from "react";
import type React from "react";
import { getAuth } from "firebase/auth";
import { getDocs, collection, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useLang } from "@/lib/lang-context";
import { haptic } from "@/lib/haptics";
import { triggerAmbientPulse } from "@/components/AmbientBackground";
import CompactHeader from "@/components/dashboard/CompactHeader";
import { SmokeCard } from "@/components/dashboard/SmokeCard";

type Segment = "tous" | "actifs" | "inactifs" | "manuel";
type SendState = "idle" | "sending" | "success" | "error";

interface ClientItem {
  id: string;
  prenom: string;
  nom: string;
  telephone: string;
}

function formatExpiry(date: string, time: string): string {
  if (!date) return "";
  const d = new Date(`${date}T${time}`);
  return d.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" }) + ` à ${time}`;
}

export default function NotificationsPage() {
  const { user, marchand } = useAuth();
  const { t } = useLang();
  const titleRef = useRef<HTMLHeadingElement>(null);
  const [segment, setSegment] = useState<Segment>("tous");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [sendState, setSendState] = useState<SendState>("idle");
  const [result, setResult] = useState<{ sent: number; failed: number; total: number } | null>(null);
  const [expiresDate, setExpiresDate] = useState("");
  const [expiresTime, setExpiresTime] = useState("23:00");
  const [segmentCounts, setSegmentCounts] = useState<{ tous: number; actifs: number; inactifs: number } | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showExpirySheet, setShowExpirySheet] = useState(false);
  const [formFading, setFormFading] = useState(false);
  const [successBanner, setSuccessBanner] = useState(false);
  const [clientList, setClientList] = useState<ClientItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [clientSearch, setClientSearch] = useState("");
  const typingRef = useRef(false);

  const expiresAt = expiresDate ? `${expiresDate}T${expiresTime || "23:00"}` : "";

  useEffect(() => {
    if (!user) return;
    const trente = new Date(); trente.setDate(trente.getDate() - 30);
    getDocs(query(collection(db, "clients"), where("marchand_id", "==", user.uid))).then(snap => {
      let actifs = 0, inactifs = 0;
      const list: ClientItem[] = [];
      snap.docs.forEach(d => {
        const data = d.data();
        const dv = (data.derniere_visite?.seconds || 0) * 1000;
        if (dv >= trente.getTime()) actifs++;
        else if (dv > 0) inactifs++;
        list.push({ id: d.id, prenom: data.prenom || "", nom: data.nom || "", telephone: data.telephone || "" });
      });
      list.sort((a, b) => `${a.prenom} ${a.nom}`.localeCompare(`${b.prenom} ${b.nom}`, "fr"));
      setSegmentCounts({ tous: snap.size, actifs, inactifs });
      setClientList(list);
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
        body: JSON.stringify({ title, body, segment, clientIds: segment === "manuel" ? Array.from(selectedIds) : undefined, marchandId: user.uid, idToken, logoUrl: mn.logo_url || null, expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResult(data);
      setSendState("success");
      haptic("success");
      triggerAmbientPulse();
      setSuccessBanner(true);
      setTimeout(() => setFormFading(true), 2000);
      setTimeout(() => {
        setFormFading(false);
        setSendState("idle");
        setSuccessBanner(false);
        setTitle("");
        setBody("");
        setSegment("tous");
        setSelectedIds(new Set());
        setExpiresDate("");
        setExpiresTime("23:00");
        setResult(null);
      }, 2500);
    } catch {
      setSendState("error");
    }
  }

  if (!user || !marchand) return null;

  const mn = marchand as Record<string, unknown>;
  const charTitle = title.length;
  const charBody = body.length;
  const canSend = title.trim().length > 0 && body.trim().length > 0 && expiresDate.length > 0 && (segment !== "manuel" || selectedIds.size > 0);
  const count = segment === "manuel" ? selectedIds.size : (segmentCounts?.[segment as "tous" | "actifs" | "inactifs"] ?? null);

  const TEMPLATES: { label: string; icon: React.ReactNode; title: string; body: string }[] = [
    {
      label: t.notif_tpl_offer_title,
      icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4B4FD6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 12v10H4V12"/><path d="M22 7H2v5h20V7z"/><path d="M12 22V7"/><path d="M12 7H7.5a2.5 2.5 0 010-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 000-5C13 2 12 7 12 7z"/></svg>,
      title: t.notif_tpl_offer_title, body: t.notif_tpl_offer_body,
    },
    {
      label: t.notif_tpl_double_title,
      icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4B4FD6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 12h8"/><path d="M12 8v8"/></svg>,
      title: t.notif_tpl_double_title, body: t.notif_tpl_double_body,
    },
    {
      label: t.notif_tpl_event_title,
      icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4B4FD6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
      title: t.notif_tpl_event_title, body: t.notif_tpl_event_body,
    },
    {
      label: t.notif_tpl_reward_title,
      icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4B4FD6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
      title: t.notif_tpl_reward_title, body: t.notif_tpl_reward_body,
    },
  ];

  // Aperçu notification iOS — utilisé dans SmokeCard et modal confirmation
  const notifPreviewCard = (
    <div style={{
      background: "white",
      borderRadius: 18,
      padding: "12px 14px",
      boxShadow: "0 4px 16px rgba(0,0,0,0.10)",
      maxWidth: 340,
      width: "100%",
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 24, height: 24, borderRadius: (mn.logo_shape as string) === "round" ? "50%" : 7, overflow: "hidden", background: marchand.couleur_principale || "#EEF0FF", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
            {mn.logo_url
              // eslint-disable-next-line @next/next/no-img-element
              ? <img src={(mn.logo_circle_url as string) || (mn.logo_url as string)} alt="" style={{ width: "100%", height: "100%", objectFit: (mn.logo_shape as string) === "round" ? "contain" : "cover" }} />
              : <span style={{ fontSize: 11, fontWeight: 700, color: "#4B4FD6" }}>{marchand.nom[0]?.toUpperCase()}</span>
            }
          </div>
          <span style={{ fontSize: 12, fontWeight: 600, color: "#1D1D1F" }}>{marchand.nom}</span>
        </div>
        <span style={{ fontSize: 11, color: "#8E8E93" }}>maintenant</span>
      </div>
      <p style={{ fontSize: 14, fontWeight: 600, color: "#1D1D1F", marginBottom: 2 }}>
        {title || <span style={{ color: "#C7C7CC" }}>Votre titre</span>}
      </p>
      <p style={{ fontSize: 13, color: "#3C3C43", opacity: 0.6, lineHeight: 1.4 }}>
        {body || <span style={{ color: "#C7C7CC" }}>Votre message</span>}
      </p>
    </div>
  );

  const sendBtn = (
    <div>
      <button
        onClick={() => { if (canSend && sendState === "idle") setShowConfirm(true); }}
        disabled={sendState === "sending"}
        className="w-full py-4 rounded-2xl text-[15px] font-semibold transition-all flex items-center justify-center gap-2"
        style={{
          background: canSend ? "linear-gradient(135deg,#2F7BFF,#8B5CF6)" : "#E9E9EE",
          boxShadow: canSend ? "0 8px 24px rgba(47,123,255,0.25)" : "none",
          border: "none",
          cursor: canSend && sendState === "idle" ? "pointer" : "default",
          color: canSend ? "white" : "#8E8E93",
        }}
      >
        {sendState === "sending" && <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />}
        {sendState === "success" && (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" style={{ animation: "checkmark 0.3s ease" }}>
            <path d="M20 6 9 17l-5-5"/>
          </svg>
        )}
        {sendState === "sending" ? t.notif_sending
         : sendState === "success" ? `Envoyée à ${result?.sent ?? count ?? "…"} client${((result?.sent ?? count) ?? 0) > 1 ? "s" : ""}`
         : canSend ? `Envoyer à ${count ?? "…"} client${(count ?? 0) > 1 ? "s" : ""}`
         : "Rédiger un message"}
      </button>
    </div>
  );

  return (
    <div>
      <CompactHeader title="Messages" observeRef={titleRef} />
      <div className="px-5 md:px-8 lg:px-10 pb-36 md:pb-10 max-w-5xl" style={{ paddingTop: "calc(env(safe-area-inset-top) + 20px)" }}>

      {/* Toast succès */}
      {successBanner && result && (
        <div style={{ position: "fixed", top: "calc(env(safe-area-inset-top, 0px) + 12px)", left: 0, right: 0, display: "flex", justifyContent: "center", zIndex: 999, pointerEvents: "none", animation: "toast-in 0.25s ease" }}>
          <div style={{ background: "rgba(52,199,89,0.92)", backdropFilter: "blur(12px)", padding: "10px 18px", borderRadius: 100, whiteSpace: "nowrap" }}>
            <p style={{ color: "white", fontSize: 13, fontWeight: 600 }}>Envoyée à {result.sent} client{result.sent > 1 ? "s" : ""}</p>
          </div>
        </div>
      )}

      <div className="mb-5 md:mb-6">
        <h1 ref={titleRef} className="text-[34px] font-bold tracking-[-1px]" style={{ color: "var(--fg)" }}>{t.notif_title}</h1>
      </div>

      {/* Aperçu + formulaire — fade sur reset */}
      <div style={{ opacity: formFading ? 0 : 1, transition: "opacity 0.4s ease", pointerEvents: formFading ? "none" : "auto" }}>
      <SmokeCard style={{ marginBottom: 20, padding: 20, display: "flex", alignItems: "center", justifyContent: "center", minHeight: 170 }}>
        {notifPreviewCard}
      </SmokeCard>

      <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] lg:gap-6 space-y-4 lg:space-y-0">

        {/* Colonne gauche */}
        <div className="space-y-4 min-w-0">

          {/* Segment */}
          <div className="rounded-2xl p-4" style={{ background: "var(--glass-bg)", border: "1px solid var(--border)" }}>
            <div style={{ display: "flex", background: "rgba(0,0,0,0.06)", borderRadius: 10, padding: 3, marginBottom: 12 }}>
              {(["tous", "actifs", "inactifs", "manuel"] as Segment[]).map(id => (
                <button key={id} onClick={() => { setSegment(id); if (id !== "manuel") setSelectedIds(new Set()); setClientSearch(""); }}
                  style={{ flex: 1, padding: "7px 2px", borderRadius: 8, fontSize: 11, fontWeight: segment === id ? 600 : 400, background: segment === id ? "#FFFFFF" : "transparent", color: segment === id ? "var(--fg)" : "var(--fg-tertiary)", border: "none", cursor: "pointer", boxShadow: segment === id ? "0 1px 4px rgba(0,0,0,0.12)" : "none", transition: "all 0.15s", whiteSpace: "nowrap" }}>
                  {id === "tous" ? "Tous" : id === "actifs" ? "Actifs" : id === "inactifs" ? "Inactifs" : "Manuel"}
                  {id !== "manuel" && (
                    <> <span style={{ opacity: 0.7 }}>({segmentCounts === null ? "…" : segmentCounts[id as "tous"|"actifs"|"inactifs"]})</span></>
                  )}
                </button>
              ))}
            </div>
            {segment !== "manuel" && (
              <p style={{ fontSize: 12, color: "var(--fg-tertiary)" }}>
                {segment === "tous" ? "Tous les porteurs de la carte" : segment === "actifs" ? t.notif_segment_active_desc : t.notif_segment_inactive_desc}
              </p>
            )}

            {/* Sélection manuelle */}
            {segment === "manuel" && (() => {
              const filtered = clientList.filter(c =>
                !clientSearch || `${c.prenom} ${c.nom} ${c.telephone}`.toLowerCase().includes(clientSearch.toLowerCase())
              );
              const allSelected = filtered.length > 0 && filtered.every(c => selectedIds.has(c.id));
              return (
                <div>
                  {/* Barre recherche + tout sélectionner */}
                  <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                    <div style={{ position: "relative", flex: 1 }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--fg-tertiary)" strokeWidth="2" strokeLinecap="round" style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}>
                        <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                      </svg>
                      <input
                        type="text"
                        placeholder="Rechercher un client…"
                        value={clientSearch}
                        onChange={e => setClientSearch(e.target.value)}
                        style={{ width: "100%", paddingLeft: 30, paddingRight: 10, paddingTop: 7, paddingBottom: 7, borderRadius: 8, fontSize: 12, background: "var(--bg)", border: "1px solid var(--border)", color: "var(--fg)", outline: "none", boxSizing: "border-box" }}
                      />
                    </div>
                    <button
                      onClick={() => {
                        if (allSelected) {
                          setSelectedIds(prev => { const s = new Set(prev); filtered.forEach(c => s.delete(c.id)); return s; });
                        } else {
                          setSelectedIds(prev => { const s = new Set(prev); filtered.forEach(c => s.add(c.id)); return s; });
                        }
                      }}
                      style={{ padding: "7px 10px", borderRadius: 8, fontSize: 11, fontWeight: 600, background: allSelected ? "rgba(47,123,255,0.08)" : "var(--bg)", border: `1px solid ${allSelected ? "var(--accent)" : "var(--border)"}`, color: allSelected ? "var(--accent)" : "var(--fg-secondary)", cursor: "pointer", whiteSpace: "nowrap" }}>
                      {allSelected ? "Tout désélect." : "Tout sélect."}
                    </button>
                  </div>

                  {/* Liste clients */}
                  <div style={{ maxHeight: 220, overflowY: "auto", borderRadius: 8, border: "1px solid var(--border)" }}>
                    {filtered.length === 0 ? (
                      <p style={{ fontSize: 12, color: "var(--fg-tertiary)", textAlign: "center", padding: "16px 0" }}>Aucun client</p>
                    ) : filtered.map((c, i) => {
                      const sel = selectedIds.has(c.id);
                      return (
                        <button key={c.id} onClick={() => setSelectedIds(prev => { const s = new Set(prev); sel ? s.delete(c.id) : s.add(c.id); return s; })}
                          style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "9px 12px", background: sel ? "rgba(47,123,255,0.06)" : "transparent", border: "none", borderBottom: i < filtered.length - 1 ? "1px solid var(--border)" : "none", cursor: "pointer", textAlign: "left" }}>
                          <div style={{ width: 16, height: 16, borderRadius: 4, border: `2px solid ${sel ? "var(--accent)" : "var(--border)"}`, background: sel ? "var(--accent)" : "transparent", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.1s" }}>
                            {sel && <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                          </div>
                          <span style={{ fontSize: 13, color: "var(--fg)", fontWeight: sel ? 600 : 400 }}>{c.prenom} {c.nom}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Compteur */}
                  {selectedIds.size > 0 && (
                    <p style={{ fontSize: 11, color: "var(--accent)", fontWeight: 600, marginTop: 8 }}>
                      {selectedIds.size} client{selectedIds.size > 1 ? "s" : ""} sélectionné{selectedIds.size > 1 ? "s" : ""}
                    </p>
                  )}
                </div>
              );
            })()}
          </div>

          {/* Modèles */}
          <div className="rounded-2xl p-4" style={{ background: "var(--glass-bg)", border: "1px solid var(--border)" }}>
            <p className="text-[12px] mb-3" style={{ color: "var(--fg-tertiary)" }}>Modèles</p>
            <div className="grid grid-cols-2 gap-2 lg:grid-cols-1">
              {TEMPLATES.map(tmpl => (
                <button key={tmpl.label}
                  onClick={() => applyTemplate(tmpl.title, tmpl.body)}
                  className="text-left rounded-xl transition-all active:scale-95 w-full"
                  style={{
                    padding: "12px",
                    background: title === tmpl.title ? "rgba(75,79,214,0.08)" : "var(--bg)",
                    border: `1px solid ${title === tmpl.title ? "#4B4FD6" : "var(--border)"}`,
                  }}>
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <span>{tmpl.icon}</span>
                    <p className="text-[12px] font-semibold truncate" style={{ color: title === tmpl.title ? "#4B4FD6" : "var(--fg)" }}>{tmpl.label}</p>
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

          {/* Rédaction */}
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
                  onFocus={e => (e.target.style.borderColor = "#4B4FD6")}
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
                  onFocus={e => (e.target.style.borderColor = "#4B4FD6")}
                  onBlur={e => (e.target.style.borderColor = "var(--border)")}
                />
              </div>
            </div>
          </div>

          {/* Expiration */}
          <div className="rounded-2xl p-5" style={{ background: "var(--glass-bg)", border: "1px solid var(--border)" }}>
            <div className="flex items-center gap-2 mb-4">
              <div style={{ width: 32, height: 32, borderRadius: 8, background: "#EEF0FF", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4B4FD6" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              </div>
              <p className="text-[13px] font-semibold" style={{ color: "var(--fg)" }}>Expiration</p>
            </div>

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
                style={{ background: "var(--bg)", border: "1px solid var(--border)", color: "#4B4FD6" }}>
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
      </div>{/* fin fade wrapper */}

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
            <p className="text-[17px] font-semibold mb-4" style={{ color: "var(--fg)" }}>Confirmer l&apos;envoi</p>
            {notifPreviewCard}
            <p className="text-[13px] mt-4 mb-5 text-center" style={{ color: "var(--fg-tertiary)" }}>
              Sera envoyée à <strong style={{ color: "var(--fg)" }}>{count ?? "…"} client{(count ?? 0) > 1 ? "s" : ""}</strong>
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
