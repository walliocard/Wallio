"use client";

import { useRouter } from "next/navigation";

// Bouton « retour » qui revient à la page précédente (et non à la landing).
export default function BackLink({ label = "Retour", fallback = "/mes-cartes" }: { label?: string; fallback?: string }) {
  const router = useRouter();
  return (
    <button
      onClick={() => { if (window.history.length > 1) router.back(); else router.push(fallback); }}
      style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 14, color: "#007AFF", background: "transparent", border: "none", cursor: "pointer", padding: 0 }}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
      {label}
    </button>
  );
}
