"use client";
import Link from "next/link";
import { useEffect, useRef } from "react";

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
      const cx = canvas!.width * 0.78, cy = canvas!.height * 0.42;
      const t  = frame / 120;
      for (let i = 0; i < 4; i++) {
        const r = 80 + i * 90 + Math.sin(t + i) * 8;
        const opacity = (0.05 - i * 0.01) * (0.6 + 0.4 * Math.sin(t * 0.5 + i));
        ctx.beginPath();
        ctx.arc(cx, cy, r, -Math.PI * 0.5, Math.PI * 0.5);
        ctx.strokeStyle = `rgba(68,114,245,${opacity})`;
        ctx.lineWidth = 2;
        ctx.lineCap = "round";
        ctx.stroke();
      }
      frame++;
      raf = requestAnimationFrame(draw);
    }
    draw();
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); };
  }, []);

  return (
    <div style={{ fontFamily: "-apple-system,'Helvetica Neue',sans-serif", background: "#FAFAFA", minHeight: "100vh", overflowX: "hidden" }}>

      <canvas ref={canvasRef} style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }} />

      {/* Nav */}
      <nav style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 10, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 32px", height: 60, background: "rgba(250,250,250,0.85)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
        <span style={{ fontSize: 18, fontWeight: 700, color: "#1D1D1F", letterSpacing: 2 }}>WALLIO</span>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <Link href="/auth/connexion" style={{ fontSize: 14, color: "#6E6E73", textDecoration: "none" }}>Connexion</Link>
          <Link href="/auth/inscription" style={{ fontSize: 14, fontWeight: 600, color: "white", background: "#007AFF", padding: "8px 18px", borderRadius: 20, textDecoration: "none" }}>
            Commencer
          </Link>
        </div>
      </nav>

      <div style={{ position: "relative", zIndex: 1 }}>

        {/* Hero */}
        <section style={{ maxWidth: 860, margin: "0 auto", padding: "140px 24px 80px", textAlign: "center" }}>
          <div style={{ display: "inline-block", fontSize: 13, fontWeight: 600, color: "#007AFF", background: "rgba(0,122,255,0.08)", padding: "6px 16px", borderRadius: 20, marginBottom: 28, letterSpacing: "0.03em" }}>
            Fidélité · NFC · Apple & Google Wallet
          </div>
          <h1 style={{ fontSize: "clamp(42px,6vw,72px)", fontWeight: 700, color: "#1D1D1F", letterSpacing: -2, lineHeight: 1.05, marginBottom: 24 }}>
            Votre fidélité.<br />
            <span style={{ background: "linear-gradient(90deg,#4472F5,#6A5AF9,#8A5CF6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              Simplifiée.
            </span>
          </h1>
          <p style={{ fontSize: 20, color: "#6E6E73", lineHeight: 1.6, maxWidth: 540, margin: "0 auto 40px" }}>
            Offrez à vos clients une carte de fidélité numérique. Un tap NFC ou un scan QR suffit — directement dans Apple Wallet ou Google Wallet.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/auth/inscription" style={{ fontSize: 16, fontWeight: 600, color: "white", background: "#007AFF", padding: "14px 32px", borderRadius: 14, textDecoration: "none", boxShadow: "0 8px 24px rgba(0,122,255,0.3)" }}>
              Créer mon espace
            </Link>
            <Link href="/auth/connexion" style={{ fontSize: 16, fontWeight: 500, color: "#1D1D1F", background: "rgba(0,0,0,0.05)", padding: "14px 32px", borderRadius: 14, textDecoration: "none" }}>
              Se connecter
            </Link>
          </div>
        </section>

        {/* Comment ça marche */}
        <section style={{ maxWidth: 960, margin: "0 auto", padding: "0 24px 100px" }}>
          <p style={{ textAlign: "center", fontSize: 12, fontWeight: 700, color: "#8E8E93", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 16 }}>Comment ça marche</p>
          <h2 style={{ textAlign: "center", fontSize: 34, fontWeight: 700, color: "#1D1D1F", marginBottom: 56, letterSpacing: -0.5 }}>3 secondes pour gagner un tampon</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 20 }}>
            {[
              { n: "01", icon: "📲", title: "Tap ou Scan", desc: "Le client approche son téléphone du tag NFC ou scanne le QR code posé sur le comptoir." },
              { n: "02", icon: "⭐", title: "Tampon automatique", desc: "Un tampon est ajouté instantanément sur sa carte de fidélité, sans app à télécharger." },
              { n: "03", icon: "🎁", title: "Récompense", desc: "Une fois l'objectif atteint, la récompense est débloquée. Le marchand valide en un clic." },
            ].map(s => (
              <div key={s.n} style={{ background: "white", borderRadius: 24, padding: "32px 28px", border: "1px solid rgba(0,0,0,0.06)", boxShadow: "0 2px 16px rgba(0,0,0,0.04)" }}>
                <div style={{ fontSize: 36, marginBottom: 16 }}>{s.icon}</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#007AFF", marginBottom: 8 }}>{s.n}</div>
                <h3 style={{ fontSize: 18, fontWeight: 600, color: "#1D1D1F", marginBottom: 10 }}>{s.title}</h3>
                <p style={{ fontSize: 15, color: "#6E6E73", lineHeight: 1.6 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Features */}
        <section style={{ background: "white", borderTop: "1px solid rgba(0,0,0,0.06)", borderBottom: "1px solid rgba(0,0,0,0.06)", padding: "80px 24px" }}>
          <div style={{ maxWidth: 960, margin: "0 auto" }}>
            <h2 style={{ textAlign: "center", fontSize: 34, fontWeight: 700, color: "#1D1D1F", marginBottom: 56, letterSpacing: -0.5 }}>Tout ce dont vous avez besoin</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 16 }}>
              {[
                { icon: "📡", title: "NFC + QR Code", desc: "Compatible avec tous les smartphones, sans app à installer." },
                { icon: "💳", title: "Apple & Google Wallet", desc: "La carte s'ajoute directement au portefeuille natif du client." },
                { icon: "🔔", title: "Notifications push", desc: "Relancez vos clients avec des messages personnalisés." },
                { icon: "📊", title: "Dashboard marchand", desc: "Suivez vos clients, tampons et récompenses en temps réel." },
                { icon: "🎨", title: "Carte personnalisable", desc: "Couleurs, logo, tampons — à votre image." },
                { icon: "🖨️", title: "Carte comptoir prête", desc: "PNG 4K prêt à envoyer à l'imprimeur." },
              ].map(f => (
                <div key={f.title} style={{ background: "#FAFAFA", borderRadius: 20, padding: "24px 20px", border: "1px solid rgba(0,0,0,0.05)" }}>
                  <div style={{ fontSize: 28, marginBottom: 12 }}>{f.icon}</div>
                  <h3 style={{ fontSize: 15, fontWeight: 600, color: "#1D1D1F", marginBottom: 6 }}>{f.title}</h3>
                  <p style={{ fontSize: 13, color: "#6E6E73", lineHeight: 1.5 }}>{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pour qui */}
        <section style={{ maxWidth: 760, margin: "0 auto", padding: "80px 24px", textAlign: "center" }}>
          <h2 style={{ fontSize: 34, fontWeight: 700, color: "#1D1D1F", marginBottom: 16, letterSpacing: -0.5 }}>Pour tous les commerces de proximité</h2>
          <p style={{ fontSize: 17, color: "#6E6E73", marginBottom: 36 }}>Cafés · Restaurants · Barbers · Salons · Boutiques · Salles de sport · Instituts</p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            {["☕ Café", "🍕 Restaurant", "✂️ Barber", "💅 Salon", "🛍️ Boutique", "🏋️ Sport"].map(c => (
              <span key={c} style={{ fontSize: 14, fontWeight: 500, color: "#3A3A3C", background: "white", padding: "8px 18px", borderRadius: 20, border: "1px solid rgba(0,0,0,0.08)" }}>{c}</span>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section style={{ background: "linear-gradient(135deg,#4472F5,#8A5CF6)", padding: "80px 24px", textAlign: "center" }}>
          <h2 style={{ fontSize: 38, fontWeight: 700, color: "white", marginBottom: 16, letterSpacing: -1 }}>Prêt à fidéliser vos clients ?</h2>
          <p style={{ fontSize: 18, color: "rgba(255,255,255,0.8)", marginBottom: 36 }}>Commencez en quelques minutes. Aucune installation requise.</p>
          <Link href="/auth/inscription" style={{ fontSize: 16, fontWeight: 700, color: "#4472F5", background: "white", padding: "16px 40px", borderRadius: 16, textDecoration: "none", display: "inline-block", boxShadow: "0 8px 32px rgba(0,0,0,0.2)" }}>
            Créer mon compte
          </Link>
        </section>

        {/* Footer */}
        <footer style={{ background: "#1D1D1F", padding: "40px 24px", textAlign: "center" }}>
          <p style={{ fontSize: 16, fontWeight: 700, color: "white", letterSpacing: 3, marginBottom: 20 }}>WALLIO</p>
          <div style={{ display: "flex", gap: 24, justifyContent: "center", flexWrap: "wrap", marginBottom: 24 }}>
            {[
              { href: "/privacy", label: "Confidentialité" },
              { href: "/terms", label: "CGU" },
              { href: "/legal", label: "Mentions légales" },
              { href: "mailto:contact@wallio.app", label: "Contact" },
            ].map(l => (
              <Link key={l.href} href={l.href} style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", textDecoration: "none" }}>{l.label}</Link>
            ))}
          </div>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.3)" }}>© 2026 Wallio · Tous droits réservés</p>
        </footer>
      </div>
    </div>
  );
}
