"use client";

import { useEffect, useRef, useState } from "react";
import type { PassData } from "@/lib/pass-data";

export type CardPhase = "in" | "stamp" | "out";
export type CardState = "stamp" | "reward" | "first" | "duplicate";

interface Props {
  pass: PassData;
  phase: CardPhase;
  state: CardState;
  before: number;
  after: number;
  goal: number;
}

// Approximate Apple Wallet card ratio (85.6 × 54 mm)
const CARD_RATIO = 54 / 85.6;

function isLight(hex: string): boolean {
  const h = hex.replace("#", "").padEnd(6, "0");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 160;
}

function FakeQR({ size, color }: { size: number; color: string }) {
  // Deterministic 7×7 QR-like pattern
  const cells = [
    1,1,1,1,1,1,1,
    1,0,0,0,0,0,1,
    1,0,1,1,1,0,1,
    1,0,1,0,1,0,1,
    1,0,1,1,1,0,1,
    1,0,0,0,0,0,1,
    1,1,1,1,1,1,1,
  ];
  const cell = size / 7;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
      {cells.map((v, i) => v ? (
        <rect
          key={i}
          x={Math.floor(i % 7) * cell}
          y={Math.floor(i / 7) * cell}
          width={cell - 0.5}
          height={cell - 0.5}
          fill={color}
        />
      ) : null)}
    </svg>
  );
}

