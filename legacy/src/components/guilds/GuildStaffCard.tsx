import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Crown, Shield } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { GuildMember } from "@/hooks/useGuildDetails";

interface GuildStaffCardProps {
  members: GuildMember[];
}

export function GuildStaffCard({ members }: GuildStaffCardProps) {
  const navigate = useNavigate();
  
  const master = members.find(m => m.role === "master");
  const officers = members.filter(m => m.role === "officer");

  return (
    <Card className="bg-card/80 backdrop-blur-sm border-border/50 sticky top-24">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Crown className="w-4 h-4 text-amber-400" />
          État-Major
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Guild Master */}
        {master && (
          <div 
            className="flex items-center gap-3 p-2 rounded-lg hover:bg-sakura/10 transition-colors cursor-pointer"
            onClick={() => master.profile?.username && navigate(`/u/${master.profile.username}`)}
          >
            <div className="relative">
              <Avatar className="w-12 h-12 ring-2 ring-amber-400/50">
                <AvatarImage src={master.profile?.avatar_url || undefined} />
                <AvatarFallback className="bg-amber-500/20 text-amber-400">
                  {master.profile?.display_name?.[0] || master.profile?.username?.[0] || "?"}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-1 -right-1 bg-amber-500 rounded-full p-1">
                <Crown className="w-3 h-3 text-white" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm truncate">
                {master.profile?.display_name || master.profile?.username || "Anonyme"}
              </p>
              <p className="text-xs text-amber-400">Maître de Guilde</p>
            </div>
          </div>
        )}

        {/* Officers */}
        {officers.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground uppercase tracking-wider px-2">
              Officiers
            </p>
            {officers.map((officer) => (
              <div 
                key={officer.id}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-sakura/10 transition-colors cursor-pointer"
                onClick={() => officer.profile?.username && navigate(`/u/${officer.profile.username}`)}
              >
                <div className="relative">
                  <Avatar className="w-10 h-10 ring-2 ring-blue-400/30">
                    <AvatarImage src={officer.profile?.avatar_url || undefined} />
                    <AvatarFallback className="bg-blue-500/20 text-blue-400">
                      {officer.profile?.display_name?.[0] || officer.profile?.username?.[0] || "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute -bottom-1 -right-1 bg-blue-500 rounded-full p-0.5">
                    <Shield className="w-2.5 h-2.5 text-white" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">
                    {officer.profile?.display_name || officer.profile?.username || "Anonyme"}
                  </p>
                  <p className="text-xs text-blue-400">Officier</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {officers.length === 0 && !master && (
          <p className="text-sm text-muted-foreground text-center py-4">
            Aucun état-major défini
          </p>
        )}
      </CardContent>
    </Card>
  );
}
