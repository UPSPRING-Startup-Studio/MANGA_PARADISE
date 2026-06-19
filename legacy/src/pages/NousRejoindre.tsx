import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Binoculars, Sword, Handshake, Check, ArrowRight, Loader2, Sparkles, Star, Users } from "lucide-react";
import { motion } from "framer-motion";

const NousRejoindre = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [subscribing, setSubscribing] = useState(false);
  const [subscribed, setSubscribed] = useState(false);

  const handleNewsletterSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error("Veuillez entrer un email valide");
      return;
    }

    setSubscribing(true);
    try {
      const { error } = await supabase
        .from("newsletter_subscribers")
        .insert({ email: email.trim().toLowerCase() });

      if (error) {
        if (error.code === "23505") {
          toast.info("Cet email est déjà inscrit à la newsletter !");
        } else {
          throw error;
        }
      } else {
        setSubscribed(true);
        toast.success("Bienvenue dans l'aventure ! 🎉");
      }
    } catch (error) {
      console.error(error);
      toast.error("Erreur lors de l'inscription");
    } finally {
      setSubscribing(false);
    }
  };

  const pathways = [
    {
      id: "eclaireur",
      title: "L'Éclaireur",
      subtitle: "Visiteur",
      icon: Binoculars,
      color: "from-blue-500/20 to-cyan-500/20",
      borderColor: "border-blue-500/30 hover:border-blue-400",
      iconBg: "bg-blue-500/20",
      iconColor: "text-blue-400",
      description: "Soyez informés des événements en avant-première.",
      features: [
        "Newsletter mensuelle",
        "Annonces événements",
        "Contenus exclusifs",
      ],
      action: "newsletter",
    },
    {
      id: "heros",
      title: "Le Héros",
      subtitle: "Membre",
      icon: Sword,
      color: "from-sakura/20 to-accent/20",
      borderColor: "border-sakura/50 hover:border-sakura ring-2 ring-sakura/20",
      iconBg: "bg-sakura/20",
      iconColor: "text-sakura",
      description: "Rejoignez l'aventure, gagnez de l'XP et accédez aux avantages.",
      features: [
        "Accès aux événements",
        "Système XP & OTK Coins",
        "Communauté exclusive",
        "Réductions partenaires",
      ],
      recommended: true,
      action: "member",
    },
    {
      id: "allie",
      title: "L'Allié",
      subtitle: "Partenaire",
      icon: Handshake,
      color: "from-purple-500/20 to-indigo-500/20",
      borderColor: "border-purple-500/30 hover:border-purple-400",
      iconBg: "bg-purple-500/20",
      iconColor: "text-purple-400",
      description: "Entreprises & Institutions : Collaborez avec Manga Paradise.",
      features: [
        "Visibilité événements",
        "Partenariats sur-mesure",
        "Réseau professionnel",
      ],
      action: "partner",
    },
  ];

  const handleAction = (action: string) => {
    if (action === "member") {
      navigate("/auth?mode=signup");
    } else if (action === "partner") {
      navigate("/auth?mode=partner");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="pt-24 pb-16">
        {/* Hero Section */}
        <section className="container mx-auto px-4 mb-16 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="font-display text-4xl md:text-6xl mb-4">
              Choisissez Votre <span className="text-sakura">Voie</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Trois chemins s'offrent à vous. Chacun mène à une aventure unique au cœur de Manga Paradise.
            </p>
          </motion.div>
        </section>

        {/* Pathway Cards */}
        <section className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {pathways.map((pathway, index) => (
              <motion.div
                key={pathway.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.15 }}
                className="relative"
              >
                {pathway.recommended && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                    <span className="bg-sakura text-white text-xs font-bold px-4 py-1 rounded-full flex items-center gap-1">
                      <Star className="w-3 h-3" /> RECOMMANDÉ
                    </span>
                  </div>
                )}
                
                <Card
                  className={`relative h-full p-6 bg-gradient-to-br ${pathway.color} backdrop-blur-sm border-2 ${pathway.borderColor} transition-all duration-300 hover:scale-[1.02] hover:shadow-xl`}
                >
                  {/* Icon */}
                  <div className={`w-16 h-16 rounded-2xl ${pathway.iconBg} flex items-center justify-center mb-6`}>
                    <pathway.icon className={`w-8 h-8 ${pathway.iconColor}`} />
                  </div>

                  {/* Title */}
                  <div className="mb-4">
                    <p className="text-sm text-muted-foreground uppercase tracking-wider">
                      {pathway.subtitle}
                    </p>
                    <h2 className="font-display text-2xl">{pathway.title}</h2>
                  </div>

                  {/* Description */}
                  <p className="text-muted-foreground mb-6">
                    {pathway.description}
                  </p>

                  {/* Features */}
                  <ul className="space-y-3 mb-8">
                    {pathway.features.map((feature, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm">
                        <Check className={`w-4 h-4 ${pathway.iconColor}`} />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {/* Action */}
                  <div className="mt-auto">
                    {pathway.action === "newsletter" ? (
                      subscribed ? (
                        <div className="flex items-center gap-2 justify-center p-3 bg-green-500/20 rounded-lg text-green-400">
                          <Check className="w-5 h-5" />
                          <span>Inscrit !</span>
                        </div>
                      ) : (
                        <form onSubmit={handleNewsletterSubscribe} className="space-y-3">
                          <Input
                            type="email"
                            placeholder="votre@email.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="bg-background/50"
                          />
                          <Button
                            type="submit"
                            className="w-full"
                            variant="outline"
                            disabled={subscribing}
                          >
                            {subscribing ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <>
                                M'abonner <ArrowRight className="w-4 h-4 ml-2" />
                              </>
                            )}
                          </Button>
                        </form>
                      )
                    ) : (
                      <Button
                        onClick={() => handleAction(pathway.action)}
                        className={`w-full ${
                          pathway.recommended
                            ? "bg-sakura hover:bg-sakura/90"
                            : ""
                        }`}
                        variant={pathway.recommended ? "default" : "outline"}
                      >
                        {pathway.action === "member" ? "Devenir Membre" : "Espace Pro"}
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    )}
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Stats Section */}
        <section className="container mx-auto px-4 mt-20">
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-3 gap-8 text-center">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6 }}
              >
                <Users className="w-8 h-8 mx-auto mb-2 text-sakura" />
                <p className="font-display text-3xl">500+</p>
                <p className="text-sm text-muted-foreground">Membres actifs</p>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.7 }}
              >
                <Sparkles className="w-8 h-8 mx-auto mb-2 text-accent" />
                <p className="font-display text-3xl">50+</p>
                <p className="text-sm text-muted-foreground">Événements / an</p>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.8 }}
              >
                <Handshake className="w-8 h-8 mx-auto mb-2 text-purple-400" />
                <p className="font-display text-3xl">20+</p>
                <p className="text-sm text-muted-foreground">Partenaires</p>
              </motion.div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default NousRejoindre;
