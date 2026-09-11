import type { Metadata } from "next";
import DashboardClientLayout from "./client-layout";

export const metadata: Metadata = {
  title: "Wallio Marchand",
  manifest: "/dashboard/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Wallio",
  },
  icons: {
    apple: "/wallio-instagram-profil.png",
  },
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <DashboardClientLayout>{children}</DashboardClientLayout>;
}
