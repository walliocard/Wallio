import Link from "next/link";

export const metadata = { title: "Mentions légales — Wallio" };

export default function LegalPage() {
  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: "clamp(40px,6vw,80px) clamp(16px,4vw,40px)", fontFamily: "-apple-system, 'Helvetica Neue', sans-serif", color: "#1D1D1F", lineHeight: 1.7 }}>
      <Link href="/" style={{ fontSize: 14, color: "#007AFF", textDecoration: "none" }}>← Wallio</Link>

      <h1 style={{ fontSize: "clamp(26px,5vw,36px)", fontWeight: 700, marginTop: 32, marginBottom: 8, letterSpacing: -0.5 }}>Mentions légales</h1>
      <p style={{ color: "#6E6E73", marginBottom: 40 }}>Dernière mise à jour : août 2026</p>

      <Section title="Éditeur du service">
        <Row label="Société" value="Wallio" />
        <Row label="Statut" value="À compléter (SARL, Auto-entrepreneur…)" />
        <Row label="Email" value="contact@wallio.app" />
        <Row label="Site web" value="wallio.app" />
      </Section>

      <Section title="Hébergement">
        <Row label="Hébergeur" value="Vercel Inc." />
        <Row label="Adresse" value="340 Pine Street, Suite 701, San Francisco, CA 94104, USA" />
        <Row label="Site" value="vercel.com" />
        <p style={{ marginTop: 12 }}>Base de données hébergée sur Google Firebase (Google LLC, USA) avec transfert encadré par les clauses contractuelles types de l'Union Européenne.</p>
      </Section>

      <Section title="Propriété intellectuelle">
        <p>L'ensemble du contenu de wallio.app (textes, images, logo, code source) est protégé par le droit d'auteur et appartient à Wallio. Toute reproduction partielle ou totale est interdite sans autorisation préalable.</p>
      </Section>

      <Section title="Données personnelles">
        <p>Wallio traite des données personnelles conformément à sa <Link href="/privacy" style={{ color: "#007AFF" }}>Politique de confidentialité</Link> et au Règlement Général sur la Protection des Données (RGPD).</p>
        <p style={{ marginTop: 8 }}>Contact DPO : <strong>contact@wallio.app</strong></p>
      </Section>

      <Section title="Cookies">
        <p>Ce site utilise des cookies techniques nécessaires au bon fonctionnement du service. Aucun cookie publicitaire ou de tracking tiers n'est utilisé.</p>
      </Section>

      <Section title="Litiges">
        <p>En cas de litige, une solution amiable sera recherchée avant tout recours judiciaire. Le droit applicable est le droit marocain.</p>
      </Section>

      <div style={{ marginTop: 48, paddingTop: 24, borderTop: "1px solid #E5E5EA", display: "flex", gap: 24 }}>
        <Link href="/privacy" style={{ fontSize: 14, color: "#007AFF" }}>Politique de confidentialité</Link>
        <Link href="/terms" style={{ fontSize: 14, color: "#007AFF" }}>CGU</Link>
      </div>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 36 }}>
      <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 12 }}>{title}</h2>
      <div style={{ color: "#3A3A3C", fontSize: 15 }}>{children}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", gap: 16, marginBottom: 6 }}>
      <span style={{ color: "#6E6E73", minWidth: 120, flexShrink: 0 }}>{label}</span>
      <span style={{ fontWeight: 500 }}>{value}</span>
    </div>
  );
}
