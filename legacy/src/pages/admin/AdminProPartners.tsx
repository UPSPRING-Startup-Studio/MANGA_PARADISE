import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Briefcase,
  Plus,
  Users,
  Search,
  Loader2,
  MapPin,
  UserPlus,
  CalendarDays,
  CheckCircle2,
  XCircle,
  Globe,
  Star,
  Shield,
  ShieldAlert,
  ShieldOff,
  List,
  LayoutGrid,
  Grid3X3,
  Trash2,
  RotateCcw,
  Calendar,
  Pencil,
  X,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  useAdminProPartners,
  useCreateProPartner,
  useAddProPartnerMember,
  useSearchUsersForPartner,
  useAdminProPartnerMembers,
  useProPartnerApplications,
  usePendingApplicationsCount,
  useApproveApplication,
  useRejectApplication,
  useAdminDeletedProPartners,
  useRestoreProPartner,
} from "@/hooks/useAdminProPartners";
import {
  PRO_PARTNER_ROLE_LABELS,
  PRO_PARTNER_TYPE_LABELS,
  DIRECTORY_CATEGORY_LABELS,
  PARTNER_STATUS_LABELS,
  PARTNER_STATUS_COLORS,
  type ProPartnerRole,
  type ProPartner,
  type DirectoryCategory,
  type PartnerStatus,
} from "@/hooks/useProPartner";
import type { ProPartnerApplication } from "@/hooks/useAdminProPartners";
import ProPartnerEditSheet from "@/components/admin/pro-partners/ProPartnerEditSheet";
import ProPartnerKanbanView from "@/components/admin/pro-partners/ProPartnerKanbanView";
import ProPartnerGridView from "@/components/admin/pro-partners/ProPartnerGridView";
import PartnerAvatar from "@/components/admin/pro-partners/PartnerAvatar";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const INPUT_CLASS =
  "bg-white border-slate-600 text-slate-50 placeholder:text-mp-ink-muted focus-visible:border-[#E84A2B] focus-visible:ring-1 focus-visible:ring-[#E84A2B]/40";

// ──────────────────────────────────────────────
// Zod schema
// ──────────────────────────────────────────────

const createPartnerSchema = z.object({
  name: z.string().min(2, "Nom requis (2 caractères min)"),
  slug: z
    .string()
    .min(2, "Slug requis")
    .regex(/^[a-z0-9-]+$/, "Minuscules, chiffres et tirets uniquement"),
  type: z.string().default("societe"),
  directory_category: z.string().nullable().optional(),
  subcategories: z.array(z.string()).default([]),
  description: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  postal_code: z.string().optional(),
  region: z.string().optional(),
  email: z.string().email("Email invalide").optional().or(z.literal("")),
  phone: z.string().optional(),
  website_url: z.string().url("URL invalide").optional().or(z.literal("")),
  siret: z.string().optional(),
  member_benefit: z.string().optional(),
  is_public: z.boolean().default(false),
});

type CreatePartnerForm = z.infer<typeof createPartnerSchema>;

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// ──────────────────────────────────────────────
// Admin status helpers
// ──────────────────────────────────────────────

