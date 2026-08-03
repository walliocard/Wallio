"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { Icons } from "@/components/dashboard/icons";
import jsQR from "jsqr";
import Link from "next/link";

export default function ScannerPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const [scanning, setScanning] = useState(false);
  const [detected, setDetected] = useState<string | null>(null);

  const scan = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState !== video.HAVE_ENOUGH_DATA) {
      animRef.current = requestAnimationFrame(scan);
      return;
    }
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    canvas.height = video.videoHeight;
    canvas.width = video.videoWidth;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(img.data, img.width, img.height);
    if (code?.data) {
      const match = code.data.match(/\/client\/([a-f0-9-]+)/);
      if (match) { setDetected(match[1]); stopCamera(); return; }
    }
    animRef.current = requestAnimationFrame(scan);
  }, []);

  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      if (videoRef.current) videoRef.current.srcObject = stream;
      setScanning(true);
      animRef.current = requestAnimationFrame(scan);
    } catch { setScanning(false); }
  }

  function stopCamera() {
    cancelAnimationFrame(animRef.current);
    const video = videoRef.current;
    if (video?.srcObject) {
      (video.srcObject as MediaStream).getTracks().forEach(t => t.stop());
      video.srcObject = null;
    }
    setScanning(false);
  }

  useEffect(() => () => { cancelAnimationFrame(animRef.current); stopCamera(); }, []);

  if (detected) return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 pb-28 md:pb-6 text-center">
      <div
        className="w-16 h-16 rounded-full flex items-center justify-center mb-6"
        style={{ background: "rgba(52,199,89,0.12)", color: "#34C759" }}
      >
        <Icons.Check size={28} />
      </div>
      <h2 className="text-[22px] font-semibold mb-1.5" style={{ color: "var(--fg)" }}>Client identifié</h2>
      <p className="text-[14px] mb-8" style={{ color: "var(--fg-secondary)" }}>QR code scanné avec succès</p>
      <Link
        href={`/client/${detected}`}
        className="w-full max-w-xs py-4 rounded-2xl text-center text-white font-semibold text-[15px] block"
        style={{ background: "var(--accent)", boxShadow: "0 4px 20px rgba(0,122,255,0.3)" }}
      >
        Voir le profil client
      </Link>
      <button
        onClick={() => setDetected(null)}
        className="mt-4 text-[14px] px-4 py-2"
        style={{ color: "var(--fg-tertiary)" }}
      >
        Scanner à nouveau
      </button>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col pb-28 md:pb-8">

      {/* Header */}
      <div className="px-5 md:px-8 lg:px-10 pt-8 lg:pt-10 mb-6">
        <p className="text-[12px] font-semibold uppercase tracking-widest mb-1" style={{ color: "var(--fg-tertiary)" }}>
          Lecture QR
        </p>
        <h1 className="text-[28px] font-semibold tracking-[-0.5px]" style={{ color: "var(--fg)" }}>Scanner</h1>
      </div>

      <div className="flex-1 px-5 md:px-8 lg:px-10 flex flex-col md:flex-row gap-6 items-start">

        {/* Viewfinder */}
        <div className="w-full md:max-w-md">
          {scanning ? (
            <div className="relative rounded-3xl overflow-hidden" style={{ aspectRatio: "1" }}>
              <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
              <canvas ref={canvasRef} className="hidden" />
              {/* Overlay corners */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative w-52 h-52">
                  {[["top-0 left-0 border-t-2 border-l-2 rounded-tl-2xl", ""],
                    ["top-0 right-0 border-t-2 border-r-2 rounded-tr-2xl", ""],
                    ["bottom-0 left-0 border-b-2 border-l-2 rounded-bl-2xl", ""],
                    ["bottom-0 right-0 border-b-2 border-r-2 rounded-br-2xl", ""],
                  ].map(([cls], i) => (
                    <div key={i} className={`absolute w-8 h-8 ${cls}`} style={{ borderColor: "var(--accent)" }} />
                  ))}
                </div>
              </div>
              <button
                onClick={stopCamera}
                className="absolute bottom-4 left-1/2 -translate-x-1/2 px-5 py-2 rounded-full text-[13px] font-medium"
                style={{ background: "rgba(0,0,0,0.55)", color: "white", backdropFilter: "blur(10px)" }}
              >
                Arrêter
              </button>
            </div>
          ) : (
            <div
              className="rounded-3xl flex flex-col items-center justify-center text-center p-10"
              style={{ background: "var(--glass-bg)", border: "1px solid var(--border)", aspectRatio: "1" }}
            >
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
                style={{ background: "rgba(0,122,255,0.08)", color: "var(--accent)" }}
              >
                <Icons.Camera size={28} />
              </div>
              <p className="text-[16px] font-semibold mb-1.5" style={{ color: "var(--fg)" }}>
                Prêt à scanner
              </p>
              <p className="text-[13px] mb-6 max-w-[200px]" style={{ color: "var(--fg-secondary)" }}>
                Pointez la caméra vers le QR code du client
              </p>
              <button
                onClick={startCamera}
                className="px-6 py-3 rounded-2xl text-white font-semibold text-[14px]"
                style={{ background: "var(--accent)", boxShadow: "0 6px 20px rgba(0,122,255,0.28)" }}
              >
                Activer la caméra
              </button>
            </div>
          )}
        </div>

        {/* Hint — visible desktop */}
        <div
          className="hidden md:block rounded-2xl p-5 max-w-xs"
          style={{ background: "var(--glass-bg)", border: "1px solid var(--border)" }}
        >
          <p className="text-[12px] font-semibold uppercase tracking-widest mb-3" style={{ color: "var(--fg-tertiary)" }}>
            Comment ça marche
          </p>
          {[
            "Le client ouvre l'app Wallio sur son téléphone",
            "Il affiche son QR code personnel",
            "Scannez-le avec la caméra pour valider un tampon",
          ].map((step, i) => (
            <div key={i} className="flex gap-3 mb-3 last:mb-0">
              <div
                className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-bold text-white mt-0.5"
                style={{ background: "var(--accent)" }}
              >
                {i + 1}
              </div>
              <p className="text-[13px]" style={{ color: "var(--fg-secondary)" }}>{step}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
