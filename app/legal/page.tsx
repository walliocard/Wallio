import Link from "next/link";

export const metadata = { title: "Mentions légales — Wallio" };

export default function LegalPage() {
  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: "clamp(40px,6vw,80px) clamp(16px,4vw,40px)", fontFamily: "-apple-system, 'Helvetica Neue', sans-serif", color: "#1D1D1F", lineHeight: 1.7 }}>
      <Link href="/" style={{ fontSize: 14, color: "#007AFF", textDecoration: "none" }}>← Wallio</Link>

      <h1 style={{ fontSize: "clamp(26px,5vw,36px)", fontWeight: 700, marginTop: 32, marginBottom: 8, letterSpacing: -0.5 }}>Mentions légales</h1>
      <p style={{ color: "#6E6E73", marginBottom: 40 }}>Dernière mise à jour : septembre 2026</p>

      <Section title="Éditeur du service">
        <Row label="Nom" value="Mohamed Karim Mejbar" />
        <Row label="Statut" value="Auto-entrepreneur" />
        <Row label="ICE" value="003655578000095" />
        <Row label="Identifiant Fiscal" value="42798171" />
        <Row label="Adresse" value="Quartier Founty, Secteur R, N°266, Agadir, Maroc" />
        <Row label="Email" value="walliocard@gmail.com" />
        <Row label="Site web" value="app.walliocard.com" />
      </Section>

      <Section title="Hébergement">
        <Row label="Hébergeur" value="Vercel Inc." />
        <Row label="Adresse" value="340 Pine Street, Suite 701, San Francisco, CA 94104, USA" />
        <Row label="Site" value="vercel.com" />
        <p style={{ marginTop: 12, color: "#3A3A3C", fontSize: 15 }}>
          Base de données hébergée sur Google Firebase (Google LLC, USA). Les transferts de données hors de l&apos;Espace Économique Européen sont encadrés par les clauses contractuelles types approuvées par la Commission Européenne.
        </p>
      </Section>

      <Section title="Propriété intellectuelle">
        <p>L&apos;ensemble du contenu de la plateforme Wallio — textes, images, logo, design, code source, marque — est la propriété exclusive de Mohamed Karim Mejbar. Toute reproduction, représentation, modification ou exploitation partielle ou totale est interdite sans autorisation écrite préalable.</p>
      </Section>

      <Section title="Données personnelles">
        <p>Wallio collecte et traite des données personnelles conformément à sa <Link href="/privacy" style={{ color: "#007AFF" }}>Politique de confidentialité</Link> et au Règlement Général sur la Protection des Données (RGPD — UE 2016/679).</p>
        <p style={{ marginTop: 8 }}>Responsable du traitement : Mohamed Karim Mejbar</p>
        <p>Contact : <strong>walliocard@gmail.com</strong></p>
      </Section>

      <Section title="Cookies">
        <p>Wallio utilise uniquement des cookies techniques indispensables au bon fonctionnement du service (authentification, session). Aucun cookie publicitaire, de suivi ou d&apos;analyse comportementale tiers n&apos;est utilisé.</p>
      </Section>

      <Section title="Litiges">
        <p>En cas de litige, et conformément à la réglementation en vigueur, les parties s&apos;engagent à rechercher une solution amiable avant tout recours judiciaire. À défaut d&apos;accord amiable, les tribunaux compétents sont ceux d&apos;Agadir (Maroc), le droit marocain étant seul applicable.</p>
      </Section>

      <div style={{ marginTop: 48, paddingTop: 24, borderTop: "1px solid #E5E5EA", display: "flex", gap: 24, flexWrap: "wrap" }}>
        <Link href="/privacy" style={{ fontSize: 14, color: "#007AFF" }}>Politique de confidentialité</Link>
        <Link href="/terms" style={{ fontSize: 14, color: "#007AFF" }}>CGU</Link>
        <Link href="/contrat" style={{ fontSize: 14, color: "#007AFF" }}>Contrat marchand</Link>
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
      <span style={{ color: "#6E6E73", minWidth: 160, flexShrink: 0 }}>{label}</span>
      <span style={{ fontWeight: 500 }}>{value}</span>
    </div>
  );
}
