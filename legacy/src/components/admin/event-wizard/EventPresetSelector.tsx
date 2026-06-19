/**
 * EventPresetSelector — Écran initial de choix de preset
 * 
 * Grille de cartes visuelles pour choisir le type d'événement.
 * Chaque carte préconfigure le formulaire avec des champs et modules adaptés.
 */

import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { EVENT_PRESETS, type PresetConfig, type EventPreset } from "./eventFormTypes";

interface EventPresetSelectorProps {
  onSelect: (preset: PresetConfig) => void;
}

const EventPresetSelector = ({ onSelect }: EventPresetSelectorProps) => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <h2 className="text-2xl font-display tracking-wide text-foreground">
            Quel type d'événement ?
          </h2>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Choisis un preset pour pré-configurer ton événement, ou commence de zéro avec "Personnalisé".
          </p>
        </motion.div>
      </div>

      {/* Preset Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {EVENT_PRESETS.map((preset, index) => (
          <motion.div
            key={preset.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
          >
            <Card
              className={cn(
                "relative overflow-hidden cursor-pointer transition-all duration-200",
                "hover:shadow-glow hover:-translate-y-1 hover:border-sakura/50",
                "border-2 border-transparent",
                "group"
              )}
              onClick={() => onSelect(preset)}
            >
              {/* Gradient Background */}
              <div className={cn(
                "absolute inset-0 bg-gradient-to-br opacity-50 group-hover:opacity-80 transition-opacity",
                preset.gradient
              )} />

              {/* Content */}
              <div className="relative p-4 text-center space-y-2">
                {/* Icon */}
                <div className="text-3xl mb-1 group-hover:scale-110 transition-transform duration-200">
                  {preset.icon}
                </div>

                {/* Label */}
                <h3 className="font-display text-sm tracking-wide text-foreground leading-tight">
                  {preset.label}
                </h3>

                {/* Description */}
                <p className="text-[10px] text-muted-foreground leading-tight line-clamp-2">
                  {preset.description}
                </p>

                {/* Modules badges */}
                {preset.enabledModules.length > 0 && (
                  <div className="flex flex-wrap justify-center gap-1 pt-1">
                    {preset.enabledModules.slice(0, 3).map((mod) => (
                      <span
                        key={mod}
                        className="inline-block px-1.5 py-0.5 text-[9px] rounded-full bg-white/10 text-muted-foreground border border-white/5"
                      >
                        {mod.replace("-", " ")}
                      </span>
                    ))}
                    {preset.enabledModules.length > 3 && (
                      <span className="inline-block px-1.5 py-0.5 text-[9px] rounded-full bg-white/10 text-muted-foreground">
                        +{preset.enabledModules.length - 3}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Hover Glow Line */}
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-sakura via-turquoise to-sakura opacity-0 group-hover:opacity-100 transition-opacity" />
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default EventPresetSelector;
