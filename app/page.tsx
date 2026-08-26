"use client";
import Link from "next/link";
import { useEffect, useRef } from "react";

const WA = "https://wa.me/40749056483?text=Bonjour%2C%20je%20souhaite%20d%C3%A9couvrir%20Wallio%20pour%20mon%20commerce.";

export default function LandingPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    let frame = 0;
    let raf: number;

    function resize() {
      canvas!.width  = window.innerWidth;
      canvas!.height = window.innerHeight;
    }
    resize();
    window.addEventListener("resize", resize);

    function draw() {
      ctx.clearRect(0, 0, canvas!.width, canvas!.height);
      const cx = canvas!.width * 0.82, cy = canvas!.height * 0.38;
      const t  = frame / 180;
      for (let i = 0; i < 5; i++) {
        const r = 60 + i * 80 + Math.sin(t + i * 0.8) * 6;
        const a = (0.04 - i * 0.006) * (0.7 + 0.3 * Math.sin(t * 0.4 + i));
        ctx.beginPath();
        ctx.arc(cx, cy, r, -Math.PI * 0.55, Math.PI * 0.55);
        ctx.strokeStyle = `rgba(68,114,245,${a})`;
        ctx.lineWidth   = 1.5;
        ctx.lineCap     = "round";
        ctx.stroke();
      }
      frame++;
      raf = requestAnimationFrame(draw);
    }
    draw();
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); };
  }, []);

  return (
    <div style={{ fontFamily: "-apple-system,'SF Pro Display','Helvetica Neue',sans-serif", background: "#F5F5F7", minHeight: "100vh", overflowX: "hidden", WebkitFontSmoothing: "antialiased" }}>

      <canvas ref={canvasRef} style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }} />

      {/* Nav */}
      <nav style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 10, height: 56, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 40px", background: "rgba(245,245,247,0.80)", backdropFilter: "blur(24px)", borderBottom: "0.5px solid rgba(0,0,0,0.10)" }}>
        <span style={{ fontSize: 15, fontWeight: 600, letterSpacing: "0.14em", color: "#1D1D1F" }}>WALLIO</span>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <Link href="/auth/connexion" style={{ fontSize: 14, fontWeight: 400, color: "#6E6E73", textDecoration: "none", padding: "6px 14px" }}>
            Connexion
          </Link>
          <a href={WA} target="_blank" rel="noopener noreferrer" style={{ fontSize: 14, fontWeight: 600, color: "white", background: "#1D1D1F", padding: "7px 18px", borderRadius: 20, textDecoration: "none" }}>
            Nous contacter
          </a>
        </div>
      </nav>

      <div style={{ position: "relative", zIndex: 1 }}>

        {/* Hero */}
        <section style={{ maxWidth: 780, margin: "0 auto", padding: "148px 32px 96px", textAlign: "center" }}>
          <p style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "#8E8E93", marginBottom: 24 }}>
            Fidélité · NFC · Apple Wallet · Google Wallet
          </p>

          <h1 style={{ fontSize: "clamp(44px,5.5vw,76px)", fontWeight: 700, lineHeight: 1.04, letterSpacing: -2.5, color: "#1D1D1F", marginBottom: 28 }}>
            Votre fidélité.<br />
            <span style={{ background: "linear-gradient(92deg,#4472F5 0%,#6A5AF9 50%,#8A5CF6 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              Simplifiée.
            </span>
          </h1>

          <p style={{ fontSize: 19, fontWeight: 400, lineHeight: 1.55, color: "#6E6E73", maxWidth: 500, margin: "0 auto 44px" }}>
            Offrez à vos clients une carte de fidélité numérique — directement dans Apple Wallet ou Google Wallet. Un tap suffit.
          </p>

          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <a href={WA} target="_blank" rel="noopener noreferrer"
              style={{ fontSize: 15, fontWeight: 600, color: "white", background: "#1D1D1F", padding: "14px 30px", borderRadius: 14, textDecoration: "none", letterSpacing: -0.2 }}>
              Démarrer
            </a>
            <Link href="/auth/connexion"
              style={{ fontSize: 15, fontWeight: 500, color: "#1D1D1F", background: "rgba(0,0,0,0.05)", padding: "14px 30px", borderRadius: 14, textDecoration: "none" }}>
              Se connecter
            </Link>
          </div>
        </section>

        {/* Steps */}
        <section style={{ maxWidth: 960, margin: "0 auto", padding: "0 32px 96px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 16 }}>
            {[
              { n: "01", title: "Tap ou Scan", body: "Le client approche son téléphone du tag NFC ou scanne le QR code posé sur le comptoir. Aucune app à télécharger." },
              { n: "02", title: "Tampon instantané", body: "Un tampon est ajouté automatiquement sur la carte de fidélité du client, en moins d'une seconde." },
              { n: "03", title: "Récompense", body: "Quand l'objectif est atteint, la récompense est débloquée. Le marchand valide en un seul clic." },
            ].map(s => (
              <div key={s.n} style={{ background: "rgba(255,255,255,0.70)", backdropFilter: "blur(24px)", borderRadius: 24, padding: "32px 28px", border: "0.5px solid rgba(0,0,0,0.07)", boxShadow: "0 2px 20px rgba(0,0,0,0.04)" }}>
                <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.10em", color: "#4472F5", marginBottom: 16, textTransform: "uppercase" }}>{s.n}</p>
                <h3 style={{ fontSize: 19, fontWeight: 600, color: "#1D1D1F", marginBottom: 10, letterSpacing: -0.3 }}>{s.title}</h3>
                <p style={{ fontSize: 14, lineHeight: 1.6, color: "#6E6E73" }}>{s.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Features */}
        <section style={{ background: "rgba(255,255,255,0.60)", backdropFilter: "blur(30px)", borderTop: "0.5px solid rgba(0,0,0,0.07)", borderBottom: "0.5px solid rgba(0,0,0,0.07)", padding: "80px 32px" }}>
          <div style={{ maxWidth: 960, margin: "0 auto" }}>
            <p style={{ textAlign: "center", fontSize: 12, fontWeight: 600, letterSpacing: "0.10em", textTransform: "uppercase", color: "#8E8E93", marginBottom: 14 }}>Fonctionnalités</p>
            <h2 style={{ textAlign: "center", fontSize: 36, fontWeight: 700, color: "#1D1D1F", marginBottom: 56, letterSpacing: -0.8 }}>Tout ce dont vous avez besoin</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 14 }}>
              {[
                { title: "NFC + QR Code",          body: "Compatible avec tous les smartphones sans aucune application." },
                { title: "Apple & Google Wallet",   body: "La carte s'intègre nativement dans le portefeuille du client." },
                { title: "Notifications push",      body: "Relancez vos clients avec des messages ciblés et personnalisés." },
                { title: "Dashboard en temps réel", body: "Suivez clients, tampons et récompenses depuis votre tableau de bord." },
                { title: "Carte personnalisée",     body: "Couleurs, logo, nombre de tampons — entièrement à votre image." },
                { title: "Carte comptoir prête",    body: "Téléchargez un fichier 4K prêt à envoyer directement à l'imprimeur." },
              ].map(f => (
                <div key={f.title} style={{ background: "#F5F5F7", borderRadius: 18, padding: "22px 18px", border: "0.5px solid rgba(0,0,0,0.06)" }}>
                  <h3 style={{ fontSize: 14, fontWeight: 600, color: "#1D1D1F", marginBottom: 6, letterSpacing: -0.1 }}>{f.title}</h3>
                  <p style={{ fontSize: 13, lineHeight: 1.55, color: "#6E6E73" }}>{f.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Commerces */}
        <section style={{ maxWidth: 720, margin: "0 auto", padding: "80px 32px", textAlign: "center" }}>
          <h2 style={{ fontSize: 36, fontWeight: 700, color: "#1D1D1F", marginBottom: 14, letterSpacing: -0.8 }}>Pour tous les commerces de proximité</h2>
          <p style={{ fontSize: 17, color: "#8E8E93", marginBottom: 36, fontWeight: 400 }}>
            Cafés · Restaurants · Barbers · Salons · Boutiques · Salles de sport · Instituts
          </p>
          <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
            {["Café", "Restaurant", "Barber", "Salon", "Boutique", "Sport", "Institut"].map(c => (
              <span key={c} style={{ fontSize: 13, fontWeight: 500, color: "#3A3A3C", background: "rgba(255,255,255,0.80)", padding: "7px 16px", borderRadius: 20, border: "0.5px solid rgba(0,0,0,0.10)", backdropFilter: "blur(10px)" }}>{c}</span>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section style={{ margin: "0 32px 80px", borderRadius: 32, background: "linear-gradient(135deg,#4472F5 0%,#6A5AF9 50%,#8A5CF6 100%)", padding: "80px 32px", textAlign: "center", maxWidth: 960, marginLeft: "auto", marginRight: "auto", overflow: "hidden", position: "relative" }}>
          <div style={{ position: "absolute", top: -60, right: -60, width: 300, height: 300, borderRadius: "50%", background: "rgba(255,255,255,0.06)", pointerEvents: "none" }} />
          <div style={{ position: "absolute", bottom: -80, left: -40, width: 250, height: 250, borderRadius: "50%", background: "rgba(255,255,255,0.04)", pointerEvents: "none" }} />
          <h2 style={{ fontSize: 40, fontWeight: 700, color: "white", marginBottom: 14, letterSpacing: -1, position: "relative" }}>Prêt à fidéliser vos clients ?</h2>
          <p style={{ fontSize: 17, color: "rgba(255,255,255,0.72)", marginBottom: 40, position: "relative" }}>Commencez en quelques minutes. Aucune installation requise.</p>
          <a href={WA} target="_blank" rel="noopener noreferrer"
            style={{ fontSize: 15, fontWeight: 600, color: "#4472F5", background: "white", padding: "15px 36px", borderRadius: 14, textDecoration: "none", display: "inline-block", boxShadow: "0 8px 32px rgba(0,0,0,0.18)", position: "relative", letterSpacing: -0.2 }}>
            Démarrer sur WhatsApp
          </a>
        </section>

        {/* Footer */}
        <footer style={{ borderTop: "0.5px solid rgba(0,0,0,0.08)", padding: "40px 40px 32px" }}>
          <div style={{ maxWidth: 960, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
            <span style={{ fontSize: 13, fontWeight: 600, letterSpacing: "0.14em", color: "#1D1D1F" }}>WALLIO</span>
            <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
              {[
                { href: "/privacy", label: "Confidentialité" },
                { href: "/terms", label: "CGU" },
                { href: "/legal", label: "Mentions légales" },
                { href: `mailto:contact@wallio.app`, label: "contact@wallio.app" },
              ].map(l => (
                <Link key={l.href} href={l.href} style={{ fontSize: 13, color: "#8E8E93", textDecoration: "none" }}>{l.label}</Link>
              ))}
            </div>
            <span style={{ fontSize: 12, color: "#C7C7CC" }}>© 2026 Wallio</span>
          </div>
        </footer>

      </div>
    </div>
  );
}
