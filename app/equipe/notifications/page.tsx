"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { EquipeNav } from "@/app/equipe/clients/page";
import { getAuth } from "firebase/auth";

interface EquipeSession {
  token: string;
  prenom: string;
  marchandId: string;
  marchandNom: string;
  permissions: { notifs: boolean; clients: boolean };
}

export default function EquipeNotificationsPage() {
  const router = useRouter();
  const [session, setSession] = useState<EquipeSession | null>(null);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [segment, setSegment] = useState<"tous" | "actifs" | "inactifs">("tous");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState<{ sent: number; failed: number } | null>(null);

  useEffect(() => {
    const raw = localStorage.getItem("equipe_session");
    if (!raw) { router.replace("/auth/connexion"); return; }
    try {
      const s: EquipeSession = JSON.parse(raw);
      if (!s.permissions?.notifs) { router.replace("/equipe/scanner"); return; }
      setSession(s);
    } catch { router.replace("/auth/connexion"); }
  }, [router]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!session || !title.trim() || !body.trim()) return;
    setSending(true); setSent(null);
    try {
      const idToken = await getAuth().currentUser?.getIdToken() || "";
      const res = await fetch("/api/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim(), body: body.trim(), segment, marchandId: session.marchandId, idToken }),
      });
      const data = await res.json();
      setSent({ sent: data.sent ?? 0, failed: data.failed ?? 0 });
      setTitle(""); setBody("");
    } catch { /* silent */ }
    finally { setSending(false); }
  }

  if (!session) return null;

  return (
    <main style={{
      minHeight: "100dvh", display: "flex", flexDirection: "column", background: "#F5F5F7",
      paddingTop: "env(safe-area-inset-top)", paddingBottom: "env(safe-area-inset-bottom)",
    }}>
      {/* Header */}
      <div style={{ padding: "16px 20px 12px", display: "flex", alignItems: "center", gap: 12 }}>
        <button onClick={() => router.back()}
          style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(0,0,0,0.06)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6E6E73" strokeWidth="2" strokeLinecap="round"><path d="M15 18l-6-6 6-6"/></svg>
        </button>
        <div>
          <p style={{ fontSize: 12, color: "#6E6E73" }}>{session.marchandNom}</p>
          <p style={{ fontSize: 19, fontWeight: 700, color: "#1D1D1F", letterSpacing: -0.3 }}>Notification</p>
        </div>
      </div>

      <div style={{ flex: 1, padding: "0 16px 16px", display: "flex", flexDirection: "column", gap: 12 }}>
        <form onSubmit={handleSend} style={{ display: "flex", flexDirection: "column", gap: 12 }}>

          {/* Segment */}
          <div style={{ background: "white", borderRadius: 18, padding: "16px", border: "1px solid rgba(0,0,0,0.06)" }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: "#AEAEB2", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 10 }}>Destinataires</p>
            <div style={{ display: "flex", gap: 8 }}>
              {([["tous", "Tous"], ["actifs", "Actifs"], ["inactifs", "Inactifs"]] as const).map(([val, label]) => (
                <button key={val} type="button" onClick={() => setSegment(val)}
                  style={{ flex: 1, padding: "10px 0", borderRadius: 12, fontSize: 13, fontWeight: 600, border: "none", cursor: "pointer", background: segment === val ? "#007AFF" : "rgba(0,0,0,0.05)", color: segment === val ? "white" : "#6E6E73" }}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Titre */}
          <input type="text" placeholder="Titre de la notification" required value={title} onChange={e => setTitle(e.target.value)}
            style={{ padding: "16px", borderRadius: 14, fontSize: 15, outline: "none", background: "white", border: "1px solid rgba(0,0,0,0.08)", color: "#1D1D1F" }} />

          {/* Message */}
          <textarea placeholder="Message…" required value={body} onChange={e => setBody(e.target.value)} rows={4}
            style={{ padding: "16px", borderRadius: 14, fontSize: 15, outline: "none", background: "white", border: "1px solid rgba(0,0,0,0.08)", color: "#1D1D1F", resize: "none", lineHeight: 1.5 }} />

          {sent && (
            <div style={{ padding: "14px 16px", borderRadius: 14, background: "rgba(52,199,89,0.10)", border: "1px solid rgba(52,199,89,0.2)" }}>
              <p style={{ fontSize: 14, fontWeight: 600, color: "#34C759" }}>Envoyé à {sent.sent} client{sent.sent > 1 ? "s" : ""}</p>
            </div>
          )}

          <button type="submit" disabled={sending || !title.trim() || !body.trim()}
            style={{ padding: "18px 0", borderRadius: 18, fontSize: 16, fontWeight: 700, color: "white", border: "none", cursor: "pointer", background: "linear-gradient(135deg,#007AFF,#8B5CF6)", opacity: sending || !title.trim() || !body.trim() ? 0.5 : 1 }}>
            {sending ? "Envoi…" : "Envoyer"}
          </button>
        </form>
      </div>

      <EquipeNav active="notifications" session={session} />
    </main>
  );
}
