"use client";
import { useEffect } from "react";

// Détecte un nouveau déploiement Vercel en vérifiant si le buildId courant existe encore.
// Si le manifest 404, c'est qu'un nouveau build a remplacé l'ancien → reload automatique.
export function useAutoRefresh(intervalMs = 20000) {
  useEffect(() => {
    const script = document.querySelector<HTMLScriptElement>('script[src*="/_next/static/"]');
    const match = script?.src.match(/\/_next\/static\/([^/]+)\//);
    const buildId = match?.[1];
    if (!buildId) return;

    const check = async () => {
      try {
        const res = await fetch(`/_next/static/${buildId}/_buildManifest.js`, { method: "HEAD", cache: "no-store" });
        if (res.status === 404) window.location.reload();
      } catch {
        // ignore réseau
      }
    };

    const id = setInterval(check, intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
}
