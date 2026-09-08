"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import WallioLogo from "@/components/WallioLogo";

const GREEN = "#00F5A0";
const FG = "#FFFFFF";
const FG2 = "rgba(255,255,255,0.45)";
const BORDER = "rgba(255,255,255,0.07)";

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
    <main className="min-h-screen flex items-center justify-center px-6" style={{ background: "#0A0A0A" }}>

      {/* Ambient */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", overflow: "hidden" }}>
        <div style={{
          position: "absolute", top: "-25%", left: "50%", transform: "translateX(-50%)",
          width: 700, height: 600, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(0,245,160,0.07) 0%, transparent 65%)",
        }} />
        <div style={{
          position: "absolute", bottom: "-20%", right: "-10%",
          width: 500, height: 400, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(0,245,160,0.04) 0%, transparent 65%)",
        }} />
      </div>

      <div className="w-full max-w-[360px] relative">

        {/* Logo */}
        <div className="text-center mb-10">
          <div className="mx-auto mb-5 w-14 h-14 rounded-[20px] flex items-center justify-center"
            style={{
              background: "rgba(0,245,160,0.08)",
              border: "1px solid rgba(0,245,160,0.2)",
              boxShadow: "0 0 32px rgba(0,245,160,0.12)",
            }}>
            <WallioLogo size={32} color={GREEN} />
          </div>
          <h1 className="text-[26px] font-semibold tracking-[-0.5px]" style={{ color: FG }}>Wallio</h1>
          <p className="text-[14px] mt-1" style={{ color: FG2 }}>Administration</p>
        </div>

        {/* Formulaire */}
        <div className="rounded-[28px] p-7"
          style={{
            background: "rgba(255,255,255,0.03)",
            backdropFilter: "blur(48px) saturate(180%)",
            WebkitBackdropFilter: "blur(48px) saturate(180%)",
            border: `1px solid ${BORDER}`,
            boxShadow: "0 8px 40px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)",
          }}>
          <form onSubmit={handleSubmit} className="space-y-3">
            {[
              { key: "email", type: "email", placeholder: "Email" },
              { key: "password", type: "password", placeholder: "Mot de passe" },
            ].map(f => (
              <input key={f.key} type={f.type} required placeholder={f.placeholder}
                value={form[f.key as keyof typeof form]}
                onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                className="w-full px-4 py-3.5 rounded-2xl text-[15px] outline-none transition-all"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: `1px solid ${BORDER}`,
                  color: FG,
                  boxSizing: "border-box",
                }}
                onFocus={e => (e.target.style.borderColor = "rgba(0,245,160,0.3)")}
                onBlur={e => (e.target.style.borderColor = BORDER)}
              />
            ))}
            {error && <p className="text-[13px]" style={{ color: "#FF3B30" }}>{error}</p>}
            <button type="submit" disabled={loading}
              className="w-full py-3.5 rounded-2xl text-[15px] font-bold mt-1"
              style={{
                background: loading ? "rgba(0,245,160,0.4)" : GREEN,
                color: "#0A0A0A",
                boxShadow: loading ? "none" : "0 4px 24px rgba(0,245,160,0.2)",
                transition: "all 0.2s",
              }}>
              {loading ? "Vérification…" : "Accéder"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
