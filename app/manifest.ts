import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Wallio",
    short_name: "Wallio",
    description: "Cartes de fidélité digitales",
    start_url: "/mes-cartes",
    display: "standalone",
    orientation: "portrait",
    background_color: "#EEF2F7",
    theme_color: "#EEF2F7",
    icons: [
      { src: "/wallio-instagram-profil.png", sizes: "1000x1000", type: "image/png", purpose: "any" },
      { src: "/icon-512-maskable.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