export default function CardPreview({ pass, phase, state, before, after, goal }: Props) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [stampVisible, setStampVisible] = useState(false);
  const [reflexVisible, setReflexVisible] = useState(false);
  const [counterRolled, setCounterRolled] = useState(false);

  const bg = pass.backgroundColor;
  const fg = pass.foregroundColor;
  const labelC = pass.labelColor;
  const dark = isLight(bg);
  const textMain = dark ? "#1D1D1F" : "#FFFFFF";
  const textLabel = dark ? "rgba(0,0,0,0.5)" : "rgba(255,255,255,0.65)";

  useEffect(() => {
    if (phase !== "stamp") return;
    // Stamp pill + counter roll
    const t1 = setTimeout(() => { setStampVisible(true); setCounterRolled(true); }, 120);
    // Reflex after pill appears
    const t2 = setTimeout(() => setReflexVisible(true), 320);
    // Vibration (Android only)
    try { if (navigator.vibrate) navigator.vibrate(12); } catch {}
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [phase]);

  // Card container animation
  const cardStyle: React.CSSProperties = {
    position: "absolute",
    left: 16,
    right: 16,
    top: "50%",
    marginTop: "-1px",
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: bg,
    boxShadow: "0 24px 64px rgba(0,0,0,0.28)",
    transformOrigin: "center bottom",
    transition: phase === "in"
      ? "opacity 0.5s cubic-bezier(.22,1,.36,1), transform 0.6s cubic-bezier(.22,1,.36,1)"
      : phase === "out"
      ? "opacity 0.4s ease-in, transform 0.4s ease-in"
      : "none",
    opacity: phase === "in" ? 1 : phase === "out" ? 0 : 1,
    transform: phase === "in" ? "translateY(-50%) translateY(0) rotateX(0deg)"
      : phase === "out" ? "translateY(-60%) scale(0.92)"
      : "translateY(-50%)",
  };

  // Initial state before "in" animation
  const initialRef = useRef(true);
  if (initialRef.current && phase === "in") {
    initialRef.current = false;
  }

  const stampIcon = state === "reward"
    ? <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={textMain} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 7v14"/><path d="M20 11v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-8"/><path d="M7.5 7a1 1 0 0 1 0-5A4.8 8 0 0 1 12 7a4.8 8 0 0 1 4.5-5 1 1 0 0 1 0 5"/><rect x="3" y="7" width="18" height="4" rx="1"/></svg>
    : state === "duplicate"
    ? <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={textMain} strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
    : <span style={{ fontSize: 20, fontWeight: 700, color: textMain, letterSpacing: -0.5 }}>+1</span>;

  const stripH = 86;
  const headerH = 44;

  return (
    <div ref={cardRef} style={cardStyle}>
      {/* Card header: logo + name + counter */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "12px 14px 8px", height: headerH, boxSizing: "border-box",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
          {pass.logo ? (
            <img src={pass.logo} alt="" style={{
              width: 28, height: 28, flexShrink: 0, objectFit: "cover",
              borderRadius: pass.logoShape === "round" ? "50%" : 7,
            }} />
          ) : (
            <div style={{
              width: 28, height: 28, flexShrink: 0, borderRadius: pass.logoShape === "round" ? "50%" : 7,
              background: "rgba(255,255,255,0.25)", display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: textMain }}>{pass.logoText[0]?.toUpperCase()}</span>
            </div>
          )}
          <span style={{ fontSize: 13, fontWeight: 600, color: textMain, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {pass.logoText}
          </span>
        </div>

        {/* Counter */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", flexShrink: 0 }}>
          <span style={{ fontSize: 9, fontWeight: 600, color: textLabel, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 1 }}>
            {pass.counterLabel}
          </span>
          <div style={{ position: "relative", height: 24, overflow: "hidden", minWidth: 32 }}>
            {/* Previous count */}
            <span style={{
              display: "block", fontSize: 22, fontWeight: 700, color: textMain, lineHeight: "24px",
              textAlign: "right", letterSpacing: -0.5,
              transform: counterRolled ? "translateY(-100%)" : "translateY(0)",
              transition: counterRolled ? "transform 0.3s cubic-bezier(.4,0,.2,1)" : "none",
            }}>
              {before}
            </span>
            {/* New count */}
            <span style={{
              display: "block", fontSize: 22, fontWeight: 700, color: textMain, lineHeight: "24px",
              textAlign: "right", letterSpacing: -0.5, position: "absolute", top: "100%", right: 0,
              transform: counterRolled ? "translateY(-100%)" : "translateY(0)",
              transition: counterRolled ? "transform 0.3s cubic-bezier(.4,0,.2,1)" : "none",
            }}>
              {after}
            </span>
          </div>
          <span style={{ fontSize: 9, color: textLabel, fontWeight: 500 }}>/ {goal}</span>
        </div>
      </div>

      {/* Strip / banner */}
      {pass.strip && (
        <div style={{ width: "100%", height: stripH, position: "relative", overflow: "hidden" }}>
          <img src={pass.strip} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
        </div>
      )}

      {/* Card body: member + reward + aux fields */}
      <div style={{ padding: "10px 14px 12px", display: "flex", gap: 20 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 9, color: textLabel, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 2 }}>
            {pass.memberLabel}
          </div>
          <div style={{ fontSize: 13, fontWeight: 600, color: textMain, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {pass.clientName}
          </div>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 9, color: textLabel, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 2 }}>
            {pass.rewardLabel}
          </div>
          <div style={{ fontSize: 13, fontWeight: 600, color: textMain, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {pass.auxiliaryFields[0]?.value || "—"}
          </div>
        </div>
        {/* Fake QR */}
        <div style={{ flexShrink: 0, opacity: 0.75 }}>
          <FakeQR size={40} color={textMain} />
        </div>
      </div>

      {/* +1 pill overlay */}
      {stampVisible && (
        <div style={{
          position: "absolute",
          top: 10,
          right: 10,
          width: 44, height: 44, borderRadius: "50%",
          background: "rgba(255,255,255,0.18)",
          border: `1.5px solid ${textMain}22`,
          backdropFilter: "blur(8px)",
          display: "flex", alignItems: "center", justifyContent: "center",
          animation: "stampPill 0.35s cubic-bezier(.22,1,.36,1) both",
        }}>
          {stampIcon}
          <style>{`@keyframes stampPill{from{opacity:0;transform:scale(1.15)}to{opacity:1;transform:scale(1)}}`}</style>
        </div>
      )}

      {/* Reflex */}
      {reflexVisible && (
        <div style={{
          position: "absolute", inset: 0, pointerEvents: "none",
          background: "linear-gradient(105deg, transparent 0%, rgba(255,255,255,0.32) 50%, transparent 100%)",
          animation: "reflex 0.7s cubic-bezier(.4,0,.2,1) both",
        }}>
          <style>{`@keyframes reflex{from{transform:translateX(-110%) skewX(-12deg)}to{transform:translateX(260%) skewX(-12deg)}}`}</style>
        </div>
      )}
    </div>
  );
}
