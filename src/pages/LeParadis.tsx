import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { motion } from "framer-motion";
import { MapPin, Users, Heart, Target } from "lucide-react";
import { Card } from "@/components/ui/card";

const LeParadis = () => {
  const values = [
    {
      icon: Heart,
      title: "Passion",
      description: "Notre amour pour la culture manga et anime anime chaque projet et événement.",
    },
    {
      icon: Users,
      title: "Communauté",
      description: "Un espace inclusif où chacun peut partager sa passion et créer des liens.",
    },
    {
      icon: Target,
      title: "Excellence",
      description: "Nous visons l'excellence dans l'organisation de nos événements et services.",
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
                Le Paradis
              </h1>
              <p className="text-xl text-muted-foreground mb-8">
                Un tiers-lieu culturel unique dédié à l'univers manga, anime et culture japonaise
              </p>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-accent/20 rounded-full">
                <MapPin className="w-5 h-5 text-accent" />
                <span className="text-accent-foreground font-semibold">
                  Ouverture prévue en 2027
                </span>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Vision Section */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
              >
                <h2 className="font-display text-4xl mb-6">Notre Vision</h2>
                <div className="prose prose-lg max-w-none text-muted-foreground">
                  <p className="mb-4">
                    Manga Paradise est bien plus qu'un simple lieu de rencontre. C'est un écosystème 
                    complet où passion, créativité et partage se rencontrent pour créer une expérience 
                    unique dans le monde de la culture manga et anime.
                  </p>
                  <p className="mb-4">
                    Notre ambition est de créer le premier tiers-lieu entièrement dédié à cet univers, 
                    offrant des espaces de création, de formation, de partage et de commerce dans un 
                    cadre moderne et accueillant.
                  </p>
                  <p>
                    D'ici 2027, nous ouvrirons nos portes physiques pour accueillir une communauté 
                    grandissante de passionnés, créateurs et curieux de tous horizons.
                  </p>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Values Section */}
        <section className="py-20 bg-muted/20">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="font-display text-4xl mb-4">Nos Valeurs</h2>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {values.map((value, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="p-6 text-center h-full hover:shadow-lg transition-all">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                      <value.icon className="w-8 h-8 text-primary" />
                    </div>
                    <h3 className="font-display text-2xl mb-3">{value.title}</h3>
                    <p className="text-muted-foreground">{value.description}</p>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Future Space Preview */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <h2 className="font-display text-4xl mb-6">Le Lieu en 2027</h2>
                <p className="text-lg text-muted-foreground mb-8">
                  Le tiers-lieu Manga Paradise comprendra plusieurs espaces dédiés :
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                  {[
                    "Salles d'ateliers créatifs (dessin, cosplay, calligraphie)",
                    "Espace boutique et marketplace créateurs",
                    "Salle de projection et événements",
                    "Coin gaming et tournois",
                    "Espace co-working pour créateurs",
                    "Café thématique japonais",
                    "Bibliothèque manga",
                    "Studio photo/vidéo pour créateurs de contenu",
                  ].map((item, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-start gap-3 p-4 rounded-lg bg-card border border-border"
                    >
                      <div className="w-2 h-2 mt-2 rounded-full bg-primary flex-shrink-0"></div>
                      <span className="text-foreground">{item}</span>
                    </motion.div>
                  ))}
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

export default LeParadis;