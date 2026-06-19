import { Button } from "@/components/ui/button";
import { 
  Brush, 
  Megaphone, 
  Globe2, 
  Mic2, 
  Package,
  Layers,
  Flame,
  Crown,
  Clock
} from "lucide-react";

interface QuestFiltersProps {
  activeCategory: string | null;
  activePriority: string | null;
  onCategoryChange: (category: string | null) => void;
  onPriorityChange: (priority: string | null) => void;
}

const categories = [
  { id: "creation", icon: <Brush className="w-4 h-4" />, label: "Créa" },
  { id: "communication", icon: <Megaphone className="w-4 h-4" />, label: "Com" },
  { id: "culture", icon: <Globe2 className="w-4 h-4" />, label: "Culture" },
  { id: "animation", icon: <Mic2 className="w-4 h-4" />, label: "Anim" },
  { id: "logistique", icon: <Package className="w-4 h-4" />, label: "Logistique" },
];

const priorities = [
  { id: "normal", icon: <Clock className="w-4 h-4" />, label: "Normal" },
  { id: "urgent", icon: <Flame className="w-4 h-4" />, label: "Urgent" },
  { id: "legendary", icon: <Crown className="w-4 h-4" />, label: "Légendaire" },
];

export const QuestFilters = ({
  activeCategory,
  activePriority,
  onCategoryChange,
  onPriorityChange,
}: QuestFiltersProps) => {
  return (
    <div className="space-y-3">
      {/* Category filters */}
      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          variant={activeCategory === null ? "default" : "outline"}
          onClick={() => onCategoryChange(null)}
          className="gap-1.5"
        >
          <Layers className="w-4 h-4" />
          Toutes
        </Button>
        {categories.map((cat) => (
          <Button
            key={cat.id}
            size="sm"
            variant={activeCategory === cat.id ? "default" : "outline"}
            onClick={() => onCategoryChange(activeCategory === cat.id ? null : cat.id)}
            className="gap-1.5"
          >
            {cat.icon}
            {cat.label}
          </Button>
        ))}
      </div>

      {/* Priority filters */}
      <div className="flex flex-wrap gap-2">
        {priorities.map((pri) => (
          <Button
            key={pri.id}
            size="sm"
            variant={activePriority === pri.id ? "secondary" : "ghost"}
            onClick={() => onPriorityChange(activePriority === pri.id ? null : pri.id)}
            className="gap-1.5 h-8"
          >
            {pri.icon}
            {pri.label}
          </Button>
        ))}
      </div>
    </div>
  );
};
