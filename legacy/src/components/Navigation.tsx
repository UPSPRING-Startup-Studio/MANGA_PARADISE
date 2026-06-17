import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { User, Lock, Coins, QrCode, MessageCircle } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { useIsAdmin } from "@/hooks/useUserRoles";
import { NavDropdown, NavDropdownItem } from "./navigation/NavDropdown";
import { MobileNav } from "./navigation/MobileNav";
import UserMenuPanel from "./navigation/UserMenuPanel";
import DenDenMushi from "./notifications/DenDenMushi";
import CosCardModal from "./coscard/CosCardModal";
import { useLinkshellContext } from "./linkshell/LinkshellProvider";
import { useChatRooms } from "@/hooks/useLinkshell";

export interface NavigationProps {
  variant?: "default" | "landing";
}

// Navigation structure
const associationItems: NavDropdownItem[] = [{
  label: "Vie Associative",
  href: "/vie-associative"
}, {
  label: "Qui sommes-nous ?",
  href: "/association/qui-sommes-nous"
}, {
  label: "Nos Actions",
  href: "/association/nos-actions"
}, {
  label: "L'Équipe",
  href: "/association/equipe"
}, {
  label: "FAQ",
  href: "/association/faq"
}, {
  label: "Devenir Partenaire",
  href: "/association/partenaires"
}, {
  label: "Back-Office Associatif",
  href: "/association/dashboard",
  isCta: true
}];
const hubItems: NavDropdownItem[] = [{
  label: "Le Tiers-Lieu",
  href: "/le-hub"
}, {
  label: "Le Concept",
  href: "/le-hub/concept"
}, {
  label: "Événements & Ateliers",
  href: "/le-hub/evenements"
}, {
  label: "Soutenir le projet",
  href: "/le-hub/soutenir",
  isCta: true
}, {
  label: "Menu du Bar",
  href: "/le-hub/menu"
}, {
  label: "Location d'espaces",
  href: "/le-hub/location"
}];
const communityItems: NavDropdownItem[] = [{
  label: "🎭 Cos-Feed",
  href: "/feed",
  isCta: true
}, {
  label: "📢 Le Feed",
  href: "/communaute/feed"
}, {
  label: "🔍 Recherche Avancée",
  href: "/search"
}, {
  label: "🗺️ Radar Otaku/Cosplayer",
  href: "/communaute/radar"
}, {
  label: "�️ Les Guildes",
  href: "/guilds"
}, {
  label: "💡 Labs",
  href: "/labs"
}, {
  label: "Actualités & Blog",
  href: "/communaute/actualites"
}, {
  label: "📅 Événements",
  href: "/evenements"
}, {
  label: "Annuaire des Otakus",
  href: "/communaute/annuaire"
}, {
  label: "Le Bazar d'Akihabara",
  href: "/communaute/bazar"
}, {
  label: "Ressources & FAQ",
  href: "/communaute/ressources"
}];

// Combined nav items for mobile
const allNavItems = [{
  label: "Accueil",
  href: "/"
}, {
  label: "Agenda",
  href: "/agenda"
}, {
  label: "Blog",
  href: "/blog"
}, {
  label: "L'Association",
  items: associationItems
}, {
  label: "Le Hub 2027",
  items: hubItems
}, {
  label: "Communauté",
  items: communityItems,
  requiresAuth: true
}, {
  label: "Contact",
  href: "/contact"
}];

