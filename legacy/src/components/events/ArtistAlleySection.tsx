import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Palette, Store, Sparkles, ExternalLink, Loader2 } from "lucide-react";
import { useApprovedExhibitors, EventExhibitor } from "@/hooks/useEventExhibitors";
import { cn } from "@/lib/utils";

interface ArtistAlleySectionProps {
  eventId: string;
}

const ArtistAlleySection = ({ eventId }: ArtistAlleySectionProps) => {
  const { data: exhibitors = [], isLoading } = useApprovedExhibitors(eventId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-[hsl(var(--mp-primary))]" />
      </div>
    );
  }

  if (exhibitors.length === 0) {
    return (
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mt-8"
      >
        <div className="text-center py-12 bg-black/40 backdrop-blur-md border border-white/10 rounded-2xl">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-[hsl(var(--mp-primary))]/20 to-[hsl(var(--mp-info))]/20 flex items-center justify-center">
            <Store className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="font-display text-xl text-muted-foreground mb-2">
            Village Créateurs
          </h3>
          <p className="text-sm text-muted-foreground">
            Les exposants seront bientôt annoncés ! ✨
          </p>
        </div>
      </motion.section>
    );
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="mt-8"
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[hsl(var(--mp-primary))] to-[hsl(var(--mp-info))] flex items-center justify-center shadow-[0_0_15px_rgba(255,0,127,0.5)]">
          <Palette className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="font-display text-2xl flex items-center gap-2">
            🎨 Village Créateurs
            <Badge className="bg-[hsl(var(--mp-primary))]/20 text-[hsl(var(--mp-primary))] border-[hsl(var(--mp-primary))]/30">
              {exhibitors.length} stand{exhibitors.length > 1 ? "s" : ""}
            </Badge>
          </h2>
          <p className="text-sm text-muted-foreground">
            Découvrez les talents de la communauté !
          </p>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {exhibitors.map((exhibitor, index) => (
          <ExhibitorCard key={exhibitor.id} exhibitor={exhibitor} index={index} />
        ))}
      </div>

      {/* Footer note */}
      <div className="mt-6 bg-gradient-to-r from-[hsl(var(--mp-primary))]/10 to-[hsl(var(--mp-info))]/10 border border-white/10 rounded-lg p-4">
        <p className="text-sm text-muted-foreground flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[hsl(var(--mp-primary))]" />
          <span>
            Retrouvez tous ces créateurs dans le <strong>Village Créateurs</strong> pendant l'événement !
          </span>
        </p>
      </div>
    </motion.section>
  );
};

const ExhibitorCard = ({ exhibitor, index }: { exhibitor: EventExhibitor; index: number }) => {
  const profile = exhibitor.profile;
  const initials = profile?.display_name?.slice(0, 2).toUpperCase() 
    || profile?.username?.slice(0, 2).toUpperCase() 
    || "??";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05 * index }}
    >
      <Link to={profile?.username ? `/u/${profile.username}` : `/profile/${exhibitor.user_id}`}>
        <Card className={cn(
          "p-4 transition-all duration-300 group",
          "bg-black/40 backdrop-blur-md border border-white/10",
          "hover:border-[hsl(var(--mp-primary))]/50 hover:shadow-[0_0_20px_rgba(255,0,127,0.2)]",
          "hover:scale-[1.02] active:scale-[0.98]"
        )}>
          <div className="flex flex-col items-center text-center space-y-3">
            {/* Avatar */}
            <div className="relative">
              <Avatar className="w-16 h-16 border-2 border-[hsl(var(--mp-primary))]/30 group-hover:border-[hsl(var(--mp-primary))] transition-colors">
                <AvatarImage src={profile?.avatar_url || undefined} />
                <AvatarFallback className="bg-gradient-to-br from-[hsl(var(--mp-primary))]/20 to-[hsl(var(--mp-info))]/20 text-white font-display">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-gradient-to-br from-[hsl(var(--mp-primary))] to-[hsl(var(--mp-info))] flex items-center justify-center border-2 border-background shadow-[0_0_10px_rgba(255,0,127,0.5)]">
                <Store className="w-3 h-3 text-white" />
              </div>
            </div>

            {/* Stand Name */}
            <div className="space-y-1 w-full">
              <h3 className="font-display text-sm leading-tight line-clamp-2 group-hover:text-[hsl(var(--mp-primary))] transition-colors">
                {exhibitor.stand_name}
              </h3>
              <p className="text-xs text-muted-foreground line-clamp-1">
                {profile?.display_name || profile?.username || "Créateur"}
              </p>
            </div>

            {/* Description preview */}
            {exhibitor.stand_description && (
              <p className="text-xs text-muted-foreground line-clamp-2">
                {exhibitor.stand_description}
              </p>
            )}
          </div>
        </Card>
      </Link>
    </motion.div>
  );
};

export default ArtistAlleySection;
