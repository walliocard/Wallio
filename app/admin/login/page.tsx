"use client";

import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";

const ADMIN_EMAIL = "wallio.card@gmail.com";

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
      const { user } = await signInWithEmailAndPassword(auth, form.email, form.password);
      if (user.email !== ADMIN_EMAIL) {
        await auth.signOut();
        setError("Accès réservé à l'administrateur Wallio.");
        return;
      }
      router.push("/admin");
    } catch {
      setError("Email ou mot de passe incorrect.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6" style={{ background: "var(--bg)" }}>

      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] left-[50%] translate-x-[-50%] w-[800px] h-[500px] rounded-full opacity-20"
          style={{ background: "radial-gradient(circle, rgba(0,122,255,0.2) 0%, transparent 70%)" }} />
      </div>

      <div className="w-full max-w-[380px] relative">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-5"
            style={{ background: "var(--accent)", boxShadow: "0 8px 24px rgba(0,122,255,0.3)" }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L20 7V17L12 22L4 17V7L12 2Z" fill="white" fillOpacity="0.9" />
            </svg>
          </div>
          <h1 className="text-[28px] font-semibold tracking-[-0.5px]" style={{ color: "var(--fg)" }}>Wallio</h1>
          <p className="text-[15px] mt-1.5" style={{ color: "var(--fg-secondary)" }}>Administration</p>
        </div>

        <div className="rounded-[28px] p-8"
          style={{
            background: "var(--glass-bg)",
            border: "1px solid var(--glass-border)",
            backdropFilter: "blur(30px)",
            boxShadow: "var(--shadow-lg)",
          }}>
          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              type="email"
              required
              placeholder="Email"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              className="w-full px-4 py-3.5 rounded-2xl text-[15px] outline-none transition-all duration-200"
              style={{ background: "var(--bg)", border: "1px solid var(--border)", color: "var(--fg)" }}
              onFocus={e => e.target.style.borderColor = "var(--accent)"}
              onBlur={e => e.target.style.borderColor = "var(--border)"}
            />
            <input
              type="password"
              required
              placeholder="Mot de passe"
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              className="w-full px-4 py-3.5 rounded-2xl text-[15px] outline-none transition-all duration-200"
              style={{ background: "var(--bg)", border: "1px solid var(--border)", color: "var(--fg)" }}
              onFocus={e => e.target.style.borderColor = "var(--accent)"}
              onBlur={e => e.target.style.borderColor = "var(--border)"}
            />

            {error && <p className="text-[13px] text-red-500 px-1">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-2xl text-[15px] font-semibold text-white transition-all duration-200 mt-1"
              style={{ background: "var(--accent)", boxShadow: "0 4px 16px rgba(0,122,255,0.3)" }}
              onMouseEnter={e => { (e.target as HTMLElement).style.transform = "translateY(-1px)"; }}
              onMouseLeave={e => { (e.target as HTMLElement).style.transform = "translateY(0)"; }}
            >
              {loading ? "Vérification…" : "Accéder"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
