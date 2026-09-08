"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import WallioLogo from "@/components/WallioLogo";

const DANGER = "#FF3B30";

const T = { bg: "#F5F5F7", surfCard: "#FFFFFF", label: "#111113", sec: "#6E6E73", border: "rgba(0,0,0,0.07)", sep: "rgba(0,0,0,0.07)", btnBg: "#FFFFFF", btnFg: "#111113", shadow: "0 2px 12px rgba(0,0,0,0.05)" };

export default function AdminLoginPage() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      const res = await fetch("/api/admin/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Erreur."); return; }
      router.push("/admin");
    } catch { setError("Une erreur est survenue."); }
    finally { setLoading(false); }
  }

  return (
    <main style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "0 24px", background: T.bg }}>
      <div style={{ width: "100%", maxWidth: 340 }}>
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div style={{ width: 52, height: 52, borderRadius: 14, background: T.surfCard, border: `1px solid ${T.border}`, boxShadow: T.shadow, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
            <WallioLogo size={28} />
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 600, color: T.label, marginBottom: 3 }}>Wallio</h1>
          <p style={{ fontSize: 14, color: T.sec }}>Administration</p>
        </div>
        <div style={{ background: T.surfCard, borderRadius: 16, overflow: "hidden", border: `1px solid ${T.border}`, boxShadow: T.shadow, marginBottom: 10 }}>
          {[{ key: "email", type: "email", placeholder: "Email" }, { key: "password", type: "password", placeholder: "Mot de passe" }].map((f, i) => (
            <div key={f.key}>
              <input type={f.type} required placeholder={f.placeholder}
                value={form[f.key as keyof typeof form]}
                onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                onKeyDown={e => e.key === "Enter" && handleSubmit(e as unknown as React.FormEvent)}
                style={{ width: "100%", background: "transparent", border: "none", padding: "15px 16px", fontSize: 16, color: T.label, outline: "none", boxSizing: "border-box" }} />
              {i === 0 && <div style={{ height: 1, background: T.sep, marginLeft: 16 }} />}
            </div>
          ))}
        </div>
        {error && <p style={{ fontSize: 13, color: DANGER, marginBottom: 10, textAlign: "center" }}>{error}</p>}
        <button onClick={handleSubmit} disabled={loading}
          style={{ width: "100%", padding: "15px 0", borderRadius: 14, background: loading ? "rgba(0,0,0,0.06)" : T.btnBg, color: loading ? T.sec : T.btnFg, fontSize: 16, fontWeight: 600, border: `1px solid ${T.border}`, boxShadow: T.shadow, cursor: loading ? "default" : "pointer", transition: "opacity 0.15s" }}>
          {loading ? "Vérification…" : "Accéder"}
        </button>
      </div>
    </main>
  );
}
