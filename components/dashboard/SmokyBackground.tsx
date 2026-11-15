"use client";

import { useEffect, useRef } from "react";

interface SmokyBackgroundProps {
  height?: number;
}

export default function SmokyBackground({ height = 280 }: SmokyBackgroundProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Pause quand l'app passe en arrière-plan
    const onVisibility = () => {
      const state = document.hidden ? "paused" : "running";
      el.querySelectorAll<HTMLElement>(".smoky-blob").forEach(b => {
        b.style.animationPlayState = state;
      });
    };
    document.addEventListener("visibilitychange", onVisibility);

    // Pause quand le fondu sort de l'écran au défilement
    const observer = new IntersectionObserver(
      ([entry]) => {
        const state = entry.isIntersecting ? "running" : "paused";
        el.querySelectorAll<HTMLElement>(".smoky-blob").forEach(b => {
          b.style.animationPlayState = state;
        });
      },
      { threshold: 0 }
    );
    observer.observe(el);

    // Pulse sur scan réussi ou récompense
    const onPulse = () => {
      el.classList.add("pulsing");
      setTimeout(() => el.classList.remove("pulsing"), 1000);
    };
    window.addEventListener("wallio:scan-success", onPulse);
    window.addEventListener("wallio:reward", onPulse);

    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("wallio:scan-success", onPulse);
      window.removeEventListener("wallio:reward", onPulse);
      observer.disconnect();
    };
  }, []);

  return (
    <div
      ref={ref}
      className="smoky-bg"
      aria-hidden="true"
      style={{ height }}
    >
      <div className="smoky-blob smoky-blob-1" />
      <div className="smoky-blob smoky-blob-2" />
      <div className="smoky-blob smoky-blob-3" />
    </div>
  );
}

// Helper à appeler depuis le scanner / récompense
export function triggerScanPulse() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("wallio:scan-success"));
  }
}
export function triggerRewardPulse() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("wallio:reward"));
  }
}
