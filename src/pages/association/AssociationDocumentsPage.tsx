import { useOutletContext } from "react-router-dom";
import { FileText } from "lucide-react";
import type { Association, AssociationRole } from "@/hooks/useAssociation";

interface AssociationContext {
  association: Association | undefined;
  role: AssociationRole | undefined;
}

const AssociationDocumentsPage = () => {
  const { association } = useOutletContext<AssociationContext>();

  if (!association) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display text-foreground">Documents</h1>
        <p className="text-muted-foreground mt-1">
          Suivi documentaire de {association.name}
        </p>
      </div>

      <div className="flex flex-col items-center justify-center py-20 text-center">
        <FileText className="w-16 h-16 text-muted-foreground/30 mb-4" />
        <h2 className="text-xl font-display text-foreground mb-2">
          File de validation
        </h2>
        <p className="text-muted-foreground max-w-md">
          Créer, soumettre et valider des documents associatifs.
          Workflow : brouillon, en attente, approuvé/refusé, archivé.
        </p>
      </div>
    </div>
  );
};

export default AssociationDocumentsPage;
