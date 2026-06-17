import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  ScrollText,
  Trophy,
  CalendarDays,
  ShoppingBag,
  Users,
  Palette,
  CreditCard,
  Settings,
  LogOut,
  Coins,
  X,
  Drama,
  Shield,
  Heart,
  Castle,
  Gamepad2,
  Sparkles,
  Landmark,
  Shirt,
  Camera,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { usePendingFriendRequestsCount } from "@/hooks/useFriendshipExtras";
import { useProfile } from "@/hooks/useProfile";
import { useMyAssociation } from "@/hooks/useAssociation";

interface UserMenuPanelProps {
  isOpen: boolean;
  onClose: () => void;
  profile?: {
    username?: string | null;
    display_name?: string | null;
    avatar_url?: string | null;
    otk_coins?: number;
    membership_tier?: string | null;
    is_subscription_active?: boolean | null;
    is_creator_profile_active?: boolean | null;
    is_cosplayer_mode_active?: boolean | null;
    is_gamer_mode_active?: boolean | null;
    is_otaku_mode_active?: boolean | null;
  } | null;
  onSignOut: () => Promise<void> | void;
  isAdmin?: boolean;
}

const UserMenuPanel = ({ isOpen, onClose, profile, onSignOut, isAdmin = false }: UserMenuPanelProps) => {
  const { user } = useAuth();
  const { data: pendingFriendCount = 0 } = usePendingFriendRequestsCount(user?.id);
  const { data: myAssociation } = useMyAssociation();
  
  // Use live profile data from React Query for reactivity
  const { profile: liveProfile } = useProfile();
  
  // Use liveProfile in priority, fallback to prop profile
  const activeProfile = liveProfile || profile;
  
  const displayName = activeProfile?.display_name || activeProfile?.username || "Membre";
  const otkCoins = activeProfile?.otk_coins || 0;
  const membershipTier = activeProfile?.membership_tier || "bronze";
  const isSubscriptionActive = activeProfile?.is_subscription_active ?? false;
  const isCreatorActive = activeProfile?.is_creator_profile_active ?? false;
  const isGamerActive = activeProfile?.is_gamer_mode_active ?? false;
  const isOtakuActive = activeProfile?.is_otaku_mode_active ?? false;
  const isCosplayerActive = activeProfile?.is_cosplayer_mode_active ?? false;

  const getTierLabel = (tier: string) => {
    switch (tier) {
      case "gold": return "Sensei";
      case "silver": return "Senpai";
      default: return "Shonen";
    }
  };

  const handleLogout = async () => {
    try {
      // Clear React auth state as well (even if network signOut fails)
      await Promise.resolve(onSignOut());
    } catch {
      // ignore
    }

    try {
      await supabase.auth.signOut();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error("Erreur signOut:", message);
    } finally {
      // Force le nettoyage local et la redirection quoi qu'il arrive
      try {
        localStorage.clear();
        sessionStorage.clear();
      } catch {
        // ignore
      }

      window.location.href = "/auth";
    }
  };

  // Build menu groups with the correct existing routes from App.tsx
  const menuGroups = [
    {
      title: "Mon Aventure",
      items: [
        { label: "Tableau de Bord", href: "/espace-membre", icon: LayoutDashboard },
        { label: "Ma Vie Associative", href: "/vie-associative", icon: Landmark },
        { label: "Mes Quêtes", href: "/espace-membre/quetes", icon: ScrollText },
        { label: "Mes Badges & League", href: "/espace-membre/achievements", icon: Trophy },
        { label: "Mon Vestiaire Cosplay", href: "/espace-membre/vestiaire", icon: Shirt, isNew: true },
        { label: "Mes Photos Cosplay", href: "/espace-membre/mes-photos", icon: Camera },
        { label: "Le Bazar d'Akihabara", href: "/communaute/bazar", icon: ShoppingBag },
      ]
    },
    {
      title: "Communauté",
      items: [
        { label: "Mes Billets / Agenda", href: "/espace-membre/billets", icon: CalendarDays },
        { label: "Mes Guildes", href: "/guilds", icon: Castle },
        { label: "Mes Nakamas", href: "/espace-membre/amis", icon: Heart, badgeCount: pendingFriendCount },
        { label: "Annuaire des Membres", href: "/communaute/annuaire", icon: Users },
      ]
    },
    {
      title: "Mon Compte",
      items: [
        { label: "Paramètres", href: "/espace-membre/parametres", icon: Settings },
        { label: "Ma Cotisation", href: "/espace-membre", icon: CreditCard, showStatus: true }, // TODO: create /subscription page
        // Dynamic profile links based on activated modes - same order as Settings sidebar
        ...(isOtakuActive ? [{ label: "Mon Profil Otaku", href: "/espace-membre/parametres?tab=otaku", icon: Sparkles }] : []),
        ...(isCosplayerActive ? [{ label: "Mon Profil Cosplayer", href: "/espace-membre/parametres?tab=cosplayer", icon: Drama }] : []),
        ...(isCreatorActive ? [{ label: "Mon Profil Créatif", href: "/espace-membre/parametres?tab=creative", icon: Palette }] : []),
        ...(isGamerActive ? [{ label: "Mon Profil Gamer", href: "/espace-membre/parametres?tab=gamer", icon: Gamepad2 }] : []),
      ]
    }
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/50 z-[100]"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            initial={{ x: "100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed top-0 right-0 h-full w-[320px] bg-tokyo-night z-[101] shadow-2xl overflow-y-auto"
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-lg hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5 text-white/70" />
            </button>

            {/* Header */}
            <div className="p-6 border-b border-white/10">
              <div className="flex items-center gap-4 mb-4">
                <div className="relative">
                  <div className="w-16 h-16 rounded-full bg-gradient-hero flex items-center justify-center text-2xl overflow-hidden border-2 border-sakura">
                    {activeProfile?.avatar_url ? (
                      <img src={activeProfile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      "🎮"
                    )}
                  </div>
                  {/* Class Badge */}
                  <span className="absolute -bottom-1 -right-1 px-2 py-0.5 bg-sakura text-white text-[10px] font-bold rounded-full">
                    {getTierLabel(membershipTier)}
                  </span>
                </div>
                <div>
                  <h3 className="text-white font-display text-xl tracking-wide">{displayName}</h3>
                  <p className="text-white/60 text-sm">Niveau 1</p>
                </div>
              </div>

              {/* OTK Coins Display */}
              <div className="flex items-center justify-center gap-2 p-3 bg-white/5 rounded-xl border border-accent/30">
                <Coins className="w-6 h-6 text-accent" />
                <span className="text-accent font-display text-2xl tracking-wider">{otkCoins}</span>
                <span className="text-white/60 text-sm">OTK Coins</span>
              </div>
            </div>

            {/* Menu Groups */}
            <div className="p-4">
              {menuGroups.map((group, groupIndex) => (
                <div key={group.title} className={cn("mb-4", groupIndex === menuGroups.length - 1 && "border-t border-white/10 pt-4")}>
                  <h4 className="text-white/40 text-xs uppercase tracking-wider mb-2 px-3">
                    {group.title}
                  </h4>
                  <nav className="space-y-1">
                    {group.items.map((item) => (
                      <Link
                        key={item.label}
                        to={item.href}
                        onClick={onClose}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2.5 rounded-lg",
                          "text-white/90 hover:text-white",
                          "hover:bg-[#362F4B] transition-all duration-200",
                          "border-l-3 border-transparent hover:border-sakura",
                          "group relative"
                        )}
                      >
                        <item.icon className="w-5 h-5 text-turquoise group-hover:text-turquoise" />
                        <span className="font-medium text-sm">{item.label}</span>
                        
                        {/* NEW Badge */}
                        {'isNew' in item && item.isNew && (
                          <span className="ml-auto px-1.5 py-0.5 bg-accent text-tokyo-night text-[10px] font-bold rounded">
                            NEW
                          </span>
                        )}
                        
                        {/* Friend Request Badge */}
                        {'badgeCount' in item && typeof item.badgeCount === 'number' && item.badgeCount > 0 && (
                          <span className="ml-auto flex items-center justify-center w-5 h-5 bg-destructive text-white text-[10px] font-bold rounded-full">
                            {item.badgeCount > 9 ? '9+' : item.badgeCount}
                          </span>
                        )}
                        
                        {/* Subscription Status */}
                        {'showStatus' in item && item.showStatus && (
                          <span className={cn(
                            "ml-auto w-2.5 h-2.5 rounded-full",
                            isSubscriptionActive ? "bg-success" : "bg-destructive"
                          )} />
                        )}
                      </Link>
                    ))}
                  </nav>
                </div>
              ))}

              {/* Association Back-Office - Visible si membre d'une association */}
              {myAssociation && (
                <div className="mb-4 border-t border-white/10 pt-4">
                  <h4 className="text-white/40 text-xs uppercase tracking-wider mb-2 px-3">
                    Association
                  </h4>
                  <Link
                    to="/association"
                    onClick={onClose}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg",
                      "text-[#E84A2B] hover:text-[#F26B2E]",
                      "hover:bg-[#E84A2B]/10 transition-all duration-200",
                      "border-l-3 border-transparent hover:border-[#E84A2B]",
                      "group"
                    )}
                  >
                    <Landmark className="w-5 h-5 text-[#E84A2B]" />
                    <span className="font-medium text-sm">Back-Office Associatif</span>
                  </Link>
                </div>
              )}

              {/* Admin Button - Only visible for admins */}
              {isAdmin && (
                <div className="mb-4 border-t border-white/10 pt-4">
                  <h4 className="text-white/40 text-xs uppercase tracking-wider mb-2 px-3">
                    Administration
                  </h4>
                  <Link
                    to="/admin"
                    onClick={onClose}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg",
                      "text-accent hover:text-accent",
                      "hover:bg-accent/10 transition-all duration-200",
                      "border-l-3 border-transparent hover:border-accent",
                      "group"
                    )}
                  >
                    <Shield className="w-5 h-5 text-accent" />
                    <span className="font-medium text-sm">⚙️ Dashboard Admin</span>
                  </Link>
                </div>
              )}

              {/* Sign Out Button */}
              <button
                onClick={async () => {
                  onClose();
                  await handleLogout();
                }}
                className={cn(
                  "flex items-center gap-3 w-full px-3 py-2.5 rounded-lg mt-2",
                  "text-red-400 hover:text-red-300",
                  "hover:bg-red-500/10 transition-all duration-200",
                  "border-l-3 border-transparent hover:border-red-500"
                )}
              >
                <LogOut className="w-5 h-5" />
                <span className="font-medium text-sm">Déconnexion</span>
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default UserMenuPanel;
