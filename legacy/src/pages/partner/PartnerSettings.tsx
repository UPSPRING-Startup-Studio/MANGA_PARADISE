import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useProfile } from "@/hooks/useProfile";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  Building2, 
  FileText, 
  Handshake,
  AlertTriangle,
  Save,
  Upload,
  Check,
  Globe,
  Instagram,
  Facebook,
  Clock,
  FileCheck,
  PenLine,
  CheckCircle2
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { cn } from "@/lib/utils";

// ===== Form Schema =====
const partnerSettingsSchema = z.object({
  // Public Identity
  partner_company_name: z.string().min(2, "Le nom est requis"),
  partner_logo_url: z.string().optional(),
  partner_category: z.string().min(1, "Sélectionnez une catégorie"),
  partner_subcategory: z.string().optional(),
  partner_description: z.string().min(10, "Description trop courte"),
  partner_website: z.string().url().optional().or(z.literal("")),
  partner_facebook: z.string().optional(),
  partner_instagram: z.string().optional(),
  partner_cover_url: z.string().optional(),
  // Legal Information
  partner_siret: z.string().regex(/^\d{14}$/, "SIRET invalide (14 chiffres)").optional().or(z.literal("")),
  partner_legal_form: z.string().min(1, "Sélectionnez une forme juridique"),
  partner_address: z.string().min(5, "Adresse requise"),
  partner_postal_code: z.string().regex(/^\d{5}$/, "Code postal invalide"),
  partner_city: z.string().min(2, "Ville requise"),
  partner_representative_name: z.string().min(2, "Nom du représentant requis"),
  partner_representative_function: z.string().min(2, "Fonction requise"),
  partner_admin_email: z.string().email("Email invalide"),
  partner_contact_name: z.string().optional(),
});

type PartnerSettingsFormData = z.infer<typeof partnerSettingsSchema>;

// ===== Categories =====
const partnerCategories = [
  { value: "acteurs-publics", label: "Acteurs publics" },
  { value: "boutiques-librairies", label: "Boutiques & librairies" },
  { value: "cinemas", label: "Cinémas" },
  { value: "restauration", label: "Restauration" },
  { value: "partenaires-associatifs", label: "Partenaires associatifs" },
  { value: "artistes-createurs", label: "Artistes & créateurs" },
  { value: "evenements-lieux-culturels", label: "Événements & lieux culturels" },
];

const legalForms = [
  { value: "association", label: "Association loi 1901" },
  { value: "sarl", label: "SARL" },
  { value: "sas", label: "SAS" },
  { value: "eurl", label: "EURL" },
  { value: "auto-entrepreneur", label: "Auto-entrepreneur" },
  { value: "collectivite", label: "Collectivité territoriale" },
  { value: "etablissement-public", label: "Établissement public" },
];

// ===== Counterparts Data =====
const partnerOffers = [
  { id: "merch", label: "Merchandising / Produits", category: "Produits/Services", emoji: "🎁" },
  { id: "reductions", label: "Réductions membres", category: "Produits/Services", emoji: "🎁" },
  { id: "dotations", label: "Dotations concours", category: "Produits/Services", emoji: "🎁" },
  { id: "bons-achat", label: "Bons d'achat", category: "Produits/Services", emoji: "🎁" },
  { id: "goodies", label: "Goodies", category: "Produits/Services", emoji: "🎁" },
  { id: "partage-reseaux", label: "Partage réseaux sociaux", category: "Communication", emoji: "📣" },
  { id: "article-presse", label: "Article presse", category: "Communication", emoji: "📣" },
  { id: "affichage-pdv", label: "Affichage point de vente", category: "Communication", emoji: "📣" },
  { id: "newsletter", label: "Newsletter", category: "Communication", emoji: "📣" },
  { id: "mobilier", label: "Fourniture mobilier", category: "Logistique", emoji: "🏗️" },
  { id: "materiel", label: "Prêt matériel technique", category: "Logistique", emoji: "🏗️" },
  { id: "salle", label: "Mise à disposition salle/lieu", category: "Logistique", emoji: "🏗️" },
  { id: "event-cobrande", label: "Événement co-brandé", category: "Animation", emoji: "🤡" },
  { id: "intervention", label: "Intervention sur site", category: "Animation", emoji: "🤡" },
  { id: "cosplayers", label: "Présence cosplayers", category: "Animation", emoji: "🤡" },
];

