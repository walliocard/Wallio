"use client";

import { useEffect, useRef, useState } from "react";
import { collection, onSnapshot, query, where, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { validerRecompense, type Marchand, type Client } from "@/lib/loyalty";

export default function RecompenseAlert({ marchand, marchandId }: { marchand: Marchand; marchandId: string }) {
  const [alerte, setAlerte] = useState<Client | null>(null);
  const [validating, setValidating] = useState(false);
  const ouvertDepuis = useRef(Timestamp.now());
  const vus = useRef<Set<string>>(new Set());

  useEffect(() => {
    const q = query(
      collection(db, "clients"),
      where("marchand_id", "==", marchandId),
      where("recompense_en_attente", "==", true),
    );

    const unsub = onSnapshot(q, (snap) => {
      for (const doc of snap.docs) {
        const client = { id: doc.id, ...doc.data() } as Client;
        if (vus.current.has(client.id)) continue;

        const visite = (client as Record<string, unknown>).derniere_visite as Timestamp | null;
        if (!visite || visite.seconds < ouvertDepuis.current.seconds) continue;

        vus.current.add(client.id);
        setAlerte(client);
        break;
      }
    });

    return () => unsub();
  }, [marchandId]);

  if (!alerte) return null;

  async function handleValider() {
    if (!alerte) return;
    setValidating(true);
    await validerRecompense(alerte.id);
    setValidating(false);
    setAlerte(null);
  }

  function handlePlusTard() {
    if (alerte) vus.current.add(alerte.id);
    setAlerte(null);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-5"
      style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)" }}>
      <div className="w-full max-w-[360px] rounded-[28px] p-6 animate-in fade-in slide-in-from-bottom-4 duration-300"
        style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)", boxShadow: "0 24px 80px rgba(0,0,0,0.3)" }}>

        {/* Pastille verte */}
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4"
          style={{ background: "rgba(52,199,89,0.12)" }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#34C759" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 12V22H4V12"/><path d="M22 7H2v5h20V7z"/><path d="M12 22V7"/><path d="M12 7H7.5a2.5 2.5 0 010-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 000-5C13 2 12 7 12 7z"/>
          </svg>
        </div>

        <p className="text-[13px] font-medium mb-1" style={{ color: "var(--fg-secondary)" }}>
          Récompense débloquée
        </p>
        <h2 className="text-[20px] font-semibold tracking-tight mb-1" style={{ color: "var(--fg)" }}>
          {alerte.prenom} {alerte.nom}
        </h2>
        <p className="text-[15px] mb-6" style={{ color: "var(--fg-secondary)" }}>
          {marchand.nom_recompense}
        </p>

        <div className="flex gap-2.5">
          <button
            onClick={handlePlusTard}
            className="flex-1 py-3.5 rounded-2xl text-[14px] font-medium"
            style={{ background: "var(--bg)", color: "var(--fg-secondary)", border: "1px solid var(--border)" }}>
            Plus tard
          </button>
          <button
            onClick={handleValider}
            disabled={validating}
            className="flex-1 py-3.5 rounded-2xl text-[14px] font-semibold text-white transition-opacity active:opacity-80"
            style={{ background: "#34C759", boxShadow: "0 4px 16px rgba(52,199,89,0.3)" }}>
            {validating ? "Validation..." : "Valider"}
          </button>
        </div>
      </div>
    </div>
  );
}
