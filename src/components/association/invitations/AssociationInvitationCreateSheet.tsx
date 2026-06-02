import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Search, UserPlus } from "lucide-react";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useSearchUsersForAssociationInvite } from "@/hooks/useAssociationInvitations";
import {
  ASSOCIATION_ROLE_LABELS,
  type AssociationRole,
} from "@/hooks/useAssociation";

const INVITABLE_ROLES: AssociationRole[] = [
  "membre",
  "benevole",
  "responsable",
  "tresorier",
  "secretaire",
  "vice_president",
  "president",
];

const invitationSchema = z.object({
  userId: z.string().uuid("Sélectionne un utilisateur"),
  role: z.enum(
    ["president", "vice_president", "secretaire", "tresorier", "responsable", "benevole", "membre"],
    { required_error: "Sélectionne un rôle" }
  ),
  message: z
    .string()
    .max(500, "Le message ne peut pas dépasser 500 caractères")
    .optional(),
});

type InvitationForm = z.infer<typeof invitationSchema>;

interface SelectedUser {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  associationId: string;
  onSubmit: (data: { userId: string; role: AssociationRole; message?: string }) => void;
  isSubmitting: boolean;
}

const AssociationInvitationCreateSheet = ({
  open,
  onOpenChange,
  associationId,
  onSubmit,
  isSubmitting,
}: Props) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<SelectedUser | null>(null);

  const { data: searchResults, isLoading: isSearching } =
    useSearchUsersForAssociationInvite(associationId, searchQuery);

  const form = useForm<InvitationForm>({
    resolver: zodResolver(invitationSchema),
    defaultValues: { userId: "", role: "membre", message: "" },
  });

  const handleSelectUser = (user: SelectedUser) => {
    setSelectedUser(user);
    form.setValue("userId", user.id, { shouldValidate: true });
    setSearchQuery("");
  };

  const handleClearUser = () => {
    setSelectedUser(null);
    form.setValue("userId", "", { shouldValidate: true });
  };

  const handleSubmit = (data: InvitationForm) => {
    onSubmit({
      userId: data.userId,
      role: data.role,
      message: data.message || undefined,
    });
  };

  const handleClose = (nextOpen: boolean) => {
    if (!nextOpen) {
      form.reset();
      setSelectedUser(null);
      setSearchQuery("");
    }
    onOpenChange(nextOpen);
  };

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent className="sm:max-w-md bg-[#0D0D0D] border-border/50">
        <SheetHeader>
          <SheetTitle className="text-foreground">Nouvelle invitation</SheetTitle>
          <SheetDescription className="sr-only">
            Inviter un utilisateur à rejoindre l'association
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
              {/* User search / selection */}
              <FormField
                control={form.control}
                name="userId"
                render={() => (
                  <FormItem>
                    <FormLabel className="text-foreground">Membre à inviter</FormLabel>
                    {selectedUser ? (
                      <div className="flex items-center gap-3 rounded-lg border border-border/40 bg-[#111827]/50 p-3">
                        <Avatar className="h-9 w-9 border-2 border-border/60">
                          <AvatarImage
                            src={selectedUser.avatar_url || undefined}
                            alt={selectedUser.display_name || ""}
                          />
                          <AvatarFallback className="bg-[#E84A2B]/10 text-[#E84A2B] text-xs font-semibold">
                            {(selectedUser.display_name || selectedUser.username || "?")
                              .charAt(0)
                              .toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground text-sm truncate">
                            {selectedUser.display_name || selectedUser.username}
                          </p>
                          {selectedUser.username && selectedUser.display_name && (
                            <p className="text-xs text-muted-foreground truncate">
                              @{selectedUser.username}
                            </p>
                          )}
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={handleClearUser}
                          className="text-xs text-muted-foreground"
                        >
                          Changer
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <FormControl>
                            <Input
                              placeholder="Rechercher par pseudo..."
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                              className="pl-9 bg-[#111827]/60 border-border/50"
                            />
                          </FormControl>
                        </div>
                        {/* Results */}
                        {searchQuery.length >= 2 && (
                          <ScrollArea className="max-h-48 rounded-lg border border-border/30 bg-[#111827]/40">
                            {isSearching ? (
                              <div className="flex items-center justify-center py-6">
                                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                              </div>
                            ) : searchResults && searchResults.length > 0 ? (
                              <div className="p-1">
                                {searchResults.map((user) => (
                                  <button
                                    key={user.id}
                                    type="button"
                                    onClick={() => handleSelectUser(user)}
                                    className="flex items-center gap-3 w-full rounded-md p-2 text-left hover:bg-white/5 transition-colors"
                                  >
                                    <Avatar className="h-8 w-8 border border-border/40">
                                      <AvatarImage
                                        src={user.avatar_url || undefined}
                                      />
                                      <AvatarFallback className="bg-[#E84A2B]/10 text-[#E84A2B] text-xs">
                                        {(user.display_name || user.username || "?")
                                          .charAt(0)
                                          .toUpperCase()}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-medium text-foreground truncate">
                                        {user.display_name || user.username}
                                      </p>
                                      {user.username && (
                                        <p className="text-xs text-muted-foreground truncate">
                                          @{user.username}
                                        </p>
                                      )}
                                    </div>
                                  </button>
                                ))}
                              </div>
                            ) : (
                              <p className="text-center text-sm text-muted-foreground py-6">
                                Aucun utilisateur trouvé
                              </p>
                            )}
                          </ScrollArea>
                        )}
                      </div>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Role select */}
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground">Rôle</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-[#111827]/60 border-border/50">
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
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Message */}
              <FormField
                control={form.control}
                name="message"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground">
                      Message personnalisé{" "}
                      <span className="text-muted-foreground font-normal">(optionnel)</span>
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Un petit mot pour le futur membre..."
                        className="bg-[#111827]/60 border-border/50 resize-none"
                        rows={3}
                        maxLength={500}
                      />
                    </FormControl>
                    <div className="flex justify-end">
                      <span className="text-[11px] text-muted-foreground/50">
                        {(field.value || "").length}/500
                      </span>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => handleClose(false)}
                  disabled={isSubmitting}
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-[#E84A2B] hover:bg-[#E84A2B]/90"
                  disabled={isSubmitting || !selectedUser}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Envoi...
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-4 w-4 mr-2" />
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

export default AssociationInvitationCreateSheet;
