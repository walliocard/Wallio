import type { Metadata, Viewport } from "next";
import DashboardClientLayout from "./client-layout";

export const metadata: Metadata = {
  title: "Wallio Marchand",
  manifest: "/dashboard/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Wallio",
  },
  icons: {
    apple: "/wallio-instagram-profil.png",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)",  color: "#0A0A0A" },
    { media: "(prefers-color-scheme: light)", color: "#F5F5F7" },
  ],
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <DashboardClientLayout>{children}</DashboardClientLayout>;
}
