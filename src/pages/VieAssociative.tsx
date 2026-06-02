import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  FileText, 
  ShieldCheck, 
  Users, 
  HelpCircle, 
  GraduationCap, 
  Newspaper,
  CalendarDays,
  ShoppingBag,
  Gift,
  Heart,
  Target,
  Sparkles,
  ArrowRight,
  UserPlus,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

// President photo placeholder
const PRESIDENT_AVATAR = "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face";

// Mission, Vision, Values data
const adnCards = [
  {
    icon: Target,
    title: "Notre Mission",
    description: "Découvrir et partager la richesse de la culture japonaise à travers des événements, rencontres et activités immersives.",
    gradient: "from-sakura/20 to-sakura/5"
  },
  {
    icon: Sparkles,
    title: "Notre Vision",
    description: "Créer un pont entre le Japon et le reste du monde, en rassemblant une communauté passionnée et bienveillante.",
    gradient: "from-turquoise/20 to-turquoise/5"
  },
  {
    icon: Heart,
    title: "Nos Valeurs",
    description: "Passion, Curiosité, Inclusion. Nous célébrons la diversité et encourageons chacun à exprimer sa créativité.",
    gradient: "from-accent/20 to-accent/5"
  }
];

// Resources documents data
const resourcesCards = [
  {
    icon: FileText,
    title: "Statuts & Règlement",
    description: "Les documents officiels de l'association",
    href: "#statuts",
    color: "text-turquoise"
  },
  {
    icon: ShieldCheck,
    title: "Charte des Membres",
    description: "Respect & Bienveillance",
    href: "#charte",
    isModal: true,
    color: "text-sakura"
  },
  {
    icon: Users,
    title: "L'Équipe / Trombinoscope",
    description: "Découvre les membres du staff",
    href: "/le-hub",
    color: "text-accent"
  },
  {
    icon: HelpCircle,
    title: "Foire aux Questions",
    description: "Les réponses à tes questions",
    href: "#faq",
    color: "text-purple-400"
  },
  {
    icon: GraduationCap,
    title: "Tutoriels & Guides",
    description: "Apprends à utiliser la plateforme",
    href: "#guides",
    color: "text-green-400"
  },
  {
    icon: Newspaper,
    title: "Dossier de Presse",
    description: "Médias et communications",
    href: "#presse",
    color: "text-orange-400"
  }
];

// Quick actions
const quickActions = [
  { label: "Bulletin d'adhesion", href: "/asso/manga-paradise/adhesion", icon: UserPlus },
  { label: "Back-Office Associatif", href: "/association/dashboard", icon: ShieldCheck },
  { label: "Agenda Evenements", href: "/agenda", icon: CalendarDays },
  { label: "Annuaire des Membres", href: "/communaute/annuaire", icon: Users },
  { label: "Mes Avantages", href: "/communaute/bazar", icon: Gift },
];

// Charter rules
const charterRules = [
  {
    emoji: "🤝",
    title: "On se respecte toujours",
    description: "Pas d'insultes, pas de moqueries. On accepte les différences de chacun, qu'il s'agisse des goûts, des origines ou des façons de vivre sa passion."
  },
  {
    emoji: "🚫",
    title: "La violence, c'est zéro",
    description: "Aucune forme de violence physique ou verbale n'est tolérée. On règle les désaccords par le dialogue, dans le calme."
  },
  {
    emoji: "🌈",
    title: "Inclusion & Bienveillance",
    description: "Chaque membre est le bienvenu. On s'entraide, on partage nos connaissances et on fait en sorte que tout le monde se sente à sa place."
  },
  {
    emoji: "📸",
    title: "Respect de l'image",
    description: "On demande toujours l'autorisation avant de prendre ou publier une photo de quelqu'un. Le consentement, c'est la base."
  },
  {
    emoji: "🎭",
    title: "Esprit communautaire",
    description: "On participe à la vie de l'association avec enthousiasme. Chaque contribution, même petite, fait grandir notre communauté."
  }
];

