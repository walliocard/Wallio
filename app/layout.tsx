import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { AuthProvider } from "@/lib/auth-context";
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
    icon: [
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className={`${geist.variable} h-full antialiased`}>
      <body className="min-h-full font-[family-name:var(--font-geist)]">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
