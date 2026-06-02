import { motion } from "framer-motion";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Building2, Coffee, Calendar, Users, Heart, 
  Sparkles, ArrowRight, MapPin, Utensils, Music
} from "lucide-react";
import { Link } from "react-router-dom";

const features = [
  {
    icon: Coffee,
    title: "Bar à Thème",
    description: "Boissons inspirées de vos mangas préférés dans une ambiance immersive."
  },
  {
    icon: Calendar,
    title: "Événements",
    description: "Projections, tournois, ateliers créatifs et soirées thématiques."
  },
  {
    icon: Users,
    title: "Espace Communautaire",
    description: "Rencontrez des passionnés et partagez votre passion."
  },
  {
    icon: Building2,
    title: "Location d'Espaces",
    description: "Salles modulables pour vos événements privés ou professionnels."
  },
];

const menuItems = [
  { name: "Le Rasengan", description: "Smoothie énergisant mangue-passion", price: "5.50€", tag: "Best-seller" },
  { name: "Le Kage Bunshin", description: "Bubble tea classique aux perles de tapioca", price: "6.00€" },
  { name: "L'Akatsuki", description: "Thé glacé fruits rouges et hibiscus", price: "4.50€" },
  { name: "Le Titan", description: "Café frappé XXL avec crème fouettée", price: "6.50€", tag: "Nouveau" },
];

