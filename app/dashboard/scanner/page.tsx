"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Icons } from "@/components/dashboard/icons";
import { getClientByTelephone, type Client } from "@/lib/loyalty";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Link from "next/link";
import jsQR from "jsqr";
import { useLang } from "@/lib/lang-context";

type Tab = "qr" | "telephone" | "nom";

export default function ScannerPage() {
  const { user } = useAuth();
  const { t } = useLang();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("qr");

  // QR
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const [scanning, setScanning] = useState(false);
  const [detected, setDetected] = useState<string | null>(null);

  // Téléphone
  const [phone, setPhone] = useState("");
  const [searching, setSearching] = useState(false);
  const [phoneResult, setPhoneResult] = useState<Client | "not_found" | null>(null);

  // Nom
  const [nom, setNom] = useState("");
  const [searchingNom, setSearchingNom] = useState(false);
  const [nomResults, setNomResults] = useState<Client[] | null>(null);

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
      const walletId =
        code.data.match(/^WALLIO:([a-f0-9-]+)/)?.[1] ??
        code.data.match(/\/client\/([a-f0-9-]+)/)?.[1];
      if (walletId) {
      setDetected(walletId);
      stopCamera();
      // Auto-redirect après 1s sur mobile
      setTimeout(() => router.push(`/client/${walletId}`), 1000);
      return;
    }
    }
    animRef.current = requestAnimationFrame(scan);
  }, []);

  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      // videoRef.current est toujours disponible car <video> est toujours dans le DOM
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
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

  useEffect(() => () => { cancelAnimationFrame(animRef.current); stopCamera(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function rechercherParTelephone() {
    if (!user || !phone.trim()) return;
    setSearching(true);
    setPhoneResult(null);
    const client = await getClientByTelephone(phone.trim(), user.uid);
    setPhoneResult(client || "not_found");
    setSearching(false);
  }

  async function rechercherParNom() {
    if (!user || !nom.trim()) return;
    setSearchingNom(true);
    setNomResults(null);
    const q = query(collection(db, "clients"), where("marchand_id", "==", user.uid));
    const snap = await getDocs(q);
    const terme = nom.trim().toLowerCase();
    const resultats = snap.docs
      .map(d => ({ id: d.id, ...d.data() } as Client))
      .filter(c => `${c.prenom} ${c.nom}`.toLowerCase().includes(terme));
    setNomResults(resultats);
    setSearchingNom(false);
  }

  // QR détecté
  if (detected) return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 pb-44 md:pb-6 text-center">
      <div className="w-16 h-16 rounded-full flex items-center justify-center mb-6"
        style={{ background: "rgba(52,199,89,0.12)", color: "#34C759" }}>
        <Icons.Check size={28} />
      </div>
      <h2 className="text-[22px] font-semibold mb-1.5" style={{ color: "var(--fg)" }}>{t.scan_success}</h2>
      <p className="text-[14px] mb-8" style={{ color: "var(--fg-secondary)" }}>✓ QR</p>
      <Link
        href={`/client/${detected}`}
        className="w-full max-w-xs py-4 rounded-2xl text-center text-white font-semibold text-[15px] block"
        style={{ background: "var(--accent)", boxShadow: "0 4px 20px rgba(0,122,255,0.3)" }}
      >
        {t.scan_view_profile}
      </Link>
      <button onClick={() => setDetected(null)} className="mt-4 text-[14px] px-4 py-2" style={{ color: "var(--fg-tertiary)" }}>
        {t.scan_again}
      </button>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col pb-44 md:pb-8">

      {/* Header */}
      <div className="px-5 md:px-8 lg:px-10 pt-8 lg:pt-10 mb-5">
        <p className="text-[12px] font-semibold uppercase tracking-widest mb-1" style={{ color: "var(--fg-tertiary)" }}>
          {t.scan_subtitle}
        </p>
        <h1 className="text-[28px] font-semibold tracking-[-0.5px]" style={{ color: "var(--fg)" }}>{t.scan_title}</h1>

        {/* Onglets */}
        <div className="flex gap-2 mt-4">
          {([["qr", t.scan_tab_qr], ["telephone", t.scan_tab_phone], ["nom", t.scan_tab_name]] as [Tab, string][]).map(([tab_, label]) => (
            <button
              key={tab_}
              onClick={() => {
                setTab(tab_);
                setPhoneResult(null); setPhone("");
                setNomResults(null); setNom("");
                if (scanning) stopCamera();
              }}
              className="px-4 py-2 rounded-2xl text-[13px] font-medium transition-all"
              style={{
                background: tab === tab_ ? "var(--accent)" : "var(--glass-bg)",
                color: tab === tab_ ? "white" : "var(--fg-secondary)",
                border: `1px solid ${tab === tab_ ? "var(--accent)" : "var(--border)"}`,
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 px-5 md:px-8 lg:px-10">

        {/* ── Tab QR ── */}
        {tab === "qr" && (
          <div className="flex flex-col md:flex-row gap-6 items-start">
            <div className="w-full md:max-w-md">
              {/* Zone caméra — hauteur fixe sur mobile, carré sur desktop */}
              <div className="relative rounded-3xl overflow-hidden h-[300px] md:h-auto md:aspect-square"
                style={{ display: scanning ? "block" : "none" }}>
                <video ref={videoRef} playsInline muted className="w-full h-full object-cover" />
                <canvas ref={canvasRef} className="hidden" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="relative w-48 h-48 md:w-52 md:h-52">
                    {[
                      "top-0 left-0 border-t-2 border-l-2 rounded-tl-2xl",
                      "top-0 right-0 border-t-2 border-r-2 rounded-tr-2xl",
                      "bottom-0 left-0 border-b-2 border-l-2 rounded-bl-2xl",
                      "bottom-0 right-0 border-b-2 border-r-2 rounded-br-2xl",
                    ].map((cls, i) => (
                      <div key={i} className={`absolute w-8 h-8 ${cls}`} style={{ borderColor: "white", opacity: 0.8 }} />
                    ))}
                  </div>
                </div>
                <button
                  onClick={stopCamera}
                  className="absolute bottom-4 left-1/2 -translate-x-1/2 px-5 py-2 rounded-full text-[13px] font-medium"
                  style={{ background: "rgba(0,0,0,0.55)", color: "white", backdropFilter: "blur(10px)" }}
                >
                  {t.scan_stop}
                </button>
              </div>

              {/* État idle */}
              {!scanning && (
                <div className="rounded-3xl flex flex-col items-center justify-center text-center h-[300px] md:h-auto md:aspect-square p-8"
                  style={{ background: "var(--glass-bg)", border: "1px solid var(--border)" }}>
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
                    style={{ background: "rgba(0,122,255,0.08)", color: "var(--accent)" }}>
                    <Icons.Camera size={28} />
                  </div>
                  <p className="text-[16px] font-semibold mb-1.5" style={{ color: "var(--fg)" }}>{t.scan_scan_qr}</p>
                  <p className="text-[13px] mb-6 max-w-[220px]" style={{ color: "var(--fg-secondary)" }}>
                    {t.scan_point_qr}
                  </p>
                  <button
                    onClick={startCamera}
                    className="w-full max-w-[200px] py-4 rounded-2xl text-white font-bold text-[15px]"
                    style={{ background: "var(--accent)", boxShadow: "0 6px 24px rgba(0,122,255,0.35)" }}
                  >
                    {t.scan_enable_camera}
                  </button>
                </div>
              )}
            </div>

            <div className="hidden md:block rounded-2xl p-5 max-w-xs"
              style={{ background: "var(--glass-bg)", border: "1px solid var(--border)" }}>
              <p className="text-[12px] font-semibold uppercase tracking-widest mb-3" style={{ color: "var(--fg-tertiary)" }}>
                {t.scan_how}
              </p>
              {[t.scan_how_1, t.scan_how_2, t.scan_how_3].map((step, i) => (
                <div key={i} className="flex gap-3 mb-3 last:mb-0">
                  <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-bold text-white mt-0.5"
                    style={{ background: "var(--accent)" }}>
                    {i + 1}
                  </div>
                  <p className="text-[13px]" style={{ color: "var(--fg-secondary)" }}>{step}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Tab Téléphone ── */}
        {tab === "telephone" && (
          <div className="max-w-md">
            <p className="text-[14px] mb-4" style={{ color: "var(--fg-secondary)" }}>
              {t.scan_search_phone_hint}
            </p>

            <div className="flex gap-2 mb-5">
              <input
                type="tel"
                placeholder="+212 6 00 00 00 00"
                value={phone}
                onChange={e => { setPhone(e.target.value); setPhoneResult(null); }}
                onKeyDown={e => e.key === "Enter" && rechercherParTelephone()}
                className="flex-1 px-4 py-3.5 rounded-2xl text-[15px] outline-none"
                style={{ background: "var(--glass-bg)", border: "1px solid var(--border)", color: "var(--fg)" }}
                onFocus={e => (e.target.style.borderColor = "var(--accent)")}
                onBlur={e => (e.target.style.borderColor = "var(--border)")}
              />
              <button
                onClick={rechercherParTelephone}
                disabled={searching || !phone.trim()}
                className="px-5 py-3.5 rounded-2xl font-semibold text-white text-[14px]"
                style={{ background: "var(--accent)", opacity: !phone.trim() ? 0.5 : 1 }}
              >
                {searching ? "…" : t.scan_search_btn}
              </button>
            </div>

            {phoneResult === "not_found" && (
              <div className="rounded-2xl p-5 text-center"
                style={{ background: "var(--glass-bg)", border: "1px solid var(--border)" }}>
                <p className="text-[16px] font-semibold mb-1" style={{ color: "var(--fg)" }}>{t.scan_not_found_title}</p>
                <p className="text-[13px] mb-4" style={{ color: "var(--fg-secondary)" }}>
                  {t.scan_not_found_body}
                </p>
                <Link href="/dashboard/clients" className="text-[14px] font-medium" style={{ color: "var(--accent)" }}>
                  {t.scan_add_manually}
                </Link>
              </div>
            )}

            {phoneResult && phoneResult !== "not_found" && (
              <div className="rounded-2xl p-5" style={{ background: "var(--glass-bg)", border: "1px solid var(--border)" }}>
                <div className="flex items-center gap-3.5 mb-4">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center text-white font-bold text-[15px] flex-shrink-0" style={{ background: "var(--accent)" }}>
                    {(phoneResult.prenom?.[0] || "").toUpperCase()}{(phoneResult.nom?.[0] || "").toUpperCase()}
                  </div>
                  <div>
                    <p className="text-[16px] font-semibold" style={{ color: "var(--fg)" }}>
                      {phoneResult.prenom} {phoneResult.nom}
                    </p>
                    <p className="text-[13px]" style={{ color: "var(--fg-secondary)" }}>
                      {phoneResult.tampons} {t.dash_stamps.toLowerCase()}
                      {phoneResult.recompense_en_attente && ` · ${t.clients_pending_reward}`}
                    </p>
                  </div>
                </div>
                <Link href={`/client/${phoneResult.wallet_id}`} className="w-full py-3.5 rounded-2xl text-center text-white font-semibold text-[14px] block" style={{ background: "var(--accent)", boxShadow: "0 4px 14px rgba(0,122,255,0.3)" }}>
                  {t.scan_access_profile}
                </Link>
              </div>
            )}
          </div>
        )}

        {/* ── Tab Nom ── */}
        {tab === "nom" && (
          <div className="max-w-md">
            <p className="text-[14px] mb-4" style={{ color: "var(--fg-secondary)" }}>
              {t.scan_search_name_hint}
            </p>

            <div className="flex gap-2 mb-5">
              <input
                type="text"
                placeholder={t.scan_name_placeholder}
                value={nom}
                onChange={e => { setNom(e.target.value); setNomResults(null); }}
                onKeyDown={e => e.key === "Enter" && rechercherParNom()}
                className="flex-1 px-4 py-3.5 rounded-2xl text-[15px] outline-none"
                style={{ background: "var(--glass-bg)", border: "1px solid var(--border)", color: "var(--fg)" }}
                onFocus={e => (e.target.style.borderColor = "var(--accent)")}
                onBlur={e => (e.target.style.borderColor = "var(--border)")}
              />
              <button
                onClick={rechercherParNom}
                disabled={searchingNom || !nom.trim()}
                className="px-5 py-3.5 rounded-2xl font-semibold text-white text-[14px]"
                style={{ background: "var(--accent)", opacity: !nom.trim() ? 0.5 : 1 }}
              >
                {searchingNom ? "…" : t.scan_search_btn}
              </button>
            </div>

            {nomResults !== null && nomResults.length === 0 && (
              <div className="rounded-2xl p-5 text-center" style={{ background: "var(--glass-bg)", border: "1px solid var(--border)" }}>
                <p className="text-[16px] font-semibold mb-1" style={{ color: "var(--fg)" }}>{t.scan_no_result}</p>
                <p className="text-[13px]" style={{ color: "var(--fg-secondary)" }}>
                  {t.scan_no_result_body} &quot;{nom}&quot;.
                </p>
              </div>
            )}

            {nomResults && nomResults.length > 0 && (
              <div className="rounded-2xl overflow-hidden" style={{ background: "var(--glass-bg)", border: "1px solid var(--border)" }}>
                {nomResults.map((c, i) => (
                  <Link key={c.id} href={`/client/${c.wallet_id}`}
                    className="flex items-center gap-3.5 px-5 py-4 transition-opacity active:opacity-70"
                    style={{ borderBottom: i < nomResults.length - 1 ? "1px solid var(--border)" : "none" }}>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-[13px] flex-shrink-0" style={{ background: "var(--accent)" }}>
                      {(c.prenom?.[0] || "").toUpperCase()}{(c.nom?.[0] || "").toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[15px] font-semibold truncate" style={{ color: "var(--fg)" }}>
                        {c.prenom} {c.nom}
                      </p>
                      <p className="text-[12px]" style={{ color: "var(--fg-secondary)" }}>
                        {c.tampons} {t.dash_stamps.toLowerCase()}
                        {c.recompense_en_attente && ` · ${t.clients_pending_reward}`}
                      </p>
                    </div>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
                      <path d="M9 18l6-6-6-6" stroke="var(--fg-tertiary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
