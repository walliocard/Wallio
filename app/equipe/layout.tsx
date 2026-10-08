import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "Wallio Dashboard",
  manifest: "/equipe/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black",
    title: "Dashboard",
  },
  icons: {
    apple: "/icon-dashboard-192.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#F5F5F7",
};

export default function EquipeLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