const LeHub = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="pt-20 lg:pt-24">
        {/* Hero Section - Immersive */}
        <section className="relative min-h-[70vh] flex items-center overflow-hidden">
          <div className="absolute inset-0">
            <img 
              src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1920"
              alt="Le Hub 2027"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-tokyo-night via-tokyo-night/80 to-transparent" />
          </div>
          
          <div className="container mx-auto px-4 relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="max-w-2xl"
            >
              <Badge className="mb-4 bg-sakura/20 text-sakura border-sakura/30">
                <Sparkles className="h-3 w-3 mr-1" />
                Ouverture 2027
              </Badge>
              <h1 className="font-display text-5xl lg:text-7xl text-foreground mb-6">
                LE <span className="text-sakura">HUB</span>
                <br />MANGA PARADISE
              </h1>
              <p className="text-lg text-muted-foreground mb-8 max-w-lg">
                Le premier tiers-lieu dédié à la culture manga en France. 
                Un espace unique mêlant bar, événements et communauté.
              </p>
              <div className="flex flex-wrap gap-4">
                <Button 
                  size="lg" 
                  className="bg-gradient-cta text-tokyo-night font-display tracking-wider hover:brightness-110 shadow-glow-yellow gap-2"
                >
                  <Heart className="h-5 w-5" />
                  SOUTENIR LE PROJET
                </Button>
                <Button variant="outline" size="lg" className="border-border/50 gap-2">
                  En savoir plus
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="py-20 bg-gradient-neon">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="font-display text-4xl lg:text-5xl text-foreground mb-4">
                UN LIEU <span className="text-turquoise">UNIQUE</span>
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Plus qu'un simple bar, Le Hub est un véritable écosystème pour les passionnés de culture japonaise.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="h-full bg-card/50 backdrop-blur border-border/50 hover:border-sakura/30 transition-all group">
                    <CardContent className="p-6 text-center">
                      <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-sakura/10 flex items-center justify-center group-hover:bg-sakura/20 transition-colors">
                        <feature.icon className="h-8 w-8 text-sakura" />
                      </div>
                      <h3 className="font-display text-xl text-foreground mb-2">{feature.title}</h3>
                      <p className="text-sm text-muted-foreground">{feature.description}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Menu Preview */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
              >
                <div className="flex items-center gap-2 mb-4">
                  <Utensils className="h-5 w-5 text-turquoise" />
                  <span className="text-sm font-medium text-turquoise uppercase tracking-wider">Aperçu</span>
                </div>
                <h2 className="font-display text-4xl lg:text-5xl text-foreground mb-6">
                  MENU DU <span className="text-sakura">BAR</span>
                </h2>
                <p className="text-muted-foreground mb-8">
                  Des créations originales inspirées de vos univers favoris. 
                  Chaque boisson raconte une histoire.
                </p>
                
                <div className="space-y-4">
                  {menuItems.map((item, index) => (
                    <motion.div
                      key={item.name}
                      initial={{ opacity: 0, x: -10 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center justify-between p-4 rounded-xl bg-muted/30 hover:bg-sakura/5 transition-colors"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-foreground">{item.name}</h4>
                          {item.tag && (
                            <Badge variant="secondary" className="text-xs">{item.tag}</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{item.description}</p>
                      </div>
                      <span className="font-display text-xl text-sakura">{item.price}</span>
                    </motion.div>
                  ))}
                </div>
                
                <Button variant="outline" className="mt-6 gap-2">
                  Voir le menu complet
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="relative"
              >
                <div className="aspect-[4/5] rounded-2xl overflow-hidden">
                  <img 
                    src="https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=800"
                    alt="Boissons du Hub"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="absolute -bottom-6 -left-6 p-4 rounded-xl bg-tokyo-night/90 backdrop-blur border border-border/30">
                  <div className="flex items-center gap-3">
                    <Music className="h-6 w-6 text-sakura" />
                    <div>
                      <p className="font-semibold text-foreground text-sm">Ambiance musicale</p>
                      <p className="text-xs text-muted-foreground">J-Pop, Anime OST, Lo-fi</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Location Section */}
        <section className="py-20 bg-gradient-neon">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center max-w-3xl mx-auto"
            >
              <div className="flex items-center justify-center gap-2 mb-4">
                <MapPin className="h-5 w-5 text-turquoise" />
                <span className="text-sm font-medium text-turquoise uppercase tracking-wider">Privatisation</span>
              </div>
              <h2 className="font-display text-4xl lg:text-5xl text-foreground mb-6">
                LOCATION D'<span className="text-sakura">ESPACES</span>
              </h2>
              <p className="text-muted-foreground mb-8">
                Organisez vos événements dans un cadre unique. Anniversaires, réunions d'équipe, 
                tournois de jeux vidéo... Le Hub s'adapte à vos besoins.
              </p>
              <div className="grid sm:grid-cols-3 gap-6 mb-8">
                <Card className="bg-card/50 border-border/50">
                  <CardContent className="p-6 text-center">
                    <h3 className="font-display text-2xl text-sakura mb-1">50</h3>
                    <p className="text-sm text-muted-foreground">Personnes max.</p>
                  </CardContent>
                </Card>
                <Card className="bg-card/50 border-border/50">
                  <CardContent className="p-6 text-center">
                    <h3 className="font-display text-2xl text-turquoise mb-1">3</h3>
                    <p className="text-sm text-muted-foreground">Espaces modulables</p>
                  </CardContent>
                </Card>
                <Card className="bg-card/50 border-border/50">
                  <CardContent className="p-6 text-center">
                    <h3 className="font-display text-2xl text-electric-yellow mb-1">100%</h3>
                    <p className="text-sm text-muted-foreground">Personnalisable</p>
                  </CardContent>
                </Card>
              </div>
              <Button asChild className="bg-gradient-cta text-tokyo-night font-semibold hover:brightness-110">
                <Link to="/contact">Demander un devis</Link>
              </Button>
            </motion.div>
          </div>
        </section>

        {/* Support CTA */}
        <section className="py-20 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-sakura opacity-10" />
          <div className="container mx-auto px-4 relative z-10">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="text-center max-w-3xl mx-auto"
            >
              <Heart className="h-12 w-12 mx-auto mb-6 text-sakura" />
              <h2 className="font-display text-4xl lg:text-5xl text-foreground mb-6">
                SOUTENEZ LE <span className="text-sakura">PROJET</span>
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                Le Hub 2027 est un projet ambitieux qui a besoin de votre soutien. 
                Chaque contribution nous rapproche de l'ouverture.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Button 
                  size="lg" 
                  className="bg-gradient-cta text-tokyo-night font-display tracking-wider hover:brightness-110 shadow-glow-yellow"
                >
                  FAIRE UN DON
                </Button>
                <Button variant="outline" size="lg" className="border-sakura/50 text-sakura hover:bg-sakura/10">
                  DEVENIR MÉCÈNE
                </Button>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default LeHub;
