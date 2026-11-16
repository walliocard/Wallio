import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import { AuthProvider } from "@/lib/auth-context";
import { LangProvider } from "@/lib/lang-context";
import "./globals.css";

const geist = Geist({
  variable: "--font-geist",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Wallio — Cartes de fidélité digitales",
  description: "Gagnez des tampons et débloquez des récompenses chez vos établissements préférés. Sans app à télécharger.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Wallio",
  },
  openGraph: {
    title: "Wallio — Cartes de fidélité digitales",
    description: "Gagnez des tampons et débloquez des récompenses chez vos établissements préférés.",
    url: "https://app.walliocard.com",
    siteName: "Wallio",
    images: [{ url: "https://app.walliocard.com/og-image.png", width: 1200, height: 630, alt: "Wallio" }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Wallio — Cartes de fidélité digitales",
    description: "Gagnez des tampons et débloquez des récompenses.",
    images: ["https://app.walliocard.com/og-image.png"],
  },
  icons: {
    icon: "/wallio-instagram-profil.png",
    apple: "/wallio-instagram-profil.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#EEF2F7",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Wallio",
  alternateName: "Wallio Card",
  url: "https://app.walliocard.com",
  logo: "https://app.walliocard.com/wallio-instagram-profil.png",
  description: "SaaS de cartes de fidélité digitales Apple Wallet & Google Wallet pour commerçants. Sans application à télécharger.",
  sameAs: ["https://www.instagram.com/walliocard"],
  contactPoint: { "@type": "ContactPoint", contactType: "customer support", availableLanguage: ["French", "Arabic"] },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className={`${geist.variable} h-full antialiased`}>
      <head>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
        {/* Capacitor : cache le splash natif dès que le bridge est prêt — avant React */}
        <script dangerouslySetInnerHTML={{ __html: `(function(){var n=0;function h(){try{var p=window.Capacitor;if(p&&p.Plugins&&p.Plugins.SplashScreen){p.Plugins.SplashScreen.hide();return;}}catch(e){}if(n++<40)setTimeout(h,100);}h();})();` }} />
      </head>
      <body className="min-h-full font-[family-name:var(--font-geist)]">
        <LangProvider>
          <AuthProvider>{children}</AuthProvider>
        </LangProvider>
      </body>
    </html>
  );
}