const ADMIN_STATUS_BADGE: Record<string, { label: string; color: string; icon: typeof Shield }> = {
  active: { label: "Actif", color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30", icon: Shield },
  restricted: { label: "Restreint", color: "bg-amber-500/10 text-amber-400 border-amber-500/30", icon: ShieldAlert },
  blocked: { label: "Bloqué", color: "bg-red-500/10 text-red-400 border-red-500/30", icon: ShieldOff },
};

// ──────────────────────────────────────────────
// Main page
// ──────────────────────────────────────────────

const AdminProPartners = () => {
  const { data: pendingCount } = usePendingApplicationsCount();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display text-slate-50 flex items-center gap-3">
          <Briefcase className="h-7 w-7 text-[#E84A2B]" />
          Partenaires Pro
        </h1>
        <p className="text-mp-ink-muted mt-1">
          Annuaire, gouvernance et demandes d'inscription des structures professionnelles
        </p>
      </div>

      <Tabs defaultValue="partners" className="space-y-4">
        <TabsList className="bg-white/50 border border-mp-border/50">
          <TabsTrigger value="partners" className="data-[state=active]:bg-[#E84A2B]/10 data-[state=active]:text-[#E84A2B]">
            Partenaires
          </TabsTrigger>
          <TabsTrigger value="applications" className="data-[state=active]:bg-[#E84A2B]/10 data-[state=active]:text-[#E84A2B]">
            Demandes
            {(pendingCount ?? 0) > 0 && (
              <Badge className="ml-2 bg-amber-500 text-slate-900 text-[10px] px-1.5 py-0">
                {pendingCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="deleted" className="data-[state=active]:bg-[#E84A2B]/10 data-[state=active]:text-[#E84A2B]">
            <Trash2 className="h-3.5 w-3.5 mr-1.5" />
            Supprimés
          </TabsTrigger>
        </TabsList>

        <TabsContent value="partners"><PartnersTab /></TabsContent>
        <TabsContent value="applications"><ApplicationsTab /></TabsContent>
        <TabsContent value="deleted"><DeletedTab /></TabsContent>
      </Tabs>
    </div>
  );
};

// ──────────────────────────────────────────────
// Tab: Partners List + Kanban
// ──────────────────────────────────────────────

type ViewMode = "list" | "kanban" | "grid";

function PartnersTab() {
  const { data: partners, isLoading } = useAdminProPartners();
  const createPartner = useCreateProPartner();

  const [createSheetOpen, setCreateSheetOpen] = useState(false);
  const [addMemberTarget, setAddMemberTarget] = useState<(ProPartner & { event_count: number }) | null>(null);
  const [editTarget, setEditTarget] = useState<(ProPartner & { event_count: number }) | null>(null);

  // View mode
  const [viewMode, setViewMode] = useState<ViewMode>("list");

  // Filters
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [adminStatusFilter, setAdminStatusFilter] = useState("all");
  const [partnerStatusFilter, setPartnerStatusFilter] = useState("all");
  const [cityFilter, setCityFilter] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "city" | "created_at" | "partner_status">("name");

  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);

  const form = useForm<CreatePartnerForm>({
    resolver: zodResolver(createPartnerSchema),
    defaultValues: {
      name: "", slug: "", type: "societe", directory_category: null,
      subcategories: [], description: "", address: "", city: "",
      postal_code: "", region: "", email: "", phone: "", website_url: "",
      siret: "", member_benefit: "", is_public: false,
    },
  });

  const handleCreate = (data: CreatePartnerForm) => {
    createPartner.mutate(
      {
        name: data.name,
        slug: data.slug,
        type: data.type,
        directory_category: data.directory_category || null,
        subcategories: data.subcategories,
        description: data.description,
        address: data.address,
        city: data.city,
        postal_code: data.postal_code,
        region: data.region,
        email: data.email,
        phone: data.phone,
        website_url: data.website_url,
        siret: data.siret,
        member_benefit: data.member_benefit,
        is_public: data.is_public,
      },
      {
        onSuccess: () => {
          setCreateSheetOpen(false);
          form.reset();
          setSlugManuallyEdited(false);
        },
      },
    );
  };

  const handleNameChange = (name: string) => {
    form.setValue("name", name);
    if (!slugManuallyEdited) {
      form.setValue("slug", slugify(name));
    }
  };

  const handleSlugChange = (value: string) => {
    form.setValue("slug", value);
    setSlugManuallyEdited(true);
  };

  const filtered = (partners || []).filter((p) => {
    if (search) {
      const q = search.toLowerCase();
      if (
        !p.name.toLowerCase().includes(q) &&
        !p.slug.toLowerCase().includes(q) &&
        !(p.email || "").toLowerCase().includes(q) &&
        !(p.siret || "").includes(q)
      ) return false;
    }
    if (typeFilter !== "all" && p.type !== typeFilter) return false;
    if (categoryFilter !== "all") {
      if (categoryFilter === "__none__" && p.directory_category) return false;
      if (categoryFilter !== "__none__" && p.directory_category !== categoryFilter) return false;
    }
    if (statusFilter !== "all" && p.status !== statusFilter) return false;
    if (adminStatusFilter !== "all" && p.admin_status !== adminStatusFilter) return false;
    if (partnerStatusFilter !== "all" && (p as any).partner_status !== partnerStatusFilter) return false;
    if (cityFilter) {
      const cf = cityFilter.toLowerCase();
      if (!(p.city || "").toLowerCase().includes(cf)) return false;
    }
    return true;
  });

  // Sort
  const PIPELINE_ORDER = ["opportunite", "mail_envoye", "en_cours_edition", "attente_signature", "accord_principe", "convention_signee"];
  filtered.sort((a, b) => {
    switch (sortBy) {
      case "name": return (a.name || "").localeCompare(b.name || "");
      case "city": return (a.city || "zzz").localeCompare(b.city || "zzz");
      case "created_at": return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      case "partner_status": return PIPELINE_ORDER.indexOf((a as any).partner_status || "opportunite") - PIPELINE_ORDER.indexOf((b as any).partner_status || "opportunite");
      default: return 0;
    }
  });

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-2 flex-1 max-w-lg">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-mp-ink-muted" />
              <Input
                placeholder="Nom, slug, email, SIRET..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className={`pl-9 ${INPUT_CLASS}`}
              />
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            {/* View toggle */}
            <div className="flex rounded-lg border border-mp-border overflow-hidden">
              <Button variant="ghost" size="sm" onClick={() => setViewMode("list")} title="Vue liste"
                className={`rounded-none h-9 px-3 ${viewMode === "list" ? "bg-[#E84A2B]/10 text-[#E84A2B]" : "text-mp-ink-muted hover:text-slate-200 hover:bg-white"}`}>
                <List className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setViewMode("kanban")} title="Vue Kanban"
                className={`rounded-none h-9 px-3 border-l border-mp-border ${viewMode === "kanban" ? "bg-[#E84A2B]/10 text-[#E84A2B]" : "text-mp-ink-muted hover:text-slate-200 hover:bg-white"}`}>
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setViewMode("grid")} title="Vue grille"
                className={`rounded-none h-9 px-3 border-l border-mp-border ${viewMode === "grid" ? "bg-[#E84A2B]/10 text-[#E84A2B]" : "text-mp-ink-muted hover:text-slate-200 hover:bg-white"}`}>
                <Grid3X3 className="h-4 w-4" />
              </Button>
            </div>
            <Button
              onClick={() => setCreateSheetOpen(true)}
              className="gap-2 bg-gradient-to-r from-[#E84A2B] to-[#F26B2E] hover:from-[#D43D20] hover:to-[#E25E25] text-white"
            >
              <Plus className="h-4 w-4" />
              Créer
            </Button>
          </div>
        </div>

        {/* Filter row */}
        <div className="flex gap-2 flex-wrap">
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className={`w-32 ${INPUT_CLASS} h-8 text-xs`}><SelectValue placeholder="Type" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous types</SelectItem>
              {Object.entries(PRO_PARTNER_TYPE_LABELS).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className={`w-44 ${INPUT_CLASS} h-8 text-xs`}><SelectValue placeholder="Catégorie" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes catégories</SelectItem>
              {Object.entries(DIRECTORY_CATEGORY_LABELS).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
              ))}
              <SelectItem value="__none__">Non catégorisé</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className={`w-28 ${INPUT_CLASS} h-8 text-xs`}><SelectValue placeholder="Statut" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous</SelectItem>
              <SelectItem value="active">Actifs</SelectItem>
              <SelectItem value="suspended">Suspendus</SelectItem>
              <SelectItem value="draft">Brouillons</SelectItem>
              <SelectItem value="archived">Archivés</SelectItem>
            </SelectContent>
          </Select>
          <Select value={adminStatusFilter} onValueChange={setAdminStatusFilter}>
            <SelectTrigger className={`w-32 ${INPUT_CLASS} h-8 text-xs`}><SelectValue placeholder="Admin" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Admin: tous</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="restricted">Restreint</SelectItem>
              <SelectItem value="blocked">Bloqué</SelectItem>
            </SelectContent>
          </Select>
          <Select value={partnerStatusFilter} onValueChange={setPartnerStatusFilter}>
            <SelectTrigger className={`w-40 ${INPUT_CLASS} h-8 text-xs`}><SelectValue placeholder="Pipeline" /></SelectTrigger>
            <SelectContent position="popper" className="z-[200]">
              <SelectItem value="all">Pipeline: tous</SelectItem>
              {Object.entries(PARTNER_STATUS_LABELS).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            placeholder="Ville..."
            value={cityFilter}
            onChange={(e) => setCityFilter(e.target.value)}
            className={`w-28 ${INPUT_CLASS} h-8 text-xs`}
          />
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
            <SelectTrigger className={`w-32 ${INPUT_CLASS} h-8 text-xs`}><SelectValue placeholder="Tri" /></SelectTrigger>
            <SelectContent position="popper" className="z-[200]">
              <SelectItem value="name">Nom A→Z</SelectItem>
              <SelectItem value="city">Ville</SelectItem>
              <SelectItem value="created_at">Plus récent</SelectItem>
              <SelectItem value="partner_status">Pipeline CRM</SelectItem>
            </SelectContent>
          </Select>
          {(typeFilter !== "all" || categoryFilter !== "all" || statusFilter !== "all" || adminStatusFilter !== "all" || partnerStatusFilter !== "all" || cityFilter) && (
            <Button variant="ghost" size="sm" className="h-8 text-xs text-mp-ink-muted hover:text-slate-200"
              onClick={() => { setTypeFilter("all"); setCategoryFilter("all"); setStatusFilter("all"); setAdminStatusFilter("all"); setPartnerStatusFilter("all"); setCityFilter(""); }}>
              Effacer filtres
            </Button>
          )}
        </div>
      </div>

      {/* Content */}
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
      ) : viewMode === "kanban" ? (
        <ProPartnerKanbanView
          partners={filtered}
          onSelect={(p) => setEditTarget(p)}
          onCreateInCategory={(cat) => {
            form.setValue("directory_category", cat);
            setCreateSheetOpen(true);
          }}
        />
      ) : viewMode === "grid" ? (
        <ProPartnerGridView
          partners={filtered}
          onSelect={(p) => setEditTarget(p)}
        />
      ) : filtered.length > 0 ? (
        <div className="space-y-3">
          {filtered.map((partner) => {
            const adminBadge = ADMIN_STATUS_BADGE[partner.admin_status];
            const AdminIcon = adminBadge?.icon || Shield;
            return (
              <Card
                key={partner.id}
                className={`bg-mp-paper/80 border-mp-border/50 hover:border-[#E84A2B]/30 transition-colors cursor-pointer ${
                  partner.admin_status === "blocked" ? "opacity-70" : ""
                }`}
                onClick={() => setEditTarget(partner)}
              >
                <CardContent className="p-5">
                  <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                    <PartnerAvatar
                      logoUrl={partner.logo_url}
                      name={partner.name}
                      category={partner.directory_category}
                      size="md"
                    />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-slate-50">{partner.name}</h3>
                        <Badge variant="outline" className="text-[10px] text-mp-ink-muted border-slate-600">
                          /{partner.slug}
                        </Badge>
                        <Badge variant="outline" className={`text-[10px] ${
                          partner.status === "active" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                            : partner.status === "suspended" ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                            : "bg-slate-500/10 text-mp-ink-muted border-slate-500/30"
                        }`}>
                          {partner.status === "active" ? "Actif" : partner.status === "suspended" ? "Suspendu" : partner.status === "draft" ? "Brouillon" : partner.status}
                        </Badge>
                        <Badge variant="outline" className="text-[10px] text-cyan-400 border-cyan-500/30">
                          {PRO_PARTNER_TYPE_LABELS[partner.type] || partner.type}
                        </Badge>
                        {partner.directory_category && (
                          <Badge variant="outline" className="text-[10px] text-purple-400 border-purple-500/30">
                            {DIRECTORY_CATEGORY_LABELS[partner.directory_category as DirectoryCategory] || partner.directory_category}
                          </Badge>
                        )}
                        {adminBadge && partner.admin_status !== "active" && (
                          <Badge variant="outline" className={`text-[10px] ${adminBadge.color}`}>
                            <AdminIcon className="h-2.5 w-2.5 mr-0.5" />
                            {adminBadge.label}
                          </Badge>
                        )}
                        {(partner as any).partner_status && (partner as any).partner_status !== "opportunite" && (
                          <Badge variant="outline" className={`text-[10px] ${PARTNER_STATUS_COLORS[(partner as any).partner_status as PartnerStatus] || ""}`}>
                            {PARTNER_STATUS_LABELS[(partner as any).partner_status as PartnerStatus] || (partner as any).partner_status}
                          </Badge>
                        )}
                        {partner.is_public && (
                          <Globe className="h-3.5 w-3.5 text-cyan-400" />
                        )}
                        {partner.is_featured && (
                          <Star className="h-3.5 w-3.5 text-yellow-400" />
                        )}
                      </div>
                      {partner.description && (
                        <p className="text-sm text-slate-300 mt-1 line-clamp-1">{partner.description}</p>
                      )}
                      <div className="flex items-center gap-4 mt-2 text-xs text-mp-ink-muted">
                        {partner.city && (
                          <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{partner.city}</span>
                        )}
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />{partner.member_count ?? 0} membre{(partner.member_count ?? 0) > 1 ? "s" : ""}
                        </span>
                        <span className="flex items-center gap-1">
                          <CalendarDays className="h-3 w-3" />{partner.event_count ?? 0} événement{(partner.event_count ?? 0) > 1 ? "s" : ""}
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                      <Button variant="outline" size="sm"
                        onClick={() => setEditTarget(partner)}
                        className="gap-1.5 text-xs border-slate-600 text-slate-200 hover:bg-white">
                        <Pencil className="h-3.5 w-3.5" />Éditer
                      </Button>
                      <Button variant="outline" size="sm"
                        onClick={() => setAddMemberTarget(partner)}
                        className="gap-1.5 text-xs border-slate-600 text-slate-200 hover:bg-white">
                        <UserPlus className="h-3.5 w-3.5" />Membre
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
          <Briefcase className="w-16 h-16 text-mp-ink-muted mb-4" />
          <h2 className="text-xl font-display text-slate-50 mb-2">Aucun partenaire</h2>
          <p className="text-mp-ink-muted max-w-md mb-6">
            {search || typeFilter !== "all" || categoryFilter !== "all" || statusFilter !== "all" || adminStatusFilter !== "all" || cityFilter
              ? "Aucun résultat pour ces filtres."
              : "Crée le premier partenaire ou attends les demandes d'inscription."}
          </p>
        </div>
      )}

      {/* Create Sheet */}
      <Sheet open={createSheetOpen} onOpenChange={(v) => { setCreateSheetOpen(v); if (!v) { setSlugManuallyEdited(false); } }}>
        <SheetContent className="sm:max-w-lg bg-mp-paper border-mp-border overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="text-slate-50">Créer un partenaire</SheetTitle>
            <SheetDescription className="text-mp-ink-muted">
              Créer manuellement une structure partenaire
            </SheetDescription>
          </SheetHeader>
          <div className="mt-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleCreate)} className="space-y-5">
                {/* Nom */}
                <FormField control={form.control} name="name" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-200">Nom *</FormLabel>
                    <FormControl><Input {...field} onChange={(e) => handleNameChange(e.target.value)} placeholder="Boutique Sakura" className={INPUT_CLASS} /></FormControl>
                    <FormMessage className="text-[#F5A623]" />
                  </FormItem>
                )} />

                {/* Slug */}
                <FormField control={form.control} name="slug" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-200">Slug *</FormLabel>
                    <FormControl><Input {...field} onChange={(e) => handleSlugChange(e.target.value)} placeholder="boutique-sakura" className={INPUT_CLASS} /></FormControl>
                    <p className="text-[11px] text-mp-ink-muted">Minuscules, chiffres et tirets — auto-généré depuis le nom</p>
                    <FormMessage className="text-[#F5A623]" />
                  </FormItem>
                )} />

                {/* Type + Catégorie */}
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="type" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-200">Type de structure</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl><SelectTrigger className={INPUT_CLASS}><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent position="popper" className="z-[200]">
                          {Object.entries(PRO_PARTNER_TYPE_LABELS).map(([k, v]) => (
                            <SelectItem key={k} value={k}>{v}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="directory_category" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-200">Catégorie annuaire</FormLabel>
                      <Select value={field.value || "none"} onValueChange={(v) => field.onChange(v === "none" ? null : v)}>
                        <FormControl><SelectTrigger className={INPUT_CLASS}><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent position="popper" className="z-[200]">
                          <SelectItem value="none">Non catégorisé</SelectItem>
                          {Object.entries(DIRECTORY_CATEGORY_LABELS).map(([k, v]) => (
                            <SelectItem key={k} value={k}>{v}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )} />
                </div>

                {/* Sous-catégories */}
                <FormField control={form.control} name="subcategories" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-200">Sous-catégories</FormLabel>
                    <FormControl>
                      <CreateSubcategoryChips value={field.value} onChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )} />

                {/* Description */}
                <FormField control={form.control} name="description" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-200">Description</FormLabel>
                    <FormControl><Textarea {...field} className={`${INPUT_CLASS} resize-none`} rows={3} /></FormControl>
                  </FormItem>
                )} />

                {/* Adresse */}
                <FormField control={form.control} name="address" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-200">Adresse</FormLabel>
                    <FormControl><Input {...field} placeholder="3 Rue Alfred Mortier" className={INPUT_CLASS} /></FormControl>
                  </FormItem>
                )} />

                {/* Ville + CP + Région */}
                <div className="grid grid-cols-3 gap-3">
                  <FormField control={form.control} name="city" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-200">Ville</FormLabel>
                      <FormControl><Input {...field} className={INPUT_CLASS} /></FormControl>
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="postal_code" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-200">Code postal</FormLabel>
                      <FormControl><Input {...field} className={INPUT_CLASS} /></FormControl>
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="region" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-200">Région</FormLabel>
                      <FormControl><Input {...field} className={INPUT_CLASS} /></FormControl>
                    </FormItem>
                  )} />
                </div>

                {/* Email + Téléphone */}
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="email" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-200">Email</FormLabel>
                      <FormControl><Input {...field} type="email" className={INPUT_CLASS} /></FormControl>
                      <FormMessage className="text-[#F5A623]" />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="phone" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-200">Téléphone</FormLabel>
                      <FormControl><Input {...field} type="tel" className={INPUT_CLASS} /></FormControl>
                    </FormItem>
                  )} />
                </div>

                {/* SIRET + Site web */}
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="siret" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-200">SIRET</FormLabel>
                      <FormControl><Input {...field} className={INPUT_CLASS} /></FormControl>
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="website_url" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-200">Site web</FormLabel>
                      <FormControl><Input {...field} placeholder="https://..." className={INPUT_CLASS} /></FormControl>
                      <FormMessage className="text-[#F5A623]" />
                    </FormItem>
                  )} />
                </div>

                {/* Avantage membre */}
                <FormField control={form.control} name="member_benefit" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-200">Avantage membre</FormLabel>
                    <FormControl><Textarea {...field} placeholder="-10% pour les adhérents..." className={`${INPUT_CLASS} resize-none`} rows={2} /></FormControl>
                  </FormItem>
                )} />

                {/* Visible annuaire */}
                <FormField control={form.control} name="is_public" render={({ field }) => (
                  <FormItem className="flex items-center gap-3 space-y-0 rounded-lg border border-mp-border p-3">
                    <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                    <div>
                      <FormLabel className="text-slate-200 flex items-center gap-1.5 cursor-pointer">
                        <Globe className="h-3.5 w-3.5 text-cyan-400" />
                        Visible dans l'annuaire public
                      </FormLabel>
                      <p className="text-[11px] text-mp-ink-muted">Le partenaire apparaîtra sur la page publique</p>
                    </div>
                  </FormItem>
                )} />

                {/* Boutons */}
                <div className="flex gap-3 pt-4">
                  <Button type="button" variant="outline" className="flex-1 border-slate-500 text-slate-100 hover:bg-white" onClick={() => setCreateSheetOpen(false)} disabled={createPartner.isPending}>Annuler</Button>
                  <Button type="submit" className="flex-1 bg-gradient-to-r from-[#E84A2B] to-[#F26B2E] hover:from-[#D43D20] hover:to-[#E25E25] text-white" disabled={createPartner.isPending}>
                    {createPartner.isPending ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Création...</> : "Créer le partenaire"}
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        </SheetContent>
      </Sheet>

      {/* Edit Sheet */}
      <ProPartnerEditSheet
        partner={editTarget}
        open={!!editTarget}
        onOpenChange={(v) => !v && setEditTarget(null)}
      />

      {/* Add Member Dialog */}
      <AddMemberDialog
        partner={addMemberTarget}
        open={!!addMemberTarget}
        onOpenChange={(v) => !v && setAddMemberTarget(null)}
      />
    </div>
  );
}

