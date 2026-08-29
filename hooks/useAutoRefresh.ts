"use client";
import { useEffect } from "react";

// Recharge la page uniquement quand un nouveau déploiement Vercel est détecté.
// Le paramètre `enabled` permet de désactiver le reload (ex: formulaire en cours de saisie).
export function useAutoRefresh(enabled = true, intervalMs = 25000) {
  useEffect(() => {
    if (!enabled) return;

    // Next.js expose le buildId courant dans __NEXT_DATA__
    const buildId = (window as unknown as { __NEXT_DATA__?: { buildId?: string } }).__NEXT_DATA__?.buildId;
    if (!buildId) return;

    const check = async () => {
      try {
        const res = await fetch(`/_next/static/${buildId}/_buildManifest.js`, {
          method: "HEAD",
          cache: "no-store",
        });
        if (res.status === 404) window.location.reload();
      } catch {
        // ignore erreur réseau
      }
    };

    const id = setInterval(check, intervalMs);
    return () => clearInterval(id);
  }, [enabled, intervalMs]);
}