const VieAssociative = () => {
  const { user, loading } = useAuth();
  const [charterModalOpen, setCharterModalOpen] = useState(false);

  // Redirect if not authenticated
  if (!loading && !user) {
    return <Navigate to="/auth" replace />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Chargement...</div>
      </div>
    );
  }

  const handleResourceClick = (resource: typeof resourcesCards[0]) => {
    if (resource.isModal) {
      setCharterModalOpen(true);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container mx-auto px-4 py-8 pt-24">
        {/* Page Title */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl md:text-4xl font-display text-foreground mb-2">
            🏛️ Ma Vie Associative
          </h1>
          <p className="text-muted-foreground">
            Ton livret d'accueil et ressources internes
          </p>
        </motion.div>

        {/* CTA — Bulletin d'adhesion */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="mb-8"
        >
          <Card className="bg-gradient-to-r from-sakura/15 via-accent/10 to-turquoise/15 border-sakura/30 overflow-hidden">
            <CardContent className="p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-sakura/20 flex items-center justify-center flex-shrink-0">
                  <UserPlus className="w-6 h-6 text-sakura" />
                </div>
                <div>
                  <h3 className="font-display text-foreground text-lg">
                    Bulletin d'adhesion 2025-2026
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Rejoins ou renouvelle ton adhesion a Manga Paradise
                  </p>
                </div>
              </div>
              <Link to="/asso/manga-paradise/adhesion">
                <Button className="gap-2 bg-sakura hover:bg-sakura/90 whitespace-nowrap">
                  <UserPlus className="w-4 h-4" />
                  Remplir le bulletin
                </Button>
              </Link>
            </CardContent>
          </Card>
        </motion.section>

        {/* A. Hero Header - Le Mot du Président */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-12"
        >
          <Card className="overflow-hidden bg-gradient-to-br from-sakura/10 via-background to-accent/5 border-sakura/30">
            <CardContent className="p-0">
              <div className="flex flex-col md:flex-row items-center gap-6 p-6 md:p-8">
                {/* President Photo */}
                <div className="flex-shrink-0">
                  <div className="relative">
                    <div className="w-32 h-32 md:w-40 md:h-40 rounded-full overflow-hidden border-4 border-sakura shadow-lg shadow-sakura/20">
                      <img 
                        src={PRESIDENT_AVATAR} 
                        alt="Lucas Protin - Président" 
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-sakura text-white text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap">
                      Lucas Protin
                    </div>
                  </div>
                  <p className="text-center text-sm text-muted-foreground mt-4">Président</p>
                </div>

                {/* Welcome Message */}
                <div className="flex-1 text-center md:text-left">
                  <h2 className="text-xl md:text-2xl font-display text-foreground mb-4">
                    Le Mot du Président
                  </h2>
                  <blockquote className="text-muted-foreground leading-relaxed space-y-3">
                    <p>
                      <strong className="text-foreground">Cher passionné,</strong>
                    </p>
                    <p>
                      C'est avec une immense joie que je t'accueille au sein de Manga Paradise ! 
                      Notre association est née d'une passion commune pour la culture japonaise 
                      et d'un désir profond de créer un espace où chaque otaku, cosplayer et 
                      passionné peut s'épanouir.
                    </p>
                    <p>
                      Ici, tu trouveras bien plus qu'une simple communauté : une famille qui 
                      partage tes passions, tes rêves et ton amour pour l'univers manga. 
                      Que tu sois débutant ou vétéran, tu as ta place parmi nous.
                    </p>
                    <p className="text-sakura font-medium italic">
                      "Ensemble, faisons de notre passion une aventure inoubliable !"
                    </p>
                  </blockquote>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.section>

        {/* B. L'ADN Manga Paradise */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-12"
        >
          <h2 className="text-2xl font-display text-foreground mb-6 text-center">
            ✨ L'ADN Manga Paradise
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {adnCards.map((card, index) => (
              <motion.div
                key={card.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
              >
                <Card className={`h-full bg-gradient-to-br ${card.gradient} border-white/10 hover:border-sakura/50 transition-all duration-300`}>
                  <CardHeader className="text-center">
                    <div className="mx-auto w-14 h-14 rounded-full bg-white/10 flex items-center justify-center mb-3">
                      <card.icon className="w-7 h-7 text-sakura" />
                    </div>
                    <CardTitle className="text-lg">{card.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-center text-muted-foreground">
                      {card.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* C. Ressources & Documents */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-12"
        >
          <h2 className="text-2xl font-display text-foreground mb-6 text-center">
            📚 Ressources & Documents
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {resourcesCards.map((resource, index) => (
              <motion.div
                key={resource.title}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 + index * 0.05 }}
              >
                {resource.isModal ? (
                  <button
                    onClick={() => handleResourceClick(resource)}
                    className="w-full text-left"
                  >
                    <Card className="h-full cursor-pointer hover:bg-white/5 hover:border-sakura/50 hover:scale-[1.02] transition-all duration-300 group">
                      <CardContent className="p-5 flex items-start gap-4">
                        <div className={`p-3 rounded-xl bg-white/5 ${resource.color} group-hover:bg-white/10 transition-colors`}>
                          <resource.icon className="w-6 h-6" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-foreground mb-1 group-hover:text-sakura transition-colors">
                            {resource.title}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {resource.description}
                          </p>
                        </div>
                        <ArrowRight className="w-5 h-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </CardContent>
                    </Card>
                  </button>
                ) : (
                  <Link to={resource.href}>
                    <Card className="h-full cursor-pointer hover:bg-white/5 hover:border-sakura/50 hover:scale-[1.02] transition-all duration-300 group">
                      <CardContent className="p-5 flex items-start gap-4">
                        <div className={`p-3 rounded-xl bg-white/5 ${resource.color} group-hover:bg-white/10 transition-colors`}>
                          <resource.icon className="w-6 h-6" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-foreground mb-1 group-hover:text-sakura transition-colors">
                            {resource.title}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {resource.description}
                          </p>
                        </div>
                        <ArrowRight className="w-5 h-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </CardContent>
                    </Card>
                  </Link>
                )}
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* D. Actions Rapides */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mb-12"
        >
          <h2 className="text-2xl font-display text-foreground mb-6 text-center">
            🚀 Actions Rapides
          </h2>
          <div className="flex flex-wrap justify-center gap-4">
            {quickActions.map((action) => (
              <Link key={action.label} to={action.href}>
                <Button
                  variant="outline"
                  size="lg"
                  className="gap-2 hover:bg-sakura/10 hover:border-sakura hover:text-sakura transition-all"
                >
                  <action.icon className="w-5 h-5" />
                  {action.label}
                </Button>
              </Link>
            ))}
          </div>
        </motion.section>
      </main>

      <Footer />

      {/* Charter Modal */}
      <Dialog open={charterModalOpen} onOpenChange={setCharterModalOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-2xl">
              <ShieldCheck className="w-7 h-7 text-sakura" />
              Charte des Membres
            </DialogTitle>
            <DialogDescription>
              Les règles fondamentales de notre communauté
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            {charterRules.map((rule, index) => (
              <motion.div
                key={rule.title}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="bg-white/5 border-white/10 hover:border-sakura/30 transition-colors">
                  <CardContent className="p-4 flex items-start gap-4">
                    <span className="text-3xl">{rule.emoji}</span>
                    <div>
                      <h4 className="font-semibold text-foreground mb-1">
                        {rule.title}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {rule.description}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          <div className="mt-6 p-4 bg-sakura/10 rounded-xl border border-sakura/30 text-center">
            <p className="text-sm text-muted-foreground">
              En rejoignant Manga Paradise, tu t'engages à respecter ces valeurs.
            </p>
            <p className="text-sakura font-medium mt-2">
              Ensemble, créons une communauté bienveillante ! 💜
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default VieAssociative;