// ──────────────────────────────────────────────
// Tab: Deleted partners
// ──────────────────────────────────────────────

function DeletedTab() {
  const { data: deleted, isLoading } = useAdminDeletedProPartners();
  const restorePartner = useRestoreProPartner();

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(2)].map((_, i) => <Skeleton key={i} className="h-20 bg-white" />)}
      </div>
    );
  }

  if (!deleted || deleted.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Trash2 className="w-12 h-12 text-mp-ink-muted mb-3" />
        <p className="text-mp-ink-muted">Aucun partenaire supprimé</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-mp-ink-muted">
        {deleted.length} partenaire{deleted.length > 1 ? "s" : ""} supprimé{deleted.length > 1 ? "s" : ""}
      </p>
      {deleted.map((partner) => (
        <Card key={partner.id} className="bg-mp-paper/50 border-red-500/20 opacity-75">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-slate-200 line-through">{partner.name}</h3>
                <div className="flex items-center gap-3 mt-1 text-xs text-mp-ink-muted">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Supprimé le {partner.deleted_at ? format(new Date(partner.deleted_at), "d MMM yyyy", { locale: fr }) : "—"}
                  </span>
                  {partner.deletion_reason && (
                    <span className="truncate">Motif : {partner.deletion_reason}</span>
                  )}
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => restorePartner.mutate(partner.id)}
                disabled={restorePartner.isPending}
                className="gap-1.5 text-xs border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 shrink-0"
              >
                {restorePartner.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <RotateCcw className="h-3.5 w-3.5" />}
                Restaurer
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ──────────────────────────────────────────────
// Tab: Applications (repris tel quel de la V1)
// ──────────────────────────────────────────────

function ApplicationsTab() {
  const [statusFilter, setStatusFilter] = useState("pending");
  const { data: applications, isLoading } = useProPartnerApplications(statusFilter);
  const approveApp = useApproveApplication();
  const rejectApp = useRejectApplication();
  const [rejectTarget, setRejectTarget] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const handleReject = () => {
    if (!rejectTarget) return;
    rejectApp.mutate(
      { applicationId: rejectTarget, reason: rejectReason },
      { onSuccess: () => { setRejectTarget(null); setRejectReason(""); } },
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {["pending", "approved", "rejected", "all"].map((s) => (
          <Button key={s} variant={statusFilter === s ? "default" : "outline"} size="sm"
            onClick={() => setStatusFilter(s)}
            className={statusFilter === s ? "bg-[#E84A2B] text-white" : "border-slate-600 text-slate-200 hover:bg-white"}>
            {s === "pending" ? "En attente" : s === "approved" ? "Approuvées" : s === "rejected" ? "Refusées" : "Toutes"}
          </Button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-24 bg-white" />)}
        </div>
      ) : applications && applications.length > 0 ? (
        <div className="space-y-3">
          {applications.map((app) => (
            <Card key={app.id} className="bg-mp-paper/80 border-mp-border/50">
              <CardContent className="p-5">
                <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className="font-semibold text-slate-50">{app.company_name}</h3>
                      <Badge variant="outline" className="text-[10px] text-cyan-400 border-cyan-500/30">
                        {PRO_PARTNER_TYPE_LABELS[app.company_type] || app.company_type}
                      </Badge>
                      <StatusBadge status={app.status} />
                    </div>
                    <div className="text-sm text-slate-300">
                      {app.contact_first_name} {app.contact_last_name} — {app.contact_email}
                    </div>
                    {app.description && <p className="text-sm text-mp-ink-muted mt-2 line-clamp-2">{app.description}</p>}
                    {app.message && <p className="text-sm text-mp-ink-muted mt-1 italic line-clamp-2">"{app.message}"</p>}
                    <div className="flex items-center gap-3 mt-2 text-xs text-mp-ink-muted">
                      {app.siret && <span>SIRET: {app.siret}</span>}
                      <span>Envoyée le {format(new Date(app.created_at), "d MMM yyyy", { locale: fr })}</span>
                    </div>
                    {app.rejection_reason && <p className="text-xs text-red-400 mt-2">Motif: {app.rejection_reason}</p>}
                  </div>
                  {app.status === "pending" && (
                    <div className="flex gap-2 shrink-0">
                      <Button size="sm" onClick={() => approveApp.mutate(app.id)} disabled={approveApp.isPending}
                        className="gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs">
                        {approveApp.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                        Approuver
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => setRejectTarget(app.id)}
                        className="gap-1.5 text-xs border-red-500/30 text-red-400 hover:bg-red-500/10">
                        <XCircle className="h-3.5 w-3.5" />Refuser
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Briefcase className="w-12 h-12 text-mp-ink-muted mb-3" />
          <p className="text-mp-ink-muted">Aucune demande {statusFilter === "pending" ? "en attente" : ""}</p>
        </div>
      )}

      <Dialog open={!!rejectTarget} onOpenChange={(v) => !v && setRejectTarget(null)}>
        <DialogContent className="sm:max-w-md bg-mp-paper border-mp-border">
          <DialogHeader>
            <DialogTitle className="text-slate-50">Refuser la demande</DialogTitle>
            <DialogDescription className="text-mp-ink-muted">Indiquez un motif de refus (optionnel)</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <Textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="Motif du refus..." className={`${INPUT_CLASS} resize-none`} rows={3} />
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1 border-slate-600 text-slate-200 hover:bg-white" onClick={() => setRejectTarget(null)}>Annuler</Button>
              <Button onClick={handleReject} disabled={rejectApp.isPending} className="flex-1 bg-red-500 hover:bg-red-600 text-white">
                {rejectApp.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Confirmer le refus
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ──────────────────────────────────────────────
// Add Member Dialog (repris de la V1)
// ──────────────────────────────────────────────

function AddMemberDialog({
  partner, open, onOpenChange,
}: {
  partner: (ProPartner & { event_count: number }) | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRole, setSelectedRole] = useState<ProPartnerRole>("member");
  const { data: searchResults, isLoading: isSearching } = useSearchUsersForPartner(searchQuery);
  const addMember = useAddProPartnerMember();
  const { data: existingMembers } = useAdminProPartnerMembers(partner?.id);

  const existingUserIds = new Set((existingMembers || []).map((m: any) => m.user_id));

  const handleAdd = (userId: string) => {
    if (!partner) return;
    addMember.mutate(
      { partnerId: partner.id, userId, role: selectedRole },
      { onSuccess: () => setSearchQuery("") },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-mp-paper border-mp-border">
        <DialogHeader>
          <DialogTitle className="text-slate-50">Ajouter un membre</DialogTitle>
          <DialogDescription className="text-mp-ink-muted">
            Rattacher un utilisateur à {partner?.name}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-200">Rôle</label>
            <Select value={selectedRole} onValueChange={(v) => setSelectedRole(v as ProPartnerRole)}>
              <SelectTrigger className={INPUT_CLASS}><SelectValue /></SelectTrigger>
              <SelectContent>
                {(["owner", "admin", "manager", "member"] as ProPartnerRole[]).map((r) => (
                  <SelectItem key={r} value={r}>{PRO_PARTNER_ROLE_LABELS[r]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-200">Rechercher</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-mp-ink-muted" />
              <Input placeholder="Pseudo ou nom..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className={`pl-9 ${INPUT_CLASS}`} />
            </div>
          </div>
          {existingMembers && existingMembers.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-xs text-mp-ink-muted">Membres actuels ({existingMembers.length})</p>
              <div className="flex flex-wrap gap-1.5">
                {existingMembers.map((m: any) => (
                  <div key={m.id} className="flex items-center gap-1.5 rounded-md bg-white px-2 py-1 text-xs">
                    <Avatar className="h-5 w-5">
                      <AvatarImage src={m.profile?.avatar_url || undefined} />
                      <AvatarFallback className="text-[8px] bg-cyan-500/10 text-cyan-400">
                        {(m.profile?.display_name || m.profile?.username || "?").charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-slate-200">{m.profile?.display_name || m.profile?.username}</span>
                    <Badge variant="outline" className={`text-[8px] py-0 px-1 ${m.role === "owner" ? "text-amber-400 border-amber-500/30" : "text-mp-ink-muted border-slate-600"}`}>
                      {PRO_PARTNER_ROLE_LABELS[m.role as ProPartnerRole] || m.role}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
          {searchQuery.length >= 2 && (
            <ScrollArea className="max-h-52 rounded-lg border border-mp-border bg-white/60">
              {isSearching ? (
                <div className="flex items-center justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-mp-ink-muted" /></div>
              ) : searchResults && searchResults.length > 0 ? (
                <div className="p-1">
                  {searchResults.map((user) => {
                    const alreadyMember = existingUserIds.has(user.id);
                    return (
                      <div key={user.id} className="flex items-center gap-3 rounded-md p-2.5 hover:bg-mp-cloud/50 transition-colors">
                        <Avatar className="h-9 w-9 border border-slate-600">
                          <AvatarImage src={user.avatar_url || undefined} />
                          <AvatarFallback className="bg-cyan-500/10 text-cyan-400 text-xs">
                            {(user.display_name || user.username || "?").charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-100 truncate">{user.display_name || user.username}</p>
                          {user.username && <p className="text-xs text-mp-ink-muted truncate">@{user.username}</p>}
                        </div>
                        {alreadyMember ? (
                          <Badge variant="outline" className="text-[10px] text-mp-ink-muted border-slate-600">Déjà membre</Badge>
                        ) : (
                          <Button size="sm" onClick={() => handleAdd(user.id)} disabled={addMember.isPending} className="bg-[#E84A2B] hover:bg-[#F26B2E] text-white text-xs h-7">
                            {addMember.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : "Ajouter"}
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-center text-sm text-mp-ink-muted py-6">Aucun utilisateur trouvé</p>
              )}
            </ScrollArea>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ──────────────────────────────────────────────
// Helper: Status Badge
// ──────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: "bg-amber-500/10 text-amber-400 border-amber-500/30",
    approved: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
    rejected: "bg-red-500/10 text-red-400 border-red-500/30",
  };
  const labels: Record<string, string> = {
    pending: "En attente",
    approved: "Approuvée",
    rejected: "Refusée",
  };
  return (
    <Badge variant="outline" className={`text-[10px] ${styles[status] || "text-mp-ink-muted border-slate-600"}`}>
      {labels[status] || status}
    </Badge>
  );
}

// ──────────────────────────────────────────────
// Subcategory chips for create form
// ──────────────────────────────────────────────

function CreateSubcategoryChips({
  value,
  onChange,
}: {
  value: string[];
  onChange: (v: string[]) => void;
}) {
  const [input, setInput] = useState("");

  const add = () => {
    const trimmed = input.trim().toLowerCase().replace(/\s+/g, "_");
    if (trimmed && !value.includes(trimmed)) {
      onChange([...value, trimmed]);
    }
    setInput("");
  };

  const remove = (tag: string) => onChange(value.filter((v) => v !== tag));

  return (
    <div className="space-y-2">
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {value.map((tag) => (
            <Badge
              key={tag}
              variant="outline"
              className="text-[11px] text-cyan-400 border-cyan-500/30 gap-1 pr-1"
            >
              {tag.replace(/_/g, " ")}
              <button type="button" onClick={() => remove(tag)} className="hover:text-red-400 transition-colors">
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
      <div className="flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(); } }}
          placeholder="Ajouter une sous-catégorie..."
          className={`${INPUT_CLASS} flex-1`}
        />
        <Button type="button" variant="outline" size="sm" onClick={add} disabled={!input.trim()} className="border-slate-600 text-slate-200 hover:bg-white shrink-0">
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

export default AdminProPartners;
