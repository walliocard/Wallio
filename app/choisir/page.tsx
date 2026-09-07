"use client";
import Link from "next/link";
import Image from "next/image";

export default function ChoisirPage() {
  return (
    <div style={{
      minHeight:"100vh", background:"#F2F2F7",
      display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
      padding:"32px", fontFamily:"-apple-system,'SF Pro Display','Helvetica Neue',sans-serif",
      WebkitFontSmoothing:"antialiased",
    }}>
      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:48 }}>
        <Image src="/icon.svg" alt="Wallio" width={32} height={32} unoptimized style={{ borderRadius:7 }} />
        <span style={{ fontSize:15, fontWeight:700, letterSpacing:"0.16em", color:"#1D1D1F" }}>WALLIO</span>
      </div>

      <div style={{ textAlign:"center", marginBottom:48 }}>
        <h1 style={{ fontSize:32, fontWeight:700, letterSpacing:-1, color:"#1D1D1F", marginBottom:10 }}>Bienvenue</h1>
        <p style={{ fontSize:16, color:"#6E6E73" }}>Choisissez votre espace</p>
      </div>

      <div style={{ display:"flex", gap:20, flexWrap:"wrap", justifyContent:"center", maxWidth:680, width:"100%" }}>

        {/* Espace Marchand */}
        <Link href="/auth/connexion" style={{ textDecoration:"none", flex:"1 1 280px" }}>
          <div style={{
            background:"#1D1D1F", borderRadius:24, padding:"36px 32px",
            display:"flex", flexDirection:"column", gap:20,
            boxShadow:"0 8px 32px rgba(0,0,0,0.15)",
            transition:"transform 0.2s, box-shadow 0.2s",
            cursor:"pointer",
          }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform="translateY(-3px)"; (e.currentTarget as HTMLElement).style.boxShadow="0 16px 48px rgba(0,0,0,0.22)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform=""; (e.currentTarget as HTMLElement).style.boxShadow="0 8px 32px rgba(0,0,0,0.15)"; }}
          >
            <div style={{ width:52, height:52, borderRadius:16, background:"linear-gradient(135deg,#4472F5,#8A5CF6)", display:"flex", alignItems:"center", justifyContent:"center" }}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round">
                <rect x="3" y="3" width="7" height="7" rx="1"/>
                <rect x="14" y="3" width="7" height="7" rx="1"/>
                <rect x="3" y="14" width="7" height="7" rx="1"/>
                <path d="M14 14h7v7h-7z" opacity=".5"/>
              </svg>
            </div>
            <div>
              <h2 style={{ fontSize:22, fontWeight:700, color:"white", letterSpacing:-0.5, marginBottom:8 }}>Espace Marchand</h2>
              <p style={{ fontSize:14, color:"rgba(255,255,255,0.50)", lineHeight:1.6 }}>Accédez à votre dashboard — clients, tampons, notifications, statistiques.</p>
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:6 }}>
              <span style={{ fontSize:13, fontWeight:600, color:"#4472F5" }}>Se connecter</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4472F5" strokeWidth="2" strokeLinecap="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </div>
          </div>
        </Link>

        {/* Espace Client */}
        <Link href="/mes-cartes" style={{ textDecoration:"none", flex:"1 1 280px" }}>
          <div style={{
            background:"white", borderRadius:24, padding:"36px 32px",
            display:"flex", flexDirection:"column", gap:20,
            boxShadow:"0 4px 20px rgba(0,0,0,0.07)",
            border:"0.5px solid rgba(0,0,0,0.08)",
            transition:"transform 0.2s, box-shadow 0.2s",
            cursor:"pointer",
          }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform="translateY(-3px)"; (e.currentTarget as HTMLElement).style.boxShadow="0 12px 36px rgba(0,0,0,0.12)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform=""; (e.currentTarget as HTMLElement).style.boxShadow="0 4px 20px rgba(0,0,0,0.07)"; }}
          >
            <div style={{ width:52, height:52, borderRadius:16, background:"linear-gradient(135deg,rgba(68,114,245,0.12),rgba(138,92,246,0.12))", display:"flex", alignItems:"center", justifyContent:"center" }}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#4472F5" strokeWidth="1.8" strokeLinecap="round">
                <rect x="2" y="5" width="20" height="14" rx="3"/>
                <path d="M2 10h20"/>
                <circle cx="7" cy="15" r="1" fill="#4472F5"/>
              </svg>
            </div>
            <div>
              <h2 style={{ fontSize:22, fontWeight:700, color:"#1D1D1F", letterSpacing:-0.5, marginBottom:8 }}>Espace Client</h2>
              <p style={{ fontSize:14, color:"#6E6E73", lineHeight:1.6 }}>Retrouvez votre carte de fidélité. Accédez via le QR code ou tag NFC de votre commerce.</p>
            </div>
            <div style={{ background:"#F2F2F7", borderRadius:12, padding:"14px 16px" }}>
              <p style={{ fontSize:12, color:"#8E8E93", lineHeight:1.6 }}>
                Votre carte est accessible directement depuis le QR code ou tag NFC de votre établissement. Vous pouvez aussi l&apos;installer sur votre écran d&apos;accueil.
              </p>
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:6 }}>
              <span style={{ fontSize:13, fontWeight:600, color:"#4472F5" }}>Accéder à mon espace</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4472F5" strokeWidth="2" strokeLinecap="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </div>
          </div>
        </Link>

      </div>

      <p style={{ marginTop:48, fontSize:13, color:"#C7C7CC", textAlign:"center" }}>
        Pas encore sur Wallio ?{" "}
        <a href="https://wa.me/40749056483?text=Bonjour%2C%20je%20souhaite%20d%C3%A9couvrir%20Wallio%20pour%20mon%20commerce." target="_blank" rel="noopener noreferrer" style={{ color:"#4472F5", textDecoration:"none", fontWeight:500 }}>
          Nous contacter
        </a>
      </p>
    </div>
  );
}
