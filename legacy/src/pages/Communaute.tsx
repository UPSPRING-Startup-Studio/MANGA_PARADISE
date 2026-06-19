import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { motion } from "framer-motion";
import { Users, MessageCircle, Trophy, Sparkles, Shield, Gift } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const Communaute = () => {
  const memberBenefits = [
    {
      icon: Trophy,
      title: "Système OTK Coins",
      description: "Gagnez des points en participant aux événements et échangez-les contre des récompenses exclusives.",
    },
    {
      icon: Gift,
      title: "Badges & Récompenses",
      description: "Débloquez des badges en complétant des quêtes et accédez à du contenu exclusif.",
    },
    {
      icon: Shield,
      title: "Accès Prioritaire",
      description: "Réservations prioritaires pour les événements et ateliers à capacité limitée.",
    },
    {
      icon: Sparkles,
      title: "Avantages Partenaires",
      description: "Réductions chez nos partenaires boutiques et commerces locaux.",
    },
  ];

  const membershipTiers = [
    {
      name: "Membre Standard",
      price: "20€/an",
      color: "border-primary/30",
      features: [
        "Accès aux événements membres",
        "Système OTK Coins actif",
        "-10% sur la boutique",
        "Accès au Discord communautaire",
        "Newsletter exclusive",
      ],
    },
    {
      name: "Membre Premium",
      price: "50€/an",
      color: "border-accent",
      popular: true,
      features: [
        "Tous les avantages Standard",
        "Ateliers exclusifs Premium",
        "-20% sur la boutique",
        "Badge membre premium",
        "Priorité réservations",
        "1 invitation gratuite/mois",
        "Accès early-bird événements",
      ],
    },
    {
      name: "Bénévole",
      price: "Gratuit",
      color: "border-secondary/30",
      features: [
        "Contribuer au projet",
        "Accès événements gratuit",
        "Badge bénévole unique",
        "Formation & expérience",
        "Tous avantages membres",
      ],
    },
  ];

  return (
    <div className="min-h-screen">
      <Navigation />
      <main>
        {/* Hero Section */}
        <section className="py-20 bg-gradient-to-br from-primary/5 via-background to-secondary/5">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-4xl mx-auto text-center"
            >
              <h1 className="font-display text-5xl md:text-7xl mb-6">
                Communauté
              </h1>
              <p className="text-xl text-muted-foreground mb-8">
                Rejoignez une communauté passionnée et profitez d'avantages exclusifs
              </p>
              <div className="flex items-center justify-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  <span className="font-semibold">500+ membres actifs</span>
                </div>
                <div className="flex items-center gap-2">
                  <MessageCircle className="w-5 h-5 text-secondary" />
                  <span className="font-semibold">Discord communautaire</span>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Member Benefits */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="font-display text-4xl mb-4">Avantages Membres</h2>
              <p className="text-muted-foreground">
                Un écosystème gamifié pour récompenser votre engagement
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
              {memberBenefits.map((benefit, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="p-6 h-full hover:shadow-lg transition-all group">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                        <benefit.icon className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-display text-xl mb-2">{benefit.title}</h3>
                        <p className="text-muted-foreground text-sm">{benefit.description}</p>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Membership Tiers */}
        <section className="py-20 bg-muted/20">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="font-display text-4xl mb-4">Formules d'Adhésion</h2>
              <p className="text-muted-foreground">
                Choisissez la formule qui vous correspond
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
              {membershipTiers.map((tier, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className={`p-6 h-full border-2 ${tier.color} relative ${tier.popular ? 'shadow-xl' : ''}`}>
                    {tier.popular && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <Badge className="bg-accent text-accent-foreground px-4 py-1">
                          Le plus populaire
                        </Badge>
                      </div>
                    )}
                    
                    <div className="text-center mb-6">
                      <h3 className="font-display text-2xl mb-2">{tier.name}</h3>
                      <div className="font-display text-4xl text-primary mb-1">{tier.price}</div>
                    </div>

                    <ul className="space-y-3 mb-6">
                      {tier.features.map((feature, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0"></div>
                          <span className="text-foreground">{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <Button 
                      variant={tier.popular ? "hero" : "default"} 
                      className="w-full"
                      size="lg"
                    >
                      {tier.name === "Bénévole" ? "Postuler" : "Adhérer"}
                    </Button>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Community Features */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <h2 className="font-display text-4xl mb-6">Discord Communautaire</h2>
                <p className="text-lg text-muted-foreground mb-8">
                  Rejoignez notre serveur Discord pour échanger avec la communauté, 
                  participer aux événements en ligne et rester informé de toutes les actualités.
                </p>
                <Button variant="hero" size="xl">
                  <MessageCircle className="mr-2" />
                  Rejoindre le Discord
                </Button>
              </motion.div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Communaute;