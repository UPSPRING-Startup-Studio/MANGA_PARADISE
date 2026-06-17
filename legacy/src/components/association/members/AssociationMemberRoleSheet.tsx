import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import AssociationMemberRoleBadge from "./AssociationMemberRoleBadge";
import {
  ASSOCIATION_ROLE_LABELS,
  type AssociationRole,
  type AssociationMembership,
} from "@/hooks/useAssociation";

const ROLE_DESCRIPTIONS: Record<AssociationRole, string> = {
  president: "Direction générale, représentation légale de l'association",
  vice_president: "Seconde le président, le remplace en cas d'absence",
  secretaire: "Gestion administrative, comptes-rendus, convocations",
  tresorier: "Gestion financière, budget, comptabilité",
  responsable: "Responsable d'un pôle ou d'une activité spécifique",
  benevole: "Participe activement aux activités de l'association",
  membre: "Membre de l'association, accès standard",
};

const ALL_ROLES: AssociationRole[] = [
  "president",
  "vice_president",
  "secretaire",
  "tresorier",
  "responsable",
  "benevole",
  "membre",
];

const roleChangeSchema = z.object({
  role: z.enum([
    "president",
    "vice_president",
    "secretaire",
    "tresorier",
    "responsable",
    "benevole",
    "membre",
  ], { required_error: "Sélectionne un rôle" }),
});

type RoleChangeForm = z.infer<typeof roleChangeSchema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member: AssociationMembership | null;
  onSubmit: (membershipId: string, newRole: AssociationRole) => void;
  isSubmitting: boolean;
}

const AssociationMemberRoleSheet = ({
  open,
  onOpenChange,
  member,
  onSubmit,
  isSubmitting,
}: Props) => {
  const form = useForm<RoleChangeForm>({
    resolver: zodResolver(roleChangeSchema),
    defaultValues: { role: member?.role ?? "membre" },
  });

  useEffect(() => {
    if (member && open) {
      form.reset({ role: member.role });
    }
  }, [member, open, form]);

  const handleSubmit = (data: RoleChangeForm) => {
    if (!member) return;
    onSubmit(member.id, data.role);
  };

  const displayName =
    member?.profile?.display_name || member?.profile?.username || "Membre";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md bg-[#0D0D0D] border-border/50">
        <SheetHeader>
          <SheetTitle className="text-foreground">Modifier le rôle</SheetTitle>
          <SheetDescription className="sr-only">
            Changer le rôle associatif d'un membre
          </SheetDescription>
        </SheetHeader>

        {member && (
          <div className="mt-6 space-y-6">
            {/* Member recap */}
            <div className="flex items-center gap-3 rounded-lg border border-border/40 bg-[#111827]/50 p-3">
              <Avatar className="h-10 w-10 border-2 border-border/60">
                <AvatarImage src={member.profile?.avatar_url || undefined} alt={displayName} />
                <AvatarFallback className="bg-[#E84A2B]/10 text-[#E84A2B] text-sm font-semibold">
                  {displayName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground truncate">{displayName}</p>
                <div className="mt-1">
                  <AssociationMemberRoleBadge role={member.role} className="text-[10px]" />
                </div>
              </div>
            </div>

            {/* Form */}
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-foreground">Nouveau rôle</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-[#111827]/60 border-border/50">
                            <SelectValue placeholder="Sélectionne un rôle" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {ALL_ROLES.map((r) => (
                            <SelectItem key={r} value={r}>
                              <span className="font-medium">{ASSOCIATION_ROLE_LABELS[r]}</span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Role description */}
                <div className="rounded-lg border border-border/30 bg-[#111827]/30 p-3">
                  <p className="text-xs font-medium text-muted-foreground mb-2">
                    Description du rôle
                  </p>
                  <p className="text-sm text-foreground/80">
                    {ROLE_DESCRIPTIONS[form.watch("role")]}
                  </p>
                </div>

                {/* All roles help */}
                <details className="group">
                  <summary className="text-xs text-muted-foreground/70 cursor-pointer hover:text-muted-foreground transition-colors">
                    Voir tous les rôles
                  </summary>
                  <div className="mt-2 space-y-1.5 pl-2">
                    {ALL_ROLES.map((r) => (
                      <div key={r} className="flex items-start gap-2">
                        <AssociationMemberRoleBadge role={r} className="text-[10px] mt-0.5 shrink-0" />
                        <span className="text-[11px] text-muted-foreground/70">
                          {ROLE_DESCRIPTIONS[r]}
                        </span>
                      </div>
                    ))}
                  </div>
                </details>

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => onOpenChange(false)}
                    disabled={isSubmitting}
                  >
                    Annuler
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 bg-[#E84A2B] hover:bg-[#E84A2B]/90"
                    disabled={isSubmitting || form.watch("role") === member.role}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Enregistrement...
                      </>
                    ) : (
                      "Enregistrer"
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default AssociationMemberRoleSheet;
