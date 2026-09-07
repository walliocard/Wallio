"use client";
import { useRef } from "react";

const SIZE = 1080;
const DISPLAY = 480;
const SCALE = DISPLAY / SIZE;

function useDownload(ref: React.RefObject<HTMLDivElement | null>, name: string) {
  return async () => {
    if (!ref.current) return;
    const { default: html2canvas } = await import("html2canvas");
    const canvas = await html2canvas(ref.current, { scale: SIZE / DISPLAY, useCORS: true, backgroundColor: null });
    const link = document.createElement("a");
    link.download = `wallio-${name}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };
}

function Post({ name, children }: { name: string; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const download = useDownload(ref, name);
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
      <div ref={ref} style={{ width:DISPLAY, height:DISPLAY, flexShrink:0, overflow:"hidden", borderRadius:12, position:"relative", fontFamily:"-apple-system,'SF Pro Display','Helvetica Neue',sans-serif", WebkitFontSmoothing:"antialiased" }}>
        {children}
      </div>
      <button
        onClick={download}
        style={{ background:"#1D1D1F", color:"white", border:"none", borderRadius:10, padding:"10px 0", fontSize:13, fontWeight:600, cursor:"pointer", width:DISPLAY }}
      >
        Télécharger
      </button>
    </div>
  );
}

const WA = "https://wa.me/40749056483?text=Bonjour%2C%20je%20souhaite%20d%C3%A9couvrir%20Wallio%20pour%20mon%20commerce.";

export default function InstagramPage() {
  const posts = [
    /* 1 — Hero brand */
    <Post key="1" name="01-hero">
      <div style={{ width:"100%", height:"100%", background:"#1D1D1F", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:48, textAlign:"center", position:"relative" }}>
        <div style={{ position:"absolute", top:0, left:0, right:0, bottom:0, background:"radial-gradient(ellipse 70% 60% at 60% 30%, rgba(68,114,245,0.18) 0%, transparent 65%), radial-gradient(ellipse 50% 50% at 20% 80%, rgba(138,92,246,0.12) 0%, transparent 55%)" }} />
        <div style={{ position:"relative" }}>
          <div style={{ fontSize:13, fontWeight:700, letterSpacing:"0.18em", textTransform:"uppercase", color:"rgba(255,255,255,0.45)", marginBottom:32 }}>WALLIO</div>
          <div style={{ fontSize:56, fontWeight:800, letterSpacing:-2.5, color:"white", lineHeight:1.05, marginBottom:24 }}>
            La fidélité client,<br />
            <span style={{ background:"linear-gradient(92deg,#4472F5,#6A5AF9,#8A5CF6)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>sans friction.</span>
          </div>
          <div style={{ fontSize:17, color:"rgba(255,255,255,0.50)", letterSpacing:"0.04em" }}>NFC · QR Code · Apple & Google Wallet</div>
          <div style={{ marginTop:48, display:"flex", justifyContent:"center", gap:16 }}>
            {["Sans app à installer","Sans compte client","En moins d'une seconde"].map(t => (
              <span key={t} style={{ fontSize:12, fontWeight:500, color:"rgba(255,255,255,0.55)", background:"rgba(255,255,255,0.07)", padding:"6px 14px", borderRadius:20 }}>{t}</span>
            ))}
          </div>
        </div>
        <div style={{ position:"absolute", bottom:32, fontSize:12, color:"rgba(255,255,255,0.25)", letterSpacing:"0.08em" }}>walliocard.com</div>
      </div>
    </Post>,

    /* 2 — Carte Comptoir */
    <Post key="2" name="02-carte-comptoir">
      <div style={{ width:"100%", height:"100%", background:"linear-gradient(145deg,#120D20,#1E1040)", display:"flex", flexDirection:"column", padding:52, justifyContent:"space-between", position:"relative" }}>
        <div style={{ position:"absolute", top:-40, right:-40, width:280, height:280, borderRadius:"50%", background:"rgba(138,92,246,0.12)" }} />
        <div>
          <div style={{ fontSize:12, fontWeight:700, letterSpacing:"0.14em", textTransform:"uppercase", color:"rgba(138,92,246,0.8)", marginBottom:20 }}>Carte Comptoir</div>
          <div style={{ fontSize:48, fontWeight:800, letterSpacing:-2, color:"white", lineHeight:1.08, marginBottom:20 }}>
            Un support.<br />Deux accès.
          </div>
          <div style={{ fontSize:17, color:"rgba(255,255,255,0.55)", lineHeight:1.65 }}>
            Posée sur votre comptoir, votre carte physique 4K intègre un QR code — et un tag NFC en option. Vos clients l&apos;utilisent pour accumuler leurs tampons, sans aucune installation.
          </div>
        </div>
        <div style={{ display:"flex", gap:14 }}>
          {[
            { label:"QR Code", sub:"Tous les téléphones", color:"#6A5AF9" },
            { label:"Tag NFC", sub:"Tap en 1 seconde", color:"#8A5CF6" },
          ].map(c => (
            <div key={c.label} style={{ flex:1, background:"rgba(255,255,255,0.06)", borderRadius:16, padding:"20px 20px", border:`0.5px solid ${c.color}40` }}>
              <div style={{ fontSize:16, fontWeight:700, color:"white", marginBottom:4 }}>{c.label}</div>
              <div style={{ fontSize:12, color:"rgba(255,255,255,0.45)" }}>{c.sub}</div>
            </div>
          ))}
        </div>
        <div style={{ position:"absolute", bottom:32, right:52, fontSize:12, color:"rgba(255,255,255,0.20)", letterSpacing:"0.08em" }}>walliocard.com</div>
      </div>
    </Post>,

    /* 3 — Apple & Google Wallet */
    <Post key="3" name="03-wallet">
      <div style={{ width:"100%", height:"100%", background:"#F2F2F7", display:"flex", flexDirection:"column", padding:52, justifyContent:"space-between" }}>
        <div>
          <div style={{ fontSize:12, fontWeight:700, letterSpacing:"0.14em", textTransform:"uppercase", color:"#4472F5", marginBottom:20 }}>Fidélité native</div>
          <div style={{ fontSize:46, fontWeight:800, letterSpacing:-2, color:"#1D1D1F", lineHeight:1.08, marginBottom:20 }}>
            Dans le Wallet<br />de votre client.
          </div>
          <div style={{ fontSize:16, color:"#6E6E73", lineHeight:1.65 }}>
            La carte de fidélité Wallio s&apos;ajoute directement à Apple Wallet ou Google Wallet. Mise à jour automatique à chaque tampon — sans ouvrir aucune application.
          </div>
        </div>
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          {[
            "Notification Wallet à chaque tampon",
            "Carte toujours accessible hors connexion",
            "Compatible iPhone et Android",
          ].map(f => (
            <div key={f} style={{ display:"flex", alignItems:"center", gap:12 }}>
              <div style={{ width:20, height:20, borderRadius:"50%", background:"rgba(68,114,245,0.12)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="#4472F5" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
              <span style={{ fontSize:14, color:"#1D1D1F", fontWeight:500 }}>{f}</span>
            </div>
          ))}
          <div style={{ marginTop:8, fontSize:12, color:"#8E8E93" }}>walliocard.com</div>
        </div>
      </div>
    </Post>,

    /* 4 — Dashboard data */
    <Post key="4" name="04-dashboard">
      <div style={{ width:"100%", height:"100%", background:"linear-gradient(145deg,#0A1628,#111B38)", display:"flex", flexDirection:"column", padding:52, justifyContent:"space-between", position:"relative" }}>
        <div style={{ position:"absolute", top:-20, right:-20, width:220, height:220, borderRadius:"50%", background:"rgba(68,114,245,0.10)" }} />
        <div>
          <div style={{ fontSize:12, fontWeight:700, letterSpacing:"0.14em", textTransform:"uppercase", color:"rgba(68,114,245,0.9)", marginBottom:20 }}>Dashboard</div>
          <div style={{ fontSize:46, fontWeight:800, letterSpacing:-2, color:"white", lineHeight:1.08, marginBottom:20 }}>
            Vous savez<br />qui revient.
          </div>
          <div style={{ fontSize:16, color:"rgba(255,255,255,0.55)", lineHeight:1.65 }}>
            Pour la première fois, vous avez les données sur vos clients : qui revient, qui vous quitte, qui est proche de sa récompense.
          </div>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12 }}>
          {[
            { value:"78%", label:"Taux de retour", color:"#34C759" },
            { value:"247", label:"Clients actifs", color:"#4472F5" },
            { value:"14", label:"À relancer !", color:"#FF9500" },
          ].map(s => (
            <div key={s.label} style={{ background:"rgba(255,255,255,0.06)", borderRadius:14, padding:"16px 14px", textAlign:"center" }}>
              <div style={{ fontSize:28, fontWeight:800, color:s.color, letterSpacing:-1, lineHeight:1 }}>{s.value}</div>
              <div style={{ fontSize:11, color:"rgba(255,255,255,0.45)", marginTop:4 }}>{s.label}</div>
            </div>
          ))}
        </div>
        <div style={{ fontSize:12, color:"rgba(255,255,255,0.20)", letterSpacing:"0.08em" }}>walliocard.com</div>
      </div>
    </Post>,

    /* 5 — Notifications */
    <Post key="5" name="05-notifications">
      <div style={{ width:"100%", height:"100%", background:"#1D1D1F", display:"flex", flexDirection:"column", padding:52, justifyContent:"space-between", position:"relative" }}>
        <div style={{ position:"absolute", bottom:-40, left:-20, width:200, height:200, borderRadius:"50%", background:"rgba(48,209,88,0.08)" }} />
        <div>
          <div style={{ fontSize:12, fontWeight:700, letterSpacing:"0.14em", textTransform:"uppercase", color:"rgba(48,209,88,0.8)", marginBottom:20 }}>Notifications</div>
          <div style={{ fontSize:46, fontWeight:800, letterSpacing:-2, color:"white", lineHeight:1.08, marginBottom:20 }}>
            Restez présent<br />au bon moment.
          </div>
          <div style={{ fontSize:16, color:"rgba(255,255,255,0.50)", lineHeight:1.65 }}>
            Wallio notifie automatiquement vos clients — sans que vous ayez à lever le petit doigt.
          </div>
        </div>
        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          {[
            { label:"Mise à jour Apple Wallet", sub:"À chaque tampon — automatique", color:"#4472F5" },
            { label:"Anniversaire client", sub:"Message automatique le jour J", color:"#6A5AF9" },
            { label:"Relance inactifs", sub:"Clients absents depuis +30 jours", color:"#8A5CF6" },
            { label:"Géolocalisation", sub:"Notif quand un client passe à proximité", color:"#30D158" },
          ].map(n => (
            <div key={n.label} style={{ display:"flex", alignItems:"center", gap:12 }}>
              <div style={{ width:8, height:8, borderRadius:"50%", background:n.color, flexShrink:0 }} />
              <div>
                <span style={{ fontSize:13, fontWeight:600, color:"white" }}>{n.label}</span>
                <span style={{ fontSize:12, color:"rgba(255,255,255,0.35)", marginLeft:8 }}>{n.sub}</span>
              </div>
            </div>
          ))}
          <div style={{ marginTop:4, fontSize:12, color:"rgba(255,255,255,0.20)", letterSpacing:"0.08em" }}>walliocard.com</div>
        </div>
      </div>
    </Post>,

    /* 6 — CTA contact */
    <Post key="6" name="06-contact">
      <div style={{ width:"100%", height:"100%", background:"linear-gradient(135deg,#4472F5 0%,#6A5AF9 52%,#8A5CF6 100%)", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:52, textAlign:"center", position:"relative" }}>
        <div style={{ position:"absolute", top:-60, right:-60, width:300, height:300, borderRadius:"50%", background:"rgba(255,255,255,0.07)" }} />
        <div style={{ position:"absolute", bottom:-60, left:-40, width:220, height:220, borderRadius:"50%", background:"rgba(255,255,255,0.05)" }} />
        <div style={{ position:"relative" }}>
          <div style={{ fontSize:13, fontWeight:700, letterSpacing:"0.14em", textTransform:"uppercase", color:"rgba(255,255,255,0.55)", marginBottom:24 }}>WALLIO</div>
          <div style={{ fontSize:50, fontWeight:800, letterSpacing:-2, color:"white", lineHeight:1.05, marginBottom:24 }}>
            Prêt à fidéliser<br />vos clients ?
          </div>
          <div style={{ fontSize:17, color:"rgba(255,255,255,0.70)", lineHeight:1.65, marginBottom:40 }}>
            Démarrez en quelques minutes.<br />Sans installation, sans friction.
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:12, alignItems:"center" }}>
            <div style={{ background:"white", color:"#4472F5", padding:"14px 40px", borderRadius:14, fontSize:15, fontWeight:700, letterSpacing:-0.2 }}>
              Nous contacter sur WhatsApp
            </div>
            <div style={{ fontSize:13, color:"rgba(255,255,255,0.55)" }}>wallio.card@gmail.com</div>
          </div>
        </div>
      </div>
    </Post>,
  ];

  return (
    <div style={{ fontFamily:"-apple-system,'SF Pro Display','Helvetica Neue',sans-serif", background:"#F2F2F7", minHeight:"100vh", padding:"48px 32px", WebkitFontSmoothing:"antialiased" }}>
      <div style={{ maxWidth:1100, margin:"0 auto" }}>
        <div style={{ marginBottom:48 }}>
          <div style={{ fontSize:11, fontWeight:700, letterSpacing:"0.12em", textTransform:"uppercase", color:"#8E8E93", marginBottom:8 }}>Wallio — Outils</div>
          <h1 style={{ fontSize:36, fontWeight:700, letterSpacing:-1, color:"#1D1D1F", marginBottom:8 }}>Posts Instagram</h1>
          <p style={{ fontSize:15, color:"#6E6E73" }}>6 posts prêts à télécharger — format 1080×1080. Cliquez "Télécharger" sous chaque post.</p>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(480px, 1fr))", gap:32 }}>
          {posts}
        </div>
      </div>
    </div>
  );
}
