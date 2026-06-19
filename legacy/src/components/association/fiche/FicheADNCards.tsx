import { motion } from "framer-motion";
import { Target, Sparkles, Heart } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { AssociationFicheConfig, SectionsVisibility } from "@/hooks/useAssociationFiche";
import { isSectionVisible } from "@/hooks/useAssociationFiche";

interface FicheADNCardsProps {
  config: AssociationFicheConfig;
  isMember: boolean;
}

const FicheADNCards = ({ config, isMember }: FicheADNCardsProps) => {
  const visibility = config.sections_visibility;

  const cards = [
    {
      key: "mission" as keyof SectionsVisibility,
      icon: Target,
      title: "Notre Mission",
      content: config.mission,
      gradient: "from-sakura/20 to-sakura/5",
    },
    {
      key: "vision" as keyof SectionsVisibility,
      icon: Sparkles,
      title: "Notre Vision",
      content: config.vision,
      gradient: "from-turquoise/20 to-turquoise/5",
    },
    {
      key: "values" as keyof SectionsVisibility,
      icon: Heart,
      title: "Nos Valeurs",
      content: config.values,
      gradient: "from-accent/20 to-accent/5",
    },
  ];

  const visibleCards = cards.filter(
    (card) => isSectionVisible(card.key, visibility, isMember) && card.content
  );

  if (visibleCards.length === 0) return null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      <h2 className="text-2xl font-display text-foreground mb-6 text-center">
        L'ADN de l'Association
      </h2>
      <div
        className={`grid grid-cols-1 gap-6 ${
          visibleCards.length === 1
            ? "max-w-lg mx-auto"
            : visibleCards.length === 2
            ? "md:grid-cols-2 max-w-3xl mx-auto"
            : "md:grid-cols-3"
        }`}
      >
        {visibleCards.map((card, index) => (
          <motion.div
            key={card.key}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + index * 0.1 }}
          >
            <Card
              className={`h-full bg-gradient-to-br ${card.gradient} border-white/10 hover:border-sakura/50 transition-all duration-300`}
            >
              <CardHeader className="text-center">
                <div className="mx-auto w-14 h-14 rounded-full bg-white/10 flex items-center justify-center mb-3">
                  <card.icon className="w-7 h-7 text-sakura" />
                </div>
                <CardTitle className="text-lg">{card.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-center text-muted-foreground whitespace-pre-line">
                  {card.content}
                </CardDescription>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </motion.section>
  );
};

export default FicheADNCards;
