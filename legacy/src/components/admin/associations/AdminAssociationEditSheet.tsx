import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Building2,
  Loader2,
  Trash2,
  AlertTriangle,
  Save,
  Shield,
  ShieldAlert,
  ShieldOff,
  Lock,
  Archive,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import type { Association, AdminStatus } from "@/hooks/useAssociation";
import {
  useUpdateAssociationAdmin,
  useChangeAdminStatus,
  useSoftDeleteAssociation,
} from "@/hooks/useAdminAssociations";

// ──────────────────────────────────────────────
// Shared input styling
// ──────────────────────────────────────────────

const INPUT_CLASS =
  "bg-white border-slate-600 text-slate-50 placeholder:text-mp-ink-muted focus-visible:border-[#E84A2B] focus-visible:ring-1 focus-visible:ring-[#E84A2B]/40";

// ──────────────────────────────────────────────
// Zod schemas
// ──────────────────────────────────────────────

const editAssociationSchema = z.object({
  name: z.string().min(2, "Nom requis (2 caractères min)"),
  slug: z
    .string()
    .min(2, "Slug requis")
    .regex(/^[a-z0-9][a-z0-9-]*[a-z0-9]$/, "Minuscules, chiffres et tirets (doit commencer et finir par un alphanumérique)"),
  city: z.string().optional(),
  short_description: z.string().max(200, "200 caractères max").optional(),
  description: z.string().optional(),
  status: z.enum(["active", "suspended", "archived", "draft"]),
  logo_url: z.string().url("URL invalide").optional().or(z.literal("")),
  banner_url: z.string().url("URL invalide").optional().or(z.literal("")),
  email: z.string().email("Email invalide").optional().or(z.literal("")),
  admin_notes: z.string().optional(),
});

type EditAssociationForm = z.infer<typeof editAssociationSchema>;

// ──────────────────────────────────────────────
// Status & admin_status config
// ──────────────────────────────────────────────

