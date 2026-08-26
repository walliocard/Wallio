import Link from "next/link";

export const metadata = { title: "Politique de confidentialité — Wallio" };

export default function PrivacyPage() {
  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: "clamp(40px,6vw,80px) clamp(16px,4vw,40px)", fontFamily: "-apple-system, 'Helvetica Neue', sans-serif", color: "#1D1D1F", lineHeight: 1.7 }}>
      <Link href="/" style={{ fontSize: 14, color: "#007AFF", textDecoration: "none" }}>← Wallio</Link>

      <h1 style={{ fontSize: "clamp(26px,5vw,36px)", fontWeight: 700, marginTop: 32, marginBottom: 8, letterSpacing: -0.5 }}>Politique de confidentialité</h1>
      <p style={{ color: "#6E6E73", marginBottom: 40 }}>Dernière mise à jour : août 2026</p>

      <Section title="1. Qui sommes-nous ?">
        <p>Wallio est une plateforme de fidélité numérique permettant aux commerçants de proposer des cartes de fidélité via NFC et QR code, compatibles Apple Wallet et Google Wallet.</p>
        <p>Responsable du traitement : Wallio · wallio.card@gmail.com</p>
      </Section>

      <Section title="2. Données collectées">
        <p><strong>Pour les clients :</strong> prénom, nom, numéro de téléphone, date de naissance (optionnelle), historique de tampons et récompenses, token de notification push.</p>
        <p><strong>Pour les commerçants :</strong> nom de l'établissement, adresse email, couleurs et logo de la carte de fidélité, statistiques d'utilisation.</p>
        <p>Nous ne collectons pas de données bancaires ni de paiement.</p>
      </Section>

      <Section title="3. Finalités du traitement">
        <ul style={{ paddingLeft: 20 }}>
          <li>Création et gestion des cartes de fidélité</li>
          <li>Comptabilisation des tampons et récompenses</li>
          <li>Envoi de notifications push (avec consentement explicite)</li>
          <li>Amélioration du service et statistiques anonymisées</li>
        </ul>
      </Section>

      <Section title="4. Base légale">
        <p>Le traitement repose sur l'exécution du contrat (article 6.1.b du RGPD) pour la gestion des cartes de fidélité, et sur le consentement (article 6.1.a) pour les notifications push.</p>
      </Section>

      <Section title="5. Durée de conservation">
        <p>Les données des clients sont conservées tant que la carte de fidélité est active, puis supprimées dans un délai de 3 ans après la dernière utilisation. Les commerçants peuvent demander la suppression immédiate de leurs données via wallio.card@gmail.com.</p>
      </Section>

      <Section title="6. Partage des données">
        <p>Vos données ne sont jamais vendues à des tiers. Elles sont partagées uniquement avec :</p>
        <ul style={{ paddingLeft: 20 }}>
          <li>Google Firebase (hébergement, base de données, authentification)</li>
          <li>Apple / Google (pour la génération des passes Wallet)</li>
          <li>Vercel (hébergement de l'application)</li>
        </ul>
      </Section>

      <Section title="7. Vos droits">
        <p>Conformément au RGPD, vous disposez des droits d'accès, rectification, effacement, portabilité et opposition. Pour exercer ces droits : <strong>wallio.card@gmail.com</strong></p>
      </Section>

      <Section title="8. Cookies">
        <p>Wallio utilise des cookies techniques indispensables au fonctionnement du service (authentification, session). Aucun cookie publicitaire n'est utilisé.</p>
      </Section>

      <Section title="9. Contact">
        <p>Pour toute question relative à vos données personnelles : <strong>wallio.card@gmail.com</strong></p>
      </Section>

      <div style={{ marginTop: 48, paddingTop: 24, borderTop: "1px solid #E5E5EA", display: "flex", gap: 24 }}>
        <Link href="/terms" style={{ fontSize: 14, color: "#007AFF" }}>CGU</Link>
        <Link href="/legal" style={{ fontSize: 14, color: "#007AFF" }}>Mentions légales</Link>
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
