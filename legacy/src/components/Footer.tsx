import { Link } from "react-router-dom";
import { Heart, Mail, Phone, MapPin, Globe, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

// Discord icon component
const DiscordIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
  </svg>
);

const InstagramIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
  </svg>
);

const TikTokIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
  </svg>
);

const Footer = () => {
  const [email, setEmail] = useState("");
  const [isSubscribing, setIsSubscribing] = useState(false);

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsSubscribing(true);
    try {
      const { error } = await supabase
        .from("newsletter_subscribers")
        .insert({ email, source: "footer" });

      if (error) {
        if (error.code === "23505") {
          toast({ title: "Déjà inscrit !", description: "Cet email est déjà dans notre liste." });
        } else {
          throw error;
        }
      } else {
        toast({ title: "Inscription réussie !", description: "Bienvenue dans la communauté !" });
        setEmail("");
      }
    } catch {
      toast({ title: "Erreur", description: "Une erreur est survenue.", variant: "destructive" });
    } finally {
      setIsSubscribing(false);
    }
  };

  return (
    <footer className="bg-mp-night text-white border-t border-mp-night-border">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">

          {/* Logo & Description */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-mp-primary to-mp-coral flex items-center justify-center text-white font-display italic text-xl font-bold shadow-primary">
                MP
              </div>
              <div>
                <h3 className="text-white font-display italic text-lg font-bold">Manga Paradise</h3>
                <p className="text-slate-300 text-sm">Association culturelle</p>
              </div>
            </div>
            <p className="text-slate-300 text-sm leading-relaxed">
              Association à but non lucratif dédiée à la promotion de la culture japonaise moderne
              à travers des événements inclusifs et créatifs.
            </p>
            <p className="text-slate-400 text-xs flex items-center gap-1.5">
              <Heart className="w-3 h-3 text-mp-primary" />
              Depuis 2020 • Nice, Côte d'Azur
            </p>
          </div>

          {/* Contact Info */}
          <div className="space-y-4">
            <h4 className="text-white font-display italic text-lg font-semibold">Contact</h4>
            <div className="space-y-3">
              <a
                href="mailto:contact@manga-paradise.fr"
                className="flex items-center gap-3 text-slate-300 hover:text-mp-primary transition-colors text-sm group"
              >
                <Mail className="w-4 h-4 text-mp-primary group-hover:scale-110 transition-transform" />
                contact@manga-paradise.fr
              </a>
              <a
                href="tel:0682624535"
                className="flex items-center gap-3 text-slate-300 hover:text-mp-primary transition-colors text-sm group"
              >
                <Phone className="w-4 h-4 text-mp-primary group-hover:scale-110 transition-transform" />
                06 82 62 45 35
              </a>
              <p className="flex items-center gap-3 text-slate-300 text-sm">
                <MapPin className="w-4 h-4 text-mp-primary" />
                Nice, Alpes-Maritimes (06)
              </p>
              <a
                href="https://www.manga-paradise.fr"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 text-slate-300 hover:text-mp-primary transition-colors text-sm group"
              >
                <Globe className="w-4 h-4 text-mp-primary group-hover:scale-110 transition-transform" />
                www.manga-paradise.fr
              </a>
            </div>
          </div>

          {/* Social & Community */}
          <div className="space-y-4">
            <h4 className="text-white font-display italic text-lg font-semibold">Notre communauté</h4>
            <div className="space-y-3">
              <a
                href="https://www.instagram.com/mangaparadisesud/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 rounded-lg bg-mp-night-card border border-mp-night-border hover:border-mp-primary/40 transition-all group"
              >
                <InstagramIcon className="w-5 h-5 text-mp-primary" />
                <div>
                  <p className="text-white text-sm font-medium">Instagram</p>
                  <p className="text-slate-400 text-xs">2 800+ abonnés actifs</p>
                </div>
              </a>
              <a
                href="https://discord.gg/RpEtcQeMa3"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 rounded-lg bg-mp-night-card border border-mp-night-border hover:border-mp-violet/40 transition-all group"
              >
                <DiscordIcon className="w-5 h-5 text-mp-violet" />
                <div>
                  <p className="text-white text-sm font-medium">Discord</p>
                  <p className="text-slate-400 text-xs">300+ membres</p>
                </div>
              </a>
              <a
                href="https://www.tiktok.com/@mangaparadise06"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 rounded-lg bg-mp-night-card border border-mp-night-border hover:border-mp-coral/40 transition-all group"
              >
                <TikTokIcon className="w-5 h-5 text-mp-coral" />
                <div>
                  <p className="text-white text-sm font-medium">TikTok</p>
                  <p className="text-slate-400 text-xs">Suivez nos lives !</p>
                </div>
              </a>
            </div>
          </div>

          {/* Newsletter & Partner */}
          <div className="space-y-6">
            {/* Newsletter */}
            <div className="space-y-3">
              <h4 className="text-white font-display italic text-lg font-semibold">Newsletter</h4>
              <p className="text-slate-300 text-sm">Restez informé de nos événements et actualités.</p>
              <form onSubmit={handleNewsletterSubmit} className="flex gap-2">
                <Input
                  type="email"
                  placeholder="votre@email.fr"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-mp-night-card border-mp-night-border text-white placeholder:text-slate-400 focus-visible:border-mp-primary focus-visible:ring-mp-primary/30"
                />
                <Button
                  type="submit"
                  size="icon"
                  disabled={isSubscribing}
                  className="shrink-0"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </form>
            </div>

            {/* Partner Access */}
            <div className="p-4 rounded-lg bg-mp-night-card border border-mp-night-border">
              <p className="text-white text-sm font-medium mb-1">Vous êtes partenaire ?</p>
              <p className="text-slate-300 text-xs mb-3">
                Accédez à votre espace dédié pour suivre nos collaborations.
              </p>
              <Link
                to="/auth"
                className="inline-flex items-center text-mp-primary hover:text-mp-coral text-sm font-medium transition-colors"
              >
                Espace partenaire →
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-mp-night-border">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-slate-400 text-sm text-center md:text-left">
              © 2025 Manga Paradise. Tous droits réservés. Association loi 1901.
            </p>
            <div className="flex items-center gap-6">
              <Link to="/mentions-legales" className="text-slate-400 hover:text-mp-primary text-sm transition-colors">
                Mentions légales
              </Link>
              <Link to="/confidentialite" className="text-slate-400 hover:text-mp-primary text-sm transition-colors">
                Politique de confidentialité
              </Link>
              <Link to="/cgu" className="text-slate-400 hover:text-mp-primary text-sm transition-colors">
                CGU
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
