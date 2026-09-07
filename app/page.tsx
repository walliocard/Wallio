"use client";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";

const WA = "https://wa.me/40749056483?text=Bonjour%2C%20je%20souhaite%20d%C3%A9couvrir%20Wallio%20pour%20mon%20commerce.";

function useReveal() {
  useEffect(() => {
    document.querySelectorAll("[data-stagger]").forEach(parent => {
      Array.from(parent.children).forEach((child, i) => {
        (child as HTMLElement).style.transitionDelay = `${i * 0.06}s`;
        child.setAttribute("data-reveal", "");
      });
    });
    const els = document.querySelectorAll("[data-reveal]");
    const io = new IntersectionObserver(
      entries => entries.forEach(e => {
        if (e.isIntersecting) {
          requestAnimationFrame(() => (e.target as HTMLElement).classList.add("revealed"));
          io.unobserve(e.target);
        }
      }),
      { threshold: 0.06 }
    );
    els.forEach(el => io.observe(el));
    return () => io.disconnect();
  }, []);
}

function WalletCardMock({
  bg = "#1C1C1E", fg = "#FFFFFF", labelClr = "rgba(255,255,255,0.5)",
  name = "Mon Café", logoInitial = "MC",
  stamps = 7, total = 10, reward = "Café offert",
  stampColor = "#FFFFFF", stripBg = "rgba(255,255,255,0.08)",
  aux1 = "Ouv. 8h-18h", aux2 = "Lundi-Samedi",
}: {
  bg?: string; fg?: string; labelClr?: string; name?: string; logoInitial?: string;
  stamps?: number; total?: number; reward?: string; stampColor?: string;
  stripBg?: string; aux1?: string; aux2?: string;
}) {
  const sep = `1px solid rgba(${fg === "#FFFFFF" ? "255,255,255" : "0,0,0"},0.10)`;
  const perRow = total <= 8 ? total : Math.ceil(total / 2);
  const rows = Math.ceil(total / perRow);
  const scale = 260 / 375;
  const gap1x = Math.round(Math.max(6, 10));
  const baseSize1x = Math.min(36, Math.floor((343 - (perRow - 1) * gap1x) / perRow));
  const s1x = Math.max(14, baseSize1x);
  const s = s1x * scale;
  const gap = gap1x * scale;
  const thick = Math.max(0.5, s * 0.06);
  const gridW = perRow * s + (perRow - 1) * gap;
  const gridH = rows * s + (rows - 1) * gap;

  return (
    <div style={{
      width: 260, flexShrink: 0, background: bg, borderRadius: 14,
      overflow: "hidden", fontFamily: "-apple-system,'SF Pro Display',sans-serif",
      boxShadow: "0 24px 64px rgba(0,0,0,0.30)",
    }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 12px 8px" }}>
        <div style={{ width: 21, height: 21, borderRadius: 4, background: "rgba(255,255,255,0.18)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontSize: 9, fontWeight: 700, color: fg }}>{logoInitial}</span>
        </div>
        <span style={{ flex: 1, fontSize: 11, fontWeight: 600, color: fg, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{name}</span>
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <div style={{ fontSize: 6.5, color: labelClr, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 1 }}>TAMPONS</div>
          <div style={{ fontSize: 10, fontWeight: 600, color: fg }}>{stamps}/{total}</div>
        </div>
      </div>

      {/* Strip avec tampons */}
      <div style={{ width: 260, height: 100, overflow: "hidden", position: "relative", background: stripBg }}>
        <div style={{
          position: "absolute", inset: 0,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap }}>
            {Array.from({ length: rows }).map((_, row) => {
              const count = Math.min(perRow, total - row * perRow);
              return (
                <div key={row} style={{ display: "flex", gap }}>
                  {Array.from({ length: count }).map((_, col) => {
                    const idx = row * perRow + col;
                    const filled = idx < stamps;
                    return (
                      <div key={col} style={{
                        width: s, height: s, borderRadius: "50%", flexShrink: 0,
                        background: filled ? stampColor + "22" : "transparent",
                        border: `${thick}px solid ${filled ? stampColor : stampColor + "44"}`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}>
                        {filled && <div style={{ width: s * 0.36, height: s * 0.36, borderRadius: "50%", background: stampColor }} />}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Champs */}
      <div style={{ display: "flex", padding: "8px 12px 10px", gap: 6 }}>
        {[
          { label: "Récompense", value: reward },
          { label: "Membre", value: "Client fidèle" },
          { label: "Info", value: aux1 },
          { label: "Info", value: aux2 },
        ].slice(0, total > 8 ? 4 : 3).map((f, i) => (
          <div key={i} style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 6.5, color: labelClr, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 2 }}>{f.label}</div>
            <div style={{ fontSize: 9.5, fontWeight: 500, color: fg, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.value}</div>
          </div>
        ))}
      </div>

      {/* Séparateur + QR */}
      <div style={{ height: "0.5px", background: sep, margin: "0 12px" }} />
      <div style={{ display: "flex", justifyContent: "center", padding: "10px 12px 12px" }}>
        <div style={{ background: "#FFFFFF", borderRadius: 5, padding: 5, width: 44, height: 44, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width="34" height="34" viewBox="0 0 34 34" fill="none">
            <rect x="1" y="1" width="13" height="13" rx="2" stroke="#1D1D1F" strokeWidth="1.5" fill="none"/>
            <rect x="4" y="4" width="7" height="7" rx="1" fill="#1D1D1F"/>
            <rect x="20" y="1" width="13" height="13" rx="2" stroke="#1D1D1F" strokeWidth="1.5" fill="none"/>
            <rect x="23" y="4" width="7" height="7" rx="1" fill="#1D1D1F"/>
            <rect x="1" y="20" width="13" height="13" rx="2" stroke="#1D1D1F" strokeWidth="1.5" fill="none"/>
            <rect x="4" y="23" width="7" height="7" rx="1" fill="#1D1D1F"/>
            <rect x="20" y="20" width="4" height="4" rx="0.5" fill="#1D1D1F"/>
            <rect x="26" y="20" width="7" height="4" rx="0.5" fill="#1D1D1F"/>
            <rect x="20" y="26" width="13" height="7" rx="0.5" fill="#1D1D1F"/>
          </svg>
        </div>
      </div>
    </div>
  );
}

function PhoneMock({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      width: 200, background: "#1D1D1F", borderRadius: 36,
      padding: "14px 8px", boxShadow: "0 32px 80px rgba(0,0,0,0.35)",
      position: "relative", ...style
    }}>
      <div style={{ background: "#000", borderRadius: 28, overflow: "hidden", position: "relative" }}>
        <div style={{ height: 10, background: "#1D1D1F", display: "flex", justifyContent: "center", alignItems: "center" }}>
          <div style={{ width: 48, height: 4, background: "#2C2C2E", borderRadius: 2 }} />
        </div>
        {children}
      </div>
    </div>
  );
}

export default function LandingPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [scrolled, setScrolled] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  useReveal();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    let frame = 0, raf: number;
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize();
    window.addEventListener("resize", resize);
    const isMobile = window.innerWidth < 768;
    let last = 0;
    const draw = (ts: number) => {
      raf = requestAnimationFrame(draw);
      if (isMobile && ts - last < 33) return;
      last = ts;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const cx = canvas.width * 0.75, cy = canvas.height * 0.45, t = frame / 200;
      const arcs = isMobile ? 4 : 6;
      for (let i = 0; i < arcs; i++) {
        const r = 50 + i * 75 + Math.sin(t + i * 0.7) * 10;
        const a = (0.04 - i * 0.006) * (0.5 + 0.5 * Math.sin(t * 0.3 + i));
        ctx.beginPath(); ctx.arc(cx, cy, r, -Math.PI * 0.6, Math.PI * 0.6);
        ctx.strokeStyle = `rgba(68,114,245,${a})`; ctx.lineWidth = 1.5; ctx.lineCap = "round"; ctx.stroke();
      }
      frame++;
    };
    raf = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); };
  }, []);

  const faqs = [
    {
      q: "Faut-il télécharger une application ?",
      a: "Non — ni vous ni vos clients. Vos clients accèdent à leur carte via un lien web après le premier scan. La carte s'ajoute ensuite en un clic dans Apple Wallet ou Google Wallet, directement depuis le navigateur."
    },
    {
      q: "Comment mes clients obtiennent-ils leur premier tampon ?",
      a: "Au moment du paiement, ils approchent leur téléphone du tag NFC (ou scannent le QR code de votre carte comptoir). C'est instantané — leur carte est créée automatiquement et le premier tampon est ajouté sans aucune action supplémentaire."
    },
    {
      q: "Qu'est-ce que la carte comptoir ?",
      a: "C'est un fichier d'impression haute résolution (4K) que Wallio génère pour vous. Vous l'imprimez et le posez sur votre comptoir. Il contient un QR code unique à votre établissement — les clients le scannent pour accéder à leur carte de fidélité. Idéal si vous n'avez pas encore de tag NFC."
    },
    {
      q: "Mes clients ont-ils besoin d'un compte Apple ou Google ?",
      a: "Pour ajouter la carte à Apple Wallet, un iPhone avec iOS 6+ suffit. Pour Google Wallet, un Android avec l'app Google Wallet. Aucun compte Wallio n'est nécessaire — la carte de fidélité fonctionne nativement dans le téléphone."
    },
    {
      q: "Comment personnaliser ma carte de fidélité ?",
      a: "Depuis votre dashboard, vous choisissez les couleurs (fond, texte, tampons), uploadez votre logo, définissez le nombre de tampons et la récompense. Chaque modification se reflète immédiatement dans la prévisualisation Apple Wallet et Google Wallet. La carte de vos clients se met à jour automatiquement."
    },
    {
      q: "Quelle est la différence entre le mode cyclique et progressif ?",
      a: "En mode cyclique, une fois l'objectif atteint (ex. 10 tampons → 1 café offert), le compteur repart à zéro. En mode progressif, vous définissez plusieurs paliers de récompenses — par exemple 5 tampons = remise 10%, 10 tampons = article offert, 20 tampons = statut VIP. Chaque palier est validé une fois."
    },
    {
      q: "Les notifications sont-elles automatiques ?",
      a: "Oui pour les mises à jour de carte (Apple Wallet envoie une notification à chaque nouveau tampon). Pour les notifications marketing (relances, anniversaires), vous les configurez dans le dashboard : Wallio envoie automatiquement un message au bon moment à vos clients concernés."
    },
    {
      q: "Comment fonctionne l'anti-doublon ?",
      a: "Wallio détecte si un client a déjà reçu un tampon récemment et bloque les cumuls abusifs. Vous configurez le délai minimum entre deux tampons valides (15 min, 1h, 4h, 8h, 1 jour…) depuis vos réglages."
    },
    {
      q: "Puis-je modifier les tampons d'un client manuellement ?",
      a: "Oui. Depuis la fiche client dans votre dashboard, vous pouvez ajuster le nombre de tampons directement. Utile pour corriger une erreur ou récompenser un client exceptionnel."
    },
    {
      q: "Est-ce que Wallio fonctionne sans internet côté client ?",
      a: "Le scan NFC et QR nécessitent une connexion pour enregistrer le tampon. En revanche, la carte Apple Wallet / Google Wallet reste visible hors connexion une fois ajoutée au téléphone."
    },
  ];

  return (
    <>
      <style>{`
        @keyframes fadeUp  { from { opacity:0; transform:translateY(28px); } to { opacity:1; transform:translateY(0); } }
        @keyframes float   { 0%,100% { transform:translateY(0); } 50% { transform:translateY(-10px); } }
        @keyframes shimmer { 0% { background-position:0% 50%; } 50% { background-position:100% 50%; } 100% { background-position:0% 50%; } }
        @keyframes nfcPulse { 0%,100% { opacity:0.15; transform:scale(1); } 50% { opacity:0.5; transform:scale(1.08); } }

        * { box-sizing:border-box; margin:0; padding:0; }

        .hero-badge { animation: fadeUp 0.9s cubic-bezier(.16,1,.3,1) 0.00s both; }
        .hero-title { animation: fadeUp 0.9s cubic-bezier(.16,1,.3,1) 0.10s both; }
        .hero-sub   { animation: fadeUp 0.9s cubic-bezier(.16,1,.3,1) 0.25s both; }
        .hero-cta   { animation: fadeUp 0.9s cubic-bezier(.16,1,.3,1) 0.40s both; }
        .hero-card  { animation: fadeUp 0.9s cubic-bezier(.16,1,.3,1) 0.55s both; }
        .hero-float { animation: float 5s ease-in-out infinite; }

        [data-reveal],[data-reveal="left"],[data-reveal="right"],[data-reveal="scale"],[data-reveal="fade"] {
          will-change:transform,opacity; backface-visibility:hidden; -webkit-backface-visibility:hidden;
        }
        [data-reveal]         { opacity:0; transform:translate3d(0,24px,0);   transition:opacity 0.48s cubic-bezier(.22,1,.36,1), transform 0.48s cubic-bezier(.22,1,.36,1); }
        [data-reveal="left"]  { opacity:0; transform:translate3d(-28px,0,0);  transition:opacity 0.48s cubic-bezier(.22,1,.36,1), transform 0.48s cubic-bezier(.22,1,.36,1); }
        [data-reveal="right"] { opacity:0; transform:translate3d(28px,0,0);   transition:opacity 0.48s cubic-bezier(.22,1,.36,1), transform 0.48s cubic-bezier(.22,1,.36,1); }
        [data-reveal="scale"] { opacity:0; transform:translate3d(0,16px,0) scale3d(0.94,0.94,1); transition:opacity 0.52s cubic-bezier(.22,1,.36,1), transform 0.52s cubic-bezier(.22,1,.36,1); }
        [data-reveal="fade"]  { opacity:0; transition:opacity 0.55s ease; }
        .revealed { opacity:1 !important; transform:translate3d(0,0,0) scale3d(1,1,1) !important; }

        .grad-text { background:linear-gradient(92deg,#4472F5,#6A5AF9,#8A5CF6); -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-size:200% 200%; animation:shimmer 4s ease infinite; }
        .glass { background:rgba(255,255,255,0.60); backdrop-filter:blur(28px); -webkit-backdrop-filter:blur(28px); border:0.5px solid rgba(255,255,255,0.85); }
        .btn-primary { background:#1D1D1F; color:white; padding:14px 32px; border-radius:14px; font-size:15px; font-weight:600; text-decoration:none; letter-spacing:-0.2px; transition:transform 0.15s, box-shadow 0.15s; display:inline-block; }
        .btn-primary:hover { transform:translateY(-2px); box-shadow:0 12px 32px rgba(0,0,0,0.25); }
        .btn-ghost  { background:rgba(0,0,0,0.05); color:#1D1D1F; padding:14px 32px; border-radius:14px; font-size:15px; font-weight:500; text-decoration:none; transition:background 0.15s; display:inline-block; }
        .btn-ghost:hover { background:rgba(0,0,0,0.09); }
        .card-hover { transition:transform 0.25s cubic-bezier(.16,1,.3,1), box-shadow 0.25s; }
        .card-hover:hover { transform:translateY(-4px); box-shadow:0 24px 48px rgba(0,0,0,0.10) !important; }
        .feature-tag { display:inline-block; font-size:11px; font-weight:700; letter-spacing:0.10em; text-transform:uppercase; color:#4472F5; background:rgba(68,114,245,0.08); padding:5px 12px; border-radius:20px; margin-bottom:20px; }
        .lp-nav { padding:0 48px; }
        .float-card { padding:28px 36px; display:inline-flex; align-items:center; gap:24px; }
        .float-card-sep { width:1px; height:48px; background:rgba(0,0,0,0.08); }
        .cta-section { padding:88px 48px; }
        .lp-footer { padding:36px 48px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:16px; }

        .nfc-ring-1 { animation: nfcPulse 2s ease-in-out infinite 0.0s; }
        .nfc-ring-2 { animation: nfcPulse 2s ease-in-out infinite 0.3s; }
        .nfc-ring-3 { animation: nfcPulse 2s ease-in-out infinite 0.6s; }

        .faq-item { border-bottom:0.5px solid rgba(0,0,0,0.08); }
        .faq-btn { width:100%; background:none; border:none; cursor:pointer; display:flex; align-items:center; justify-content:space-between; padding:20px 0; text-align:left; gap:16px; }
        .faq-btn:hover .faq-q { color:#4472F5; }

        @media (max-width: 900px) {
          .scan-grid   { grid-template-columns:1fr !important; }
          .custom-grid { flex-direction:column !important; }
          .custom-cards { justify-content:center !important; flex-wrap:wrap !important; }
          .notif-grid  { grid-template-columns:1fr !important; }
        }
        @media (max-width: 768px) {
          .lp-nav { padding:0 24px; }
          .hero-float { display:none; }
          .features-grid { grid-template-columns:repeat(2,1fr) !important; }
          .sectors-grid  { grid-template-columns:repeat(2,1fr) !important; }
          .steps-grid    { grid-template-columns:1fr !important; }
          .cta-section   { padding:56px 28px; border-radius:24px !important; }
          .lp-footer     { padding:28px 24px; flex-direction:column; text-align:center; gap:20px; }
          .lp-footer > div { justify-content:center; }
          section { padding-left:20px !important; padding-right:20px !important; }
        }
        @media (max-width: 480px) {
          .lp-nav { padding:0 16px; }
          .lp-nav .nav-contact { display:none; }
          .btn-primary, .btn-ghost { padding:12px 22px; font-size:14px; border-radius:12px; }
          .feature-tag { font-size:10px; }
          .features-grid { grid-template-columns:1fr !important; }
          .sectors-grid  { grid-template-columns:1fr !important; }
          .cta-section   { padding:44px 20px; border-radius:20px !important; margin:0 12px !important; }
          .cta-section h2 { font-size:28px !important; }
          .hero-cta { flex-direction:column; align-items:center; }
          .hero-cta a { width:100%; text-align:center; }
          section { padding-top:64px !important; padding-bottom:64px !important; }
        }
      `}</style>

      <div style={{ fontFamily:"-apple-system,'SF Pro Display','Helvetica Neue',sans-serif", background:"#F2F2F7", minHeight:"100vh", overflowX:"hidden", WebkitFontSmoothing:"antialiased" }}>

        <canvas ref={canvasRef} style={{ position:"fixed", inset:0, pointerEvents:"none", zIndex:0 }} />
        <div style={{ position:"fixed", inset:0, pointerEvents:"none", zIndex:0, background:"radial-gradient(ellipse 80% 60% at 70% 40%, rgba(100,130,255,0.07) 0%, transparent 60%), radial-gradient(ellipse 50% 50% at 20% 80%, rgba(140,100,255,0.05) 0%, transparent 50%)" }} />

        {/* ── Bouton WhatsApp flottant ── */}
        <a href={WA} target="_blank" rel="noopener noreferrer"
          style={{
            position:"fixed", bottom:24, right:24, zIndex:50,
            width:56, height:56, borderRadius:"50%",
            background:"#25D366", boxShadow:"0 8px 24px rgba(37,211,102,0.45)",
            display:"flex", alignItems:"center", justifyContent:"center",
            transition:"transform 0.2s, box-shadow 0.2s",
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = "scale(1.08)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 12px 32px rgba(37,211,102,0.55)"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = ""; (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 24px rgba(37,211,102,0.45)"; }}
          aria-label="Nous contacter sur WhatsApp"
        >
          <svg width="28" height="28" viewBox="0 0 32 32" fill="white">
            <path d="M16 2.9C9.0 2.9 3.4 8.5 3.4 15.4c0 2.3.6 4.5 1.8 6.4L3 29l7.4-1.9c1.8 1.0 3.8 1.5 5.6 1.5 6.9 0 12.5-5.6 12.5-12.5S22.9 2.9 16 2.9zm0 22.9c-2.0 0-3.9-.5-5.5-1.5l-.4-.2-4.4 1.1 1.2-4.2-.3-.4c-1.1-1.7-1.7-3.7-1.7-5.7 0-5.9 4.8-10.8 10.8-10.8 2.9 0 5.6 1.1 7.6 3.2 2.0 2.0 3.2 4.7 3.2 7.6 0 5.9-4.8 10.9-10.5 10.9zm5.8-8.1c-.3-.2-1.8-.9-2.1-1-.3-.1-.5-.2-.7.2-.2.3-.8 1-.9 1.2-.2.2-.3.2-.6.1-.3-.2-1.2-.5-2.4-1.5-.9-.8-1.5-1.7-1.6-2.0-.2-.3 0-.5.1-.6.1-.1.3-.3.4-.5.1-.2.2-.3.3-.5.1-.2 0-.4 0-.5-.1-.2-.7-1.7-1.0-2.4-.3-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1.1 1.0-1.1 2.5s1.1 2.9 1.3 3.1c.2.2 2.2 3.4 5.4 4.7.8.3 1.4.5 1.8.6.8.2 1.5.2 2.0.1.6-.1 1.8-.7 2.1-1.4.3-.7.3-1.2.2-1.4-.1-.2-.3-.3-.6-.4z"/>
          </svg>
        </a>

        {/* ── Nav ── */}
        <nav className="lp-nav" style={{ position:"fixed", top:0, left:0, right:0, zIndex:20, height:58, display:"flex", alignItems:"center", justifyContent:"space-between", background: scrolled ? "rgba(242,242,247,0.85)" : "transparent", backdropFilter: scrolled ? "blur(24px)" : "none", borderBottom: scrolled ? "0.5px solid rgba(0,0,0,0.09)" : "none", transition:"all 0.3s" }}>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <Image src="/icon.svg" alt="Wallio" width={24} height={24} />
            <span style={{ fontSize:14, fontWeight:700, letterSpacing:"0.16em", color:"#1D1D1F" }}>WALLIO</span>
          </div>
          <div style={{ display:"flex", gap:8, alignItems:"center" }}>
            <Link href="/auth/connexion" style={{ fontSize:14, fontWeight:400, color:"#6E6E73", textDecoration:"none", padding:"6px 16px" }}>Connexion</Link>
            <a href={WA} target="_blank" rel="noopener noreferrer" className="btn-primary nav-contact" style={{ padding:"7px 18px", fontSize:13, borderRadius:20 }}>
              Nous contacter
            </a>
          </div>
        </nav>

        <div style={{ position:"relative", zIndex:1 }}>

          {/* ── HERO ── */}
          <section style={{ minHeight:"100vh", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", textAlign:"center", padding:"140px 32px 80px" }}>
            <div className="hero-badge" style={{ marginBottom:28 }}>
              <span style={{ fontSize:11, fontWeight:700, letterSpacing:"0.12em", textTransform:"uppercase", color:"#4472F5", background:"rgba(68,114,245,0.08)", padding:"6px 16px", borderRadius:20 }}>
                NFC · QR Code · Apple Wallet · Google Wallet
              </span>
            </div>
            <h1 className="hero-title" style={{ fontSize:"clamp(52px,6vw,88px)", fontWeight:700, lineHeight:1.02, letterSpacing:-3, color:"#1D1D1F", maxWidth:820, marginBottom:28 }}>
              La fidélité client,<br />
              <span className="grad-text">sans friction.</span>
            </h1>
            <p className="hero-sub" style={{ fontSize:20, fontWeight:400, lineHeight:1.6, color:"#6E6E73", maxWidth:520, marginBottom:44 }}>
              Un tap NFC ou un scan QR suffit. Vos clients accumulent des tampons, vous gardez leur fidélité — sans application à installer.
            </p>
            <div className="hero-cta" style={{ display:"flex", gap:12, justifyContent:"center", flexWrap:"wrap" }}>
              <a href={WA} target="_blank" rel="noopener noreferrer" className="btn-primary">Démarrer maintenant</a>
              <Link href="/auth/connexion" className="btn-ghost">Se connecter</Link>
            </div>

            <div className="hero-card hero-float" style={{ marginTop:72 }}>
              <div className="glass float-card" style={{ borderRadius:28, boxShadow:"0 24px 64px rgba(0,0,0,0.09)" }}>
                <div style={{ textAlign:"left" }}>
                  <p style={{ fontSize:11, fontWeight:600, letterSpacing:"0.08em", textTransform:"uppercase", color:"#8E8E93", marginBottom:4 }}>Tampons</p>
                  <p style={{ fontSize:36, fontWeight:700, letterSpacing:-1.5, color:"#1D1D1F", lineHeight:1 }}>7<span style={{ fontSize:22, fontWeight:400, color:"#C7C7CC" }}>/10</span></p>
                </div>
                <div className="float-card-sep" />
                <div style={{ textAlign:"left" }}>
                  <p style={{ fontSize:11, fontWeight:600, letterSpacing:"0.08em", textTransform:"uppercase", color:"#8E8E93", marginBottom:4 }}>Récompense</p>
                  <p style={{ fontSize:16, fontWeight:600, color:"#1D1D1F" }}>Café offert</p>
                </div>
                <div className="float-card-sep" />
                <div style={{ textAlign:"left" }}>
                  <p style={{ fontSize:11, fontWeight:600, letterSpacing:"0.08em", textTransform:"uppercase", color:"#8E8E93", marginBottom:4 }}>Notification</p>
                  <p style={{ fontSize:13, fontWeight:500, color:"#34C759" }}>✓ Envoyée</p>
                </div>
              </div>
            </div>
          </section>

          {/* ── SCAN METHODS ── */}
          <section style={{ padding:"96px 32px", background:"rgba(255,255,255,0.55)", backdropFilter:"blur(40px)", WebkitBackdropFilter:"blur(40px)", borderTop:"0.5px solid rgba(0,0,0,0.07)", borderBottom:"0.5px solid rgba(0,0,0,0.07)" }}>
            <div style={{ maxWidth:1040, margin:"0 auto" }}>
              <div data-reveal="scale" style={{ textAlign:"center", marginBottom:64 }}>
                <span className="feature-tag">Modes d&apos;accès</span>
                <h2 style={{ fontSize:"clamp(32px,4vw,42px)", fontWeight:700, letterSpacing:-1, color:"#1D1D1F", marginBottom:14 }}>3 façons d&apos;accéder<br />à la carte de fidélité</h2>
                <p style={{ fontSize:17, color:"#8E8E93", maxWidth:480, margin:"0 auto" }}>Choisissez selon votre setup — ou combinez les trois.</p>
              </div>

              <div data-stagger className="scan-grid" style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:20 }}>

                {/* NFC */}
                <div className="card-hover" style={{ background:"white", borderRadius:24, padding:"32px 28px", border:"0.5px solid rgba(0,0,0,0.07)", boxShadow:"0 4px 20px rgba(0,0,0,0.05)", display:"flex", flexDirection:"column", gap:24 }}>
                  <div style={{ position:"relative", height:140, display:"flex", alignItems:"center", justifyContent:"center" }}>
                    {/* NFC rings */}
                    {[56,38,22].map((r, i) => (
                      <div key={i} className={`nfc-ring-${i+1}`} style={{
                        position:"absolute", width:r*2, height:r*2, borderRadius:"50%",
                        border:"1.5px solid #4472F5", opacity:0.3,
                      }} />
                    ))}
                    {/* Phone avec logo Wallio */}
                    <div style={{ width:52, height:88, background:"#1D1D1F", borderRadius:12, position:"relative", zIndex:2, display:"flex", alignItems:"center", justifyContent:"center", boxShadow:"0 8px 24px rgba(0,0,0,0.3)" }}>
                      <div style={{ width:36, height:60, background:"#0A0A0A", borderRadius:6, display:"flex", alignItems:"center", justifyContent:"center" }}>
                        <Image src="/icon.svg" alt="Wallio" width={24} height={24} />
                      </div>
                    </div>
                    {/* Tag NFC */}
                    <div style={{ position:"absolute", bottom:4, width:44, height:30, background:"#F2F2F7", borderRadius:8, border:"1px solid #E5E5EA", display:"flex", alignItems:"center", justifyContent:"center", zIndex:2, boxShadow:"0 2px 8px rgba(0,0,0,0.08)" }}>
                      <Image src="/nfc-icon.svg" alt="NFC" width={22} height={22} />
                    </div>
                  </div>
                  <div>
                    <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10 }}>
                      <div style={{ width:32, height:32, borderRadius:10, background:"rgba(68,114,245,0.10)", display:"flex", alignItems:"center", justifyContent:"center" }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4472F5" strokeWidth="2" strokeLinecap="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                      </div>
                      <span style={{ fontSize:11, fontWeight:700, letterSpacing:"0.08em", textTransform:"uppercase", color:"#4472F5" }}>NFC</span>
                    </div>
                    <h3 style={{ fontSize:20, fontWeight:650, letterSpacing:-0.4, color:"#1D1D1F", marginBottom:10 }}>Tag NFC</h3>
                    <p style={{ fontSize:14, lineHeight:1.65, color:"#6E6E73", marginBottom:16 }}>Le client approche son téléphone à moins de 4 cm du sticker NFC posé sur votre comptoir. Le tampon est ajouté en moins d&apos;une seconde, sans ouvrir aucune application.</p>
                    <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                      {["Sans friction — le geste le plus rapide", "Compatible iPhone 7+ et Android NFC", "Sticker discret, résistant, repositionnable"].map(t => (
                        <div key={t} style={{ display:"flex", alignItems:"flex-start", gap:8 }}>
                          <div style={{ width:5, height:5, borderRadius:"50%", background:"#4472F5", marginTop:7, flexShrink:0 }} />
                          <span style={{ fontSize:13, color:"#6E6E73" }}>{t}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* QR Code */}
                <div className="card-hover" style={{ background:"white", borderRadius:24, padding:"32px 28px", border:"0.5px solid rgba(0,0,0,0.07)", boxShadow:"0 4px 20px rgba(0,0,0,0.05)", display:"flex", flexDirection:"column", gap:24 }}>
                  <div style={{ height:140, display:"flex", alignItems:"center", justifyContent:"center" }}>
                    <div style={{ position:"relative" }}>
                      {/* Phone camera */}
                      <div style={{ width:80, height:100, background:"#1D1D1F", borderRadius:16, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:8, boxShadow:"0 8px 24px rgba(0,0,0,0.3)" }}>
                        <div style={{ width:12, height:12, borderRadius:"50%", background:"#2C2C2E", border:"2px solid #3A3A3C" }} />
                        <div style={{ width:56, height:56, borderRadius:8, border:"2px solid #4472F5", display:"flex", alignItems:"center", justifyContent:"center", position:"relative" }}>
                          <div style={{ position:"absolute", top:3, left:3, width:10, height:10, border:"2px solid #4472F5", borderBottom:"none", borderRight:"none" }} />
                          <div style={{ position:"absolute", top:3, right:3, width:10, height:10, border:"2px solid #4472F5", borderBottom:"none", borderLeft:"none" }} />
                          <div style={{ position:"absolute", bottom:3, left:3, width:10, height:10, border:"2px solid #4472F5", borderTop:"none", borderRight:"none" }} />
                          <div style={{ position:"absolute", bottom:3, right:3, width:10, height:10, border:"2px solid #4472F5", borderTop:"none", borderLeft:"none" }} />
                          <svg width="28" height="28" viewBox="0 0 34 34" fill="none">
                            <rect x="1" y="1" width="13" height="13" rx="2" stroke="rgba(68,114,245,0.6)" strokeWidth="1.2" fill="none"/>
                            <rect x="3.5" y="3.5" width="8" height="8" rx="1" fill="rgba(68,114,245,0.4)"/>
                            <rect x="20" y="1" width="13" height="13" rx="2" stroke="rgba(68,114,245,0.6)" strokeWidth="1.2" fill="none"/>
                            <rect x="22.5" y="3.5" width="8" height="8" rx="1" fill="rgba(68,114,245,0.4)"/>
                            <rect x="1" y="20" width="13" height="13" rx="2" stroke="rgba(68,114,245,0.6)" strokeWidth="1.2" fill="none"/>
                            <rect x="3.5" y="22.5" width="8" height="8" rx="1" fill="rgba(68,114,245,0.4)"/>
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div>
                    <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10 }}>
                      <div style={{ width:32, height:32, borderRadius:10, background:"rgba(106,90,249,0.10)", display:"flex", alignItems:"center", justifyContent:"center" }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6A5AF9" strokeWidth="2" strokeLinecap="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><path d="M14 14h7v7h-7z" opacity=".5"/></svg>
                      </div>
                      <span style={{ fontSize:11, fontWeight:700, letterSpacing:"0.08em", textTransform:"uppercase", color:"#6A5AF9" }}>QR Code</span>
                    </div>
                    <h3 style={{ fontSize:20, fontWeight:650, letterSpacing:-0.4, color:"#1D1D1F", marginBottom:10 }}>Scan QR Code</h3>
                    <p style={{ fontSize:14, lineHeight:1.65, color:"#6E6E73", marginBottom:16 }}>Le client ouvre l&apos;appareil photo de son téléphone et scanne le QR code affiché sur votre comptoir ou votre carte de caisse. Fonctionne avec tous les téléphones.</p>
                    <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                      {["Universel — tous les téléphones sans exception", "Fonctionne via l'appareil photo natif iOS/Android", "Idéal en complément ou sans tag NFC"].map(t => (
                        <div key={t} style={{ display:"flex", alignItems:"flex-start", gap:8 }}>
                          <div style={{ width:5, height:5, borderRadius:"50%", background:"#6A5AF9", marginTop:7, flexShrink:0 }} />
                          <span style={{ fontSize:13, color:"#6E6E73" }}>{t}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Carte comptoir */}
                <div className="card-hover" style={{ background:"white", borderRadius:24, padding:"32px 28px", border:"0.5px solid rgba(0,0,0,0.07)", boxShadow:"0 4px 20px rgba(0,0,0,0.05)", display:"flex", flexDirection:"column", gap:24 }}>
                  <div style={{ height:140, display:"flex", alignItems:"flex-end", justifyContent:"center", paddingBottom:8 }}>
                    {/* Counter surface */}
                    <div style={{ position:"relative" }}>
                      <div style={{ width:160, height:16, background:"#E5E5EA", borderRadius:"4px 4px 0 0", position:"absolute", bottom:-8, left:"50%", transform:"translateX(-50%)" }} />
                      {/* Display card */}
                      <div style={{ width:120, height:80, background:"linear-gradient(135deg,#1D1D1F,#3A3A3C)", borderRadius:10, boxShadow:"0 8px 24px rgba(0,0,0,0.3)", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:6, padding:10, position:"relative", zIndex:1 }}>
                        <div style={{ fontSize:8, fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase", color:"rgba(255,255,255,0.5)" }}>CARTE FIDÉLITÉ</div>
                        <div style={{ width:44, height:44, display:"flex", alignItems:"center", justifyContent:"center" }}>
                          <svg width="40" height="40" viewBox="0 0 34 34" fill="none">
                            <rect x="1" y="1" width="13" height="13" rx="2" stroke="rgba(255,255,255,0.7)" strokeWidth="1.2" fill="none"/>
                            <rect x="3.5" y="3.5" width="8" height="8" rx="1" fill="rgba(255,255,255,0.5)"/>
                            <rect x="20" y="1" width="13" height="13" rx="2" stroke="rgba(255,255,255,0.7)" strokeWidth="1.2" fill="none"/>
                            <rect x="22.5" y="3.5" width="8" height="8" rx="1" fill="rgba(255,255,255,0.5)"/>
                            <rect x="1" y="20" width="13" height="13" rx="2" stroke="rgba(255,255,255,0.7)" strokeWidth="1.2" fill="none"/>
                            <rect x="3.5" y="22.5" width="8" height="8" rx="1" fill="rgba(255,255,255,0.5)"/>
                            <rect x="20" y="20" width="4" height="4" rx="0.5" fill="rgba(255,255,255,0.5)"/>
                            <rect x="26" y="20" width="7" height="4" rx="0.5" fill="rgba(255,255,255,0.5)"/>
                            <rect x="20" y="26" width="13" height="7" rx="0.5" fill="rgba(255,255,255,0.5)"/>
                          </svg>
                        </div>
                        <div style={{ fontSize:7, color:"rgba(255,255,255,0.4)" }}>Scannez pour accéder</div>
                      </div>
                    </div>
                  </div>
                  <div>
                    <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10 }}>
                      <div style={{ width:32, height:32, borderRadius:10, background:"rgba(138,92,246,0.10)", display:"flex", alignItems:"center", justifyContent:"center" }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8A5CF6" strokeWidth="2" strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>
                      </div>
                      <span style={{ fontSize:11, fontWeight:700, letterSpacing:"0.08em", textTransform:"uppercase", color:"#8A5CF6" }}>Carte Comptoir</span>
                    </div>
                    <h3 style={{ fontSize:20, fontWeight:650, letterSpacing:-0.4, color:"#1D1D1F", marginBottom:10 }}>Support imprimé 4K</h3>
                    <p style={{ fontSize:14, lineHeight:1.65, color:"#6E6E73", marginBottom:16 }}>Wallio génère automatiquement un visuel haute résolution à votre image, avec votre logo et votre QR code unique. Vous l&apos;imprimez et le posez sur votre comptoir.</p>
                    <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                      {["Fichier 4K prêt à envoyer à l'imprimeur", "Design à vos couleurs et avec votre logo", "Peut inclure un tag NFC intégré"].map(t => (
                        <div key={t} style={{ display:"flex", alignItems:"flex-start", gap:8 }}>
                          <div style={{ width:5, height:5, borderRadius:"50%", background:"#8A5CF6", marginTop:7, flexShrink:0 }} />
                          <span style={{ fontSize:13, color:"#6E6E73" }}>{t}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </section>

          {/* ── HOW IT WORKS ── */}
          <section style={{ maxWidth:1040, margin:"0 auto", padding:"96px 32px" }}>
            <div data-reveal="scale" style={{ textAlign:"center", marginBottom:56 }}>
              <span className="feature-tag">Comment ça marche</span>
              <h2 style={{ fontSize:40, fontWeight:700, letterSpacing:-1, color:"#1D1D1F" }}>Trois secondes. Pas une de plus.</h2>
            </div>
            <div data-stagger className="steps-grid" style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:16 }}>
              {[
                { n:"01", title:"Tap ou Scan", body:"Le client approche son téléphone du tag NFC ou scanne le QR code. Aucune application à télécharger, aucun compte à créer au préalable.", icon:<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4472F5" strokeWidth="1.8" strokeLinecap="round"><path d="M12 2a5 5 0 1 0 0 10A5 5 0 0 0 12 2z"/><path d="M2 20c0-4 4-7 10-7s10 3 10 7"/></svg> },
                { n:"02", title:"Tampon instantané", body:"Un tampon est crédité automatiquement sur la carte du client en moins d'une seconde. Sa progression est visible immédiatement sur son téléphone.", icon:<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6A5AF9" strokeWidth="1.8" strokeLinecap="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg> },
                { n:"03", title:"Récompense débloquée", body:"Objectif atteint — la récompense se débloque automatiquement et vous le validez en un clic depuis votre tableau de bord.", icon:<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8A5CF6" strokeWidth="1.8" strokeLinecap="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg> },
              ].map((s) => (
                <div key={s.n} className="glass card-hover" style={{ borderRadius:24, padding:"36px 30px", boxShadow:"0 4px 24px rgba(0,0,0,0.06)" }}>
                  <div style={{ width:44, height:44, borderRadius:14, background:"rgba(68,114,245,0.08)", display:"flex", alignItems:"center", justifyContent:"center", marginBottom:20 }}>
                    {s.icon}
                  </div>
                  <p style={{ fontSize:11, fontWeight:700, letterSpacing:"0.12em", textTransform:"uppercase", color:"#4472F5", marginBottom:12 }}>{s.n}</p>
                  <h3 style={{ fontSize:22, fontWeight:650, letterSpacing:-0.4, color:"#1D1D1F", marginBottom:12 }}>{s.title}</h3>
                  <p style={{ fontSize:14, lineHeight:1.65, color:"#6E6E73" }}>{s.body}</p>
                </div>
              ))}
            </div>
          </section>

          {/* ── PERSONNALISATION ── */}
          <section style={{ padding:"96px 32px", background:"rgba(255,255,255,0.55)", backdropFilter:"blur(40px)", WebkitBackdropFilter:"blur(40px)", borderTop:"0.5px solid rgba(0,0,0,0.07)", borderBottom:"0.5px solid rgba(0,0,0,0.07)", overflow:"hidden" }}>
            <div style={{ maxWidth:1120, margin:"0 auto" }}>
              <div data-reveal="scale" style={{ textAlign:"center", marginBottom:64 }}>
                <span className="feature-tag">Personnalisation</span>
                <h2 style={{ fontSize:"clamp(32px,4vw,42px)", fontWeight:700, letterSpacing:-1, color:"#1D1D1F", marginBottom:14 }}>Votre carte, à votre image</h2>
                <p style={{ fontSize:17, color:"#8E8E93", maxWidth:520, margin:"0 auto" }}>Chaque élément est configurable depuis votre dashboard — en temps réel.</p>
              </div>

              {/* Cards showcase */}
              <div data-reveal style={{ display:"flex", gap:24, justifyContent:"center", alignItems:"flex-start", marginBottom:64, flexWrap:"wrap" }} className="custom-cards">
                <div style={{ transform:"translateY(20px)", display:"flex", flexDirection:"column", alignItems:"center", gap:12 }}>
                  <WalletCardMock
                    bg="#1A1209" fg="#FFFFFF" labelClr="rgba(255,255,255,0.45)"
                    name="Nomade Café" logoInitial="NC"
                    stamps={7} total={20} reward="1 café gratuit"
                    stampColor="#E8C97A" stripBg="rgba(232,201,122,0.08)"
                    aux1="Lun–Sam" aux2="8h–18h"
                  />
                  <div className="glass" style={{ borderRadius:12, padding:"8px 16px", fontSize:12, color:"#6E6E73" }}>☕ Café — tons chauds</div>
                </div>
                <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:12 }}>
                  <WalletCardMock
                    bg="#0A1628" fg="#FFFFFF" labelClr="rgba(255,255,255,0.45)"
                    name="Barber Club" logoInitial="BC"
                    stamps={4} total={8} reward="Coupe offerte"
                    stampColor="#4472F5" stripBg="rgba(68,114,245,0.10)"
                    aux1="7j/7" aux2="9h–20h"
                  />
                  <div className="glass" style={{ borderRadius:12, padding:"8px 16px", fontSize:12, color:"#6E6E73" }}>✂️ Barber — tons sombres</div>
                </div>
                <div style={{ transform:"translateY(20px)", display:"flex", flexDirection:"column", alignItems:"center", gap:12 }}>
                  <WalletCardMock
                    bg="#1E0A2E" fg="#FFFFFF" labelClr="rgba(255,255,255,0.45)"
                    name="Beauty Studio" logoInitial="BS"
                    stamps={5} total={10} reward="-50% soin"
                    stampColor="#C084FC" stripBg="rgba(192,132,252,0.10)"
                    aux1="Sur RDV" aux2="10h–19h"
                  />
                  <div className="glass" style={{ borderRadius:12, padding:"8px 16px", fontSize:12, color:"#6E6E73" }}>💅 Beauté — tons violets</div>
                </div>
              </div>

              {/* Customization options */}
              <div data-stagger style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(260px,1fr))", gap:16 }}>
                {[
                  { icon:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="13.5" cy="6.5" r="2.5"/><path d="M17 4.5a9 9 0 1 1-12.73 12.73"/><path d="M2 2l20 20"/></svg>, title:"Couleurs & Logo", body:"Couleur de fond, texte, tampons — et votre logo affiché en tête de carte.", color:"#4472F5" },
                  { icon:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M12 22C6.5 22 2 17.5 2 12S6.5 2 12 2s10 4.5 10 10"/><path d="M12 6v6l4 2"/><path d="M20 14l-5 5 5 5"/></svg>, title:"Nombre de tampons", body:"Choisissez entre 5 et 50 tampons par cycle, avec une ou plusieurs récompenses.", color:"#6A5AF9" },
                  { icon:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>, title:"Style des tampons", body:"Choisissez parmi 8 styles : point, anneau, check, cœur, étoile, texte ou votre logo.", color:"#8A5CF6" },
                  { icon:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M3 15h18"/><path d="M9 9v12"/></svg>, title:"Bannière personnalisée", body:"Uploadez une image de votre établissement comme bannière sur la carte — avec les tampons dessinés dessus.", color:"#4472F5" },
                  { icon:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M20 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>, title:"Champs informatifs", body:"Ajoutez vos horaires, votre numéro, vos liens — directement visibles sur la carte.", color:"#6A5AF9" },
                  { icon:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M12 20V10"/><path d="M18 20V4"/><path d="M6 20v-4"/></svg>, title:"Mode progressif", body:"Définissez des paliers de récompenses — remise 5 tampons, cadeau 10, statut VIP 20.", color:"#8A5CF6" },
                ].map(f => (
                  <div key={f.title} style={{ background:"white", borderRadius:20, padding:"24px 22px", border:"0.5px solid rgba(0,0,0,0.07)", display:"flex", gap:16 }}>
                    <div style={{ width:38, height:38, borderRadius:12, background:`${f.color}12`, color:f.color, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                      {f.icon}
                    </div>
                    <div>
                      <h3 style={{ fontSize:15, fontWeight:650, color:"#1D1D1F", marginBottom:6, letterSpacing:-0.2 }}>{f.title}</h3>
                      <p style={{ fontSize:13, lineHeight:1.6, color:"#8E8E93" }}>{f.body}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ── NOTIFICATIONS ── */}
          <section style={{ padding:"96px 32px" }}>
            <div style={{ maxWidth:1040, margin:"0 auto" }}>
              <div data-reveal="scale" style={{ textAlign:"center", marginBottom:64 }}>
                <span className="feature-tag">Notifications</span>
                <h2 style={{ fontSize:"clamp(32px,4vw,42px)", fontWeight:700, letterSpacing:-1, color:"#1D1D1F", marginBottom:14 }}>Restez présent<br />au bon moment</h2>
                <p style={{ fontSize:17, color:"#8E8E93", maxWidth:480, margin:"0 auto" }}>Deux canaux de notification, trois déclencheurs automatiques.</p>
              </div>

              <div className="notif-grid" style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:32, alignItems:"center" }}>

                {/* Phone mockup */}
                <div data-reveal="left" style={{ display:"flex", justifyContent:"center" }}>
                  <div style={{ position:"relative" }}>
                    <PhoneMock>
                      {/* Lock screen */}
                      <div style={{ background:"linear-gradient(160deg,#1A2744,#0D1829)", minHeight:340, padding:"20px 0 16px" }}>
                        {/* Time */}
                        <div style={{ textAlign:"center", marginBottom:24 }}>
                          <div style={{ fontSize:48, fontWeight:300, color:"white", letterSpacing:-2 }}>12:47</div>
                          <div style={{ fontSize:13, color:"rgba(255,255,255,0.6)" }}>Dimanche 7 septembre</div>
                        </div>

                        {/* Wallet notification */}
                        <div style={{ margin:"0 8px 10px", background:"rgba(255,255,255,0.14)", backdropFilter:"blur(20px)", borderRadius:14, padding:"10px 12px", border:"0.5px solid rgba(255,255,255,0.18)" }}>
                          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6 }}>
                            <div style={{ width:28, height:28, borderRadius:7, background:"#1A1209", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#E8C97A" strokeWidth="2"><rect x="2" y="5" width="20" height="14" rx="3"/><path d="M2 10h20"/></svg>
                            </div>
                            <div style={{ flex:1 }}>
                              <div style={{ fontSize:11, fontWeight:600, color:"white" }}>Wallet</div>
                            </div>
                            <div style={{ fontSize:10, color:"rgba(255,255,255,0.4)" }}>maintenant</div>
                          </div>
                          <div style={{ fontSize:12, fontWeight:600, color:"white", marginBottom:2 }}>Nomade Café — Nouveau tampon !</div>
                          <div style={{ fontSize:11, color:"rgba(255,255,255,0.65)" }}>Vous avez maintenant 8/20 tampons. Plus que 12 pour votre café offert.</div>
                        </div>

                        {/* FCM notification */}
                        <div style={{ margin:"0 8px", background:"rgba(255,255,255,0.14)", backdropFilter:"blur(20px)", borderRadius:14, padding:"10px 12px", border:"0.5px solid rgba(255,255,255,0.18)" }}>
                          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6 }}>
                            <div style={{ width:28, height:28, borderRadius:7, overflow:"hidden", flexShrink:0 }}>
                              <div style={{ width:"100%", height:"100%", background:"#1A1209", display:"flex", alignItems:"center", justifyContent:"center" }}>
                                <span style={{ fontSize:12 }}>☕</span>
                              </div>
                            </div>
                            <div style={{ flex:1 }}>
                              <div style={{ fontSize:11, fontWeight:600, color:"white" }}>Nomade Café</div>
                            </div>
                            <div style={{ fontSize:10, color:"rgba(255,255,255,0.4)" }}>il y a 2h</div>
                          </div>
                          <div style={{ fontSize:12, fontWeight:600, color:"white", marginBottom:2 }}>🎂 Bonne anniversaire !</div>
                          <div style={{ fontSize:11, color:"rgba(255,255,255,0.65)" }}>On vous offre un double tampon aujourd&apos;hui. À bientôt !</div>
                        </div>
                      </div>
                    </PhoneMock>
                  </div>
                </div>

                {/* Notification types */}
                <div data-reveal="right" style={{ display:"flex", flexDirection:"column", gap:20 }}>
                  {[
                    {
                      color:"#4472F5", icon:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><rect x="2" y="5" width="20" height="14" rx="3"/><path d="M2 10h20"/></svg>,
                      title:"Mise à jour Apple Wallet",
                      desc:"À chaque nouveau tampon, la carte se met à jour automatiquement dans le Wallet du client avec une notification. Sans aucune action de votre part.",
                      tags:["Automatique", "Temps réel"],
                    },
                    {
                      color:"#6A5AF9", icon:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>,
                      title:"Push ciblé (FCM)",
                      desc:"Envoyez un message à tous vos clients, ou ciblez uniquement les actifs (passés récemment) ou les inactifs (perdus depuis +30 jours) depuis votre dashboard.",
                      tags:["Tous", "Actifs", "Inactifs"],
                    },
                    {
                      color:"#8A5CF6", icon:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
                      title:"Automatisations",
                      desc:"Wallio envoie automatiquement un message le jour de l'anniversaire de votre client, ou une relance personnalisée si un client n'est pas revenu depuis X jours.",
                      tags:["Anniversaire", "Relance auto"],
                    },
                  ].map(n => (
                    <div key={n.title} style={{ background:"white", borderRadius:20, padding:"22px 22px", border:"0.5px solid rgba(0,0,0,0.07)", boxShadow:"0 4px 16px rgba(0,0,0,0.04)" }}>
                      <div style={{ display:"flex", gap:14 }}>
                        <div style={{ width:40, height:40, borderRadius:12, background:`${n.color}12`, color:n.color, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                          {n.icon}
                        </div>
                        <div style={{ flex:1 }}>
                          <h3 style={{ fontSize:15, fontWeight:650, color:"#1D1D1F", marginBottom:6 }}>{n.title}</h3>
                          <p style={{ fontSize:13, lineHeight:1.6, color:"#8E8E93", marginBottom:10 }}>{n.desc}</p>
                          <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                            {n.tags.map(tag => (
                              <span key={tag} style={{ fontSize:11, fontWeight:600, color:n.color, background:`${n.color}10`, padding:"3px 10px", borderRadius:20 }}>{tag}</span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* ── FEATURES ── */}
          <section style={{ padding:"96px 32px", background:"rgba(255,255,255,0.55)", backdropFilter:"blur(40px)", WebkitBackdropFilter:"blur(40px)", borderTop:"0.5px solid rgba(0,0,0,0.07)", borderBottom:"0.5px solid rgba(0,0,0,0.07)" }}>
            <div style={{ maxWidth:1040, margin:"0 auto" }}>
              <div data-reveal="scale" style={{ textAlign:"center", marginBottom:64 }}>
                <span className="feature-tag">Fonctionnalités</span>
                <h2 style={{ fontSize:"clamp(32px,4vw,42px)", fontWeight:700, letterSpacing:-1, color:"#1D1D1F" }}>Tout ce dont vous avez besoin</h2>
              </div>
              <div data-stagger className="features-grid" style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:16 }}>
                {[
                  { icon:<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M12 2a5 5 0 1 0 0 10A5 5 0 0 0 12 2z"/><path d="M2 20c0-4 4-7 10-7s10 3 10 7"/></svg>, title:"NFC + QR Code", body:"Compatible avec tous les smartphones. Aucune application à installer, aucun compte requis.", accent:"#4472F5" },
                  { icon:<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><rect x="2" y="5" width="20" height="14" rx="3"/><path d="M2 10h20"/><circle cx="7" cy="15" r="1" fill="currentColor"/></svg>, title:"Apple & Google Wallet", body:"La carte de fidélité s'intègre nativement dans le portefeuille numérique — iOS et Android.", accent:"#6A5AF9" },
                  { icon:<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>, title:"Notifications ciblées", body:"Relancez vos clients inactifs, fêtez leurs anniversaires, envoyez des offres au bon moment.", accent:"#8A5CF6" },
                  { icon:<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><path d="M14 14h7v7h-7z" opacity=".4"/></svg>, title:"Dashboard temps réel", body:"Visualisez vos clients, tampons et récompenses depuis un tableau de bord clair et complet.", accent:"#4472F5" },
                  { icon:<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>, title:"Carte 100% personnalisable", body:"Couleurs, logo, bannière, tampons, champs — entièrement à l'image de votre marque.", accent:"#6A5AF9" },
                  { icon:<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>, title:"Carte comptoir 4K", body:"Fichier haute résolution généré automatiquement, prêt à envoyer à l'imprimeur en 1 clic.", accent:"#8A5CF6" },
                ].map(f => (
                  <div key={f.title} className="card-hover" style={{ background:"white", borderRadius:22, padding:"28px 26px", border:"0.5px solid rgba(0,0,0,0.07)", boxShadow:"0 4px 20px rgba(0,0,0,0.05)" }}>
                    <div style={{ width:44, height:44, borderRadius:14, background:`${f.accent}12`, color:f.accent, display:"flex", alignItems:"center", justifyContent:"center", marginBottom:18 }}>
                      {f.icon}
                    </div>
                    <h3 style={{ fontSize:16, fontWeight:650, color:"#1D1D1F", marginBottom:8, letterSpacing:-0.2 }}>{f.title}</h3>
                    <p style={{ fontSize:14, lineHeight:1.65, color:"#8E8E93" }}>{f.body}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ── SECTEURS ── */}
          <section style={{ padding:"96px 32px", overflow:"hidden", position:"relative" }}>
            <div style={{ position:"absolute", inset:0, background:"radial-gradient(ellipse 70% 80% at 50% 50%, rgba(68,114,245,0.05) 0%, transparent 70%)", pointerEvents:"none" }} />
            <div style={{ maxWidth:1040, margin:"0 auto", position:"relative" }}>
              <div data-reveal="scale" style={{ textAlign:"center", marginBottom:56 }}>
                <span className="feature-tag">Secteurs</span>
                <h2 style={{ fontSize:"clamp(32px,4vw,42px)", fontWeight:700, letterSpacing:-1, color:"#1D1D1F", marginBottom:14 }}>Pour tous les commerces<br />de proximité</h2>
                <p style={{ fontSize:17, color:"#8E8E93", maxWidth:480, margin:"0 auto" }}>Une seule solution, adaptée à chaque type d&apos;établissement.</p>
              </div>
              <div data-stagger className="sectors-grid" style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))", gap:12 }}>
                {[
                  { label:"Café & Salon de thé", icon:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/></svg> },
                  { label:"Restaurant", icon:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3v7"/></svg> },
                  { label:"Barber Shop", icon:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="6" cy="6" r="3"/><circle cx="18" cy="6" r="3"/><path d="M20 17v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><line x1="12" y1="12" x2="12" y2="21"/></svg> },
                  { label:"Salon de beauté", icon:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg> },
                  { label:"Boutique & Mode", icon:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg> },
                  { label:"Salle de sport", icon:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M6.5 6.5h11M6.5 17.5h11M3 10h18M3 14h18"/></svg> },
                  { label:"Boulangerie", icon:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M17 5a5 5 0 0 1 0 10H7A5 5 0 0 1 7 5h10z"/><path d="M12 5v10"/></svg> },
                  { label:"Institut & Spa", icon:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg> },
                ].map(s => (
                  <div key={s.label} className="glass card-hover" style={{ borderRadius:18, padding:"20px 18px", display:"flex", alignItems:"center", gap:14, boxShadow:"0 4px 16px rgba(0,0,0,0.05)" }}>
                    <div style={{ width:36, height:36, borderRadius:10, background:"rgba(68,114,245,0.10)", color:"#4472F5", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>{s.icon}</div>
                    <span style={{ fontSize:14, fontWeight:500, color:"#1D1D1F" }}>{s.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ── FAQ ── */}
          <section style={{ padding:"96px 32px", background:"rgba(255,255,255,0.55)", backdropFilter:"blur(40px)", WebkitBackdropFilter:"blur(40px)", borderTop:"0.5px solid rgba(0,0,0,0.07)" }}>
            <div style={{ maxWidth:760, margin:"0 auto" }}>
              <div data-reveal="scale" style={{ textAlign:"center", marginBottom:56 }}>
                <span className="feature-tag">FAQ</span>
                <h2 style={{ fontSize:"clamp(32px,4vw,42px)", fontWeight:700, letterSpacing:-1, color:"#1D1D1F" }}>Questions fréquentes</h2>
              </div>

              <div data-stagger>
                {faqs.map((faq, i) => (
                  <div key={i} className="faq-item">
                    <button className="faq-btn" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                      <span className="faq-q" style={{ fontSize:16, fontWeight:600, color:"#1D1D1F", letterSpacing:-0.2, transition:"color 0.15s" }}>
                        {faq.q}
                      </span>
                      <div style={{
                        width:28, height:28, borderRadius:"50%",
                        display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0,
                        transition:"transform 0.25s, background 0.15s",
                        transform: openFaq === i ? "rotate(45deg)" : "none",
                        background: openFaq === i ? "rgba(68,114,245,0.12)" : "rgba(0,0,0,0.06)",
                      }}>
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                          <path d="M6 2v8M2 6h8" stroke={openFaq === i ? "#4472F5" : "#6E6E73"} strokeWidth="1.8" strokeLinecap="round"/>
                        </svg>
                      </div>
                    </button>
                    <div style={{
                      overflow:"hidden", maxHeight: openFaq === i ? 300 : 0,
                      transition:"max-height 0.35s cubic-bezier(.22,1,.36,1)",
                    }}>
                      <p style={{ fontSize:15, lineHeight:1.7, color:"#6E6E73", paddingBottom:20 }}>
                        {faq.a}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div data-reveal style={{ textAlign:"center", marginTop:48 }}>
                <p style={{ fontSize:15, color:"#8E8E93", marginBottom:16 }}>Une autre question ?</p>
                <a href={WA} target="_blank" rel="noopener noreferrer" className="btn-ghost">
                  Discutons sur WhatsApp
                </a>
              </div>
            </div>
          </section>

          {/* ── CTA ── */}
          <section style={{ padding:"0 32px 96px" }}>
            <div data-reveal="scale" className="cta-section" style={{ maxWidth:1040, margin:"0 auto", borderRadius:32, overflow:"hidden", position:"relative", background:"linear-gradient(135deg,#4472F5 0%,#6A5AF9 52%,#8A5CF6 100%)", textAlign:"center" }}>
              <div style={{ position:"absolute", top:-80, right:-80, width:320, height:320, borderRadius:"50%", background:"rgba(255,255,255,0.07)", pointerEvents:"none" }} />
              <div style={{ position:"absolute", bottom:-100, left:-60, width:260, height:260, borderRadius:"50%", background:"rgba(255,255,255,0.05)", pointerEvents:"none" }} />
              <h2 style={{ fontSize:44, fontWeight:700, color:"white", marginBottom:16, letterSpacing:-1.2, position:"relative" }}>Prêt à fidéliser vos clients ?</h2>
              <p style={{ fontSize:18, color:"rgba(255,255,255,0.70)", marginBottom:44, position:"relative", maxWidth:440, margin:"0 auto 44px" }}>Commencez en quelques minutes. Sans installation, sans friction.</p>
              <a href={WA} target="_blank" rel="noopener noreferrer"
                style={{ fontSize:15, fontWeight:700, color:"#4472F5", background:"white", padding:"16px 40px", borderRadius:16, textDecoration:"none", display:"inline-block", boxShadow:"0 12px 36px rgba(0,0,0,0.22)", position:"relative", letterSpacing:-0.2, transition:"transform 0.15s, box-shadow 0.15s" }}
                onMouseEnter={e => { (e.target as HTMLElement).style.transform = "translateY(-2px)"; (e.target as HTMLElement).style.boxShadow = "0 18px 48px rgba(0,0,0,0.28)"; }}
                onMouseLeave={e => { (e.target as HTMLElement).style.transform = ""; (e.target as HTMLElement).style.boxShadow = "0 12px 36px rgba(0,0,0,0.22)"; }}>
                Démarrer sur WhatsApp
              </a>
            </div>
          </section>

          {/* ── FOOTER ── */}
          <footer style={{ borderTop:"0.5px solid rgba(0,0,0,0.08)" }}>
            <div className="lp-footer" style={{ maxWidth:1040, margin:"0 auto" }}>
              <span style={{ fontSize:12, fontWeight:700, letterSpacing:"0.16em", color:"#1D1D1F" }}>WALLIO</span>
              <div style={{ display:"flex", gap:24, flexWrap:"wrap", justifyContent:"center" }}>
                {[
                  { href:"/privacy", label:"Confidentialité" },
                  { href:"/terms",   label:"CGU" },
                  { href:"/legal",   label:"Mentions légales" },
                  { href:"mailto:wallio.card@gmail.com", label:"wallio.card@gmail.com" },
                ].map(l => (
                  <Link key={l.href} href={l.href} style={{ fontSize:13, color:"#8E8E93", textDecoration:"none" }}>{l.label}</Link>
                ))}
              </div>
              <span style={{ fontSize:12, color:"#C7C7CC" }}>© 2026 Wallio</span>
            </div>
          </footer>

        </div>
      </div>
    </>
  );
}
