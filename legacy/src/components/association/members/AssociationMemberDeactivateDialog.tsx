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
import AssociationMemberRoleBadge from "./AssociationMemberRoleBadge";
import type { AssociationMembership } from "@/hooks/useAssociation";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member: AssociationMembership | null;
  onConfirm: (membershipId: string) => void;
  isSubmitting: boolean;
}

const AssociationMemberDeactivateDialog = ({
  open,
  onOpenChange,
  member,
  onConfirm,
  isSubmitting,
}: Props) => {
  if (!member) return null;

  const displayName =
    member.profile?.display_name || member.profile?.username || "Membre";

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="bg-[#0D0D0D] border-border/50">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-foreground">
            Retirer ce membre de l'association ?
          </AlertDialogTitle>
          <AlertDialogDescription className="text-muted-foreground">
            Cette action va désactiver l'accès de ce membre au back-office de
            l'association. Il pourra être réinvité ultérieurement.
          </AlertDialogDescription>
        </AlertDialogHeader>

        {/* Member recap */}
        <div className="flex items-center gap-3 rounded-lg border border-destructive/20 bg-destructive/5 p-3 my-2">
          <Avatar className="h-10 w-10 border-2 border-border/60">
            <AvatarImage src={member.profile?.avatar_url || undefined} alt={displayName} />
            <AvatarFallback className="bg-[#E84A2B]/10 text-[#E84A2B] text-sm font-semibold">
              {displayName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-foreground truncate">{displayName}</p>
            <AssociationMemberRoleBadge role={member.role} className="mt-1 text-[10px]" />
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isSubmitting} className="border-border/50">
            Annuler
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              onConfirm(member.id);
            }}
            disabled={isSubmitting}
            className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Retrait en cours...
              </>
            ) : (
              "Retirer de l'association"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default AssociationMemberDeactivateDialog;
