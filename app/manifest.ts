import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Wallio",
    short_name: "Wallio",
    description: "Cartes de fidélité digitales",
    start_url: "/dashboard",
    display: "standalone",
    orientation: "portrait",
    background_color: "#0B0B0D",
    theme_color: "#007AFF",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-512-maskable.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
