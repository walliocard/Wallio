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
      { url: "/icon-admin-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-admin-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/apple-touch-icon-admin.png",
  },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
