import { motion } from "framer-motion";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Mail, MapPin, Phone, Clock, Send, MessageSquare, Users, Calendar } from "lucide-react";

const contactMethods = [
  {
    icon: Mail,
    title: "Email",
    value: "contact@manga-paradise.fr",
    description: "Réponse sous 48h"
  },
  {
    icon: MapPin,
    title: "Adresse",
    value: "Paris, France",
    description: "Événements en région parisienne"
  },
  {
    icon: Phone,
    title: "Discord",
    value: "discord.gg/mangaparadise",
    description: "Rejoignez notre serveur"
  },
  {
    icon: Clock,
    title: "Horaires",
    value: "Lun-Ven : 10h-18h",
    description: "Hors jours fériés"
  },
];

const quickActions = [
  {
    icon: MessageSquare,
    title: "Question générale",
    description: "Informations sur l'association"
  },
  {
    icon: Users,
    title: "Devenir membre",
    description: "Rejoindre la communauté"
  },
  {
    icon: Calendar,
    title: "Organiser un événement",
    description: "Partenariats & collaborations"
  },
];

const Contact = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="pt-20 lg:pt-24">
        {/* Hero Section */}
        <section className="relative py-16 lg:py-24 bg-gradient-neon overflow-hidden">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-20 left-10 w-64 h-64 bg-sakura/30 rounded-full blur-3xl" />
            <div className="absolute bottom-10 right-20 w-80 h-80 bg-turquoise/20 rounded-full blur-3xl" />
          </div>
          <div className="container mx-auto px-4 relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center max-w-3xl mx-auto"
            >
              <h1 className="font-display text-5xl lg:text-7xl text-foreground mb-4">
                CONTACTEZ-<span className="text-sakura">NOUS</span>
              </h1>
              <p className="text-lg text-muted-foreground">
                Une question, une idée, un projet ? L'équipe Manga Paradise est à votre écoute.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Contact Methods */}
        <section className="py-12 border-b border-border/50">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {contactMethods.map((method, index) => (
                <motion.div
                  key={method.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="text-center p-4"
                >
                  <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-sakura/10 flex items-center justify-center">
                    <method.icon className="h-6 w-6 text-sakura" />
                  </div>
                  <h3 className="font-display text-lg text-foreground">{method.title}</h3>
                  <p className="text-sm font-medium text-foreground/80">{method.value}</p>
                  <p className="text-xs text-muted-foreground">{method.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Main Content */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="grid lg:grid-cols-2 gap-12">
              {/* Contact Form */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <h2 className="font-display text-3xl text-foreground mb-6">
                  ENVOYEZ-NOUS UN MESSAGE
                </h2>
                <Card className="bg-card/50 backdrop-blur border-border/50">
                  <CardContent className="p-6 space-y-4">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-foreground mb-2 block">
                          Prénom
                        </label>
                        <Input placeholder="Votre prénom" className="bg-muted/50" />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-foreground mb-2 block">
                          Nom
                        </label>
                        <Input placeholder="Votre nom" className="bg-muted/50" />
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground mb-2 block">
                        Email
                      </label>
                      <Input type="email" placeholder="votre@email.com" className="bg-muted/50" />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground mb-2 block">
                        Sujet
                      </label>
                      <Input placeholder="Objet de votre message" className="bg-muted/50" />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground mb-2 block">
                        Message
                      </label>
                      <Textarea
                        placeholder="Décrivez votre demande..."
                        className="bg-muted/50 min-h-[150px]"
                      />
                    </div>
                    <Button className="w-full bg-gradient-cta text-tokyo-night font-semibold hover:brightness-110 gap-2">
                      <Send className="h-4 w-4" />
                      Envoyer le message
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Quick Actions & FAQ */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-8"
              >
                <div>
                  <h2 className="font-display text-3xl text-foreground mb-6">
                    ACTIONS RAPIDES
                  </h2>
                  <div className="space-y-3">
                    {quickActions.map((action, index) => (
                      <Card
                        key={action.title}
                        className="bg-card/50 hover:bg-sakura/5 border-border/50 hover:border-sakura/30 transition-all cursor-pointer group"
                      >
                        <CardContent className="p-4 flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-turquoise/10 flex items-center justify-center group-hover:bg-sakura/10 transition-colors">
                            <action.icon className="h-6 w-6 text-turquoise group-hover:text-sakura transition-colors" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-foreground group-hover:text-sakura transition-colors">
                              {action.title}
                            </h3>
                            <p className="text-sm text-muted-foreground">{action.description}</p>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>

                {/* FAQ Preview */}
                <div>
                  <h2 className="font-display text-3xl text-foreground mb-6">
                    QUESTIONS FRÉQUENTES
                  </h2>
                  <Card className="bg-gradient-neon border-border/50">
                    <CardContent className="p-6">
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-semibold text-foreground mb-1">
                            Comment devenir membre ?
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            Créez un compte et choisissez votre formule d'adhésion.
                          </p>
                        </div>
                        <div>
                          <h4 className="font-semibold text-foreground mb-1">
                            Où se déroulent les événements ?
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            Principalement en région parisienne, et bientôt au Hub 2027 !
                          </p>
                        </div>
                        <div>
                          <h4 className="font-semibold text-foreground mb-1">
                            Comment utiliser mes OTK Coins ?
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            Échangez-les contre des goodies au Bazar d'Akihabara.
                          </p>
                        </div>
                      </div>
                      <Button variant="outline" className="w-full mt-6 border-border/50">
                        Voir toutes les FAQ
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </motion.div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Contact;
