import Link from "next/link";

export const metadata = { title: "Contrat de service marchand — Wallio" };

export default function ContratPage() {
  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: "clamp(40px,6vw,80px) clamp(16px,4vw,40px)", fontFamily: "-apple-system, 'Helvetica Neue', sans-serif", color: "#1D1D1F", lineHeight: 1.7 }}>
      <Link href="/" style={{ fontSize: 14, color: "#007AFF", textDecoration: "none" }}>← Wallio</Link>

      <h1 style={{ fontSize: "clamp(26px,5vw,36px)", fontWeight: 700, marginTop: 32, marginBottom: 8, letterSpacing: -0.5 }}>Contrat de service marchand</h1>
      <p style={{ color: "#6E6E73", marginBottom: 40 }}>Dernière mise à jour : septembre 2026</p>

      <div style={{ background: "#F2F2F7", borderRadius: 16, padding: "20px 24px", marginBottom: 40, fontSize: 14, color: "#3A3A3C" }}>
        <strong>Note :</strong> Le présent contrat régit la relation commerciale entre Wallio et chaque marchand utilisant la plateforme. Il complète les <Link href="/terms" style={{ color: "#007AFF" }}>Conditions Générales d&apos;Utilisation</Link>. En cas de contradiction, le présent contrat prévaut.
      </div>

      <Section title="ENTRE LES SOUSSIGNÉS">
        <p><strong>Le Prestataire :</strong></p>
        <p>Mohamed Karim Mejbar, auto-entrepreneur, ICE 003655578000095, IF 42798171, Quartier Founty, Secteur R, N°266, Agadir, Maroc — exerçant sous le nom commercial <strong>Wallio</strong> — ci-après désigné « Wallio ».</p>
        <p style={{ marginTop: 12 }}><strong>Le Client :</strong></p>
        <p>Tout commerçant, professionnel indépendant ou société ayant souscrit au service Wallio, dont les informations ont été renseignées lors de l&apos;inscription — ci-après désigné « le Marchand ».</p>
        <p style={{ marginTop: 12 }}>Il a été convenu et arrêté ce qui suit.</p>
      </Section>

      <Section title="Article 1 — Objet du contrat">
        <p>Le présent contrat a pour objet de définir les conditions dans lesquelles Wallio met à disposition du Marchand sa plateforme SaaS de fidélisation numérique, comprenant :</p>
        <ul style={{ paddingLeft: 20, marginTop: 8 }}>
          <li>La création et la gestion de cartes de fidélité Apple Wallet et Google Wallet</li>
          <li>L&apos;enregistrement des visites client par NFC et QR code</li>
          <li>Le dashboard marchand (statistiques, notifications, gestion des clients)</li>
          <li>L&apos;hébergement des données dans le cadre défini à l&apos;article 6</li>
          <li>Le support technique par WhatsApp ou email</li>
        </ul>
      </Section>

      <Section title="Article 2 — Durée">
        <p>Le contrat est conclu pour une durée indéterminée à compter de la date d&apos;activation du compte marchand par Wallio.</p>
        <p style={{ marginTop: 8 }}>Il se renouvelle automatiquement d&apos;une période à l&apos;autre (mensuelle, 6 mois ou annuelle selon la formule choisie) jusqu&apos;à résiliation dans les conditions prévues à l&apos;article 7.</p>
      </Section>

      <Section title="Article 3 — Tarifs et modalités de paiement">
        <p>Les tarifs applicables sont ceux communiqués au Marchand lors de l&apos;activation et disponibles sur le site <strong>app.walliocard.com</strong>. Ils varient selon la région et la formule choisie.</p>
        <p style={{ marginTop: 8 }}><strong>Paiement :</strong> Le paiement est dû en avance, par virement bancaire ou tout autre moyen convenu entre les parties, avant l&apos;ouverture ou le renouvellement de chaque période.</p>
        <p style={{ marginTop: 8 }}><strong>Aucun remboursement :</strong> Toute période entamée est due dans son intégralité. Aucun remboursement, partiel ou total, ne sera accordé quel qu&apos;en soit le motif, y compris en cas de résiliation anticipée, non-utilisation ou insatisfaction.</p>
        <p style={{ marginTop: 8 }}><strong>Retard de paiement :</strong> Toute somme non réglée à l&apos;échéance génère automatiquement des pénalités de retard au taux de 10 % par mois de retard, sans mise en demeure préalable. Wallio peut, en sus, suspendre immédiatement l&apos;accès au service.</p>
        <p style={{ marginTop: 8 }}><strong>Évolution des tarifs :</strong> Wallio peut modifier ses tarifs avec un préavis de 30 jours. L&apos;absence de résiliation dans ce délai vaut acceptation des nouveaux tarifs.</p>
      </Section>

      <Section title="Article 4 — Obligations de Wallio">
        <p>Wallio s&apos;engage à :</p>
        <ul style={{ paddingLeft: 20, marginTop: 8 }}>
          <li>Mettre à disposition la plateforme et ses fonctionnalités telles que décrites à l&apos;article 1</li>
          <li>Assurer la disponibilité du service dans la limite des contraintes techniques et des interventions des partenaires tiers (Apple, Google, Vercel)</li>
          <li>Informer le Marchand de toute interruption planifiée avec un préavis raisonnable</li>
          <li>Assurer la sécurité et la confidentialité des données conformément à la politique de confidentialité</li>
          <li>Fournir un support technique réactif par WhatsApp ou email</li>
          <li>Ne jamais vendre les données du Marchand ou de ses clients à des tiers</li>
        </ul>
        <p style={{ marginTop: 8 }}><strong>Absence de garantie de résultat :</strong> Wallio est tenu à une obligation de moyens. Il ne garantit aucun résultat commercial (augmentation du chiffre d&apos;affaires, fidélisation effective de la clientèle) ni aucune disponibilité contractuelle du service (SLA).</p>
      </Section>

      <Section title="Article 5 — Obligations du Marchand">
        <p>Le Marchand s&apos;engage à :</p>
        <ul style={{ paddingLeft: 20, marginTop: 8 }}>
          <li>Fournir des informations exactes et à jour lors de l&apos;inscription et pendant toute la durée du contrat</li>
          <li>Utiliser le service conformément à sa destination, aux présentes conditions et aux lois en vigueur dans son pays d&apos;établissement</li>
          <li>Ne pas tenter de pirater, contourner ou altérer le fonctionnement de la plateforme</li>
          <li>Ne pas utiliser Wallio pour diffuser des contenus illicites, frauduleux, trompeurs, diffamatoires ou portant atteinte à des droits de tiers</li>
          <li>Informer ses clients de la collecte de leurs données personnelles via Wallio et obtenir, le cas échéant, leur consentement (notamment pour les notifications push)</li>
          <li>Respecter les droits RGPD de ses clients et traiter toute demande d&apos;effacement ou de rectification dans les délais légaux</li>
          <li>Régler son abonnement à l&apos;échéance convenue</li>
          <li>Ne pas sous-louer, revendre ou céder l&apos;accès au service à un tiers sans accord écrit préalable de Wallio</li>
        </ul>
      </Section>

      <Section title="Article 6 — Données et propriété">
        <p><strong>Données clients :</strong> Les données des clients finaux collectées via la plateforme Wallio sont la propriété du Marchand. Wallio agit en qualité de sous-traitant (au sens du RGPD) et traite ces données sur instruction du Marchand.</p>
        <p style={{ marginTop: 8 }}>En cas de résiliation, le Marchand peut demander l&apos;export de ses données (liste clients, historique) dans les 30 jours suivant la fin du contrat. Passé ce délai, les données sont supprimées.</p>
        <p style={{ marginTop: 8 }}><strong>Propriété intellectuelle :</strong> La marque Wallio, le logo, le design et le code source sont la propriété exclusive de Mohamed Karim Mejbar. Le Marchand ne dispose d&apos;aucun droit sur ces éléments au-delà de l&apos;accès au service dans le cadre du présent contrat.</p>
        <p style={{ marginTop: 8 }}>Les éléments fournis par le Marchand (nom de l&apos;établissement, logo, photos) restent sa propriété. Il accorde à Wallio une licence gratuite, non exclusive et limitée à la durée du contrat pour les utiliser dans le cadre du service.</p>
      </Section>

      <Section title="Article 7 — Résiliation">
        <p><strong>Résiliation par le Marchand :</strong> Le Marchand peut résilier le contrat à tout moment avec un préavis de 30 jours, notifié par email à <strong>walliocard@gmail.com</strong>. La résiliation prend effet à l&apos;issue de la période d&apos;abonnement en cours. Aucun remboursement n&apos;est dû pour la période déjà payée.</p>
        <p style={{ marginTop: 8 }}><strong>Résiliation par Wallio :</strong> Wallio peut résilier ou suspendre le contrat immédiatement, sans préavis ni indemnité, en cas de :</p>
        <ul style={{ paddingLeft: 20, marginTop: 8 }}>
          <li>Non-paiement à l&apos;échéance</li>
          <li>Violation grave ou répétée des obligations du Marchand</li>
          <li>Utilisation frauduleuse, abusive ou illicite du service</li>
          <li>Fourniture de fausses informations lors de l&apos;inscription</li>
          <li>Atteinte à la réputation, à la marque ou aux intérêts de Wallio</li>
          <li>Injonction d&apos;une autorité judiciaire ou administrative</li>
          <li>Cessation d&apos;activité du Marchand</li>
        </ul>
        <p style={{ marginTop: 8 }}>Dans ces cas, aucun remboursement ne sera accordé et les sommes dues restent exigibles.</p>
      </Section>

      <Section title="Article 8 — Responsabilité et limitation">
        <p>La responsabilité de Wallio est expressément limitée aux dommages directs prouvés résultant d&apos;une faute de sa part. En tout état de cause, elle ne peut excéder le montant de l&apos;abonnement mensuel payé par le Marchand au cours du mois où le dommage est survenu.</p>
        <p style={{ marginTop: 8 }}>Wallio décline toute responsabilité pour :</p>
        <ul style={{ paddingLeft: 20, marginTop: 8 }}>
          <li>Les pertes d&apos;exploitation, manques à gagner, perte de clientèle ou préjudices indirects du Marchand</li>
          <li>Les interruptions du service dues à des tiers (Apple, Google, Vercel, opérateurs télécom)</li>
          <li>Les conséquences d&apos;un usage non conforme ou d&apos;une erreur de paramétrage par le Marchand</li>
          <li>Le contenu des notifications envoyées par le Marchand à ses clients</li>
          <li>Tout litige entre le Marchand et ses clients relatif au programme de fidélité</li>
          <li>Les événements de force majeure</li>
        </ul>
      </Section>

      <Section title="Article 9 — Confidentialité">
        <p>Chaque partie s&apos;engage à tenir confidentiels les informations et documents de l&apos;autre partie auxquels elle aurait accès dans le cadre du présent contrat (tarifs négociés, données techniques, informations commerciales). Cette obligation de confidentialité s&apos;applique pendant toute la durée du contrat et pendant 3 ans après sa résiliation.</p>
      </Section>

      <Section title="Article 10 — Force majeure">
        <p>Ni l&apos;une ni l&apos;autre des parties ne pourra être tenue responsable d&apos;un manquement à ses obligations résultant d&apos;un cas de force majeure, au sens de l&apos;article 269 du Code des Obligations et Contrats marocain, incluant notamment : pandémie, catastrophe naturelle, incendie, cyberattaque, panne des infrastructures des prestataires tiers, décision gouvernementale.</p>
        <p style={{ marginTop: 8 }}>La partie affectée devra notifier l&apos;autre partie dans les 48 heures et prendre toutes les mesures raisonnables pour limiter l&apos;impact.</p>
      </Section>

      <Section title="Article 11 — Modifications du contrat">
        <p>Wallio se réserve le droit de modifier le présent contrat à tout moment, avec un préavis de 30 jours notifié par email. La poursuite de l&apos;utilisation du service après expiration du préavis vaut acceptation des nouvelles conditions. En cas de désaccord, le Marchand peut résilier dans les conditions de l&apos;article 7.</p>
      </Section>

      <Section title="Article 12 — Droit applicable et règlement des litiges">
        <p>Le présent contrat est régi par le droit du Royaume du Maroc, et notamment par le Dahir des Obligations et Contrats (DOC) et la législation applicable au commerce électronique.</p>
        <p style={{ marginTop: 8 }}>En cas de litige, les parties s&apos;engagent à rechercher une solution amiable dans un délai de 30 jours à compter de la notification du différend par la partie la plus diligente.</p>
        <p style={{ marginTop: 8 }}>À défaut de résolution amiable, le litige sera soumis à la compétence exclusive du <strong>Tribunal de Commerce d&apos;Agadir (Maroc)</strong>, auquel les parties font expressément attribution de compétence, y compris pour les procédures d&apos;urgence ou de référé.</p>
        <p style={{ marginTop: 8 }}>Pour les marchands établis dans l&apos;Union Européenne, cette clause n&apos;affecte pas les droits impératifs dont ils bénéficient en vertu du droit de leur pays de résidence.</p>
      </Section>

      <Section title="Article 13 — Dispositions générales">
        <p><strong>Intégralité :</strong> Le présent contrat, conjointement avec les CGU et la Politique de confidentialité, constitue l&apos;intégralité de l&apos;accord entre les parties et remplace tout accord antérieur relatif à son objet.</p>
        <p style={{ marginTop: 8 }}><strong>Divisibilité :</strong> Si une clause du présent contrat est déclarée nulle ou inapplicable, les autres clauses demeurent en vigueur.</p>
        <p style={{ marginTop: 8 }}><strong>Non-renonciation :</strong> Le fait pour Wallio de ne pas se prévaloir d&apos;un manquement du Marchand ne constitue pas une renonciation à se prévaloir de ce manquement à l&apos;avenir.</p>
        <p style={{ marginTop: 8 }}><strong>Notifications :</strong> Toute notification formelle entre les parties sera adressée par email aux adresses renseignées lors de l&apos;inscription, et réputée reçue le jour de son envoi.</p>
      </Section>

      <Section title="Contact">
        <p>Pour toute question relative au présent contrat :</p>
        <p style={{ marginTop: 4 }}>Mohamed Karim Mejbar — Wallio</p>
        <p>Quartier Founty, Secteur R, N°266, Agadir, Maroc</p>
        <p><strong>walliocard@gmail.com</strong></p>
      </Section>

      <div style={{ marginTop: 48, paddingTop: 24, borderTop: "1px solid #E5E5EA", display: "flex", gap: 24, flexWrap: "wrap" }}>
        <Link href="/terms" style={{ fontSize: 14, color: "#007AFF" }}>CGU</Link>
        <Link href="/privacy" style={{ fontSize: 14, color: "#007AFF" }}>Politique de confidentialité</Link>
        <Link href="/legal" style={{ fontSize: 14, color: "#007AFF" }}>Mentions légales</Link>
      </div>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 40 }}>
      <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 12 }}>{title}</h2>
      <div style={{ color: "#3A3A3C", fontSize: 15 }}>{children}</div>
    </div>
  );
}
