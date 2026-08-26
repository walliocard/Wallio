import Link from "next/link";

export const metadata = { title: "Conditions Générales d'Utilisation — Wallio" };

export default function TermsPage() {
  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: "clamp(40px,6vw,80px) clamp(16px,4vw,40px)", fontFamily: "-apple-system, 'Helvetica Neue', sans-serif", color: "#1D1D1F", lineHeight: 1.7 }}>
      <Link href="/" style={{ fontSize: 14, color: "#007AFF", textDecoration: "none" }}>← Wallio</Link>

      <h1 style={{ fontSize: "clamp(26px,5vw,36px)", fontWeight: 700, marginTop: 32, marginBottom: 8, letterSpacing: -0.5 }}>Conditions Générales d&apos;Utilisation</h1>
      <p style={{ color: "#6E6E73", marginBottom: 40 }}>Dernière mise à jour : août 2026</p>

      <Section title="1. Objet">
        <p>Les présentes CGU régissent l'utilisation de la plateforme Wallio, service de fidélité numérique permettant aux commerçants de créer et gérer des cartes de fidélité compatibles Apple Wallet et Google Wallet.</p>
      </Section>

      <Section title="2. Accès au service">
        <p>L'accès à Wallio est réservé aux commerçants disposant d'un compte activé. L'utilisation par les clients finaux est libre et gratuite via scan NFC ou QR code.</p>
      </Section>

      <Section title="3. Obligations du commerçant">
        <ul style={{ paddingLeft: 20 }}>
          <li>Fournir des informations exactes lors de l'inscription</li>
          <li>Ne pas utiliser le service à des fins frauduleuses ou illicites</li>
          <li>Respecter la vie privée des clients dont les données sont collectées via la plateforme</li>
          <li>Informer ses clients de l'utilisation de leurs données (conformément au RGPD)</li>
          <li>S'acquitter de l'abonnement dans les délais convenus</li>
        </ul>
      </Section>

      <Section title="4. Abonnement et facturation">
        <p>Le service est fourni sur la base d'un abonnement mensuel dont le montant est défini au moment de l'activation du compte. Le paiement est dû en début de période.</p>
        <p>En cas de non-paiement, Wallio se réserve le droit de suspendre l'accès au service après mise en demeure restée sans réponse sous 7 jours.</p>
      </Section>

      <Section title="5. Propriété intellectuelle">
        <p>L'ensemble des éléments constituant la plateforme Wallio (logo, design, code, contenus) sont la propriété exclusive de Wallio. Toute reproduction est interdite sans autorisation écrite préalable.</p>
      </Section>

      <Section title="6. Responsabilité">
        <p>Wallio s'engage à assurer la disponibilité du service avec un objectif de 99 % de disponibilité mensuelle. Wallio ne saurait être tenu responsable des interruptions dues à des causes extérieures (panne réseau, force majeure, maintenance planifiée).</p>
        <p>Le commerçant reste seul responsable du programme de fidélité qu'il propose à ses clients (valeur des récompenses, conditions d'attribution).</p>
      </Section>

      <Section title="7. Résiliation">
        <p>Chaque partie peut mettre fin au contrat avec un préavis de 30 jours. Les données du commerçant sont supprimées dans un délai de 30 jours suivant la résiliation, sauf obligation légale de conservation.</p>
      </Section>

      <Section title="8. Modification des CGU">
        <p>Wallio se réserve le droit de modifier les présentes CGU. Les commerçants seront informés par email de toute modification substantielle avec un préavis de 15 jours.</p>
      </Section>

      <Section title="9. Droit applicable">
        <p>Les présentes CGU sont soumises au droit marocain. En cas de litige, les parties s'engagent à rechercher une solution amiable avant tout recours judiciaire.</p>
      </Section>

      <Section title="10. Contact">
        <p>Pour toute question : <strong>wallio.card@gmail.com</strong></p>
      </Section>

      <div style={{ marginTop: 48, paddingTop: 24, borderTop: "1px solid #E5E5EA", display: "flex", gap: 24 }}>
        <Link href="/privacy" style={{ fontSize: 14, color: "#007AFF" }}>Politique de confidentialité</Link>
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
