import type { Metadata, Viewport } from "next";
import DashboardClientLayout from "./client-layout";

export const metadata: Metadata = {
  title: "Wallio Marchand",
  manifest: "/dashboard/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black",
    title: "Wallio",
  },
  icons: {
    icon: "/wallio-instagram-profil.png",
    apple: "/icon-dashboard-192.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#F5F5F7",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <DashboardClientLayout>{children}</DashboardClientLayout>;
}
