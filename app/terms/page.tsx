import Link from "next/link";

export const metadata = { title: "Conditions Générales d'Utilisation — Wallio" };

export default function TermsPage() {
  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: "clamp(40px,6vw,80px) clamp(16px,4vw,40px)", fontFamily: "-apple-system, 'Helvetica Neue', sans-serif", color: "#1D1D1F", lineHeight: 1.7 }}>
      <Link href="/" style={{ fontSize: 14, color: "#007AFF", textDecoration: "none" }}>← Wallio</Link>

      <h1 style={{ fontSize: "clamp(26px,5vw,36px)", fontWeight: 700, marginTop: 32, marginBottom: 8, letterSpacing: -0.5 }}>Conditions Générales d&apos;Utilisation</h1>
      <p style={{ color: "#6E6E73", marginBottom: 40 }}>Dernière mise à jour : septembre 2026</p>

      <Section title="1. Parties">
        <p>Les présentes Conditions Générales d&apos;Utilisation (« CGU ») sont conclues entre :</p>
        <p style={{ marginTop: 8 }}><strong>Wallio</strong>, service édité par Mohamed Karim Mejbar, auto-entrepreneur immatriculé sous le numéro ICE 003655578000095, IF 42798171, dont le siège est situé Quartier Founty, Secteur R, N°266, Agadir, Maroc (ci-après « Wallio » ou « le Prestataire »),</p>
        <p style={{ marginTop: 8 }}>et tout commerçant, professionnel ou établissement créant un compte sur la plateforme Wallio (ci-après « le Marchand »).</p>
        <p style={{ marginTop: 8 }}>L&apos;utilisation du service par le Marchand vaut acceptation pleine et entière des présentes CGU.</p>
      </Section>

      <Section title="2. Description du service">
        <p>Wallio est une plateforme SaaS (Software as a Service) de fidélisation numérique permettant aux commerçants de :</p>
        <ul style={{ paddingLeft: 20, marginTop: 8 }}>
          <li>Créer et personnaliser des cartes de fidélité compatibles Apple Wallet et Google Wallet</li>
          <li>Enregistrer les visites de leurs clients par NFC ou QR code</li>
          <li>Gérer des tampons, récompenses et paliers de fidélité</li>
          <li>Envoyer des notifications push à leurs clients</li>
          <li>Accéder à des statistiques d&apos;utilisation</li>
        </ul>
        <p style={{ marginTop: 8 }}>L&apos;utilisation de la carte de fidélité par les clients finaux est libre et gratuite.</p>
      </Section>

      <Section title="3. Accès et activation du compte">
        <p>L&apos;accès au service est subordonné à la création d&apos;un compte marchand et à son activation par Wallio. Wallio se réserve le droit, sans avoir à s&apos;en justifier, de refuser l&apos;activation d&apos;un compte ou de le désactiver à tout moment.</p>
        <p style={{ marginTop: 8 }}>Le Marchand est responsable de la confidentialité de ses identifiants de connexion. Toute utilisation du compte effectuée à partir de ses identifiants est réputée avoir été effectuée par le Marchand.</p>
      </Section>

      <Section title="4. Abonnement et facturation">
        <p>Le service est fourni sur la base d&apos;un abonnement dont le tarif est communiqué au Marchand lors de l&apos;activation. Le paiement est dû en début de chaque période, par virement bancaire ou tout autre moyen convenu.</p>
        <p style={{ marginTop: 8 }}><strong>Absence de remboursement :</strong> Toute période entamée est due en intégralité. Aucun remboursement partiel ou total ne sera accordé, y compris en cas de résiliation en cours de période.</p>
        <p style={{ marginTop: 8 }}><strong>Modification des tarifs :</strong> Wallio se réserve le droit de modifier ses tarifs avec un préavis de 30 jours notifié par email. L&apos;absence de résiliation dans ce délai vaut acceptation des nouveaux tarifs.</p>
        <p style={{ marginTop: 8 }}><strong>Défaut de paiement :</strong> En cas de non-paiement à l&apos;échéance, Wallio se réserve le droit de suspendre l&apos;accès au service sans mise en demeure préalable, et de réclamer le paiement des sommes dues augmentées d&apos;une pénalité de retard de 10 % par mois de retard.</p>
      </Section>

      <Section title="5. Obligations du Marchand">
        <p>Le Marchand s&apos;engage à :</p>
        <ul style={{ paddingLeft: 20, marginTop: 8 }}>
          <li>Fournir des informations exactes, complètes et à jour lors de l&apos;inscription et pendant toute la durée du contrat</li>
          <li>Utiliser le service conformément à sa destination et aux lois en vigueur</li>
          <li>Ne pas utiliser Wallio à des fins frauduleuses, trompeuses, illicites ou contraires à l&apos;ordre public</li>
          <li>Informer ses clients de l&apos;utilisation de leurs données personnelles via Wallio</li>
          <li>Respecter les droits de ses clients concernant leurs données personnelles (droit d&apos;accès, rectification, suppression)</li>
          <li>Ne pas tenter de contourner, pirater ou altérer le fonctionnement de la plateforme</li>
          <li>S&apos;acquitter de son abonnement dans les délais convenus</li>
        </ul>
      </Section>

      <Section title="6. Suspension et résiliation du compte">
        <p><strong>Par Wallio :</strong> Wallio peut suspendre ou résilier le compte d&apos;un Marchand immédiatement et sans préavis en cas de :</p>
        <ul style={{ paddingLeft: 20, marginTop: 8 }}>
          <li>Non-paiement de l&apos;abonnement</li>
          <li>Violation des présentes CGU</li>
          <li>Utilisation frauduleuse ou abusive du service</li>
          <li>Fourniture de fausses informations</li>
          <li>Comportement préjudiciable à Wallio, à ses partenaires ou à des tiers</li>
          <li>Demande d&apos;une autorité judiciaire ou administrative</li>
        </ul>
        <p style={{ marginTop: 8 }}>En cas de suspension ou résiliation pour l&apos;un de ces motifs, aucun remboursement ne sera dû par Wallio.</p>
        <p style={{ marginTop: 8 }}><strong>Par le Marchand :</strong> Le Marchand peut résilier son compte à tout moment avec un préavis de 30 jours notifié par email à walliocard@gmail.com. La résiliation prend effet à l&apos;issue de la période d&apos;abonnement en cours.</p>
      </Section>

      <Section title="7. Responsabilité et garanties">
        <p>Wallio s&apos;engage à fournir le service avec soin et professionnalisme. Cependant :</p>
        <ul style={{ paddingLeft: 20, marginTop: 8 }}>
          <li>Wallio ne garantit pas une disponibilité ininterrompue du service. Des interruptions de maintenance, techniques ou dues à des tiers (hébergeur, Apple, Google) peuvent survenir sans que la responsabilité de Wallio ne soit engagée.</li>
          <li>Wallio n&apos;est pas responsable des résultats commerciaux du programme de fidélité du Marchand (augmentation de clientèle, chiffre d&apos;affaires).</li>
          <li>Wallio n&apos;est pas responsable du contenu des notifications envoyées par le Marchand à ses clients.</li>
          <li>Wallio n&apos;est pas responsable des pertes de données résultant d&apos;un usage non conforme ou d&apos;une cause extérieure (panne réseau, force majeure).</li>
          <li>En tout état de cause, la responsabilité de Wallio est limitée au montant de l&apos;abonnement mensuel payé par le Marchand au cours du mois où le dommage est survenu.</li>
        </ul>
      </Section>

      <Section title="8. Propriété intellectuelle">
        <p>La marque Wallio, le logo, le design, l&apos;interface, le code source et l&apos;ensemble des contenus de la plateforme sont et demeurent la propriété exclusive de Mohamed Karim Mejbar.</p>
        <p style={{ marginTop: 8 }}>L&apos;accès au service ne confère au Marchand aucun droit de propriété intellectuelle sur ces éléments. Le Marchand s&apos;interdit de reproduire, copier, adapter ou utiliser à des fins commerciales tout ou partie des éléments constitutifs de la plateforme.</p>
        <p style={{ marginTop: 8 }}>Les logos et contenus fournis par le Marchand (nom, logo de l&apos;établissement, images) restent sa propriété. Le Marchand accorde à Wallio une licence non exclusive d&apos;utilisation de ces éléments pour les besoins du service.</p>
      </Section>

      <Section title="9. Données personnelles et sous-traitance">
        <p>Dans le cadre du service, Wallio collecte et traite des données personnelles des clients finaux du Marchand (prénom, nom, téléphone, historique de visites) pour le compte et sur instruction du Marchand.</p>
        <p style={{ marginTop: 8 }}>Le Marchand agit en qualité de <strong>responsable du traitement</strong> ; Wallio agit en qualité de <strong>sous-traitant</strong> au sens du RGPD. Le Marchand est seul responsable de la licéité du traitement vis-à-vis de ses clients et des autorités compétentes.</p>
        <p style={{ marginTop: 8 }}>Wallio ne vend jamais les données des clients finaux à des tiers et ne les utilise qu&apos;aux fins d&apos;exécution du service.</p>
        <p style={{ marginTop: 8 }}>Les détails du traitement des données figurent dans la <Link href="/privacy" style={{ color: "#007AFF" }}>Politique de confidentialité</Link>.</p>
      </Section>

      <Section title="10. Force majeure">
        <p>Wallio ne pourra être tenu responsable de tout retard ou inexécution résultant d&apos;un événement de force majeure, entendu comme tout événement imprévisible, irrésistible et extérieur, notamment : pannes d&apos;infrastructure des prestataires tiers (Google, Apple, Vercel), cyberattaques, catastrophes naturelles, décisions gouvernementales.</p>
      </Section>

      <Section title="11. Modification des CGU">
        <p>Wallio se réserve le droit de modifier les présentes CGU à tout moment. Le Marchand sera informé par email avec un préavis de 15 jours. L&apos;absence de résiliation dans ce délai vaut acceptation des nouvelles CGU. Les CGU applicables sont celles en vigueur à la date d&apos;utilisation du service.</p>
      </Section>

      <Section title="12. Droit applicable et juridiction">
        <p>Les présentes CGU sont soumises au droit marocain. En cas de litige, les parties s&apos;engagent à rechercher une solution amiable dans un délai de 30 jours. À défaut d&apos;accord, le tribunal compétent est le Tribunal de Commerce d&apos;Agadir, auquel les parties attribuent compétence exclusive, y compris pour les procédures d&apos;urgence.</p>
      </Section>

      <Section title="13. Contact">
        <p>Pour toute question relative aux présentes CGU : <strong>walliocard@gmail.com</strong></p>
        <p>Mohamed Karim Mejbar — Wallio — Quartier Founty, Secteur R, N°266, Agadir, Maroc</p>
      </Section>

      <div style={{ marginTop: 48, paddingTop: 24, borderTop: "1px solid #E5E5EA", display: "flex", gap: 24, flexWrap: "wrap" }}>
        <Link href="/privacy" style={{ fontSize: 14, color: "#007AFF" }}>Politique de confidentialité</Link>
        <Link href="/legal" style={{ fontSize: 14, color: "#007AFF" }}>Mentions légales</Link>
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
