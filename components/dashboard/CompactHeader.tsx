"use client";

import { useEffect, useState } from "react";
import type React from "react";

interface CompactHeaderProps {
  title: string;
  observeRef: React.RefObject<HTMLElement | null>;
}

export default function CompactHeader({ title, observeRef }: CompactHeaderProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = observeRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => setVisible(!entry.isIntersecting),
      { threshold: 0 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [observeRef]);

  return (
    <div
      className="md:ml-[72px] lg:ml-[240px]"
      style={{
        position: "fixed",
        top: 0, left: 0, right: 0,
        height: "calc(env(safe-area-inset-top) + 44px)",
        background: "rgba(247,247,250,0.92)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderBottom: "0.5px solid #E5E5EA",
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
        paddingBottom: 12,
        zIndex: 90,
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(-2px)",
        transition: "opacity 0.2s ease, transform 0.2s ease",
        pointerEvents: "none",
      } as React.CSSProperties}
    >
      <span style={{ fontSize: 16, fontWeight: 600, color: "var(--fg)", letterSpacing: "-0.2px" }}>
        {title}
      </span>
    </div>
  );
}
