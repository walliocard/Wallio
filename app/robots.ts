import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/choisir", "/privacy", "/terms", "/legal"],
        disallow: ["/dashboard/", "/admin/", "/api/", "/auth/", "/nfc/", "/client/", "/preferences/", "/mes-cartes", "/ref/"],
      },
    ],
    sitemap: "https://app.walliocard.com/sitemap.xml",
  };
}
