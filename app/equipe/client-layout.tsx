"use client";
import { ToastProvider } from "@/components/Toast";

export default function EquipeClientLayout({ children }: { children: React.ReactNode }) {
  return <ToastProvider>{children}</ToastProvider>;
}
