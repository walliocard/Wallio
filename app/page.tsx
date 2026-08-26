"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

const WA = "https://wa.me/40749056483?text=Bonjour%2C%20je%20souhaite%20d%C3%A9couvrir%20Wallio%20pour%20mon%20commerce.";

function useReveal() {
  useEffect(() => {
    const els = document.querySelectorAll("[data-reveal]");
    const io = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) { (e.target as HTMLElement).style.opacity = "1"; (e.target as HTMLElement).style.transform = "translateY(0)"; } }),
      { threshold: 0.12 }
    );
    els.forEach(el => io.observe(el));
    return () => io.disconnect();
  }, []);
}

export default function LandingPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [scrolled, setScrolled] = useState(false);
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
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const cx = canvas.width * 0.75, cy = canvas.height * 0.45, t = frame / 200;
      for (let i = 0; i < 6; i++) {
        const r = 50 + i * 75 + Math.sin(t + i * 0.7) * 10;
        const a = (0.045 - i * 0.006) * (0.5 + 0.5 * Math.sin(t * 0.3 + i));
        ctx.beginPath(); ctx.arc(cx, cy, r, -Math.PI * 0.6, Math.PI * 0.6);
        ctx.strokeStyle = `rgba(68,114,245,${a})`; ctx.lineWidth = 1.5; ctx.lineCap = "round"; ctx.stroke();
      }
      // Ambient glow
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, 320);
      g.addColorStop(0, "rgba(100,130,255,0.04)"); g.addColorStop(1, "transparent");
      ctx.fillStyle = g; ctx.fillRect(0, 0, canvas.width, canvas.height);
      frame++; raf = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); };
  }, []);

  return (
    <>
      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(28px); } to { opacity:1; transform:translateY(0); } }
        @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
        @keyframes float { 0%,100% { transform:translateY(0); } 50% { transform:translateY(-10px); } }
        @keyframes shimmer { 0% { background-position:0% 50%; } 50% { background-position:100% 50%; } 100% { background-position:0% 50%; } }
        .hero-title { animation: fadeUp 0.9s cubic-bezier(.16,1,.3,1) 0.1s both; }
        .hero-sub   { animation: fadeUp 0.9s cubic-bezier(.16,1,.3,1) 0.25s both; }
        .hero-cta   { animation: fadeUp 0.9s cubic-bezier(.16,1,.3,1) 0.40s both; }
        .hero-badge { animation: fadeUp 0.9s cubic-bezier(.16,1,.3,1) 0.0s both; }
        .hero-float { animation: float 5s ease-in-out infinite; }
        [data-reveal] { opacity:0; transform:translateY(32px); transition: opacity 0.7s cubic-bezier(.16,1,.3,1), transform 0.7s cubic-bezier(.16,1,.3,1); }
        .grad-text { background: linear-gradient(92deg,#4472F5,#6A5AF9,#8A5CF6); -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-size:200% 200%; animation: shimmer 4s ease infinite; }
        .glass { background:rgba(255,255,255,0.60); backdrop-filter:blur(28px); -webkit-backdrop-filter:blur(28px); border:0.5px solid rgba(255,255,255,0.85); }
        .glass-dark { background:rgba(29,29,31,0.75); backdrop-filter:blur(28px); -webkit-backdrop-filter:blur(28px); border:0.5px solid rgba(255,255,255,0.10); }
        .btn-primary { background:#1D1D1F; color:white; padding:14px 32px; border-radius:14px; font-size:15px; font-weight:600; text-decoration:none; letter-spacing:-0.2px; transition:transform 0.15s, box-shadow 0.15s; display:inline-block; }
        .btn-primary:hover { transform:translateY(-2px); box-shadow:0 12px 32px rgba(0,0,0,0.25); }
        .btn-ghost { background:rgba(0,0,0,0.05); color:#1D1D1F; padding:14px 32px; border-radius:14px; font-size:15px; font-weight:500; text-decoration:none; transition:background 0.15s; display:inline-block; }
        .btn-ghost:hover { background:rgba(0,0,0,0.09); }
        .card-hover { transition:transform 0.25s cubic-bezier(.16,1,.3,1), box-shadow 0.25s; }
        .card-hover:hover { transform:translateY(-4px); box-shadow:0 24px 48px rgba(0,0,0,0.10) !important; }
        .feature-tag { display:inline-block; font-size:11px; font-weight:700; letter-spacing:0.10em; text-transform:uppercase; color:#4472F5; background:rgba(68,114,245,0.08); padding:5px 12px; border-radius:20px; margin-bottom:20px; }
        * { box-sizing:border-box; margin:0; padding:0; }
      `}</style>

      <div style={{ fontFamily:"-apple-system,'SF Pro Display','Helvetica Neue',sans-serif", background:"#F2F2F7", minHeight:"100vh", overflowX:"hidden", WebkitFontSmoothing:"antialiased" }}>

        <canvas ref={canvasRef} style={{ position:"fixed", inset:0, pointerEvents:"none", zIndex:0 }} />

        {/* Mesh gradient */}
        <div style={{ position:"fixed", inset:0, pointerEvents:"none", zIndex:0, background:"radial-gradient(ellipse 80% 60% at 70% 40%, rgba(100,130,255,0.07) 0%, transparent 60%), radial-gradient(ellipse 50% 50% at 20% 80%, rgba(140,100,255,0.05) 0%, transparent 50%)" }} />

        {/* Nav */}
        <nav style={{ position:"fixed", top:0, left:0, right:0, zIndex:20, height:58, display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 48px", background: scrolled ? "rgba(242,242,247,0.85)" : "transparent", backdropFilter: scrolled ? "blur(24px)" : "none", borderBottom: scrolled ? "0.5px solid rgba(0,0,0,0.09)" : "none", transition:"all 0.3s" }}>
          <span style={{ fontSize:14, fontWeight:700, letterSpacing:"0.16em", color:"#1D1D1F" }}>WALLIO</span>
          <div style={{ display:"flex", gap:8, alignItems:"center" }}>
            <Link href="/auth/connexion" style={{ fontSize:14, fontWeight:400, color:"#6E6E73", textDecoration:"none", padding:"6px 16px" }}>Connexion</Link>
            <a href={WA} target="_blank" rel="noopener noreferrer" className="btn-primary" style={{ padding:"7px 18px", fontSize:13, borderRadius:20 }}>
              Nous contacter
            </a>
          </div>
        </nav>

        <div style={{ position:"relative", zIndex:1 }}>

          {/* ── HERO ── */}
          <section style={{ minHeight:"100vh", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", textAlign:"center", padding:"140px 32px 80px" }}>
            <div className="hero-badge" style={{ marginBottom:28 }}>
              <span style={{ fontSize:11, fontWeight:700, letterSpacing:"0.12em", textTransform:"uppercase", color:"#4472F5", background:"rgba(68,114,245,0.08)", padding:"6px 16px", borderRadius:20 }}>
                NFC · Apple Wallet · Google Wallet
              </span>
            </div>

            <h1 className="hero-title" style={{ fontSize:"clamp(52px,6vw,88px)", fontWeight:700, lineHeight:1.02, letterSpacing:-3, color:"#1D1D1F", maxWidth:800, marginBottom:28 }}>
              Votre fidélité.<br />
              <span className="grad-text">Simplifiée.</span>
            </h1>

            <p className="hero-sub" style={{ fontSize:20, fontWeight:400, lineHeight:1.6, color:"#6E6E73", maxWidth:480, marginBottom:44 }}>
              Offrez à vos clients une carte de fidélité numérique. Un tap NFC ou un scan QR suffit.
            </p>

            <div className="hero-cta" style={{ display:"flex", gap:12, justifyContent:"center", flexWrap:"wrap" }}>
              <a href={WA} target="_blank" rel="noopener noreferrer" className="btn-primary">
                Démarrer maintenant
              </a>
              <Link href="/auth/connexion" className="btn-ghost">Se connecter</Link>
            </div>

            {/* Floating glass card */}
            <div className="hero-float" style={{ marginTop:72 }}>
              <div className="glass" style={{ borderRadius:28, padding:"28px 36px", boxShadow:"0 24px 64px rgba(0,0,0,0.09)", display:"inline-flex", alignItems:"center", gap:24 }}>
                <div style={{ textAlign:"left" }}>
                  <p style={{ fontSize:11, fontWeight:600, letterSpacing:"0.08em", textTransform:"uppercase", color:"#8E8E93", marginBottom:4 }}>Tampons</p>
                  <p style={{ fontSize:36, fontWeight:700, letterSpacing:-1.5, color:"#1D1D1F", lineHeight:1 }}>7<span style={{ fontSize:22, fontWeight:400, color:"#C7C7CC" }}>/10</span></p>
                </div>
                <div style={{ width:1, height:48, background:"rgba(0,0,0,0.08)" }} />
                <div style={{ textAlign:"left" }}>
                  <p style={{ fontSize:11, fontWeight:600, letterSpacing:"0.08em", textTransform:"uppercase", color:"#8E8E93", marginBottom:4 }}>Récompense</p>
                  <p style={{ fontSize:16, fontWeight:600, color:"#1D1D1F" }}>Café offert</p>
                </div>
                <div style={{ width:1, height:48, background:"rgba(0,0,0,0.08)" }} />
                <div style={{ width:44, height:44, borderRadius:12, background:"#1D1D1F", display:"flex", alignItems:"center", justifyContent:"center" }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round"><rect x="2" y="5" width="20" height="14" rx="3"/><path d="M2 10h20"/></svg>
                </div>
              </div>
            </div>
          </section>

          {/* ── STEPS ── */}
          <section style={{ maxWidth:1040, margin:"0 auto", padding:"40px 32px 96px" }}>
            <div data-reveal style={{ textAlign:"center", marginBottom:56 }}>
              <span className="feature-tag">Comment ça marche</span>
              <h2 style={{ fontSize:40, fontWeight:700, letterSpacing:-1, color:"#1D1D1F" }}>Trois secondes. Pas une de plus.</h2>
            </div>

            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))", gap:16 }}>
              {[
                { n:"01", title:"Tap ou Scan", body:"Le client approche son téléphone du tag NFC ou scanne le QR code. Aucune application à télécharger, aucun compte à créer au préalable." },
                { n:"02", title:"Tampon instantané", body:"Un tampon est ajouté automatiquement sur sa carte de fidélité en moins d'une seconde. La progression est visible immédiatement." },
                { n:"03", title:"Récompense débloquée", body:"Objectif atteint — la récompense se débloque. Le marchand valide en un seul clic depuis son tableau de bord." },
              ].map((s, i) => (
                <div key={s.n} data-reveal className="glass card-hover" style={{ borderRadius:24, padding:"36px 30px", boxShadow:"0 4px 24px rgba(0,0,0,0.06)", transitionDelay:`${i * 0.08}s` }}>
                  <p style={{ fontSize:11, fontWeight:700, letterSpacing:"0.12em", textTransform:"uppercase", color:"#4472F5", marginBottom:20 }}>{s.n}</p>
                  <h3 style={{ fontSize:22, fontWeight:650, letterSpacing:-0.4, color:"#1D1D1F", marginBottom:12 }}>{s.title}</h3>
                  <p style={{ fontSize:14, lineHeight:1.65, color:"#6E6E73" }}>{s.body}</p>
                </div>
              ))}
            </div>
          </section>

          {/* ── FEATURES ── */}
          <section style={{ padding:"80px 32px", background:"rgba(255,255,255,0.50)", backdropFilter:"blur(40px)", WebkitBackdropFilter:"blur(40px)", borderTop:"0.5px solid rgba(0,0,0,0.07)", borderBottom:"0.5px solid rgba(0,0,0,0.07)" }}>
            <div style={{ maxWidth:1040, margin:"0 auto" }}>
              <div data-reveal style={{ textAlign:"center", marginBottom:56 }}>
                <span className="feature-tag">Fonctionnalités</span>
                <h2 style={{ fontSize:40, fontWeight:700, letterSpacing:-1, color:"#1D1D1F" }}>Tout ce dont vous avez besoin</h2>
              </div>

              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))", gap:12 }}>
                {[
                  { title:"NFC + QR Code",         body:"Compatible avec tous les smartphones. Aucune app à installer." },
                  { title:"Apple & Google Wallet",  body:"La carte s'intègre nativement dans le portefeuille du client." },
                  { title:"Notifications push",     body:"Relancez vos clients avec des messages personnalisés et ciblés." },
                  { title:"Dashboard temps réel",   body:"Clients, tampons, récompenses — suivis en direct." },
                  { title:"Carte personnalisable",  body:"Couleurs, logo, tampons — entièrement à votre image de marque." },
                  { title:"Carte comptoir 4K",      body:"Fichier haute résolution prêt à envoyer à l'imprimeur." },
                ].map((f, i) => (
                  <div key={f.title} data-reveal className="card-hover" style={{ background:"rgba(245,245,247,0.80)", backdropFilter:"blur(10px)", borderRadius:20, padding:"26px 22px", border:"0.5px solid rgba(0,0,0,0.06)", boxShadow:"0 2px 12px rgba(0,0,0,0.03)", transitionDelay:`${i * 0.06}s` }}>
                    <h3 style={{ fontSize:15, fontWeight:600, color:"#1D1D1F", marginBottom:8, letterSpacing:-0.1 }}>{f.title}</h3>
                    <p style={{ fontSize:13, lineHeight:1.6, color:"#8E8E93" }}>{f.body}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ── POUR QUI ── */}
          <section style={{ maxWidth:760, margin:"0 auto", padding:"80px 32px", textAlign:"center" }}>
            <div data-reveal>
              <span className="feature-tag">Secteurs</span>
              <h2 style={{ fontSize:40, fontWeight:700, letterSpacing:-1, color:"#1D1D1F", marginBottom:14 }}>Pour tous les commerces</h2>
              <p style={{ fontSize:17, color:"#8E8E93", marginBottom:36 }}>Cafés · Restaurants · Barbers · Salons · Boutiques · Salles de sport · Instituts</p>
              <div style={{ display:"flex", gap:8, justifyContent:"center", flexWrap:"wrap" }}>
                {["Café", "Restaurant", "Barber", "Salon", "Boutique", "Sport", "Institut"].map(c => (
                  <span key={c} className="glass card-hover" style={{ fontSize:13, fontWeight:500, color:"#3A3A3C", padding:"8px 18px", borderRadius:20, boxShadow:"0 2px 8px rgba(0,0,0,0.04)", cursor:"default" }}>{c}</span>
                ))}
              </div>
            </div>
          </section>

          {/* ── CTA ── */}
          <section style={{ padding:"0 32px 96px" }}>
            <div data-reveal style={{ maxWidth:1040, margin:"0 auto", borderRadius:32, overflow:"hidden", position:"relative", background:"linear-gradient(135deg,#4472F5 0%,#6A5AF9 52%,#8A5CF6 100%)", padding:"88px 48px", textAlign:"center" }}>
              <div style={{ position:"absolute", top:-80, right:-80, width:320, height:320, borderRadius:"50%", background:"rgba(255,255,255,0.07)", pointerEvents:"none" }} />
              <div style={{ position:"absolute", bottom:-100, left:-60, width:260, height:260, borderRadius:"50%", background:"rgba(255,255,255,0.05)", pointerEvents:"none" }} />
              <div style={{ position:"absolute", top:"30%", left:"15%", width:180, height:180, borderRadius:"50%", background:"rgba(255,255,255,0.04)", pointerEvents:"none" }} />
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
          <footer style={{ borderTop:"0.5px solid rgba(0,0,0,0.08)", padding:"36px 48px" }}>
            <div style={{ maxWidth:1040, margin:"0 auto", display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:16 }}>
              <span style={{ fontSize:12, fontWeight:700, letterSpacing:"0.16em", color:"#1D1D1F" }}>WALLIO</span>
              <div style={{ display:"flex", gap:24, flexWrap:"wrap", justifyContent:"center" }}>
                {[
                  { href:"/privacy", label:"Confidentialité" },
                  { href:"/terms",   label:"CGU" },
                  { href:"/legal",   label:"Mentions légales" },
                  { href:"mailto:contact@wallio.app", label:"contact@wallio.app" },
                ].map(l => (
                  <Link key={l.href} href={l.href} style={{ fontSize:13, color:"#8E8E93", textDecoration:"none", transition:"color 0.15s" }}>{l.label}</Link>
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
