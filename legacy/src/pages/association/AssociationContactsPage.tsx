import { useOutletContext } from "react-router-dom";
import { BookUser } from "lucide-react";
import type { Association, AssociationRole } from "@/hooks/useAssociation";

interface AssociationContext {
  association: Association | undefined;
  role: AssociationRole | undefined;
}

const AssociationContactsPage = () => {
  const { association } = useOutletContext<AssociationContext>();

  if (!association) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display text-foreground">
          Annuaire CRM
        </h1>
        <p className="text-muted-foreground mt-1">
          Contacts et partenaires de {association.name}
        </p>
      </div>

      <div className="flex flex-col items-center justify-center py-20 text-center">
        <BookUser className="w-16 h-16 text-muted-foreground/30 mb-4" />
        <h2 className="text-xl font-display text-foreground mb-2">
          Mini CRM Associatif
        </h2>
        <p className="text-muted-foreground max-w-md">
          Gérer les contacts externes : partenaires, fournisseurs,
          institutions, médias, sponsors et intervenants.
        </p>
      </div>
    </div>
  );
};

export default AssociationContactsPage;
