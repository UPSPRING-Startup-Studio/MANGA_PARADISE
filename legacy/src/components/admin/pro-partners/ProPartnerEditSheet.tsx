import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Briefcase,
  Loader2,
  Trash2,
  AlertTriangle,
  Save,
  Shield,
  ShieldAlert,
  ShieldOff,
  Lock,
  Globe,
  Star,
  CalendarDays,
  X,
  Plus,
  Facebook,
  Instagram,
  Linkedin,
  Youtube,
  Image as ImageIcon,
  Eye,
  EyeOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  type ProPartner,
  type ProPartnerAdminStatus,
  type PartnerStatus,
  PRO_PARTNER_TYPE_LABELS,
  DIRECTORY_CATEGORY_LABELS,
  PARTNER_STATUS_LABELS,
  PARTNER_STATUS_COLORS,
} from "@/hooks/useProPartner";
import { useUpdateProPartner } from "@/hooks/useProPartner";
import {
  useChangeProPartnerAdminStatus,
  useSoftDeleteProPartner,
} from "@/hooks/useAdminProPartners";
import { useProPartnerEvents } from "@/hooks/useProPartnerEvents";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const INPUT_CLASS =
  "bg-white border-slate-600 text-slate-50 placeholder:text-mp-ink-muted focus-visible:border-[#E84A2B] focus-visible:ring-1 focus-visible:ring-[#E84A2B]/40";

const SUBCATEGORY_SUGGESTIONS = [
  "Librairie", "Boutique spécialisée", "Boutique en ligne", "Bar e-sport", "Bar",
  "Salle Arcade", "Association déclarée", "Enseignement", "Service public institution",
  "Bibliothèque municipale", "Cinéma", "Distributeur", "Streamer / Créateur de contenu",
  "Auteur / Mangaka", "Artiste illustrateur, créateur indépendant",
  "Boutique de retrogaming et personnalisation", "Événement, festival",
  "Centre commercial", "Club sportif (basketball)", "Restaurant", "Anime Streaming",
];

// ── Schema ──

const editPartnerSchema = z.object({
  name: z.string().min(2, "Nom requis"),
  slug: z.string().min(2, "Slug requis").regex(/^[a-z0-9-]+$/, "Minuscules, chiffres et tirets"),
  type: z.string(),
  directory_category: z.string().nullable().optional(),
  subcategories: z.array(z.string()).default([]),
  description: z.string().optional(),
  description_long: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  postal_code: z.string().optional(),
  region: z.string().optional(),
  email: z.string().email("Email invalide").optional().or(z.literal("")),
  phone: z.string().optional(),
  siret: z.string().optional(),
  website_url: z.string().optional(),
  facebook_url: z.string().optional(),
  instagram_url: z.string().optional(),
  twitter_url: z.string().optional(),
  tiktok_url: z.string().optional(),
  youtube_url: z.string().optional(),
  linkedin_url: z.string().optional(),
  logo_url: z.string().optional(),
  banner_url: z.string().optional(),
  partner_status: z.string().default("opportunite"),
  partner_offers: z.string().optional(),
  mp_offers: z.string().optional(),
  member_benefit: z.string().optional(),
  admin_notes: z.string().optional(),
  status: z.enum(["draft", "active", "suspended", "archived"]),
  is_public: z.boolean(),
  is_featured: z.boolean(),
});

type EditPartnerForm = z.infer<typeof editPartnerSchema>;

