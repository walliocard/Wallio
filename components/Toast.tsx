"use client";
import { createContext, useContext, useState, useCallback, useRef } from "react";

type ToastType = "success" | "error" | "info";
type Toast = { id: number; message: string; type: ToastType; exiting?: boolean };

const ToastContext = createContext<(msg: string, type?: ToastType) => void>(() => {});

export function useToast() { return useContext(ToastContext); }

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const counter = useRef(0);

  const show = useCallback((message: string, type: ToastType = "success") => {
    const id = ++counter.current;
    setToasts(t => [...t, { id, message, type }]);
    setTimeout(() => {
      setToasts(t => t.map(x => x.id === id ? { ...x, exiting: true } : x));
      setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 350);
    }, 2800);
  }, []);

  const colors: Record<ToastType, { bg: string; border: string; icon: string }> = {
    success: { bg: "rgba(52,199,89,0.12)", border: "rgba(52,199,89,0.25)", icon: "#34C759" },
    error:   { bg: "rgba(255,59,48,0.10)", border: "rgba(255,59,48,0.22)", icon: "#FF3B30" },
    info:    { bg: "rgba(0,122,255,0.10)", border: "rgba(0,122,255,0.22)", icon: "#007AFF" },
  };

  const icons: Record<ToastType, React.ReactNode> = {
    success: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
    error:   <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>,
    info:    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>,
  };

  return (
    <ToastContext.Provider value={show}>
      {children}
      <div style={{ position: "fixed", top: "calc(env(safe-area-inset-top, 0px) + 16px)", left: "50%", transform: "translateX(-50%)", zIndex: 9999, display: "flex", flexDirection: "column", gap: 8, alignItems: "center", pointerEvents: "none" }}>
        {toasts.map(t => {
          const c = colors[t.type];
          return (
            <div key={t.id} style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "12px 18px", borderRadius: 20,
              background: "rgba(20,20,22,0.90)",
              backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
              border: `1px solid ${c.border}`,
              boxShadow: "0 4px 24px rgba(0,0,0,0.22)",
              color: "white", fontSize: 14, fontWeight: 500,
              whiteSpace: "nowrap", pointerEvents: "none",
              animation: t.exiting ? "toast-out 0.35s ease forwards" : "toast-in 0.3s cubic-bezier(.4,0,.2,1) forwards",
            }}>
              <span style={{ color: c.icon, flexShrink: 0 }}>{icons[t.type]}</span>
              {t.message}
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
