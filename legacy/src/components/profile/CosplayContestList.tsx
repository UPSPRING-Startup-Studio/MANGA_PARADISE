import { useState } from "react";
import { motion } from "framer-motion";
import { Trophy, Calendar, User, Users, AlertCircle, Eye, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { CosplayRegistration } from "@/hooks/useCosplayRegistrations";
import RegistrationDetailsModal from "./RegistrationDetailsModal";

interface CosplayContestListProps {
  registrations: CosplayRegistration[];
  isLoading?: boolean;
}

// Status badge configuration
const statusConfig: Record<
  string,
  { label: string; color: string; bgColor: string; icon: React.ElementType }
> = {
  PENDING: {
    label: "En attente",
    color: "text-amber-400",
    bgColor: "bg-amber-500/20 border-amber-500/30",
    icon: AlertCircle,
  },
  APPROVED: {
    label: "Approuvé",
    color: "text-green-400",
    bgColor: "bg-green-500/20 border-green-500/30",
    icon: Trophy,
  },
  REJECTED: {
    label: "Rejeté",
    color: "text-red-400",
    bgColor: "bg-red-500/20 border-red-500/30",
    icon: AlertCircle,
  },
};

const CosplayContestList = ({
  registrations,
  isLoading = false,
}: CosplayContestListProps) => {
  const [selectedRegistration, setSelectedRegistration] =
    useState<CosplayRegistration | null>(null);

  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card rounded-xl p-6 border"
      >
        <h3 className="text-lg font-display text-foreground mb-4 flex items-center gap-2">
          <Trophy className="w-5 h-5 text-[hsl(var(--mp-saffron))]" />
          🏆 Mes Concours & Scènes
        </h3>
        <div className="space-y-4">
          {[...Array(2)].map((_, i) => (
            <div
              key={i}
              className="h-52 bg-muted/50 rounded-xl animate-pulse"
            />
          ))}
        </div>
      </motion.div>
    );
  }

  if (!registrations || registrations.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card rounded-xl p-6 border"
      >
        <h3 className="text-lg font-display text-foreground mb-4 flex items-center gap-2">
          <Trophy className="w-5 h-5 text-[hsl(var(--mp-saffron))]" />
          🏆 Mes Concours & Scènes
        </h3>
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <Trophy className="w-12 h-12 text-muted-foreground/30 mb-3" />
          <p className="text-muted-foreground text-sm">
            Aucune inscription pour le moment.
          </p>
          <p className="text-muted-foreground/70 text-xs mt-1">
            Inscris-toi à un concours cosplay lors d'un événement !
          </p>
        </div>
      </motion.div>
    );
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card rounded-xl p-6 border"
      >
        <h3 className="text-lg font-display text-foreground mb-4 flex items-center gap-2">
          <Trophy className="w-5 h-5 text-[hsl(var(--mp-saffron))]" />
          🏆 Mes Concours & Scènes
          <Badge variant="secondary" className="ml-auto text-xs">
            {registrations.length}
          </Badge>
        </h3>

        <div className="space-y-4">
          {registrations.map((registration, index) => {
            const statusInfo =
              statusConfig[registration.status] || statusConfig.PENDING;
            const StatusIcon = statusInfo.icon;

            return (
              <motion.div
                key={registration.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.08 }}
                className={cn(
                  "rounded-xl overflow-hidden border border-white/5",
                  "bg-muted/30 hover:bg-muted/50 transition-all duration-300",
                  "hover:border-[hsl(var(--mp-primary))]/20 hover:shadow-[0_0_20px_rgba(255,0,127,0.1)]"
                )}
              >
                {/* Card Header — Event info */}
                <div className="px-4 py-3 border-b border-white/5 bg-white/[0.02]">
                  <p className="text-sm font-display text-foreground truncate">
                    {registration.contest_name}
                  </p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                    {registration.event_location ? (
                      <>
                        <MapPin className="w-3 h-3" />
                        {registration.event_location}
                      </>
                    ) : (
                      "Organisé par Manga Paradise"
                    )}
                  </p>
                </div>

                {/* Card Body — Image + Info */}
                <div className="flex gap-4 p-4">
                  {/* Left: Character image (large) */}
                  <div className="w-24 h-28 rounded-lg overflow-hidden bg-muted flex-shrink-0 border border-white/10">
                    {registration.image_url ? (
                      <img
                        src={registration.image_url}
                        alt={registration.character_name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-3xl bg-gradient-to-br from-[hsl(var(--mp-primary))]/20 to-[hsl(var(--mp-info))]/20">
                        🎭
                      </div>
                    )}
                  </div>

                  {/* Right: Details */}
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <p className="font-display text-base text-foreground truncate">
                        {registration.character_name}
                      </p>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">
                        {registration.universe}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        {registration.participation_type === "group" ? (
                          <Badge
                            variant="outline"
                            className="text-xs gap-1 border-purple-500/30 text-purple-400"
                          >
                            <Users className="w-3 h-3" />
                            Groupe
                            {registration.group_name &&
                              ` — ${registration.group_name}`}
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="text-xs gap-1 border-[hsl(var(--mp-info))]/30 text-[hsl(var(--mp-info))]"
                          >
                            <User className="w-3 h-3" />
                            Solo
                          </Badge>
                        )}
                      </div>
                    </div>

                    <p className="text-xs text-muted-foreground/70 flex items-center gap-1 mt-2">
                      <Calendar className="w-3 h-3" />
                      {format(new Date(registration.event_date), "d MMM yyyy", {
                        locale: fr,
                      })}
                    </p>
                  </div>
                </div>

                {/* Card Footer — Status + Action */}
                <div className="px-4 py-3 border-t border-white/5 flex items-center justify-between bg-white/[0.02]">
                  <Badge
                    className={cn(
                      "flex items-center gap-1 px-2 py-1 text-xs font-medium border",
                      statusInfo.bgColor,
                      statusInfo.color
                    )}
                  >
                    <StatusIcon className="w-3 h-3" />
                    {statusInfo.label}
                  </Badge>

                  <Button
                    size="sm"
                    variant="ghost"
                    className={cn(
                      "text-xs h-8 gap-1.5",
                      "text-[hsl(var(--mp-info))] hover:text-[hsl(var(--mp-info))] hover:bg-[hsl(var(--mp-info))]/10",
                      "transition-all duration-200"
                    )}
                    onClick={() => setSelectedRegistration(registration)}
                  >
                    <Eye className="w-3.5 h-3.5" />
                    Voir mon dossier
                  </Button>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Info Footer */}
        <div className="mt-4 p-3 rounded-lg bg-white/5 border border-white/10 text-xs text-muted-foreground">
          <p>
            💡 <strong>Astuce :</strong> Tes inscriptions sont liées à ton
            vestiaire. Si tu as créé un costume, il sera automatiquement associé.
          </p>
        </div>
      </motion.div>

      {/* Registration Details Modal */}
      <RegistrationDetailsModal
        registration={selectedRegistration}
        isOpen={!!selectedRegistration}
        onClose={() => setSelectedRegistration(null)}
      />
    </>
  );
};

export default CosplayContestList;
