import { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Building2,
  Plus,
  Users,
  Search,
  Loader2,
  MapPin,
  UserPlus,
  Pencil,
  ExternalLink,
  Shield,
  ShieldAlert,
  ShieldOff,
  Lock,
  Trash2,
  RotateCcw,
  Calendar,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
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
import {
  useAdminAssociations,
  useAdminDeletedAssociations,
  useCreateAssociation,
  useAddAssociationMember,
  useSearchUsersAdmin,
  useAdminAssociationMembers,
  useChangeAdminStatus,
  useRestoreAssociation,
} from "@/hooks/useAdminAssociations";
import {
  ASSOCIATION_ROLE_LABELS,
  type AssociationRole,
  type Association,
  type AdminStatus,
} from "@/hooks/useAssociation";
import AssociationMemberRoleBadge from "@/components/association/members/AssociationMemberRoleBadge";
import AdminAssociationEditSheet from "@/components/admin/associations/AdminAssociationEditSheet";

// ──────────────────────────────────────────────
// Shared input class for high-contrast dark theme
// ──────────────────────────────────────────────

const INPUT_CLASS =
  "bg-white border-slate-600 text-slate-50 placeholder:text-mp-ink-muted focus-visible:border-[#E84A2B] focus-visible:ring-1 focus-visible:ring-[#E84A2B]/40";

// ──────────────────────────────────────────────
// Zod schemas
// ──────────────────────────────────────────────

const createAssociationSchema = z.object({
  name: z.string().min(2, "Nom requis (2 caractères min)"),
  slug: z
    .string()
    .min(2, "Slug requis")
    .regex(/^[a-z0-9-]+$/, "Minuscules, chiffres et tirets uniquement"),
  description: z.string().optional(),
  city: z.string().optional(),
  region: z.string().optional(),
  email: z.string().email("Email invalide").optional().or(z.literal("")),
  website_url: z.string().url("URL invalide").optional().or(z.literal("")),
});

type CreateAssociationForm = z.infer<typeof createAssociationSchema>;

// ──────────────────────────────────────────────
// Component: Add Member Dialog
// ──────────────────────────────────────────────

function AddMemberDialog({
  association,
  open,
  onOpenChange,
}: {
  association: Association | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRole, setSelectedRole] = useState<AssociationRole>("president");
  const { data: searchResults, isLoading: isSearching } =
    useSearchUsersAdmin(searchQuery);
  const addMember = useAddAssociationMember();
  const { data: existingMembers } = useAdminAssociationMembers(association?.id);

  const existingUserIds = new Set(
    (existingMembers || []).map((m: any) => m.user_id)
  );

  const handleAdd = (userId: string) => {
    if (!association) return;
    addMember.mutate(
      { associationId: association.id, userId, role: selectedRole },
      { onSuccess: () => setSearchQuery("") }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-mp-paper border-mp-border">
        <DialogHeader>
          <DialogTitle className="text-slate-50">Ajouter un membre</DialogTitle>
          <DialogDescription className="text-mp-ink-muted">
            Rattacher un utilisateur existant à {association?.name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {/* Role select */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-200">Rôle</label>
            <Select
              value={selectedRole}
              onValueChange={(v) => setSelectedRole(v as AssociationRole)}
            >
              <SelectTrigger className={INPUT_CLASS}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(
                  [
                    "president",
                    "vice_president",
                    "secretaire",
                    "tresorier",
                    "responsable",
                    "benevole",
                    "membre",
                  ] as AssociationRole[]
                ).map((r) => (
                  <SelectItem key={r} value={r}>
                    {ASSOCIATION_ROLE_LABELS[r]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Search */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-200">
              Rechercher un utilisateur
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-mp-ink-muted" />
              <Input
                placeholder="Pseudo ou nom..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`pl-9 ${INPUT_CLASS}`}
              />
            </div>
          </div>

          {/* Members already in */}
          {existingMembers && existingMembers.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-xs text-mp-ink-muted">
                Membres actuels ({existingMembers.length})
              </p>
              <div className="flex flex-wrap gap-1.5">
                {existingMembers.map((m: any) => (
                  <div
                    key={m.id}
                    className="flex items-center gap-1.5 rounded-md bg-white px-2 py-1 text-xs"
                  >
                    <Avatar className="h-5 w-5">
                      <AvatarImage src={m.profile?.avatar_url || undefined} />
                      <AvatarFallback className="text-[8px] bg-[#E84A2B]/10 text-[#E84A2B]">
                        {(
                          m.profile?.display_name ||
                          m.profile?.username ||
                          "?"
                        )
                          .charAt(0)
                          .toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-slate-200">
                      {m.profile?.display_name || m.profile?.username}
                    </span>
                    <AssociationMemberRoleBadge
                      role={m.role}
                      className="text-[8px] py-0 px-1"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Search results */}
          {searchQuery.length >= 2 && (
            <ScrollArea className="max-h-52 rounded-lg border border-mp-border bg-white/60">
              {isSearching ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="h-5 w-5 animate-spin text-mp-ink-muted" />
                </div>
              ) : searchResults && searchResults.length > 0 ? (
                <div className="p-1">
                  {searchResults.map((user) => {
                    const alreadyMember = existingUserIds.has(user.id);
                    return (
                      <div
                        key={user.id}
                        className="flex items-center gap-3 rounded-md p-2.5 hover:bg-mp-cloud/50 transition-colors"
                      >
                        <Avatar className="h-9 w-9 border border-slate-600">
                          <AvatarImage src={user.avatar_url || undefined} />
                          <AvatarFallback className="bg-[#E84A2B]/10 text-[#E84A2B] text-xs">
                            {(user.display_name || user.username || "?")
                              .charAt(0)
                              .toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-100 truncate">
                            {user.display_name || user.username}
                          </p>
                          {user.username && (
                            <p className="text-xs text-mp-ink-muted truncate">
                              @{user.username}
                            </p>
                          )}
                        </div>
                        {alreadyMember ? (
                          <Badge
                            variant="outline"
                            className="text-[10px] text-mp-ink-muted border-slate-600"
                          >
                            Déjà membre
                          </Badge>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => handleAdd(user.id)}
                            disabled={addMember.isPending}
                            className="bg-[#E84A2B] hover:bg-[#F26B2E] text-white text-xs h-7"
                          >
                            {addMember.isPending ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              "Ajouter"
                            )}
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-center text-sm text-mp-ink-muted py-6">
                  Aucun utilisateur trouvé
                </p>
              )}
            </ScrollArea>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ──────────────────────────────────────────────
// Main page
// ──────────────────────────────────────────────

const AdminAssociations = () => {
  const navigate = useNavigate();
  const { data: associations, isLoading } = useAdminAssociations();
  const { data: deletedAssociations, isLoading: deletedLoading } = useAdminDeletedAssociations();
  const createAssociation = useCreateAssociation();
  const restoreAssociation = useRestoreAssociation();

  const [createSheetOpen, setCreateSheetOpen] = useState(false);
  const [addMemberTarget, setAddMemberTarget] = useState<Association | null>(
    null
  );
  const [editTarget, setEditTarget] = useState<Association | null>(null);
  const [showDeleted, setShowDeleted] = useState(false);

  const form = useForm<CreateAssociationForm>({
    resolver: zodResolver(createAssociationSchema),
    defaultValues: {
      name: "",
      slug: "",
      description: "",
      city: "",
      region: "",
      email: "",
      website_url: "",
    },
  });

  const handleCreate = (data: CreateAssociationForm) => {
    createAssociation.mutate(
      {
        name: data.name,
        slug: data.slug,
        description: data.description || undefined,
        city: data.city || undefined,
        region: data.region || undefined,
        email: data.email || undefined,
        website_url: data.website_url || undefined,
      },
      {
        onSuccess: () => {
          setCreateSheetOpen(false);
          form.reset();
        },
      }
    );
  };

  const handleNameChange = (name: string) => {
    form.setValue("name", name);
    const currentSlug = form.getValues("slug");
    const prevAutoSlug = form
      .getValues("name")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
    if (!currentSlug || currentSlug === prevAutoSlug) {
      const newSlug = name
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
      form.setValue("slug", newSlug);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-display text-slate-50 flex items-center gap-3">
            <Building2 className="h-7 w-7 text-[#E84A2B]" />
            Associations
          </h1>
          <p className="text-mp-ink-muted mt-1">
            Créer et gérer les associations de la plateforme
          </p>
        </div>
        <Button
          onClick={() => setCreateSheetOpen(true)}
          className="gap-2 bg-gradient-to-r from-[#E84A2B] to-[#F26B2E] hover:from-[#D43D20] hover:to-[#E25E25] text-white shrink-0"
        >
          <Plus className="h-4 w-4" />
          Créer une association
        </Button>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="bg-mp-paper/80 border-mp-border/50">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <Skeleton className="h-12 w-12 rounded-lg bg-white" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-48 bg-white" />
                    <Skeleton className="h-3 w-32 bg-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : associations && associations.length > 0 ? (
        <div className="space-y-3">
          {associations.map((assoc) => {
            const adminStatus = (assoc.admin_status || "active") as AdminStatus;
            const isBlocked = adminStatus === "blocked";
            const isRestricted = adminStatus === "restricted";
            const cardBorder = isBlocked
              ? "border-red-500/30"
              : isRestricted
                ? "border-amber-500/30"
                : "border-mp-border/50 hover:border-[#E84A2B]/30";

            return (
              <Card
                key={assoc.id}
                className={`bg-mp-paper/80 ${cardBorder} transition-colors`}
              >
                <CardContent className="p-5">
                  <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                    {/* Icon */}
                    <div
                      className={`flex items-center justify-center h-12 w-12 rounded-lg shrink-0 ${
                        isBlocked
                          ? "bg-red-500/10"
                          : isRestricted
                            ? "bg-amber-500/10"
                            : "bg-[#E84A2B]/10"
                      }`}
                    >
                      {isBlocked ? (
                        <ShieldOff className="h-6 w-6 text-red-400" />
                      ) : isRestricted ? (
                        <ShieldAlert className="h-6 w-6 text-amber-400" />
                      ) : (
                        <Building2 className="h-6 w-6 text-[#E84A2B]" />
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-slate-50">
                          {assoc.name}
                        </h3>
                        <Badge
                          variant="outline"
                          className="text-[10px] text-mp-ink-muted border-slate-600"
                        >
                          /{assoc.slug}
                        </Badge>
                        <Badge
                          variant="outline"
                          className={
                            assoc.status === "active"
                              ? "text-[10px] bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                              : "text-[10px] bg-slate-500/10 text-mp-ink-muted border-slate-500/30"
                          }
                        >
                          {assoc.status === "active" ? "Active" : assoc.status}
                        </Badge>
                        {adminStatus !== "active" && (
                          <Badge
                            variant="outline"
                            className={`text-[10px] ${
                              isBlocked
                                ? "bg-red-500/10 text-red-400 border-red-500/30"
                                : "bg-amber-500/10 text-amber-400 border-amber-500/30"
                            }`}
                          >
                            {isBlocked ? (
                              <><ShieldOff className="h-2.5 w-2.5 mr-1" />Bloquée</>
                            ) : (
                              <><ShieldAlert className="h-2.5 w-2.5 mr-1" />Restreinte</>
                            )}
                          </Badge>
                        )}
                      </div>
                      {assoc.admin_status_reason && adminStatus !== "active" && (
                        <p className={`text-xs mt-1 ${isBlocked ? "text-red-400/70" : "text-amber-400/70"}`}>
                          Motif : {assoc.admin_status_reason}
                        </p>
                      )}
                      {assoc.description && (
                        <p className="text-sm text-slate-300 mt-1 line-clamp-2">
                          {assoc.description}
                        </p>
                      )}
                      <div className="flex items-center gap-4 mt-2 text-xs text-mp-ink-muted">
                        {assoc.city && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" /> {assoc.city}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />{" "}
                          {assoc.member_count ?? 0} membre
                          {(assoc.member_count ?? 0) > 1 ? "s" : ""}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col sm:flex-row gap-2 shrink-0 flex-wrap">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setAddMemberTarget(assoc)}
                        className="gap-1.5 text-xs border-slate-600 text-slate-200 hover:bg-white hover:text-slate-50"
                        disabled={isBlocked || isRestricted}
                      >
                        <UserPlus className="h-3.5 w-3.5" />
                        Ajouter un membre
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditTarget(assoc)}
                        className="gap-1.5 text-xs border-slate-600 text-slate-200 hover:bg-white hover:text-slate-50"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        Editer la structure
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => navigate(`/admin/associations/${assoc.id}`)}
                        className="gap-1.5 text-xs bg-gradient-to-r from-[#E84A2B] to-[#F26B2E] hover:from-[#D43D20] hover:to-[#E25E25] text-white"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        Back-office
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Building2 className="w-16 h-16 text-mp-ink-muted mb-4" />
          <h2 className="text-xl font-display text-slate-50 mb-2">
            Aucune association
          </h2>
          <p className="text-mp-ink-muted max-w-md mb-6">
            Crée la première association pour activer le module associatif.
          </p>
          <Button
            onClick={() => setCreateSheetOpen(true)}
            className="gap-2 bg-gradient-to-r from-[#E84A2B] to-[#F26B2E] hover:from-[#D43D20] hover:to-[#E25E25] text-white"
          >
            <Plus className="h-4 w-4" />
            Créer une association
          </Button>
        </div>
      )}

      {/* ── Create Sheet ── */}
      <Sheet open={createSheetOpen} onOpenChange={setCreateSheetOpen}>
        <SheetContent className="sm:max-w-lg bg-mp-paper border-mp-border overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="text-slate-50">
              Créer une association
            </SheetTitle>
            <SheetDescription className="text-mp-ink-muted">
              Remplis les informations de la nouvelle association
            </SheetDescription>
          </SheetHeader>

          <div className="mt-6">
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(handleCreate)}
                className="space-y-5"
              >
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-200">
                        Nom de l'association *
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          onChange={(e) => handleNameChange(e.target.value)}
                          placeholder="Manga Paradise"
                          className={INPUT_CLASS}
                        />
                      </FormControl>
                      <FormMessage className="text-[#F5A623]" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="slug"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-200">
                        Identifiant (slug) *
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="manga-paradise"
                          className={INPUT_CLASS}
                        />
                      </FormControl>
                      <p className="text-[11px] text-mp-ink-muted">
                        Minuscules, chiffres et tirets uniquement
                      </p>
                      <FormMessage className="text-[#F5A623]" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-200">
                        Description
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="Présentation courte de l'association..."
                          className={`${INPUT_CLASS} resize-none`}
                          rows={3}
                        />
                      </FormControl>
                      <FormMessage className="text-[#F5A623]" />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-200">Ville</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Lyon"
                            className={INPUT_CLASS}
                          />
                        </FormControl>
                        <FormMessage className="text-[#F5A623]" />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="region"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-200">Région</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Auvergne-Rhône-Alpes"
                            className={INPUT_CLASS}
                          />
                        </FormControl>
                        <FormMessage className="text-[#F5A623]" />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-200">
                        Email de contact
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="email"
                          placeholder="contact@association.fr"
                          className={INPUT_CLASS}
                        />
                      </FormControl>
                      <FormMessage className="text-[#F5A623]" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="website_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-200">Site web</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="https://www.association.fr"
                          className={INPUT_CLASS}
                        />
                      </FormControl>
                      <FormMessage className="text-[#F5A623]" />
                    </FormItem>
                  )}
                />

                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1 border-slate-500 text-slate-100 hover:bg-white hover:text-slate-50"
                    onClick={() => setCreateSheetOpen(false)}
                    disabled={createAssociation.isPending}
                  >
                    Annuler
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-[#E84A2B] to-[#F26B2E] hover:from-[#D43D20] hover:to-[#E25E25] text-white disabled:opacity-50"
                    disabled={createAssociation.isPending}
                  >
                    {createAssociation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Création...
                      </>
                    ) : (
                      "Créer l'association"
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        </SheetContent>
      </Sheet>

      {/* ── Soft-deleted associations ── */}
      {deletedAssociations && deletedAssociations.length > 0 && (
        <div className="mt-8">
          <button
            onClick={() => setShowDeleted(!showDeleted)}
            className="flex items-center gap-2 text-sm text-mp-ink-muted hover:text-slate-200 transition-colors mb-3"
          >
            <Trash2 className="h-4 w-4" />
            Associations supprimées ({deletedAssociations.length})
            <span className="text-xs">{showDeleted ? "▾" : "▸"}</span>
          </button>

          {showDeleted && (
            <div className="space-y-2">
              {deletedAssociations.map((assoc) => (
                <Card
                  key={assoc.id}
                  className="bg-mp-paper/50 border-red-500/20 opacity-75"
                >
                  <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                      <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-red-500/10 shrink-0">
                        <Trash2 className="h-5 w-5 text-red-400" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-medium text-slate-300 line-through">
                            {assoc.name}
                          </h4>
                          <Badge
                            variant="outline"
                            className="text-[10px] text-red-400 border-red-500/30 bg-red-500/10"
                          >
                            Supprimée
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-xs text-mp-ink-muted">
                          <span>/{assoc.slug}</span>
                          {assoc.deleted_at && (
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(assoc.deleted_at).toLocaleDateString("fr-FR", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })}
                            </span>
                          )}
                        </div>
                        {assoc.deletion_reason && (
                          <p className="text-xs text-mp-ink-muted mt-1">
                            Motif : {assoc.deletion_reason}
                          </p>
                        )}
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => restoreAssociation.mutate(assoc.id)}
                        disabled={restoreAssociation.isPending}
                        className="gap-1.5 text-xs border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300 shrink-0"
                      >
                        {restoreAssociation.isPending ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <RotateCcw className="h-3.5 w-3.5" />
                        )}
                        Restaurer
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Add Member Dialog */}
      <AddMemberDialog
        association={addMemberTarget}
        open={!!addMemberTarget}
        onOpenChange={(v) => !v && setAddMemberTarget(null)}
      />

      {/* Edit Structure Sheet */}
      <AdminAssociationEditSheet
        association={editTarget}
        open={!!editTarget}
        onOpenChange={(v) => !v && setEditTarget(null)}
      />
    </div>
  );
};

export default AdminAssociations;
