"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface EquipeSession {
  token: string;
  prenom: string;
  marchandId: string;
  marchandNom: string;
  logo_url?: string | null;
  permissions: { notifs: boolean; clients: boolean };
}

interface Client {
  id: string;
  wallet_id: string;
  prenom: string;
  nom: string;
  telephone: string;
  tampons: number;
  derniere_visite?: { seconds: number } | null;
}

interface TamponResult {
  type: "ok" | "recompense" | "anti_doublon" | "not_found";
  prenom?: string;
  tampons?: number;
  objectif?: number;
  nom_recompense?: string;
  prochain_recompense?: string;
  secondes_restantes?: number;
  clientId?: string;
  mode_recompense?: string;
  palier_index?: number;
  paliers_valides?: boolean[];
  total_paliers?: number;
}

function formatDate(ts?: { seconds: number } | null): string {
  if (!ts) return "—";
  return new Date(ts.seconds * 1000).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

function formatTemps(sec: number): string {
  if (sec < 3600) return `${Math.ceil(sec / 60)} min`;
  return `${Math.ceil(sec / 3600)} h`;
}

export default function EquipeClientsPage() {
  const router = useRouter();
  const [session, setSession] = useState<EquipeSession | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [stampingId, setStampingId] = useState<string | null>(null);
  const [validatingId, setValidatingId] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, TamponResult>>({});

  useEffect(() => {
    const raw = localStorage.getItem("equipe_session");
    if (!raw) { router.replace("/auth/connexion"); return; }
    try {
      const s: EquipeSession = JSON.parse(raw);
      setSession(s);
      loadClients(s.token);
    } catch { router.replace("/auth/connexion"); }
  }, [router]);

  async function loadClients(token: string) {
    setLoading(true);
    try {
      const res = await fetch("/api/equipe/clients", { headers: { "x-equipe-token": token } });
      if (res.ok) { const data = await res.json(); setClients(data.clients || []); }
    } catch { /* silent */ }
    finally { setLoading(false); }
  }

  async function handleTampon(client: Client) {
    if (!session || stampingId) return;
    setStampingId(client.id);
    try {
      const res = await fetch("/api/equipe/tampon", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-equipe-token": session.token },
        body: JSON.stringify({ walletId: client.wallet_id, manual: true }),
      });
      const data = await res.json();
      setResults(prev => ({ ...prev, [client.id]: data }));
      // Mettre à jour le nombre de tampons localement
      if (data.type === "ok" || data.type === "recompense") {
        setClients(prev => prev.map(c => c.id === client.id ? { ...c, tampons: data.tampons ?? c.tampons } : c));
      }
    } catch { /* silent */ }
    finally { setStampingId(null); }
  }

  async function handleValiderRecompense(clientId: string, result: TamponResult) {
    if (!session || validatingId) return;
    setValidatingId(clientId);
    try {
      const isProgressif = result.mode_recompense === "progressif" && result.palier_index !== undefined;
      await fetch("/api/equipe/valider-recompense", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-equipe-token": session.token },
        body: JSON.stringify({
          clientId: result.clientId,
          mode: result.mode_recompense || "cyclique",
          palierIndex: isProgressif ? result.palier_index : undefined,
          paliersValides: isProgressif ? (result.paliers_valides || []) : undefined,
          totalPaliers: isProgressif ? result.total_paliers : undefined,
        }),
      });
      setResults(prev => ({ ...prev, [clientId]: { ...prev[clientId], type: "ok", nom_recompense: undefined, tampons: isProgressif ? (result.tampons ?? 0) : 0 } }));
      setClients(prev => prev.map(c => c.id === clientId ? { ...c, tampons: isProgressif ? (result.tampons ?? 0) : 0 } : c));
    } catch { /* silent */ }
    finally { setValidatingId(null); }
  }

  if (!session) return null;

  const filtered = search.trim()
    ? clients.filter(c =>
        `${c.prenom} ${c.nom}`.toLowerCase().includes(search.toLowerCase()) ||
        c.telephone.includes(search.replace(/\s/g, ""))
      )
    : clients;

  return (
    <main style={{
      minHeight: "100dvh", display: "flex", flexDirection: "column", background: "#F5F5F7",
      paddingTop: "env(safe-area-inset-top)", paddingBottom: "env(safe-area-inset-bottom)",
    }}>
      {/* Header */}
      <div style={{ padding: "16px 20px 12px", display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1 }}>
          {session.logo_url && (
            <img src={session.logo_url} alt="" style={{ width: 36, height: 36, borderRadius: 10, objectFit: "cover", flexShrink: 0 }} />
          )}
          <div>
            <p style={{ fontSize: 12, color: "#6E6E73" }}>{session.marchandNom}</p>
            <p style={{ fontSize: 19, fontWeight: 700, color: "#1D1D1F", letterSpacing: -0.3 }}>Clients</p>
          </div>
        </div>
        <p style={{ fontSize: 13, color: "#AEAEB2" }}>{clients.length}</p>
      </div>

      {/* Recherche */}
      <div style={{ padding: "0 16px 12px" }}>
        <input
          type="text" placeholder="Nom ou numéro de téléphone…" value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ width: "100%", padding: "12px 16px", borderRadius: 14, fontSize: 15, outline: "none", background: "white", border: "1px solid rgba(0,0,0,0.08)", color: "#1D1D1F", boxSizing: "border-box" }}
        />
      </div>

      {/* Liste */}
      <div style={{ flex: 1, overflow: "auto", padding: "0 16px 80px", display: "flex", flexDirection: "column", gap: 8 }}>
        {loading ? (
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", paddingTop: 60 }}>
            <div style={{ width: 32, height: 32, borderRadius: "50%", border: "2.5px solid rgba(0,122,255,0.2)", borderTopColor: "#007AFF", animation: "spin 0.7s linear infinite" }} />
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          </div>
        ) : filtered.length === 0 ? (
          <p style={{ textAlign: "center", color: "#AEAEB2", fontSize: 14, paddingTop: 40 }}>Aucun client trouvé</p>
        ) : filtered.map(c => {
          const result = results[c.id];
          return (
            <div key={c.id} style={{ background: "white", borderRadius: 18, padding: "14px 16px", border: "1px solid rgba(0,0,0,0.06)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: "linear-gradient(135deg,#007AFF,#8B5CF6)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <span style={{ fontSize: 15, fontWeight: 700, color: "white" }}>{(c.prenom?.[0] || "?").toUpperCase()}</span>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 15, fontWeight: 600, color: "#1D1D1F" }}>{c.prenom} {c.nom}</p>
                  <p style={{ fontSize: 12, color: "#AEAEB2" }}>Dernière visite : {formatDate(c.derniere_visite)}</p>
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6, flexShrink: 0 }}>
                  <p style={{ fontSize: 17, fontWeight: 700, color: "#007AFF" }}>{c.tampons}</p>
                  <button
                    onClick={() => handleTampon(c)}
                    disabled={stampingId === c.id}
                    style={{
                      padding: "6px 14px", borderRadius: 10, fontSize: 13, fontWeight: 600,
                      background: "linear-gradient(135deg,#007AFF,#8B5CF6)", color: "white",
                      border: "none", cursor: "pointer", opacity: stampingId === c.id ? 0.6 : 1,
                    }}>
                    {stampingId === c.id ? "…" : "+ Tampon"}
                  </button>
                </div>
              </div>

              {/* Résultat du tampon */}
              {result && (
                <div style={{ marginTop: 10, padding: "10px 12px", borderRadius: 12, background: result.type === "ok" ? "rgba(0,122,255,0.06)" : result.type === "recompense" ? "rgba(52,199,89,0.08)" : result.type === "anti_doublon" ? "rgba(255,159,10,0.08)" : "rgba(255,59,48,0.06)" }}>
                  {result.type === "ok" && (
                    <>
                      <p style={{ fontSize: 13, fontWeight: 600, color: "#007AFF" }}>Tampon ajouté — {result.tampons}/{result.objectif}</p>
                      {result.prochain_recompense && (result.objectif ?? 0) > (result.tampons ?? 0) && (
                        <p style={{ fontSize: 12, color: "#AEAEB2", marginTop: 2 }}>encore {(result.objectif ?? 0) - (result.tampons ?? 0)} avant {result.prochain_recompense}</p>
                      )}
                    </>
                  )}
                  {result.type === "recompense" && (
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: "#34C759" }}>Récompense — {result.nom_recompense}</p>
                      <button
                        onClick={() => handleValiderRecompense(c.id, result)}
                        disabled={validatingId === c.id}
                        style={{ padding: "5px 12px", borderRadius: 9, fontSize: 12, fontWeight: 600, background: "#34C759", color: "white", border: "none", cursor: "pointer", opacity: validatingId === c.id ? 0.6 : 1, flexShrink: 0 }}>
                        {validatingId === c.id ? "…" : "Valider"}
                      </button>
                    </div>
                  )}
                  {result.type === "anti_doublon" && <p style={{ fontSize: 13, fontWeight: 600, color: "#FF9F0A" }}>Déjà enregistré — prochain dans {formatTemps(result.secondes_restantes ?? 0)}</p>}
                  {result.type === "not_found" && <p style={{ fontSize: 13, fontWeight: 600, color: "#FF3B30" }}>Client introuvable</p>}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <EquipeNav active="clients" session={session} />
    </main>
  );
}

export function EquipeNav({ active, session }: { active: "scanner" | "clients"; session: EquipeSession }) {
  const router = useRouter();
  const tabs = [
    { key: "scanner" as const, label: "Scanner", path: "/equipe/scanner", icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><path d="M14 14h3v3m0 4h4v-4m-4 0h-3v4"/></svg> },
    { key: "clients" as const, label: "Clients", path: "/equipe/clients", icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> },
  ];
  return (
    <div style={{ display: "flex", padding: "8px 16px", gap: 8, borderTop: "1px solid rgba(0,0,0,0.06)", background: "rgba(255,255,255,0.95)", backdropFilter: "blur(20px)", position: "fixed", bottom: 0, left: 0, right: 0 }}>
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
