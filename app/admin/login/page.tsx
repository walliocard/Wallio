"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import WallioLogo from "@/components/WallioLogo";

const BG      = "#000000";
const SURFACE = "#1C1C1E";
const SURFACE2= "#2C2C2E";
const SEP     = "rgba(60,60,67,0.36)";
const LABEL   = "#FFFFFF";
const SEC     = "#8E8E93";
const GREEN   = "#00F5A0";
const RED     = "#FF453A";

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
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, background: SURFACE, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
            <WallioLogo size={30} color={LABEL} />
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: LABEL, marginBottom: 4 }}>Wallio</h1>
          <p style={{ fontSize: 14, color: SEC }}>Administration</p>
        </div>

        {/* Form */}
        <div style={{ background: SURFACE, borderRadius: 16, overflow: "hidden", marginBottom: 12 }}>
          {[
            { key: "email",    type: "email",    placeholder: "Email" },
            { key: "password", type: "password", placeholder: "Mot de passe" },
          ].map((f, i) => (
            <div key={f.key}>
              <input type={f.type} required placeholder={f.placeholder}
                value={form[f.key as keyof typeof form]}
                onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                onKeyDown={e => e.key === "Enter" && handleSubmit(e as unknown as React.FormEvent)}
                style={{ width: "100%", background: "transparent", border: "none", padding: "16px", fontSize: 16, color: LABEL, outline: "none", boxSizing: "border-box" }}
              />
              {i === 0 && <div style={{ height: 1, background: SEP, marginLeft: 16 }} />}
            </div>
          ))}
        </div>

        {error && (
          <p style={{ fontSize: 13, color: RED, marginBottom: 12, textAlign: "center" }}>{error}</p>
        )}

        <button onClick={handleSubmit} disabled={loading}
          style={{ width: "100%", padding: "16px 0", borderRadius: 14, background: loading ? SURFACE2 : GREEN, color: loading ? SEC : "#000", fontSize: 16, fontWeight: 700, border: "none", cursor: loading ? "default" : "pointer", transition: "all 0.15s" }}>
          {loading ? "Vérification…" : "Accéder"}
        </button>
      </div>
    </main>
  );
}
