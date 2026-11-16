"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AppLaunch() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/dashboard");
  }, [router]);

  return (
    <div style={{ position: "fixed", inset: 0, background: "#F7F7FA" }} />
  );
}
