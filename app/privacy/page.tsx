import Link from "next/link";

export const metadata = { title: "Politique de confidentialité — Wallio" };

export default function PrivacyPage() {
  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: "clamp(40px,6vw,80px) clamp(16px,4vw,40px)", fontFamily: "-apple-system, 'Helvetica Neue', sans-serif", color: "#1D1D1F", lineHeight: 1.7 }}>
      <Link href="/" style={{ fontSize: 14, color: "#007AFF", textDecoration: "none" }}>← Wallio</Link>

      <h1 style={{ fontSize: "clamp(26px,5vw,36px)", fontWeight: 700, marginTop: 32, marginBottom: 8, letterSpacing: -0.5 }}>Politique de confidentialité</h1>
      <p style={{ color: "#6E6E73", marginBottom: 40 }}>Dernière mise à jour : septembre 2026</p>

      <Section title="1. Responsable du traitement">
        <p>Mohamed Karim Mejbar, auto-entrepreneur (ICE 003655578000095), exerçant sous le nom commercial <strong>Wallio</strong>, Quartier Founty, Secteur R, N°266, Agadir, Maroc.</p>
        <p style={{ marginTop: 8 }}>Contact : <strong>walliocard@gmail.com</strong></p>
      </Section>

      <Section title="2. Données collectées">
        <p><strong>Clients finaux (utilisateurs des cartes de fidélité) :</strong></p>
        <ul style={{ paddingLeft: 20, marginTop: 4, marginBottom: 12 }}>
          <li>Prénom, nom</li>
          <li>Numéro de téléphone</li>
          <li>Date de naissance (optionnelle, uniquement si fournie)</li>
          <li>Historique de tampons, visites et récompenses</li>
          <li>Token de notification push (avec consentement explicite)</li>
          <li>Identifiant de carte Apple Wallet / Google Wallet</li>
        </ul>
        <p><strong>Commerçants (marchands) :</strong></p>
        <ul style={{ paddingLeft: 20, marginTop: 4 }}>
          <li>Nom et email professionnel</li>
          <li>Nom de l&apos;établissement, logo, couleurs de la carte</li>
          <li>Statistiques agrégées d&apos;utilisation du programme de fidélité</li>
          <li>Informations de facturation (hors données bancaires)</li>
        </ul>
        <p style={{ marginTop: 8 }}>Wallio ne collecte pas de données bancaires, de données de paiement par carte, ni de données de santé.</p>
      </Section>

      <Section title="3. Finalités et bases légales du traitement">
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14, marginTop: 8 }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #E5E5EA" }}>
              <th style={{ textAlign: "left", padding: "8px 12px 8px 0", color: "#6E6E73", fontWeight: 600 }}>Finalité</th>
              <th style={{ textAlign: "left", padding: "8px 0", color: "#6E6E73", fontWeight: 600 }}>Base légale</th>
            </tr>
          </thead>
          <tbody>
            {[
              ["Création et gestion des cartes de fidélité", "Exécution du contrat (art. 6.1.b RGPD)"],
              ["Comptabilisation des tampons et récompenses", "Exécution du contrat (art. 6.1.b RGPD)"],
              ["Envoi de notifications push marketing", "Consentement (art. 6.1.a RGPD)"],
              ["Notifications Wallet (mise à jour des tampons)", "Exécution du contrat (art. 6.1.b RGPD)"],
              ["Amélioration du service, statistiques anonymisées", "Intérêt légitime (art. 6.1.f RGPD)"],
              ["Facturation et gestion comptable", "Obligation légale (art. 6.1.c RGPD)"],
            ].map(([f, b]) => (
              <tr key={f} style={{ borderBottom: "1px solid #F2F2F7" }}>
                <td style={{ padding: "10px 12px 10px 0", verticalAlign: "top" }}>{f}</td>
                <td style={{ padding: "10px 0", verticalAlign: "top", color: "#6E6E73" }}>{b}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>

      <Section title="4. Durée de conservation">
        <ul style={{ paddingLeft: 20 }}>
          <li><strong>Données clients finaux :</strong> conservées pendant la durée d&apos;activité de la carte de fidélité, puis supprimées dans un délai de 3 ans après la dernière utilisation</li>
          <li><strong>Données marchands :</strong> conservées pendant la durée du contrat, puis 5 ans à compter de la résiliation pour les besoins comptables et légaux</li>
          <li><strong>Tokens de notification :</strong> supprimés immédiatement en cas de révocation du consentement</li>
        </ul>
      </Section>

      <Section title="5. Destinataires des données">
        <p>Les données ne sont jamais vendues à des tiers. Elles sont partagées uniquement avec les sous-traitants techniques suivants, dans le strict cadre du service :</p>
        <ul style={{ paddingLeft: 20, marginTop: 8 }}>
          <li><strong>Google Firebase</strong> (Google LLC, USA) — hébergement base de données, authentification, notifications push FCM</li>
          <li><strong>Vercel Inc.</strong> (USA) — hébergement de l&apos;application web</li>
          <li><strong>Apple Inc.</strong> (USA) — génération et mise à jour des passes Apple Wallet</li>
          <li><strong>Google LLC</strong> (USA) — génération des passes Google Wallet</li>
          <li><strong>Resend Inc.</strong> (USA) — envoi d&apos;emails transactionnels</li>
        </ul>
        <p style={{ marginTop: 8 }}>Ces transferts hors UE sont encadrés par les Clauses Contractuelles Types (CCT) de la Commission Européenne ou des garanties équivalentes.</p>
      </Section>

      <Section title="6. Droits des personnes concernées">
        <p>Conformément au RGPD, vous disposez des droits suivants :</p>
        <ul style={{ paddingLeft: 20, marginTop: 8 }}>
          <li><strong>Accès</strong> : obtenir une copie de vos données</li>
          <li><strong>Rectification</strong> : corriger des données inexactes</li>
          <li><strong>Effacement</strong> : demander la suppression de vos données (&laquo; droit à l&apos;oubli &raquo;)</li>
          <li><strong>Portabilité</strong> : recevoir vos données dans un format structuré</li>
          <li><strong>Opposition</strong> : vous opposer au traitement fondé sur l&apos;intérêt légitime</li>
          <li><strong>Retrait du consentement</strong> : retirer à tout moment votre consentement aux notifications push</li>
        </ul>
        <p style={{ marginTop: 8 }}>Pour exercer ces droits : <strong>walliocard@gmail.com</strong>. Réponse sous 30 jours.</p>
        <p style={{ marginTop: 8 }}>Les clients finaux peuvent également supprimer leur compte directement depuis la page « Mes cartes » de l&apos;application.</p>
      </Section>

      <Section title="7. Sécurité des données">
        <p>Wallio met en œuvre des mesures techniques et organisationnelles adaptées pour protéger les données personnelles contre toute accès non autorisé, perte, destruction ou altération, notamment :</p>
        <ul style={{ paddingLeft: 20, marginTop: 8 }}>
          <li>Chiffrement des communications (HTTPS/TLS)</li>
          <li>Authentification sécurisée (Firebase Auth)</li>
          <li>Règles de sécurité Firestore limitant l&apos;accès aux données</li>
          <li>Accès restreint aux données sensibles</li>
        </ul>
      </Section>

      <Section title="8. Cookies">
        <p>Wallio utilise uniquement des cookies et données de stockage local (<em>localStorage</em>) strictement nécessaires au fonctionnement du service :</p>
        <ul style={{ paddingLeft: 20, marginTop: 8 }}>
          <li>Authentification et session marchands</li>
          <li>Mémorisation de l&apos;identifiant client (numéro de téléphone) pour éviter une nouvelle inscription à chaque scan</li>
          <li>Préférences d&apos;affichage (thème, langue)</li>
        </ul>
        <p style={{ marginTop: 8 }}>Aucun cookie publicitaire ni outil de tracking tiers n&apos;est utilisé.</p>
      </Section>

      <Section title="9. Réclamation auprès d'une autorité">
        <p>Si vous estimez que vos droits ne sont pas respectés, vous pouvez introduire une réclamation auprès de l&apos;autorité de protection des données compétente dans votre pays de résidence (en France : CNIL — <Link href="https://www.cnil.fr" style={{ color: "#007AFF" }}>cnil.fr</Link> ; en Roumanie : ANSPDCP).</p>
      </Section>

      <Section title="10. Modification de la politique">
        <p>La présente politique peut être modifiée à tout moment. La date de mise à jour figure en haut de page. En cas de modification substantielle, les marchands seront informés par email.</p>
      </Section>

      <div style={{ marginTop: 48, paddingTop: 24, borderTop: "1px solid #E5E5EA", display: "flex", gap: 24, flexWrap: "wrap" }}>
        <Link href="/terms" style={{ fontSize: 14, color: "#007AFF" }}>CGU</Link>
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
