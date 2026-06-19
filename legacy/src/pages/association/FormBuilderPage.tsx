import { useParams, useOutletContext } from "react-router-dom";
import { ShieldAlert } from "lucide-react";
import { useMembershipFormBuilder } from "@/hooks/useMembershipFormBuilder";
import { useAssociationGovernance } from "@/hooks/useAssociationGovernance";
import FormBuilderShell from "@/components/membership-form/builder/FormBuilderShell";
import type { Association, AssociationRole } from "@/hooks/useAssociation";

interface AssociationContext {
  association: Association | undefined;
  role: AssociationRole | undefined;
}

const FormBuilderPage = () => {
  const { formId } = useParams<{ formId: string }>();
  const { association } = useOutletContext<AssociationContext>();
  const gov = useAssociationGovernance();
  const builder = useMembershipFormBuilder(formId);

  const previewUrl = association?.slug
    ? `/asso/${association.slug}/adhesion?preview=true`
    : "#";

  return (
    <div className="flex flex-col h-full">
      {/* Governance banner */}
      {(gov.isBlocked || gov.isRestricted) && (
        <div
          className={`flex items-center gap-3 border-b px-4 py-3 ${
            gov.isBlocked
              ? "border-red-500/30 bg-red-500/[0.06]"
              : "border-amber-500/30 bg-amber-500/[0.06]"
          }`}
        >
          <ShieldAlert
            className={`w-5 h-5 shrink-0 ${
              gov.isBlocked ? "text-red-400" : "text-amber-400"
            }`}
          />
          <p
            className={`text-sm ${
              gov.isBlocked ? "text-red-200/80" : "text-amber-200/80"
            }`}
          >
            {gov.readOnlyReason || gov.restrictedReason}
          </p>
        </div>
      )}
      <FormBuilderShell
        builder={builder}
        previewUrl={previewUrl}
        readOnly={!gov.canManageForms}
      />
    </div>
  );
};

export default FormBuilderPage;
