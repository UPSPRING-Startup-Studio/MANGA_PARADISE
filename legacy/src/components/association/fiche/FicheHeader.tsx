import { motion } from "framer-motion";
import { Settings, Building2, MapPin, Globe, ExternalLink, UserPlus } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { Association } from "@/hooks/useAssociation";

interface FicheHeaderProps {
  association: Association;
  canConfigure: boolean;
  memberCount?: number;
  isMember?: boolean;
  slug?: string;
}

const FicheHeader = ({
  association,
  canConfigure,
  memberCount,
  isMember = true,
  slug,
}: FicheHeaderProps) => {
  const initials = association.name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative"
    >
      {/* Banner */}
      {association.banner_url ? (
        <div className="h-40 md:h-56 rounded-xl overflow-hidden mb-4">
          <img
            src={association.banner_url}
            alt={`Banniere ${association.name}`}
            className="w-full h-full object-cover"
          />
        </div>
      ) : (
        <div className="h-32 md:h-44 rounded-xl bg-gradient-to-br from-sakura/20 via-accent/10 to-turquoise/20 mb-4" />
      )}

      {/* Association Info */}
      <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 -mt-12 sm:-mt-16 px-4">
        <Avatar className="w-24 h-24 sm:w-28 sm:h-28 border-4 border-background shadow-xl">
          <AvatarImage src={association.logo_url || undefined} alt={association.name} />
          <AvatarFallback className="bg-sakura/20 text-sakura text-2xl font-display">
            {initials}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 text-center sm:text-left pb-1">
          <h1 className="text-2xl md:text-3xl font-display text-foreground">
            {association.name}
          </h1>

          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-1">
            {association.city && (
              <span className="text-sm text-muted-foreground flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" />
                {association.city}
                {(association as any).region ? `, ${(association as any).region}` : ""}
              </span>
            )}
            {memberCount !== undefined && (
              <Badge variant="outline" className="text-xs">
                {memberCount} membre{memberCount > 1 ? "s" : ""}
              </Badge>
            )}
            {association.website_url && (
              <a
                href={association.website_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-turquoise hover:underline flex items-center gap-1"
              >
                <Globe className="w-3.5 h-3.5" />
                Site web
              </a>
            )}
          </div>

          {association.description && (
            <p className="text-sm text-muted-foreground mt-2 max-w-2xl">
              {(association as any).short_description || association.description}
            </p>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {!isMember && slug && (
            <Link to={`/asso/${slug}/adhesion`}>
              <Button size="sm" className="gap-2 bg-sakura hover:bg-sakura/90">
                <UserPlus className="w-4 h-4" />
                Rejoindre l'association
              </Button>
            </Link>
          )}
          {canConfigure && (
            <Link to="/association/parametres">
              <Button variant="outline" size="sm" className="gap-2">
                <Settings className="w-4 h-4" />
                Configurer la fiche
              </Button>
            </Link>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default FicheHeader;
