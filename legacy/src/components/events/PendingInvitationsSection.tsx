import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Mail, 
  Check, 
  X, 
  Users, 
  Camera, 
  Trophy,
  Loader2,
  AlertCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { 
  usePendingInvitations, 
  useAcceptInvitation, 
  useRejectInvitation,
  PartyInvitation 
} from "@/hooks/usePartyInvitations";
import { useIsRegistered } from "@/hooks/useEventParticipants";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const MODE_CONFIG: Record<string, { icon: React.ElementType; color: string; bgColor: string; label: string }> = {
  squad: { icon: Users, color: 'text-turquoise', bgColor: 'bg-turquoise/20', label: 'SQUAD' },
  shooting: { icon: Camera, color: 'text-blue-500', bgColor: 'bg-blue-500/20', label: 'SHOOTING' },
  concours: { icon: Trophy, color: 'text-sakura', bgColor: 'bg-sakura/20', label: 'CONCOURS' },
};

interface PendingInvitationsSectionProps {
  eventId?: string;
  className?: string;
}

export default function PendingInvitationsSection({ eventId, className }: PendingInvitationsSectionProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: invitations, isLoading } = usePendingInvitations(user?.id);
  const acceptInvitation = useAcceptInvitation();
  const rejectInvitation = useRejectInvitation();
  
  const [selectedInvitation, setSelectedInvitation] = useState<PartyInvitation | null>(null);
  const [showRegistrationAlert, setShowRegistrationAlert] = useState(false);
  
  // Filter by eventId if provided
  const filteredInvitations = eventId 
    ? invitations?.filter(inv => inv.party?.event_id === eventId)
    : invitations;
  
  // Check registration for the selected invitation's event
  const { data: isRegistered } = useIsRegistered(
    selectedInvitation?.party?.event_id, 
    user?.id
  );
  
  if (isLoading || !filteredInvitations || filteredInvitations.length === 0) {
    return null;
  }
  
  const handleAccept = async (invitation: PartyInvitation) => {
    setSelectedInvitation(invitation);
    
    // We need to check if user is registered - use a direct query here
    const { data: registration } = await import("@/integrations/supabase/client").then(
      ({ supabase }) => supabase
        .from('event_participants')
        .select('id')
        .eq('event_id', invitation.party?.event_id || '')
        .eq('user_id', user?.id || '')
        .maybeSingle()
    );
    
    if (!registration) {
      // User is NOT registered - show alert
      setShowRegistrationAlert(true);
    } else {
      // User IS registered - accept directly
      await acceptInvitation.mutateAsync({
        invitationId: invitation.id,
        partyId: invitation.party_id,
        userId: user!.id,
      });
      setSelectedInvitation(null);
    }
  };
  
  const handleReject = async (invitationId: string) => {
    await rejectInvitation.mutateAsync({ invitationId });
  };
  
  const handleGoToRegistration = () => {
    if (selectedInvitation?.party?.event_id) {
      // Navigate to event page with auto_join_party_id param
      navigate(`/evenements/${selectedInvitation.party.event_id}?auto_join_party_id=${selectedInvitation.party_id}`);
    }
    setShowRegistrationAlert(false);
    setSelectedInvitation(null);
  };
  
  return (
    <>
      <Card className={cn("border-primary/20 bg-primary/5", className)}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Mail className="w-5 h-5 text-primary" />
            Invitations reçues
            <Badge variant="secondary" className="ml-auto">
              {filteredInvitations.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {filteredInvitations.map((invitation) => {
            const modeConfig = MODE_CONFIG[invitation.party?.mode || 'squad'];
            const ModeIcon = modeConfig?.icon || Users;
            
            return (
              <div
                key={invitation.id}
                className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 rounded-lg bg-background border"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <Avatar className="w-10 h-10 shrink-0">
                    <AvatarImage src={invitation.sender?.avatar_url || undefined} />
                    <AvatarFallback>
                      {(invitation.sender?.display_name || invitation.sender?.username || "?")[0]}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">
                      <span className="text-muted-foreground">Invitation de </span>
                      {invitation.sender?.display_name || invitation.sender?.username}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge className={cn(modeConfig?.bgColor, modeConfig?.color, "gap-1 text-xs")}>
                        <ModeIcon className="w-3 h-3" />
                        {modeConfig?.label}
                      </Badge>
                      <span className="text-sm font-medium truncate">
                        {invitation.party?.name}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-2 sm:shrink-0">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleReject(invitation.id)}
                    disabled={rejectInvitation.isPending}
                    className="flex-1 sm:flex-none gap-1 border-destructive/50 text-destructive hover:bg-destructive/10"
                  >
                    {rejectInvitation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <X className="w-4 h-4" />
                    )}
                    <span className="sm:hidden">Refuser</span>
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleAccept(invitation)}
                    disabled={acceptInvitation.isPending}
                    className="flex-1 sm:flex-none gap-1"
                  >
                    {acceptInvitation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Check className="w-4 h-4" />
                    )}
                    Accepter
                  </Button>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
      
      {/* Registration required alert */}
      <AlertDialog open={showRegistrationAlert} onOpenChange={setShowRegistrationAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-amber-500" />
              Inscription requise
            </AlertDialogTitle>
            <AlertDialogDescription>
              Tu dois d'abord t'inscrire à l'événement pour pouvoir rejoindre ce groupe.
              Tu seras automatiquement ajouté au groupe après ton inscription !
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedInvitation(null)}>
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleGoToRegistration}>
              🎟️ M'inscrire à l'événement
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
