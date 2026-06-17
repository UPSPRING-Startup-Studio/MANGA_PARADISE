import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Briefcase,
  ArrowLeft,
  Send,
  Loader2,
  CheckCircle2,
  Building2,
  Mail,
  Phone,
  Globe,
  Instagram,
  Facebook,
  Twitter,
  Linkedin,
  User,
  FileText,
  MessageSquare,
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
  FormDescription,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSubmitPartnerApplication } from "@/hooks/useAdminProPartners";
import { PRO_PARTNER_TYPE_LABELS } from "@/hooks/useProPartner";

const INPUT_CLASS =
  "bg-white border-slate-600 text-slate-50 placeholder:text-mp-ink-muted focus-visible:border-cyan-400 focus-visible:ring-1 focus-visible:ring-cyan-400/40";

const applicationSchema = z.object({
  company_name: z.string().min(2, "Nom de la structure requis"),
  company_type: z.string().min(1, "Type requis"),
  siret: z.string().optional(),
  description: z.string().optional(),
  contact_first_name: z.string().min(1, "Prénom requis"),
  contact_last_name: z.string().min(1, "Nom requis"),
  contact_email: z.string().email("Email professionnel invalide"),
  contact_phone: z.string().optional(),
  website_url: z.string().url("URL invalide").optional().or(z.literal("")),
  social_instagram: z.string().optional(),
  social_facebook: z.string().optional(),
  social_twitter: z.string().optional(),
  social_linkedin: z.string().optional(),
  message: z.string().optional(),
});

type ApplicationForm = z.infer<typeof applicationSchema>;

