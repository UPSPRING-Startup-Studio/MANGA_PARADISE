import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { 
  Users, 
  Crown, 
  Shield, 
  User,
  UserMinus,
  ArrowUp,
  ArrowDown
} from "lucide-react";
import { GuildMember, useKickMember, usePromoteMember } from "@/hooks/useGuildDetails";
import { ScrollArea } from "@/components/ui/scroll-area";

interface GuildMembersModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  guildId: string;
  members: GuildMember[];
  isGuildMaster: boolean;
}

export function GuildMembersModal({ 
  open, 
  onOpenChange,
  guildId,
  members,
  isGuildMaster
}: GuildMembersModalProps) {
  const kickMember = useKickMember();
  const promoteMember = usePromoteMember();

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "master":
        return <Crown className="w-4 h-4 text-amber-400" />;
      case "officer":
        return <Shield className="w-4 h-4 text-blue-400" />;
      default:
        return <User className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "master":
        return "Maître";
      case "officer":
        return "Officier";
      default:
        return "Membre";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-400" />
            Gérer les membres
          </DialogTitle>
        </DialogHeader>

        <div className="text-sm text-muted-foreground mb-4">
          {members.length} membre{members.length > 1 ? "s" : ""} dans la guilde
        </div>

        <ScrollArea className="max-h-96">
          <div className="space-y-2 pr-4">
            {members.map((member) => (
              <Card key={member.id} className="p-3 bg-card/50 border-border/50">
                <div className="flex items-center gap-3">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={member.profile?.avatar_url || undefined} />
                    <AvatarFallback className="bg-sakura/20 text-sakura">
                      {member.profile?.display_name?.[0] || "?"}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">
                      {member.profile?.display_name || member.profile?.username}
                    </p>
                    <div className="flex items-center gap-1">
                      {getRoleIcon(member.role)}
                      <span className="text-xs text-muted-foreground">
                        {getRoleLabel(member.role)}
                      </span>
                    </div>
                  </div>

                  {/* Actions (only for non-masters, and only masters can manage) */}
                  {isGuildMaster && member.role !== "master" && (
                    <div className="flex gap-1">
                      {/* Promote/Demote */}
                      {member.role === "member" ? (
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-blue-400 hover:bg-blue-400/10"
                          onClick={() => promoteMember.mutate({ memberId: member.id, newRole: "officer" })}
                          disabled={promoteMember.isPending}
                          title="Promouvoir Officier"
                        >
                          <ArrowUp className="w-4 h-4" />
                        </Button>
                      ) : (
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-muted-foreground hover:bg-muted/20"
                          onClick={() => promoteMember.mutate({ memberId: member.id, newRole: "member" })}
                          disabled={promoteMember.isPending}
                          title="Rétrograder Membre"
                        >
                          <ArrowDown className="w-4 h-4" />
                        </Button>
                      )}

                      {/* Kick */}
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-red-400 hover:bg-red-400/10"
                            title="Exclure"
                          >
                            <UserMinus className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Exclure ce membre ?</AlertDialogTitle>
                            <AlertDialogDescription>
                              {member.profile?.display_name || member.profile?.username} sera exclu de la guilde. 
                              Cette action est irréversible.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Annuler</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => kickMember.mutate({ guildId, memberId: member.id })}
                              className="bg-red-500 hover:bg-red-600"
                            >
                              Exclure
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  )}

                  {member.role === "master" && (
                    <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">
                      <Crown className="w-3 h-3 mr-1" />
                      Maître
                    </Badge>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
