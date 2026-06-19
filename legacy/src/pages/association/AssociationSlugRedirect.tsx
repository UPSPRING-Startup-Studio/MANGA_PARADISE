import { useParams, Navigate } from "react-router-dom";
import { Loader2, Building2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAssociationBySlug } from "@/hooks/useAssociation";

/**
 * Route /asso/:slug — Redirige vers le back-office /association
 * si l'utilisateur est membre de cette association.
 * Sert de point d'entrée public-facing partageable.
 */
const AssociationSlugRedirect = () => {
  const { slug } = useParams<{ slug: string }>();
  const { data: association, isLoading, error } = useAssociationBySlug(slug);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0D0D0D]">
        <div className="text-center space-y-4">
          <Loader2 className="w-10 h-10 animate-spin text-[#E84A2B] mx-auto" />
          <p className="text-mp-ink-muted">Chargement de l'association...</p>
        </div>
      </div>
    );
  }

  if (!association || error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0D0D0D]">
        <div className="text-center space-y-6 max-w-md">
          <div className="w-20 h-20 rounded-full bg-white flex items-center justify-center mx-auto">
            <Building2 className="w-10 h-10 text-mp-ink-muted" />
          </div>
          <h1 className="text-2xl font-display text-slate-50">
            Association introuvable
          </h1>
          <p className="text-mp-ink-muted">
            L'association "{slug}" n'existe pas ou n'est plus active.
          </p>
          <Button
            onClick={() => window.history.back()}
            variant="outline"
            className="border-slate-600 text-slate-200"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour
          </Button>
        </div>
      </div>
    );
  }

  // Association trouvée → rediriger vers le back-office
  return <Navigate to="/association/dashboard" replace />;
};

export default AssociationSlugRedirect;
