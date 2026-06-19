import { motion, AnimatePresence } from "framer-motion";
import {
  X, Trophy, User, Users, Music, FileText, Lightbulb,
  MessageSquare, Calendar, MapPin, Clock, AlertTriangle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { CosplayRegistration } from "@/hooks/useCosplayRegistrations";

interface RegistrationDetailsModalProps {
  registration: CosplayRegistration | null;
  isOpen: boolean;
  onClose: () => void;
}

// Status badge configuration
const statusConfig: Record<
  string,
  { label: string; color: string; bgColor: string; borderGlow: string }
> = {
  PENDING: {
    label: "En attente de validation",
    color: "text-amber-400",
    bgColor: "bg-amber-500/20 border-amber-500/30",
    borderGlow: "shadow-[0_0_15px_rgba(245,158,11,0.3)]",
  },
  APPROVED: {
    label: "Dossier approuvé ✅",
    color: "text-green-400",
    bgColor: "bg-green-500/20 border-green-500/30",
    borderGlow: "shadow-[0_0_15px_rgba(34,197,94,0.3)]",
  },
  REJECTED: {
    label: "Dossier refusé",
    color: "text-red-400",
    bgColor: "bg-red-500/20 border-red-500/30",
    borderGlow: "shadow-[0_0_15px_rgba(239,68,68,0.3)]",
  },
};

// Universe emoji mapping
const universeEmoji: Record<string, string> = {
  "manga_anime": "🎨",
  "jeu_video": "🎮",
  "comics": "💥",
  "autre": "✨",
};

const InfoRow = ({
  icon: Icon,
  label,
  value,
  className,
}: {
  icon: React.ElementType;
  label: string;
  value: React.ReactNode;
  className?: string;
}) => (
  <div className={cn("flex items-start gap-3 py-2", className)}>
    <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0">
      <Icon className="w-4 h-4 text-[hsl(var(--mp-info))]" />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="text-sm text-foreground mt-0.5">{value}</div>
    </div>
  </div>
);

const FileLink = ({
  url,
  name,
  icon: Icon,
}: {
  url: string;
  name: string;
  icon: React.ElementType;
}) => (
  <a
    href={url}
    target="_blank"
    rel="noopener noreferrer"
    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 hover:border-[hsl(var(--mp-primary))]/30 transition-all group"
  >
    <Icon className="w-4 h-4 text-[hsl(var(--mp-primary))] group-hover:scale-110 transition-transform" />
    <span className="text-sm text-foreground truncate">{name}</span>
  </a>
);

const RegistrationDetailsModal = ({
  registration,
  isOpen,
  onClose,
}: RegistrationDetailsModalProps) => {
  if (!registration) return null;

  const statusInfo = statusConfig[registration.status] || statusConfig.PENDING;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed inset-x-4 top-[5vh] bottom-[5vh] md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-full md:max-w-lg z-50 flex flex-col"
          >
            <div
              className={cn(
                "flex flex-col h-full rounded-2xl overflow-hidden",
                "bg-slate-950/95 backdrop-blur-xl border border-white/10",
                statusInfo.borderGlow
              )}
            >
              {/* Header with image */}
              <div className="relative h-48 flex-shrink-0">
                {registration.image_url ? (
                  <img
                    src={registration.image_url}
                    alt={registration.character_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-[hsl(var(--mp-primary))]/30 via-purple-900/30 to-[hsl(var(--mp-info))]/30 flex items-center justify-center">
                    <span className="text-6xl">🎭</span>
                  </div>
                )}

                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/50 to-transparent" />

                {/* Close button */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  className="absolute top-3 right-3 rounded-full bg-black/50 hover:bg-black/70 text-white"
                >
                  <X className="w-5 h-5" />
                </Button>

                {/* Status badge overlay */}
                <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between">
                  <div>
                    <h2 className="text-xl font-display text-white drop-shadow-lg">
                      {registration.character_name}
                    </h2>
                    <p className="text-sm text-white/70">
                      {universeEmoji[registration.universe] || "✨"}{" "}
                      {registration.universe}
                    </p>
                  </div>
                  <Badge
                    className={cn(
                      "px-3 py-1 text-xs font-medium border",
                      statusInfo.bgColor,
                      statusInfo.color
                    )}
                  >
                    {statusInfo.label}
                  </Badge>
                </div>
              </div>

              {/* Scrollable content */}
              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
                {/* Event info card */}
                <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                  <h3 className="text-sm font-display text-foreground mb-3 flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-[hsl(var(--mp-saffron))]" />
                    Événement
                  </h3>
                  <p className="text-base font-semibold text-foreground">
                    {registration.contest_name}
                  </p>
                  {registration.event_location && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                      <MapPin className="w-3 h-3" />
                      {registration.event_location}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                    <Calendar className="w-3 h-3" />
                    {format(new Date(registration.event_date), "EEEE d MMMM yyyy", {
                      locale: fr,
                    })}
                  </p>
                </div>

                {/* Participation details */}
                <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                  <h3 className="text-sm font-display text-foreground mb-3">
                    📋 Détails de l'inscription
                  </h3>

                  <InfoRow
                    icon={registration.participation_type === "group" ? Users : User}
                    label="Type de participation"
                    value={
                      <span className="flex items-center gap-2">
                        {registration.participation_type === "group"
                          ? "Groupe"
                          : "Solo"}
                        {registration.group_name && (
                          <Badge variant="outline" className="text-xs">
                            {registration.group_name}
                          </Badge>
                        )}
                      </span>
                    }
                  />

                  {registration.is_minor && (
                    <InfoRow
                      icon={AlertTriangle}
                      label="Statut"
                      value={
                        <span className="text-amber-400">
                          Participant mineur — Autorisation parentale requise
                        </span>
                      }
                    />
                  )}

                  <InfoRow
                    icon={Clock}
                    label="Date d'inscription"
                    value={format(
                      new Date(registration.created_at),
                      "d MMMM yyyy 'à' HH:mm",
                      { locale: fr }
                    )}
                  />
                </div>

                {/* Files section */}
                {(registration.music_file_url ||
                  registration.authorization_file_url ||
                  registration.reference_image_url) && (
                  <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                    <h3 className="text-sm font-display text-foreground mb-3">
                      📎 Fichiers joints
                    </h3>
                    <div className="space-y-2">
                      {registration.reference_image_url && (
                        <FileLink
                          url={registration.reference_image_url}
                          name="Image de référence"
                          icon={FileText}
                        />
                      )}
                      {registration.music_file_url && (
                        <FileLink
                          url={registration.music_file_url}
                          name={registration.music_file_name || "Fichier audio (MP3)"}
                          icon={Music}
                        />
                      )}
                      {registration.authorization_file_url && (
                        <FileLink
                          url={registration.authorization_file_url}
                          name={
                            registration.authorization_file_name ||
                            "Autorisation parentale (PDF)"
                          }
                          icon={FileText}
                        />
                      )}
                    </div>
                  </div>
                )}

                {/* Technical needs */}
                {registration.technical_needs && (
                  <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                    <h3 className="text-sm font-display text-foreground mb-3 flex items-center gap-2">
                      <Lightbulb className="w-4 h-4 text-[hsl(var(--mp-saffron))]" />
                      Besoins techniques
                    </h3>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {registration.technical_needs}
                    </p>
                  </div>
                )}

                {/* Staff comments */}
                {registration.staff_comments && (
                  <div className="p-4 rounded-xl bg-[hsl(var(--mp-primary))]/5 border border-[hsl(var(--mp-primary))]/20">
                    <h3 className="text-sm font-display text-foreground mb-3 flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-[hsl(var(--mp-primary))]" />
                      Commentaires du staff
                    </h3>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {registration.staff_comments}
                    </p>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="flex-shrink-0 p-4 border-t border-white/10">
                <Button
                  onClick={onClose}
                  className="w-full bg-gradient-to-r from-[hsl(var(--mp-primary))] to-pink-600 hover:from-[hsl(var(--mp-primary))]/90 hover:to-pink-600/90 text-white"
                >
                  Fermer
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default RegistrationDetailsModal;