const DevenirPartenaire = () => {
  const navigate = useNavigate();
  const [submitted, setSubmitted] = useState(false);
  const submitApplication = useSubmitPartnerApplication();

  const form = useForm<ApplicationForm>({
    resolver: zodResolver(applicationSchema),
    defaultValues: {
      company_name: "",
      company_type: "societe",
      siret: "",
      description: "",
      contact_first_name: "",
      contact_last_name: "",
      contact_email: "",
      contact_phone: "",
      website_url: "",
      social_instagram: "",
      social_facebook: "",
      social_twitter: "",
      social_linkedin: "",
      message: "",
    },
  });

  const handleSubmit = (data: ApplicationForm) => {
    const {
      social_instagram,
      social_facebook,
      social_twitter,
      social_linkedin,
      ...rest
    } = data;

    submitApplication.mutate(
      {
        ...rest,
        social_links: {
          instagram: social_instagram || "",
          facebook: social_facebook || "",
          twitter: social_twitter || "",
          linkedin: social_linkedin || "",
        },
      },
      {
        onSuccess: () => setSubmitted(true),
      }
    );
  };

  // ── Confirmation post-envoi ──
  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full bg-mp-paper/80 border-mp-border/50">
          <CardContent className="flex flex-col items-center text-center py-12 px-6">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mb-6">
              <CheckCircle2 className="w-8 h-8 text-emerald-400" />
            </div>
            <h2 className="text-2xl font-display text-slate-50 mb-3">
              Demande envoyée !
            </h2>
            <p className="text-mp-ink-muted mb-6">
              Votre demande de partenariat a bien été enregistrée.
              Notre équipe va l'examiner et vous recontactera dans les plus brefs
              délais à l'adresse email indiquée.
            </p>
            <Button
              onClick={() => navigate("/")}
              variant="outline"
              className="border-slate-600 text-slate-200 hover:bg-white"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour à l'accueil
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 sticky top-0 z-40">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link
            to="/"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour au site
          </Link>
          <div className="flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-cyan-400" />
            <span className="text-sm font-medium text-slate-50">Espace Pro</span>
          </div>
        </div>
      </header>

      {/* Form */}
      <div className="max-w-3xl mx-auto px-4 py-10">
        {/* Hero */}
        <div className="mb-8">
          <h1 className="text-3xl font-display text-slate-50 mb-3">
            Devenir Partenaire
          </h1>
          <p className="text-mp-ink-muted text-lg">
            Rejoignez le réseau de partenaires Manga Paradise et bénéficiez
            d'une visibilité auprès de notre communauté passionnée de culture
            japonaise.
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Informations structure */}
            <Card className="bg-mp-paper/80 border-mp-border/50">
              <CardHeader>
                <CardTitle className="text-slate-50 text-base flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-cyan-400" />
                  Votre structure
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="company_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-200">Nom de la structure *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Ex: Boutique Sakura" className={INPUT_CLASS} />
                      </FormControl>
                      <FormMessage className="text-amber-400" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="company_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-200">Type de structure *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className={INPUT_CLASS}>
                            <SelectValue placeholder="Sélectionnez..." />
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
                      <FormMessage className="text-amber-400" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="siret"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-200">SIRET</FormLabel>
                      <FormDescription className="text-mp-ink-muted text-xs">
                        Optionnel mais recommandé pour accélérer la validation
                      </FormDescription>
                      <FormControl>
                        <Input {...field} placeholder="123 456 789 00001" className={INPUT_CLASS} />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-200">Présentation</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="Décrivez votre activité et votre lien avec la culture japonaise..."
                          className={`${INPUT_CLASS} resize-none`}
                          rows={4}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Contact */}
            <Card className="bg-mp-paper/80 border-mp-border/50">
              <CardHeader>
                <CardTitle className="text-slate-50 text-base flex items-center gap-2">
                  <User className="w-4 h-4 text-cyan-400" />
                  Personne de contact
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="contact_first_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-200">Prénom *</FormLabel>
                        <FormControl>
                          <Input {...field} className={INPUT_CLASS} />
                        </FormControl>
                        <FormMessage className="text-amber-400" />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="contact_last_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-200">Nom *</FormLabel>
                        <FormControl>
                          <Input {...field} className={INPUT_CLASS} />
                        </FormControl>
                        <FormMessage className="text-amber-400" />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="contact_email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-200 flex items-center gap-1">
                        <Mail className="w-3 h-3" /> Email professionnel *
                      </FormLabel>
                      <FormControl>
                        <Input {...field} type="email" placeholder="contact@votre-societe.fr" className={INPUT_CLASS} />
                      </FormControl>
                      <FormMessage className="text-amber-400" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="contact_phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-200 flex items-center gap-1">
                        <Phone className="w-3 h-3" /> Téléphone
                      </FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="06 12 34 56 78" className={INPUT_CLASS} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Web & Réseaux */}
            <Card className="bg-mp-paper/80 border-mp-border/50">
              <CardHeader>
                <CardTitle className="text-slate-50 text-base flex items-center gap-2">
                  <Globe className="w-4 h-4 text-cyan-400" />
                  Présence en ligne
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="website_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-200">Site web</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="https://..." className={INPUT_CLASS} />
                      </FormControl>
                      <FormMessage className="text-amber-400" />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="social_instagram"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-200 flex items-center gap-1">
                          <Instagram className="w-3 h-3" /> Instagram
                        </FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="@votrecompte" className={INPUT_CLASS} />
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
                          <Input {...field} className={INPUT_CLASS} />
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
                          <Input {...field} className={INPUT_CLASS} />
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
                          <Input {...field} className={INPUT_CLASS} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Message libre */}
            <Card className="bg-mp-paper/80 border-mp-border/50">
              <CardHeader>
                <CardTitle className="text-slate-50 text-base flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-cyan-400" />
                  Message
                </CardTitle>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="message"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-200">
                        Quelque chose à ajouter ?
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="Motivations, projets de collaboration, questions..."
                          className={`${INPUT_CLASS} resize-none`}
                          rows={4}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Submit */}
            <div className="flex flex-col sm:flex-row gap-3 justify-end pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(-1)}
                className="border-slate-600 text-slate-200 hover:bg-white"
              >
                Annuler
              </Button>
              <Button
                type="submit"
                disabled={submitApplication.isPending}
                className="gap-2 bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-slate-900 font-semibold"
              >
                {submitApplication.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                Envoyer ma demande
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
};

export default DevenirPartenaire;
