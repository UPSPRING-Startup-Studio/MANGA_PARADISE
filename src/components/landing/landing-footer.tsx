import Link from "next/link";
import { Globe, Heart, Mail, MapPin, Phone } from "lucide-react";
import { NewsletterForm } from "@/components/landing/newsletter-form";

function DiscordIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
    >
      <path d="M20.317 4.37a19.79 19.79 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.74 19.74 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.1 13.1 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.3 12.3 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.84 19.84 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
    </svg>
  );
}

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
    >
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z" />
    </svg>
  );
}

function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
    >
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
    </svg>
  );
}

const CONTACT = [
  {
    icon: Mail,
    label: "contact@manga-paradise.fr",
    href: "mailto:contact@manga-paradise.fr",
  },
  { icon: Phone, label: "06 82 62 45 35", href: "tel:0682624535" },
  { icon: MapPin, label: "Nice, Alpes-Maritimes (06)", href: null },
  {
    icon: Globe,
    label: "www.manga-paradise.fr",
    href: "https://www.manga-paradise.fr",
  },
];

const SOCIALS = [
  {
    Icon: InstagramIcon,
    name: "Instagram",
    detail: "2 800+ abonnés actifs",
    href: "https://www.instagram.com/mangaparadisesud/",
    color: "text-mp-primary",
    hover: "hover:border-mp-primary/40",
  },
  {
    Icon: DiscordIcon,
    name: "Discord",
    detail: "300+ membres",
    href: "https://discord.gg/RpEtcQeMa3",
    color: "text-mp-violet",
    hover: "hover:border-mp-violet/40",
  },
  {
    Icon: TikTokIcon,
    name: "TikTok",
    detail: "Suivez nos lives !",
    href: "https://www.tiktok.com/@mangaparadise06",
    color: "text-mp-coral",
    hover: "hover:border-mp-coral/40",
  },
];

const LEGAL = [
  { href: "/mentions-legales", label: "Mentions légales" },
  { href: "/confidentialite", label: "Politique de confidentialité" },
  { href: "/cgu", label: "CGU" },
];

/** Pied de page principal : association, contact, réseaux, newsletter, mentions. */
export function LandingFooter() {
  return (
    <footer className="bg-mp-night border-t border-white/10 text-white/70">
      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-4">
          {/* Association */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="from-mp-primary to-mp-coral font-heading grid size-12 place-items-center rounded-xl bg-linear-to-br text-xl font-bold text-white italic">
                MP
              </span>
              <span>
                <span className="font-heading block text-lg font-bold text-white italic">
                  Manga Paradise
                </span>
                <span className="block text-sm text-white/60">
                  Association culturelle
                </span>
              </span>
            </div>
            <p className="text-sm leading-relaxed text-white/70">
              Association à but non lucratif dédiée à la promotion de la culture
              japonaise moderne à travers des événements inclusifs et créatifs.
            </p>
            <p className="flex items-center gap-1.5 text-xs text-white/50">
              <Heart className="text-mp-primary size-3" />
              Depuis 2020 · Nice, Côte d&apos;Azur
            </p>
          </div>

          {/* Contact */}
          <div className="space-y-4">
            <h2 className="font-heading text-lg font-semibold text-white italic">
              Contact
            </h2>
            <div className="space-y-3">
              {CONTACT.map(({ icon: Icon, label, href }) =>
                href ? (
                  <a
                    key={label}
                    href={href}
                    className="hover:text-mp-primary flex items-center gap-3 text-sm transition-colors"
                  >
                    <Icon className="text-mp-primary size-4" /> {label}
                  </a>
                ) : (
                  <p key={label} className="flex items-center gap-3 text-sm">
                    <Icon className="text-mp-primary size-4" /> {label}
                  </p>
                ),
              )}
            </div>
          </div>

          {/* Communauté */}
          <div className="space-y-4">
            <h2 className="font-heading text-lg font-semibold text-white italic">
              Notre communauté
            </h2>
            <div className="space-y-3">
              {SOCIALS.map(({ Icon, name, detail, href, color, hover }) => (
                <a
                  key={name}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex items-center gap-3 rounded-lg border border-white/10 bg-white/5 p-3 transition-colors ${hover}`}
                >
                  <Icon className={`size-5 ${color}`} />
                  <span>
                    <span className="block text-sm font-medium text-white">
                      {name}
                    </span>
                    <span className="block text-xs text-white/50">
                      {detail}
                    </span>
                  </span>
                </a>
              ))}
            </div>
          </div>

          {/* Newsletter + Partenaire */}
          <div className="space-y-6">
            <div className="space-y-3">
              <h2 className="font-heading text-lg font-semibold text-white italic">
                Newsletter
              </h2>
              <p className="text-sm text-white/70">
                Restez informé de nos événements et actualités.
              </p>
              <NewsletterForm />
            </div>
            <div className="rounded-lg border border-white/10 bg-white/5 p-4">
              <p className="mb-1 text-sm font-medium text-white">
                Vous êtes partenaire ?
              </p>
              <p className="mb-3 text-xs text-white/60">
                Accédez à votre espace dédié pour suivre nos collaborations.
              </p>
              <Link
                href="/login"
                className="text-mp-primary hover:text-mp-coral inline-flex items-center text-sm font-medium transition-colors"
              >
                Espace partenaire →
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 md:flex-row">
          <p className="text-center text-sm text-white/50 md:text-left">
            © {new Date().getFullYear()} Manga Paradise. Tous droits réservés.
            Association loi 1901.
          </p>
          <nav className="flex flex-wrap items-center justify-center gap-6">
            {LEGAL.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="hover:text-mp-primary text-sm transition-colors"
              >
                {l.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </footer>
  );
}
