import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Wallio Dashboard",
    short_name: "Wallio",
    description: "Espace marchand Wallio — cartes de fidélité digitales",
    start_url: "/mes-cartes",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#F5F5F7",
    theme_color: "#007AFF",
    icons: [
      { src: "/wallio-instagram-profil.png", sizes: "1000x1000", type: "image/png", purpose: "any" },
      { src: "/icon-512-maskable.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
