import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Building2,
  Globe,
  Mail,
  Phone,
  MapPin,
  Save,
  Loader2,
  Instagram,
  Facebook,
  Twitter,
  Linkedin,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import type { ProPartner, ProPartnerRole } from "@/hooks/useProPartner";
import { useUpdateProPartner, ADMIN_ROLES, PRO_PARTNER_TYPE_LABELS } from "@/hooks/useProPartner";

interface ProPartnerContext {
  partner: ProPartner | undefined;
  role: ProPartnerRole | undefined;
}

const INPUT_CLASS =
  "bg-white border-slate-600 text-slate-50 placeholder:text-mp-ink-muted focus-visible:border-cyan-400 focus-visible:ring-1 focus-visible:ring-cyan-400/40";

const structureSchema = z.object({
  name: z.string().min(2, "Nom requis"),
  type: z.string(),
  description: z.string().optional(),
  description_long: z.string().optional(),
  siret: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  postal_code: z.string().optional(),
  region: z.string().optional(),
  email: z.string().email("Email invalide").optional().or(z.literal("")),
  phone: z.string().optional(),
  website_url: z.string().url("URL invalide").optional().or(z.literal("")),
  logo_url: z.string().optional(),
  banner_url: z.string().optional(),
  social_instagram: z.string().optional(),
  social_facebook: z.string().optional(),
  social_twitter: z.string().optional(),
  social_linkedin: z.string().optional(),
});

type StructureForm = z.infer<typeof structureSchema>;