const ADMIN_STATUS_CONFIG: Record<ProPartnerAdminStatus, { label: string; color: string; icon: typeof Shield; description: string }> = {
  active: { label: "Actif", color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30", icon: Shield, description: "Fonctionnement normal." },
  restricted: { label: "Restreint", color: "bg-amber-500/10 text-amber-400 border-amber-500/30", icon: ShieldAlert, description: "Création d'événements et ajout de membres désactivés." },
  blocked: { label: "Bloqué", color: "bg-red-500/10 text-red-400 border-red-500/30", icon: ShieldOff, description: "Tout en lecture seule." },
};

// ── Dialogs ──

function AdminStatusChangeDialog({ partnerName, targetStatus, open, onOpenChange, onConfirm, isPending }: {
  partnerName: string; targetStatus: ProPartnerAdminStatus | null; open: boolean; onOpenChange: (v: boolean) => void; onConfirm: (reason: string) => void; isPending: boolean;
}) {
  const [reason, setReason] = useState("");
  useEffect(() => { if (!open) setReason(""); }, [open]);
  if (!targetStatus) return null;
  const config = ADMIN_STATUS_CONFIG[targetStatus];
  const isBlocking = targetStatus === "blocked";
  const StatusIcon = config.icon;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-mp-paper border-mp-border">
        <DialogHeader>
          <DialogTitle className={`flex items-center gap-2 ${isBlocking ? "text-red-400" : targetStatus === "restricted" ? "text-amber-400" : "text-emerald-400"}`}>
            <StatusIcon className="h-5 w-5" />{isBlocking ? "Bloquer" : targetStatus === "restricted" ? "Restreindre" : "Lever les restrictions"} {partnerName}
          </DialogTitle>
          <DialogDescription className="text-mp-ink-muted">{config.description}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Motif..." className={`${INPUT_CLASS} resize-none`} rows={3} />
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="border-slate-600 text-slate-200 hover:bg-white" disabled={isPending}>Annuler</Button>
          <Button onClick={() => onConfirm(reason)} disabled={isPending || (isBlocking && !reason.trim())}
            className={isBlocking ? "bg-red-600 hover:bg-red-700 text-white" : targetStatus === "restricted" ? "bg-amber-600 hover:bg-amber-700 text-white" : "bg-emerald-600 hover:bg-emerald-700 text-white"}>
            {isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <StatusIcon className="h-4 w-4 mr-2" />}{isPending ? "En cours..." : "Confirmer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function SoftDeleteConfirmDialog({ partnerName, open, onOpenChange, onConfirm, isPending }: {
  partnerName: string; open: boolean; onOpenChange: (v: boolean) => void; onConfirm: (reason: string) => void; isPending: boolean;
}) {
  const [confirmText, setConfirmText] = useState("");
  const [reason, setReason] = useState("");
  const canDelete = confirmText === "SUPPRIMER" && reason.trim().length > 0;
  useEffect(() => { if (!open) { setConfirmText(""); setReason(""); } }, [open]);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-mp-paper border-mp-border">
        <DialogHeader>
          <DialogTitle className="text-red-400 flex items-center gap-2"><AlertTriangle className="h-5 w-5" />Supprimer {partnerName}</DialogTitle>
          <DialogDescription className="text-mp-ink-muted">Le partenaire sera soft-deleted. Restaurable par un super-admin.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Motif de suppression..." className={`${INPUT_CLASS} resize-none`} rows={2} />
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-200">Tapez <span className="font-mono text-red-400">SUPPRIMER</span></label>
            <Input value={confirmText} onChange={(e) => setConfirmText(e.target.value)} className={INPUT_CLASS} autoComplete="off" />
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="border-slate-600 text-slate-200" disabled={isPending}>Annuler</Button>
          <Button variant="destructive" onClick={() => onConfirm(reason)} disabled={!canDelete || isPending} className="bg-red-600 hover:bg-red-700 text-white">
            {isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}{isPending ? "Suppression..." : "Supprimer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Subcategory chips ──

function SubcategoryChips({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const [input, setInput] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const filtered = SUBCATEGORY_SUGGESTIONS.filter(
    (s) => !value.includes(s.toLowerCase().replace(/[\s/,]+/g, "_")) && s.toLowerCase().includes(input.toLowerCase())
  );
  const add = (raw: string) => {
    const slug = raw.trim().toLowerCase().replace(/[\s/,]+/g, "_");
    if (slug && !value.includes(slug)) onChange([...value, slug]);
    setInput("");
    setShowSuggestions(false);
  };
  const remove = (tag: string) => onChange(value.filter((v) => v !== tag));
  return (
    <div className="space-y-2">
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {value.map((tag) => (
            <Badge key={tag} variant="outline" className="text-[11px] text-cyan-400 border-cyan-500/30 gap-1 pr-1">
              {tag.replace(/_/g, " ")}
              <button type="button" onClick={() => remove(tag)} className="hover:text-red-400"><X className="h-3 w-3" /></button>
            </Badge>
          ))}
        </div>
      )}
      <div className="relative">
        <div className="flex gap-2">
          <Input value={input} onChange={(e) => { setInput(e.target.value); setShowSuggestions(true); }}
            onFocus={() => setShowSuggestions(true)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); if (input.trim()) add(input); } }}
            placeholder="Sous-catégorie..." className={`${INPUT_CLASS} flex-1`} />
          <Button type="button" variant="outline" size="sm" onClick={() => { if (input.trim()) add(input); }} disabled={!input.trim()} className="border-slate-600 text-slate-200 hover:bg-white shrink-0"><Plus className="h-3.5 w-3.5" /></Button>
        </div>
        {showSuggestions && input.length >= 1 && filtered.length > 0 && (
          <div className="absolute z-50 w-full mt-1 rounded-lg border border-mp-border bg-white max-h-32 overflow-y-auto">
            {filtered.slice(0, 6).map((s) => (
              <button key={s} type="button" className="w-full text-left px-3 py-1.5 text-xs text-slate-200 hover:bg-mp-cloud transition-colors" onClick={() => add(s)}>
                {s}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Logo preview ──

function LogoPreview({ url }: { url?: string }) {
  const [error, setError] = useState(false);
  useEffect(() => setError(false), [url]);
  if (!url) return null;
  return (
    <div className="mt-2 flex justify-center">
      {error ? (
        <div className="w-[120px] h-[120px] rounded-lg bg-white border border-mp-border flex items-center justify-center">
          <ImageIcon className="h-8 w-8 text-mp-ink-muted" />
        </div>
      ) : (
        <img src={url} alt="Logo" className="w-[120px] h-[120px] object-contain rounded-lg border border-mp-border bg-white/5" onError={() => setError(true)} />
      )}
    </div>
  );
}

// ── Tab filled indicator ──

function TabDot({ filled }: { filled: boolean }) {
  if (!filled) return null;
  return <span className="w-1.5 h-1.5 rounded-full bg-[#E84A2B] ml-1.5" />;
}

// ── Main Sheet ──

interface ProPartnerEditSheetProps {
  partner: ProPartner | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

export default function ProPartnerEditSheet({ partner, open, onOpenChange }: ProPartnerEditSheetProps) {
  const updatePartner = useUpdateProPartner();
  const changeAdminStatus = useChangeProPartnerAdminStatus();
  const softDelete = useSoftDeleteProPartner();
  const { data: events } = useProPartnerEvents(partner?.id);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [targetAdminStatus, setTargetAdminStatus] = useState<ProPartnerAdminStatus | null>(null);
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(true); // true in edit mode

  const form = useForm<EditPartnerForm>({
    resolver: zodResolver(editPartnerSchema),
    defaultValues: { name: "", slug: "", type: "societe", directory_category: null, subcategories: [], description: "", description_long: "",
      address: "", city: "", postal_code: "", region: "", email: "", phone: "", siret: "",
      website_url: "", facebook_url: "", instagram_url: "", twitter_url: "", tiktok_url: "", youtube_url: "", linkedin_url: "",
      logo_url: "", banner_url: "", partner_status: "opportunite", partner_offers: "", mp_offers: "", member_benefit: "", admin_notes: "",
      status: "active", is_public: false, is_featured: false },
  });

  useEffect(() => {
    if (partner && open) {
      form.reset({
        name: partner.name || "", slug: partner.slug || "", type: partner.type || "societe",
        directory_category: partner.directory_category || null, subcategories: partner.subcategories || [],
        description: partner.description || "", description_long: partner.description_long || "",
        address: partner.address || "", city: partner.city || "", postal_code: partner.postal_code || "", region: partner.region || "",
        email: partner.email || "", phone: partner.phone || "", siret: partner.siret || "",
        website_url: partner.website_url || "",
        facebook_url: (partner as any).facebook_url || "", instagram_url: (partner as any).instagram_url || "",
        twitter_url: (partner as any).twitter_url || "", tiktok_url: (partner as any).tiktok_url || "",
        youtube_url: (partner as any).youtube_url || "", linkedin_url: (partner as any).linkedin_url || "",
        logo_url: partner.logo_url || "", banner_url: partner.banner_url || "",
        partner_status: (partner as any).partner_status || "opportunite",
        partner_offers: (partner as any).partner_offers || "", mp_offers: (partner as any).mp_offers || "",
        member_benefit: partner.member_benefit || "", admin_notes: partner.admin_notes || "",
        status: (partner.status as EditPartnerForm["status"]) || "active",
        is_public: partner.is_public ?? false, is_featured: partner.is_featured ?? false,
      });
      setSlugManuallyEdited(true);
    }
  }, [partner, open, form]);

  const handleSave = (data: EditPartnerForm) => {
    if (!partner) return;
    updatePartner.mutate({
      id: partner.id,
      data: {
        name: data.name, slug: data.slug, type: data.type,
        directory_category: data.directory_category || null, subcategories: data.subcategories,
        description: data.description || null, description_long: data.description_long || null,
        address: data.address || null, city: data.city || null, postal_code: data.postal_code || null, region: data.region || null,
        email: data.email || null, phone: data.phone || null, siret: data.siret || null,
        website_url: data.website_url || null,
        facebook_url: data.facebook_url || null, instagram_url: data.instagram_url || null,
        twitter_url: data.twitter_url || null, tiktok_url: data.tiktok_url || null,
        youtube_url: data.youtube_url || null, linkedin_url: data.linkedin_url || null,
        logo_url: data.logo_url || null, banner_url: data.banner_url || null,
        partner_status: data.partner_status, partner_offers: data.partner_offers || null, mp_offers: data.mp_offers || null,
        member_benefit: data.member_benefit || null, admin_notes: data.admin_notes || null,
        status: data.status, is_public: data.is_public, is_featured: data.is_featured,
      },
    }, { onSuccess: () => onOpenChange(false) });
  };

  const openAdminStatusDialog = (s: ProPartnerAdminStatus) => { setTargetAdminStatus(s); setStatusDialogOpen(true); };
  const handleAdminStatusChange = (reason: string) => {
    if (!partner || !targetAdminStatus) return;
    changeAdminStatus.mutate({ partnerId: partner.id, adminStatus: targetAdminStatus, reason: reason || undefined },
      { onSuccess: () => { setStatusDialogOpen(false); setTargetAdminStatus(null); } });
  };
  const handleSoftDelete = (reason: string) => {
    if (!partner) return;
    softDelete.mutate({ partnerId: partner.id, reason }, { onSuccess: () => { setDeleteDialogOpen(false); onOpenChange(false); } });
  };

  if (!partner) return null;

  const currentAdminStatus = (partner.admin_status || "active") as ProPartnerAdminStatus;
  const adminConfig = ADMIN_STATUS_CONFIG[currentAdminStatus];
  const AdminStatusIcon = adminConfig.icon;
  const watchedValues = form.watch();

  // Tab filled indicators
  const tab2Filled = !!(watchedValues.website_url || watchedValues.facebook_url || watchedValues.instagram_url || watchedValues.logo_url);
  const tab3Filled = !!((watchedValues.partner_status && watchedValues.partner_status !== "opportunite") || watchedValues.partner_offers || watchedValues.mp_offers || watchedValues.member_benefit);
  const tab4Filled = watchedValues.is_public || watchedValues.is_featured;

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="sm:max-w-xl bg-mp-paper border-mp-border overflow-y-auto p-0">
          <div className="px-6 pt-6">
            <SheetHeader>
              <SheetTitle className="text-slate-50 flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-[#E84A2B]" />
                Éditer le partenaire
              </SheetTitle>
              <div className="text-sm text-mp-ink-muted flex items-center gap-2 flex-wrap">
                <span>{partner.name}</span>
                <Badge variant="outline" className={`text-[10px] ${adminConfig.color}`}>
                  <AdminStatusIcon className="h-2.5 w-2.5 mr-1" />{adminConfig.label}
                </Badge>
                {(partner as any).partner_status && (partner as any).partner_status !== "opportunite" && (
                  <Badge variant="outline" className={`text-[10px] ${PARTNER_STATUS_COLORS[(partner as any).partner_status as PartnerStatus] || ""}`}>
                    {PARTNER_STATUS_LABELS[(partner as any).partner_status as PartnerStatus]}
                  </Badge>
                )}
              </div>
            </SheetHeader>

            {currentAdminStatus !== "active" && (
              <div className={`mt-4 rounded-lg border p-3 ${currentAdminStatus === "blocked" ? "bg-red-500/10 border-red-500/20" : "bg-amber-500/10 border-amber-500/20"}`}>
                <div className="flex items-start gap-2">
                  <AdminStatusIcon className={`h-4 w-4 mt-0.5 shrink-0 ${currentAdminStatus === "blocked" ? "text-red-400" : "text-amber-400"}`} />
                  <div>
                    <p className={`text-sm font-medium ${currentAdminStatus === "blocked" ? "text-red-300" : "text-amber-300"}`}>
                      Partenaire {adminConfig.label.toLowerCase()} par l'administration
                    </p>
                    {partner.admin_status_reason && <p className="text-xs text-mp-ink-muted mt-1">Motif : {partner.admin_status_reason}</p>}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="mt-4">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSave)}>
                <Tabs defaultValue="identity" className="w-full">
                  <div className="px-6">
                    <TabsList className="w-full bg-white/50 border border-mp-border/50 grid grid-cols-4 h-9">
                      <TabsTrigger value="identity" className="text-xs data-[state=active]:bg-[#E84A2B]/10 data-[state=active]:text-[#E84A2B]">Identité</TabsTrigger>
                      <TabsTrigger value="socials" className="text-xs data-[state=active]:bg-[#E84A2B]/10 data-[state=active]:text-[#E84A2B] flex items-center">Réseaux<TabDot filled={tab2Filled} /></TabsTrigger>
                      <TabsTrigger value="partnership" className="text-xs data-[state=active]:bg-[#E84A2B]/10 data-[state=active]:text-[#E84A2B] flex items-center">Partenariat<TabDot filled={tab3Filled} /></TabsTrigger>
                      <TabsTrigger value="visibility" className="text-xs data-[state=active]:bg-[#E84A2B]/10 data-[state=active]:text-[#E84A2B] flex items-center">Annuaire<TabDot filled={tab4Filled} /></TabsTrigger>
                    </TabsList>
                  </div>

                  {/* ═══ Tab 1: Identité ═══ */}
                  <TabsContent value="identity" className="px-6 space-y-4 mt-4">
                    <FormField control={form.control} name="name" render={({ field }) => (
                      <FormItem><FormLabel className="text-slate-200">Nom *</FormLabel>
                        <FormControl><Input {...field} onChange={(e) => { field.onChange(e); if (!slugManuallyEdited) form.setValue("slug", e.target.value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"")); }} className={INPUT_CLASS} /></FormControl>
                        <FormMessage className="text-[#F5A623]" /></FormItem>
                    )} />
                    <FormField control={form.control} name="slug" render={({ field }) => (
                      <FormItem><FormLabel className="text-slate-200">Slug *</FormLabel>
                        <FormControl><Input {...field} onChange={(e) => { field.onChange(e); setSlugManuallyEdited(true); }} className={INPUT_CLASS} /></FormControl>
                        <FormMessage className="text-[#F5A623]" /></FormItem>
                    )} />
                    <div className="grid grid-cols-2 gap-4">
                      <FormField control={form.control} name="type" render={({ field }) => (
                        <FormItem><FormLabel className="text-slate-200">Type</FormLabel>
                          <Select value={field.value} onValueChange={field.onChange}>
                            <FormControl><SelectTrigger className={INPUT_CLASS}><SelectValue /></SelectTrigger></FormControl>
                            <SelectContent position="popper" className="z-[200]">{Object.entries(PRO_PARTNER_TYPE_LABELS).map(([k,v])=>(<SelectItem key={k} value={k}>{v}</SelectItem>))}</SelectContent>
                          </Select></FormItem>
                      )} />
                      <FormField control={form.control} name="directory_category" render={({ field }) => (
                        <FormItem><FormLabel className="text-slate-200">Catégorie</FormLabel>
                          <Select value={field.value || "none"} onValueChange={(v)=>field.onChange(v==="none"?null:v)}>
                            <FormControl><SelectTrigger className={INPUT_CLASS}><SelectValue /></SelectTrigger></FormControl>
                            <SelectContent position="popper" className="z-[200]"><SelectItem value="none">Non catégorisé</SelectItem>{Object.entries(DIRECTORY_CATEGORY_LABELS).map(([k,v])=>(<SelectItem key={k} value={k}>{v}</SelectItem>))}</SelectContent>
                          </Select></FormItem>
                      )} />
                    </div>
                    <FormField control={form.control} name="subcategories" render={({ field }) => (
                      <FormItem><FormLabel className="text-slate-200">Sous-catégories</FormLabel><FormControl><SubcategoryChips value={field.value} onChange={field.onChange} /></FormControl></FormItem>
                    )} />
                    <FormField control={form.control} name="description" render={({ field }) => (
                      <FormItem><FormLabel className="text-slate-200">Description</FormLabel><FormControl><Textarea {...field} className={`${INPUT_CLASS} resize-none`} rows={2} /></FormControl></FormItem>
                    )} />
                    <FormField control={form.control} name="address" render={({ field }) => (
                      <FormItem><FormLabel className="text-slate-200">Adresse</FormLabel><FormControl><Input {...field} className={INPUT_CLASS} /></FormControl></FormItem>
                    )} />
                    <div className="grid grid-cols-3 gap-3">
                      <FormField control={form.control} name="city" render={({ field }) => (<FormItem><FormLabel className="text-slate-200">Ville</FormLabel><FormControl><Input {...field} className={INPUT_CLASS} /></FormControl></FormItem>)} />
                      <FormField control={form.control} name="postal_code" render={({ field }) => (<FormItem><FormLabel className="text-slate-200">Code postal</FormLabel><FormControl><Input {...field} className={INPUT_CLASS} /></FormControl></FormItem>)} />
                      <FormField control={form.control} name="region" render={({ field }) => (<FormItem><FormLabel className="text-slate-200">Région</FormLabel><FormControl><Input {...field} className={INPUT_CLASS} /></FormControl></FormItem>)} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <FormField control={form.control} name="email" render={({ field }) => (<FormItem><FormLabel className="text-slate-200">Email</FormLabel><FormControl><Input {...field} type="email" className={INPUT_CLASS} /></FormControl><FormMessage className="text-[#F5A623]" /></FormItem>)} />
                      <FormField control={form.control} name="phone" render={({ field }) => (<FormItem><FormLabel className="text-slate-200">Téléphone</FormLabel><FormControl><Input {...field} type="tel" className={INPUT_CLASS} /></FormControl></FormItem>)} />
                    </div>
                    <FormField control={form.control} name="siret" render={({ field }) => (<FormItem><FormLabel className="text-slate-200">SIRET</FormLabel><FormControl><Input {...field} className={INPUT_CLASS} /></FormControl></FormItem>)} />
                  </TabsContent>

                  {/* ═══ Tab 2: Réseaux & Médias ═══ */}
                  <TabsContent value="socials" className="px-6 space-y-4 mt-4">
                    <FormField control={form.control} name="website_url" render={({ field }) => (<FormItem><FormLabel className="text-slate-200 flex items-center gap-1.5"><Globe className="h-3.5 w-3.5" />Site internet</FormLabel><FormControl><Input {...field} placeholder="https://..." className={INPUT_CLASS} /></FormControl></FormItem>)} />
                    <FormField control={form.control} name="facebook_url" render={({ field }) => (<FormItem><FormLabel className="text-slate-200 flex items-center gap-1.5"><Facebook className="h-3.5 w-3.5" />Facebook</FormLabel><FormControl><Input {...field} placeholder="https://facebook.com/..." className={INPUT_CLASS} /></FormControl></FormItem>)} />
                    <FormField control={form.control} name="instagram_url" render={({ field }) => (<FormItem><FormLabel className="text-slate-200 flex items-center gap-1.5"><Instagram className="h-3.5 w-3.5" />Instagram</FormLabel><FormControl><Input {...field} placeholder="https://instagram.com/..." className={INPUT_CLASS} /></FormControl></FormItem>)} />
                    <FormField control={form.control} name="twitter_url" render={({ field }) => (<FormItem><FormLabel className="text-slate-200 flex items-center gap-1.5">𝕏 Twitter / X</FormLabel><FormControl><Input {...field} placeholder="https://x.com/..." className={INPUT_CLASS} /></FormControl></FormItem>)} />
                    <FormField control={form.control} name="tiktok_url" render={({ field }) => (<FormItem><FormLabel className="text-slate-200">TikTok</FormLabel><FormControl><Input {...field} placeholder="https://tiktok.com/@..." className={INPUT_CLASS} /></FormControl></FormItem>)} />
                    <FormField control={form.control} name="youtube_url" render={({ field }) => (<FormItem><FormLabel className="text-slate-200 flex items-center gap-1.5"><Youtube className="h-3.5 w-3.5" />YouTube</FormLabel><FormControl><Input {...field} placeholder="https://youtube.com/..." className={INPUT_CLASS} /></FormControl></FormItem>)} />
                    <FormField control={form.control} name="linkedin_url" render={({ field }) => (<FormItem><FormLabel className="text-slate-200 flex items-center gap-1.5"><Linkedin className="h-3.5 w-3.5" />LinkedIn</FormLabel><FormControl><Input {...field} placeholder="https://linkedin.com/..." className={INPUT_CLASS} /></FormControl></FormItem>)} />
                    <Separator className="bg-mp-cloud/50" />
                    <FormField control={form.control} name="logo_url" render={({ field }) => (
                      <FormItem><FormLabel className="text-slate-200 flex items-center gap-1.5"><ImageIcon className="h-3.5 w-3.5" />URL du logo</FormLabel>
                        <FormControl><Input {...field} placeholder="https://..." className={INPUT_CLASS} /></FormControl>
                        <LogoPreview url={field.value} />
                      </FormItem>
                    )} />
                  </TabsContent>

                  {/* ═══ Tab 3: Partenariat ═══ */}
                  <TabsContent value="partnership" className="px-6 space-y-4 mt-4">
                    <FormField control={form.control} name="partner_status" render={({ field }) => (
                      <FormItem><FormLabel className="text-slate-200">État partenaire (pipeline CRM)</FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <FormControl><SelectTrigger className={INPUT_CLASS}><SelectValue /></SelectTrigger></FormControl>
                          <SelectContent position="popper" className="z-[200]">
                            {Object.entries(PARTNER_STATUS_LABELS).map(([k, v]) => (
                              <SelectItem key={k} value={k}>
                                <span className="flex items-center gap-2">
                                  <span className={`w-2 h-2 rounded-full ${PARTNER_STATUS_COLORS[k as PartnerStatus]?.split(" ")[0]?.replace("/10", "") || "bg-slate-400"}`} style={{ backgroundColor: k === "opportunite" ? "#f97316" : k === "mail_envoye" ? "#eab308" : k === "en_cours_edition" ? "#3b82f6" : k === "attente_signature" ? "#8b5cf6" : k === "accord_principe" ? "#06b6d4" : "#22c55e" }} />
                                  {v}
                                </span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="partner_offers" render={({ field }) => (
                      <FormItem><FormLabel className="text-slate-200">Ce que le partenaire offre</FormLabel>
                        <FormControl><Textarea {...field} placeholder="Ex : Réductions membres, espace d'affichage, lots pour événements..." className={`${INPUT_CLASS} resize-none`} rows={3} /></FormControl></FormItem>
                    )} />
                    <FormField control={form.control} name="mp_offers" render={({ field }) => (
                      <FormItem><FormLabel className="text-slate-200">Ce que Manga Paradise offre</FormLabel>
                        <FormControl><Textarea {...field} placeholder="Ex : Visibilité annuaire, posts réseaux sociaux, stand lors d'événements..." className={`${INPUT_CLASS} resize-none`} rows={3} /></FormControl></FormItem>
                    )} />
                    <Separator className="bg-mp-cloud/50" />
                    <FormField control={form.control} name="member_benefit" render={({ field }) => (
                      <FormItem><FormLabel className="text-slate-200">Avantage visible par les membres</FormLabel>
                        <FormControl><Textarea {...field} placeholder="Ex : -10% sur présentation de la carte membre" className={`${INPUT_CLASS} resize-none`} rows={2} /></FormControl>
                        <p className="text-[11px] text-mp-ink-muted">Cet avantage sera affiché publiquement sur la fiche annuaire si le partenaire est visible.</p></FormItem>
                    )} />
                    <FormField control={form.control} name="admin_notes" render={({ field }) => (
                      <FormItem><FormLabel className="text-slate-200 flex items-center gap-1.5"><Lock className="h-3 w-3 text-mp-ink-muted" />Notes internes</FormLabel>
                        <FormControl><Textarea {...field} placeholder="Notes internes..." className={`${INPUT_CLASS} resize-none`} rows={2} /></FormControl></FormItem>
                    )} />
                  </TabsContent>

                  {/* ═══ Tab 4: Annuaire & Visibilité ═══ */}
                  <TabsContent value="visibility" className="px-6 space-y-5 mt-4">
                    <FormField control={form.control} name="status" render={({ field }) => (
                      <FormItem><FormLabel className="text-slate-200">Statut métier</FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <FormControl><SelectTrigger className={INPUT_CLASS}><SelectValue /></SelectTrigger></FormControl>
                          <SelectContent position="popper" className="z-[200]">
                            <SelectItem value="active">Actif</SelectItem><SelectItem value="suspended">Suspendu</SelectItem>
                            <SelectItem value="archived">Archivé</SelectItem><SelectItem value="draft">Brouillon</SelectItem>
                          </SelectContent>
                        </Select></FormItem>
                    )} />
                    <FormField control={form.control} name="is_public" render={({ field }) => (
                      <FormItem className="flex items-start gap-3 space-y-0 rounded-lg border border-mp-border p-4">
                        <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                        <div><FormLabel className="text-slate-200 flex items-center gap-1.5 cursor-pointer"><Globe className="h-3.5 w-3.5 text-cyan-400" />Visible dans l'annuaire</FormLabel>
                          <p className="text-[11px] text-mp-ink-muted mt-1">Rend ce partenaire visible dans l'annuaire public. La visibilité annuaire fait partie du business model.</p></div>
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="is_featured" render={({ field }) => (
                      <FormItem className="flex items-start gap-3 space-y-0 rounded-lg border border-mp-border p-4">
                        <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} disabled={!watchedValues.is_public} /></FormControl>
                        <div><FormLabel className={`flex items-center gap-1.5 cursor-pointer ${watchedValues.is_public ? "text-slate-200" : "text-mp-ink-muted"}`}><Star className="h-3.5 w-3.5 text-yellow-400" />Mis en avant</FormLabel>
                          <p className="text-[11px] text-mp-ink-muted mt-1">Affiche ce partenaire en priorité avec un badge "Partenaire vedette".</p></div>
                      </FormItem>
                    )} />

                    <Separator className="bg-mp-cloud/50" />

                    {/* Gouvernance */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2"><Shield className="h-4 w-4 text-[#E84A2B]" /><h3 className="text-sm font-semibold text-[#E84A2B] uppercase tracking-wider">Gouvernance</h3></div>
                      <div className={`rounded-lg border p-3 ${adminConfig.color}`}>
                        <div className="flex items-center gap-2"><AdminStatusIcon className="h-4 w-4" /><span className="text-sm font-medium">Statut admin : {adminConfig.label}</span></div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {currentAdminStatus === "active" && (<>
                          <Button type="button" variant="outline" size="sm" className="border-amber-500/30 text-amber-400 hover:bg-amber-500/10" onClick={()=>openAdminStatusDialog("restricted")}><ShieldAlert className="h-3.5 w-3.5 mr-1.5" />Restreindre</Button>
                          <Button type="button" variant="outline" size="sm" className="border-red-500/30 text-red-400 hover:bg-red-500/10" onClick={()=>openAdminStatusDialog("blocked")}><Lock className="h-3.5 w-3.5 mr-1.5" />Bloquer</Button>
                        </>)}
                        {currentAdminStatus === "restricted" && (<>
                          <Button type="button" variant="outline" size="sm" className="border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10" onClick={()=>openAdminStatusDialog("active")}><Shield className="h-3.5 w-3.5 mr-1.5" />Lever la restriction</Button>
                          <Button type="button" variant="outline" size="sm" className="border-red-500/30 text-red-400 hover:bg-red-500/10" onClick={()=>openAdminStatusDialog("blocked")}><Lock className="h-3.5 w-3.5 mr-1.5" />Bloquer</Button>
                        </>)}
                        {currentAdminStatus === "blocked" && (
                          <Button type="button" variant="outline" size="sm" className="border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10" onClick={()=>openAdminStatusDialog("active")}><Shield className="h-3.5 w-3.5 mr-1.5" />Lever le blocage</Button>
                        )}
                      </div>
                    </div>

                    <Separator className="bg-mp-cloud/50" />

                    {/* Events */}
                    <div className="space-y-3">
                      <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2"><CalendarDays className="h-4 w-4" />Événements liés</h3>
                      <p className="text-xs text-mp-ink-muted">{events?.length ?? 0} événement{(events?.length ?? 0) > 1 ? "s" : ""}</p>
                      {events && events.length > 0 && (
                        <div className="space-y-1.5 max-h-32 overflow-y-auto">
                          {events.slice(0, 5).map((ev: any) => (
                            <div key={ev.id} className="flex items-center gap-2 rounded-md bg-white/50 px-3 py-2 text-xs">
                              <CalendarDays className="h-3 w-3 text-mp-ink-muted shrink-0" />
                              <span className="text-slate-200 truncate flex-1">{ev.title}</span>
                              <span className="text-mp-ink-muted shrink-0">{ev.date ? format(new Date(ev.date), "d MMM yyyy", { locale: fr }) : "—"}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Zone dangereuse */}
                    <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-4">
                      <h4 className="text-sm font-semibold text-red-400 mb-1 flex items-center gap-1.5"><AlertTriangle className="h-3.5 w-3.5" />Zone dangereuse</h4>
                      <p className="text-xs text-mp-ink-muted mb-3">Suppression soft-delete, restaurable par un super-admin.</p>
                      <Button type="button" variant="outline" size="sm" className="border-red-500/30 text-red-400 hover:bg-red-500/10" onClick={()=>setDeleteDialogOpen(true)}>
                        <Trash2 className="h-3.5 w-3.5 mr-1.5" />Supprimer
                      </Button>
                    </div>
                  </TabsContent>
                </Tabs>

                {/* Sticky save bar */}
                <div className="sticky bottom-0 bg-mp-paper border-t border-mp-border px-6 py-4 flex gap-3 mt-4">
                  <Button type="button" variant="outline" className="flex-1 border-slate-500 text-slate-100 hover:bg-white" onClick={()=>onOpenChange(false)} disabled={updatePartner.isPending}>Annuler</Button>
                  <Button type="submit" className="flex-1 bg-gradient-to-r from-[#E84A2B] to-[#F26B2E] hover:from-[#D43D20] hover:to-[#E25E25] text-white" disabled={updatePartner.isPending}>
                    {updatePartner.isPending ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Enregistrement...</> : <><Save className="h-4 w-4 mr-2" />Enregistrer</>}
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        </SheetContent>
      </Sheet>
      {partner && <AdminStatusChangeDialog partnerName={partner.name} targetStatus={targetAdminStatus} open={statusDialogOpen} onOpenChange={setStatusDialogOpen} onConfirm={handleAdminStatusChange} isPending={changeAdminStatus.isPending} />}
      {partner && <SoftDeleteConfirmDialog partnerName={partner.name} open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen} onConfirm={handleSoftDelete} isPending={softDelete.isPending} />}
    </>
  );
}
