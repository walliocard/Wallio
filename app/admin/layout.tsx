import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Wallio Admin",
  manifest: "/admin/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Wallio Admin",
  },
  icons: {
    icon: [
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/wallio-instagram-profil.png", sizes: "1000x1000", type: "image/png" },
    ],
    apple: "/wallio-instagram-profil.png",
  },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
