import { useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import {
  CheckCircle2,
  ExternalLink,
  ArrowLeft,
  Clock,
  FileText,
  Copy,
  Loader2,
  AlertCircle,
  FileX2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import ProgressHeader from "@/components/membership-form/ProgressHeader";
import FormStepLayout from "@/components/membership-form/FormStepLayout";
import FormFieldRenderer from "@/components/membership-form/FormFieldRenderer";
import { useMembershipForm } from "@/hooks/useMembershipForm";
import { usePublishedMembershipFormBySlug } from "@/hooks/useMembershipFormDefinitions";
import { useAssociationBySlug } from "@/hooks/useAssociation";
import { parseFormDefinition } from "@/lib/membership-form/loadPublishedForm";
import { submitMembershipForm } from "@/lib/membership-form/submitMembershipForm";
import { useAuth } from "@/contexts/AuthContext";
import type { FormField, FormDefinition } from "@/types/membershipForm";

// Fallback static definition (only used if DB not yet seeded)
import { mangaParadise2025 } from "@/components/membership-form/definitions/mangaParadise2025";

const MembershipFormPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submissionRef, setSubmissionRef] = useState<string | null>(null);

  // ── Load association ──
  const { data: association, isLoading: assoLoading } = useAssociationBySlug(slug);

  // ── Load published form definition from DB ──
  const { data: formDefRecord, isLoading: formLoading } =
    usePublishedMembershipFormBySlug(slug);

  // ── Parse the definition ──
  const definition: FormDefinition | null = useMemo(() => {
    if (formDefRecord && association) {
      try {
        return parseFormDefinition(formDefRecord, association.id);
      } catch (e) {
        return null;
      }
    }
    // Fallback: if no DB record but association exists (DB not yet seeded)
    if (association && !formLoading && !formDefRecord) {
      return {
        ...mangaParadise2025,
        associationId: association.id,
      };
    }
    return null;
  }, [formDefRecord, association, formLoading]);

  // ── Preview mode (query param ?preview=true) ──
  const isPreview = new URLSearchParams(window.location.search).get("preview") === "true";

  const isLoading = assoLoading || formLoading;

  // ── Loading state ──
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="flex items-center justify-center pt-32">
          <div className="text-center space-y-4">
            <Loader2 className="w-10 h-10 animate-spin text-sakura mx-auto" />
            <p className="text-muted-foreground">
              Chargement du formulaire d'adhesion...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ── No association ──
  if (!association) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="container mx-auto px-4 py-8 pt-24 max-w-2xl">
          <Card className="bg-card/50 border-border/50">
            <CardContent className="p-8 text-center space-y-4">
              <AlertCircle className="w-12 h-12 text-muted-foreground/30 mx-auto" />
              <h1 className="text-xl font-display text-foreground">
                Association introuvable
              </h1>
              <p className="text-muted-foreground text-sm">
                L'association "{slug}" n'existe pas ou n'est plus active.
              </p>
              <Link to="/">
                <Button variant="outline" className="gap-2">
                  <ArrowLeft className="w-4 h-4" />
                  Retour
                </Button>
              </Link>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  // ── No published form ──
  if (!definition) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="container mx-auto px-4 py-8 pt-24 max-w-2xl">
          <Card className="bg-card/50 border-border/50">
            <CardContent className="p-8 text-center space-y-4">
              <FileX2 className="w-12 h-12 text-muted-foreground/30 mx-auto" />
              <h1 className="text-xl font-display text-foreground">
                Adhesion non disponible
              </h1>
              <p className="text-muted-foreground text-sm">
                L'adhesion n'est pas encore ouverte pour {association.name}.
                Reviens bientot !
              </p>
              <Link to={`/asso/${slug}`}>
                <Button variant="outline" className="gap-2">
                  <ArrowLeft className="w-4 h-4" />
                  Retour a la fiche
                </Button>
              </Link>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <MembershipFormInner
      definition={definition}
      formDefinitionId={formDefRecord?.id || definition.id}
      slug={slug || ""}
      associationName={association.name}
      userId={user?.id}
      isPreview={isPreview}
      submitted={submitted}
      setSubmitted={setSubmitted}
      submitting={submitting}
      setSubmitting={setSubmitting}
      submissionRef={submissionRef}
      setSubmissionRef={setSubmissionRef}
    />
  );
};

// ── Inner component that uses the form engine ──
// Extracted so that `definition` is guaranteed non-null when the hook runs.

interface InnerProps {
  definition: FormDefinition;
  formDefinitionId: string;
  slug: string;
  associationName: string;
  userId?: string;
  isPreview: boolean;
  submitted: boolean;
  setSubmitted: (v: boolean) => void;
  submitting: boolean;
  setSubmitting: (v: boolean) => void;
  submissionRef: string | null;
  setSubmissionRef: (v: string | null) => void;
}

