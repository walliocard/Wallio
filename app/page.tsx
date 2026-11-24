"use client";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useLang } from "@/lib/lang-context";
import { REGIONS } from "@/lib/regions";

const WA_NUMBER = "212654768191";
const WA_BASE = `https://wa.me/${WA_NUMBER}`;
const wa = (msg: string) => `${WA_BASE}?text=${encodeURIComponent(msg)}`;

type Lang = "fr" | "en" | "ro";

const T = {
  fr: {
    navLogin: "Connexion", navCta: "Nous contacter",
    anchors: [
      { id: "comment", label: "Comment ça marche" },
      { id: "recompenses", label: "Récompenses" },
      { id: "dashboard", label: "Dashboard" },
      { id: "client", label: "Expérience client" },
      { id: "carte", label: "Personnalisation" },
      { id: "tarifs", label: "Tarifs" },
      { id: "faq", label: "FAQ" },
    ],
    heroBadge: "Apple Wallet · Google Wallet · NFC · QR Code",
    heroTitle1: "Vos habitués ne devraient pas",
    heroTitle2: "être des inconnus.",
    heroSub: "Wallio crée une carte de fidélité digitale pour chaque client qui scanne votre QR code ou approche son téléphone du tag NFC. Elle atterrit dans son Apple ou Google Wallet. Sans application à installer, ni pour vous ni pour lui.",
    heroCta1: "Découvrir sur WhatsApp",
    heroCta2: "Connexion",
    heroWa: "Bonjour, je souhaite découvrir Wallio pour mon commerce.",
    proofLabel: "Ils nous font confiance",
    proofStat: "200+ clients fidélisés · 4 commerces",
    problemTag: "Le constat",
    problemTitle1: "Vos clients viennent.",
    problemTitle2: "Peu reviennent.",
    problemPains: [
      { title: "La carte papier, personne ne la garde", body: "Elle finit au fond d'un tiroir. Votre client repart sans lien avec votre établissement." },
      { title: "Vos meilleurs clients vous sont invisibles", body: "Vous ne savez pas qui revient souvent, qui s'est arrêté, ni qui mérite une attention particulière." },
      { title: "Impossible de les relancer", body: "Sans données, vous ne pouvez ni envoyer un message de relance, ni récompenser ceux qui méritent de l'être." },
    ],
    problemSolution: "Wallio résout exactement ça.",
    howTag: "Fonctionnement",
    howTitle: "Trois étapes.",
    howTitle2: "Zéro friction.",
    howSub: "Le client n'installe rien. Vous ne changez pas vos habitudes.",
    howSteps: [
      { n: "01", title: "Le client scanne ou approche son téléphone", body: "Le QR code est imprimé sur votre carte comptoir. Le tag NFC est intégré dedans. Un seul geste suffit." },
      { n: "02", title: "Sa carte est créée en 30 secondes", body: "Il entre son prénom et son numéro. Sa carte apparaît directement dans son Apple ou Google Wallet." },
      { n: "03", title: "À chaque visite, son tampon est crédité", body: "Il présente sa carte Wallet, vous validez. Dès qu'il atteint son objectif, il reçoit sa récompense." },
    ],
    rewardTag: "Modes de récompenses",
    rewardTitle: "Un programme adapté",
    rewardTitle2: "à chaque commerce.",
    rewardSub: "Trois modes de fidélisation, configurables depuis votre dashboard en quelques secondes.",
    rewardCyclic: {
      tag: "Cyclique", sub: "Le classique amélioré",
      desc: "Un objectif, une récompense. Une fois l'objectif atteint, le compteur repart à zéro.",
      bullets: ["Simple à configurer et à expliquer", "Idéal pour les produits récurrents", "Un seul objectif à définir"],
    },
    rewardProg: {
      tag: "Progressif", sub: "Paliers cumulatifs",
      desc: "Les tampons s'accumulent définitivement. Chaque palier atteint débloque une récompense différente.",
      bullets: ["Engage les clients sur le long terme", "Paliers et récompenses entièrement configurables", "Les tampons ne se remettent jamais à zéro"],
    },
    rewardFlex: {
      tag: "Flex", sub: "Le choix revient au client",
      desc: "À mi-parcours, le client peut prendre une petite récompense immédiate ou continuer pour obtenir la grande.",
      bullets: ["Plus de liberté pour le client", "Deux récompenses à définir", "Idéal pour les établissements avec une offre variée"],
    },
    dashTag: "Dashboard gérant",
    dashTitle: "Tout ce dont vous avez besoin,",
    dashTitle2: "dans votre poche.",
    dashSub: "Wallio Pro est l'application du gérant, disponible sur iPhone et navigateur. Elle centralise tout ce qu'il vous faut pour piloter votre programme de fidélité.",
    dashFeats: [
      { title: "Statistiques et segmentation", body: "Activité sur 7 ou 30 jours, nombre de tampons distribués, meilleurs clients du mois. Segmentation automatique : actifs (revenus dans les 30 jours) vs inactifs (absents depuis plus de 30 jours)." },
      { title: "Suivi clients", body: "Chaque client a sa fiche : tampons actuels, historique des visites, date d'inscription. Ajustez ses tampons manuellement en cas d'erreur ou pour une attention particulière." },
      { title: "Notifications push", body: "Envoyez un message à tous vos clients, uniquement aux actifs ou uniquement aux inactifs. Un tap depuis votre dashboard — le message arrive directement sur leur téléphone." },
      { title: "Gestion de l'équipe", body: "Chaque membre de votre équipe a un accès PIN personnel. Ils peuvent valider les tampons et les récompenses via le scanner, sans accéder à votre dashboard ni à vos données commerciales." },
      { title: "Scanner intégré", body: "Validez les tampons et les récompenses directement depuis Wallio Pro, via le scanner QR intégré. Aucun matériel supplémentaire, aucune caisse enregistreuse à modifier." },
    ],
    clientTag: "Expérience client",
    clientTitle: "Vos clients ont tout",
    clientTitle2: "pour revenir.",
    clientSub: "Wallio crée un vrai lien entre vos clients et votre établissement. Carte de fidélité, messages, annuaire, parrainage — tout dans une application web, sans téléchargement.",
    clientFeats: [
      { title: "Carte Apple et Google Wallet", body: "Après le premier scan, le client ajoute sa carte en un tap dans son Apple ou Google Wallet. Elle se met à jour automatiquement à chaque tampon et envoie une notification. Aucune application à télécharger." },
      { title: "Messages de votre établissement", body: "Vous envoyez un message depuis votre dashboard, il arrive directement dans l'app de vos clients. Offres spéciales, actualités, messages personnalisés — lus au bon moment." },
      { title: "Découvrir", body: "Un annuaire des établissements Wallio, filtrable par secteur et ville. Vos nouveaux clients vous trouvent ici même sans vous connaître. Votre commerce est visible par tous les utilisateurs de la plateforme." },
      { title: "Y aller", body: "Un bouton \"Y aller\" est visible directement sur la carte de fidélité. Un tap ouvre Google Maps et guide votre client jusqu'à votre établissement." },
      { title: "Parrainage intégré", body: "Depuis sa carte, votre client voit un bouton \"Inviter un ami\". Il partage un lien unique. L'ami clique, scanne sa première carte, et tous les deux reçoivent automatiquement un tampon. Sans aucune action de votre part." },
    ],
    customTag: "Personnalisation",
    customTitle: "Votre carte,",
    customTitle2: "à votre image.",
    customSub: "Chaque détail est configurable depuis votre dashboard. Les modifications s'appliquent instantanément sur les cartes de vos clients.",
    customFeats: [
      { title: "Couleurs et logo", body: "Couleur de fond, de texte, de tampons, et votre logo en tête de carte." },
      { title: "Nombre de tampons", body: "Entre 5 et 50 tampons par cycle, selon votre programme." },
      { title: "Style des tampons", body: "Point, anneau, check, cœur, étoile, texte ou votre propre logo." },
      { title: "Bannière personnalisée", body: "Uploadez une photo de votre établissement. Elle apparaît comme fond de carte, avec les tampons dessinés dessus." },
      { title: "Champs informatifs", body: "Horaires, numéro, liens, directement visibles sur la carte." },
      { title: "Anti-doublon", body: "Délai minimum configurable entre deux tampons valides : 15 min, 1h, 4h, 8h ou 1 jour." },
    ],
    cardsTitle: "Quelques cartes créées avec Wallio",
    sectorsTag: "Secteurs", sectorsTitle: "Pour tous les commerces de proximité.",
    sectors: ["Café & Coffee shop", "Restaurant", "Barber shop", "Salon de beauté", "Boutique", "Salle de sport", "Boulangerie", "Institut & Spa"],
    tarifsTag: "Tarifs", tarifsTitle: "Simple et transparent.",
    tarifsSub: "Un seul abonnement, tout inclus. Plus vous vous engagez, plus vous économisez.",
    tarifsMonthly: "Mensuel", tarifsSix: "6 mois", tarifsAnnual: "Annuel",
    tarifsNoCommit: "Sans engagement", tarifsRecommended: "Recommandé",
    tarifsMonthEquiv: (p: number, c: string) => `${p} ${c}/mois`,
    tarifsCta: "Choisir cette formule",
    tarifsWaMo: (p: number, c: string) => `Bonjour, je suis intéressé par la formule mensuelle Wallio à ${p} ${c}/mois.`,
    tarifsWa6: (p: number, c: string) => `Bonjour, je suis intéressé par la formule 6 mois Wallio à ${p} ${c}.`,
    tarifsWaAn: (p: number, c: string) => `Bonjour, je suis intéressé par la formule annuelle Wallio à ${p} ${c}/an.`,
    tarifsIncludedTitle: "Tout inclus dans les trois formules",
    tarifsIncluded: [
      "Carte de fidélité Apple Wallet et Google Wallet",
      "Carte comptoir haute résolution (QR code + NFC optionnel)",
      "Dashboard gérant sur iPhone et navigateur",
      "Notifications push illimitées",
      "Automatisations anniversaire et relance",
      "Gestion de l'équipe avec accès PIN",
      "Annuaire Wallio",
      "Support dédié sur WhatsApp",
    ],
    faqTag: "FAQ", faqTitle: "Questions fréquentes",
    faqCta: "Autre question ? Discutons sur WhatsApp",
    faqWa: "Bonjour, j'ai une question sur Wallio.",
    faqs: [
      { q: "Mes clients doivent-ils télécharger une application ?", a: "Non. Vos clients accèdent à leur carte via un lien web, directement depuis leur navigateur. La carte peut ensuite être ajoutée en un tap dans Apple Wallet ou Google Wallet, sans passer par l'App Store." },
      { q: "Comment fonctionne le tag NFC ?", a: "Le client approche son téléphone à environ 4 cm du tag NFC intégré à votre carte comptoir. En moins d'une seconde, sa carte de fidélité est créée ou mise à jour. Aucune application n'est nécessaire." },
      { q: "Qu'est-ce que la carte comptoir ?", a: "C'est un fichier d'impression haute résolution que Wallio génère pour vous. Vous l'imprimez et le posez sur votre comptoir. Il contient votre QR code unique et peut intégrer un tag NFC. C'est le seul support physique dont vous avez besoin." },
      { q: "Quelle est la différence entre les trois modes de récompenses ?", a: "Le mode cyclique remet le compteur à zéro après chaque récompense. Le mode progressif accumule les tampons définitivement et débloque des paliers successifs. Le mode Flex laisse le choix au client à mi-parcours : petite récompense maintenant ou continuer pour la grande." },
      { q: "Comment mes employés peuvent-ils valider des tampons ?", a: "Chaque membre de l'équipe dispose d'un accès PIN via l'application Wallio Pro. Ils valident les tampons via le scanner QR intégré, sans accéder à vos données commerciales ni à votre dashboard complet." },
      { q: "Puis-je personnaliser ma carte de fidélité ?", a: "Oui, entièrement. Depuis votre dashboard, vous choisissez les couleurs, uploadez votre logo, définissez le nombre de tampons et leur style, et uploadez une photo de votre établissement comme bannière. Chaque modification s'applique instantanément." },
      { q: "Les notifications sont-elles automatiques ?", a: "Oui. Apple Wallet envoie une notification à chaque nouveau tampon. Pour les messages marketing, Wallio envoie automatiquement un message d'anniversaire ou une relance si un client n'est pas revenu depuis X jours." },
      { q: "Comment commencer avec Wallio ?", a: "Contactez-nous sur WhatsApp. Nous configurons votre compte, générons votre carte comptoir et vous accompagnons lors de vos premières utilisations. L'installation prend moins d'une heure." },
    ],
    ctaTitle: "Prêt à fidéliser vos clients ?",
    ctaSub: "Opérationnel en moins d'une heure. Sans matériel, sans installation.",
    ctaBtn: "Démarrer sur WhatsApp",
    ctaWa: "Bonjour, je souhaite démarrer avec Wallio pour mon commerce.",
    footerLinks: [
      { href: "/privacy", label: "Confidentialité" }, { href: "/terms", label: "CGU" },
      { href: "/legal", label: "Mentions légales" }, { href: "mailto:wallio.card@gmail.com", label: "wallio.card@gmail.com" },
    ],
  },
  en: {
    navLogin: "Sign in", navCta: "Contact us",
    anchors: [
      { id: "comment", label: "How it works" },
      { id: "recompenses", label: "Rewards" },
      { id: "dashboard", label: "Dashboard" },
      { id: "client", label: "Client experience" },
      { id: "carte", label: "Customization" },
      { id: "tarifs", label: "Pricing" },
      { id: "faq", label: "FAQ" },
    ],
    heroBadge: "Apple Wallet · Google Wallet · NFC · QR Code",
    heroTitle1: "Your regulars shouldn't",
    heroTitle2: "be strangers.",
    heroSub: "Wallio automatically creates a digital loyalty card for every customer who scans your QR code or taps your NFC tag. It lands in their Apple or Google Wallet. No app to install, for you or for them.",
    heroCta1: "Discover on WhatsApp",
    heroCta2: "Sign in",
    heroWa: "Hello, I'd like to discover Wallio for my business.",
    proofLabel: "Trusted by",
    proofStat: "200+ customers enrolled · 4 businesses",
    problemTag: "The reality",
    problemTitle1: "Customers come in.",
    problemTitle2: "Few come back.",
    problemPains: [
      { title: "Paper cards get lost", body: "They end up in a drawer. Your customer leaves with no connection to your business." },
      { title: "Your best customers are invisible", body: "You don't know who comes back often, who stopped, or who deserves special attention." },
      { title: "No way to re-engage them", body: "Without data, you can't send a re-engagement message or reward the customers who deserve it." },
    ],
    problemSolution: "Wallio solves exactly that.",
    howTag: "How it works",
    howTitle: "Three steps.",
    howTitle2: "Zero friction.",
    howSub: "Customers install nothing. You change nothing about your routine.",
    howSteps: [
      { n: "01", title: "The customer scans or taps their phone", body: "The QR code is printed on your counter card. The NFC tag is built right in. One gesture is all it takes." },
      { n: "02", title: "Their card is created in 30 seconds", body: "They enter their name and phone number. Their card appears directly in Apple or Google Wallet." },
      { n: "03", title: "Every visit, their stamp is credited", body: "They show their Wallet card, you validate. Once they hit their goal, they receive their reward." },
    ],
    rewardTag: "Reward modes",
    rewardTitle: "A programme built for",
    rewardTitle2: "every business.",
    rewardSub: "Three loyalty modes, configurable from your dashboard in seconds.",
    rewardCyclic: {
      tag: "Cyclic", sub: "The classic, improved",
      desc: "One goal, one reward. Once the target is reached, the counter resets and the cycle starts again.",
      bullets: ["Simple to set up and explain", "Perfect for recurring purchases", "Just one goal to define"],
    },
    rewardProg: {
      tag: "Progressive", sub: "Cumulative tiers",
      desc: "Stamps accumulate permanently. Each tier unlocked brings a different reward.",
      bullets: ["Builds long-term engagement", "Fully configurable tiers and rewards", "Stamps never reset"],
    },
    rewardFlex: {
      tag: "Flex", sub: "The customer chooses",
      desc: "At the halfway point, the customer can take a small immediate reward or keep going for the bigger one.",
      bullets: ["More freedom for the customer", "Two rewards to define", "Great for businesses with a varied offer"],
    },
    dashTag: "Manager dashboard",
    dashTitle: "Everything you need,",
    dashTitle2: "in your pocket.",
    dashSub: "Wallio Pro is the manager app, available on iPhone and browser. It centralises everything you need to run your loyalty programme.",
    dashFeats: [
      { title: "Stats and segmentation", body: "7 or 30-day activity, stamps distributed, top customers. Automatic segmentation: active (back within 30 days) vs inactive (absent for more than 30 days)." },
      { title: "Customer tracking", body: "Each customer has a profile: current stamps, visit history, registration date. Adjust stamps manually for corrections or special attention." },
      { title: "Targeted push notifications", body: "Send a message to all your customers, only active ones, or only inactive ones. One tap from your dashboard — it lands directly on their phone." },
      { title: "Team management", body: "Each team member has a personal PIN access. They can validate stamps and rewards via the scanner, without accessing your dashboard or business data." },
      { title: "Built-in scanner", body: "Validate stamps and rewards directly from Wallio Pro via the built-in QR scanner. No extra hardware, no changes to your checkout." },
    ],
    clientTag: "Client experience",
    clientTitle: "Your customers have everything",
    clientTitle2: "to come back.",
    clientSub: "Wallio creates a real connection between your customers and your business. Loyalty card, messages, directory, referral — all in a web app, no download.",
    clientFeats: [
      { title: "Apple and Google Wallet card", body: "After the first scan, the customer adds their card with one tap in Apple or Google Wallet. It updates automatically with every stamp and sends a notification. No app to download." },
      { title: "Messages from your business", body: "You send a message from your dashboard, it arrives directly in your customers' app. Special offers, news, personalised messages — read at the right moment." },
      { title: "Discover", body: "A directory of Wallio venues, filterable by sector and city. New customers find you here even without knowing you. Your business is visible to all platform users." },
      { title: "Get Directions", body: "On every venue page, a \"Get Directions\" button opens GPS navigation straight to your address. One tap, and your customer is guided to your door." },
      { title: "Built-in referral", body: "From their card, your customer sees an \"Invite a friend\" button. They share a unique link. The friend clicks, scans their first card, and both automatically receive a stamp. No action needed from you." },
    ],
    customTag: "Customization",
    customTitle: "Your card,",
    customTitle2: "your identity.",
    customSub: "Every detail is configurable from your dashboard. Changes apply instantly on your customers' cards.",
    customFeats: [
      { title: "Colors and logo", body: "Background color, text color, stamp color, and your logo at the top of the card." },
      { title: "Number of stamps", body: "Between 5 and 50 stamps per cycle, depending on your programme." },
      { title: "Stamp style", body: "Dot, ring, check, heart, star, text or your own logo." },
      { title: "Custom banner", body: "Upload a photo of your venue. It appears as the card background, with stamps drawn on top." },
      { title: "Info fields", body: "Opening hours, phone number, links, directly visible on the card." },
      { title: "Dedup protection", body: "Minimum delay between valid stamps: 15 min, 1h, 4h, 8h or 1 day." },
    ],
    cardsTitle: "A few cards built with Wallio",
    sectorsTag: "Industries", sectorsTitle: "For every local business.",
    sectors: ["Café & Coffee shop", "Restaurant", "Barber shop", "Beauty salon", "Boutique", "Gym", "Bakery", "Spa & Wellness"],
    tarifsTag: "Pricing", tarifsTitle: "Simple and transparent.",
    tarifsSub: "One subscription, everything included. The longer you commit, the more you save.",
    tarifsMonthly: "Monthly", tarifsSix: "6 months", tarifsAnnual: "Annual",
    tarifsNoCommit: "No commitment", tarifsRecommended: "Recommended",
    tarifsMonthEquiv: (p: number, c: string) => `${p} ${c}/month`,
    tarifsCta: "Choose this plan",
    tarifsWaMo: (p: number, c: string) => `Hello, I'm interested in the Wallio monthly plan at ${p} ${c}/month.`,
    tarifsWa6: (p: number, c: string) => `Hello, I'm interested in the Wallio 6-month plan at ${p} ${c}.`,
    tarifsWaAn: (p: number, c: string) => `Hello, I'm interested in the Wallio annual plan at ${p} ${c}/year.`,
    tarifsIncludedTitle: "Everything included in all three plans",
    tarifsIncluded: [
      "Apple Wallet and Google Wallet loyalty card",
      "High-resolution counter card (QR code + optional NFC)",
      "Manager dashboard on iPhone and browser",
      "Unlimited push notifications",
      "Birthday and re-engagement automations",
      "Team management with PIN access",
      "Wallio directory listing",
      "Dedicated WhatsApp support",
    ],
    faqTag: "FAQ", faqTitle: "Frequently asked questions",
    faqCta: "Another question? Let's chat on WhatsApp",
    faqWa: "Hello, I have a question about Wallio.",
    faqs: [
      { q: "Do my customers need to download an app?", a: "No. Customers access their card via a web link, directly from their browser. The card can then be added with one tap to Apple Wallet or Google Wallet, no App Store required." },
      { q: "How does the NFC tag work?", a: "The customer holds their phone about 4 cm from the NFC tag built into your counter card. In under a second, their loyalty card is created or updated. No app needed." },
      { q: "What is the counter card?", a: "It's a high-resolution print file Wallio generates for you. You print it and place it on your counter. It contains your unique QR code and can include an NFC tag. It's the only physical support you need." },
      { q: "What's the difference between the three reward modes?", a: "Cyclic resets the counter after each reward. Progressive accumulates stamps permanently and unlocks successive tiers. Flex lets the customer choose at the halfway point: small reward now or continue for the bigger one." },
      { q: "How can my staff validate stamps?", a: "Each team member has a PIN access via the Wallio Pro app. They validate stamps with the built-in QR scanner, without accessing your business data or full dashboard." },
      { q: "Can I customise my loyalty card?", a: "Yes, fully. From your dashboard you choose colors, upload your logo, define the number of stamps and their style, and upload a photo as a banner. Every change applies instantly." },
      { q: "Are notifications automatic?", a: "Yes. Apple Wallet sends a notification with every new stamp. For marketing, Wallio automatically sends a birthday message or re-engagement if a customer hasn't returned in X days." },
      { q: "How do I get started with Wallio?", a: "Contact us on WhatsApp. We configure your account, generate your counter card and guide you through the first uses. Setup takes less than an hour." },
    ],
    ctaTitle: "Ready to build customer loyalty?",
    ctaSub: "Up and running in under an hour. No hardware, no installation.",
    ctaBtn: "Start on WhatsApp",
    ctaWa: "Hello, I'd like to get started with Wallio for my business.",
    footerLinks: [
      { href: "/privacy", label: "Privacy" }, { href: "/terms", label: "Terms" },
      { href: "/legal", label: "Legal" }, { href: "mailto:wallio.card@gmail.com", label: "wallio.card@gmail.com" },
    ],
  },
  ro: {
    navLogin: "Autentificare", navCta: "Contactați-ne",
    anchors: [
      { id: "comment", label: "Cum funcționează" },
      { id: "recompenses", label: "Recompense" },
      { id: "dashboard", label: "Dashboard" },
      { id: "client", label: "Experiența clientului" },
      { id: "carte", label: "Personalizare" },
      { id: "tarifs", label: "Tarife" },
      { id: "faq", label: "FAQ" },
    ],
    heroBadge: "Apple Wallet · Google Wallet · NFC · QR Code",
    heroTitle1: "Clienții fideli nu ar trebui",
    heroTitle2: "să fie străini.",
    heroSub: "Wallio creează automat un card de fidelitate digital pentru fiecare client care scanează codul QR sau apropie telefonul de tag-ul NFC. Cardul ajunge în Apple sau Google Wallet, fără nicio aplicație de instalat.",
    heroCta1: "Descoperiți pe WhatsApp",
    heroCta2: "Autentificare",
    heroWa: "Bună ziua, doresc să descopăr Wallio pentru afacerea mea.",
    proofLabel: "Ne acordă încredere",
    proofStat: "200+ clienți fidelizați · 4 afaceri",
    problemTag: "Realitatea",
    problemTitle1: "Clienții vin.",
    problemTitle2: "Puțini revin.",
    problemPains: [
      { title: "Cardul de hârtie se pierde", body: "Ajunge în fundul unui sertar. Clientul pleacă fără nicio legătură cu afacerea dvs." },
      { title: "Cei mai buni clienți sunt invizibili", body: "Nu știți cine revine des, cine s-a oprit sau cine merită o atenție specială." },
      { title: "Imposibil să îi contactați", body: "Fără date, nu puteți trimite un mesaj de reactivare sau recompensa clienții care merită." },
    ],
    problemSolution: "Wallio rezolvă exact asta.",
    howTag: "Funcționare",
    howTitle: "Trei pași.",
    howTitle2: "Zero fricțiune.",
    howSub: "Clientul nu instalează nimic. Dvs. nu vă schimbați obiceiurile.",
    howSteps: [
      { n: "01", title: "Clientul scanează sau apropie telefonul", body: "Codul QR este imprimat pe cardul de tejghea. Tag-ul NFC este integrat în el. Un singur gest este suficient." },
      { n: "02", title: "Cardul este creat în 30 de secunde", body: "Introduce prenumele și numărul de telefon. Cardul apare direct în Apple sau Google Wallet." },
      { n: "03", title: "La fiecare vizită, ștampila este creditată", body: "Prezintă cardul Wallet, dvs. validați. Când atinge obiectivul, primește recompensa." },
    ],
    rewardTag: "Moduri de recompensă",
    rewardTitle: "Un program adaptat",
    rewardTitle2: "fiecărei afaceri.",
    rewardSub: "Trei moduri de fidelizare, configurabile din dashboard în câteva secunde.",
    rewardCyclic: {
      tag: "Ciclic", sub: "Clasicul îmbunătățit",
      desc: "Un obiectiv, o recompensă. Odată atins obiectivul, contorul repornește.",
      bullets: ["Simplu de configurat și explicat", "Ideal pentru produse recurente", "Un singur obiectiv de definit"],
    },
    rewardProg: {
      tag: "Progresiv", sub: "Niveluri cumulative",
      desc: "Ștampilele se acumulează definitiv. Fiecare nivel atins deblochează o recompensă diferită.",
      bullets: ["Angajament pe termen lung", "Niveluri și recompense complet configurabile", "Ștampilele nu se resetează niciodată"],
    },
    rewardFlex: {
      tag: "Flex", sub: "Clientul alege",
      desc: "La jumătatea parcursului, clientul poate lua o mică recompensă imediată sau continua pentru cea mare.",
      bullets: ["Mai multă libertate pentru client", "Două recompense de definit", "Ideal pentru afaceri cu ofertă variată"],
    },
    dashTag: "Dashboard manager",
    dashTitle: "Tot ce aveți nevoie,",
    dashTitle2: "în buzunar.",
    dashSub: "Wallio Pro este aplicația managerului, disponibilă pe iPhone și browser. Centralizează tot ce aveți nevoie pentru programul de fidelitate.",
    dashFeats: [
      { title: "Statistici și segmentare", body: "Activitate pe 7 sau 30 de zile, ștampile distribuite, cei mai buni clienți. Segmentare automată: activi (reveniți în 30 de zile) vs inactivi (absenți de peste 30 de zile)." },
      { title: "Urmărire clienți", body: "Fiecare client are o fișă: ștampile curente, istoricul vizitelor, data înscrierii. Ajustați ștampilele manual pentru corecții sau atenție specială." },
      { title: "Notificări push țintite", body: "Trimiteți un mesaj tuturor clienților, doar activi sau doar inactivi. Un tap din dashboard — ajunge direct pe telefonul lor." },
      { title: "Gestionarea echipei", body: "Fiecare membru al echipei are acces PIN personal. Pot valida ștampile și recompense prin scanner, fără acces la dashboard sau date comerciale." },
      { title: "Scanner integrat", body: "Validați ștampile și recompense direct din Wallio Pro, prin scanerul QR integrat. Niciun echipament suplimentar, nicio modificare la casă." },
    ],
    clientTag: "Experiența clientului",
    clientTitle: "Clienții dvs. au tot",
    clientTitle2: "ca să revină.",
    clientSub: "Wallio creează o legătură reală între clienții dvs. și localul dvs. Card de fidelitate, mesaje, director, recomandare — totul într-o aplicație web, fără descărcare.",
    clientFeats: [
      { title: "Card Apple și Google Wallet", body: "După prima scanare, clientul adaugă cardul cu un tap în Apple sau Google Wallet. Se actualizează automat la fiecare ștampilă și trimite o notificare. Nicio aplicație de descărcat." },
      { title: "Mesaje de la localul dvs.", body: "Trimiteți un mesaj din dashboard, ajunge direct în aplicația clienților. Oferte speciale, noutăți, mesaje personalizate — citite la momentul potrivit." },
      { title: "Descoperă", body: "Un director al localurilor Wallio, filtrabil pe sector și oraș. Clienți noi vă găsesc chiar fără să vă cunoască. Localul dvs. este vizibil tuturor utilizatorilor platformei." },
      { title: "Mergi acolo", body: "Pe fiecare fișă de local, un buton \"Mergi acolo\" deschide navigarea GPS direct spre adresa dvs. Un singur tap și clientul este ghidat până la dvs." },
      { title: "Recomandare integrată", body: "Din cardul său, clientul vede un buton \"Invită un prieten\". Distribuie un link unic. Prietenul dă clic, scanează primul card, și amândoi primesc automat o ștampilă. Fără nicio acțiune din partea dvs." },
    ],
    customTag: "Personalizare",
    customTitle: "Cardul dvs.,",
    customTitle2: "imaginea dvs.",
    customSub: "Fiecare detaliu este configurabil din dashboard. Modificările se aplică instant pe cardurile clienților.",
    customFeats: [
      { title: "Culori și logo", body: "Culoarea fondului, textului, ștampilelor și logo-ul dvs. în capul cardului." },
      { title: "Număr de ștampile", body: "Între 5 și 50 de ștampile pe ciclu, în funcție de programul dvs." },
      { title: "Stilul ștampilelor", body: "Punct, inel, bifare, inimă, stea, text sau propriul logo." },
      { title: "Banner personalizat", body: "Încărcați o fotografie a localului. Apare ca fond de card, cu ștampilele desenate deasupra." },
      { title: "Câmpuri informative", body: "Program, număr de telefon, linkuri, direct vizibile pe card." },
      { title: "Protecție anti-duplicare", body: "Interval minim configurabil: 15 min, 1h, 4h, 8h sau 1 zi." },
    ],
    cardsTitle: "Câteva carduri create cu Wallio",
    sectorsTag: "Sectoare", sectorsTitle: "Pentru toate localurile de proximitate.",
    sectors: ["Cafenea & Coffee shop", "Restaurant", "Frizerie", "Salon de frumusețe", "Boutique", "Sală de sport", "Brutărie", "Institut & Spa"],
    tarifsTag: "Tarife", tarifsTitle: "Simplu și transparent.",
    tarifsSub: "Un singur abonament, totul inclus. Cu cât vă angajați mai mult, cu atât economisiți.",
    tarifsMonthly: "Lunar", tarifsSix: "6 luni", tarifsAnnual: "Anual",
    tarifsNoCommit: "Fără angajament", tarifsRecommended: "Recomandat",
    tarifsMonthEquiv: (p: number, c: string) => `${p} ${c}/lună`,
    tarifsCta: "Alegeți această formulă",
    tarifsWaMo: (p: number, c: string) => `Bună ziua, sunt interesat de formula lunară Wallio la ${p} ${c}/lună.`,
    tarifsWa6: (p: number, c: string) => `Bună ziua, sunt interesat de formula 6 luni Wallio la ${p} ${c}.`,
    tarifsWaAn: (p: number, c: string) => `Bună ziua, sunt interesat de formula anuală Wallio la ${p} ${c}/an.`,
    tarifsIncludedTitle: "Totul inclus în toate trei formulele",
    tarifsIncluded: [
      "Card de fidelitate Apple Wallet și Google Wallet",
      "Card tejghea înaltă rezoluție (cod QR + NFC opțional)",
      "Dashboard manager pe iPhone și browser",
      "Notificări push nelimitate",
      "Automatizări zi de naștere și reactivare",
      "Gestionarea echipei cu acces PIN",
      "Listing în directorul Wallio",
      "Suport dedicat pe WhatsApp",
    ],
    faqTag: "FAQ", faqTitle: "Întrebări frecvente",
    faqCta: "Altă întrebare? Discutați pe WhatsApp",
    faqWa: "Bună ziua, am o întrebare despre Wallio.",
    faqs: [
      { q: "Clienții mei trebuie să descarce o aplicație?", a: "Nu. Clienții accesează cardul printr-un link web, direct din browser. Cardul poate fi adăugat cu un tap în Apple Wallet sau Google Wallet, fără App Store." },
      { q: "Cum funcționează tag-ul NFC?", a: "Clientul apropie telefonul la aproximativ 4 cm de tag-ul NFC integrat în cardul de tejghea. În mai puțin de o secundă, cardul de fidelitate este creat sau actualizat. Nicio aplicație necesară." },
      { q: "Ce este cardul de tejghea?", a: "Este un fișier de imprimare înaltă rezoluție pe care Wallio îl generează pentru dvs. Îl imprimați și îl puneți pe tejghea. Conține codul QR unic și poate include un tag NFC. Este singurul suport fizic de care aveți nevoie." },
      { q: "Care este diferența dintre cele trei moduri de recompensă?", a: "Ciclic resetează contorul după fiecare recompensă. Progresiv acumulează ștampilele definitiv și deblochează niveluri succesive. Flex lasă clientul să aleagă la jumătatea parcursului: mică recompensă acum sau continuă pentru cea mare." },
      { q: "Cum pot angajații mei să valideze ștampilele?", a: "Fiecare membru al echipei are acces PIN prin aplicația Wallio Pro. Validează ștampile cu scanerul QR integrat, fără acces la datele dvs. comerciale." },
      { q: "Pot personaliza cardul de fidelitate?", a: "Da, complet. Din dashboard alegeți culorile, încărcați logo-ul, definiți numărul și stilul ștampilelor, și o fotografie ca banner. Fiecare modificare se aplică instant." },
      { q: "Notificările sunt automate?", a: "Da. Apple Wallet trimite o notificare la fiecare ștampilă nouă. Wallio trimite automat un mesaj de ziua clientului sau o reactivare dacă nu a mai venit de X zile." },
      { q: "Cum încep cu Wallio?", a: "Contactați-ne pe WhatsApp. Configurăm contul, generăm cardul de tejghea și vă ghidăm la primele utilizări. Instalarea durează mai puțin de o oră." },
    ],
    ctaTitle: "Gata să vă fidelizați clienții?",
    ctaSub: "Funcțional în mai puțin de o oră. Fără echipament, fără instalare.",
    ctaBtn: "Începeți pe WhatsApp",
    ctaWa: "Bună ziua, doresc să încep cu Wallio pentru afacerea mea.",
    footerLinks: [
      { href: "/privacy", label: "Confidențialitate" }, { href: "/terms", label: "Termeni" },
      { href: "/legal", label: "Mențiuni legale" }, { href: "mailto:wallio.card@gmail.com", label: "wallio.card@gmail.com" },
    ],
  },
} satisfies Record<Lang, object>;

