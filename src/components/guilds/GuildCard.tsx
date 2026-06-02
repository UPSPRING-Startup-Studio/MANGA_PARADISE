import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Users, Eye, Lock } from "lucide-react";
import { Guild } from "@/hooks/useGuilds";
import { useNavigate } from "react-router-dom";

interface GuildCardProps {
  guild: Guild;
}

export function GuildCard({ guild }: GuildCardProps) {
  const navigate = useNavigate();

  return (
    <Card className="group overflow-hidden bg-card/50 border-border/50 hover:border-sakura/40 transition-all duration-300">
      {/* Banner */}
      <div className="relative h-32 overflow-hidden">
        {guild.banner_url ? (
          <img
            src={guild.banner_url}
            alt={guild.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-sakura/20 to-purple-500/20" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background/90 to-transparent" />
        
        {/* Access type badge */}
        <div className="absolute top-2 right-2">
          {guild.access_type === "private" ? (
            <Badge variant="secondary" className="bg-amber-500/20 text-amber-400 border-amber-500/30">
              <Lock className="w-3 h-3 mr-1" />
              Candidature
            </Badge>
          ) : (
            <Badge variant="secondary" className="bg-green-500/20 text-green-400 border-green-500/30">
              <Eye className="w-3 h-3 mr-1" />
              Public
            </Badge>
          )}
        </div>
      </div>

      <CardContent className="p-4 space-y-3">
        {/* Category Badge */}
        {guild.category && (
          <Badge variant="outline" className="border-sakura/30 text-sakura">
            {guild.category.icon} {guild.category.name}
          </Badge>
        )}

        {/* Guild Name */}
        <h3 className="font-bold text-lg text-foreground line-clamp-1">
          {guild.name}
        </h3>

        {/* Description */}
        {guild.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {guild.description}
          </p>
        )}

        {/* Stats */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Users className="w-4 h-4" />
            <span>{guild.member_count || 0} membre{(guild.member_count || 0) > 1 ? "s" : ""}</span>
          </div>
          {guild.city && (
            <div className="flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              <span>{guild.city}</span>
            </div>
          )}
        </div>

        {/* Action Button */}
        <Button 
          variant="outline" 
          className="w-full mt-2 border-sakura/30 hover:bg-sakura/10 hover:text-sakura"
          onClick={() => navigate(`/guilds/${guild.id}`)}
        >
          Voir la guilde
        </Button>
      </CardContent>
    </Card>
  );
}
