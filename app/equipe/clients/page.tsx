"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface EquipeSession {
  token: string;
  prenom: string;
  marchandId: string;
  marchandNom: string;
  permissions: { notifs: boolean; clients: boolean };
}

interface Client {
  id: string;
  prenom: string;
  nom: string;
  telephone: string;
  tampons: number;
  derniere_visite?: { seconds: number };
}

function formatDate(ts?: { seconds: number }): string {
  if (!ts) return "—";
  return new Date(ts.seconds * 1000).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

export default function EquipeClientsPage() {
  const router = useRouter();
  const [session, setSession] = useState<EquipeSession | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const raw = localStorage.getItem("equipe_session");
    if (!raw) { router.replace("/auth/connexion"); return; }
    try {
      const s: EquipeSession = JSON.parse(raw);
      if (!s.permissions?.clients) { router.replace("/equipe/scanner"); return; }
      setSession(s);
      loadClients(s.marchandId);
    } catch { router.replace("/auth/connexion"); }
  }, [router]);

  async function loadClients(marchandId: string) {
    setLoading(true);
    try {
      const q = query(collection(db, "clients"), where("marchand_id", "==", marchandId), orderBy("tampons", "desc"));
      const snap = await getDocs(q);
      setClients(snap.docs.map(d => ({ id: d.id, ...d.data() } as Client)));
    } catch { /* silent */ }
    finally { setLoading(false); }
  }

  if (!session) return null;

  const filtered = clients.filter(c =>
    `${c.prenom} ${c.nom}`.toLowerCase().includes(search.toLowerCase()) ||
    c.telephone.includes(search)
  );

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
          <p style={{ fontSize: 19, fontWeight: 700, color: "#1D1D1F", letterSpacing: -0.3 }}>Clients</p>
        </div>
        <p style={{ marginLeft: "auto", fontSize: 13, color: "#6E6E73" }}>{clients.length}</p>
      </div>

      {/* Recherche */}
      <div style={{ padding: "0 16px 12px" }}>
        <input
          type="text" placeholder="Rechercher un client…" value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ width: "100%", padding: "12px 16px", borderRadius: 14, fontSize: 15, outline: "none", background: "white", border: "1px solid rgba(0,0,0,0.08)", color: "#1D1D1F", boxSizing: "border-box" }}
        />
      </div>

      {/* Liste */}
      <div style={{ flex: 1, overflow: "auto", padding: "0 16px 16px", display: "flex", flexDirection: "column", gap: 8 }}>
        {loading ? (
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", paddingTop: 60 }}>
            <div style={{ width: 32, height: 32, borderRadius: "50%", border: "2.5px solid rgba(0,122,255,0.2)", borderTopColor: "#007AFF", animation: "spin 0.7s linear infinite" }} />
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          </div>
        ) : filtered.length === 0 ? (
          <p style={{ textAlign: "center", color: "#AEAEB2", fontSize: 14, paddingTop: 40 }}>Aucun client trouvé</p>
        ) : filtered.map(c => (
          <div key={c.id} style={{ background: "white", borderRadius: 16, padding: "14px 16px", display: "flex", alignItems: "center", gap: 12, border: "1px solid rgba(0,0,0,0.06)" }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: "linear-gradient(135deg,#007AFF,#8B5CF6)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <span style={{ fontSize: 15, fontWeight: 700, color: "white" }}>{(c.prenom?.[0] || "?").toUpperCase()}</span>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 15, fontWeight: 600, color: "#1D1D1F", marginBottom: 2 }}>{c.prenom} {c.nom}</p>
              <p style={{ fontSize: 12, color: "#AEAEB2" }}>Dernière visite : {formatDate(c.derniere_visite)}</p>
            </div>
            <div style={{ textAlign: "right", flexShrink: 0 }}>
              <p style={{ fontSize: 17, fontWeight: 700, color: "#007AFF" }}>{c.tampons}</p>
              <p style={{ fontSize: 11, color: "#AEAEB2" }}>tampons</p>
            </div>
          </div>
        ))}
      </div>

      {/* Nav bas */}
      <EquipeNav active="clients" session={session} />
    </main>
  );
}

function EquipeNav({ active, session }: { active: "scanner" | "clients" | "notifications"; session: EquipeSession }) {
  const router = useRouter();
  const tabs = [
    { key: "scanner", label: "Scanner", icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><path d="M14 14h3v3m0 4h4v-4m-4 0h-3v4"/></svg>, path: "/equipe/scanner" },
    ...(session.permissions.clients ? [{ key: "clients", label: "Clients", icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>, path: "/equipe/clients" }] : []),
    ...(session.permissions.notifs ? [{ key: "notifications", label: "Notifs", icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>, path: "/equipe/notifications" }] : []),
  ] as const;

  return (
    <div style={{ display: "flex", padding: "8px 16px", gap: 8, borderTop: "1px solid rgba(0,0,0,0.06)", background: "rgba(255,255,255,0.95)", backdropFilter: "blur(20px)" }}>
      {tabs.map(tab => (
        <button key={tab.key} onClick={() => router.push(tab.path)}
          style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4, padding: "8px 0", borderRadius: 12, border: "none", cursor: "pointer", background: active === tab.key ? "rgba(0,122,255,0.08)" : "transparent", color: active === tab.key ? "#007AFF" : "#8E8E93" }}>
          {tab.icon}
          <span style={{ fontSize: 10, fontWeight: 600 }}>{tab.label}</span>
        </button>
      ))}
    </div>
  );
}

export { EquipeNav };