function useReveal() {
  useEffect(() => {
    document.querySelectorAll("[data-stagger]").forEach(parent => {
      Array.from(parent.children).forEach((child, i) => {
        (child as HTMLElement).style.transitionDelay = `${i * 0.07}s`;
        child.setAttribute("data-reveal", "");
      });
    });
    const els = document.querySelectorAll("[data-reveal]");
    const io = new IntersectionObserver(
      entries => entries.forEach(e => {
        if (e.isIntersecting) {
          requestAnimationFrame(() => (e.target as HTMLElement).classList.add("revealed"));
          io.unobserve(e.target);
        }
      }),
      { threshold: 0.08, rootMargin: "0px 0px -16px 0px" }
    );
    els.forEach(el => io.observe(el));
    return () => io.disconnect();
  }, []);
}

const QR_DOTS = [1,0,1,0,1,1,0,1,0,0,1,1,0,0,1,1,0,1,0,1,1,0,0,1,0,0,1,1,0,0,1,0,1,0,1,0,0,1,1,0,1,0,0,1,1,0,0,1];

function DashPreview({ feat }: { feat: number }) {
  const C: React.CSSProperties = { width:"100%", display:"flex", flexDirection:"column" };
  const previews: React.ReactNode[] = [
    // 0 — Suivi clients
    <div style={{ background:"#fff",borderRadius:20,padding:24,boxShadow:"0 8px 32px rgba(0,0,0,.08)",display:"flex",flexDirection:"column",gap:0 }}>
      <div style={{ display:"flex",alignItems:"center",gap:12,marginBottom:20 }}>
        <div style={{ width:46,height:46,borderRadius:"50%",background:"linear-gradient(135deg,#EEF0FF,#C7D2FE)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,fontWeight:700,color:"#4B4FD6",animation:"fadeUp .4s .1s both",flexShrink:0 }}>FB</div>
        <div style={{ flex:1,animation:"fadeUp .4s .18s both" }}>
          <div style={{ fontSize:14,fontWeight:700,color:"#1D1D1F" }}>Fatima B.</div>
          <div style={{ fontSize:12,color:"#8E8E93" }}>Dernière visite il y a 2j</div>
        </div>
        <div style={{ background:"rgba(52,199,89,.10)",color:"#34C759",fontSize:11,fontWeight:700,padding:"3px 10px",borderRadius:20,animation:"fadeUp .4s .26s both",flexShrink:0 }}>Actif</div>
      </div>
      <div style={{ animation:"fadeUp .4s .32s both" }}>
        <div style={{ display:"flex",justifyContent:"space-between",marginBottom:8 }}>
          <span style={{ fontSize:12,color:"#6E6E73" }}>Tampons</span>
          <span style={{ fontSize:12,fontWeight:700 }}>7 / 10</span>
        </div>
        <div style={{ height:5,background:"rgba(0,0,0,.08)",borderRadius:99,overflow:"hidden",marginBottom:14 }}>
          <div style={{ height:"100%",width:"70%",background:"linear-gradient(90deg,#007AFF,#8B5CF6)",borderRadius:99,animation:"fillProg .8s cubic-bezier(.16,1,.3,1) .5s both" }} />
        </div>
        <div style={{ display:"flex",gap:5,flexWrap:"wrap" }}>
          {Array.from({length:10}).map((_,i)=><div key={i} style={{ width:22,height:22,borderRadius:"50%",background:i<7?"linear-gradient(135deg,#007AFF,#8B5CF6)":"rgba(0,0,0,.08)",animation:i<7?`stampPop .4s cubic-bezier(.34,1.5,.64,1) ${.5+i*.05}s both`:"none" }} />)}
        </div>
      </div>
    </div>,

    // 1 — Stats
    <div style={{ background:"#fff",borderRadius:20,padding:24,boxShadow:"0 8px 32px rgba(0,0,0,.08)" }}>
      <div style={{ fontSize:11,fontWeight:700,color:"#8E8E93",letterSpacing:".07em",textTransform:"uppercase",marginBottom:20,animation:"fadeUp .4s .1s both" }}>Activité — 7 derniers jours</div>
      <div style={{ display:"flex",alignItems:"flex-end",gap:6,height:84,marginBottom:16 }}>
        {[38,52,31,67,44,58,29].map((v,i)=>(
          <div key={i} style={{ flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:5 }}>
            <div style={{ width:"100%",background:i===3?"linear-gradient(180deg,#007AFF,#8B5CF6)":"rgba(0,122,255,.13)",borderRadius:"4px 4px 0 0",height:`${v/67*72}px`,transformOrigin:"bottom",animation:`scaleBarUp .55s cubic-bezier(.16,1,.3,1) ${.15+i*.07}s both` }} />
            <span style={{ fontSize:9,color:"#AEAEB2",fontWeight:600 }}>{"LMMJVSD"[i]}</span>
          </div>
        ))}
      </div>
      <div style={{ display:"flex",gap:10,animation:"fadeUp .4s .7s both" }}>
        <div style={{ flex:1,background:"rgba(52,199,89,.08)",borderRadius:12,padding:"10px 12px" }}>
          <div style={{ fontSize:11,color:"#34C759",fontWeight:700,marginBottom:2 }}>Actifs</div>
          <div style={{ fontSize:24,fontWeight:800,color:"#1D1D1F",letterSpacing:-.5 }}>78%</div>
        </div>
        <div style={{ flex:1,background:"rgba(249,115,22,.08)",borderRadius:12,padding:"10px 12px" }}>
          <div style={{ fontSize:11,color:"#F97316",fontWeight:700,marginBottom:2 }}>À risque</div>
          <div style={{ fontSize:24,fontWeight:800,color:"#1D1D1F",letterSpacing:-.5 }}>14</div>
        </div>
      </div>
    </div>,

    // 2 — Notifications
    <div style={{ background:"#1D1D1F",borderRadius:20,padding:20,overflow:"hidden" }}>
      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18,animation:"fadeUp .3s .05s both" }}>
        <span style={{ fontSize:11,color:"rgba(255,255,255,.45)",fontWeight:600 }}>9:41</span>
        <div style={{ display:"flex",gap:3 }}>
          {[12,10,16].map((w,i)=><div key={i} style={{ width:w,height:4,background:`rgba(255,255,255,${i===2?.85:.35})`,borderRadius:2 }}/>)}
        </div>
      </div>
      {[
        {delay:.35,title:"Wallio · Nomade Café",body:"Nouveau tampon ! Il vous reste 3 avant votre café offert."},
        {delay:.7,title:"Wallio · Bon anniversaire",body:"Double tampon offert aujourd'hui. Profitez-en !"},
      ].map((n,i)=>(
        <div key={i} style={{ background:"rgba(255,255,255,.10)",borderRadius:14,padding:"12px 14px",marginBottom:8,animation:`notifDrop .5s cubic-bezier(.16,1,.3,1) ${n.delay}s both` }}>
          <div style={{ fontSize:11,fontWeight:700,color:"rgba(255,255,255,.45)",marginBottom:5 }}>{n.title}</div>
          <div style={{ fontSize:12,color:"rgba(255,255,255,.85)",lineHeight:1.5 }}>{n.body}</div>
        </div>
      ))}
    </div>,

    // 3 — Automatisations
    <div style={{ display:"flex",flexDirection:"column",gap:10 }}>
      {[
        {delay:.2,color:"#007AFF",tag:"Anniversaire · Automatique",msg:"Bon anniversaire ! On vous offre un double tampon aujourd'hui."},
        {delay:.5,color:"#F97316",tag:"Relance · +30 jours inactif",msg:"Vous nous manquez ! Il vous reste 2 tampons avant votre prochaine récompense."},
      ].map((a,i)=>(
        <div key={i} style={{ background:"#fff",borderRadius:16,padding:"16px 18px",borderLeft:`3px solid ${a.color}`,boxShadow:"0 4px 16px rgba(0,0,0,.06)",animation:`cardSlide .5s cubic-bezier(.16,1,.3,1) ${a.delay}s both` }}>
          <div style={{ fontSize:11,fontWeight:700,color:a.color,marginBottom:5,letterSpacing:".04em" }}>{a.tag}</div>
          <div style={{ fontSize:13,color:"#1D1D1F",lineHeight:1.5 }}>{a.msg}</div>
        </div>
      ))}
      <div style={{ background:"rgba(0,0,0,.03)",borderRadius:12,padding:"11px 14px",display:"flex",alignItems:"center",gap:10,animation:"fadeUp .4s .9s both" }}>
        <div style={{ width:7,height:7,borderRadius:"50%",background:"#34C759",flexShrink:0 }}/>
        <span style={{ fontSize:11.5,color:"#6E6E73" }}>2 automatisations actives · 0 action manuelle</span>
      </div>
    </div>,

    // 4 — Équipe
    <div style={{ background:"#fff",borderRadius:20,padding:24,boxShadow:"0 8px 32px rgba(0,0,0,.08)" }}>
      <div style={{ fontSize:13,fontWeight:700,color:"#1D1D1F",marginBottom:22,animation:"fadeUp .4s .1s both" }}>Équipe — 3 membres</div>
      <div style={{ display:"flex",gap:10,marginBottom:28 }}>
        {[{n:"Sara",r:"Barista",c:"#007AFF",bg:"rgba(0,122,255,.10)"},{n:"Ahmed",r:"Barista",c:"#8B5CF6",bg:"rgba(139,92,246,.10)"},{n:"Leila",r:"Manager",c:"#F97316",bg:"rgba(249,115,22,.10)"}].map((m,i)=>(
          <div key={i} style={{ flex:1,textAlign:"center",animation:`fadeUp .4s cubic-bezier(.16,1,.3,1) ${.2+i*.12}s both` }}>
            <div style={{ width:48,height:48,borderRadius:"50%",background:m.bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,fontWeight:700,color:m.c,margin:"0 auto 8px" }}>{m.n[0]}</div>
            <div style={{ fontSize:12,fontWeight:600,color:"#1D1D1F" }}>{m.n}</div>
            <div style={{ fontSize:11,color:"#8E8E93" }}>{m.r}</div>
          </div>
        ))}
      </div>
      <div style={{ animation:"fadeUp .4s .58s both" }}>
        <div style={{ fontSize:11,color:"#8E8E93",textAlign:"center",marginBottom:12 }}>Validation PIN en cours</div>
        <div style={{ display:"flex",gap:10,justifyContent:"center" }}>
          {[0,1,2,3].map(i=><div key={i} style={{ width:13,height:13,borderRadius:"50%",background:i<3?"#007AFF":"rgba(0,0,0,.12)",animation:i<3?`pinFill .35s cubic-bezier(.34,1.5,.64,1) ${.65+i*.15}s both`:"none" }} />)}
        </div>
      </div>
    </div>,

    // 5 — Scanner
    <div style={{ background:"#0A0A0A",borderRadius:20,padding:28,display:"flex",flexDirection:"column",alignItems:"center",gap:16 }}>
      <div style={{ position:"relative",width:160,height:160,animation:"fadeUp .4s .2s both",flexShrink:0 }}>
        {([
          {top:0,left:0,borderTop:"2.5px solid #007AFF",borderLeft:"2.5px solid #007AFF"},
          {top:0,right:0,borderTop:"2.5px solid #007AFF",borderRight:"2.5px solid #007AFF"},
          {bottom:0,left:0,borderBottom:"2.5px solid #007AFF",borderLeft:"2.5px solid #007AFF"},
          {bottom:0,right:0,borderBottom:"2.5px solid #007AFF",borderRight:"2.5px solid #007AFF"},
        ] as React.CSSProperties[]).map((s,i)=><div key={i} style={{ position:"absolute",width:22,height:22,...s }} />)}
        <div style={{ position:"absolute",left:4,right:4,height:2,background:"linear-gradient(90deg,transparent,#007AFF,transparent)",animation:"scanLn 1.6s ease-in-out .4s infinite",boxShadow:"0 0 10px rgba(0,122,255,.5)",top:4 }} />
        <div style={{ position:"absolute",inset:16,display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:3,opacity:.18 }}>
          {QR_DOTS.map((v,i)=><div key={i} style={{ background:v?"rgba(255,255,255,.9)":"transparent",borderRadius:1 }}/>)}
        </div>
      </div>
      <div style={{ textAlign:"center",animation:"fadeUp .4s .35s both" }}>
        <div style={{ fontSize:12,color:"rgba(255,255,255,.45)",marginBottom:4 }}>Pointez la caméra vers le QR code</div>
        <div style={{ fontSize:11,color:"#007AFF" }}>Détection automatique</div>
      </div>
    </div>,
  ];
  void C;
  return <div key={feat} style={{ width:"100%" }}>{previews[feat]}</div>;
}

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);
  const [navVisible, setNavVisible] = useState(false);
  const [activeAnchor, setActiveAnchor] = useState("");
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [anchorOpen, setAnchorOpen] = useState(false);
  const [activeDash, setActiveDash] = useState(0);
  const [activeReward, setActiveReward] = useState(0);
  const [activeClient, setActiveClient] = useState(0);
  const { region, lang: contextLang, setLang: setContextLang } = useLang();
  const [lang, setLang] = useState<Lang>("fr");
  const t = T[lang];
  const pricing = REGIONS[region];

  useEffect(() => {
    if (contextLang === "ro") setLang("ro");
  }, [contextLang]);

  function changeLang(l: Lang) {
    setLang(l);
    if (l !== "en") setContextLang(l as "fr" | "ro");
  }

  const heroWA = wa(t.heroWa);
  const { monthly, sixMonths, annual, monthlyEquiv6, monthlyEquivAnnual, strikethrough6, strikethroughAnnual, currency } = pricing;
  const pct6 = Math.round((1 - sixMonths / strikethrough6) * 100);
  const pctAnnual = Math.round((1 - annual / strikethroughAnnual) * 100);

  useReveal();

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 20);
      setNavVisible(window.scrollY > window.innerHeight * 0.7);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const ids = t.anchors.map(a => a.id);
    const io = new IntersectionObserver(
      entries => { entries.forEach(e => { if (e.isIntersecting) setActiveAnchor(e.target.id); }); },
      { threshold: 0.2 }
    );
    ids.forEach(id => { const el = document.getElementById(id); if (el) io.observe(el); });
    return () => io.disconnect();
  }, [t.anchors]);

  const CSS = `
    @keyframes fadeUp    { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }
    @keyframes fadeIn    { from{opacity:0} to{opacity:1} }
    @keyframes float     { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
    @keyframes shimmer   { 0%,100%{background-position:0% 50%} 50%{background-position:100% 50%} }
    @keyframes heroImgIn { from{opacity:0;transform:translateX(28px) scale(.97)} to{opacity:1;transform:translateX(0) scale(1)} }
    @keyframes scaleBarUp{ from{transform:scaleY(0)} to{transform:scaleY(1)} }
    @keyframes notifDrop { from{opacity:0;transform:translateY(-18px)} to{opacity:1;transform:translateY(0)} }
    @keyframes stampPop  { 0%{transform:scale(0);opacity:0} 60%{transform:scale(1.25)} 100%{transform:scale(1);opacity:1} }
    @keyframes fillProg  { from{width:0} to{width:70%} }
    @keyframes pinFill   { 0%{transform:scale(0)} 100%{transform:scale(1)} }
    @keyframes cardSlide { from{opacity:0;transform:translateX(-14px)} to{opacity:1;transform:translateX(0)} }
    @keyframes scanLn    { 0%,100%{top:4px} 50%{top:calc(100% - 6px)} }
    @keyframes screenZoom { from{opacity:0;transform:scale(1.06)} to{opacity:1;transform:scale(1)} }
    .screen-enter { animation:screenZoom .55s cubic-bezier(.16,1,.3,1) both; }

    * { box-sizing:border-box; margin:0; padding:0; }
    html { scroll-behavior:smooth; scroll-padding-top:72px; }

    [data-reveal]        { opacity:0; transform:translate3d(0,18px,0);   transition:opacity .65s cubic-bezier(.16,1,.3,1),transform .65s cubic-bezier(.16,1,.3,1); backface-visibility:hidden; }
    [data-reveal="left"] { opacity:0; transform:translate3d(-20px,0,0);  transition:opacity .65s cubic-bezier(.16,1,.3,1),transform .65s cubic-bezier(.16,1,.3,1); }
    [data-reveal="right"]{ opacity:0; transform:translate3d(20px,0,0);   transition:opacity .65s cubic-bezier(.16,1,.3,1),transform .65s cubic-bezier(.16,1,.3,1); }
    [data-reveal="scale"]{ opacity:0; transform:translate3d(0,10px,0) scale3d(.97,.97,1); transition:opacity .7s cubic-bezier(.16,1,.3,1),transform .7s cubic-bezier(.16,1,.3,1); }
    [data-reveal="fade"] { opacity:0; transition:opacity .7s ease; }
    .revealed { opacity:1!important; transform:translate3d(0,0,0) scale3d(1,1,1)!important; }

    .grad { background:linear-gradient(135deg,#007AFF,#8B5CF6); -webkit-background-clip:text; -webkit-text-fill-color:transparent; }
    .grad-bg { background:linear-gradient(135deg,#007AFF,#8B5CF6); }

    .hero-anim-1 { animation:fadeUp .8s cubic-bezier(.16,1,.3,1) .05s both; }
    .hero-anim-3 { animation:fadeUp .8s cubic-bezier(.16,1,.3,1) .58s both; }
    .hero-anim-4 { animation:fadeUp .8s cubic-bezier(.16,1,.3,1) .70s both; }
    .hero-img-enter { animation:heroImgIn .95s cubic-bezier(.16,1,.3,1) .18s both; }
    .hero-word { animation:fadeUp .65s cubic-bezier(.16,1,.3,1) var(--wd,0s) both; }

    .pain-line { padding:28px 0; border-top:.5px solid rgba(0,0,0,.08); display:grid; grid-template-columns:40px 1fr; gap:20px; align-items:flex-start; }
    .pain-line:last-child { border-bottom:.5px solid rgba(0,0,0,.08); }

    .feat-row { padding:14px 16px; border-radius:12px; cursor:pointer; border:1.5px solid transparent; transition:background .15s,border-color .15s; display:flex; gap:14px; align-items:flex-start; }
    .feat-row:hover { background:rgba(0,0,0,.03); }
    .feat-row.feat-active { background:rgba(0,122,255,.05); border-color:rgba(0,122,255,.20); }
    .dash-spotlight { display:flex; background:#fff; border-radius:24px; border:.5px solid rgba(0,0,0,.07); overflow:hidden; box-shadow:0 8px 32px rgba(0,0,0,.06); }
    .dash-feat-list { flex:0 0 42%; padding:8px; border-right:.5px solid rgba(0,0,0,.07); }
    .dash-preview-panel { flex:1; padding:28px; min-height:480px; display:flex; align-items:center; justify-content:center; }

    .btn-wa {
      background:linear-gradient(135deg,#007AFF,#8B5CF6);
      color:#fff; padding:14px 26px; border-radius:14px; font-size:15px; font-weight:600;
      text-decoration:none; display:inline-flex; align-items:center; gap:9px;
      transition:transform .15s,box-shadow .15s; border:none; cursor:pointer;
    }
    .btn-wa:hover { transform:translateY(-2px); box-shadow:0 12px 32px rgba(0,122,255,.28); }
    .btn-ghost {
      background:rgba(0,0,0,.06); color:#1D1D1F; padding:14px 26px; border-radius:14px;
      font-size:15px; font-weight:500; text-decoration:none; display:inline-block;
      transition:background .15s; border:none; cursor:pointer;
    }
    .btn-ghost:hover { background:rgba(0,0,0,.10); }

    .stag { display:inline-block; font-size:11.5px; font-weight:700; letter-spacing:.08em;
      text-transform:uppercase; color:#007AFF; background:rgba(0,122,255,.08);
      padding:5px 13px; border-radius:20px; margin-bottom:18px; }

    .lp-nav { padding:0 48px; }
    .anchor-nav::-webkit-scrollbar { display:none; }
    .anchor-nav { scrollbar-width:none; }

    .lang-btn { padding:4px 10px; border-radius:18px; border:none; cursor:pointer;
      font-size:11px; font-weight:700; letter-spacing:.06em; transition:all .15s; }

    .feat-item { display:flex; gap:14px; align-items:flex-start; }
    .feat-dot  { width:7px; height:7px; border-radius:50%; background:linear-gradient(135deg,#007AFF,#8B5CF6);
      flex-shrink:0; margin-top:6px; }

    .card-hover { transition:transform .22s cubic-bezier(.16,1,.3,1),box-shadow .22s; }
    .card-hover:hover { transform:translateY(-4px); box-shadow:0 24px 48px rgba(0,0,0,.10)!important; }

    .reward-pill { display:inline-block; padding:4px 11px; border-radius:20px;
      font-size:12px; font-weight:600; margin-bottom:10px; }

    .faq-btn { width:100%; background:none; border:none; cursor:pointer; display:flex;
      align-items:center; justify-content:space-between; padding:20px 0; text-align:left; gap:16px; }
    .faq-btn:hover .faq-q { color:#007AFF; }
    .faq-item { border-bottom:.5px solid rgba(0,0,0,.08); }

    .pricing-card { background:#fff; border-radius:24px; padding:32px 28px;
      border:.5px solid rgba(0,0,0,.08); transition:transform .2s,box-shadow .2s; }
    .pricing-card:hover { transform:translateY(-4px); box-shadow:0 24px 48px rgba(0,0,0,.10); }
    .pricing-featured { background:#1D1D1F; border-color:#1D1D1F; }

    .sector-pill { display:inline-block; padding:9px 18px; border-radius:20px; font-size:13px;
      font-weight:500; color:#3C3C43; background:#fff; border:.5px solid rgba(0,0,0,.09);
      transition:transform .22s cubic-bezier(.16,1,.3,1); cursor:default; }
    .sector-pill:hover { transform:scale(1.12); }

    .check-icon { width:18px; height:18px; border-radius:50%; display:flex; align-items:center;
      justify-content:center; flex-shrink:0; background:rgba(0,122,255,.10); }

    @media (max-width:1024px) { .lp-nav { padding:0 24px; } }
    @media (max-width:768px) {
      .lp-nav { padding:0 20px; }
      .hero-split { flex-direction:column!important; text-align:center; align-items:center!important; height:auto!important; padding-top:88px!important; }
      .hero-split .hero-ctas { justify-content:center!important; }
      .hero-img-wrap { width:100%!important; max-width:460px!important; margin:0 auto; height:auto!important; flex:unset!important; }
      .hero-img-wrap img { max-height:46vw!important; }
      .nav-right { display:none!important; }
      .nav-mobile-lang { display:flex!important; }
      .nav-mobile-title { display:block!important; }
      .nav-logo { display:none!important; }
      section { padding:72px 20px!important; }
      .split-left,.split-right { width:100%!important; }
      .steps-row { flex-direction:column!important; }
      .steps-row > div { flex:unset!important; }
      .reward-cols { flex-direction:column!important; }
      .dash-split { flex-direction:column!important; }
      .client-split { flex-direction:column!important; }
      .screens-grid { grid-template-columns:1fr 1fr!important; }
      .pricing-grid { flex-direction:column!important; }
      .pricing-grid > div { width:100%!important; }
      .cards-grid { grid-template-columns:1fr 1fr!important; }
      .btn-wa,.btn-ghost { padding:13px 22px; font-size:14px; }
      .cta-title { font-size:clamp(28px,8vw,42px)!important; }
      .anchor-nav-desktop { display:none!important; }
      .anchor-nav-mobile { display:flex!important; }
      .feats-2col { grid-template-columns:1fr 1fr!important; }
      .steps-row { grid-template-columns:1fr!important; }
      .reward-cols { flex-direction:column!important; }
      .reward-cols > div { flex:1!important; }
      .custom-feats-grid { grid-template-columns:1fr 1fr!important; }
      .prob-split { flex-direction:column!important; gap:36px!important; }
      .prob-left { flex:unset!important; width:100%!important; }
      .prob-right { flex:unset!important; width:100%!important; }
      .client-spotlight { flex-direction:column!important; }
      .client-phone-panel { flex:unset!important; width:100%!important; min-height:320px!important; padding:28px!important; }
      .client-phone-panel img { height:min(50vw,320px)!important; }
      .client-screens { grid-template-columns:1fr 1fr 1fr!important; }
      .dash-spotlight { flex-direction:column!important; }
      .dash-feat-list { border-right:none!important; border-bottom:.5px solid rgba(0,0,0,.07)!important; flex:unset!important; }
      .dash-preview-panel { min-height:unset!important; padding:24px 20px!important; }
      .dash-preview-panel > div { height:auto!important; }
      .dash-preview-panel img { height:min(78vw, 480px)!important; width:auto!important; }
      .proof-bar { padding:16px 20px!important; gap:16px!important; }
      footer { padding:28px 20px!important; }
    }
    @media (max-width:1024px) {
      .dash-preview-panel > div { height:auto!important; }
      .dash-preview-panel img { height:min(44vw, 560px)!important; width:auto!important; }
    }
    @media (max-width:480px) {
      .cards-grid { grid-template-columns:1fr!important; }
      .screens-grid { grid-template-columns:1fr!important; }
      .hero-title { font-size:clamp(32px,10vw,52px)!important; }
      .pricing-grid > div { padding:28px 22px!important; }
      .custom-feats-grid { grid-template-columns:1fr!important; }
      .feats-2col { grid-template-columns:1fr!important; }
    }
    @media (prefers-reduced-motion:reduce) {
      *, *::before, *::after { animation-duration:.01ms!important; transition-duration:.01ms!important; }
    }
  `;

  const MAX = { maxWidth: 1040, margin: "0 auto" } as const;

  return (
    <>
      <style>{CSS}</style>
      <div style={{ fontFamily:"-apple-system,'SF Pro Display','Helvetica Neue',sans-serif", background:"#F5F5F7", minHeight:"100vh", overflowX:"hidden", WebkitFontSmoothing:"antialiased" }}>

        {/* ── WhatsApp float ── */}
        <a href={heroWA} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp"
          style={{ position:"fixed", bottom:24, right:24, zIndex:50, width:52, height:52, borderRadius:"50%",
            background:"#25D366", display:"flex", alignItems:"center", justifyContent:"center",
            boxShadow:"0 8px 24px rgba(37,211,102,.40)", transition:"transform .2s,box-shadow .2s" }}
          onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.transform="scale(1.08)";}}
          onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.transform="";}}>
          <svg width="26" height="26" viewBox="0 0 32 32" fill="white">
            <path d="M16 2.9C9.0 2.9 3.4 8.5 3.4 15.4c0 2.3.6 4.5 1.8 6.4L3 29l7.4-1.9c1.8 1.0 3.8 1.5 5.6 1.5 6.9 0 12.5-5.6 12.5-12.5S22.9 2.9 16 2.9zm0 22.9c-2.0 0-3.9-.5-5.5-1.5l-.4-.2-4.4 1.1 1.2-4.2-.3-.4c-1.1-1.7-1.7-3.7-1.7-5.7 0-5.9 4.8-10.8 10.8-10.8 2.9 0 5.6 1.1 7.6 3.2 2.0 2.0 3.2 4.7 3.2 7.6 0 5.9-4.8 10.9-10.5 10.9zm5.8-8.1c-.3-.2-1.8-.9-2.1-1-.3-.1-.5-.2-.7.2-.2.3-.8 1-.9 1.2-.2.2-.3.2-.6.1-.3-.2-1.2-.5-2.4-1.5-.9-.8-1.5-1.7-1.6-2.0-.2-.3 0-.5.1-.6.1-.1.3-.3.4-.5.1-.2.2-.3.3-.5.1-.2 0-.4 0-.5-.1-.2-.7-1.7-1.0-2.4-.3-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1.1 1.0-1.1 2.5s1.1 2.9 1.3 3.1c.2.2 2.2 3.4 5.4 4.7.8.3 1.4.5 1.8.6.8.2 1.5.2 2.0.1.6-.1 1.8-.7 2.1-1.4.3-.7.3-1.2.2-1.4-.1-.2-.3-.3-.6-.4z"/>
          </svg>
        </a>

        {/* ── NAV ── */}
        <nav className="lp-nav" style={{ position:"fixed", top:0, left:0, right:0, zIndex:30, height:58,
          display:"flex", alignItems:"center", justifyContent:"space-between",
          background: scrolled ? "rgba(245,245,247,.88)" : "transparent",
          backdropFilter: scrolled ? "blur(24px)" : "none",
          borderBottom: scrolled ? ".5px solid rgba(0,0,0,.09)" : "none",
          transition:"all .3s" }}>
          <div className="nav-logo" style={{ display:"flex", alignItems:"center", gap:8 }}>
            <Image src="/wallio-instagram-profil.png" alt="Wallio" width={34} height={34} style={{ borderRadius:8 }} priority />
          </div>
          <div className="nav-mobile-title" style={{ display:"none", position:"absolute", left:0, right:0, textAlign:"center", pointerEvents:"none" }}>
            <span style={{ fontSize:16, fontWeight:700, letterSpacing:".12em", color:"#1D1D1F" }}>WALLIO</span>
          </div>
          <button className="nav-mobile-lang" onClick={() => changeLang(lang==="fr"?"en":lang==="en"?"ro":"fr")}
            style={{ display:"none", width:36, height:36, borderRadius:"50%", background:"rgba(0,0,0,.06)", border:"none", cursor:"pointer", fontSize:11, fontWeight:700, letterSpacing:".06em", color:"#1D1D1F", alignItems:"center", justifyContent:"center" }}>
            {lang.toUpperCase()}
          </button>
          <div className="nav-right" style={{ display:"flex", gap:8, alignItems:"center" }}>
            <div style={{ display:"flex", gap:1, background:"rgba(0,0,0,.06)", borderRadius:20, padding:2 }}>
              {(["fr","en","ro"] as const).map(l => (
                <button key={l} className="lang-btn" onClick={() => changeLang(l)}
                  style={{ background: lang===l ? "#1D1D1F" : "transparent", color: lang===l ? "#fff" : "#6E6E73" }}>
                  {l.toUpperCase()}
                </button>
              ))}
            </div>
            <Link href="/choisir" style={{ fontSize:14, fontWeight:400, color:"#6E6E73", textDecoration:"none", padding:"6px 16px" }}>
              {t.navLogin}
            </Link>
            <a href={heroWA} target="_blank" rel="noopener noreferrer" className="btn-wa" style={{ padding:"7px 16px", fontSize:13, borderRadius:20 }}>
              {t.navCta}
            </a>
          </div>
        </nav>

        {/* ── ANCHOR NAV ── */}
        <div style={{ position:"fixed", top: navVisible ? 58 : -48, left:0, right:0, zIndex:29,
          background:"rgba(245,245,247,.97)", backdropFilter:"blur(20px)", WebkitBackdropFilter:"blur(20px)",
          borderBottom:".5px solid rgba(0,0,0,.09)", transition:"top .4s cubic-bezier(.16,1,.3,1)" }}>
          <div className="anchor-nav anchor-nav-desktop" style={{ maxWidth:1040, margin:"0 auto", padding:"0 32px" }}>
            <div style={{ display:"flex", gap:2, height:40, alignItems:"center", justifyContent:"center" }}>
              {t.anchors.map(a => (
                <a key={a.id} href={`#${a.id}`}
                  style={{ fontSize:12.5, fontWeight: activeAnchor===a.id ? 600 : 400,
                    color: activeAnchor===a.id ? "#1D1D1F" : "#6E6E73", textDecoration:"none",
                    padding:"4px 11px", borderRadius:20,
                    background: activeAnchor===a.id ? "rgba(0,0,0,.08)" : "transparent",
                    whiteSpace:"nowrap", transition:"all .15s" }}>
                  {a.label}
                </a>
              ))}
            </div>
          </div>
          <div className="anchor-nav anchor-nav-mobile" style={{ display:"none", position:"relative" }}>
            <button onClick={() => setAnchorOpen(o=>!o)}
              style={{ width:"100%", height:40, display:"flex", alignItems:"center", justifyContent:"center",
                gap:6, background:"none", border:"none", cursor:"pointer" }}>
              <span style={{ fontSize:13, fontWeight:600, color:"#1D1D1F" }}>
                {t.anchors.find(a=>a.id===activeAnchor)?.label ?? t.anchors[0]?.label}
              </span>
              <svg width="10" height="6" viewBox="0 0 10 6" fill="none" style={{ transform: anchorOpen ? "rotate(180deg)" : "none", transition:"transform .2s" }}>
                <path d="M1 1l4 4 4-4" stroke="#6E6E73" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </button>
            {anchorOpen && (
              <div style={{ position:"absolute", top:40, left:0, right:0, zIndex:18,
                background:"rgba(245,245,247,.97)", backdropFilter:"blur(20px)",
                borderBottom:".5px solid rgba(0,0,0,.09)" }}>
                {t.anchors.map(a => (
                  <a key={a.id} href={`#${a.id}`} onClick={() => setAnchorOpen(false)}
                    style={{ display:"block", padding:"13px 24px", fontSize:14,
                      fontWeight: activeAnchor===a.id ? 600 : 400,
                      color: activeAnchor===a.id ? "#1D1D1F" : "#6E6E73",
                      textDecoration:"none", borderBottom:".5px solid rgba(0,0,0,.06)" }}>
                    {a.label}
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>

        <div style={{ position:"relative", zIndex:1 }}>

          {/* ══════════════════════════════════════════
              1. HERO
          ══════════════════════════════════════════ */}
          <section style={{ height:"100dvh", minHeight:640, display:"flex", alignItems:"center", padding:"80px 48px 60px", position:"relative", overflow:"hidden", background:"#F7F8FF" }}>
            {/* Blobs fondus */}
            <div style={{ position:"absolute", width:700, height:700, borderRadius:"50%", background:"rgba(99,102,241,.18)", filter:"blur(90px)", top:-200, left:-150, pointerEvents:"none", zIndex:0 }} />
            <div style={{ position:"absolute", width:600, height:600, borderRadius:"50%", background:"rgba(0,122,255,.13)", filter:"blur(80px)", top:50, right:-100, pointerEvents:"none", zIndex:0 }} />
            <div style={{ position:"absolute", width:400, height:400, borderRadius:"50%", background:"rgba(249,115,22,.09)", filter:"blur(70px)", bottom:-80, right:280, pointerEvents:"none", zIndex:0 }} />
            <div style={{ ...MAX, width:"100%", display:"flex", alignItems:"center", gap:32, justifyContent:"space-between", position:"relative", zIndex:1, height:"100%" }} className="hero-split">
              {/* Left */}
              <div style={{ flex:"0 0 46%", maxWidth:500, minWidth:0 }}>
                <h1 className="hero-title hero-anim-1" style={{ fontSize:"clamp(26px,3vw,44px)", fontWeight:800, lineHeight:1.1, letterSpacing:-1.5, color:"#1D1D1F", marginBottom:20 }}>
                  {t.heroTitle1.split(" ").map((w,i)=>(
                    <span key={i} className="hero-word" style={{"--wd":`${0.08+i*0.065}s`} as React.CSSProperties}>{w}{" "}</span>
                  ))}
                  <br />
                  <span className="grad">
                    {t.heroTitle2.split(" ").map((w,i)=>(
                      <span key={i} className="hero-word" style={{"--wd":`${0.08+(t.heroTitle1.split(" ").length+i)*0.065}s`} as React.CSSProperties}>{w}{i<t.heroTitle2.split(" ").length-1?" ":""}</span>
                    ))}
                  </span>
                </h1>
                <p className="hero-anim-3" style={{ fontSize:17, lineHeight:1.65, color:"#6E6E73", maxWidth:480, marginBottom:36 }}>
                  {t.heroSub}
                </p>
                <div className="hero-anim-4 hero-ctas" style={{ display:"flex", gap:12, flexWrap:"wrap" }}>
                  <a href={heroWA} target="_blank" rel="noopener noreferrer" className="btn-wa">
                    <svg width="17" height="17" viewBox="0 0 32 32" fill="white"><path d="M16 2.9C9.0 2.9 3.4 8.5 3.4 15.4c0 2.3.6 4.5 1.8 6.4L3 29l7.4-1.9c1.8 1 3.8 1.5 5.6 1.5 6.9 0 12.5-5.6 12.5-12.5S22.9 2.9 16 2.9z"/></svg>
                    {t.heroCta1}
                  </a>
                  <Link href="/choisir" className="btn-ghost">{t.heroCta2}</Link>
                </div>
                {/* Stats hero */}
                <div className="hero-anim-4" style={{ display:"flex", gap:24, marginTop:36, marginBottom:32 }}>
                  {[
                    { v:"200+", l: lang==="ro" ? "clienți fidelizați" : lang==="en" ? "customers enrolled" : "clients fidélisés", c:"#007AFF" },
                    { v:"4", l: lang==="ro" ? "comercianți" : lang==="en" ? "businesses" : "commerces", c:"#8B5CF6" },
                    { v:"< 1s", l: lang==="ro" ? "per ștampilă" : lang==="en" ? "per stamp" : "par tampon", c:"#F97316" },
                  ].map(s=>(
                    <div key={s.v}>
                      <div style={{ fontSize:24, fontWeight:800, color:s.c, letterSpacing:-.5, lineHeight:1 }}>{s.v}</div>
                      <div style={{ fontSize:11, color:"#6E6E73", marginTop:3 }}>{s.l}</div>
                    </div>
                  ))}
                </div>
                {/* Wallet badges */}
                <div className="hero-anim-4" style={{ display:"flex", alignItems:"center", gap:16, opacity:.65 }}>
                  <Image src="/apple-wallet-badge.svg" alt="Apple Wallet" width={110} height={34} />
                  <div style={{ width:.5, height:24, background:"rgba(0,0,0,.18)" }} />
                  <Image src="/google-wallet-badge.svg" alt="Google Wallet" width={110} height={34} />
                </div>
              </div>
              {/* Right — hero image transparent */}
              <div className="hero-img-wrap" style={{ flex:"0 0 52%", maxWidth:580, display:"flex", alignItems:"center", justifyContent:"center", height:"100%" }}>
                <Image
                  src="/visuels_hero_trio_transparent.webp"
                  alt="Wallio — cartes de fidélité digitales sur iPhone"
                  width={960} height={660}
                  priority
                  className="hero-img-enter"
                  style={{ width:"100%", height:"auto", maxHeight:"78vh", objectFit:"contain", display:"block" }}
                />
              </div>
            </div>
          </section>

          {/* ══════════════════════════════════════════
              2. PROOF BAR
          ══════════════════════════════════════════ */}
          <div style={{ background:"#1D1D1F", borderTop:".5px solid rgba(255,255,255,.06)" }}>
            <div style={{ ...MAX, padding:"22px 48px", display:"flex", alignItems:"center", justifyContent:"center", gap:36, flexWrap:"wrap" }} className="proof-bar">
              <span style={{ fontSize:11, fontWeight:700, letterSpacing:".10em", textTransform:"uppercase", color:"rgba(255,255,255,.35)" }}>
                {t.proofLabel}
              </span>
              <div style={{ display:"flex", alignItems:"center", gap:20, flexWrap:"wrap", justifyContent:"center" }}>
                {[
                  { src:"/logo-8am.jpg", alt:"8AM Coffeehouse", name:"8AM Coffeehouse & More", fit:"cover" as const, bg:"rgba(255,255,255,.08)" },
                  { src:"/logo-maison-matcha.png", alt:"Maison Matcha", name:"Maison Matcha", fit:"contain" as const, bg:"#FFFFFF" },
                  { src:"/logo-comptoir-homme.jpg", alt:"Comptoir de l'Homme", name:"Comptoir de l'Homme", fit:"cover" as const, bg:"rgba(255,255,255,.08)" },
                  { src:"/logo-yumi.jpg", alt:"Yumi", name:"Yumi", fit:"cover" as const, bg:"rgba(255,255,255,.08)" },
                ].map(c => (
                  <div key={c.name} style={{ display:"flex", alignItems:"center", gap:9 }}>
                    <div style={{ width:32, height:32, borderRadius:8, overflow:"hidden", flexShrink:0, background:c.bg, border:".5px solid rgba(255,255,255,.12)" }}>
                      <Image src={c.src} alt={c.alt} width={32} height={32} style={{ width:"100%", height:"100%", objectFit:c.fit }} />
                    </div>
                    <span style={{ fontSize:13, fontWeight:600, color:"rgba(255,255,255,.75)", letterSpacing:-.2 }}>{c.name}</span>
                  </div>
                ))}
              </div>
              <div style={{ width:.5, height:24, background:"rgba(255,255,255,.12)" }} />
              <span style={{ fontSize:13, fontWeight:700, color:"#F97316" }}>{t.proofStat}</span>
            </div>
          </div>

          {/* ══════════════════════════════════════════
              3. LE PROBLÈME
          ══════════════════════════════════════════ */}
          <section style={{ padding:"96px 48px", background:"#0C0C10", position:"relative", overflow:"hidden" }}>
            <div style={{ position:"absolute", width:700, height:700, borderRadius:"50%", background:"rgba(0,122,255,.09)", filter:"blur(100px)", top:-150, right:-100, pointerEvents:"none" }} />
            <div style={{ position:"absolute", width:500, height:500, borderRadius:"50%", background:"rgba(99,102,241,.07)", filter:"blur(80px)", bottom:-80, left:-60, pointerEvents:"none" }} />
            <div style={{ ...MAX, position:"relative", zIndex:1 }}>
              <div style={{ display:"flex", gap:80, alignItems:"flex-start" }} className="prob-split">
                {/* Left */}
                <div style={{ flex:"0 0 40%" }} className="prob-left">
                  <div data-reveal>
                    <span className="stag" style={{ background:"rgba(0,122,255,.15)", color:"#60A5FA" }}>{t.problemTag}</span>
                    <h2 style={{ fontSize:"clamp(36px,4.5vw,62px)", fontWeight:800, letterSpacing:-2, color:"#FFFFFF", lineHeight:1.05, marginBottom:28 }}>
                      {t.problemTitle1}<br />
                      <span className="grad">{t.problemTitle2}</span>
                    </h2>
                    <p style={{ fontSize:15, color:"rgba(255,255,255,.4)", lineHeight:1.7, maxWidth:320 }}>
                      {lang==="ro" ? "Clienții fideli sunt invizibili. Nu știți cine vine, cine pleacă, nici cum să îi aduceți înapoi." :
                       lang==="en" ? "Your regulars are invisible. You don't know who comes back, who left, or how to bring them back." :
                       "Vos habitués sont invisibles. Vous ne savez pas qui revient, qui est parti, ni comment les faire revenir."}
                    </p>
                  </div>
                </div>
                {/* Right — 3 pains */}
                <div style={{ flex:1 }} className="prob-right">
                  <div data-stagger style={{ display:"flex", flexDirection:"column", gap:0 }}>
                    {t.problemPains.map((p,i) => (
                      <div key={i} data-reveal style={{
                        padding:"28px 0",
                        borderBottom: i < 2 ? ".5px solid rgba(255,255,255,.08)" : "none",
                        display:"flex", gap:20, alignItems:"flex-start",
                      }}>
                        <span style={{ fontSize:11, fontWeight:700, color:"rgba(255,255,255,.2)", letterSpacing:".06em", paddingTop:4, flexShrink:0, minWidth:28 }}>0{i+1}</span>
                        <div>
                          <h3 style={{ fontSize:20, fontWeight:700, lineHeight:1.25, marginBottom:8,
                            color: i===2 ? "#F97316" : i===0 ? "#FFFFFF" : "rgba(255,255,255,.65)" }}>
                            {p.title}
                          </h3>
                          <p style={{ fontSize:14, color:"rgba(255,255,255,.35)", lineHeight:1.65 }}>{p.body}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div data-reveal style={{ marginTop:32, display:"inline-flex", alignItems:"center", gap:10, background:"rgba(249,115,22,.10)", border:"1px solid rgba(249,115,22,.22)", borderRadius:12, padding:"12px 20px" }}>
                    <div style={{ width:7, height:7, borderRadius:"50%", background:"#F97316", flexShrink:0 }} />
                    <p style={{ fontSize:15, fontWeight:700, color:"#F97316" }}>{t.problemSolution}</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ══════════════════════════════════════════
              4. COMMENT ÇA MARCHE
          ══════════════════════════════════════════ */}
          <section id="comment" style={{ padding:"96px 48px", background:"#FAFBFF" }}>
            <div style={{ ...MAX }}>
              <div data-reveal="scale" style={{ marginBottom:64 }}>
                <span className="stag">{t.howTag}</span>
                <h2 style={{ fontSize:"clamp(34px,4vw,56px)", fontWeight:700, letterSpacing:-1.8, color:"#1D1D1F", lineHeight:1.08 }}>
                  {t.howTitle}<br /><span className="grad">{t.howTitle2}</span>
                </h2>
                <p style={{ fontSize:16, color:"#6E6E73", marginTop:12, maxWidth:420 }}>{t.howSub}</p>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:20, marginBottom:56 }} className="steps-row">
                {t.howSteps.map((s,i) => (
                  <div key={i} data-reveal style={{ background:"#fff", borderRadius:24, padding:"32px 28px", border:".5px solid rgba(0,0,0,.07)", position:"relative", overflow:"hidden" }}>
                    <div style={{ fontSize:52, fontWeight:800, letterSpacing:-2, color:[`rgba(0,122,255,.10)`,`rgba(91,108,246,.10)`,`rgba(249,115,22,.12)`][i], lineHeight:1, marginBottom:20, fontVariantNumeric:"tabular-nums" }}>{s.n}</div>
                    <h3 style={{ fontSize:16, fontWeight:700, color:"#1D1D1F", marginBottom:10, lineHeight:1.35 }}>{s.title}</h3>
                    <p style={{ fontSize:13.5, color:"#6E6E73", lineHeight:1.65 }}>{s.body}</p>
                    <div style={{ position:"absolute", top:0, left:0, width:3, height:"100%", background:`linear-gradient(180deg,${["#007AFF","#5B6CF6","#F97316"][i]},transparent)` }} />
                  </div>
                ))}
              </div>
              {/* Video demo */}
              <div data-reveal="scale">
                <video autoPlay muted loop playsInline preload="metadata"
                  poster="/Wallio_Landing_v2_poster.jpg"
                  style={{ width:"100%", borderRadius:20, display:"block", boxShadow:"0 24px 64px rgba(0,0,0,.12)" }}>
                  <source src="/Wallio_Landing_v2.webm" type="video/webm" />
                  <source src="/Wallio_Landing_v2.mp4" type="video/mp4" />
                </video>
              </div>
            </div>
          </section>

          {/* ══════════════════════════════════════════
              5. MODES DE RÉCOMPENSES
          ══════════════════════════════════════════ */}
          <section id="recompenses" style={{ padding:"96px 48px", background:"#FFFFFF" }}>
            <div style={{ ...MAX }}>
              <div data-reveal="scale" style={{ textAlign:"center", marginBottom:60 }}>
                <span className="stag">{t.rewardTag}</span>
                <h2 style={{ fontSize:"clamp(32px,4vw,52px)", fontWeight:700, letterSpacing:-1.6, color:"#1D1D1F", marginBottom:12 }}>
                  {t.rewardTitle}<br /><span className="grad">{t.rewardTitle2}</span>
                </h2>
                <p style={{ fontSize:16, color:"#6E6E73", maxWidth:440, margin:"0 auto" }}>{t.rewardSub}</p>
              </div>
              <div style={{ display:"flex", gap:16, alignItems:"stretch" }} className="reward-cols">
                {[
                  { data: t.rewardCyclic, accent:"#007AFF", bg:"rgba(0,122,255,.08)", border:"rgba(0,122,255,.20)",
                    visual: <div key="cyc" style={{ background:"#F0F5FF", borderRadius:14, padding:"16px 18px" }}>
                      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
                        <span style={{ fontSize:12, color:"#007AFF", fontWeight:600 }}>Nomade Café · Cycle en cours</span>
                        <span style={{ fontSize:13, fontWeight:700, color:"#1D1D1F" }}>6/10</span>
                      </div>
                      <div style={{ height:6, background:"rgba(0,0,0,.08)", borderRadius:99, overflow:"hidden", marginBottom:12 }}>
                        <div style={{ height:"100%", width:"60%", borderRadius:99, background:"linear-gradient(90deg,#007AFF,#8B5CF6)", animation:"fillProg .9s cubic-bezier(.16,1,.3,1) .2s both" }} />
                      </div>
                      <div style={{ display:"flex", gap:5, flexWrap:"wrap", marginBottom:10 }}>
                        {Array.from({length:10}).map((_,i)=>(
                          <div key={i} style={{ width:24, height:24, borderRadius:"50%", background: i<6 ? "linear-gradient(135deg,#007AFF,#8B5CF6)" : "rgba(0,0,0,.08)", animation:i<6?`stampPop .4s cubic-bezier(.34,1.5,.64,1) ${.3+i*.05}s both`:"none" }} />
                        ))}
                      </div>
                      <div style={{ display:"flex", justifyContent:"space-between", fontSize:11, color:"#8E8E93" }}>
                        <span>Récompense : Café offert</span><span>+4 restants</span>
                      </div>
                    </div>
                  },
                  { data: t.rewardProg, accent:"#5B6CF6", bg:"rgba(91,108,246,.08)", border:"rgba(91,108,246,.20)",
                    visual: <div key="prog" style={{ background:"#F3F0FF", borderRadius:14, padding:"16px 18px" }}>
                      <div style={{ fontSize:12, color:"#5B6CF6", fontWeight:600, marginBottom:14 }}>Comptoir de l'Homme · Paliers</div>
                      {[{n:3,r:"Réduction -10%",done:true,pct:100},{n:7,r:"Soin offert",done:true,pct:100},{n:12,r:"Statut VIP",done:false,pct:42}].map((p,i)=>(
                        <div key={i} style={{ marginBottom:i<2?12:0 }}>
                          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5 }}>
                            <span style={{ fontSize:12, fontWeight:600, color: p.done?"#5B6CF6":"#1D1D1F" }}>{p.r}</span>
                            <span style={{ fontSize:11, color:"#8E8E93" }}>{p.n} tampons</span>
                          </div>
                          <div style={{ height:4, background:"rgba(0,0,0,.08)", borderRadius:99, overflow:"hidden" }}>
                            <div style={{ height:"100%", width:`${p.pct}%`, background:p.done?"linear-gradient(90deg,#5B6CF6,#8B5CF6)":"rgba(91,108,246,.35)", borderRadius:99, animation:`fillProg .8s cubic-bezier(.16,1,.3,1) ${.2+i*.15}s both` }}/>
                          </div>
                        </div>
                      ))}
                    </div>
                  },
                  { data: t.rewardFlex, accent:"#8B5CF6", bg:"rgba(139,92,246,.08)", border:"rgba(139,92,246,.20)",
                    visual: <div key="flex" style={{ background:"#F5F0FF", borderRadius:14, padding:"16px 18px" }}>
                      <div style={{ fontSize:12, color:"#8B5CF6", fontWeight:600, marginBottom:10 }}>Yumi · À mi-parcours (5/10)</div>
                      <div style={{ background:"rgba(139,92,246,.08)", borderRadius:10, padding:"12px 14px", marginBottom:10, border:"1.5px solid rgba(139,92,246,.25)", animation:"cardSlide .5s .2s both" }}>
                        <div style={{ fontSize:12, fontWeight:700, color:"#8B5CF6", marginBottom:4 }}>Récompense intermédiaire</div>
                        <div style={{ fontSize:13, color:"#1D1D1F" }}>Boisson chaude offerte → reset à 5</div>
                      </div>
                      <div style={{ textAlign:"center", fontSize:11, color:"#8E8E93", marginBottom:8 }}>ou continuer pour :</div>
                      <div style={{ background:"linear-gradient(135deg,rgba(139,92,246,.10),rgba(0,122,255,.10))", borderRadius:10, padding:"12px 14px", border:"1.5px solid rgba(139,92,246,.20)", animation:"cardSlide .5s .45s both" }}>
                        <div style={{ fontSize:12, fontWeight:700, color:"#5B6CF6", marginBottom:4 }}>Grande récompense</div>
                        <div style={{ fontSize:13, color:"#1D1D1F" }}>Menu complet offert → reset à 0</div>
                      </div>
                    </div>
                  },
                ].map(({ data, accent, bg, border, visual }, i) => {
                  const active = activeReward === i;
                  return (
                    <div key={i} data-reveal
                      onMouseEnter={() => setActiveReward(i)}
                      onClick={() => setActiveReward(i)}
                      style={{
                        flex: active ? "2.2" : "1",
                        background:"#fff", borderRadius:24,
                        padding: active ? "28px 28px" : "28px 20px",
                        border: active ? `1.5px solid ${border}` : ".5px solid rgba(0,0,0,.07)",
                        boxShadow: active ? `0 12px 40px rgba(0,0,0,.08), 0 0 0 4px ${bg}` : "0 2px 12px rgba(0,0,0,.04)",
                        transition:"flex .4s cubic-bezier(.16,1,.3,1), box-shadow .3s, border-color .3s, padding .3s",
                        cursor:"pointer", overflow:"hidden",
                      }}>
                      <span className="reward-pill" style={{ color:accent, background:bg }}>{data.tag}</span>
                      <p style={{ fontSize:12, color:"#8E8E93", marginBottom:12 }}>{data.sub}</p>
                      <div style={{ overflow:"hidden", maxHeight: active ? "320px" : 0, opacity: active ? 1 : 0, transition:"max-height .4s cubic-bezier(.16,1,.3,1), opacity .3s" }}>
                        {active && visual}
                      </div>
                      <p style={{ fontSize:13.5, color:"#6E6E73", lineHeight:1.65, marginBottom:14, marginTop: active ? 16 : 0 }}>{data.desc}</p>
                      <div style={{ display:"flex", flexDirection:"column", gap:9 }}>
                        {data.bullets.map((b,bi) => (
                          <div key={bi} className="feat-item">
                            <div className="feat-dot" style={{ background: accent }} />
                            <span style={{ fontSize:13, color:"#3C3C43", lineHeight:1.5 }}>{b}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          {/* ══════════════════════════════════════════
              6. DASHBOARD GÉRANT
          ══════════════════════════════════════════ */}
          <section id="dashboard" style={{ padding:"96px 48px", background:"#0C0C10" }}>
            <div style={{ ...MAX }}>
              <div data-reveal="scale" style={{ marginBottom:52 }}>
                <span className="stag" style={{ background:"rgba(0,122,255,.15)", color:"#60A5FA" }}>{t.dashTag}</span>
                <h2 style={{ fontSize:"clamp(28px,3.5vw,46px)",fontWeight:700,letterSpacing:-1.5,color:"#FFFFFF",lineHeight:1.1,marginBottom:12 }}>
                  {t.dashTitle}<br /><span className="grad">{t.dashTitle2}</span>
                </h2>
                <p style={{ fontSize:15.5,color:"rgba(255,255,255,.5)",lineHeight:1.65,maxWidth:520 }}>{t.dashSub}</p>
              </div>
              <div data-reveal className="dash-spotlight" style={{ background:"rgba(255,255,255,.04)", border:".5px solid rgba(255,255,255,.08)" }}>
                {/* Feature list */}
                <div className="dash-feat-list" style={{ borderRight:".5px solid rgba(255,255,255,.08)" }}>
                  {t.dashFeats.map((f,i) => (
                    <div key={i}
                      className={`feat-row${activeDash===i?" feat-active":""}`}
                      onMouseEnter={() => setActiveDash(i)}
                      onClick={() => setActiveDash(i)}
                      style={{ borderColor: activeDash===i ? "rgba(0,122,255,.4)" : "transparent" }}
                    >
                      <div style={{ width:7,height:7,borderRadius:"50%",background:activeDash===i?"#60A5FA":"rgba(255,255,255,.25)",flexShrink:0,marginTop:5,transition:"background .15s" }} />
                      <div>
                        <h4 style={{ fontSize:14,fontWeight:700,color:activeDash===i?"#FFFFFF":"rgba(255,255,255,.55)",marginBottom:activeDash===i?5:0,lineHeight:1.3,transition:"color .15s" }}>{f.title}</h4>
                        <p style={{ fontSize:12.5,color:"rgba(255,255,255,.4)",lineHeight:1.55,maxHeight:activeDash===i?"80px":0,overflow:"hidden",opacity:activeDash===i?1:0,transition:"max-height .28s ease,opacity .2s ease",marginTop:activeDash===i?2:0 }}>{f.body}</p>
                      </div>
                    </div>
                  ))}
                </div>
                {/* Phone avec zoom par feature */}
                <div className="dash-preview-panel" style={{ overflow:"hidden", justifyContent:"center", background:"rgba(0,0,0,.2)", borderRadius:"0 20px 20px 0" }}>
                  {(() => {
                    const configs = [
                      { src:"/iphone_accueil.webp",    scale:1.65, ty:-16 },
                      { src:"/iphone_clients.webp",    scale:1,    ty:0   },
                      { src:"/iphone_notifs.webp",     scale:1,    ty:0   },
                      { src:"/iphone_accueil2.webp",   scale:1,    ty:0   },
                      { src:"/iphone_scanner.webp",    scale:1,    ty:0   },
                    ];
                    const cfg = configs[Math.min(activeDash, configs.length - 1)];
                    return (
                      <div style={{ position:"relative", overflow:"hidden", borderRadius:32, boxShadow:"0 32px 80px rgba(0,0,0,.55)", height:640, width:"auto" }}>
                        <Image
                          key={cfg.src + activeDash}
                          src={cfg.src}
                          alt={t.dashFeats[activeDash]?.title ?? ""}
                          width={280} height={560}
                          className="screen-enter"
                          style={{ display:"block", height:640, width:"auto",
                            transform:`scale(${cfg.scale}) translateY(${cfg.ty}%)`,
                            transition:"transform .7s cubic-bezier(.16,1,.3,1)",
                            transformOrigin:"center center" }}
                        />
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>
          </section>

          {/* ══════════════════════════════════════════
              6b. AUTOMATISATIONS
          ══════════════════════════════════════════ */}
          <section style={{ padding:"96px 48px", background:"#0C0C10", position:"relative", overflow:"hidden" }}>
            <div style={{ position:"absolute", width:600, height:600, borderRadius:"50%", background:"rgba(0,122,255,.08)", filter:"blur(100px)", top:-100, left:-100, pointerEvents:"none" }} />
            <div style={{ position:"absolute", width:400, height:400, borderRadius:"50%", background:"rgba(249,115,22,.07)", filter:"blur(80px)", bottom:-80, right:-80, pointerEvents:"none" }} />
            <div style={{ ...MAX, position:"relative", zIndex:1 }}>
              <div data-reveal="scale" style={{ marginBottom:60 }}>
                <span className="stag" style={{ background:"rgba(249,115,22,.12)", color:"#F97316" }}>
                  {lang==="ro" ? "Automatizări" : lang==="en" ? "Automations" : "Automatisations"}
                </span>
                <h2 style={{ fontSize:"clamp(28px,3.5vw,46px)", fontWeight:800, letterSpacing:-1.5, color:"#FFFFFF", lineHeight:1.1, marginBottom:14 }}>
                  {lang==="ro" ? <>Wallio lucrează pentru dvs.<br /><span className="grad">chiar și când dormiti.</span></> :
                   lang==="en" ? <>Wallio works for you,<br /><span className="grad">even while you sleep.</span></> :
                   <>Wallio travaille pour vous,<br /><span className="grad">même quand vous dormez.</span></>}
                </h2>
                <p style={{ fontSize:15, color:"rgba(255,255,255,.45)", maxWidth:480 }}>
                  {lang==="ro" ? "Configurați o dată. Wallio trimite mesajele potrivite la momentul potrivit, fără nicio acțiune din partea dvs." :
                   lang==="en" ? "Set it once. Wallio sends the right messages at the right time, with no action needed from you." :
                   "Configurez une fois. Wallio envoie les bons messages au bon moment, sans aucune action de votre part."}
                </p>
              </div>

              <div style={{ display:"flex", gap:20 }} className="steps-row">
                {[
                  {
                    color:"#007AFF", bg:"rgba(0,122,255,.10)", border:"rgba(0,122,255,.20)",
                    tag: lang==="ro" ? "Zi de naștere" : lang==="en" ? "Birthday" : "Anniversaire",
                    title: lang==="ro" ? "Un mesaj în ziua lor" : lang==="en" ? "A message on their day" : "Un message le jour J",
                    body: lang==="ro" ? "În ziua de naștere a clientului dvs., Wallio trimite automat un mesaj personalizat — cu sau fără un tampon dublu cadou. Zero intervenție din partea dvs." :
                          lang==="en" ? "On your customer's birthday, Wallio automatically sends a personalised message — with or without a double stamp gift. Zero effort from you." :
                          "Le jour de l'anniversaire de votre client, Wallio envoie automatiquement un message personnalisé — avec ou sans tampon double offert. Zéro intervention de votre part.",
                    visual: (
                      <div style={{ background:"rgba(255,255,255,.06)", borderRadius:16, padding:"16px 18px", marginBottom:20, border:".5px solid rgba(0,122,255,.20)" }}>
                        <div style={{ fontSize:11, color:"rgba(255,255,255,.35)", fontWeight:600, marginBottom:10 }}>Wallio · Anniversaire · Automatique</div>
                        <div style={{ background:"rgba(255,255,255,.08)", borderRadius:10, padding:"12px 14px" }}>
                          <div style={{ fontSize:13, color:"rgba(255,255,255,.85)", lineHeight:1.5 }}>
                            {lang==="ro" ? "La mulți ani ! Îți oferim un tampon dublu azi. Ne vedem curând !" :
                             lang==="en" ? "Happy Birthday! We're giving you a double stamp today. See you soon!" :
                             "Bon anniversaire ! On vous offre un double tampon aujourd'hui. À bientôt !"}
                          </div>
                        </div>
                        <div style={{ marginTop:10, display:"flex", alignItems:"center", gap:8 }}>
                          <div style={{ width:7, height:7, borderRadius:"50%", background:"#34C759" }} />
                          <span style={{ fontSize:11, color:"rgba(255,255,255,.35)" }}>
                            {lang==="ro" ? "Trimis automat · 0 acțiuni manuale" : lang==="en" ? "Sent automatically · 0 manual actions" : "Envoyé automatiquement · 0 action manuelle"}
                          </span>
                        </div>
                      </div>
                    ),
                  },
                  {
                    color:"#F97316", bg:"rgba(249,115,22,.10)", border:"rgba(249,115,22,.20)",
                    tag: lang==="ro" ? "Reactivare" : lang==="en" ? "Re-engagement" : "Relance",
                    title: lang==="ro" ? "Clienții inactivi revin" : lang==="en" ? "Inactive customers come back" : "Vos clients inactifs reviennent",
                    body: lang==="ro" ? "Un client nu a mai venit de X zile ? Wallio detectează asta și trimite automat un mesaj personalizat de reactivare. Dvs. definiți intervalul, Wallio se ocupă de rest." :
                          lang==="en" ? "A customer hasn't come back in X days? Wallio detects this and automatically sends a personalised re-engagement message. You set the interval, Wallio handles the rest." :
                          "Un client n'est pas revenu depuis X jours ? Wallio le détecte et envoie automatiquement un message de relance personnalisé. Vous définissez l'intervalle, Wallio s'occupe du reste.",
                    visual: (
                      <div style={{ background:"rgba(255,255,255,.06)", borderRadius:16, padding:"16px 18px", marginBottom:20, border:".5px solid rgba(249,115,22,.20)" }}>
                        <div style={{ fontSize:11, color:"rgba(255,255,255,.35)", fontWeight:600, marginBottom:10 }}>
                          {lang==="ro" ? "Wallio · Absent +30 zile · Automat" : lang==="en" ? "Wallio · Absent 30+ days · Auto" : "Wallio · Absent +30 jours · Automatique"}
                        </div>
                        <div style={{ background:"rgba(255,255,255,.08)", borderRadius:10, padding:"12px 14px" }}>
                          <div style={{ fontSize:13, color:"rgba(255,255,255,.85)", lineHeight:1.5 }}>
                            {lang==="ro" ? "Vă lipsim ? Vă mai lipsesc 2 ștampile pentru recompensa dvs. Vă așteptăm !" :
                             lang==="en" ? "Miss us? You're only 2 stamps away from your reward. We're waiting for you!" :
                             "Vous nous manquez ! Il vous reste 2 tampons avant votre récompense. On vous attend !"}
                          </div>
                        </div>
                        <div style={{ marginTop:10, display:"flex", alignItems:"center", gap:8 }}>
                          <div style={{ width:7, height:7, borderRadius:"50%", background:"#F97316" }} />
                          <span style={{ fontSize:11, color:"rgba(255,255,255,.35)" }}>
                            {lang==="ro" ? "Detectat automat · 0 acțiuni manuale" : lang==="en" ? "Auto-detected · 0 manual actions" : "Détecté automatiquement · 0 action manuelle"}
                          </span>
                        </div>
                      </div>
                    ),
                  },
                ].map((a, i) => (
                  <div key={i} data-reveal style={{ flex:1, border:`.5px solid ${a.border}`, borderRadius:24, padding:"28px 24px", background:"rgba(255,255,255,.03)" }}>
                    <span style={{ display:"inline-block", padding:"4px 11px", borderRadius:20, fontSize:12, fontWeight:600, color:a.color, background:a.bg, marginBottom:12 }}>{a.tag}</span>
                    <h3 style={{ fontSize:20, fontWeight:700, color:"#FFFFFF", marginBottom:10, lineHeight:1.25 }}>{a.title}</h3>
                    {a.visual}
                    <p style={{ fontSize:13.5, color:"rgba(255,255,255,.45)", lineHeight:1.65 }}>{a.body}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ══════════════════════════════════════════
              7. EXPÉRIENCE CLIENT
          ══════════════════════════════════════════ */}
          <section id="client" style={{ padding:"96px 48px", background:"#FFFFFF" }}>
            <div style={{ ...MAX }}>
              <div data-reveal="scale" style={{ marginBottom:52 }}>
                <span className="stag">{t.clientTag}</span>
                <h2 style={{ fontSize:"clamp(28px,3.5vw,46px)", fontWeight:700, letterSpacing:-1.5, color:"#1D1D1F", lineHeight:1.1, marginBottom:12 }}>
                  {t.clientTitle}<br /><span className="grad">{t.clientTitle2}</span>
                </h2>
                <p style={{ fontSize:15.5, color:"#6E6E73", lineHeight:1.65, maxWidth:520 }}>{t.clientSub}</p>
              </div>

              <div style={{ display:"flex", gap:0, alignItems:"stretch", background:"#F5F5F7", borderRadius:28, overflow:"hidden", border:".5px solid rgba(0,0,0,.07)" }} className="client-spotlight">
                {/* Left — grand téléphone interactif */}
                <div style={{ flex:"0 0 44%", background:"#F0F0F5", display:"flex", alignItems:"center", justifyContent:"center", padding:"40px 32px", position:"relative", overflow:"hidden", minHeight:560 }} className="client-phone-panel">
                  {/* Blob de fond */}
                  <div style={{ position:"absolute", width:400, height:400, borderRadius:"50%", background:"rgba(0,122,255,.08)", filter:"blur(60px)", top:-50, left:-50, pointerEvents:"none" }} />
                  <div style={{ position:"absolute", width:300, height:300, borderRadius:"50%", background:`rgba(${activeClient===2?"249,115,22":"99,102,241"},.07)`, filter:"blur(50px)", bottom:-30, right:-30, pointerEvents:"none", transition:"background .5s" }} />
                  {/* Téléphone */}
                  <Image
                    key={activeClient}
                    src={["/iphone_client.webp","/iphone_messages.webp","/iphone_decouvrir.webp"][activeClient]}
                    alt={t.clientFeats[activeClient]?.title ?? ""}
                    width={340} height={680}
                    className="screen-enter"
                    style={{ width:"auto", height:"min(72vh, 520px)", display:"block", position:"relative", zIndex:1, filter:"drop-shadow(0 24px 48px rgba(0,0,0,.18))" }}
                  />
                  {/* Indicateur */}
                  <div style={{ position:"absolute", bottom:20, left:"50%", transform:"translateX(-50%)", display:"flex", gap:6 }}>
                    {[0,1,2].map(i=>(
                      <div key={i} onClick={()=>setActiveClient(i)} style={{ width: activeClient===i ? 20 : 6, height:6, borderRadius:3, background: activeClient===i ? "#007AFF" : "rgba(0,0,0,.18)", transition:"all .3s", cursor:"pointer" }} />
                    ))}
                  </div>
                </div>

                {/* Right — 3 features + sous-items pour feature 0 */}
                <div style={{ flex:1, padding:"40px 36px", display:"flex", flexDirection:"column", justifyContent:"center", gap:4 }}>
                  {t.clientFeats.slice(0, 3).map((f,i) => {
                    const active = activeClient === i;
                    const icons = [
                      <><rect key="a" x="2" y="5" width="20" height="14" rx="3"/><path key="b" d="M2 10h20"/></>,
                      <path key="c" d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>,
                      <><circle key="d" cx="12" cy="10" r="3"/><path key="e" d="M12 2a8 8 0 0 0-8 8c0 5.4 7.05 11.5 7.35 11.76a1 1 0 0 0 1.3 0C13 21.5 20 15.4 20 10a8 8 0 0 0-8-8z"/></>,
                    ];
                    return (
                      <div key={i}>
                        <div
                          onMouseEnter={() => setActiveClient(i)}
                          onClick={() => setActiveClient(i)}
                          style={{
                            padding:"18px 20px", borderRadius:16, cursor:"pointer",
                            background: active ? "#FFFFFF" : "transparent",
                            border: active ? ".5px solid rgba(0,122,255,.15)" : ".5px solid transparent",
                            boxShadow: active ? "0 4px 20px rgba(0,0,0,.07)" : "none",
                            transition:"all .25s cubic-bezier(.16,1,.3,1)",
                          }}>
                          <div style={{ display:"flex", gap:14, alignItems:"flex-start" }}>
                            <div style={{ width:36, height:36, borderRadius:10, background: active ? "rgba(0,122,255,.10)" : "rgba(0,0,0,.05)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, transition:"background .2s" }}>
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={active?"#007AFF":"#8E8E93"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                {icons[i]}
                              </svg>
                            </div>
                            <div style={{ flex:1 }}>
                              <h4 style={{ fontSize:14.5, fontWeight:700, color: active ? "#1D1D1F" : "#6E6E73", marginBottom: active ? 5 : 0, lineHeight:1.3, transition:"color .2s" }}>{f.title}</h4>
                              <p style={{ fontSize:13, color:"#6E6E73", lineHeight:1.6, maxHeight: active ? "80px" : 0, overflow:"hidden", opacity: active ? 1 : 0, transition:"max-height .3s ease, opacity .2s" }}>{f.body}</p>
                            </div>
                          </div>
                        </div>
                        {/* Sous-items Y aller + Parrainage uniquement pour feature 0 */}
                        {i === 0 && (
                          <div style={{ marginLeft:30, marginTop:4, display:"flex", flexDirection:"column", gap:4 }}>
                            {t.clientFeats.slice(3, 5).map((sub, si) => (
                              <div key={si} style={{ padding:"12px 16px", background:"rgba(0,122,255,.04)", borderRadius:12, borderLeft:"2px solid rgba(0,122,255,.20)", display:"flex", gap:10, alignItems:"flex-start" }}>
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#007AFF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink:0, marginTop:1 }}>
                                  {si===0 ? <><polyline points="5 12 12 5 19 12"/><path d="M12 5v14"/></> : <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></>}
                                </svg>
                                <div>
                                  <div style={{ fontSize:13, fontWeight:700, color:"#1D1D1F", marginBottom:3 }}>{sub.title}</div>
                                  <div style={{ fontSize:12, color:"#6E6E73", lineHeight:1.55 }}>{sub.body}</div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </section>

          {/* ══════════════════════════════════════════
              8. PERSONNALISATION + VRAIES CARTES
          ══════════════════════════════════════════ */}
          <section id="carte" style={{ padding:"96px 48px", background:"#F7F8FF" }}>
            <div style={{ ...MAX }}>
              <div data-reveal="scale" style={{ marginBottom:56 }}>
                <span className="stag">{t.customTag}</span>
                <h2 style={{ fontSize:"clamp(32px,4vw,52px)", fontWeight:700, letterSpacing:-1.6, color:"#1D1D1F", lineHeight:1.08 }}>
                  {t.customTitle}<br /><span className="grad">{t.customTitle2}</span>
                </h2>
                <p style={{ fontSize:16, color:"#6E6E73", marginTop:12, maxWidth:440 }}>{t.customSub}</p>
              </div>

              {/* Features grid */}
              <div data-stagger style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:16, marginBottom:60 }} className="feats-2col custom-feats-grid">
                {t.customFeats.map((f,i) => (
                  <div key={i} style={{ background:"#fff", borderRadius:16, padding:"22px 20px", border:".5px solid rgba(0,0,0,.07)" }}>
                    <h4 style={{ fontSize:14, fontWeight:700, color:"#1D1D1F", marginBottom:7 }}>{f.title}</h4>
                    <p style={{ fontSize:13, color:"#6E6E73", lineHeight:1.6 }}>{f.body}</p>
                  </div>
                ))}
              </div>

              {/* Vraies cartes Wallet */}
              <div data-reveal style={{ marginBottom:20 }}>
                <p style={{ fontSize:13, fontWeight:700, letterSpacing:".08em", textTransform:"uppercase", color:"#AEAEB2", marginBottom:24 }}>{t.cardsTitle}</p>
              </div>
              <div data-stagger style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:16 }} className="cards-grid">
                {[
                  { src:"/carte_wallet_8am.png", name:"8AM Coffeehouse" },
                  { src:"/carte_wallet_comptoir.png", name:"Comptoir de l'Homme" },
                  { src:"/carte_wallet_maisonmatcha.png", name:"Maison Matcha" },
                  { src:"/carte_wallet_yumi.png", name:"Yumi" },
                ].map(c => (
                  <div key={c.src} style={{ borderRadius:14, overflow:"hidden", boxShadow:"0 12px 32px rgba(0,0,0,.12)" }} className="card-hover">
                    <Image src={c.src} alt={`Carte Wallio ${c.name}`} width={375} height={180} style={{ width:"100%", height:"auto", display:"block" }} />
                    <div style={{ background:"#fff", padding:"10px 14px" }}>
                      <span style={{ fontSize:12, fontWeight:600, color:"#1D1D1F" }}>{c.name}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ══════════════════════════════════════════
              9. SECTEURS
          ══════════════════════════════════════════ */}
          <section style={{ padding:"64px 48px", background:"#FFFFFF", borderTop:".5px solid rgba(0,0,0,.07)" }}>
            <div style={{ ...MAX, textAlign:"center" }}>
              <div data-reveal>
                <span className="stag">{t.sectorsTag}</span>
                <h2 style={{ fontSize:"clamp(26px,3vw,40px)", fontWeight:700, letterSpacing:-1.2, color:"#1D1D1F", marginBottom:28 }}>
                  {t.sectorsTitle}
                </h2>
              </div>
              <div data-stagger style={{ display:"flex", flexWrap:"wrap", gap:10, justifyContent:"center" }}>
                {t.sectors.map((s,i) => (
                  <span key={i} className="sector-pill">{s}</span>
                ))}
              </div>
            </div>
          </section>

          {/* ══════════════════════════════════════════
              10. TARIFS
          ══════════════════════════════════════════ */}
          <section id="tarifs" style={{ padding:"96px 48px", background:"#F5F5F7", position:"relative", overflow:"hidden" }}>
            <div style={{ ...MAX }}>
              <div data-reveal="scale" style={{ textAlign:"center", marginBottom:60 }}>
                <span className="stag">{t.tarifsTag}</span>
                <h2 style={{ fontSize:"clamp(32px,4vw,52px)", fontWeight:700, letterSpacing:-1.6, color:"#1D1D1F", marginBottom:12 }}>
                  {t.tarifsTitle}
                </h2>
                <p style={{ fontSize:16, color:"#6E6E73", maxWidth:440, margin:"0 auto" }}>{t.tarifsSub}</p>
              </div>

              <div style={{ display:"flex", gap:16, alignItems:"stretch" }} className="pricing-grid">
                {/* Mensuel */}
                <div data-reveal style={{ flex:1 }} className="pricing-card card-hover">
                  <p style={{ fontSize:12, fontWeight:700, letterSpacing:".08em", textTransform:"uppercase", color:"#8E8E93", marginBottom:4 }}>{t.tarifsMonthly}</p>
                  <p style={{ fontSize:11, color:"#AEAEB2", marginBottom:20 }}>{t.tarifsNoCommit}</p>
                  <div style={{ display:"flex", alignItems:"baseline", gap:4, marginBottom:8 }}>
                    <span style={{ fontSize:40, fontWeight:800, letterSpacing:-1.5, color:"#1D1D1F" }}>{monthly}</span>
                    <span style={{ fontSize:16, fontWeight:500, color:"#6E6E73" }}>{currency}</span>
                  </div>
                  <p style={{ fontSize:12, color:"#AEAEB2", marginBottom:28 }}>{t.tarifsMonthEquiv(monthly, currency)}</p>
                  <a href={wa(t.tarifsWaMo(monthly, currency))} target="_blank" rel="noopener noreferrer"
                    className="btn-ghost" style={{ width:"100%", textAlign:"center", padding:"13px 0", borderRadius:12, fontSize:14, display:"block" }}>
                    {t.tarifsCta}
                  </a>
                </div>

                {/* 6 mois */}
                <div data-reveal style={{ flex:1, transitionDelay:".07s" }} className="pricing-card card-hover">
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:4 }}>
                    <p style={{ fontSize:12, fontWeight:700, letterSpacing:".08em", textTransform:"uppercase", color:"#8E8E93" }}>{t.tarifsSix}</p>
                    <span style={{ background:"rgba(0,122,255,.10)", color:"#007AFF", fontSize:11, fontWeight:700, padding:"3px 8px", borderRadius:10 }}>
                      {`-${pct6}%`}
                    </span>
                  </div>
                  <p style={{ fontSize:11, color:"#AEAEB2", marginBottom:20 }}>
                    <span style={{ textDecoration:"line-through", marginRight:4 }}>{strikethrough6} {currency}</span>
                  </p>
                  <div style={{ display:"flex", alignItems:"baseline", gap:4, marginBottom:8 }}>
                    <span style={{ fontSize:40, fontWeight:800, letterSpacing:-1.5, color:"#1D1D1F" }}>{sixMonths}</span>
                    <span style={{ fontSize:16, fontWeight:500, color:"#6E6E73" }}>{currency}</span>
                  </div>
                  <p style={{ fontSize:12, color:"#AEAEB2", marginBottom:28 }}>{t.tarifsMonthEquiv(monthlyEquiv6, currency)}</p>
                  <a href={wa(t.tarifsWa6(sixMonths, currency))} target="_blank" rel="noopener noreferrer"
                    className="btn-ghost" style={{ width:"100%", textAlign:"center", padding:"13px 0", borderRadius:12, fontSize:14, display:"block" }}>
                    {t.tarifsCta}
                  </a>
                </div>

                {/* Annuel — featured */}
                <div data-reveal style={{ flex:1, transitionDelay:".14s" }} className="pricing-card pricing-featured card-hover">
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:4 }}>
                    <p style={{ fontSize:12, fontWeight:700, letterSpacing:".08em", textTransform:"uppercase", color:"rgba(255,255,255,.45)" }}>{t.tarifsAnnual}</p>
                    <span style={{ background:"#F97316", color:"#fff", fontSize:11, fontWeight:700, padding:"3px 8px", borderRadius:10 }}>
                      {t.tarifsRecommended}
                    </span>
                  </div>
                  <p style={{ fontSize:11, color:"rgba(255,255,255,.25)", marginBottom:20 }}>
                    <span style={{ textDecoration:"line-through", marginRight:4 }}>{strikethroughAnnual} {currency}</span>
                    <span style={{ color:"rgba(255,255,255,.45)" }}>{`-${pctAnnual}%`}</span>
                  </p>
                  <div style={{ display:"flex", alignItems:"baseline", gap:4, marginBottom:8 }}>
                    <span style={{ fontSize:40, fontWeight:800, letterSpacing:-1.5, color:"#fff" }}>{annual}</span>
                    <span style={{ fontSize:16, fontWeight:500, color:"rgba(255,255,255,.5)" }}>{currency}</span>
                  </div>
                  <p style={{ fontSize:12, color:"rgba(255,255,255,.35)", marginBottom:28 }}>{t.tarifsMonthEquiv(monthlyEquivAnnual, currency)}</p>
                  <a href={wa(t.tarifsWaAn(annual, currency))} target="_blank" rel="noopener noreferrer"
                    className="btn-wa" style={{ width:"100%", justifyContent:"center", padding:"13px 0", borderRadius:12, fontSize:14 }}>
                    {t.tarifsCta}
                  </a>
                </div>
              </div>

              {/* Inclus */}
              <div data-reveal style={{ background:"#fff", borderRadius:20, padding:"32px 36px", marginTop:32, border:".5px solid rgba(0,0,0,.07)" }}>
                <p style={{ fontSize:13, fontWeight:700, letterSpacing:".07em", textTransform:"uppercase", color:"#AEAEB2", marginBottom:20 }}>{t.tarifsIncludedTitle}</p>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:"12px 24px" }} className="feats-2col">
                  {t.tarifsIncluded.map((item,i) => (
                    <div key={i} style={{ display:"flex", alignItems:"flex-start", gap:10 }}>
                      <div className="check-icon">
                        <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="#007AFF" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      </div>
                      <span style={{ fontSize:13.5, color:"#3C3C43", lineHeight:1.5 }}>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* ══════════════════════════════════════════
              11. FAQ
          ══════════════════════════════════════════ */}
          <section id="faq" style={{ padding:"96px 48px", background:"#FFFFFF" }}>
            <div style={{ ...MAX }}>
              <div data-reveal="scale" style={{ textAlign:"center", marginBottom:52 }}>
                <span className="stag">{t.faqTag}</span>
                <h2 style={{ fontSize:"clamp(28px,3.5vw,46px)", fontWeight:700, letterSpacing:-1.4, color:"#1D1D1F" }}>
                  {t.faqTitle}
                </h2>
              </div>
              <div style={{ maxWidth:720, margin:"0 auto" }}>
                {t.faqs.map((f,i) => (
                  <div key={i} className="faq-item" data-reveal>
                    <button className="faq-btn" onClick={() => setOpenFaq(openFaq===i ? null : i)}>
                      <span className="faq-q" style={{ fontSize:15.5, fontWeight:600, color:"#1D1D1F", lineHeight:1.4, transition:"color .15s" }}>{f.q}</span>
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" style={{ flexShrink:0, transition:"transform .25s", transform: openFaq===i ? "rotate(45deg)" : "none" }}>
                        <path d="M10 4v12M4 10h12" stroke="#8E8E93" strokeWidth="1.6" strokeLinecap="round"/>
                      </svg>
                    </button>
                    <div style={{ overflow:"hidden", maxHeight: openFaq===i ? 400 : 0, transition:"max-height .3s cubic-bezier(.4,0,.2,1)", paddingBottom: openFaq===i ? 20 : 0 }}>
                      <p style={{ fontSize:14.5, color:"#6E6E73", lineHeight:1.7 }}>{f.a}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div data-reveal style={{ textAlign:"center", marginTop:40 }}>
                <a href={wa(t.faqWa)} target="_blank" rel="noopener noreferrer" className="btn-ghost" style={{ fontSize:14 }}>
                  {t.faqCta}
                </a>
              </div>
            </div>
          </section>

          {/* ══════════════════════════════════════════
              12. CTA FINAL
          ══════════════════════════════════════════ */}
          <section style={{ padding:"80px 48px" }}>
            <div style={{ ...MAX }}>
              <div data-reveal="scale" style={{ background:"linear-gradient(135deg,#007AFF,#8B5CF6)", borderRadius:28, padding:"64px 48px", textAlign:"center" }}>
                <h2 className="cta-title" style={{ fontSize:"clamp(28px,4vw,48px)", fontWeight:700, letterSpacing:-1.5, color:"#fff", marginBottom:14 }}>
                  {t.ctaTitle}
                </h2>
                <p style={{ fontSize:16, color:"rgba(255,255,255,.75)", maxWidth:400, margin:"0 auto 36px" }}>
                  {t.ctaSub}
                </p>
                <a href={wa(t.ctaWa)} target="_blank" rel="noopener noreferrer"
                  style={{ display:"inline-flex", alignItems:"center", gap:9, background:"#fff", color:"#1D1D1F", padding:"15px 32px", borderRadius:14, fontSize:15, fontWeight:700, textDecoration:"none", boxShadow:"0 8px 24px rgba(0,0,0,.15)", transition:"transform .15s,box-shadow .15s" }}
                  onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.transform="translateY(-2px)";(e.currentTarget as HTMLElement).style.boxShadow="0 14px 36px rgba(0,0,0,.20)";}}
                  onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.transform="";(e.currentTarget as HTMLElement).style.boxShadow="0 8px 24px rgba(0,0,0,.15)";}}>
                  <svg width="17" height="17" viewBox="0 0 32 32" fill="currentColor"><path d="M16 2.9C9.0 2.9 3.4 8.5 3.4 15.4c0 2.3.6 4.5 1.8 6.4L3 29l7.4-1.9c1.8 1 3.8 1.5 5.6 1.5 6.9 0 12.5-5.6 12.5-12.5S22.9 2.9 16 2.9z"/></svg>
                  {t.ctaBtn}
                </a>
              </div>
            </div>
          </section>

          {/* ══════════════════════════════════════════
              FOOTER
          ══════════════════════════════════════════ */}
          <footer style={{ background:"#1D1D1F", padding:"32px 48px", display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:16 }}>
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <Image src="/wallio-instagram-profil.png" alt="Wallio" width={28} height={28} style={{ borderRadius:6, opacity:.9 }} />
              <span style={{ fontSize:14, fontWeight:700, color:"rgba(255,255,255,.65)", letterSpacing:".10em" }}>WALLIO</span>
            </div>
            <div style={{ display:"flex", gap:20, flexWrap:"wrap" }}>
              {t.footerLinks.map(l => (
                <Link key={l.href} href={l.href} style={{ fontSize:12.5, color:"rgba(255,255,255,.35)", textDecoration:"none", transition:"color .15s" }}
                  onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.color="rgba(255,255,255,.7)";}}
                  onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.color="rgba(255,255,255,.35)";}}>
                  {l.label}
                </Link>
              ))}
            </div>
            <span style={{ fontSize:12, color:"rgba(255,255,255,.2)" }}>© {new Date().getFullYear()} Wallio</span>
          </footer>

        </div>
      </div>
    </>
  );
}
