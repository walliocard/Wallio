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
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold tracking-tight">Wallio</h1>
          <p className="text-white/40 text-sm mt-2">Accès administrateur</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs text-white/50 mb-1.5">Email</label>
            <input
              type="email"
              required
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#00F5A0]/60 transition placeholder:text-white/20"
            />
          </div>
          <div>
            <label className="block text-xs text-white/50 mb-1.5">Mot de passe</label>
            <input
              type="password"
              required
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#00F5A0]/60 transition placeholder:text-white/20"
            />
          </div>

          {error && <p className="text-red-400 text-xs">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#00F5A0] text-black font-semibold rounded-xl py-3 text-sm mt-2 hover:bg-[#00F5A0]/90 transition disabled:opacity-50"
          >
            {loading ? "Connexion..." : "Accéder"}
          </button>
        </form>
      </div>
    </main>
  );
}
