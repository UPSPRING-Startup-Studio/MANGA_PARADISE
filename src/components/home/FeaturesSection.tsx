import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Calendar, ShoppingCart, Users, Gamepad2, BookOpen, Trophy } from "lucide-react";

const features = [
  {
    icon: Calendar,
    title: "Événements Mensuels",
    description: "Ateliers, projections, tournois et rencontres avec des créateurs de l'univers manga.",
    color: "text-primary",
  },
  {
    icon: ShoppingCart,
    title: "Boutique & Marketplace",
    description: "Découvrez notre sélection de mangas, goodies et créations d'artistes locaux.",
    color: "text-secondary",
  },
  {
    icon: Users,
    title: "Communauté Engagée",
    description: "Rejoignez une communauté de passionnés et participez à la vie de l'association.",
    color: "text-accent",
  },
  {
    icon: Gamepad2,
    title: "Espace Gamifié",
    description: "Gagnez des OTK coins, débloquez des badges et profitez d'avantages exclusifs.",
    color: "text-primary",
  },
  {
    icon: BookOpen,
    title: "Ateliers Créatifs",
    description: "Apprenez le dessin manga, la calligraphie japonaise et bien plus encore.",
    color: "text-secondary",
  },
  {
    icon: Trophy,
    title: "Programme Partenaires",
    description: "Des avantages exclusifs avec nos partenaires locaux et boutiques spécialisées.",
    color: "text-accent",
  },
];

const FeaturesSection = () => {
  return (
    <section className="py-20 bg-mp-paper">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="font-display italic font-extrabold text-4xl md:text-5xl text-mp-ink mb-4">
            Ce que nous proposons
          </h2>
          <p className="text-lg text-mp-ink-muted max-w-2xl mx-auto">
            Un écosystème complet pour vivre votre passion manga au quotidien
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="p-6 h-full hover:shadow-card-lg transition-all duration-300 group cursor-pointer border hover:border-mp-primary/30">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-mp-primary/15 to-mp-orange/15 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <feature.icon className="w-6 h-6 text-mp-primary" />
                </div>
                <h3 className="font-display italic text-xl mb-2 text-mp-ink">
                  {feature.title}
                </h3>
                <p className="text-mp-ink-muted text-sm leading-relaxed">
                  {feature.description}
                </p>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;