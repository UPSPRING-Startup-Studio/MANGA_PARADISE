import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, ChevronDown, User, Lock, LogOut, Coins } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { NavDropdownItem } from "./NavDropdown";

interface MobileNavProps {
  navItems: {
    label: string;
    href?: string;
    items?: NavDropdownItem[];
    requiresAuth?: boolean;
  }[];
  landingMode?: boolean;
}

export const MobileNav = ({ navItems, landingMode = false }: MobileNavProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const { user, signOut } = useAuth();
  const { profile } = useProfile();

  const toggleExpanded = (label: string) => {
    setExpandedItems(prev =>
      prev.includes(label)
        ? prev.filter(item => item !== label)
        : [...prev, label]
    );
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } finally {
      // Hard logout: clear any persisted state and reload on /auth
      try {
        localStorage.clear();
        sessionStorage.clear();
      } catch {
        // ignore
      }
      window.location.href = "/auth";
    }
  };

  return (
    <div className="lg:hidden">
      {/* Burger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "p-2 rounded-sm border-2 transition-all duration-150",
          landingMode
            ? "border-white/40 text-white hover:bg-white/15"
            : "border-manga-ink bg-manga-paper hover:bg-manga-ink hover:text-manga-paper"
        )}
        aria-label="Toggle menu"
      >
        {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </button>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-manga-ink/80 z-40"
              onClick={() => setIsOpen(false)}
            />

            {/* Slide-in Menu - Manga Ink Style */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className={cn(
                "fixed top-0 right-0 h-full w-[300px] z-50",
                "manga-halftone border-l-[3px] border-manga-ink",
                "overflow-y-auto"
              )}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b-[3px] border-manga-ink">
                <span className="font-sans font-extrabold text-xl text-manga-ink tracking-wider uppercase">MENU</span>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 rounded-sm border-2 border-manga-ink bg-manga-paper hover:bg-manga-ink hover:text-manga-paper transition-all duration-150"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* User Info if logged in */}
              {user && profile && (
                <div className="p-4 border-b-[3px] border-manga-ink bg-manga-paper">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-sm bg-gradient-hero flex items-center justify-center text-lg border-2 border-manga-ink overflow-hidden">
                      {profile.avatar_url ? (
                        <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        "🎮"
                      )}
                    </div>
                    <div>
                      <p className="font-bold text-manga-ink text-sm uppercase">
                        {profile.display_name || profile.username}
                      </p>
                      <div className="flex items-center gap-1 text-xs text-sakura font-bold">
                        <Coins className="h-3 w-3" />
                        {profile.otk_coins} OTK
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Nav Items */}
              <nav className="p-4 space-y-1">
                {navItems.map((item, index) => {
                  // Handle auth-required items
                  if (item.requiresAuth && !user) {
                    return (
                      <Link
                        key={index}
                        to="/gateway"
                        onClick={() => setIsOpen(false)}
                        className={cn(
                          "flex items-center gap-2 px-3 py-3 rounded-sm",
                          "font-sans font-extrabold text-sm tracking-wider uppercase",
                          "text-manga-ink border-2 border-transparent",
                          "hover:bg-manga-ink hover:text-manga-paper transition-all duration-150"
                        )}
                      >
                        <Lock className="h-4 w-4" />
                        {item.label}
                      </Link>
                    );
                  }

                  // Simple link
                  if (item.href && !item.items) {
                    return (
                      <Link
                        key={index}
                        to={item.href}
                        onClick={() => setIsOpen(false)}
                        className={cn(
                          "block px-3 py-3 rounded-sm",
                          "font-sans font-extrabold text-sm tracking-wider uppercase",
                          "text-manga-ink",
                          "hover:bg-manga-ink hover:text-manga-paper transition-all duration-150"
                        )}
                      >
                        {item.label}
                      </Link>
                    );
                  }

                  // Dropdown accordion
                  if (item.items) {
                    const isExpanded = expandedItems.includes(item.label);
                    return (
                      <div key={index}>
                        <button
                          onClick={() => toggleExpanded(item.label)}
                          className={cn(
                            "flex items-center justify-between w-full px-3 py-3 rounded-sm",
                            "font-sans font-extrabold text-sm tracking-wider uppercase",
                            "text-manga-ink",
                            "hover:bg-manga-ink hover:text-manga-paper transition-all duration-150",
                            isExpanded && "bg-manga-ink text-manga-paper"
                          )}
                        >
                          <span>{item.label}</span>
                          <ChevronDown
                            className={cn(
                              "h-4 w-4 transition-transform duration-200",
                              isExpanded && "rotate-180"
                            )}
                          />
                        </button>
                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                              className="overflow-hidden"
                            >
                              <div className="pl-4 py-2 space-y-1 border-l-[3px] border-manga-ink ml-3">
                                {item.items.map((subItem, subIndex) => (
                                  <Link
                                    key={subIndex}
                                    to={subItem.href}
                                    onClick={() => setIsOpen(false)}
                                    className={cn(
                                      "block px-3 py-2 rounded-sm text-sm font-sans font-semibold",
                                      subItem.isCta
                                        ? "bg-manga-ink text-manga-paper text-center uppercase tracking-wider hover:bg-manga-paper hover:text-manga-ink border-2 border-manga-ink"
                                        : "text-manga-ink hover:bg-manga-ink hover:text-manga-paper"
                                    )}
                                  >
                                    {subItem.label}
                                  </Link>
                                ))}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  }

                  return null;
                })}
              </nav>

              {/* CTA & Auth Section */}
              <div className="p-4 border-t-[3px] border-manga-ink space-y-3">
                {!user && (
                  <Button
                    asChild
                    className="w-full bg-manga-ink text-manga-paper font-sans font-extrabold text-sm tracking-wider uppercase border-2 border-manga-ink rounded-sm hover:bg-manga-paper hover:text-manga-ink transition-all duration-150"
                  >
                    <Link to="/gateway" onClick={() => setIsOpen(false)}>
                      NOUS REJOINDRE
                    </Link>
                  </Button>
                )}

                {user ? (
                  <>
                    <Button
                      asChild
                      variant="outline"
                      className="w-full border-2 border-manga-ink bg-manga-paper text-manga-ink font-bold uppercase rounded-sm hover:bg-manga-ink hover:text-manga-paper"
                    >
                      <Link to="/espace-membre" onClick={() => setIsOpen(false)}>
                        <User className="h-4 w-4 mr-2" />
                        Mon Espace
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full text-manga-ink font-bold uppercase rounded-sm border-2 border-transparent hover:border-manga-ink hover:bg-manga-paper"
                      onClick={handleSignOut}
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Déconnexion
                    </Button>
                  </>
                ) : (
                  <Button
                    asChild
                    variant="outline"
                    className="w-full border-2 border-manga-ink bg-manga-paper text-manga-ink font-bold uppercase rounded-sm hover:bg-manga-ink hover:text-manga-paper"
                  >
                    <Link to="/gateway" onClick={() => setIsOpen(false)}>
                      <User className="h-4 w-4 mr-2" />
                      Connexion
                    </Link>
                  </Button>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
