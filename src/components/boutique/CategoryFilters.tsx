import { motion } from "framer-motion";
import { Ticket, Gamepad2, Tv, Film, MapPin, Sparkles, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CategoryFiltersProps {
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
}

const categories = [
  { id: "all", label: "Tous", emoji: "🛒", icon: Sparkles },
  { id: "streaming", label: "Streaming", emoji: "📺", icon: Tv },
  { id: "gaming", label: "Gaming", emoji: "🎮", icon: Gamepad2 },
  { id: "cinema", label: "Cinéma", emoji: "🍿", icon: Film },
  { id: "event", label: "Événements", emoji: "🎫", icon: Calendar },
  { id: "local", label: "Partenaires", emoji: "📍", icon: MapPin },
];

const CategoryFilters = ({ selectedCategory, onCategoryChange }: CategoryFiltersProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="py-6 border-b border-border/30"
    >
      <div className="container mx-auto px-4">
        <div className="flex flex-wrap gap-3 justify-center">
          {categories.map((category, index) => {
            const Icon = category.icon;
            const isActive = selectedCategory === category.id;
            
            return (
              <motion.div
                key={category.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
              >
                <Button
                  variant={isActive ? "default" : "outline"}
                  onClick={() => onCategoryChange(category.id)}
                  className={`gap-2 transition-all ${
                    isActive 
                      ? "bg-primary text-primary-foreground shadow-glow" 
                      : "hover:bg-primary/10 hover:border-primary/50"
                  } ${category.id === "local" ? "border-turquoise/50 hover:border-turquoise" : ""}`}
                >
                  <span>{category.emoji}</span>
                  {category.label}
                </Button>
              </motion.div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
};

export default CategoryFilters;
