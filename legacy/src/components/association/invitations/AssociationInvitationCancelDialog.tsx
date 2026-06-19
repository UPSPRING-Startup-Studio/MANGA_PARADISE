import { Loader2 } from "lucide-react";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import AssociationInvitationStatusBadge from "./AssociationInvitationStatusBadge";
import type { AssociationInvitation } from "@/hooks/useAssociationInvitations";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invitation: AssociationInvitation | null;
  onConfirm: (invitationId: string, associationId: string) => void;
  isSubmitting: boolean;
}

const AssociationInvitationCancelDialog = ({
  open,
  onOpenChange,
  invitation,
  onConfirm,
  isSubmitting,
}: Props) => {
  if (!invitation) return null;

  const inviteeName =
    invitation.invitee?.display_name ||
    invitation.invitee?.username ||
    "Utilisateur";

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="bg-[#0D0D0D] border-border/50">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-foreground">
            Annuler cette invitation ?
          </AlertDialogTitle>
          <AlertDialogDescription className="text-muted-foreground">
            La personne ne pourra plus utiliser cette invitation pour rejoindre
            l'association.
          </AlertDialogDescription>
        </AlertDialogHeader>

        {/* Recap */}
        <div className="flex items-center gap-3 rounded-lg border border-destructive/20 bg-destructive/5 p-3 my-2">
          <Avatar className="h-10 w-10 border-2 border-border/60">
            <AvatarImage
              src={invitation.invitee?.avatar_url || undefined}
              alt={inviteeName}
            />
            <AvatarFallback className="bg-[#E84A2B]/10 text-[#E84A2B] text-sm font-semibold">
              {inviteeName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-foreground truncate">{inviteeName}</p>
            <AssociationInvitationStatusBadge
              status={invitation.status}
              className="mt-1 text-[10px]"
            />
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isSubmitting} className="border-border/50">
            Non, garder
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              onConfirm(invitation.id, invitation.association_id);
            }}
            disabled={isSubmitting}
            className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Annulation...
              </>
            ) : (
              "Oui, annuler l'invitation"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default AssociationInvitationCancelDialog;
