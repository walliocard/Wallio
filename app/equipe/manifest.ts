import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Wallio Dashboard",
    short_name: "Dashboard",
    description: "Espace équipe Wallio",
    start_url: "/equipe/scanner",
    scope: "/equipe",
    display: "standalone",
    orientation: "portrait",
    background_color: "#F5F5F7",
    theme_color: "#F5F5F7",
    icons: [
      { src: "/icon-dashboard-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-dashboard-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-dashboard-512-maskable.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
