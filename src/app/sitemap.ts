import type { MetadataRoute } from "next";

const baseUrl =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://manga-paradise-five.vercel.app";

/** Pages publiques indexables. */
const PATHS = [
  "",
  "/login",
  "/register",
  "/mentions-legales",
  "/confidentialite",
  "/cgu",
] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  return PATHS.map((path) => ({
    url: `${baseUrl}${path}`,
    lastModified,
    changeFrequency: "monthly",
    priority: path === "" ? 1 : 0.6,
  }));
}
