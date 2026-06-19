import { useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile, useBadges, useQuests } from "@/hooks/useProfile";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  Coins, Trophy, Star, Target, Settings, 
  Calendar, ShoppingBag, Users, Crown, Sparkles,
  CheckCircle, AlertTriangle, Ticket, Hash, Zap
} from "lucide-react";
import { 
  OTAKU_CLASSES, 
  getLeagueFromXp, 
  LEAGUES, 
  SUBSCRIPTION_PACKS,
  type OtakuClassId 
} from "@/lib/constants";

const EspaceMembre = () => {
  const { user, loading: authLoading } = useAuth();
  const { profile, loading: profileLoading } = useProfile();
  const { badges, userBadges } = useBadges();
  const { quests, userQuests } = useQuests();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  if (authLoading || profileLoading) {
    return (
      <div className="min-h-screen bg-header-bg flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-sakura border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white/60 font-body">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    navigate("/auth");
    return null;
  }

  // Si le profil n'existe pas, afficher un message d'erreur avec option de création
  if (!profile) {
    return (
      <div className="min-h-screen bg-header-bg flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-sakura to-turquoise flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="w-10 h-10 text-white" />
          </div>
          <h2 className="font-display text-2xl text-white mb-4">Profil non trouvé</h2>
          <p className="text-white/60 font-body mb-6">
            Votre compte utilisateur existe mais votre profil n'a pas encore été créé. 
            Cela peut arriver si l'inscription n'a pas été finalisée.
          </p>
          <Button 
            onClick={() => navigate("/auth")}
            className="bg-sakura hover:bg-sakura/80 text-white font-display"
          >
            Retour à la connexion
          </Button>
        </div>
      </div>
    );
  }

  // Valeurs par défaut sécurisées pour éviter les crashs si le profil est incomplet
  const profileXp = profile.xp ?? 0;
  const profileLevel = profile.level ?? 1;
  const profileOtkCoins = profile.otk_coins ?? 0;
  const profileOtakuClass = profile.otaku_class ?? "citoyen";
  const profileSubscriptionActive = profile.is_subscription_active ?? false;
  const profileMembershipTier = profile.membership_tier ?? "bronze";
  const profileDisplayName = profile.display_name || profile.username || "Nakama";
  const profileBio = profile.bio || "Guerrier du Cosplay";
  const profileAvatarUrl = profile.avatar_url;

  // Récupère la classe officielle du RI (Art. 3-7)
  const otakuClass = OTAKU_CLASSES[profileOtakuClass as OtakuClassId] || OTAKU_CLASSES.citoyen;
  
  // Système de Ligues (RI Art. 8.6) - basé sur XP mensuel
  // Pour l'instant on simule avec l'XP total, en prod il faudrait un champ monthly_xp
  const monthlyXp = profileXp % 500; // Simulation: reset chaque 500 XP
  const currentLeague = getLeagueFromXp(monthlyXp);
  const leagueProgress = currentLeague.maxXp === Infinity 
    ? 100 
    : ((monthlyXp - currentLeague.minXp) / (currentLeague.maxXp - currentLeague.minXp)) * 100;

  const xpToNextLevel = profileLevel * 1000;
  const xpProgress = (profileXp / xpToNextLevel) * 100;

  const memberSince = new Date().getFullYear();

  const isSubscriptionActive = profileSubscriptionActive;

  // Mock interests - in real app would come from user_preferences
  const interests = ["Cosplay", "Shonen", "Gaming", "Manga", "Anime"];

  // Mock upcoming events
  const upcomingEvents = [
    { id: 1, title: "Atelier Cosplay", date: "15 Jan 2025", location: "Le Hub" },
    { id: 2, title: "Tournoi Tekken 8", date: "22 Jan 2025", location: "Le Paradis" },
  ];

  return (
    <div className="min-h-screen bg-header-bg">
      <Navigation />
      
      <main className="container mx-auto px-4 py-8 pt-24">
        {/* Hero Banner - Profil Otaku */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-[20px] p-6 md:p-8 mb-8 shadow-xl"
        >
          <div className="flex flex-col lg:flex-row items-start lg:items-center gap-6">
            {/* Avatar Section */}
            <div className="relative flex-shrink-0">
              <div className="w-28 h-28 md:w-32 md:h-32 rounded-full bg-gradient-to-br from-sakura to-turquoise p-1">
                <div className="w-full h-full rounded-full bg-gray-100 flex items-center justify-center text-5xl overflow-hidden">
                  {profileAvatarUrl ? (
                    <img src={profileAvatarUrl} alt="Avatar" className="w-full h-full rounded-full object-cover" />
                  ) : (
                    "🎮"
                  )}
                </div>
              </div>
              {/* Badge de classe officielle RI */}
              <div className={`absolute -bottom-2 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-gradient-to-r ${otakuClass.color.replace('/20', '').replace('/10', '')} text-white text-xs font-display tracking-wider shadow-lg flex items-center gap-1`}>
                <span>{otakuClass.emoji}</span>
                <span>{otakuClass.label}</span>
              </div>
            </div>

            {/* Info & XP Section */}
            <div className="flex-1 min-w-0">
              <h1 className="font-display text-2xl md:text-3xl text-header-bg tracking-wide">
                {profileDisplayName}
              </h1>
              <p className="text-gray-500 font-body text-sm mb-4">
                {profileBio}
              </p>
              
              {/* Barre de Ligue (RI Art. 8.6) */}
              <div className="max-w-md">
                <div className="flex justify-between items-center mb-2">
                  <span className={`text-sm font-display ${currentLeague.textColor} flex items-center gap-1`}>
                    <span>{currentLeague.emoji}</span>
                    LIGUE {currentLeague.label.toUpperCase()}
                  </span>
                  <span className="text-sm font-body text-gray-600">
                    {monthlyXp} / {currentLeague.maxXp === Infinity ? "∞" : currentLeague.maxXp} XP ce mois
                  </span>
                </div>
                <div className="relative h-3 bg-gray-200 rounded-full overflow-hidden mb-1">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${leagueProgress}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className={`h-full ${currentLeague.bgColor} rounded-full`}
                  />
                </div>
                <p className="text-xs text-gray-400">
                  Rente mensuelle : <span className="text-otk font-medium">{currentLeague.monthlyRent} OTK</span>
                  {currentLeague.discount > 0 && (
                    <span className="ml-2">• -{currentLeague.discount}% boutique</span>
                  )}
                </p>
              </div>
              
              {/* XP Progress Bar (Niveau global) */}
              <div className="max-w-md mt-3">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-display text-sakura">NIVEAU {profileLevel}</span>
                  <span className="text-xs font-body text-gray-500">{profileXp} / {xpToNextLevel} XP total</span>
                </div>
                <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${xpProgress}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className="h-full bg-gradient-to-r from-turquoise to-sakura rounded-full"
                  />
                </div>
              </div>
            </div>

            {/* Stats Section */}
            <div className="flex flex-wrap lg:flex-nowrap gap-4 lg:gap-6">
              <div className="text-center px-4 py-3 bg-gray-50 rounded-xl min-w-[100px]">
                <Trophy className="w-6 h-6 text-sakura mx-auto mb-1" />
                <div className="font-display text-2xl text-header-bg">{userBadges.length}</div>
                <div className="text-xs font-body text-gray-500">Badges</div>
              </div>
              <div className="text-center px-4 py-3 bg-gradient-to-br from-otk/20 to-otk/10 rounded-xl min-w-[100px] border border-otk/30">
                <Coins className="w-6 h-6 text-otk mx-auto mb-1" />
                <div className="font-display text-2xl text-otk">{profileOtkCoins}</div>
                <div className="text-xs font-body text-gray-500">OTK Coins</div>
              </div>
              <div className="text-center px-4 py-3 bg-gray-50 rounded-xl min-w-[100px]">
                <Calendar className="w-6 h-6 text-turquoise mx-auto mb-1" />
                <div className="font-display text-2xl text-header-bg">{memberSince}</div>
                <div className="text-xs font-body text-gray-500">Membre depuis</div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Dashboard Grid - 2/3 + 1/3 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Colonne Gauche - 2/3 */}
          <div className="lg:col-span-2 space-y-6">
            {/* Quêtes en Cours */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-[20px] p-6 shadow-xl"
            >
              <h2 className="font-display text-xl text-sakura tracking-wide flex items-center gap-2 mb-4">
                <Target className="w-5 h-5" />
                QUÊTES EN COURS
              </h2>
              
              <div className="space-y-4">
                {quests.length > 0 ? quests.slice(0, 4).map((quest) => {
                  const userQuest = userQuests.find(uq => uq.quest_id === quest.id);
                  const progress = userQuest?.progress || 0;
                  const isCompleted = !!userQuest?.completed_at;
                  const progressPercent = (progress / (quest.target_count || 1)) * 100;
                  
                  return (
                    <div 
                      key={quest.id}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        isCompleted 
                          ? 'bg-turquoise/10 border-turquoise/30' 
                          : 'bg-gray-50 border-gray-100 hover:border-sakura/30'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <h3 className="font-display text-header-bg flex items-center gap-2">
                            {isCompleted && <CheckCircle className="w-4 h-4 text-turquoise" />}
                            {quest.title}
                          </h3>
                          <p className="text-sm font-body text-gray-500 mt-1">{quest.description}</p>
                          {!isCompleted && (
                            <div className="mt-3">
                              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                <motion.div 
                                  initial={{ width: 0 }}
                                  animate={{ width: `${progressPercent}%` }}
                                  transition={{ duration: 0.8, ease: "easeOut" }}
                                  className="h-full bg-turquoise rounded-full"
                                />
                              </div>
                              <p className="text-xs font-body text-gray-400 mt-1">{progress} / {quest.target_count}</p>
                            </div>
                          )}
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className="font-display text-otk text-lg">+{quest.otk_reward} OTK</div>
                          <div className="text-xs font-body text-gray-400">+{quest.xp_reward} XP</div>
                        </div>
                      </div>
                    </div>
                  );
                }) : (
                  <div className="text-center py-8 text-gray-400 font-body">
                    <Target className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    Aucune quête disponible pour le moment
                  </div>
                )}
              </div>
            </motion.div>

            {/* Mes Événements */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-[20px] p-6 shadow-xl"
            >
              <h2 className="font-display text-xl text-sakura tracking-wide flex items-center gap-2 mb-4">
                <Ticket className="w-5 h-5" />
                MES ÉVÉNEMENTS
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {upcomingEvents.map((event) => (
                  <div 
                    key={event.id}
                    className="relative p-4 bg-gradient-to-br from-header-bg to-header-bg/90 rounded-xl text-white overflow-hidden group hover:scale-[1.02] transition-transform"
                  >
                    {/* Ticket design elements */}
                    <div className="absolute top-0 right-0 w-8 h-8 bg-white/10 rounded-bl-xl"></div>
                    <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-4 h-4 bg-header-bg rounded-full border-2 border-white/20"></div>
                    <div className="absolute -right-2 top-1/2 -translate-y-1/2 w-4 h-4 bg-header-bg rounded-full border-2 border-white/20"></div>
                    
                    <div className="pl-3">
                      <p className="text-xs font-body text-turquoise mb-1">{event.date}</p>
                      <h3 className="font-display text-lg tracking-wide">{event.title}</h3>
                      <p className="text-xs font-body text-white/60 mt-1">📍 {event.location}</p>
                    </div>
                  </div>
                ))}
              </div>
              
              <Button 
                variant="outline" 
                className="w-full mt-4 border-sakura text-sakura hover:bg-sakura hover:text-white font-display tracking-wide"
              >
                VOIR MON AGENDA
              </Button>
            </motion.div>

            {/* Centres d'Intérêt */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-[20px] p-6 shadow-xl"
            >
              <h2 className="font-display text-xl text-sakura tracking-wide flex items-center gap-2 mb-4">
                <Hash className="w-5 h-5" />
                MES CENTRES D'INTÉRÊT
              </h2>
              
              <div className="flex flex-wrap gap-2">
                {interests.map((interest, index) => (
                  <span 
                    key={index}
                    className="px-4 py-2 rounded-full font-body text-sm bg-gradient-to-r from-sakura/10 to-turquoise/10 text-header-bg border border-sakura/20 hover:border-sakura/50 transition-colors cursor-pointer"
                  >
                    #{interest}
                  </span>
                ))}
                <button className="px-4 py-2 rounded-full font-body text-sm border-2 border-dashed border-gray-300 text-gray-400 hover:border-sakura hover:text-sakura transition-colors">
                  + Ajouter
                </button>
              </div>
            </motion.div>
          </div>

          {/* Colonne Droite - 1/3 */}
          <div className="space-y-6">
            {/* Widget Cotisation */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className={`rounded-[20px] p-6 shadow-xl ${
                isSubscriptionActive 
                  ? 'bg-white' 
                  : 'bg-gradient-to-br from-otk/10 to-sakura/10 border-2 border-otk/50'
              }`}
            >
              <h2 className="font-display text-xl text-sakura tracking-wide mb-4">
                MA COTISATION
              </h2>
              
              {isSubscriptionActive ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-turquoise">
                    <CheckCircle className="w-6 h-6" />
                    <span className="font-display tracking-wide">ADHÉSION ACTIVE</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600 font-body">
                    <Crown className="w-4 h-4 text-otk" />
                    <span>Pack {profileMembershipTier.charAt(0).toUpperCase() + profileMembershipTier.slice(1)}</span>
                  </div>
                  <p className="text-sm font-body text-gray-400">
                    Expire le 30/09/2026
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 text-otk animate-pulse">
                    <AlertTriangle className="w-6 h-6" />
                    <span className="font-display tracking-wide">RENOUVELLEMENT NÉCESSAIRE</span>
                  </div>
                  <p className="text-sm font-body text-gray-500 mb-3">
                    Choisissez votre pack pour rejoindre l'aventure !
                  </p>
                  
                  {/* 3 Packs Officiels (RI Art. 3-6.3) */}
                  <div className="space-y-2">
                    {Object.values(SUBSCRIPTION_PACKS).map((pack) => (
                      <div 
                        key={pack.id}
                        className={`p-3 rounded-xl border-2 cursor-pointer transition-all hover:scale-[1.02] ${
                          pack.id === 'gold' 
                            ? 'border-yellow-500 bg-gradient-to-r from-yellow-500/10 to-amber-500/10' 
                            : pack.id === 'silver'
                            ? 'border-gray-400 bg-gray-50'
                            : 'border-amber-600 bg-amber-50'
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-display text-sm text-header-bg">{pack.label}</h4>
                            <p className="text-xs text-gray-500">{pack.description}</p>
                          </div>
                          <div className="text-right">
                            <span className="font-display text-lg text-header-bg">{pack.price}€</span>
                            <p className="text-xs text-otk">+{pack.otkBonus.toLocaleString()} OTK</p>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {pack.goodies.map((goodie, i) => (
                            <span key={i} className="text-[10px] px-2 py-0.5 bg-white/50 rounded-full text-gray-600">
                              🎁 {goodie}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <p className="text-[10px] text-gray-400 text-center">
                    Cotisation de base (20€) incluse dans tous les packs
                  </p>
                </div>
              )}
            </motion.div>

            {/* Actions Rapides */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="bg-white rounded-[20px] p-6 shadow-xl"
            >
              <h2 className="font-display text-xl text-sakura tracking-wide mb-4">
                ACTIONS RAPIDES
              </h2>
              
              <div className="grid grid-cols-2 gap-3">
                <Link to="/communaute/bazar" className="block">
                  <div className="aspect-square rounded-xl bg-gradient-to-br from-otk/20 to-otk/5 border border-otk/30 flex flex-col items-center justify-center gap-2 hover:scale-105 transition-transform cursor-pointer">
                    <ShoppingBag className="w-8 h-8 text-otk" />
                    <span className="text-xs font-display text-header-bg">BOUTIQUE OTK</span>
                  </div>
                </Link>
                <Link to="/communaute/annuaire" className="block">
                  <div className="aspect-square rounded-xl bg-gradient-to-br from-turquoise/20 to-turquoise/5 border border-turquoise/30 flex flex-col items-center justify-center gap-2 hover:scale-105 transition-transform cursor-pointer">
                    <Users className="w-8 h-8 text-turquoise" />
                    <span className="text-xs font-display text-header-bg">ANNUAIRE</span>
                  </div>
                </Link>
                <div className="aspect-square rounded-xl bg-gradient-to-br from-sakura/20 to-sakura/5 border border-sakura/30 flex flex-col items-center justify-center gap-2 hover:scale-105 transition-transform cursor-pointer">
                  <Trophy className="w-8 h-8 text-sakura" />
                  <span className="text-xs font-display text-header-bg">MES BADGES</span>
                </div>
                <Link to="/espace-membre/parametres" className="block">
                  <div className="aspect-square rounded-xl bg-gray-100 border border-gray-200 flex flex-col items-center justify-center gap-2 hover:scale-105 transition-transform cursor-pointer">
                    <Settings className="w-8 h-8 text-gray-500" />
                    <span className="text-xs font-display text-header-bg">PARAMÈTRES</span>
                  </div>
                </Link>
              </div>
            </motion.div>

            {/* Badges récents */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="bg-white rounded-[20px] p-6 shadow-xl"
            >
              <h2 className="font-display text-xl text-sakura tracking-wide flex items-center gap-2 mb-4">
                <Sparkles className="w-5 h-5" />
                MES BADGES
              </h2>
              
              <div className="flex flex-wrap gap-2">
                {userBadges.length > 0 ? (
                  userBadges.slice(0, 6).map((ub) => (
                    <div 
                      key={ub.id}
                      className="w-14 h-14 rounded-xl bg-gradient-to-br from-sakura/10 to-turquoise/10 border border-sakura/20 flex items-center justify-center text-2xl hover:scale-110 transition-transform cursor-pointer"
                      title={ub.badges.name}
                    >
                      {ub.badges.icon}
                    </div>
                  ))
                ) : (
                  <p className="text-sm font-body text-gray-400">
                    Complète des quêtes pour débloquer des badges !
                  </p>
                )}
              </div>
              
              {badges.length > userBadges.length && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <p className="text-xs font-body text-gray-400 flex items-center gap-1">
                    <Star className="w-3 h-3" />
                    {badges.length - userBadges.length} badges à débloquer
                  </p>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default EspaceMembre;