const associationOffers = [
  { id: "logo-affiches", label: "Logo sur affiches", category: "Visibilité Événementielle", emoji: "👀" },
  { id: "kakemonos", label: "Kakémonos", category: "Visibilité Événementielle", emoji: "👀" },
  { id: "flyers", label: "Flyers", category: "Visibilité Événementielle", emoji: "👀" },
  { id: "panneau-partenaire", label: "Panneau partenaire", category: "Visibilité Événementielle", emoji: "👀" },
  { id: "mention-micro", label: "Mention micro", category: "Visibilité Événementielle", emoji: "👀" },
  { id: "lien-site", label: "Lien sur site web", category: "Visibilité Digitale", emoji: "💻" },
  { id: "page-partenaires", label: "Page partenaires dédiée", category: "Visibilité Digitale", emoji: "💻" },
  { id: "story-instagram", label: "Story Instagram", category: "Visibilité Digitale", emoji: "💻" },
  { id: "post-dedie", label: "Post dédié", category: "Visibilité Digitale", emoji: "💻" },
  { id: "places-offertes", label: "Places offertes", category: "Avantages Exclusifs", emoji: "🎫" },
  { id: "reductions-salaries", label: "Réductions salariés", category: "Avantages Exclusifs", emoji: "🎫" },
  { id: "bilan-post-event", label: "Bilan post-événement", category: "Avantages Exclusifs", emoji: "🎫" },
];

// ===== Status Config =====
const statusConfig: Record<string, { label: string; icon: typeof Clock; color: string; bg: string }> = {
  incomplete: { label: "En attente de validation", icon: Clock, color: "text-red-400", bg: "bg-red-500/20 border-red-500/30" },
  draft: { label: "Convention en cours de rédaction", icon: PenLine, color: "text-amber-400", bg: "bg-amber-500/20 border-amber-500/30" },
  pending_signature: { label: "En attente de signature", icon: FileCheck, color: "text-blue-400", bg: "bg-blue-500/20 border-blue-500/30" },
  active: { label: "Partenariat Actif & Signé", icon: CheckCircle2, color: "text-emerald-400", bg: "bg-emerald-500/20 border-emerald-500/30" },
};