const STATUS_OPTIONS = [
  { value: "active", label: "Active", color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" },
  { value: "suspended", label: "Suspendue", color: "bg-amber-500/10 text-amber-400 border-amber-500/30" },
  { value: "archived", label: "Archivée", color: "bg-slate-500/10 text-mp-ink-muted border-slate-500/30" },
  { value: "draft", label: "Brouillon", color: "bg-blue-500/10 text-blue-400 border-blue-500/30" },
] as const;

const ADMIN_STATUS_CONFIG: Record<AdminStatus, {
  label: string;
  color: string;
  icon: typeof Shield;
  description: string;
}> = {
  active: {
    label: "Active",
    color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
    icon: Shield,
    description: "Fonctionnement normal, aucune restriction.",
  },
  restricted: {
    label: "Restreinte",
    color: "bg-amber-500/10 text-amber-400 border-amber-500/30",
    icon: ShieldAlert,
    description: "Back-office accessible mais créations d'événements, invitations et ajouts de membres désactivés.",
  },
  blocked: {
    label: "Bloquée",
    color: "bg-red-500/10 text-red-400 border-red-500/30",
    icon: ShieldOff,
    description: "Tout le back-office en lecture seule. Aucune modification possible par les membres.",
  },
};

// ──────────────────────────────────────────────
// Admin Status Change Dialog
// ──────────────────────────────────────────────

function AdminStatusChangeDialog({
  association,
  targetStatus,
  open,
  onOpenChange,
  onConfirm,
  isPending,
}: {
  association: Association;
  targetStatus: AdminStatus | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onConfirm: (reason: string) => void;
  isPending: boolean;
}) {
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (!open) setReason("");
  }, [open]);

  if (!targetStatus) return null;

  const config = ADMIN_STATUS_CONFIG[targetStatus];
  const isBlocking = targetStatus === "blocked";
  const StatusIcon = config.icon;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-mp-paper border-mp-border">
        <DialogHeader>
          <DialogTitle className={`flex items-center gap-2 ${isBlocking ? "text-red-400" : "text-amber-400"}`}>
            <StatusIcon className="h-5 w-5" />
            {isBlocking ? "Bloquer" : targetStatus === "restricted" ? "Restreindre" : "Lever les restrictions"}
            {" "}{association.name}
          </DialogTitle>
          <DialogDescription className="text-mp-ink-muted">
            {config.description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {isBlocking && (
            <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3">
              <p className="text-sm text-red-300">
                Tous les membres perdront la possibilité de modifier quoi que ce soit dans le back-office de cette association.
              </p>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-200">
              Motif administratif {isBlocking && <span className="text-red-400">*</span>}
            </label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Motif visible par le bureau de l'association..."
              className={`${INPUT_CLASS} resize-none`}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-slate-600 text-slate-200 hover:bg-white"
            disabled={isPending}
          >
            Annuler
          </Button>
          <Button
            onClick={() => onConfirm(reason)}
            disabled={isPending || (isBlocking && !reason.trim())}
            className={
              isBlocking
                ? "bg-red-600 hover:bg-red-700 text-white"
                : targetStatus === "restricted"
                  ? "bg-amber-600 hover:bg-amber-700 text-white"
                  : "bg-emerald-600 hover:bg-emerald-700 text-white"
            }
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <StatusIcon className="h-4 w-4 mr-2" />
            )}
            {isPending ? "En cours..." : "Confirmer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ──────────────────────────────────────────────
// Soft-Delete Confirmation Dialog
// ──────────────────────────────────────────────

function SoftDeleteConfirmDialog({
  association,
  open,
  onOpenChange,
  onConfirm,
  isPending,
}: {
  association: Association;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onConfirm: (reason: string) => void;
  isPending: boolean;
}) {
  const [confirmText, setConfirmText] = useState("");
  const [reason, setReason] = useState("");
  const canDelete = confirmText === "SUPPRIMER" && reason.trim().length > 0;

  useEffect(() => {
    if (!open) {
      setConfirmText("");
      setReason("");
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-mp-paper border-mp-border">
        <DialogHeader>
          <DialogTitle className="text-red-400 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Supprimer l'association
          </DialogTitle>
          <DialogDescription className="text-mp-ink-muted">
            L'association sera marquée comme supprimée et ne sera plus visible.
            Un super-admin pourra la restaurer ultérieurement si nécessaire.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3">
            <p className="text-sm text-red-300">
              Vous êtes sur le point de supprimer :{" "}
              <span className="font-bold text-red-200">{association.name}</span>
            </p>
            <p className="text-xs text-red-400/70 mt-1">
              L'association et toutes ses données seront inaccessibles.
              Les membres ne pourront plus accéder au back-office.
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-200">
              Motif de suppression <span className="text-red-400">*</span>
            </label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Raison de la suppression..."
              className={`${INPUT_CLASS} resize-none`}
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-200">
              Tapez <span className="font-mono text-red-400">SUPPRIMER</span> pour confirmer
            </label>
            <Input
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="SUPPRIMER"
              className={`${INPUT_CLASS} ${canDelete ? "border-red-500" : ""}`}
              autoComplete="off"
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-slate-600 text-slate-200 hover:bg-white"
            disabled={isPending}
          >
            Annuler
          </Button>
          <Button
            variant="destructive"
            onClick={() => onConfirm(reason)}
            disabled={!canDelete || isPending}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Suppression...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4 mr-2" />
                Supprimer
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ──────────────────────────────────────────────
// Main Sheet Component
// ──────────────────────────────────────────────

interface AdminAssociationEditSheetProps {
  association: Association | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

export default function AdminAssociationEditSheet({
  association,
  open,
  onOpenChange,
}: AdminAssociationEditSheetProps) {
  const updateAssociation = useUpdateAssociationAdmin();
  const changeAdminStatus = useChangeAdminStatus();
  const softDelete = useSoftDeleteAssociation();

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [targetAdminStatus, setTargetAdminStatus] = useState<AdminStatus | null>(null);

  const form = useForm<EditAssociationForm>({
    resolver: zodResolver(editAssociationSchema),
    defaultValues: {
      name: "",
      slug: "",
      city: "",
      short_description: "",
      description: "",
      status: "active",
      logo_url: "",
      banner_url: "",
      email: "",
      admin_notes: "",
    },
  });

  // Reset form when association changes
  useEffect(() => {
    if (association && open) {
      form.reset({
        name: association.name || "",
        slug: association.slug || "",
        city: association.city || "",
        short_description: (association as any).short_description || "",
        description: association.description || "",
        status: (association.status as EditAssociationForm["status"]) || "active",
        logo_url: association.logo_url || "",
        banner_url: association.banner_url || "",
        email: association.email || "",
        admin_notes: association.admin_notes || "",
      });
    }
  }, [association, open, form]);

  const handleSave = (data: EditAssociationForm) => {
    if (!association) return;

    updateAssociation.mutate(
      {
        id: association.id,
        data: {
          name: data.name,
          slug: data.slug,
          city: data.city || undefined,
          short_description: data.short_description || undefined,
          description: data.description || undefined,
          status: data.status,
          logo_url: data.logo_url || undefined,
          banner_url: data.banner_url || undefined,
          email: data.email || undefined,
          admin_notes: data.admin_notes || undefined,
        },
      },
      {
        onSuccess: () => onOpenChange(false),
      }
    );
  };

  const openAdminStatusDialog = (status: AdminStatus) => {
    setTargetAdminStatus(status);
    setStatusDialogOpen(true);
  };

  const handleAdminStatusChange = (reason: string) => {
    if (!association || !targetAdminStatus) return;
    changeAdminStatus.mutate(
      {
        associationId: association.id,
        adminStatus: targetAdminStatus,
        reason: reason || undefined,
      },
      {
        onSuccess: () => {
          setStatusDialogOpen(false);
          setTargetAdminStatus(null);
        },
      }
    );
  };

  const handleSoftDelete = (reason: string) => {
    if (!association) return;
    softDelete.mutate(
      { id: association.id, reason },
      {
        onSuccess: () => {
          setDeleteDialogOpen(false);
          onOpenChange(false);
        },
      }
    );
  };

  if (!association) return null;

  const currentAdminStatus = (association.admin_status || "active") as AdminStatus;
  const adminConfig = ADMIN_STATUS_CONFIG[currentAdminStatus];
  const statusOption = STATUS_OPTIONS.find((s) => s.value === association.status);
  const AdminStatusIcon = adminConfig.icon;

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="sm:max-w-lg bg-mp-paper border-mp-border overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="text-slate-50 flex items-center gap-2">
              <Building2 className="h-5 w-5 text-[#E84A2B]" />
              Éditer la structure
            </SheetTitle>
            <div className="text-sm text-mp-ink-muted flex items-center gap-2 flex-wrap">
              <span>
                {association.name}
              </span>
              {statusOption && (
                <Badge variant="outline" className={`text-[10px] ${statusOption.color}`}>
                  {statusOption.label}
                </Badge>
              )}
              <Badge variant="outline" className={`text-[10px] ${adminConfig.color}`}>
                <AdminStatusIcon className="h-2.5 w-2.5 mr-1" />
                {adminConfig.label}
              </Badge>
            </div>
          </SheetHeader>

          {/* Bandeau admin_status si pas active */}
          {currentAdminStatus !== "active" && (
            <div
              className={`mt-4 rounded-lg border p-3 ${
                currentAdminStatus === "blocked"
                  ? "bg-red-500/10 border-red-500/20"
                  : "bg-amber-500/10 border-amber-500/20"
              }`}
            >
              <div className="flex items-start gap-2">
                <AdminStatusIcon
                  className={`h-4 w-4 mt-0.5 shrink-0 ${
                    currentAdminStatus === "blocked" ? "text-red-400" : "text-amber-400"
                  }`}
                />
                <div className="min-w-0">
                  <p
                    className={`text-sm font-medium ${
                      currentAdminStatus === "blocked" ? "text-red-300" : "text-amber-300"
                    }`}
                  >
                    Association {adminConfig.label.toLowerCase()} par l'administration
                  </p>
                  {association.admin_status_reason && (
                    <p className="text-xs text-mp-ink-muted mt-1">
                      Motif : {association.admin_status_reason}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="mt-6">
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(handleSave)}
                className="space-y-5"
              >
                {/* ── Informations principales ── */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
                    Informations principales
                  </h3>

                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-200">
                          Nom de l'association *
                        </FormLabel>
                        <FormControl>
                          <Input {...field} className={INPUT_CLASS} />
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
                          <Input {...field} className={INPUT_CLASS} />
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
                    name="short_description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-200">
                          Description courte
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="En une phrase..."
                            className={INPUT_CLASS}
                            maxLength={200}
                          />
                        </FormControl>
                        <p className="text-[11px] text-mp-ink-muted">
                          {(field.value || "").length}/200
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
                          Description complète
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            className={`${INPUT_CLASS} resize-none`}
                            rows={3}
                          />
                        </FormControl>
                        <FormMessage className="text-[#F5A623]" />
                      </FormItem>
                    )}
                  />

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
                </div>

                <Separator className="bg-mp-cloud/50" />

                {/* ── Statut métier ── */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
                    Statut métier
                  </h3>

                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-200">
                          État de l'association
                        </FormLabel>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <FormControl>
                            <SelectTrigger className={INPUT_CLASS}>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {STATUS_OPTIONS.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value}>
                                {opt.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage className="text-[#F5A623]" />
                      </FormItem>
                    )}
                  />
                </div>

                <Separator className="bg-mp-cloud/50" />

                {/* ── Visuels ── */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
                    Visuels
                  </h3>

                  <FormField
                    control={form.control}
                    name="logo_url"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-200">
                          URL du logo
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="https://..."
                            className={INPUT_CLASS}
                          />
                        </FormControl>
                        <FormMessage className="text-[#F5A623]" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="banner_url"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-200">
                          URL de la bannière
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="https://..."
                            className={INPUT_CLASS}
                          />
                        </FormControl>
                        <FormMessage className="text-[#F5A623]" />
                      </FormItem>
                    )}
                  />
                </div>

                <Separator className="bg-mp-cloud/50" />

                {/* ── Contact ── */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
                    Contact principal
                  </h3>

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-200">Email</FormLabel>
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
                </div>

                <Separator className="bg-mp-cloud/50" />

                {/* ════════════════════════════════════════ */}
                {/* ── GOUVERNANCE ADMINISTRATIVE ────────── */}
                {/* ════════════════════════════════════════ */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-[#E84A2B]" />
                    <h3 className="text-sm font-semibold text-[#E84A2B] uppercase tracking-wider">
                      Gouvernance administrative
                    </h3>
                  </div>

                  <p className="text-xs text-mp-ink-muted">
                    Contrôle de la plateforme sur cette association. Ces actions sont réservées aux super-administrateurs.
                  </p>

                  {/* Current admin_status display */}
                  <div className={`rounded-lg border p-3 ${adminConfig.color}`}>
                    <div className="flex items-center gap-2">
                      <AdminStatusIcon className="h-4 w-4" />
                      <span className="text-sm font-medium">
                        Statut admin : {adminConfig.label}
                      </span>
                    </div>
                    <p className="text-xs mt-1 opacity-80">{adminConfig.description}</p>
                  </div>

                  {/* Quick governance actions */}
                  <div className="flex flex-wrap gap-2">
                    {currentAdminStatus === "active" && (
                      <>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="border-amber-500/30 text-amber-400 hover:bg-amber-500/10 hover:text-amber-300"
                          onClick={() => openAdminStatusDialog("restricted")}
                        >
                          <ShieldAlert className="h-3.5 w-3.5 mr-1.5" />
                          Restreindre
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300"
                          onClick={() => openAdminStatusDialog("blocked")}
                        >
                          <Lock className="h-3.5 w-3.5 mr-1.5" />
                          Bloquer
                        </Button>
                      </>
                    )}
                    {currentAdminStatus === "restricted" && (
                      <>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300"
                          onClick={() => openAdminStatusDialog("active")}
                        >
                          <Shield className="h-3.5 w-3.5 mr-1.5" />
                          Lever la restriction
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300"
                          onClick={() => openAdminStatusDialog("blocked")}
                        >
                          <Lock className="h-3.5 w-3.5 mr-1.5" />
                          Bloquer
                        </Button>
                      </>
                    )}
                    {currentAdminStatus === "blocked" && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300"
                        onClick={() => openAdminStatusDialog("active")}
                      >
                        <Shield className="h-3.5 w-3.5 mr-1.5" />
                        Lever le blocage
                      </Button>
                    )}
                  </div>

                  {/* Note interne admin */}
                  <FormField
                    control={form.control}
                    name="admin_notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-200 flex items-center gap-1.5">
                          <Lock className="h-3 w-3 text-mp-ink-muted" />
                          Note interne (visible super-admin uniquement)
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            placeholder="Notes internes, historique, observations..."
                            className={`${INPUT_CLASS} resize-none`}
                            rows={2}
                          />
                        </FormControl>
                        <FormMessage className="text-[#F5A623]" />
                      </FormItem>
                    )}
                  />
                </div>

                <Separator className="bg-mp-cloud/50" />

                {/* ── Save buttons ── */}
                <div className="flex flex-col gap-3 pt-2">
                  <div className="flex gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1 border-slate-500 text-slate-100 hover:bg-white hover:text-slate-50"
                      onClick={() => onOpenChange(false)}
                      disabled={updateAssociation.isPending}
                    >
                      Annuler
                    </Button>
                    <Button
                      type="submit"
                      className="flex-1 bg-gradient-to-r from-[#E84A2B] to-[#F26B2E] hover:from-[#D43D20] hover:to-[#E25E25] text-white"
                      disabled={updateAssociation.isPending}
                    >
                      {updateAssociation.isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          Enregistrement...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Enregistrer
                        </>
                      )}
                    </Button>
                  </div>

                  {/* Zone dangereuse */}
                  <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-4 mt-2">
                    <h4 className="text-sm font-semibold text-red-400 mb-1 flex items-center gap-1.5">
                      <AlertTriangle className="h-3.5 w-3.5" />
                      Zone dangereuse
                    </h4>
                    <p className="text-xs text-mp-ink-muted mb-3">
                      La suppression marque l'association comme supprimée (soft-delete).
                      Un super-admin peut la restaurer ultérieurement.
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300"
                      onClick={() => setDeleteDialogOpen(true)}
                    >
                      <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                      Supprimer la structure
                    </Button>
                  </div>
                </div>
              </form>
            </Form>
          </div>
        </SheetContent>
      </Sheet>

      {/* Admin status change dialog */}
      {association && (
        <AdminStatusChangeDialog
          association={association}
          targetStatus={targetAdminStatus}
          open={statusDialogOpen}
          onOpenChange={setStatusDialogOpen}
          onConfirm={handleAdminStatusChange}
          isPending={changeAdminStatus.isPending}
        />
      )}

      {/* Soft-delete confirmation dialog */}
      {association && (
        <SoftDeleteConfirmDialog
          association={association}
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          onConfirm={handleSoftDelete}
          isPending={softDelete.isPending}
        />
      )}
    </>
  );
}
