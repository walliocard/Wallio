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
    apple: "/apple-touch-icon-admin.png",
  },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
