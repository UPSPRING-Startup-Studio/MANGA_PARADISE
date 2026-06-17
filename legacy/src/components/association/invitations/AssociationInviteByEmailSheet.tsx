import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Mail } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  ASSOCIATION_ROLE_LABELS,
  type AssociationRole,
} from "@/hooks/useAssociation";

const INPUT_CLASS =
  "bg-white border-slate-600 text-slate-50 placeholder:text-mp-ink-muted focus-visible:border-[#E84A2B] focus-visible:ring-1 focus-visible:ring-[#E84A2B]/40";

const INVITABLE_ROLES: AssociationRole[] = [
  "membre",
  "benevole",
  "responsable",
  "tresorier",
  "secretaire",
  "vice_president",
  "president",
];

const inviteSchema = z.object({
  email: z.string().email("Adresse email invalide").min(1, "Email requis"),
  prenom: z.string().optional(),
  nom: z.string().optional(),
  role: z.enum(
    ["president", "vice_president", "secretaire", "tresorier", "responsable", "benevole", "membre"],
    { required_error: "Sélectionne un rôle" }
  ),
  message: z
    .string()
    .max(500, "Le message ne peut pas dépasser 500 caractères")
    .optional(),
});

type InviteForm = z.infer<typeof inviteSchema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: {
    email: string;
    role: AssociationRole;
    prenom?: string;
    nom?: string;
    message?: string;
  }) => void;
  isSubmitting: boolean;
}

const AssociationInviteByEmailSheet = ({
  open,
  onOpenChange,
  onSubmit,
  isSubmitting,
}: Props) => {
  const form = useForm<InviteForm>({
    resolver: zodResolver(inviteSchema),
    defaultValues: {
      email: "",
      prenom: "",
      nom: "",
      role: "membre",
      message: "",
    },
  });

  const handleSubmit = (data: InviteForm) => {
    onSubmit({
      email: data.email,
      role: data.role,
      prenom: data.prenom || undefined,
      nom: data.nom || undefined,
      message: data.message || undefined,
    });
  };

  const handleClose = (nextOpen: boolean) => {
    if (!nextOpen) form.reset();
    onOpenChange(nextOpen);
  };

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent className="sm:max-w-md bg-mp-paper border-mp-border overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-slate-50">Inviter par email</SheetTitle>
          <SheetDescription className="text-mp-ink-muted">
            Envoie une invitation à rejoindre l'association. Si la personne n'a
            pas encore de compte, elle pourra en créer un.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-5">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              {/* Email */}
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-200">Email *</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="email"
                        placeholder="prenom@exemple.fr"
                        className={INPUT_CLASS}
                      />
                    </FormControl>
                    <FormMessage className="text-[#F5A623]" />
                  </FormItem>
                )}
              />

              {/* Prénom + Nom */}
              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="prenom"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-200">Prénom</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Yuki" className={INPUT_CLASS} />
                      </FormControl>
                      <FormMessage className="text-[#F5A623]" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="nom"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-200">Nom</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Tanaka" className={INPUT_CLASS} />
                      </FormControl>
                      <FormMessage className="text-[#F5A623]" />
                    </FormItem>
                  )}
                />
              </div>

              {/* Rôle */}
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-200">Rôle dans l'association *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className={INPUT_CLASS}>
                          <SelectValue placeholder="Sélectionne un rôle" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {INVITABLE_ROLES.map((r) => (
                          <SelectItem key={r} value={r}>
                            {ASSOCIATION_ROLE_LABELS[r]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage className="text-[#F5A623]" />
                  </FormItem>
                )}
              />

              {/* Message */}
              <FormField
                control={form.control}
                name="message"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-200">
                      Note interne{" "}
                      <span className="text-mp-ink-muted font-normal">(optionnel)</span>
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Un mot pour l'équipe..."
                        className={`${INPUT_CLASS} resize-none`}
                        rows={2}
                        maxLength={500}
                      />
                    </FormControl>
                    <div className="flex justify-end">
                      <span className="text-[11px] text-mp-ink-muted">
                        {(field.value || "").length}/500
                      </span>
                    </div>
                    <FormMessage className="text-[#F5A623]" />
                  </FormItem>
                )}
              />

              {/* Info */}
              <div className="rounded-lg border border-mp-border/50 bg-white/40 p-3">
                <p className="text-xs text-mp-ink-muted leading-relaxed">
                  Si cette personne a déjà un compte Manga Paradise, l'invitation
                  sera liée à son profil. Sinon, elle pourra créer son compte en
                  suivant le lien d'invitation.
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 border-slate-500 text-slate-100 hover:bg-white"
                  onClick={() => handleClose(false)}
                  disabled={isSubmitting}
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-[#E84A2B] to-[#F26B2E] hover:from-[#D43D20] hover:to-[#E25E25] text-white"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Envoi...
                    </>
                  ) : (
                    <>
                      <Mail className="h-4 w-4 mr-2" />
                      Envoyer l'invitation
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default AssociationInviteByEmailSheet;
