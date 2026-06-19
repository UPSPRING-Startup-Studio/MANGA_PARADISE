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

export type MemberActionType = "suspend" | "reactivate" | "remove";

const ACTION_CONFIG: Record<
  MemberActionType,
  { title: string; description: string; confirmLabel: string; destructive: boolean }
> = {
  suspend: {
    title: "Suspendre ce membre ?",
    description:
      "Le membre perdra temporairement l'accès au back-office de l'association. Tu pourras le réactiver plus tard.",
    confirmLabel: "Suspendre",
    destructive: true,
  },
  reactivate: {
    title: "Réactiver ce membre ?",
    description:
      "Le membre retrouvera son accès au back-office de l'association avec son rôle précédent.",
    confirmLabel: "Réactiver",
    destructive: false,
  },
  remove: {
    title: "Retirer ce membre de l'association ?",
    description:
      "Cette action va désactiver l'accès de ce membre au back-office de l'association. Il pourra être réinvité ultérieurement.",
    confirmLabel: "Retirer de l'association",
    destructive: true,
  },
};

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member: AssociationMembership | null;
  action: MemberActionType;
  onConfirm: (membershipId: string) => void;
  isSubmitting: boolean;
}

const AssociationMemberActionDialog = ({
  open,
  onOpenChange,
  member,
  action,
  onConfirm,
  isSubmitting,
}: Props) => {
  if (!member) return null;

  const config = ACTION_CONFIG[action];
  const displayName =
    member.profile?.display_name || member.profile?.username || "Membre";

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="bg-[#0D0D0D] border-mp-border">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-slate-50">
            {config.title}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-mp-ink-muted">
            {config.description}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div
          className={`flex items-center gap-3 rounded-lg border p-3 my-2 ${
            config.destructive
              ? "border-destructive/20 bg-destructive/5"
              : "border-emerald-500/20 bg-emerald-500/5"
          }`}
        >
          <Avatar className="h-10 w-10 border-2 border-mp-border">
            <AvatarImage src={member.profile?.avatar_url || undefined} alt={displayName} />
            <AvatarFallback className="bg-[#E84A2B]/10 text-[#E84A2B] text-sm font-semibold">
              {displayName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-slate-50 truncate">{displayName}</p>
            <AssociationMemberRoleBadge role={member.role} className="mt-1 text-[10px]" />
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isSubmitting} className="border-slate-600 text-slate-200">
            Annuler
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              onConfirm(member.id);
            }}
            disabled={isSubmitting}
            className={
              config.destructive
                ? "bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                : "bg-emerald-600 hover:bg-emerald-700 text-white"
            }
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : null}
            {config.confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default AssociationMemberActionDialog;
