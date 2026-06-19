import { useOutletContext } from "react-router-dom";
import { MessageSquare, Construction } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { ProPartner, ProPartnerRole } from "@/hooks/useProPartner";

interface ProPartnerContext {
  partner: ProPartner | undefined;
  role: ProPartnerRole | undefined;
}

const ProDemandes = () => {
  const { partner } = useOutletContext<ProPartnerContext>();

  if (!partner) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-display text-slate-50 flex items-center gap-3">
          <MessageSquare className="h-7 w-7 text-cyan-400" />
          Demandes & Messages
        </h1>
        <p className="text-mp-ink-muted mt-1">
          Échangez avec l'équipe Manga Paradise
        </p>
      </div>

      {/* Placeholder */}
      <Card className="bg-mp-paper/80 border-mp-border/50">
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <Construction className="w-12 h-12 text-mp-ink-muted mb-4" />
          <h3 className="text-lg font-display text-slate-50 mb-2">
            Module en cours de développement
          </h3>
          <p className="text-sm text-mp-ink-muted max-w-md">
            La messagerie partenaire sera bientôt disponible.
            En attendant, contactez-nous par email à{" "}
            <a
              href="mailto:partenaires@mangaparadise.fr"
              className="text-cyan-400 hover:underline"
            >
              partenaires@mangaparadise.fr
            </a>
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProDemandes;