const MembershipFormInner = ({
  definition,
  formDefinitionId,
  slug,
  associationName,
  userId,
  isPreview,
  submitted,
  setSubmitted,
  submitting,
  setSubmitting,
  submissionRef,
  setSubmissionRef,
}: InnerProps) => {
  const form = useMembershipForm(definition);

  const handleNext = async () => {
    if (form.isLastStep) {
      if (isPreview) {
        toast.info("Mode apercu : la soumission n'est pas enregistree.");
        setSubmitted(true);
        return;
      }

      const valid = form.validateCurrentStep();
      if (!valid) {
        toast.error("Corrige les erreurs avant de continuer");
        return;
      }

      setSubmitting(true);
      try {
        const submission = form.buildSubmission();
        // Override formDefinitionId with real DB ID
        submission.formDefinitionId = formDefinitionId;
        submission.associationId = definition.associationId;

        const result = await submitMembershipForm(submission, definition, userId);
        setSubmissionRef(result.publicSlug);
        setSubmitted(true);
        toast.success("Adhesion envoyee avec succes !");
      } catch (err: any) {
        toast.error(err?.message || "Erreur lors de l'envoi.");
      } finally {
        setSubmitting(false);
      }
    } else {
      const ok = form.goNext();
      if (!ok) {
        toast.error("Corrige les erreurs avant de continuer");
      }
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="container mx-auto px-4 py-8 pt-24 max-w-2xl">
          <Card className="bg-card/50 border-border/50">
            <CardContent className="p-8 text-center space-y-6">
              <CheckCircle2 className="w-16 h-16 text-emerald-400 mx-auto" />
              <h1 className="text-2xl font-display text-foreground">
                {isPreview ? "Apercu termine" : "Adhesion envoyee !"}
              </h1>
              <p className="text-muted-foreground max-w-md mx-auto">
                {isPreview
                  ? "C'est un apercu — aucune donnee n'a ete enregistree."
                  : `Ton bulletin d'adhesion a bien ete enregistre. L'equipe de ${associationName} va le traiter.`}
              </p>

              {submissionRef && !isPreview && (
                <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-2">
                  <p className="text-xs text-muted-foreground">Reference de ton dossier</p>
                  <div className="flex items-center justify-center gap-2">
                    <Badge className="text-lg px-4 py-1 font-mono bg-sakura/20 text-sakura">
                      {submissionRef}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => {
                        navigator.clipboard.writeText(submissionRef);
                        toast.success("Reference copiee");
                      }}
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              )}

              {!isPreview && (
                <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4">
                  <p className="text-sm text-muted-foreground">
                    <strong className="text-foreground">Prochaines etapes :</strong>
                    <br />1. L'equipe examine ton dossier
                    <br />2. Tu recevras une confirmation
                    <br />3. Finalise le paiement de ta cotisation
                    <br />4. Bienvenue dans l'aventure !
                  </p>
                </div>
              )}

              <Link to={slug ? `/asso/${slug}` : "/"}>
                <Button variant="outline" className="gap-2">
                  <ArrowLeft className="w-4 h-4" />
                  {isPreview ? "Retour a l'admin" : "Retour a la fiche"}
                </Button>
              </Link>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  const currentStep = form.currentStep;

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="container mx-auto px-4 py-8 pt-24 max-w-2xl space-y-6">
        {/* Preview banner */}
        {isPreview && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 text-center">
            <p className="text-sm text-amber-400 font-medium">
              Mode apercu — les donnees ne seront pas enregistrees
            </p>
          </div>
        )}

        {/* Header */}
        <div className="space-y-2">
          <Link
            to={slug ? `/asso/${slug}` : "/"}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1"
          >
            <ArrowLeft className="w-3 h-3" />
            Retour
          </Link>
          <h1 className="text-2xl md:text-3xl font-display text-foreground">
            {definition.name}
          </h1>

          {form.isFirstStep && (
            <div className="space-y-3 pt-2">
              {definition.estimatedDuration && (
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Duree estimee : {definition.estimatedDuration}
                </p>
              )}
              {definition.links && definition.links.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {definition.links.map((link) => (
                    <a
                      key={link.url}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-turquoise hover:underline inline-flex items-center gap-1"
                    >
                      <FileText className="w-3 h-3" />
                      {link.label}
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <ProgressHeader
          currentStep={form.state.currentStepIndex}
          totalSteps={form.totalVisibleSteps}
          stepTitle={currentStep?.title || ""}
          progressPercent={form.progressPercent}
        />

        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-6">
            <AnimatePresence mode="wait">
              {currentStep && (
                <FormStepLayout
                  key={currentStep.id}
                  description={currentStep.description}
                  onNext={handleNext}
                  onPrev={form.goPrev}
                  isFirst={form.isFirstStep}
                  isLast={form.isLastStep}
                  isSubmitting={submitting}
                >
                  {renderFields(form.visibleFields, form)}
                </FormStepLayout>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  );
};

function renderFields(
  fields: FormField[],
  form: ReturnType<typeof useMembershipForm>
) {
  const elements: React.ReactNode[] = [];
  let i = 0;

  while (i < fields.length) {
    const field = fields[i];

    if (field.gridSpan === 0.5 && i + 1 < fields.length && fields[i + 1].gridSpan === 0.5) {
      const nextField = fields[i + 1];
      elements.push(
        <div key={`row-${field.key}`} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormFieldRenderer field={field} value={form.getValue(field.key)} onChange={(v) => form.setValue(field.key, v)} onBlur={() => form.touchField(field.key)} error={form.getError(field.key)} touched={form.isTouched(field.key)} />
          <FormFieldRenderer field={nextField} value={form.getValue(nextField.key)} onChange={(v) => form.setValue(nextField.key, v)} onBlur={() => form.touchField(nextField.key)} error={form.getError(nextField.key)} touched={form.isTouched(nextField.key)} />
        </div>
      );
      i += 2;
    } else {
      elements.push(
        <FormFieldRenderer key={field.key} field={field} value={form.getValue(field.key)} onChange={(v) => form.setValue(field.key, v)} onBlur={() => form.touchField(field.key)} error={form.getError(field.key)} touched={form.isTouched(field.key)} />
      );
      i += 1;
    }
  }
  return <>{elements}</>;
}

export default MembershipFormPage;
