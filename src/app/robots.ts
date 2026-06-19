import type { MetadataRoute } from "next";

const baseUrl =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://manga-paradise-five.vercel.app";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Espaces gardés par auth : inutiles à explorer.
      disallow: [
        "/espace-membre",
        "/admin",
        "/pro",
        "/association",
        "/onboarding",
        "/agenda",
        "/communaute",
        "/cosplay",
        "/mes-amis",
        "/annuaire",
        "/profil",
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
