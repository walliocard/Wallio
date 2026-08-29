"use client";
import { useEffect } from "react";

// Applique .light (7h-20h) ou .dark (20h-7h) sur <html> pour la page NFC.
// Se retire au démontage pour ne pas affecter les autres pages.
export function useTimeTheme() {
  useEffect(() => {
    const hour = new Date().getHours();
    const cls = hour >= 7 && hour < 20 ? "light" : "dark";
    document.documentElement.classList.add(cls);
    return () => document.documentElement.classList.remove(cls);
  }, []);
}
