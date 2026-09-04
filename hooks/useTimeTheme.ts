"use client";
import { useLayoutEffect } from "react";

// Applique une classe de thème sur <html>. Se retire au démontage.
// force: "light" | "dark" | "auto" (auto = heure du jour)
export function useTimeTheme(force: "light" | "dark" | "auto" = "auto") {
  useLayoutEffect(() => {
    let cls: string;
    if (force === "light" || force === "dark") {
      cls = force;
    } else {
      const hour = new Date().getHours();
      cls = hour >= 7 && hour < 20 ? "light" : "dark";
    }
    document.documentElement.classList.remove("light", "dark");
    document.documentElement.classList.add(cls);
    return () => document.documentElement.classList.remove(cls);
  }, [force]);
}