// Linkshell Nav Button Component
const LinkshellNavButton = () => {
  const {
    openLinkshell
  } = useLinkshellContext();
  const {
    data: rooms
  } = useChatRooms();
  const totalUnread = rooms?.reduce((acc, room) => acc + (room.unread_count || 0), 0) || 0;
  return <button onClick={openLinkshell} className="relative p-2 rounded-sm border-2 border-manga-ink bg-manga-paper hover:bg-manga-ink hover:text-manga-paper transition-all duration-150" title="Linkshell - Messages">
      <MessageCircle className="h-5 w-5" />
      {totalUnread > 0 && <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-mp-primary text-white rounded-full text-[10px] font-bold flex items-center justify-center border-2 border-manga-ink">
          {totalUnread > 99 ? "99+" : totalUnread}
        </span>}
    </button>;
};
const Navigation = ({ variant = "default" }: NavigationProps) => {
  const location = useLocation();
  const {
    user,
    signOut
  } = useAuth();
  const {
    profile
  } = useProfile();
  const {
    data: isAdmin
  } = useIsAdmin();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isCosCardOpen, setIsCosCardOpen] = useState(false);
  const isActive = (path: string) => location.pathname === path;
  const handleSignOut = async () => {
    await signOut();
  };

  // Landing variant: scroll-aware transparent → solid transition
  const isLanding = variant === "landing";
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    if (!isLanding) return;
    const handler = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", handler, { passive: true });
    handler();
    return () => window.removeEventListener("scroll", handler);
  }, [isLanding]);

  // Landing variant helper: text color class that flips on scroll
  const landingTextClass = isLanding
    ? scrolled ? "text-manga-ink" : "text-white"
    : "text-manga-ink";
  const landingAfterBg = isLanding
    ? scrolled ? "after:bg-manga-ink" : "after:bg-white"
    : "after:bg-manga-ink";

  return <>
      <motion.header initial={{
      y: -100,
      opacity: 0
    }} animate={{
      y: 0,
      opacity: 1
    }} transition={{
      duration: 0.4,
      ease: "easeOut"
    }} className={cn(
      "left-0 right-0 z-50 transition-all duration-300",
      isLanding
        ? cn(
            "fixed",
            scrolled
              ? "bg-white/90 backdrop-blur-xl border-b border-border shadow-sm"
              : "bg-transparent border-b border-transparent"
          )
        : "sticky top-0 manga-halftone border-b-[3px] border-manga-ink"
    )}>
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16 lg:h-20">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 group">
              <img src="https://res.cloudinary.com/dkw8snibz/image/upload/v1768062945/Logo_Manga_Paradise_VIERGE_xhahrh.png" alt="Logo Manga Paradise" className={cn("h-10 object-contain transition-all duration-300", isLanding && !scrolled && "brightness-0 invert")} />

            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-1">
              {/* Accueil */}
              <Link to="/" className={cn("font-sans font-extrabold text-sm tracking-wider uppercase px-3 py-2", "transition-all duration-150 relative", landingTextClass, "after:content-[''] after:absolute after:bottom-0 after:left-1/2 after:-translate-x-1/2 after:w-0 after:h-[3px] after:transition-all after:duration-200", landingAfterBg, isActive("/") ? "after:w-full" : "hover:after:w-full")}>
                Accueil
              </Link>

              {/* Agenda */}
              <Link to="/agenda" className={cn("font-sans font-extrabold text-sm tracking-wider uppercase px-3 py-2", "transition-all duration-150 relative", landingTextClass, "after:content-[''] after:absolute after:bottom-0 after:left-1/2 after:-translate-x-1/2 after:w-0 after:h-[3px] after:transition-all after:duration-200", landingAfterBg, isActive("/agenda") ? "after:w-full" : "hover:after:w-full")}>
                Agenda
              </Link>

              {/* Blog */}
              <Link to="/blog" className={cn("font-sans font-extrabold text-sm tracking-wider uppercase px-3 py-2", "transition-all duration-150 relative", landingTextClass, "after:content-[''] after:absolute after:bottom-0 after:left-1/2 after:-translate-x-1/2 after:w-0 after:h-[3px] after:transition-all after:duration-200", landingAfterBg, isActive("/blog") ? "after:w-full" : "hover:after:w-full")}>
                Blog
              </Link>

              {/* L'Association Dropdown */}
              <NavDropdown label="L'Association" items={associationItems} landingMode={isLanding && !scrolled} />

              {/* Le Hub 2027 Dropdown */}
              <NavDropdown label="LE HUB 2028" items={hubItems} landingMode={isLanding && !scrolled} />

              {/* Communauté - Protected */}
              {user ? <NavDropdown label="Communauté" items={communityItems} landingMode={isLanding && !scrolled} /> : <Link to="/gateway" className={cn("flex items-center gap-1 font-sans font-extrabold text-sm tracking-wider uppercase px-3 py-2", "transition-all duration-150", landingTextClass, !isLanding && "hover:bg-manga-ink hover:text-manga-paper")}>
                  <Lock className="h-3.5 w-3.5" />
                  Communauté
                </Link>}

              {/* Contact */}
              <Link to="/contact" className={cn("font-sans font-extrabold text-sm tracking-wider uppercase px-3 py-2", "transition-all duration-150 relative", landingTextClass, "after:content-[''] after:absolute after:bottom-0 after:left-1/2 after:-translate-x-1/2 after:w-0 after:h-[3px] after:transition-all after:duration-200", landingAfterBg, isActive("/contact") ? "after:w-full" : "hover:after:w-full")}>
                Contact
              </Link>
            </nav>

            {/* Right Side Actions */}
            <div className="flex items-center gap-3">
              {/* CTA Button - Desktop only */}
              {!user && <Button asChild className={cn("hidden lg:flex font-sans font-extrabold text-sm tracking-wider uppercase transition-all duration-150",
                isLanding
                  ? "bg-primary text-primary-foreground border-2 border-primary rounded-full hover:bg-[hsl(var(--mp-primary-600))] hover:border-[hsl(var(--mp-primary-600))] shadow-primary"
                  : "bg-manga-ink text-manga-paper border-2 border-manga-ink rounded-sm hover:bg-manga-paper hover:text-manga-ink"
              )}>
                  <Link to="/nous-rejoindre">NOUS REJOINDRE</Link>
                </Button>}

              {/* Cos-Card QR Button */}
              {user && <button onClick={() => setIsCosCardOpen(true)} className={cn("p-2 rounded-sm border-2 transition-all duration-150",
                isLanding && !scrolled
                  ? "border-white/40 text-white hover:bg-white/15"
                  : "border-manga-ink bg-manga-paper hover:bg-manga-ink hover:text-manga-paper"
              )} title="Cos-Card">
                  <QrCode className="h-5 w-5" />
                </button>}

              {/* Linkshell - Chat */}
              {user && <LinkshellNavButton />}

              {/* Den Den Mushi - Notifications */}
              {user && <DenDenMushi />}

              {/* User Menu Trigger */}
              {user ? <button onClick={() => setIsUserMenuOpen(true)} className={cn("flex items-center gap-2 p-1.5 rounded-sm border-2 transition-all duration-150",
                isLanding && !scrolled
                  ? "border-white/40 hover:bg-white/15"
                  : "border-manga-ink bg-manga-paper hover:bg-manga-ink hover:text-manga-paper"
              )}>
                  <div className={cn("w-8 h-8 rounded-sm bg-gradient-hero flex items-center justify-center text-sm overflow-hidden border-2",
                    isLanding && !scrolled ? "border-white/40" : "border-manga-ink"
                  )}>
                    {profile?.avatar_url ? <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" /> : "🎮"}
                  </div>
                  <div className="hidden md:flex flex-col items-start pr-1">
                    <span className={cn("text-xs font-bold", isLanding && !scrolled && "text-white")}>
                      {profile?.display_name || profile?.username || "Membre"}
                    </span>
                    <div className={cn("flex items-center gap-1 text-xs font-semibold", isLanding && !scrolled ? "text-mp-coral" : "text-mp-primary")}>
                      <Coins className="h-3 w-3" />
                      <span>{profile?.otk_coins || 0}</span>
                    </div>
                  </div>
                </button> : <Link to="/gateway" className={cn("hidden lg:flex items-center gap-2 p-2 rounded-sm border-2 transition-all duration-150",
                  isLanding && !scrolled
                    ? "border-white/40 text-white hover:bg-white/15"
                    : "border-manga-ink bg-manga-paper hover:bg-manga-ink hover:text-manga-paper"
                )}>
                  <User className="h-5 w-5" />
                </Link>}

              {/* Mobile Nav */}
              <MobileNav navItems={allNavItems} landingMode={isLanding && !scrolled} />
            </div>
          </div>
        </div>
      </motion.header>

      {/* User Menu Panel */}
      <UserMenuPanel isOpen={isUserMenuOpen} onClose={() => setIsUserMenuOpen(false)} profile={profile} onSignOut={handleSignOut} isAdmin={isAdmin ?? false} />

      {/* Cos-Card Modal */}
      <CosCardModal isOpen={isCosCardOpen} onClose={() => setIsCosCardOpen(false)} />
    </>;
};
export default Navigation;