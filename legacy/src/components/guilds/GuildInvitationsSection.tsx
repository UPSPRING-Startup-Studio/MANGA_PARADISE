import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Mail, Check, X, Loader2, Shield } from "lucide-react";
import { 
  useMyPendingInvitations, 
  useAcceptInvitation, 
  useRejectInvitation 
} from "@/hooks/useGuildInvitations";
import { useNavigate } from "react-router-dom";

export function GuildInvitationsSection() {
  const navigate = useNavigate();
  const { data: invitations = [], isLoading } = useMyPendingInvitations();
  const acceptInvitation = useAcceptInvitation();
  const rejectInvitation = useRejectInvitation();

  if (isLoading) return null;
  if (invitations.length === 0) return null;

  return (
    <Card className="p-6 mb-8 bg-gradient-to-r from-sakura/10 to-purple-500/10 border-sakura/30">
      <div className="flex items-center gap-2 mb-4">
        <Mail className="w-5 h-5 text-sakura" />
        <h2 className="text-lg font-semibold">Invitations Reçues</h2>
        <Badge variant="secondary" className="bg-sakura/20 text-sakura">
          {invitations.length}
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {invitations.map((invitation) => (
          <Card
            key={invitation.id}
            className="p-4 bg-card/80 border-border/50 hover:border-sakura/50 transition-colors"
          >
            {/* Guild Banner Preview */}
            <div 
              className="relative h-20 rounded-lg overflow-hidden mb-3 cursor-pointer"
              onClick={() => navigate(`/guilds/${invitation.guild_id}`)}
            >
              {invitation.guild?.banner_url ? (
                <img
                  src={invitation.guild.banner_url}
                  alt={invitation.guild?.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-sakura/30 to-purple-500/30 flex items-center justify-center">
                  <Shield className="w-8 h-8 text-muted-foreground/50" />
                </div>
              )}
              {invitation.guild?.category && (
                <Badge className="absolute top-2 right-2 bg-background/80 backdrop-blur-sm text-xs">
                  {invitation.guild.category.icon}
                </Badge>
              )}
            </div>

            {/* Guild Name */}
            <h3 
              className="font-semibold mb-2 hover:text-sakura transition-colors cursor-pointer"
              onClick={() => navigate(`/guilds/${invitation.guild_id}`)}
            >
              {invitation.guild?.name || "Guilde inconnue"}
            </h3>

            {/* Inviter Info */}
            <div className="flex items-center gap-2 mb-4 text-sm text-muted-foreground">
              <Avatar className="w-5 h-5">
                <AvatarImage src={invitation.inviter?.avatar_url || undefined} />
                <AvatarFallback className="text-xs bg-sakura/20 text-sakura">
                  {invitation.inviter?.display_name?.[0] || "?"}
                </AvatarFallback>
              </Avatar>
              <span>
                Invité par {invitation.inviter?.display_name || invitation.inviter?.username || "Inconnu"}
              </span>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => acceptInvitation.mutate({ 
                  invitationId: invitation.id, 
                  guildId: invitation.guild_id 
                })}
                disabled={acceptInvitation.isPending}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                {acceptInvitation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-1" />
                    Accepter
                  </>
                )}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => rejectInvitation.mutate(invitation.id)}
                disabled={rejectInvitation.isPending}
                className="flex-1 border-red-500/30 text-red-500 hover:bg-red-500/10"
              >
                {rejectInvitation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <X className="w-4 h-4 mr-1" />
                    Refuser
                  </>
                )}
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </Card>
  );
}
