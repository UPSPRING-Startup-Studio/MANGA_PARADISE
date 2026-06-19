import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Dev uniquement : autorise l'acces au serveur de dev depuis le reseau local
  // (ex. tester sur mobile via http://<ip-lan>:3000). Ajoute ici ton IP LAN.
  // Pour un contexte « securise » complet (cookies de session fiables sur IP/mobile),
  // prefere `next dev --experimental-https`.
  allowedDevOrigins: ["192.168.200.100"],
};

export default nextConfig;
