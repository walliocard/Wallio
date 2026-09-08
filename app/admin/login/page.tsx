"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import WallioLogo from "@/components/WallioLogo";

const BG     = "#F5F5F7";
const LABEL  = "#111113";
const SEC    = "#6E6E73";
const BORDER = "rgba(0,0,0,0.07)";
const ACCENT = "#00F5A0";
const DANGER = "#FF3B30";

export default function AdminLoginPage() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Erreur."); return; }
      router.push("/admin");
    } catch {
      setError("Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "0 24px", background: BG }}>
      <div style={{ width: "100%", maxWidth: 340 }}>

        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div style={{ width: 52, height: 52, borderRadius: 14, background: "#FFFFFF", border: `1px solid ${BORDER}`, boxShadow: "0 2px 10px rgba(0,0,0,0.06)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
            <WallioLogo size={28} />
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 600, color: LABEL, marginBottom: 3 }}>Wallio</h1>
          <p style={{ fontSize: 14, color: SEC }}>Administration</p>
        </div>

        {/* Formulaire */}
        <div style={{ background: "#FFFFFF", borderRadius: 16, overflow: "hidden", border: `1px solid ${BORDER}`, boxShadow: "0 2px 12px rgba(0,0,0,0.05)", marginBottom: 10 }}>
          {[
            { key: "email",    type: "email",    placeholder: "Email" },
            { key: "password", type: "password", placeholder: "Mot de passe" },
          ].map((f, i) => (
            <div key={f.key}>
              <input type={f.type} required placeholder={f.placeholder}
                value={form[f.key as keyof typeof form]}
                onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                onKeyDown={e => e.key === "Enter" && handleSubmit(e as unknown as React.FormEvent)}
                style={{ width: "100%", background: "transparent", border: "none", padding: "15px 16px", fontSize: 16, color: LABEL, outline: "none", boxSizing: "border-box" }}
              />
              {i === 0 && <div style={{ height: 1, background: BORDER, marginLeft: 16 }} />}
            </div>
          ))}
        </div>

        {error && <p style={{ fontSize: 13, color: DANGER, marginBottom: 10, textAlign: "center" }}>{error}</p>}

        <button onClick={handleSubmit} disabled={loading}
          style={{ width: "100%", padding: "15px 0", borderRadius: 14, background: loading ? "rgba(0,0,0,0.06)" : ACCENT, color: loading ? SEC : LABEL, fontSize: 16, fontWeight: 600, border: "none", cursor: loading ? "default" : "pointer", transition: "opacity 0.15s" }}>
          {loading ? "Vérification…" : "Accéder"}
        </button>
      </div>
    </main>
  );
}
