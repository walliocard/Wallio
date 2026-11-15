"use client";

import { useEffect, useRef } from "react";

export type AmbientVariant = "hero" | "subtle" | "login";

interface BlobConfig {
  w: number;
  x: string;
  y: string;
  gradient: string;
  animClass: string;
}

const HERO_BLOBS: BlobConfig[] = [
  {
    w: 340, x: "-8%", y: "-40px",
    gradient: "radial-gradient(circle, rgba(47,123,255,0.42) 0%, rgba(47,123,255,0.16) 40%, transparent 70%)",
    animClass: "ambient-blob-A",
  },
  {
    w: 320, x: "108%", y: "-20px",
    gradient: "radial-gradient(circle, rgba(139,92,246,0.38) 0%, rgba(139,92,246,0.14) 40%, transparent 70%)",
    animClass: "ambient-blob-B",
  },
  {
    w: 260, x: "50%", y: "150px",
    gradient: "radial-gradient(circle, rgba(185,168,255,0.28) 0%, rgba(185,168,255,0.10) 40%, transparent 70%)",
    animClass: "ambient-blob-C",
  },
];

// Login : même nappes que hero mais nappe lavande plus bas (derrière le logo)
const LOGIN_BLOBS: BlobConfig[] = [
  {
    w: 340, x: "-8%", y: "-40px",
    gradient: "radial-gradient(circle, rgba(47,123,255,0.42) 0%, rgba(47,123,255,0.16) 40%, transparent 70%)",
    animClass: "ambient-blob-A",
  },
  {
    w: 320, x: "108%", y: "-20px",
    gradient: "radial-gradient(circle, rgba(139,92,246,0.38) 0%, rgba(139,92,246,0.14) 40%, transparent 70%)",
    animClass: "ambient-blob-B",
  },
  {
    w: 260, x: "50%", y: "220px",
    gradient: "radial-gradient(circle, rgba(185,168,255,0.28) 0%, rgba(185,168,255,0.10) 40%, transparent 70%)",
    animClass: "ambient-blob-C",
  },
];

const SUBTLE_BLOBS: BlobConfig[] = [
  {
    w: 280, x: "-12%", y: "-70px",
    gradient: "radial-gradient(circle, rgba(47,123,255,0.26) 0%, rgba(47,123,255,0.10) 40%, transparent 70%)",
    animClass: "ambient-blob-As",
  },
  {
    w: 260, x: "110%", y: "-50px",
    gradient: "radial-gradient(circle, rgba(139,92,246,0.24) 0%, rgba(139,92,246,0.09) 40%, transparent 70%)",
    animClass: "ambient-blob-Bs",
  },
];

export function triggerAmbientPulse() {
  if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent("wallio:ambient-pulse"));
}

export default function AmbientBackground({ variant }: { variant: AmbientVariant }) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const pulseRef = useRef<HTMLDivElement>(null);
  const pulsingRef = useRef(false);
  const height = variant === "hero" ? 360 : variant === "login" ? 480 : 220;
  const fadeFrom = variant === "subtle" ? 35 : 45;
  const blobs = variant === "hero" ? HERO_BLOBS : variant === "login" ? LOGIN_BLOBS : SUBTLE_BLOBS;

  // Scroll opacity
  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    let scrollParent: HTMLElement | null = el.parentElement;
    while (scrollParent && scrollParent !== document.body) {
      const ov = window.getComputedStyle(scrollParent).overflowY;
      if (ov === "auto" || ov === "scroll") break;
      scrollParent = scrollParent.parentElement;
    }
    if (!scrollParent || scrollParent === document.body) return;
    const sp = scrollParent;
    const onScroll = () => {
      if (el) el.style.opacity = String(Math.max(0, 1 - sp.scrollTop / 160));
    };
    sp.addEventListener("scroll", onScroll, { passive: true });
    return () => sp.removeEventListener("scroll", onScroll);
  }, []);

  // Pause on visibilitychange
  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const onVis = () => {
      const state = document.hidden ? "paused" : "running";
      el.querySelectorAll<HTMLElement>(".ambient-blob").forEach(b => { b.style.animationPlayState = state; });
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  // Pause when out of view (IntersectionObserver)
  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(([entry]) => {
      const state = entry.isIntersecting ? "running" : "paused";
      el.querySelectorAll<HTMLElement>(".ambient-blob").forEach(b => { b.style.animationPlayState = state; });
    }, { threshold: 0 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // Pulse
  useEffect(() => {
    const onPulse = () => {
      if (pulsingRef.current) return;
      const el = pulseRef.current;
      if (!el) return;
      pulsingRef.current = true;
      el.style.transition = "opacity 250ms ease-out, transform 1150ms ease-out";
      el.style.opacity = "1";
      el.style.transform = "translate(-50%, -50%) scale(1.08)";
      setTimeout(() => {
        if (!pulseRef.current) return;
        pulseRef.current.style.transition = "opacity 900ms ease-in";
        pulseRef.current.style.opacity = "0";
      }, 250);
      setTimeout(() => {
        if (!pulseRef.current) return;
        pulseRef.current.style.transform = "translate(-50%, -50%) scale(1)";
        pulsingRef.current = false;
      }, 1200);
    };
    window.addEventListener("wallio:ambient-pulse", onPulse);
    // Keep backward compat with existing events
    window.addEventListener("wallio:scan-success", onPulse);
    window.addEventListener("wallio:reward", onPulse);
    return () => {
      window.removeEventListener("wallio:ambient-pulse", onPulse);
      window.removeEventListener("wallio:scan-success", onPulse);
      window.removeEventListener("wallio:reward", onPulse);
    };
  }, []);

  return (
    <div
      ref={wrapperRef}
      aria-hidden="true"
      style={{
        position: "fixed",
        top: 0, left: 0, right: 0,
        height,
        overflow: "hidden", pointerEvents: "none", zIndex: 0,
      }}
    >
      {/* Blobs */}
      {blobs.map((b, i) => (
        <div
          key={i}
          className={`ambient-blob ${b.animClass}`}
          style={{
            position: "absolute",
            width: b.w, height: b.w,
            borderRadius: "50%",
            left: b.x, top: b.y,
            background: b.gradient,
            willChange: "transform",
          }}
        />
      ))}

      {/* Pulse layer */}
      <div
        ref={pulseRef}
        style={{
          position: "absolute",
          width: 380, height: 380,
          borderRadius: "50%",
          left: "50%", top: "-40px",
          transform: "translate(-50%, -50%) scale(1)",
          background: "radial-gradient(circle, rgba(110,107,250,0.35) 0%, rgba(110,107,250,0) 70%)",
          opacity: 0,
          willChange: "transform, opacity",
        }}
      />

      {/* Fade-out overlay */}
      <div style={{
        position: "absolute", inset: 0,
        background: `linear-gradient(to bottom, rgba(247,247,250,0) 0%, rgba(247,247,250,0) ${fadeFrom}%, #F7F7FA 100%)`,
      }} />
    </div>
  );
}
