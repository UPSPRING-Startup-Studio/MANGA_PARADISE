import type { NextConfig } from "next";

/**
 * En-têtes de sécurité (clickjacking, sniffing, isolation, HTTPS).
 * `same-origin-allow-popups` pour COOP afin de ne pas casser les popups OAuth.
 * NB : CSP / Trusted Types non inclus ici (à câbler séparément avec soin pour
 * ne pas bloquer Supabase / Vimeo / Cloudinary).
 */
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin-allow-popups" },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains",
  },
];

const nextConfig: NextConfig = {
  // Dev uniquement : autorise l'acces au serveur de dev depuis le reseau local
  // (ex. tester sur mobile via http://<ip-lan>:3000). Ajoute ici ton IP LAN.
  // Pour un contexte « securise » complet (cookies de session fiables sur IP/mobile),
  // prefere `next dev --experimental-https`.
  allowedDevOrigins: ["192.168.200.100"],
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
