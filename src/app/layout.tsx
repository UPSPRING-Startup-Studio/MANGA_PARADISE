import type { Metadata } from "next";
import { Poppins, Barlow_Condensed, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";

const sans = Poppins({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const heading = Barlow_Condensed({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["700", "800"],
  style: ["normal", "italic"],
});

const mono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["500", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "Manga Paradise",
    template: "%s · Manga Paradise",
  },
  description:
    "La plateforme de la communauté manga, cosplay et événementielle.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="fr"
      suppressHydrationWarning
      className={`${sans.variable} ${heading.variable} ${mono.variable}`}
    >
      <body className="min-h-dvh">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