const PartnerSettings = () => {
  const { profile, updateProfile, loading } = useProfile();
  const [selectedOffers, setSelectedOffers] = useState<string[]>([]);
  const [selectedRequests, setSelectedRequests] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("identity");

  // Extended profile type
  const extendedProfile = profile as typeof profile & {
    partner_logo_url?: string;
    partner_category?: string;
    partner_subcategory?: string;
    partner_description?: string;
    partner_website?: string;
    partner_facebook?: string;
    partner_instagram?: string;
    partner_cover_url?: string;
    partner_legal_form?: string;
    partner_address?: string;
    partner_postal_code?: string;
    partner_city?: string;
    partner_representative_name?: string;
    partner_representative_function?: string;
    partner_admin_email?: string;
    partner_offers?: string[];
    partner_requests?: string[];
    partner_convention_status?: string;
  };

  const conventionStatus = extendedProfile?.partner_convention_status || "incomplete";
  const StatusIcon = statusConfig[conventionStatus]?.icon || Clock;

  const form = useForm<PartnerSettingsFormData>({
    resolver: zodResolver(partnerSettingsSchema),
    defaultValues: {
      partner_company_name: "",
      partner_logo_url: "",
      partner_category: "",
      partner_subcategory: "",
      partner_description: "",
      partner_website: "",
      partner_facebook: "",
      partner_instagram: "",
      partner_cover_url: "",
      partner_siret: "",
      partner_legal_form: "",
      partner_address: "",
      partner_postal_code: "",
      partner_city: "",
      partner_representative_name: "",
      partner_representative_function: "",
      partner_admin_email: "",
      partner_contact_name: "",
    },
  });

  // Load profile data
  useEffect(() => {
    if (extendedProfile) {
      form.reset({
        partner_company_name: extendedProfile.partner_company_name || "",
        partner_logo_url: extendedProfile.partner_logo_url || "",
        partner_category: extendedProfile.partner_category || "",
        partner_subcategory: extendedProfile.partner_subcategory || "",
        partner_description: extendedProfile.partner_description || "",
        partner_website: extendedProfile.partner_website || "",
        partner_facebook: extendedProfile.partner_facebook || "",
        partner_instagram: extendedProfile.partner_instagram || "",
        partner_cover_url: extendedProfile.partner_cover_url || "",
        partner_siret: extendedProfile.partner_siret || "",
        partner_legal_form: extendedProfile.partner_legal_form || "",
        partner_address: extendedProfile.partner_address || "",
        partner_postal_code: extendedProfile.partner_postal_code || "",
        partner_city: extendedProfile.partner_city || "",
        partner_representative_name: extendedProfile.partner_representative_name || "",
        partner_representative_function: extendedProfile.partner_representative_function || "",
        partner_admin_email: extendedProfile.partner_admin_email || "",
        partner_contact_name: extendedProfile.partner_contact_name || "",
      });
      setSelectedOffers(extendedProfile.partner_offers || []);
      setSelectedRequests(extendedProfile.partner_requests || []);
    }
  }, [extendedProfile, form]);

  const toggleOffer = (id: string) => {
    setSelectedOffers(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const toggleRequest = (id: string) => {
    setSelectedRequests(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const onSubmit = async (data: PartnerSettingsFormData) => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          ...data,
          partner_offers: selectedOffers,
          partner_requests: selectedRequests,
          updated_at: new Date().toISOString(),
        } as any)
        .eq("id", profile?.id);

      if (error) throw error;
      toast.success("Modifications enregistrées pour la convention");
    } catch (error) {
      console.error(error);
      toast.error("Erreur lors de la sauvegarde");
    } finally {
      setIsSaving(false);
    }
  };

  // Group counterparts by category
  const groupByCategory = (items: typeof partnerOffers) => {
    return items.reduce((acc, item) => {
      if (!acc[item.category]) acc[item.category] = [];
      acc[item.category].push(item);
      return acc;
    }, {} as Record<string, typeof partnerOffers>);
  };

  const offersGrouped = groupByCategory(partnerOffers);
  const requestsGrouped = groupByCategory(associationOffers);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-2 border-partner-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-bold text-white mb-2">Dossier de Partenariat</h1>
        <p className="text-partner-muted">
          Configurez votre profil et vos préférences pour la convention de partenariat.
        </p>
      </motion.div>

      {/* Status Bar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className={cn(
          "border",
          statusConfig[conventionStatus]?.bg || "bg-white/50 border-white/10"
        )}>
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <StatusIcon className={cn("w-5 h-5", statusConfig[conventionStatus]?.color)} />
              <span className={cn("font-medium", statusConfig[conventionStatus]?.color)}>
                {statusConfig[conventionStatus]?.label || "Statut inconnu"}
              </span>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Warning Banner */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        <Card className="bg-amber-500/10 border-amber-500/30">
          <CardContent className="py-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <p className="text-sm text-amber-200">
                <strong>Important :</strong> Ces informations sont essentielles pour l'édition de votre Convention de Partenariat. Assurez-vous de leur exactitude avant d'enregistrer.
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Form */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="bg-partner-sidebar border border-partner-border w-full justify-start">
              <TabsTrigger 
                value="identity" 
                className="data-[state=active]:bg-partner-gold/20 data-[state=active]:text-partner-gold"
              >
                <Building2 className="w-4 h-4 mr-2" />
                Identité Publique
              </TabsTrigger>
              <TabsTrigger 
                value="legal"
                className="data-[state=active]:bg-partner-gold/20 data-[state=active]:text-partner-gold"
              >
                <FileText className="w-4 h-4 mr-2" />
                Informations Légales
              </TabsTrigger>
              <TabsTrigger 
                value="counterparts"
                className="data-[state=active]:bg-partner-gold/20 data-[state=active]:text-partner-gold"
              >
                <Handshake className="w-4 h-4 mr-2" />
                Contreparties
              </TabsTrigger>
            </TabsList>

            {/* ===== TAB 1: Public Identity ===== */}
            <TabsContent value="identity" className="space-y-6">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <Card className="bg-white/50 backdrop-blur border-white/10">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Building2 className="w-5 h-5 text-partner-gold" />
                      Votre Vitrine
                    </CardTitle>
                    <CardDescription className="text-partner-muted">
                      Ces informations seront visibles sur la page partenaires du site
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Company Name */}
                    <FormField
                      control={form.control}
                      name="partner_company_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white">Nom de la structure *</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              className="bg-mp-paper/50 border-white/10 text-white"
                              placeholder="Ex: Ma Super Boutique"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Logo Upload Zone */}
                    <div>
                      <Label className="text-white mb-2 block">Logo</Label>
                      <div className="flex items-center gap-4">
                        <div className="w-20 h-20 rounded-full bg-mp-paper/50 border border-white/10 flex items-center justify-center overflow-hidden">
                          {form.watch("partner_logo_url") ? (
                            <img 
                              src={form.watch("partner_logo_url")} 
                              alt="Logo" 
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Upload className="w-6 h-6 text-partner-muted" />
                          )}
                        </div>
                        <FormField
                          control={form.control}
                          name="partner_logo_url"
                          render={({ field }) => (
                            <FormItem className="flex-1">
                              <FormControl>
                                <Input 
                                  {...field} 
                                  className="bg-mp-paper/50 border-white/10 text-white"
                                  placeholder="URL du logo (Cloudinary, etc.)"
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    {/* Category & Subcategory */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="partner_category"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-white">Catégorie *</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger className="bg-mp-paper/50 border-white/10 text-white">
                                  <SelectValue placeholder="Sélectionner" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {partnerCategories.map(cat => (
                                  <SelectItem key={cat.value} value={cat.value}>
                                    {cat.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="partner_subcategory"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-white">Sous-catégorie</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                className="bg-mp-paper/50 border-white/10 text-white"
                                placeholder="Ex: Librairie manga"
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Description */}
                    <FormField
                      control={form.control}
                      name="partner_description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white">Description de l'activité *</FormLabel>
                          <FormControl>
                            <Textarea 
                              {...field} 
                              className="bg-mp-paper/50 border-white/10 text-white min-h-[100px]"
                              placeholder="Décrivez votre activité en quelques phrases..."
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Social Links */}
                    <div className="space-y-4">
                      <Label className="text-white">Réseaux & Web</Label>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <FormField
                          control={form.control}
                          name="partner_website"
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <div className="relative">
                                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-partner-muted" />
                                  <Input 
                                    {...field} 
                                    className="bg-mp-paper/50 border-white/10 text-white pl-10"
                                    placeholder="Site internet"
                                  />
                                </div>
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="partner_facebook"
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <div className="relative">
                                  <Facebook className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-partner-muted" />
                                  <Input 
                                    {...field} 
                                    className="bg-mp-paper/50 border-white/10 text-white pl-10"
                                    placeholder="Facebook"
                                  />
                                </div>
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="partner_instagram"
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <div className="relative">
                                  <Instagram className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-partner-muted" />
                                  <Input 
                                    {...field} 
                                    className="bg-mp-paper/50 border-white/10 text-white pl-10"
                                    placeholder="Instagram"
                                  />
                                </div>
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    {/* Cover Image */}
                    <FormField
                      control={form.control}
                      name="partner_cover_url"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white">Image de couverture</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              className="bg-mp-paper/50 border-white/10 text-white"
                              placeholder="URL de l'image de couverture"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>

            {/* ===== TAB 2: Legal Information ===== */}
            <TabsContent value="legal" className="space-y-6">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <Card className="bg-white/50 backdrop-blur border-white/10">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <FileText className="w-5 h-5 text-partner-gold" />
                      Informations Juridiques
                    </CardTitle>
                    <CardDescription className="text-partner-muted">
                      Données nécessaires pour l'établissement de la convention
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* SIRET & Legal Form */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="partner_siret"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-white">Numéro SIRET</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                className="bg-mp-paper/50 border-white/10 text-white"
                                placeholder="14 chiffres"
                                maxLength={14}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="partner_legal_form"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-white">Forme juridique *</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger className="bg-mp-paper/50 border-white/10 text-white">
                                  <SelectValue placeholder="Sélectionner" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {legalForms.map(form => (
                                  <SelectItem key={form.value} value={form.value}>
                                    {form.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Address */}
                    <div className="space-y-4">
                      <Label className="text-white">Adresse du siège</Label>
                      <FormField
                        control={form.control}
                        name="partner_address"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input 
                                {...field} 
                                className="bg-mp-paper/50 border-white/10 text-white"
                                placeholder="Adresse complète"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="partner_postal_code"
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input 
                                  {...field} 
                                  className="bg-mp-paper/50 border-white/10 text-white"
                                  placeholder="Code postal"
                                  maxLength={5}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="partner_city"
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input 
                                  {...field} 
                                  className="bg-mp-paper/50 border-white/10 text-white"
                                  placeholder="Ville"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    {/* Representative */}
                    <div className="space-y-4">
                      <Label className="text-white">Représentant légal</Label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="partner_representative_name"
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input 
                                  {...field} 
                                  className="bg-mp-paper/50 border-white/10 text-white"
                                  placeholder="Nom & Prénom du signataire"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="partner_representative_function"
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input 
                                  {...field} 
                                  className="bg-mp-paper/50 border-white/10 text-white"
                                  placeholder="Fonction (Président, Gérant...)"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    {/* Admin Contact */}
                    <FormField
                      control={form.control}
                      name="partner_admin_email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white">Email du dirigeant *</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              type="email"
                              className="bg-mp-paper/50 border-white/10 text-white"
                              placeholder="Pour l'envoi de la convention"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>

            {/* ===== TAB 3: Counterparts ===== */}
            <TabsContent value="counterparts" className="space-y-6">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                {/* Counter */}
                <Card className="bg-gradient-to-r from-partner-gold/10 to-cyan-500/10 border-partner-gold/30">
                  <CardContent className="py-4">
                    <div className="flex items-center justify-between">
                      <span className="text-white font-medium">Contreparties sélectionnées</span>
                      <div className="flex gap-4">
                        <Badge variant="outline" className="border-partner-gold text-partner-gold">
                          {selectedOffers.length} offres
                        </Badge>
                        <Badge variant="outline" className="border-cyan-400 text-cyan-400">
                          {selectedRequests.length} demandes
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Column A: What Partner Offers */}
                  <Card className="bg-white/50 backdrop-blur border-white/10">
                    <CardHeader>
                      <CardTitle className="text-white text-lg">
                        Ce que VOUS apportez
                      </CardTitle>
                      <CardDescription className="text-partner-muted">
                        Sélectionnez ce que vous proposez à Manga Paradise
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {Object.entries(offersGrouped).map(([category, items]) => (
                        <div key={category}>
                          <p className="text-sm font-medium text-partner-gold mb-2">
                            {items[0].emoji} {category}
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {items.map(item => (
                              <button
                                key={item.id}
                                type="button"
                                onClick={() => toggleOffer(item.id)}
                                className={cn(
                                  "px-3 py-1.5 rounded-full text-sm font-medium transition-all border",
                                  selectedOffers.includes(item.id)
                                    ? "bg-partner-gold text-partner-bg border-partner-gold shadow-lg shadow-partner-gold/30"
                                    : "bg-mp-paper/50 text-partner-muted border-white/10 hover:border-white/20"
                                )}
                              >
                                {selectedOffers.includes(item.id) && (
                                  <Check className="w-3 h-3 inline mr-1" />
                                )}
                                {item.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>

                  {/* Column B: What Association Offers */}
                  <Card className="bg-white/50 backdrop-blur border-white/10">
                    <CardHeader>
                      <CardTitle className="text-white text-lg">
                        Ce que MANGA PARADISE vous offre
                      </CardTitle>
                      <CardDescription className="text-partner-muted">
                        Sélectionnez les contreparties souhaitées
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {Object.entries(requestsGrouped).map(([category, items]) => (
                        <div key={category}>
                          <p className="text-sm font-medium text-cyan-400 mb-2">
                            {items[0].emoji} {category}
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {items.map(item => (
                              <button
                                key={item.id}
                                type="button"
                                onClick={() => toggleRequest(item.id)}
                                className={cn(
                                  "px-3 py-1.5 rounded-full text-sm font-medium transition-all border",
                                  selectedRequests.includes(item.id)
                                    ? "bg-cyan-500 text-partner-bg border-cyan-500 shadow-lg shadow-cyan-500/30"
                                    : "bg-mp-paper/50 text-partner-muted border-white/10 hover:border-white/20"
                                )}
                              >
                                {selectedRequests.includes(item.id) && (
                                  <Check className="w-3 h-3 inline mr-1" />
                                )}
                                {item.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </div>
              </motion.div>
            </TabsContent>
          </Tabs>

          {/* Fixed Save Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="sticky bottom-4 z-50"
          >
            <Card className="bg-mp-paper/95 backdrop-blur border-partner-gold/30">
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-partner-muted">
                    Toutes les modifications sont sauvegardées pour votre convention
                  </p>
                  <Button 
                    type="submit" 
                    disabled={isSaving}
                    className="bg-gradient-to-r from-partner-gold to-amber-600 text-partner-bg hover:opacity-90"
                  >
                    {isSaving ? (
                      <>
                        <div className="w-4 h-4 border-2 border-partner-bg border-t-transparent rounded-full animate-spin mr-2" />
                        Enregistrement...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Enregistrer les modifications
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </form>
      </Form>
    </div>
  );
};

export default PartnerSettings;
