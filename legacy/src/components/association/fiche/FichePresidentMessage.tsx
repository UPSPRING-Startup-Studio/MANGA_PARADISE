import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import type { AssociationFicheConfig } from "@/hooks/useAssociationFiche";

interface FichePresidentMessageProps {
  config: AssociationFicheConfig;
}

const FichePresidentMessage = ({ config }: FichePresidentMessageProps) => {
  const hasContent = config.president_message || config.president_name;

  if (!hasContent) {
    return (
      <Card className="bg-card/30 border-dashed border-muted-foreground/20">
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground text-sm">
            Aucun mot du/de la président·e n'a été défini.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
    >
      <Card className="overflow-hidden bg-gradient-to-br from-sakura/10 via-background to-accent/5 border-sakura/30">
        <CardContent className="p-0">
          <div className="flex flex-col md:flex-row items-center gap-6 p-6 md:p-8">
            {/* President Photo */}
            {config.president_photo && (
              <div className="flex-shrink-0">
                <div className="relative">
                  <div className="w-28 h-28 md:w-36 md:h-36 rounded-full overflow-hidden border-4 border-sakura shadow-lg shadow-sakura/20">
                    <img
                      src={config.president_photo}
                      alt={config.president_name || "Président·e"}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  {config.president_name && (
                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-sakura text-white text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap">
                      {config.president_name}
                    </div>
                  )}
                </div>
                {config.president_title && (
                  <p className="text-center text-sm text-muted-foreground mt-4">
                    {config.president_title}
                  </p>
                )}
              </div>
            )}

            {/* Welcome Message */}
            <div className="flex-1 text-center md:text-left">
              <h2 className="text-xl md:text-2xl font-display text-foreground mb-4">
                Le Mot du/de la {config.president_title || "Président·e"}
              </h2>
              {config.president_message && (
                <blockquote className="text-muted-foreground leading-relaxed whitespace-pre-line">
                  {config.president_message}
                </blockquote>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.section>
  );
};

export default FichePresidentMessage;