const ProStructure = () => {
  const { partner, role } = useOutletContext<ProPartnerContext>();
  const canEdit = role ? ADMIN_ROLES.includes(role) : false;
  const updatePartner = useUpdateProPartner();

  const socialLinks = (partner?.social_links || {}) as Record<string, string>;

  const form = useForm<StructureForm>({
    resolver: zodResolver(structureSchema),
    defaultValues: {
      name: partner?.name || "",
      type: partner?.type || "societe",
      description: partner?.description || "",
      description_long: partner?.description_long || "",
      siret: partner?.siret || "",
      address: partner?.address || "",
      city: partner?.city || "",
      postal_code: partner?.postal_code || "",
      region: partner?.region || "",
      email: partner?.email || "",
      phone: partner?.phone || "",
      website_url: partner?.website_url || "",
      logo_url: partner?.logo_url || "",
      banner_url: partner?.banner_url || "",
      social_instagram: socialLinks.instagram || "",
      social_facebook: socialLinks.facebook || "",
      social_twitter: socialLinks.twitter || "",
      social_linkedin: socialLinks.linkedin || "",
    },
  });

  const handleSubmit = (data: StructureForm) => {
    if (!partner) return;

    const {
      social_instagram,
      social_facebook,
      social_twitter,
      social_linkedin,
      ...rest
    } = data;

    updatePartner.mutate({
      id: partner.id,
      data: {
        ...rest,
        social_links: {
          instagram: social_instagram || "",
          facebook: social_facebook || "",
          twitter: social_twitter || "",
          linkedin: social_linkedin || "",
        },
      },
    });
  };

  if (!partner) return null;

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-display text-slate-50 flex items-center gap-3">
          <Building2 className="h-7 w-7 text-cyan-400" />
          Ma structure
        </h1>
        <p className="text-mp-ink-muted mt-1">
          Gérez les informations de votre fiche partenaire
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          {/* Identité */}
          <Card className="bg-mp-paper/80 border-mp-border/50">
            <CardHeader>
              <CardTitle className="text-slate-50 text-base">Identité</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-200">Nom de la structure *</FormLabel>
                    <FormControl>
                      <Input {...field} className={INPUT_CLASS} disabled={!canEdit} />
                    </FormControl>
                    <FormMessage className="text-amber-400" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-200">Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value} disabled={!canEdit}>
                      <FormControl>
                        <SelectTrigger className={INPUT_CLASS}>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(PRO_PARTNER_TYPE_LABELS).map(([key, label]) => (
                          <SelectItem key={key} value={key}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="siret"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-200">SIRET</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="123 456 789 00001" className={INPUT_CLASS} disabled={!canEdit} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-200">Description courte</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Décrivez votre structure en quelques lignes..."
                        className={`${INPUT_CLASS} resize-none`}
                        rows={3}
                        disabled={!canEdit}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description_long"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-200">Présentation détaillée</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Présentation complète de votre activité, vos valeurs, votre histoire..."
                        className={`${INPUT_CLASS} resize-none`}
                        rows={6}
                        disabled={!canEdit}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Visuels */}
          <Card className="bg-mp-paper/80 border-mp-border/50">
            <CardHeader>
              <CardTitle className="text-slate-50 text-base">Visuels</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="logo_url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-200">URL du logo</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="https://..." className={INPUT_CLASS} disabled={!canEdit} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="banner_url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-200">URL de la bannière</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="https://..." className={INPUT_CLASS} disabled={!canEdit} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Coordonnées */}
          <Card className="bg-mp-paper/80 border-mp-border/50">
            <CardHeader>
              <CardTitle className="text-slate-50 text-base flex items-center gap-2">
                <MapPin className="w-4 h-4 text-cyan-400" />
                Coordonnées
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-200">Adresse</FormLabel>
                    <FormControl>
                      <Input {...field} className={INPUT_CLASS} disabled={!canEdit} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="postal_code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-200">Code postal</FormLabel>
                      <FormControl>
                        <Input {...field} className={INPUT_CLASS} disabled={!canEdit} />
                      </FormControl>
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
                        <Input {...field} className={INPUT_CLASS} disabled={!canEdit} />
                      </FormControl>
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
                        <Input {...field} className={INPUT_CLASS} disabled={!canEdit} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-200 flex items-center gap-1">
                        <Mail className="w-3 h-3" /> Email
                      </FormLabel>
                      <FormControl>
                        <Input {...field} type="email" className={INPUT_CLASS} disabled={!canEdit} />
                      </FormControl>
                      <FormMessage className="text-amber-400" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-200 flex items-center gap-1">
                        <Phone className="w-3 h-3" /> Téléphone
                      </FormLabel>
                      <FormControl>
                        <Input {...field} className={INPUT_CLASS} disabled={!canEdit} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="website_url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-200 flex items-center gap-1">
                      <Globe className="w-3 h-3" /> Site web
                    </FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="https://..." className={INPUT_CLASS} disabled={!canEdit} />
                    </FormControl>
                    <FormMessage className="text-amber-400" />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Réseaux sociaux */}
          <Card className="bg-mp-paper/80 border-mp-border/50">
            <CardHeader>
              <CardTitle className="text-slate-50 text-base flex items-center gap-2">
                <ExternalLink className="w-4 h-4 text-cyan-400" />
                Réseaux sociaux
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="social_instagram"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-200 flex items-center gap-1">
                      <Instagram className="w-3 h-3" /> Instagram
                    </FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="https://instagram.com/..." className={INPUT_CLASS} disabled={!canEdit} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="social_facebook"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-200 flex items-center gap-1">
                      <Facebook className="w-3 h-3" /> Facebook
                    </FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="https://facebook.com/..." className={INPUT_CLASS} disabled={!canEdit} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="social_twitter"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-200 flex items-center gap-1">
                      <Twitter className="w-3 h-3" /> X (Twitter)
                    </FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="https://x.com/..." className={INPUT_CLASS} disabled={!canEdit} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="social_linkedin"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-200 flex items-center gap-1">
                      <Linkedin className="w-3 h-3" /> LinkedIn
                    </FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="https://linkedin.com/company/..." className={INPUT_CLASS} disabled={!canEdit} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Save */}
          {canEdit && (
            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={updatePartner.isPending}
                className="gap-2 bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-slate-900 font-semibold"
              >
                {updatePartner.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Enregistrer
              </Button>
            </div>
          )}
        </form>
      </Form>
    </div>
  );
};

export default ProStructure;
